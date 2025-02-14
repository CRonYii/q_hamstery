import django_filters
from asgiref.sync import async_to_sync
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..forms import DownloadForm, ImportForm, SeasonSearchForm, TMDBForm
from ..models import Indexer, TvEpisode, TvLibrary, TvSeason, TvShow, TvStorage
from ..serializers import (TvEpisodeSerializer, TvLibrarySerializer,
                           TvSeasonSerializer, TvShowSerializer,
                           TvStorageSerializer)

# Create your views here.


class TvLibraryView(viewsets.ModelViewSet):
    queryset = TvLibrary.objects.all()
    serializer_class = TvLibrarySerializer

    @action(methods=['post'], detail=True)
    def scan(self, request, pk=None):
        lib: TvLibrary = self.get_object()
        return lib.scan().into_response()


class TvStorageView(viewsets.ModelViewSet):
    queryset = TvStorage.objects.all()
    serializer_class = TvStorageSerializer
    filterset_fields = ['lib']

    @action(methods=['post'], detail=True, url_name='add-show', url_path='add-show')
    def add_show(self, request, pk=None):
        storage: TvStorage = TvStorage.objects.prefetch_related(
            'lib').get(pk=pk)
        form = TMDBForm(request.POST)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
        tmdb_id = form.cleaned_data['tmdb_id']
        if storage.shows.filter(tmdb_id__exact=tmdb_id).exists():
            return Response('Show already exists', status=status.HTTP_400_BAD_REQUEST)
        res = async_to_sync(TvShow.objects.create_or_update_by_tmdb_id)(
            storage, tmdb_id)
        if not res.success:
            return Response(res.data(), status=status.HTTP_400_BAD_REQUEST)
        show_id = res.data()
        return Response({"id": show_id})


class TvShowView(viewsets.GenericViewSet):
    queryset = TvShow.objects.all()
    serializer_class = TvShowSerializer
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['lib', 'storage']
    search_fields = ['name']
    ordering_fields = ['id', 'name', 'air_date']

    @action(methods=['post'], detail=True)
    def scan(self, request, pk=None):
        show: TvShow = TvShow.objects.prefetch_related('storage').get(pk=pk)
        show.storage.lib  # pre-fetch lib here
        return show.scan().into_response()

    def list(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        queryset = self.paginate_queryset(queryset)
        data = list(map(self.generate_data, queryset))

        return self.get_paginated_response(data)

    def retrieve(self, request, pk=None):
        instance = self.get_object()
        return Response(self.generate_data(instance))

    def generate_data(self, show: TvShow):
        serializer = self.get_serializer(show)
        data = serializer.data
        data['number_of_ready_episodes'] = show.get_number_of_ready_episodes()
        data['warn_removed'] = show.is_warn_removed()
        return data


class TvSeasonView(viewsets.GenericViewSet):
    queryset = TvSeason.objects.all()
    serializer_class = TvSeasonSerializer
    filterset_fields = ['show']

    @action(methods=['get'], detail=True)
    def search(self, request, pk=None):
        season: TvSeason = self.get_object()
        form = SeasonSearchForm(request.GET)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
        query = form.cleaned_data['query']
        indexer_id = form.cleaned_data['indexer_id']
        offset = form.cleaned_data['offset'] or 0
        exclude = form.cleaned_data['exclude'] or ''
        try:
            indexer = Indexer.objects.get(pk=indexer_id)
        except Indexer.DoesNotExist:
            return Response('Indexer does not exist', status=status.HTTP_400_BAD_REQUEST)
        return Response(season.search_episodes_from_indexer(query, indexer, offset, exclude))

    @action(methods=['post'], detail=True)
    def scan(self, request, pk=None):
        season: TvSeason = TvSeason.objects.prefetch_related('show').get(pk=pk)
        season.show.storage.lib  # pre-fetch lib here
        return season.scan().into_response()

    @action(methods=['post'], detail=True)
    def download(self, request, pk=None):
        season: TvSeason = self.get_object()
        form = DownloadForm(data=request.data)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
        import_external = form.validated_data['import_external']
        if 'url' in form.validated_data:
            url = form.validated_data['url']
            if season.download(magnet=url, import_external=import_external):
                return Response('Ok')
        elif 'torrent' in form.validated_data:
            torrent = form.validated_data['torrent'].read()
            if season.download(torrent=torrent, import_external=import_external):
                return Response('Ok')
        return Response('Invalid download', status=status.HTTP_400_BAD_REQUEST)

    def list(self, request):
        queryset = self.filter_queryset(self.get_queryset())

        return Response(list(map(self.generate_data, queryset)))

    def retrieve(self, request, pk=None):
        instance = self.get_object()
        return Response(self.generate_data(instance))

    def generate_data(self, season: TvSeason):
        serializer = self.get_serializer(season)
        data = serializer.data
        data['number_of_ready_episodes'] = season.get_number_of_ready_episodes()
        data['warn_removed'] = season.is_warn_removed()
        return data


class TvEpisodeFilter(FilterSet):
    on_air = django_filters.DateFilter(
        field_name="air_date", lookup_expr='lte')

    class Meta:
        model = TvEpisode
        fields = ['season', 'on_air']


class TvEpisodeView(viewsets.ReadOnlyModelViewSet):
    queryset = TvEpisode.objects.all()
    serializer_class = TvEpisodeSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = TvEpisodeFilter
    ordering_fields = ['id', 'episode_number', 'air_date']

    @action(methods=['post'], detail=True)
    def download(self, request, pk=None):
        episode: TvEpisode = self.get_object()
        form = DownloadForm(data=request.data)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
        import_external = form.validated_data['import_external']
        if 'url' in form.validated_data:
            url = form.validated_data['url']
            if episode.download(magnet=url, import_external=import_external):
                return Response('Ok')
        elif 'torrent' in form.validated_data:
            torrent = form.validated_data['torrent'].read()
            if episode.download(torrent=torrent, import_external=import_external):
                return Response('Ok')
        return Response('Invalid download', status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['post'], detail=True)
    def local_import(self, request, pk=None):
        episode: TvEpisode = self.get_object()
        form = ImportForm(request.POST)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
        path = form.cleaned_data['path']
        mode = form.cleaned_data['mode'] or 'move'
        if episode.import_video(path, manually=True, mode=mode) is True:
            episode.save()
            return Response('Ok')
        else:
            return Response('Invalid import', status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['post'], detail=True)
    def local_import_supplemental(self, request, pk=None):
        episode: TvEpisode = self.get_object()
        form = ImportForm(request.POST)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
        path = form.cleaned_data['path']
        mode = form.cleaned_data['mode'] or 'move'
        if episode.import_supplemental(path, mode=mode) is True:
            return Response('Ok')
        else:
            return Response('Invalid import', status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['delete'], detail=True)
    def remove(self, request, pk=None):
        episode: TvEpisode = self.get_object()
        episode.remove_episode()
        episode.save()
        return Response('Ok')
