from django import forms
from rest_framework import serializers


class TMDBForm(forms.Form):
    tmdb_id = forms.IntegerField()


class DownloadForm(serializers.Serializer):
    url = serializers.CharField(required=False)
    torrent = serializers.FileField(required=False)
    import_external = serializers.BooleanField(default=False)


class ImportForm(forms.Form):
    path = forms.CharField()
    mode = forms.CharField(required=False)


class SeasonSearchForm(forms.Form):
    query = forms.CharField()
    indexer_id = forms.CharField()
    offset = forms.IntegerField(required=False)
    exclude = forms.CharField(required=False)


class LoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField()


class ListMediaForm(forms.Form):
    path = forms.CharField(required=False)


class EpisodeNumberForm(serializers.Serializer):
    title = serializers.CharField(required=True)

class StringListField(serializers.ListField):
    child = serializers.CharField()

class EpisodeNumberBatchForm(serializers.Serializer):
    titles = StringListField()


class LogRqeustForm(forms.Form):
    lines = forms.IntegerField(required=False)
    file = forms.BooleanField(required=False)


class SeasonDownloadMappingForm(serializers.Serializer):
    episode = serializers.IntegerField()
    file_index = serializers.IntegerField()


class SeasonDownloadForm(serializers.Serializer):
    mappings = SeasonDownloadMappingForm(many=True)
