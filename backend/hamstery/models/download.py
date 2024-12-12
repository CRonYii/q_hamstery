import logging
import heapq
from collections import deque
import os
from polymorphic.models import PolymorphicModel


from django.db import models

from hamstery.models.library import TvEpisode
from hamstery.models.show_subscription import ShowSubscription
from hamstery.qbittorrent import *
from hamstery import utils

logger = logging.getLogger(__name__)

# Create your models here.


class DownloadManager(models.Manager):
    def download(self, magnet=None, torrent=None):
        try:
            if not qbt.known_status:
                return
            info_hash = utils.calculate_info_hash(
                magnet=magnet, torrent=torrent)
            query = self.filter(hash=info_hash)
            if query.exists():
                # Verify if it exists in qbt
                qbt_tasks = qbt.client.torrents_info(
                    torrent_hashes=[info_hash])
                if len(qbt_tasks) != 0:
                    # No need to create task. Return the Download directly
                    return query.first()
            res = qbt.client.torrents_add(
                urls=magnet,
                torrent_files=torrent,
                category=HAMSTERY_CATEGORY,
                tags=[FETCHING_DOWNLOAD_TAG],
                is_paused=False)
            if res != 'Ok.':
                logger.error('Failed to add download to qbt: %s' % res)
                return
            task, created = self.get_or_create(hash=info_hash)
            return task
        except utils.InfoHashException as e:
            logger.error(e)
            return


class Download(models.Model):
    hash = models.CharField(max_length=256, primary_key=True)
    name = models.CharField(max_length=4096, blank=True, default='')
    fetched = models.BooleanField(default=False)
    completed = models.BooleanField(default=False)

    objects: DownloadManager = DownloadManager()

    def fetch_files(self, task, files):
        self.name = task['name']
        self.fetched = True
        self.save()

        self.parse_files(files)
        # At this point, we should have all related downloads created
        # If this download is not in use, we can just remove it.
        if not self.in_use():
            self.cancel()
            return

    def complete(self, task):
        self.completed = True
        self.save()

        self.organize(task)

    def notify_new_downloads(self):
        if self.fetched:
            files = qbt.client.torrents_files(self.hash)
            self.parse_files(files)
        if self.completed:
            [task] = qbt.client.torrents_info(torrent_hashes=[self.hash])
            self.organize(task)

    def parse_files(self, files):
        for epdl in TvDownload.objects.filter(task=self, done=False, error=False, file_index=-1).all():
            try:
                res = epdl.parse_files(files)
            except Exception as e:
                res = utils.failure(e)
            if res.success:
                logger.info('Parsed files TvDownload "%s": %s' %
                            (epdl.filename, res.data()))
            else:
                logger.warning('Cancelled parsing file TvDownload "%s": %s' % (
                    epdl.filename, res.data()))

    def organize(self, task):
        for epdl in TvDownload.objects.filter(task=self, done=False, error=False).all():
            try:
                res = epdl.organize(task)
            except Exception as e:
                res = utils.failure(e)
            if res.success:
                logger.info('Organized TvDownload "%s": %s' %
                            (epdl.filename, res.data()))
            else:
                logger.warning('Cancelled organizing TvDownload "%s": %s' % (
                    epdl.filename, res.data()))

    def in_use(self):
        if TvDownload.objects.filter(task=self).exists():
            return True
        return False

    def cancel_file(self):
        if not self.in_use():
            self.cancel()
            return

    def cancel(self):
        logger.info('Download "%s" is removed' % (self.name))
        qbt.client.torrents_delete(True, self.hash)
        self.delete()


class TvDownload(PolymorphicModel):
    task: Download = models.ForeignKey(
        Download, on_delete=models.CASCADE)
    episode: TvEpisode = models.ForeignKey(
        TvEpisode, related_name='downloads', on_delete=models.CASCADE, parent_link=True)
    file_index = models.IntegerField(default=-1)
    filename = models.CharField(max_length=4096, blank=True, default='')
    done = models.BooleanField(default=False)
    error = models.BooleanField(default=False)

    def map_files_to_episodes(files):
        ep_heap = []
        ep_map = {}
        for file in files:
            if not utils.is_video_extension(file['name']):
                continue
            ep_n = utils.get_episode_number_from_title(file['name'])
            if not ep_n:
                continue
            if ep_n in ep_map:
                # XXX Consider not to download this episode since it has duplicated detection
                continue
            ep_map[ep_n] = {
                'episode': ep_n,
                'index': file['index'],
                'name': file['name']
            }
            heapq.heappush(ep_heap, ep_n)
        order_eps = list()
        while len(ep_heap):
            ep_n = heapq.heappop(ep_heap)
            order_eps.append(ep_map[ep_n])

        return order_eps

    def parse_files(self, files):
        if self.file_index != -1:
            return utils.success('Already fetched file')
        ep_files = TvDownload.map_files_to_episodes(files)
        target_file = None
        for f in ep_files:
            if f['episode'] == self.episode.episode_number:
                target_file = f
                break

        if target_file is None:
            return self.fail('Failed to locate video file for episode %s' % (self.episode.episode_number))

        self.file_index = target_file['index']
        self.filename = target_file['name']
        self.save()

        return utils.success('Parsed files')

    def organize(self, task, manually=False):
        if self.file_index == -1:
            return self.fail('Does not have file fetched')

        episode: TvEpisode = self.episode
        src_path = os.path.join(task['save_path'], self.filename)
        if not episode.import_video(src_path, manually=manually, mode='link'):
            return self.fail('Failed to import TV download')

        self.done = True
        self.save()
        episode.save()

        return utils.success('Successful')

    def cancel(self):
        # we must delete before cancel so that task knows it's not in used anymore
        self.delete()
        self.task.cancel_file()

    def fail(self, msg):
        self.error = True
        self.save()
        return utils.failure(msg)


class MonitoredTvDownload(TvDownload):
    subscription = models.ForeignKey(
        ShowSubscription, related_name='downloads', on_delete=models.DO_NOTHING, parent_link=True)
    auto_matched = models.BooleanField(default=False)

    def parse_files(self, files):
        if self.file_index != -1:
            return utils.success('Already fetched file')
        ep_files = TvDownload.map_files_to_episodes(files)
        continuous = True
        last_ep = -1
        target_file = None
        for f in ep_files:
            if f['episode'] == self.subscription.offset + self.episode.episode_number:
                target_file = f
            if last_ep != -1 and last_ep + 1 != f['episode']:
                continuous = False
            last_ep = f['episode']

        if target_file is None:
            return self.fail('Failed to locate video file for episode %s' % (self.episode.episode_number))

        self.file_index = target_file['index']
        self.filename = target_file['name']
        self.save()

        # Handles the rest of the detected episodes
        if len(ep_files) > 1 and continuous:
            auto_matching_qualified = True
            # First, we checks sanity check if auto matching would work
            for f in ep_files:
                if f == target_file:
                    continue
                episode_query = TvEpisode.objects.filter(
                    season=self.subscription.season, episode_number=f['episode'])
                if not episode_query.exists():
                    auto_matching_qualified = False
                    break
                f['episode'] = episode_query.first()

            if auto_matching_qualified:
                for f in ep_files:
                    if f == target_file:
                        continue
                    MonitoredTvDownload.objects.create(
                        task=self.task,
                        episode=f['episode'], file_index=f['index'], filename=f['name'],
                        auto_matched=True,
                        subscription=self.subscription)
                    logger.info('Auto matched Episode "%s" for download "%s"' % (
                        f['episode'], self.task.name))

        return utils.success('Monitor parsed files')

    def cmp_priority(self, other: 'MonitoredTvDownload'):
        cmp = other.subscription.priority - self.subscription.priority
        if cmp:
            return cmp
        if self.auto_matched != other.auto_matched:
            if other.auto_matched:
                return 1
            else:
                return -1
        return 0

    def organize(self, task):
        episode: TvEpisode = self.episode
        # Cancel all other subscribed downloads with a lower or equal priority
        other_downloads = MonitoredTvDownload.objects.filter(
            episode=episode)
        for other in other_downloads:
            if other == self:
                continue
            if other.done is True:
                if self.cmp_priority(other) > 0:
                    # XXX: Consider implement episde.replace_video() so in case import fails the previous video is kept
                    episode.remove_episode()  # remove episode will delete download for us
                    episode.save()
            else:
                if self.cmp_priority(other) >= 0:
                    other.cancel()
        # Episode is still ready after cancelling all monitored downloads,
        # meaning it's downloaded/imported by used in the mean time, cancel self
        episode.refresh_from_db()
        if episode.status == episode.Status.READY:
            self.cancel()
            return utils.failure('Monitored download is already downloaded/imported')

        return super().organize(task, manually=True)
