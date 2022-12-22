"""
Django settings for q_hamstery_backend project.

Generated by 'django-admin startproject' using Django 3.2.5.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.2/ref/settings/
"""

from pathlib import Path
import environ

# Initialise environment variables
env = environ.Env(
    BUILDING=(bool, False),
    HOST_NAME=(str, 'local'),
    HOST=(str, '.localhost'),
    TZ=(str, 'UTC'),
    DEBUG=(bool, False),
    SECRET_KEY=(
        str, 'django-insecure-+h-p!u=n2o-z2ap_ekvwt)$@3*t!hf*uvfx=(!a^de-&ums15b'),
    QBITTORRENT_USERNAME=(str, ''),
    QBITTORRENT_PASSWORD=(str, ''),
    PLEX_URL=(str, ''),
    PLEX_TOKEN=(str, ''),
    CSRF_TRUSTED_ORIGINS=(str, None),
)
environ.Env.read_env('.env')

HOST_NAME = env('HOST_NAME')

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

STATIC_ROOT = BASE_DIR / "static"

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env('DEBUG')

ALLOWED_HOSTS = ['127.0.0.1', env('HOST')]
if env('CSRF_TRUSTED_ORIGINS') is not None:
    CSRF_TRUSTED_ORIGINS = [env('CSRF_TRUSTED_ORIGINS')]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_filters',
    'rest_framework',
    'hamstery',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'q_hamstery_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'q_hamstery_backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/3.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'app_data' / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/3.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/3.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = env('TZ')

USE_I18N = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.2/howto/static-files/

STATIC_URL = '/static/'

# Default primary key field type
# https://docs.djangoproject.com/en/3.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend'
    ],
}

BUILDING = env('BUILDING')

if BUILDING is False:
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'handlers': {
            'backend': {
                'class': 'logging.FileHandler',
                'filename': 'app_data/backend.log',
                'encoding': 'utf8',
                'formatter': 'simple',
            },
            'hamstery': {
                'class': 'logging.FileHandler',
                'filename': 'app_data/hamstery.log',
                'encoding': 'utf8',
                'formatter': 'verbose',
            },
            'console': {
                'class': 'logging.StreamHandler',
            },
        },
        'loggers': {
            'django': {
                'handlers': ['console'],
                'propagate': True,
                'level': 'INFO',
            },
            'hamstery': {
                'handlers': ['hamstery', 'console'],
                'propagate': True,
                'level': 'INFO',
            },
        },
        'formatters': {
            'verbose': {
                'format': '{name} {levelname} {asctime} {message}',
                'style': '{',
            },
            'simple': {
                'format': '{levelname} {asctime} {message}',
                'style': '{',
            },
        },
    }
    
    PLEX_CONFIG = {
        'url': env('PLEX_URL'),
        'token': env('PLEX_TOKEN'),
    }
    
    QBITTORRENT_CONFIG = {
        'host': env('QBITTORRENT_HOST'),
        'port': env('QBITTORRENT_PORT'),
        'username': env('QBITTORRENT_USERNAME'),
        'password': env('QBITTORRENT_PASSWORD'),
    }
