import base64
from pathlib import Path

from django.http import HttpResponseBadRequest, JsonResponse

from rest_framework.decorators import api_view
from rest_framework.response import Response

from hamstery.forms import *
from hamstery.utils import *


@GET
@need_authentication
@validate_params(ListMediaForm)
def media_list_root_view(request):
    if request.data['path'] != '':
        path = base64.b64decode(request.data['path']).decode('utf-8')
        path = Path(path)
        if not path.exists():
            return HttpResponseBadRequest('path does not exist')
        return JsonResponse(list_dir_and_file(path))
    else:
        return JsonResponse({'path': list_root_storages(), 'file': []})



@api_view(['GET'])
@validate_rest_params(EpisodeNumberForm)
def extract_episode_number_from_title_view(request):
    title = request.validated_data['title']
    episode_number, score = get_episode_number_from_title(title)

    return JsonResponse({'episode_number': episode_number, 'score': score})

@api_view(['POST'])
@validate_rest_params(EpisodeNumberBatchForm)
def get_best_episodes_mapping(request):
    titles = request.validated_data['titles']
    episodes_mapping = get_best_episode_from_titles(titles, lambda x: x)

    return JsonResponse(episodes_mapping)
