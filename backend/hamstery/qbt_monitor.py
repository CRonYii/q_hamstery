import logging
import traceback
from typing import Any, Callable

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

from hamstery.hamstery_settings import settings_manager
from hamstery.models.download import Download
from hamstery.qbittorrent import *
from hamstery.utils import (Result, failure, success)
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
        process_downloads()


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
                logger.error('Error occured when running qbt task "%s" when in "%s":'
                             % (task['name'], tag))
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


def handle_fetching_task(task):
    try:
        dl: Download = Download.objects.get(pk=task['hash'])
    except (Download.DoesNotExist):
        return failure('Cannot find download in DB')

    files = qbt.client.torrents_files(dl.hash)
    if len(files) == 0:
        # skip this time, torrents need some time to fecth content...
        return success(None)

    dl.fetch_files(task, files)

    return success('"%s" Download scheduled' % task['name'])


def handle_completed_task(task):
    try:
        dl: Download = Download.objects.get(pk=task['hash'])
    except (Download.DoesNotExist):
        return failure('Cannot find download in DB')

    dl.complete(task)

    return success('Organize download')


process_downloads = task_handler(error_tag=ERROR_DOWNLOAD_TAG, finish_tag=ORGANIZED_DOWNLOAD_TAG, tasks=[
    {
        'tag': FETCHING_DOWNLOAD_TAG,
        'handler': handle_fetching_task,
    },
    {
        'tag': DOWNLOADING_DOWNLOAD_TAG,
        'handler': handle_completed_task,
        'status': 'completed'
    },
])

if __name__ == '__main__':
    start()
