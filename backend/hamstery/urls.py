from django.urls import include, path

from rest_framework import routers
from hamstery import views

router = routers.DefaultRouter()
router.register(r'indexer', views.IndexerView, 'indexer')
router.register(r'torznab', views.TorznabView, 'torznab')
router.register(r'tvlib', views.TvLibraryView, 'tv-library')
router.register(r'tvstorage', views.TvStorageView, 'tv-storage')
router.register(r'tvshow', views.TvShowView, 'tv-show')
router.register(r'tvseason', views.TvSeasonView, 'tv-season')
router.register(r'tvepisode', views.TvEpisodeView, 'tv-episode')
router.register(r'tvdownload', views.TvDownloadView, 'tv-download')
router.register(r'monitored-tvdownload',
                views.MonitoredDownloadView, 'monitored-tv-download')
router.register(r'season-download',
                views.SeasonDownloadView, 'season-download')
router.register(r'season-episode-download',
                views.SeasonEpisodeDownloadView, 'season-episode-download')
router.register(r'show-subscription',
                views.ShowSubscriptionView, 'show-subscription')
router.register(r'settings', views.HamsterySettingsView, 'settings')
router.register(r'stats', views.HamsteryStatsView, 'stats')
router.register(r'title-parser',
                views.OpenAITitleParserLogsViews, 'title-parser')

urlpatterns = [
    path('api/', include(router.urls)),
    path('auth/login', views.login_view),
    path('auth/logout', views.logout_view),
    path('auth/test', views.test_auth_view),
    path('api/media/list', views.media_list_root_view),
    path('api/media/episode_number', views.extract_episode_number_from_title_view),
    path('api/media/episodes_mapping', views.get_best_episodes_mapping),
    path('api/logs/hamstery', views.hamstery_log_view),
]
