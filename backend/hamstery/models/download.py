import logging
import os

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
                qbt_tasks = qbt.client.torrents_info(torrent_hashes=[info_hash])
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
                logger.info('Organized TvDownload "%s": %s' %
                            (epdl.filename, res.data()))
            else:
                logger.warning('Cancelled organizing TvDownload "%s": %s' % (
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


class TvDownload(models.Model):
    task: Download = models.ForeignKey(
        Download, on_delete=models.CASCADE)
    episode: TvEpisode = models.ForeignKey(
        TvEpisode, related_name='downloads', on_delete=models.CASCADE, parent_link=True)
    file_index = models.IntegerField(default=-1)
    filename = models.CharField(max_length=4096, blank=True, default='')
    done = models.BooleanField(default=False)
    error = models.BooleanField(default=False)

    def parse_files(self, files):
        if self.file_index != -1:
            return utils.success('Already fetched file')
        target_files = list(
            filter(lambda f: utils.is_video_extension(f['name']), files))
        if len(target_files) == 0:
            return self.fail('No video file found in download')
        target_file = None
        if len(target_files) > 1:
            for file in target_files:
                if self.get_adjusted_episode_number() == utils.get_episode_number_from_title(file['name']):
                    target_file = file
                    break
            if not target_file:
                return self.fail('Failed to locate target video file from a multiple video files torrent for single episode download')
        else:
            target_file = target_files[0]

        self.file_index = target_file['index']
        self.filename = target_file['name']
        self.save()

        return utils.success('Validated')

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

    def get_adjusted_episode_number(self):
        return self.episode.episode_number


class MonitoredTvDownload(TvDownload):
    subscription = models.ForeignKey(
        ShowSubscription, related_name='downloads', on_delete=models.DO_NOTHING, parent_link=True)

    def organize(self, task):
        episode: TvEpisode = self.episode
        # Cancel all other subscribed downloads with a lower or equal priority
        sub: ShowSubscription = self.subscription
        other_downloads = MonitoredTvDownload.objects.filter(
            episode=episode)
        for d in other_downloads:
            if d == self:
                continue
            if d.subscription.priority >= sub.priority:
                if d.done is True:
                    # XXX: Consider implement episde.replace_video() so in case import fails the previous video is kept
                    episode.remove_episode()  # remove episode will delete download for us
                    episode.save()
                else:
                    d.cancel()
        # Episode is still ready after cancelling all monitored downloads,
        # meaning it's downloaded/imported by used in the mean time, cancel self
        episode.refresh_from_db()
        if episode.status == episode.Status.READY:
            self.cancel()
            return utils.failure('Monitored download is already downloaded/imported by user mannually')

        return super().organize(task, manually=True)

    def get_adjusted_episode_number(self):
        return self.episode.episode_number + self.subscription.offset
