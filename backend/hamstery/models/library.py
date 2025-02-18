import asyncio
import errno
import logging
import os
import re
import traceback
from datetime import datetime
from pathlib import Path
from typing import List, Sequence

from asgiref.sync import async_to_sync, sync_to_async
from django.db import models
from django.db.models import Q

from hamstery.models import Indexer
from hamstery.plex import plex_manager
from hamstery.tmdb import (tmdb_search_tv_shows, tmdb_tv_season_details,
                           tmdb_tv_show_details)
from hamstery.qbittorrent import *
from hamstery.utils import *

logger = logging.getLogger(__name__)


class TvLibrary(models.Model):
    name = models.CharField(max_length=120)
    TMDB_LANG = [
        ('xx', 'No Language'), ('aa', 'Afar'), ('af', 'Afrikaans'), ('ak', 'Akan'), ('an', 'Aragonese'), ('as', 'Assamese'), ('av', 'Avaric'), ('ae', 'Avestan'), ('ay', 'Aymara'), ('az', 'Azərbaycan'), ('ba', 'Bashkir'), ('bm', 'Bamanankan'), ('bi', 'Bislama'), ('bo', 'Tibetan'), ('br', 'Breton'), ('ca', 'Català'), ('cs', 'Český'), ('ce', 'Chechen'), ('cu', 'Slavic'), ('cv', 'Chuvash'), ('kw', 'Cornish'), ('co', 'Corsican'), ('cr', 'Cree'), ('cy', 'Cymraeg'), ('da', 'Dansk'), ('de', 'Deutsch'), ('dv', 'Divehi'), ('dz', 'Dzongkha'), ('eo', 'Esperanto'), ('et', 'Eesti'), ('eu', 'euskera'), ('fo', 'Faroese'), ('fj', 'Fijian'), ('fi', 'suomi'), ('fr', 'Français'), ('fy', 'Frisian'), ('ff', 'Fulfulde'), ('gd', 'Gaelic'), ('ga', 'Gaeilge'), ('gl', 'Galego'), ('gv', 'Manx'), ('gn', 'Guarani'), ('gu', 'Gujarati'), ('ht', 'Haitian; Haitian Creole'), ('ha', 'Hausa'), ('sh', 'Serbo-Croatian'), ('hz', 'Herero'), ('ho', 'Hiri Motu'), ('hr', 'Hrvatski'), ('hu', 'Magyar'), ('ig', 'Igbo'), ('io', 'Ido'), ('ii', 'Yi'), ('iu', 'Inuktitut'), ('ie', 'Interlingue'), ('ia', 'Interlingua'), ('id', 'Bahasa indonesia'), ('ik', 'Inupiaq'), ('is', 'Íslenska'), ('it', 'Italiano'), ('jv', 'Javanese'), ('ja', '日本語'), ('kl', 'Kalaallisut'), ('kn', 'Kannada'), ('ks', 'Kashmiri'), ('kr', 'Kanuri'), ('kk', 'қазақ'), ('km', 'Khmer'), ('ki', 'Kikuyu'), ('rw', 'Kinyarwanda'), ('ky', 'Kirghiz'), ('kv', 'Komi'), ('kg', 'Kongo'), ('ko', '한국어/조선말'), ('kj', 'Kuanyama'), ('ku', 'Kurdish'), ('lo', 'Lao'), ('la', 'Latin'), ('lv', 'Latviešu'), ('li', 'Limburgish'), ('ln', 'Lingala'), ('lt', 'Lietuvių'), ('lb', 'Letzeburgesch'), ('lu', 'Luba-Katanga'), ('lg', 'Ganda'), ('mh', 'Marshall'), ('ml', 'Malayalam'), ('mr', 'Marathi'), ('mg', 'Malagasy'), ('mt', 'Malti'), ('mo', 'Moldavian'), ('mn', 'Mongolian'), ('mi', 'Maori'), ('ms',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                'Bahasa melayu'), ('my', 'Burmese'), ('na', 'Nauru'), ('nv', 'Navajo'), ('nr', 'Ndebele'), ('nd', 'Ndebele'), ('ng', 'Ndonga'), ('ne', 'Nepali'), ('nl', 'Nederlands'), ('nn', 'Norwegian Nynorsk'), ('nb', 'Bokmål'), ('no', 'Norsk'), ('ny', 'Chichewa; Nyanja'), ('oc', 'Occitan'), ('oj', 'Ojibwa'), ('or', 'Oriya'), ('om', 'Oromo'), ('os', 'Ossetian; Ossetic'), ('pi', 'Pali'), ('pl', 'Polski'), ('pt', 'Português'), ('qu', 'Quechua'), ('rm', 'Raeto-Romance'), ('ro', 'Română'), ('rn', 'Kirundi'), ('ru', 'Pусский'), ('sg', 'Sango'), ('sa', 'Sanskrit'), ('si', 'සිංහල'), ('sk', 'Slovenčina'), ('sl', 'Slovenščina'), ('se', 'Northern Sami'), ('sm', 'Samoan'), ('sn', 'Shona'), ('sd', 'Sindhi'), ('so', 'Somali'), ('st', 'Sotho'), ('es', 'Español'), ('sq', 'shqip'), ('sc', 'Sardinian'), ('sr', 'Srpski'), ('ss', 'Swati'), ('su', 'Sundanese'), ('sw', 'Kiswahili'), ('sv', 'svenska'), ('ty', 'Tahitian'), ('ta', 'தமிழ்'), ('tt', 'Tatar'), ('te', 'తెలుగు'), ('tg', 'Tajik'), ('tl', 'Tagalog'), ('th', 'ภาษาไทย'), ('ti', 'Tigrinya'), ('to', 'Tonga'), ('tn', 'Tswana'), ('ts', 'Tsonga'), ('tk', 'Turkmen'), ('tr', 'Türkçe'), ('tw', 'Twi'), ('ug', 'Uighur'), ('uk', 'Український'), ('ur', 'اردو'), ('uz', 'ozbek'), ('ve', 'Venda'), ('vi', 'Tiếng Việt'), ('vo', 'Volapük'), ('wa', 'Walloon'), ('wo', 'Wolof'), ('xh', 'Xhosa'), ('yi', 'Yiddish'), ('za', 'Zhuang'), ('zu', 'isiZulu'), ('ab', 'Abkhazian'), ('zh', '普通话'), ('ps', 'پښتو'), ('am', 'Amharic'), ('ar', 'العربية'), ('bg', 'български език'), ('cn', '广州话 / 廣州話'), ('mk', 'Macedonian'), ('el', 'ελληνικά'), ('fa', 'فارسی'), ('he', 'עִבְרִית'), ('hi', 'हिन्दी'), ('hy', 'Armenian'), ('en', 'English'), ('ee', 'Èʋegbe'), ('ka', 'ქართული'), ('pa', 'ਪੰਜਾਬੀ'), ('bn', 'বাংলা'), ('bs', 'Bosanski'), ('ch', 'Finu\' Chamorro'), ('be', 'беларуская мова'), ('yo', 'Èdè Yorùbá')
    ]
    lang = models.CharField(max_length=2, choices=TMDB_LANG, default='xx')

    @async_to_sync
    async def scan(self):
        res = success()
        storages: Sequence[TvStorage] = self.storages.all()
        routines = []
        async for storage in storages:
            routines.append(storage.scan())
        results = await asyncio.gather(*routines)
        for r in results:
            res = res.agg(r)
        return res

    def __str__(self):
        return self.name


class TvStorage(models.Model):
    lib = models.ForeignKey(
        TvLibrary, related_name='storages', on_delete=models.CASCADE, parent_link=True)
    path = models.CharField(max_length=4096, validators=[
                            validate_directory_exist])
    scanning = models.BooleanField(default=False)

    async def scan(self):
        if self.scanning is True:
            return success()
        res = success(self.id)
        self.scanning = True
        await self.asave()
        try:
            logger.info('scanning storage %s' % self.path)
            async for show in self.shows.all():
                if not os.path.isdir(show.path):
                    await show.adelete()
            routines = []
            for (dirpath, dir) in list_dir(self.path):
                try:
                    routines.append(
                        TvShow.objects.scan_for_show(self, dirpath, dir))
                except Exception as e:
                    logger.error(traceback.format_exc())
                    res.agg(failure('Failed to scan show directory %s: %s' %
                            (os.path.join(dirpath, dir), str(e))))
            await asyncio.gather(*routines)
        except Exception as e:
            logger.error(traceback.format_exc())
            res.agg(failure('Failed to scan storage %s: %s' %
                    (self.path, str(e))))
        finally:
            self.scanning = False
            await self.asave()
            return res

    def __str__(self):
        return self.path


class TvShowManager(models.Manager):
    SEASON_FOLDER_RE = re.compile(r'(?i:season)\s+(\d{1,2})')

    async def create_or_update_by_tmdb_id(self, storage: TvStorage, tmdb_id, dirpath=''):
        logger.info('find metadata for show %s' % (dirpath))
        res = await tmdb_tv_show_details(tmdb_id, lang=storage.lib.lang)
        if not res.success:
            return res
        details = res.data()
        name = details['name']
        air_date = value_or(details, 'first_air_date', '')
        air_date_year = None
        if air_date != '':
            air_datetime = datetime.strptime(air_date, '%Y-%m-%d')
            air_date_year = air_datetime.year
        else:
            air_date = None
        number_of_episodes = details['number_of_episodes']
        number_of_seasons = details['number_of_seasons']
        poster_path = value_or(details, 'poster_path', '')
        logger.info('scan show %s' % (name))
        try:
            # update
            show: TvShow = await storage.shows.aget(path=dirpath)
            show.name = name
            show.number_of_episodes = number_of_episodes
            show.number_of_seasons = number_of_seasons
            show.poster_path = poster_path
            show.air_date = air_date
        except TvShow.DoesNotExist:
            # or create
            if dirpath == '':
                show_name = get_valid_filename(name)
                if air_date_year is not None:
                    show_name = show_name + ' (%d)' % (air_date_year)
                dirpath = os.path.join(
                    storage.path, show_name)
                if not os.path.exists(dirpath):
                    os.mkdir(dirpath)
            show = TvShow(
                storage=storage,
                lib=storage.lib,
                tmdb_id=tmdb_id,
                path=dirpath,
                name=name,
                number_of_episodes=number_of_episodes,
                number_of_seasons=number_of_seasons,
                poster_path=poster_path,
                air_date=air_date
            )
        await show.asave()
        logger.info('saved show %s' % (name))
        seasons = details['seasons']
        await show.scan_seasons(seasons)
        return success(show.id)

    TITLE_YEAR_REGEX = re.compile(r'(.*?)\s*\((\d{4})\)?')

    @staticmethod
    def get_title_and_year(name):
        match = TvShowManager.TITLE_YEAR_REGEX.search(name)
        if match:
            return [match.group(1), match.group(2)]
        else:
            return [name, '']

    async def scan_for_show(self, storage: TvStorage, dirpath, dir):
        logger.info('search for show %s - %s' % (dirpath, dir))
        # Find the best matched tv show via tmdb
        [name, year] = TvShowManager.get_title_and_year(dir)
        tmdb_res = await tmdb_search_tv_shows(
            query=name, lang=storage.lib.lang, year=year)
        if not tmdb_res.success:
            return tmdb_res
        shows = tmdb_res.data()
        if shows['total_results'] == 0:
            return failure('Not found in TMDB')
        show_data = shows['results'][0]
        tmdb_id = show_data['id']
        await TvShow.objects.create_or_update_by_tmdb_id(
            storage, tmdb_id, os.path.join(dirpath, dir))
        return success('Ok')


class TvShow(models.Model):
    storage = models.ForeignKey(
        TvStorage, related_name='shows', on_delete=models.CASCADE, parent_link=True)
    lib = models.ForeignKey(
        TvLibrary, related_name='shows', on_delete=models.CASCADE, parent_link=True)
    tmdb_id = models.IntegerField()
    name = models.CharField(max_length=256)
    path = models.CharField(max_length=4096, db_index=True)
    number_of_episodes = models.IntegerField()
    number_of_seasons = models.IntegerField()
    poster_path = models.CharField(max_length=1024, blank=True, default='')
    air_date = models.DateField(blank=True, null=True)

    objects: TvShowManager = TvShowManager()

    def get_season_to_dir_map(self):
        season_map = dict()
        for (path, dir) in list_dir(self.path):
            fullpath = os.path.join(path, dir)
            if 'specials' in dir.lower():
                season_map[0] = fullpath
            else:
                match = TvShowManager.SEASON_FOLDER_RE.search(dir)
                if match:
                    season_number = int(match.group(1))
                    season_map[season_number] = fullpath
        return season_map

    @async_to_sync
    async def scan(self):
        res = success()
        try:
            await TvShow.objects.create_or_update_by_tmdb_id(self.storage, self.tmdb_id, self.path)
        except Exception as e:
            logger.error(traceback.format_exc())
            res.agg(failure('Failed to scan show %s: %s' %
                    (self.path, str(e))))
        return res

    async def scan_seasons(self, seasons):
        season_set = set()
        # scan seasons based on show's dir tree
        season_map = self.get_season_to_dir_map()
        for season in seasons:
            season_number = season['season_number']
            path = season_map.get(season_number, '')
            await TvSeason.objects.create_or_update_by_tmdb_id(
                self, self.tmdb_id, season_number, path)
            season_set.add(season['id'])
        async for season in self.seasons.all():
            if season.tmdb_id not in season_set:
                found = False
                async for _ in season.episodes.filter(~Q(status=TvEpisode.Status.MISSING)):
                    found = True
                    break
                if not found:
                    path = Path(season.path)
                    if path.exists() and len(os.listdir(path)) == 0:
                        try:
                            os.remove(path)
                        except:
                            pass
                    await season.adelete()
                else:
                    logger.warning('Failed to remove %s - Season %02d: local video file linked to it already.' %
                                   (season.show.name, season.season_number))
                    season.warn_removed = True
                    await season.asave()

    def get_number_of_ready_episodes(self):
        count = {
            'ready': 0,
            'missing': 0,
        }
        seasons: List[TvSeason] = self.seasons.all()
        for season in seasons:
            counts = season.get_number_of_ready_episodes()
            count['ready'] += counts['ready']
            count['missing'] += counts['missing']
        return count

    def is_warn_removed(self):
        for season in self.seasons.all():
            if season.is_warn_removed():
                return True

        return False

    def __str__(self):
        return self.name


class TvSeasonManager(models.Manager):
    async def create_or_update_by_tmdb_id(self, show: TvShow, tv_tmdb_id, season_number, dirpath=''):
        res = await tmdb_tv_season_details(
            tv_tmdb_id, season_number, lang=show.storage.lib.lang)
        if not res.success:
            return res
        details: dict = res.data()
        name = details['name']
        tmdb_id = details['id']
        episodes = details['episodes']
        number_of_episodes = len(episodes)
        poster_path = value_or(details, 'poster_path', show.poster_path)
        air_date = value_or(details, 'air_date', '')
        if air_date == '':
            air_date = None
        logger.info('scan season %s - Season %02d' %
                    (show.name, season_number))
        try:
            # update
            # should allow one entry per season per show.
            season: TvSeason = await show.seasons.aget(tmdb_id=tmdb_id)
            season.name = name
            season.number_of_episodes = number_of_episodes
            season.poster_path = poster_path
            season.air_date = air_date
            season.path = dirpath
            season.warn_removed = False
        except TvSeason.DoesNotExist:
            # or create
            if dirpath == '':
                season_name = 'Season %d' % season_number
                if season_number == 0:
                    season_name = 'Specials'
                dirpath = os.path.join(
                    show.path, season_name)
                os.mkdir(dirpath)
            season = TvSeason(
                show=show,
                tmdb_id=tmdb_id,
                name=name,
                path=dirpath,
                season_number=season_number,
                number_of_episodes=number_of_episodes,
                poster_path=poster_path,
                air_date=air_date,
            )
        await season.asave()
        await season.scan_episodes(episodes)


class TvSeason(models.Model):
    show = models.ForeignKey(
        TvShow, related_name='seasons', on_delete=models.CASCADE, parent_link=True)
    tmdb_id = models.IntegerField()
    name = models.CharField(max_length=256)
    path = models.CharField(max_length=4096, db_index=True)
    season_number = models.IntegerField()
    number_of_episodes = models.IntegerField()
    poster_path = models.CharField(max_length=1024, blank=True, default='')
    air_date = models.DateField(blank=True, null=True)
    warn_removed = models.BooleanField(default=False)

    objects: TvSeasonManager = TvSeasonManager()

    def get_episode_to_dir_map(self):
        episode_map = dict()
        for (path, filename) in tree_media(self.path)['files']:
            if not is_video_extension(filename):
                continue
            fullpath = os.path.join(path, filename)
            episode_number, score = get_episode_number_from_title(
                filename, force_local=True)
            if episode_number:
                episode_map[episode_number] = fullpath
        return episode_map

    @async_to_sync
    async def scan(self):
        res = success()
        try:
            await TvSeason.objects.create_or_update_by_tmdb_id(self.show, self.show.tmdb_id, self.season_number, self.path)
        except Exception as e:
            logger.error(traceback.format_exc())
            res.agg(failure('Failed to scan season %s: %s' %
                    (self.path, str(e))))
        return res

    async def scan_episodes(self, episodes):
        episode_map = self.get_episode_to_dir_map()
        episode_tmdbid_map = {}
        for episode in episodes:
            episode_number = episode['episode_number']
            path = episode_map.get(episode_number, '')
            await TvEpisode.objects.create_or_update_by_episode_number(season=self, details=episode, dirpath=path)
            episode_tmdbid_map[episode['id']] = episode_number
        # Clearing episodes
        async for episode in self.episodes.all():
            # Case that a episode has been removed from TMDB
            if episode.tmdb_id in episode_tmdbid_map:
                # Case that a episode's number has changed but TMDB id remains the same and caused a duplicated episode with the same tmdb_id
                if episode.episode_number == episode_tmdbid_map[episode.tmdb_id]:
                    continue
            if episode.status == TvEpisode.Status.MISSING:
                await episode.adelete()
            else:
                logger.warning('Failed to remove %s - Season %02d EP %02d: local video file linked to it already.' %
                               (episode.season.show.name, episode.season_number, episode.episode_number))
                episode.warn_removed = True
                await episode.asave()

    def search_episodes_from_indexer(self, query: str, indexer: Indexer, offset=0, exclude=''):
        eps: List[TvEpisode] = self.episodes.all()
        exclude_re = None
        if exclude != '':
            exclude_re = re.compile(exclude)

        results = {}
        for ep in eps:
            adjusted_ep_n = ep.episode_number + offset
            if adjusted_ep_n <= 0:
                results[ep.episode_number] = []
                continue

            result = indexer.search(
                '%s %02d' % (query, adjusted_ep_n))
            if result.success != True:
                results[ep.episode_number] = []
                continue

            torrents = result.data()
            filtered_torrents = []
            for torrent in torrents:
                title = torrent['title']
                if exclude_re and exclude_re.search(title):
                    return False
                episode, score = get_episode_number_from_title(title)
                if episode != adjusted_ep_n:
                    continue
                filtered_torrents.append({"torrent": torrent, "score": score})
            torrents = map(lambda item: item["torrent"], sorted(
                filtered_torrents, key=lambda x: x["score"], reverse=True))
            results[ep.episode_number] = list(torrents)
        return results

    def download(self, magnet=None, torrent=None, import_external=False):
        from hamstery.models.download import Download, SeasonDownload
        task: Download = Download.objects.download(
            magnet=magnet, torrent=torrent, import_external=import_external)
        if not task:
            return False
        SeasonDownload.objects.get_or_create(task=task, season=self)
        logger.info('Season "%s" started a new download "%s"' %
                    (self, task.hash))
        task.notify_new_downloads()
        return True

    def get_number_of_ready_episodes(self):
        eps: List[TvEpisode] = self.episodes.all()
        ready = len(
            list(filter(lambda ep: ep.status == TvEpisode.Status.READY, eps)))
        return {
            'ready': ready,
            'missing': self.number_of_episodes - ready,
        }

    def is_warn_removed(self):
        if self.warn_removed:
            return True

        return self.episodes.filter(warn_removed=True).exists()

    def __str__(self):
        return '%s - S%02d (%s)' % (self.show.name, self.season_number, self.name)


class TvEpisodeManager(models.Manager):
    async def create_or_update_by_episode_number(self, season: TvSeason, details, dirpath=''):
        episode_number = details['episode_number']
        tmdb_id = details['id']
        name = details['name']
        season_number = details['season_number']
        poster_path = value_or(details, 'still_path', season.poster_path)
        air_date = value_or(details, 'air_date', '')
        if air_date == '':
            air_date = None
        status = TvEpisode.Status.MISSING if dirpath == '' else TvEpisode.Status.READY

        try:
            # update
            episode: TvEpisode = await season.episodes.aget(episode_number=episode_number)
            episode.tmdb_id = tmdb_id
            episode.name = name
            episode.season_number = season_number
            episode.poster_path = poster_path
            episode.air_date = air_date
            episode.warn_removed = False
            await sync_to_async(episode.set_path)(dirpath)
        except TvEpisode.DoesNotExist:
            # or create
            episode = TvEpisode(
                season=season,
                tmdb_id=tmdb_id,
                status=status,
                name=name,
                path=dirpath,
                season_number=season_number,
                episode_number=episode_number,
                poster_path=poster_path,
                air_date=air_date,
            )
        await episode.asave()


class TvEpisode(models.Model):
    season = models.ForeignKey(
        TvSeason, related_name='episodes', on_delete=models.CASCADE, parent_link=True)
    tmdb_id = models.IntegerField()

    class Status(models.IntegerChoices):
        MISSING = 1
        READY = 3
    status = models.IntegerField(choices=Status.choices)
    name = models.CharField(max_length=256)
    path = models.CharField(max_length=4096, blank=True, default='')
    season_number = models.IntegerField()
    episode_number = models.IntegerField(db_index=True)
    poster_path = models.CharField(max_length=1024, blank=True, default='')
    air_date = models.DateField(blank=True, null=True)
    warn_removed = models.BooleanField(default=False)

    objects: TvEpisodeManager = TvEpisodeManager()

    def set_path(self, path: str):
        if len(path) == 0:
            self.path = ''
            self.status = TvEpisode.Status.MISSING
            # It means the download has been removed externally, we will remove the download here as well.
            self.cancel_related_downloads('done')
        else:
            self.path = path
            self.status = TvEpisode.Status.READY

    def remove_episode(self):
        if self.status == TvEpisode.Status.MISSING:
            return True
        if self.path == '':
            self.set_path('')
            return True
        # Directly delete file on drive
        path = Path(self.path)
        if path.exists():
            try:
                os.remove(self.path)
            except OSError:
                # May be used by another process now, stop deletion
                return False
        for [p, f] in list_supplemental_file(self.path):
            sup_file = os.path.join(p, f)
            try:
                os.remove(sup_file)
            except:
                pass
        # delete all done downloads as well
        self.set_path('')
        # Update Plex
        plex_manager.refresh_plex_library_by_filepath(self.get_folder())
        return True

    def import_video(self, pathstr: str, manually: bool, mode='move') -> bool:
        if self.status != TvEpisode.Status.MISSING:
            return False
        path = Path(pathstr)
        season_folder = Path(self.get_folder())
        if not path.exists() or not path.is_file() or not is_video_extension(pathstr):
            logger.warning('Attempt to import invalid file: %s' % pathstr)
            return False
        if season_folder not in path.parents:
            # Need to first move the file to season folder and rename
            src = pathstr
            names = [
                self.get_formatted_file_destination(src, 'full'),
                self.get_formatted_file_destination(
                    src, 'meta_simple_original'),
                self.get_formatted_file_destination(src, 'meta_full'),
                self.get_formatted_file_destination(src, 'meta_simple'),
            ]
            done = False
            for name in names:
                pathstr = os.path.join(self.get_folder(), name)
                try:
                    import_single_file(src, pathstr, mode)
                    done = True
                    break
                except OSError as e:
                    if e.errno == errno.ENAMETOOLONG:
                        continue
                    logger.error(
                        'Error when importing episode "%s" : %s' % (src, str(e)))
                    return False
            if done is False:
                logger.error(
                    'Error when importing episode "%s": All generated filename are too long' % src)
                return False
            # Move/rename subtitle files as well
            final_basename, _ = os.path.splitext(os.path.basename(pathstr))
            for [p, f] in list_supplemental_file(src):
                sup_file = os.path.join(p, f)
                sup_ext = get_supplemental_file_ext(f)
                dst_sup_file_path = os.path.join(
                    self.get_folder(), "%s%s" % (final_basename, sup_ext))
                dst_sup_file_path = get_numbered_filename(
                    sup_file, dst_sup_file_path)
                if dst_sup_file_path is None:
                    # Same file already exists, skip
                    continue
                try:
                    import_single_file(sup_file, dst_sup_file_path, mode)
                except OSError as e:
                    logger.warning(
                        'Error when importing supplemental file "%s": %s' % (sup_file, str(e)))
        self.path = pathstr
        self.status = TvEpisode.Status.READY
        if manually is True:
            self.cancel_related_downloads('downloading')
        plex_manager.refresh_plex_library_by_filepath(self.get_folder())
        return True

    def import_supplemental(self, pathstr: str, mode='move') -> bool:
        if self.status != TvEpisode.Status.READY:
            return False
        sup_file = Path(pathstr)
        if not sup_file.exists() or not sup_file.is_file() or not is_supplemental_file_extension(pathstr):
            logger.warning(
                'Attempt to import invalid supplemental file: %s' % pathstr)
            return False
        final_folder = os.path.dirname(self.path)
        final_basename, _ = os.path.splitext(os.path.basename(self.path))
        sup_ext = get_supplemental_file_ext(pathstr)
        dst_sup_file_path = os.path.join(
            final_folder, "%s%s" % (final_basename, sup_ext))
        dst_sup_file_path = get_numbered_filename(pathstr, dst_sup_file_path)
        if dst_sup_file_path is None:
            # Same file already exists, skip
            return True
        try:
            import_single_file(sup_file, dst_sup_file_path, mode)
        except OSError as e:
            logger.warning(
                'Error when importing supplemental file "%s": %s' % (sup_file, str(e)))
        return True

    def cancel_related_downloads(self, download_type: str):
        if download_type == 'all':
            downloads = self.downloads.all()
        elif download_type == 'downloading':
            downloads = self.downloads.filter(
                Q(monitoredtvdownload__isnull=False) | Q(done=False))
        elif download_type == 'done':
            downloads = self.downloads.filter(done=True)
        for download in downloads:
            logger.info('Deleted <"%s"> download "%s"' % (download_type, download.filename))
            download.cancel()

    def get_formatted_file_destination(self, name, option='full'):
        _, video_filename = os.path.split(name)
        original_name, ext = os.path.splitext(video_filename)
        if option == 'meta_simple_original':
            return "%s (%s)%s" % (self.get_formatted_filename('simple'), original_name, ext)
        if option == 'meta_full':
            return "%s%s" % (self.get_formatted_filename(), ext)
        if option == 'meta_simple':
            return "%s%s" % (self.get_formatted_filename('simple'), ext)
        return "%s (%s)%s" % (self.get_formatted_filename(), original_name, ext)

    def get_formatted_filename(self, option='full'):
        season: TvSeason = self.season
        show: TvShow = season.show
        if option == 'simple':
            return "%s - S%02dE%02d" % (get_valid_filename(show.name), season.season_number, self.episode_number)
        return "%s - S%02dE%02d - %s" % (
            get_valid_filename(show.name), season.season_number, self.episode_number, get_valid_filename(self.name))

    def get_folder(self):
        season: TvSeason = self.season
        return season.path

    def is_manually_ready(self) -> bool:
        from hamstery.models import MonitoredTvDownload
        if self.status != TvEpisode.Status.READY:
            return False
        # Monitored download is not considered a manual download
        downloads = MonitoredTvDownload.objects.filter(
            episode=self, done=True)
        return not downloads.exists()

    def download(self, magnet=None, torrent=None, monitor=None, import_external=True):
        '''
        Dedicated episode download. 
        Creates exactly one TvDownload to import exactly one episode from this download.
        '''
        if self.is_manually_ready():
            return False
        from hamstery.models.download import Download, TvDownload, MonitoredTvDownload
        task: Download = Download.objects.download(
            magnet=magnet, torrent=torrent, import_external=import_external)
        if not task:
            return False
        if TvDownload.objects.filter(task=task, episode=self).exists():
            return False
        if not monitor:
            TvDownload.objects.create(task=task, episode=self)
        else:
            MonitoredTvDownload.objects.create(
                task=task, episode=self, subscription=monitor)
        logger.info('Episode "%s" started a new download "%s"' %
                    (self, task.hash))
        task.notify_new_downloads()
        return True

    def __str__(self):
        return "%s - S%02dE%02d - %s" % (self.id, self.season_number, self.episode_number, self.name)
