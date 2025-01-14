import logging

from django.apps import AppConfig
from django.conf import settings
from hamstery import upgrade, utils

logger = logging.getLogger(__name__)


class HamsteryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'hamstery'

    def ready(self) -> None:
        if settings.FIRST_RUN is False:
            upgrade.register_upgrade_hook(self)
        logger.info('q-hamstery version: %s' % (settings.HAMSTERY_VERSION))
        logger.info('Timezone: %s' % (utils.tz))
        logger.info('Starup Time: %s' % (utils.now().strftime('%Y-%m-%d %H:%M:%S')))
        from hamstery.hamstery_settings import settings_manager
        from hamstery.openai import openai_manager
        from hamstery.plex import plex_manager
        from hamstery.qbittorrent import qbt
        if settings.BUILDING is False:
            qbt.test_connection()
        try:
            import uwsgi

            from hamstery.hamstery_settings import (
                UWSGI_HAMSTERY_SETTINGS_UPDATE,
                hamstery_settings_uwsgi_handler)
            logger.info('Registered uWSGI signal handlers')
            uwsgi.register_signal(UWSGI_HAMSTERY_SETTINGS_UPDATE, "workers",
                            hamstery_settings_uwsgi_handler)
        except ImportError as e:
            print(str(e))
