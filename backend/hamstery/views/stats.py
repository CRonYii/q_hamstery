from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import HamsteryStats, OpenAITitleParserLogs
from ..serializers import HamsteryStatsSerializer, OpenAITitleParserLogsSerializer

# Create your views here.


class HamsteryStatsView(mixins.RetrieveModelMixin,
                        viewsets.GenericViewSet):
    serializer_class = HamsteryStatsSerializer

    def get_queryset(self):
        return None

    def get_object(self):
        return HamsteryStats.singleton()

    @action(methods=['post'], detail=True)
    def reset_title_parser_stats(self, request, pk=None):
        stats = self.get_object()
        stats.reset_title_parser_stats()
        return Response('Ok')


class OpenAITitleParserLogsViews(viewsets.ReadOnlyModelViewSet):
    queryset = OpenAITitleParserLogs.objects.all()
    serializer_class = OpenAITitleParserLogsSerializer
