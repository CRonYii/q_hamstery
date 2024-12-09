
import logging
import traceback
from pathlib import Path

from django.http import HttpResponseServerError, HttpResponse
from django.conf import settings

from hamstery import utils
from hamstery.forms import *
from hamstery.utils import (GET, need_authentication, validate_params)

logger = logging.getLogger(__name__)
# Create your views here.


@GET
@need_authentication
@validate_params(LogRqeustForm)
def hamstery_log_view(request):
    try:
        log_path = Path(settings.LOG_PATH)
        if not log_path.exists() or not log_path.is_file():
            return HttpResponseServerError('Cannot locate Hamstery Log file!')
        n = request.data['lines'] or 0
        file = request.data['file'] or False
        with open(log_path, 'rb') as log_file:
            if n > 0:
                logs_bytes = utils.read_last_nlines(log_file, n)
            else:
                logs_bytes = log_file.read()
            logs = logs_bytes.decode(encoding='utf-8')
            if file:
                response = HttpResponse(logs, content_type='text/plain; charset=utf-8')
                response['Content-Disposition'] = 'attachment; filename=hamstery-%s.log' % utils.now()
                return response
            else:
                return HttpResponse(logs, content_type='text/plain; charset=utf-8')
    except Exception as e:
        logger.error(traceback.format_exc())
        return HttpResponseServerError(e)
