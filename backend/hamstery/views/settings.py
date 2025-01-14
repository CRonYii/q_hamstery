from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from django.http import JsonResponse

from ..models import HamsterySettings
from ..serializers import HamsterySettingsSerializer

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
        title = "(アニメ DVD) ぼくらの 第23話 「雪景色」(704×480 x264 AAC)"
        ep, score = openai_manager.get_episode_number_from_title(title)
        return JsonResponse({'title': title,
                             "episode": ep,
                             "score": score,
                             "success": ep == 23})
