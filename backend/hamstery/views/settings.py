from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from django.http import JsonResponse

from ..models import HamsterySettings
from ..serializers import HamsterySettingsSerializer
from hamstery.hamstery_settings import settings_manager

# Create your views here.


class HamsterySettingsView(mixins.RetrieveModelMixin,
                           mixins.UpdateModelMixin,
                           viewsets.GenericViewSet):
    serializer_class = HamsterySettingsSerializer

    def get_queryset(self):
        return None

    def get_object(self):
        return HamsterySettings.singleton()

    @action(methods=['get'], detail=True)
    def qbt_test_connection(self, request, pk=None):
        from hamstery.qbittorrent import qbt
        [result, msg] = qbt.test_connection()
        return JsonResponse({'status': result, 'message': msg})

    @action(methods=['get'], detail=True)
    def plex_test_connection(self, request, pk=None):
        from hamstery.plex import plex_manager
        [result, msg] = plex_manager.test_connection()
        return JsonResponse({'status': result, 'message': msg})

    @action(methods=['get'], detail=True)
    def openai_get_models(self, request, pk=None):
        from hamstery.openai import openai_manager
        return JsonResponse({'models': openai_manager.list_models()})

    @action(methods=['get'], detail=True)
    def openai_test_title_parser(self, request, pk=None):
        from hamstery.openai import openai_manager
        settings = settings_manager.settings
        title = "[喵萌奶茶屋&LoliHouse] 超自然武装当哒当 / 胆大党 / Dandadan - 09 [WebRip 1080p HEVC-10bit AAC][简繁日内封字幕]"
        ep = openai_manager.get_episode_number_from_title(
            settings.openai_title_parser_model, settings.openai_title_parser_prompt, title)
        return JsonResponse({'title': title,
                             "episode": ep,
                             "success": ep == 9})
