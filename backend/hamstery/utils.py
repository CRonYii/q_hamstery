import base64
from collections import deque
import io
import filecmp
import json
import os
import re
import hashlib
import bencodepy
import shutil
from datetime import datetime
from functools import wraps
from pathlib import Path
from typing import Sequence

import cn2an
import psutil
import tzlocal
from django import forms
from django.core.exceptions import ValidationError
from django.http import (HttpResponseBadRequest, HttpResponseNotFound,
                         JsonResponse)
from rest_framework import status, serializers
from rest_framework.response import Response

tz = tzlocal.get_localzone()


def now():
    return datetime.now(tz)


def validate_directory_exist(dir):
    if not os.path.isdir(dir):
        raise ValidationError('directory "%s" does not exist' % dir,
                              params={'dir': dir})


def list_dir(path) -> Sequence[Sequence[str]]:
    for (dirpath, dirnames, _) in os.walk(path):
        return [[dirpath, dir] for dir in dirnames]


def list_file(path) -> Sequence[Sequence[str]]:
    for (dirpath, _, filenames) in os.walk(path):
        return [[dirpath, filename] for filename in filenames]


def tree_media(path):
    all_dirs = []
    all_files = []
    for (dirpath, dirnames, filenames) in os.walk(os.path.abspath(path)):
        dirs = [[dirpath, dir] for dir in dirnames]
        files = [[dirpath, filename] for filename in filenames]
        all_dirs = all_dirs + dirs
        all_files = all_files + files
    return {
        'dirs': all_dirs,
        'files': all_files,
    }


def make_file_uri_obj(path, name):
    return {
        'key': base64.b64encode(os.path.join(path, name).encode('utf-8')).decode('utf-8'),
        'path': path,
        'title': name
    }


def list_dir_and_file(path):
    for (dirpath, dirnames, filenames) in os.walk(path):
        return {
            'path': [make_file_uri_obj(dirpath, dir) for dir in dirnames],
            'file': [make_file_uri_obj(dirpath, filename) for filename in filenames]
        }


def list_root_storages():
    return [make_file_uri_obj('', x.mountpoint) for x in psutil.disk_partitions() if x.fstype ==
            'ext4' or x.fstype == 'NTFS' or x.fstype == 'btrfs']


def is_subdirectory(parent: str, child: str):
    parent = Path(parent)
    child = Path(child)
    return parent in child.parents


class Result:

    def __init__(self, success, payload=None):
        self.success = success
        self.multi = False
        self.__payload = payload

    def agg(self, result):
        if result.success is not self.success:
            if self.success is True:
                self.success = False
                self.__payload = None
            else:
                return self
        if self.__payload is None:
            self.__payload = result.data()
        else:
            if self.multi is True:
                self.__payload = self.__payload + result.data()
            else:
                self.multi = True
                self.__payload = [self.__payload, result.data()]
        return self

    def data(self):
        return self.__payload

    def into_response(self):
        if self.success is True:
            return Response(self.data())
        else:
            return Response(self.data(), status=status.HTTP_400_BAD_REQUEST)

    def __str__(self):
        if self.success:
            return 'Ok(%s)' % self.data()
        else:
            return 'Err(%s)' % self.data()


def value_or(dict: dict, key, default):
    value = dict.get(key, default)
    if value is None:
        return default
    return value


def success(data=None) -> Result:
    return Result(True, data)


def failure(errors) -> Result:
    return Result(False, errors)


def JSON(api):
    @wraps(api)
    def _wrapped_api(request, *args, **kwargs):
        if request.method == 'POST' and request.content_type == 'application/json':
            request.JSON = json.loads(request.body)
        return api(request, *args, **kwargs)
    return _wrapped_api


def GET(api):
    @wraps(api)
    def _wrapped_api(request, *args, **kwargs):
        if request.method == 'GET':
            return api(request, *args, **kwargs)
        return HttpResponseNotFound()
    return _wrapped_api


def POST(api):
    @wraps(api)
    def _wrapped_api(request, *args, **kwargs):
        if request.method == 'POST':
            return api(request, *args, **kwargs)
        return HttpResponseNotFound()
    return _wrapped_api


def need_authentication(api):
    @wraps(api)
    def _wrapped_api(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return HttpResponseBadRequest('Invalid credentials')
        else:
            return api(request, *args, **kwargs)
    return _wrapped_api


def validate_params(Form: forms.Form):
    def _wrapped_api(api):
        @wraps(api)
        def _wrapped_wrapped_api(request, *args, **kwargs):
            form = None
            if request.method == 'GET':
                form = Form(request.GET)
            elif request.method == 'POST':
                if request.content_type == 'application/json' and request.JSON is not None:
                    form = Form(request.JSON)
                else:
                    form = Form(request.POST)
            if form is None:
                return JsonResponse('No payload', status=400)
            if form.is_valid() is False:
                return JsonResponse(dict(form.errors.items()), status=400)
            request.data = form.cleaned_data
            return api(request, *args, **kwargs)
        return _wrapped_wrapped_api
    return _wrapped_api


def validate_rest_params(Form: serializers.Serializer):
    def _wrapped_api(api):
        @wraps(api)
        def _wrapped_wrapped_api(request, *args, **kwargs):
            if request.method == 'GET':
                form = Form(data=request.query_params)
            else:
                form = Form(data=request.data)
            if not form.is_valid():
                return JsonResponse(dict(form.errors.items()), status=400)
            request.validated_data = form.validated_data
            return api(request, *args, **kwargs)
        return _wrapped_wrapped_api
    return _wrapped_api


VIDEO_FILE_RE = re.compile(r'.*?\.(mp4|mkv|flv|avi|rmvb|m4p|m4v|m2ts|ts)$')


def is_video_extension(name):
    return VIDEO_FILE_RE.match(name)


def is_valid_tv_download_file(file, target_file):
    name: str = os.path.basename(file['name'])
    return target_file in name and (is_video_extension(name) or is_supplemental_file_extension(name))


SUPPLEMENTAL_FILE_RE = re.compile(r'.*?\.(ass|ssa|srt|idx|sub|mka|flac)$')


def is_supplemental_file_extension(name):
    return SUPPLEMENTAL_FILE_RE.match(name)


def is_supplemental_file(src: str, name: str):
    basename, _ = os.path.splitext(os.path.basename(name))
    return basename.startswith(src) and is_supplemental_file_extension(name)


def list_supplemental_file(src):
    files = list_file(os.path.dirname(src))
    original_name, _ = os.path.splitext(os.path.basename(src))
    for res in filter(lambda f: is_supplemental_file(original_name, f[1]), files):
        yield res


special_supplemental_ext = {
    # Chinese
    'zh': '.zh',
    'sc': '.zh-CN',
    'tc': '.zh-TW',
    'chs': '.zh-CN',
    'cht': '.zh-TW',
    'gb': '.zh-CN',
    'big5': '.zh-TW',
    # Japanese
    'ja': '.ja',
    'jp': '.ja',
    'jpn': '.ja',
    # English
    'en': '.en',
    'eng': '.en',
}

supported_langcode_separator = ['.', '-', '_']


def get_supplemental_file_ext(name):
    name, sup_ext = os.path.splitext(name)
    name: str = name.lower()
    for key in special_supplemental_ext.keys():
        if name.endswith(key) and name[-len(key)-1] in supported_langcode_separator:
            return special_supplemental_ext[key] + sup_ext
    return sup_ext


EPISODE_NUMBER_RE = [
    re.compile(
        r'(?:[Ee][Pp]|[E第])(\d{2,3}|[零一二三四五六七八九十百千]{1,6})([vV]\d)?[ 話话回集.-]'),
    re.compile(
        r'(?:- |[【[])(\d{2,3}|[零一二三四五六七八九十百千]{1,6})([vV]\d)?[\]】 .-]'),
    re.compile(
        r'(?:[ ])(\d{2,3}|[零一二三四五六七八九十百千]{1,6})([vV]\d)?[ .-]'),
]


def get_episode_number_from_title(title: str, force_local=False) -> int:
    from hamstery.hamstery_settings import settings_manager
    from hamstery.models.settings import HamsterySettings
    from hamstery.openai import openai_manager
    title: str = os.path.basename(title)
    settings = settings_manager.settings
    if not force_local and settings.openai_title_parser_mode == HamsterySettings.TitleParserMode.PRIMARY:
        ep, score = openai_manager.get_episode_number_from_title(title)
        if ep:
            return ep, score
    try:
        ep = int(title)
        return ep, 100
    except ValueError:
        pass

    for re in EPISODE_NUMBER_RE:
        match = re.search(title)
        if match:
            break

    if not match:
        if not force_local and settings.openai_title_parser_mode == HamsterySettings.TitleParserMode.STANDBY:
            return openai_manager.get_episode_number_from_title(title)
        return None, 0

    ep = match.group(1)
    try:
        ep = int(ep)
        return ep, 110
    except ValueError:
        pass

    return cn2an.cn2an(ep, mode='smart'), 120


def get_best_episode_from_titles(entities, get_title, force_local=False):
    res = {}
    for entity in entities:
        title = get_title(entity)
        ep, score = get_episode_number_from_title(title, force_local=force_local)
        if not ep:
            continue
        res[title] = {
            "episode": ep,
            "entity": entity,
            "score": score
        }
    episodes = {}
    for title in res:
        entity = res[title]["entity"]
        ep = res[title]["episode"]
        score = res[title]["score"]
        if ep in episodes and score <= episodes[ep]["score"]:
            continue
        episodes[ep] = {
            "episode": ep,
            "entity": entity,
            "score": score,
        }
    return episodes


def get_valid_filename(s: str) -> str:
    return re.sub(r"(?u)[^-\w.]", "", s)


def import_single_file(src, dst, mode):
    if mode == 'symlink':
        os.symlink(src, dst)
    elif mode == 'move':
        shutil.move(src, dst)
    elif mode == 'link':
        os.link(src, dst)


def get_numbered_filename(src, dst):
    number = 1
    name, ext = os.path.splitext(dst)
    while True:
        if not Path(dst).exists():
            break
        if filecmp.cmp(src, dst):
            return None
        dst = "%s.%d%s" % (name, number, ext)
        number += 1

    return dst


def read_last_nlines(f: io.BufferedIOBase, n: int, d=b'\n') -> bytes:
    """"readlast(f: io.IOBase, n: int, d: bytes = b'\n') -> bytes

    Return the last N segments of file `f`, containing data segments separated by
    `d`.
    """

    arr = deque()
    d_sz = len(d)
    step = d_sz
    pos = -1
    i = 0
    try:
        # Seek to last byte of file, save it to arr as to not check for newline.
        pos = f.seek(-1, io.SEEK_END)
        arr.appendleft(f.read())
        # Seek past the byte read, plus one to use as the first segment.
        pos = f.seek(-2, io.SEEK_END)
        seg = f.read(1)
        # Break when 'd' occurs, store index of the rightmost match in 'i'.
        while True:
            while (d_idx := seg.rfind(d)) == -1:
                # Store segments with no b'\n' in a memory-efficient 'deque'.
                arr.appendleft(seg)
                # Step back in file, past the bytes just read plus twice that.
                pos = f.seek(-step*3, io.SEEK_CUR)
                # Read new segment, twice as big as the one read previous iteration.
                step *= 2
                seg = f.read(step)
            # Read 1 line.
            i = i + 1
            if i >= n:
                # We have read N lines. Ignore the characters up to 'i', and the triggering `d`.
                arr.appendleft(seg[d_idx+d_sz:])
                break
            # We store the line including the triggering `d`, and search for next line
            arr.appendleft(seg[d_idx:])
            if d_idx > 0:
                # The remaining could have stored another `d`. We use the remaining as the next seg to be searched.
                pos = f.seek(-step+d_idx, io.SEEK_CUR)
                step = d_idx
                seg = seg[:d_idx]
            else:
                # Reset everthing.
                pos = f.seek(-step+d_idx-d_sz, io.SEEK_CUR)
                step = d_sz
                seg = f.read(step)
    except OSError as e:
        # Reached beginning of file. Read remaining data and check for newline.
        f.seek(0)
        seg = f.read(pos)
        while (d_idx := seg.rfind(d)) != -1:
            i = i + 1
            if i >= n:
                # We have read N lines. Ignore the characters up to 'i', and the triggering `d`.
                arr.appendleft(seg[d_idx+d_sz:])
                break
            arr.appendleft(seg[d_idx:])
            seg = seg[:d_idx]
        if i < n:
            # We do not have N lines. Return everthing.
            arr.appendleft(seg)
    return b"".join(arr)


def decode_str_to_dict(s: str, *args):
    data = {}
    res = []
    params = s.split(',')
    for param in params:
        [key, value] = param.split('=')
        data[key] = value
    for k in args:
        if k not in data:
            return failure('"%s" is not present' % (k))
        res.append(data[k])
    return success(res)


class InfoHashException(Exception):
    def __init__(self, input, message):
        self.input = input
        super().__init__(message)


def calculate_info_hash(magnet=None, torrent=None):
    if magnet:
        match = re.search(
            r'xt=urn:btih:([a-fA-F0-9]{40}|[a-zA-Z0-9]{32})', magnet)
        if match:
            info_hash = match.group(1)
            if len(info_hash) == 32:
                info_hash = base64.b32decode(info_hash).hex()
            return info_hash.lower()
        else:
            raise InfoHashException(
                magnet, "Invalid magnet url, failed to extract Info Hash")
    if torrent:
        try:
            torrent_data = bencodepy.decode(torrent)
            info_data = torrent_data[b"info"]
            info_encoded = bencodepy.encode(info_data)
            return hashlib.sha1(info_encoded).hexdigest().lower()
        except Exception as e:
            raise InfoHashException(
                torrent, f"Failed to decode torrent file: {e}")
    raise InfoHashException(
        None, "No input provided, please provide magneturl or torrent")
