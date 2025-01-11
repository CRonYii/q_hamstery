from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import action

from ..models import TvDownload, MonitoredTvDownload, SeasonDownload, SeasonEpisodeDownload
from ..qbittorrent import qbt
from ..serializers import TvDownloadSerializer, MonitoredTvDownloadSerializer, SeasonDownloadSerializer, SeasonEpisodeDownloadSerializer
from ..forms import SeasonDownloadForm
from .. import utils

# Create your views here.


class TvDownloadView(viewsets.GenericViewSet):
    queryset = TvDownload.objects.all()
    serializer_class = TvDownloadSerializer
    filterset_fields = {
        'episode': ['exact', 'in'],
    }

    def list(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        data = self.append_extra_info(serializer.data)
        return Response(data)

    def retrieve(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = self.append_extra_info([serializer.data])[0]
        return Response(data)

    def destroy(self, request, *args, **kwargs):
        instance: TvDownload = self.get_object()
        instance.cancel()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def append_extra_info(self, download):
        hash = '|'.join(map(lambda d: d['task'], download))
        info = []
        if qbt.known_status:
            info = qbt.client.torrents_info(torrent_hashes=hash)
        for d in download:
            i = next((x for x in info if x['hash'] == d['task']), None)
            if i is None:
                continue
            extra = {}
            extra['name'] = i['name']
            extra['state'] = i['state']
            extra['progress'] = i['progress']
            extra['dlspeed'] = i['dlspeed']
            extra['completed'] = i['completed']
            extra['completion_on'] = i['completion_on']
            extra['size'] = i['total_size']
            extra['eta'] = i['eta']
            extra['ratio'] = i['ratio']
            extra['uploaded'] = i['uploaded']
            extra['upspeed'] = i['upspeed']
            d['extra_info'] = extra
        return download


class MonitoredDownloadView(viewsets.ReadOnlyModelViewSet):
    queryset = MonitoredTvDownload.objects.all()
    serializer_class = MonitoredTvDownloadSerializer
    filterset_fields = {
        'subscription': ['exact'],
    }


def extract_qbt_file_info(file):
    return {
        'file_index': file['index'],
        'name': file['name'],
        'size': file['size'],
    }


class SeasonDownloadView(viewsets.GenericViewSet):
    queryset = SeasonDownload.objects.all()
    serializer_class = SeasonDownloadSerializer
    filterset_fields = {
        'season': ['exact']
    }

    @action(methods=['post'], detail=True)
    def download(self, request: Request, pk=None):
        season_download: SeasonDownload = self.get_object()
        form = SeasonDownloadForm(data=request.data)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
        errors = season_download.update_episode_mappings(
            form.validated_data['mappings'])
        return Response({'errors': errors})

    def list(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        data = self.append_extra_info(serializer.data)
        return Response(data)

    def retrieve(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = self.append_extra_info([serializer.data])[0]
        return Response(data)

    def destroy(self, request, *args, **kwargs):
        instance: SeasonDownload = self.get_object()
        instance.cancel()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def append_extra_info(self, download):
        for d in download:
            files = []
            extra = {}

            if qbt.known_status:
                files = qbt.client.torrents_files(d['task'])
                i = qbt.client.torrents_info(torrent_hashes=d['task'])[0]
                extra['name'] = i['name']
                extra['state'] = i['state']
                extra['progress'] = i['progress']
                extra['dlspeed'] = i['dlspeed']
                extra['completed'] = i['completed']
                extra['completion_on'] = i['completion_on']
                extra['size'] = i['total_size']
                extra['eta'] = i['eta']
                extra['ratio'] = i['ratio']
                extra['uploaded'] = i['uploaded']
                extra['upspeed'] = i['upspeed']

            d['extra_info'] = extra
            files = filter(
                lambda f: utils.is_video_extension(f['name']), files)
            d['files'] = map(extract_qbt_file_info, files)
        return download


class SeasonEpisodeDownloadView(viewsets.ReadOnlyModelViewSet):
    queryset = SeasonEpisodeDownload.objects.all()
    serializer_class = SeasonEpisodeDownloadSerializer
    filterset_fields = {
        'season_download': ['exact'],
    }
