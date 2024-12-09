from rest_framework import serializers

from .models import *


class IndexerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Indexer
        fields = ('id', 'name')


class TorznabSerializer(serializers.ModelSerializer):
    class Meta:
        model = Torznab
        fields = ('id', 'name', 'url', 'apikey', 'cat')


class TvEpisodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TvEpisode
        fields = ('id', 'season', 'tmdb_id', 'status', 'name', 'season_number',
                  'episode_number', 'poster_path', 'air_date', 'warn_removed')


class TvSeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = TvSeason
        fields = ('id', 'show', 'tmdb_id', 'name', 'season_number',
                  'number_of_episodes', 'poster_path', 'air_date', 'warn_removed')


class TvShowSerializer(serializers.ModelSerializer):
    class Meta:
        model = TvShow
        fields = ('id', 'lib', 'storage', 'tmdb_id', 'name', 'number_of_episodes',
                  'number_of_seasons', 'poster_path', 'air_date')


class TvStorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TvStorage
        fields = ('id', 'lib', 'path')


class TvLibrarySerializer(serializers.ModelSerializer):
    class Meta:
        model = TvLibrary
        fields = ('id', 'name', 'lang')


class DownloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Download
        fields = ('hash', 'done')

class TvDownloadSerializer(serializers.ModelSerializer):
    hash = serializers.SerializerMethodField()
    done = serializers.SerializerMethodField()

    class Meta:
        model = TvDownload
        fields = ('id', 'hash', 'episode', 'filename', 'done')
        
    def get_hash(self, obj):
        return obj.download.hash
        
    def get_done(self, obj):
        return obj.download.done


class MonitoredTvDownloadSerializer(serializers.ModelSerializer):
    hash = serializers.SerializerMethodField()
    done = serializers.SerializerMethodField()

    class Meta:
        model = MonitoredTvDownload
        fields = ('id', 'hash', 'episode', 'filename', 'subscription', 'done')
            
    def get_hash(self, obj):
        return obj.download.hash
        
    def get_done(self, obj):
        return obj.download.done


class ShowSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShowSubscription
        fields = ('id', 'season', 'indexer', 'query',
                  'priority', 'offset', 'exclude', 'done')


class HamsterySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HamsterySettings
        fields = '__all__'


class HamsteryStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HamsteryStats
        fields = '__all__'


class OpenAITitleParserLogsSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpenAITitleParserLogs
        fields = '__all__'
