import logging
import heapq
import os
from polymorphic.models import PolymorphicModel


from django.db import models

from hamstery.models.library import TvEpisode, TvSeason
from hamstery.models.show_subscription import ShowSubscription
from hamstery.qbittorrent import *
from hamstery import utils

logger = logging.getLogger(__name__)

# Create your models here.


class DownloadManager(models.Manager):
    def download(self, magnet=None, torrent=None, import_external=False):
        try:
            if not qbt.known_status:
                return
            info_hash = utils.calculate_info_hash(
                magnet=magnet, torrent=torrent)
            query = self.filter(hash=info_hash)
            if query.exists():
                # Verify if it exists in qbt
                qbt_tasks = qbt.client.torrents_info(
                    torrent_hashes=[info_hash], category=HAMSTERY_CATEGORY)
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
                if import_external:
                    qbt_tasks = qbt.client.torrents_info(
                        torrent_hashes=[info_hash])
                    if len(qbt_tasks) != 0:
                        return self.import_download(qbt_tasks[0])
                logger.error('Failed to add download to qbt: %s' % res)
                return
            task, created = self.get_or_create(hash=info_hash)
            return task
        except utils.InfoHashException as e:
            logger.error(e)
            return

    def import_download(self, qbt_task):
        # Import an existing download to hamstery 1. update category 2. fetch and update download status
        task, created = self.get_or_create(hash=qbt_task['hash'])
        qbt.client.torrents_set_category(category=HAMSTERY_CATEGORY, torrent_hashes=[task.hash])
        files = qbt.client.torrents_files(task.hash)
        if len(files) == 0:
            return task

        task.name = qbt_task['name']
        task.fetched = True
        task.completed = qbt_task['completion_on'] > 0
        task.save()

        return task


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

    @property
    def info(self):
        [task] = qbt.client.torrents_info(torrent_hashes=[self.hash])
        return task

    @property
    def files(self):
        if self.fetched:
            return qbt.client.torrents_files(self.hash)
        return []

    def notify_new_downloads(self):
        if self.fetched:
            self.parse_files(self.files)
        if self.completed:
            self.organize(self.info)

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
        if SeasonDownload.objects.filter(task=self).exists():
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


class SeasonDownload(models.Model):
    task: Download = models.ForeignKey(
        Download, on_delete=models.CASCADE)
    season: TvSeason = models.ForeignKey(
        TvSeason, related_name='downloads', on_delete=models.CASCADE, parent_link=True)

    def update_episode_mappings(self, mappings: list):
        errors = []
        if not self.task.fetched:
            return ["Download has not finished fetching yet"]
        files = self.task.files
        for mapping in mappings:
            episode_number = mapping['episode']
            file_index = mapping['file_index']

            query = TvEpisode.objects.filter(
                season=self.season, episode_number=episode_number)
            if not query.exists():
                errors.append(f'Cannot find episode EP{episode_number}')
                continue
            episode: TvEpisode = query.first()

            file = None
            for f in files:
                if f['index'] == file_index:
                    file = f
                    break
            if not file:
                errors.append(
                    f'Cannot find file with file_index {file_index} for EP{episode_number}')
                continue
            if not utils.is_video_extension(file['name']):
                errors.append(
                    f'{file["name"]} does not seem to be a video file for EP{episode_number}')
                continue
            # instead of just create new downloads, update old mappings as well
            query = SeasonEpisodeDownload.objects.filter(
                season_download=self, episode=episode)
            if query.exists():
                dl: SeasonEpisodeDownload = query.first()
                if dl.file_index == file_index:
                    # Same mapping, no need to update
                    continue
                if not dl.done:
                    # It has not ran organize yet, we'll just update the file index then
                    dl.file_index = file_index
                    dl.filename = file['name']
                    dl.save()
                    continue
            if episode.is_manually_ready():
                errors.append(
                    f'EP{episode_number} is already available locally, please remove it before proceeding')
                continue
            SeasonEpisodeDownload.objects.create(
                season_download=self, task=self.task, episode=episode, file_index=file_index, filename=file['name'])

        self.task.notify_new_downloads()
        return errors

    def cancel(self):
        # we must delete before cancel so that task knows it's not in used anymore
        self.delete()
        self.task.cancel_file()


class SeasonEpisodeDownload(TvDownload):
    season_download: SeasonDownload = models.ForeignKey(
        SeasonDownload, related_name='episodes', on_delete=models.CASCADE, parent_link=True)

    def parse_files(self, files):
        if self.file_index != -1:
            return utils.success('Season episode download already mapped')
        return self.fail('Season episode download did not have a mapping')
