import logging
import os
import traceback
from typing import List
from typing import Any, Callable

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

from hamstery.hamstery_settings import settings_manager
from hamstery.models.download import Download, MonitoredTvDownload, TvDownload
from hamstery.models.library import TvEpisode
from hamstery.models.show_subscription import ShowSubscription
from hamstery.qbittorrent import *
from hamstery.utils import (Result, failure, is_supplemental_file_extension,
                            is_video_extension, success)
from hamstery import utils

logger = logging.getLogger(__name__)

scheduler = BlockingScheduler(timezone=str(utils.tz))


def schedule_qbittorrent_job():
    qbt.auto_test = True
    qbt.test_connection()
    scheduler.add_job(qbittorrent_monitor_step,
                      trigger=IntervalTrigger(seconds=1),
                      id="qbt_monitor",
                      max_instances=1,
                      )
    logger.info("Started qbittorrent monitor")
    return True


def start():
    if schedule_qbittorrent_job():
        scheduler.start()


def qbittorrent_monitor_step():
    # django signals does not work outside of application.
    # so, we need to do polling update for settings...
    settings_manager.manual_update()
    qbt.test_connection()
    if qbt.known_status is True:
        dedicated_episode_downloads()
        organize_downloads()


def task_handler(error_tag, finish_tag, tasks):
    def handle_tasks(handler: Callable[[Any], Result], tag, next_tag, status=None):
        tasks = qbt.client.torrents_info(
            status_filter=status, category=HAMSTERY_CATEGORY, tag=tag)
        for task in tasks:
            try:
                r = handler(task)
                if r.success is False:
                    # do not delete files if it's because download cannot be found in DB
                    # This can happen in the event of upgrade bug/reinstallation of hamstery
                    # so DB data is lost but downlaod is still kept in qbittorrent
                    in_db = r.data() != 'Cannot find download in DB'
                    qbt.client.torrents_delete(in_db, task['hash'])
                    if in_db:
                        Download.objects.filter(pk=task['hash']).delete()
                    logger.warning('%s Download "%s" cancelled: %s' %
                                   (tag, task['name'], r.data()))
                else:
                    if r.data() is not None:
                        qbt.client.torrents_remove_tags(tag, task['hash'])
                        qbt.client.torrents_add_tags(next_tag, task['hash'])
                        logger.info('%s: Download "%s" move to next phase: %s' % (
                            tag, task['name'], r.data()))
            except Exception:
                logger.error(traceback.format_exc())
                qbt.client.torrents_remove_tags(tag, task['hash'])
                qbt.client.torrents_add_tags(error_tag, task['hash'])

    def run():
        for i in range(len(tasks) - 1, -1, -1):
            task = tasks[i]

            tag = task['tag']
            if i != len(tasks) - 1:
                next_tag = tasks[i + 1]['tag']
            else:
                next_tag = finish_tag
            status = task['status'] if 'status' in task else None
            handle_tasks(task['handler'], tag, next_tag, status=status)

    return run


### TV Workflows ###
def handle_unscheduled_dedicated_episode_task(task):
    if MONITORED_TV_TAG in task['tags']:
        res = utils.decode_str_to_dict(task['name'], 'episode', 'monitor')
        if not res.success:
            return res
        [ep_id, sub_id] = res.data()
        try:
            sub_id = int(sub_id)
            sub: ShowSubscription = ShowSubscription.objects.get(pk=sub_id)
        except (ShowSubscription.DoesNotExist, ValueError):
            return failure('Cannot find Show Subscription in DB')
    else:
        res = utils.decode_str_to_dict(task['name'], 'episode')
        if not res.success:
            return res
        [ep_id] = res.data()

    try:
        ep_id = int(ep_id)
        episode: TvEpisode = TvEpisode.objects.get(pk=ep_id)
    except (TvEpisode.DoesNotExist, ValueError):
        return failure('Cannot find download in DB')
    filename = episode.get_formatted_filename()

    # There could be cases that a download is deleted in qbt but not in DB. Restart the task.
    query = Download.objects.filter(pk=task['hash'])
    if query.exists():
        query.first().delete()
    download: Download = Download.objects.create(hash=task['hash'])
    download.save()
    if MONITORED_TV_TAG in task['tags']:
        tv_download: MonitoredTvDownload = MonitoredTvDownload.objects.create(
            task=download, episode=episode, subscription=sub)
        logger.info('Subscription started download for %s - %s' %
                    (sub.season.show, episode))
    else:
        tv_download: TvDownload = TvDownload.objects.create(
            task=download, episode=episode)
    tv_download.save()
    qbt.client.torrents_rename(task['hash'], filename)

    return success('"%s" Download scheduled' % filename)


def is_valid_tv_download_file(file, target_file):
    name: str = os.path.basename(file['name'])
    return target_file in name and (is_video_extension(name) or is_supplemental_file_extension(name))


def handle_fetching_dedicated_episode_task(task):
    hash = task['hash']
    query = TvDownload.objects.filter(task__hash=hash)
    if query.count() != 1:
        return failure('Cannot find download in DB')
    download: TvDownload = query.first()
    files = qbt.client.torrents_files(hash)
    if len(files) == 0:
        # skip this time, torrents need some time to fecth content...
        return success(None)
    target_files = list(filter(lambda f: is_video_extension(f['name']), files))
    if len(target_files) == 0:
        return failure('No video file found in download')
    if len(target_files) > 1:
        found = False
        for target_file in target_files:
            if download.get_adjusted_episode_number() == utils.get_episode_number_from_title(target_file['name']):
                filename = target_file['name']
                found = True
                break
        if not found:
            return failure('Failed to locate target video file from a multiple video files torrent for single episode download')
    else:
        filename = target_files[0]['name']

    download.filename = filename
    target_name, _ = os.path.splitext(os.path.basename(filename))
    download.save()
    if len(files) != 1:
        # We only download the video file at this time
        do_not_download_files = list(map(lambda f: f['index'], filter(
            lambda f: not is_valid_tv_download_file(f, target_name), files)))
        if len(do_not_download_files) != 0:
            qbt.client.torrents_file_priority(
                hash, do_not_download_files, priority=0)
    qbt.client.torrents_rename(hash, "%s (%s)" % (task['name'], filename))

    return success('Valid TV download')


def handle_downloading_tv_task(task):
    hash = task['hash']
    monitored_task = MONITORED_TV_TAG in task['tags']
    if monitored_task:
        query = MonitoredTvDownload.objects.filter(
            task__hash=hash)
        if not query.exists():
            return failure('Cannot find download in DB')
        downloads: List[MonitoredTvDownload] = query.all()
    else:
        query = TvDownload.objects.filter(
            task__hash=hash)
        if not query.exists():
            return failure('Cannot find download in DB')
        downloads: List[TvDownload] = query.all()

    dbtask = downloads[0].task
    dbtask.done = True
    dbtask.save()

    # Import all episodes in this download
    for download in downloads:
        episode: TvEpisode = download.episode

        if monitored_task:
            # Cancel all other subscribed downloads with a lower or equal priority
            sub = download.subscription
            other_downloads = MonitoredTvDownload.objects.filter(
                episode=episode)
            for d in other_downloads:
                if d == download:
                    continue
                if d.subscription.priority >= sub.priority:
                    if d.task.done is True:
                        download.episode.remove_episode()  # remove episode will delete download for us
                        download.episode.save()
                    else:
                        d.task.cancel()
            # Episode is still ready after cancelling all monitored downloads,
            # meaning it's downloaded/imported by used in the mean time, cancel self
            if episode.status == episode.Status.READY:
                download.task.cancel()
                return failure('Monitored TV download cancelled due to episode is already downloaded/imported by user mannually')

        src_path = os.path.join(task['save_path'], download.filename)
        if not episode.import_video(src_path, manually=(not monitored_task), mode='link'):
            return failure('Failed to import TV download')
        episode.save()

    return success('TV organized')


dedicated_episode_downloads = task_handler(error_tag=ERROR_TV_TAG, finish_tag=DOWNLOADING_TV_TAG, tasks=[
    {
        'tag': DEDICATED_UNSCHEDULED_TV_TAG,
        'handler': handle_unscheduled_dedicated_episode_task,
    },
    {
        'tag': DEDICATED_FETCHING_TV_TAG,
        'handler': handle_fetching_dedicated_episode_task,
    },
])

organize_downloads = task_handler(error_tag=ERROR_TV_TAG, finish_tag=ORGANIZED_TV_TAG, tasks=[
    {
        'tag': DOWNLOADING_TV_TAG,
        'handler': handle_downloading_tv_task,
        'status': 'completed'
    },
])

if __name__ == '__main__':
    start()
