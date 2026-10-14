"""
Django settings for project.
"""

from pathlib import Path
import os
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / '.env')

import dj_database_url

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-ims-core-fallback-secret-key-12345')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() in ('true', '1', 't')

# ALLOWED_HOSTS: automatically allow localhost, 127.0.0.1, .onrender.com, .vercel.app, and custom env
allowed_hosts_env = os.getenv('DJANGO_ALLOWED_HOSTS', '')
base_allowed = ['localhost', '127.0.0.1', '0.0.0.0', '.onrender.com', '.vercel.app']
if allowed_hosts_env:
    base_allowed.extend([h.strip() for h in allowed_hosts_env.split(',') if h.strip()])
ALLOWED_HOSTS = list(set(base_allowed))

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',

    # Third-party libraries
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_filters',
    'drf_spectacular',

    # Core Application
    'app',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'project.urls'

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

WSGI_APPLICATION = 'project.wsgi.application'

# Database Configuration (DATABASE_URL takes precedence e.g. on Render Postgres, falls back to SQLite or env)
database_url = os.getenv('DATABASE_URL')
if database_url:
    DATABASES = {
        'default': dj_database_url.config(
            default=database_url,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    db_engine = os.getenv('DB_ENGINE', 'django.db.backends.sqlite3')
    db_name = os.getenv('DB_NAME', str(BASE_DIR / 'inventory_db.sqlite3'))

    if 'sqlite' in db_engine:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / (os.getenv('DB_NAME') or 'inventory_db.sqlite3'),
            }
        }
    else:
        DATABASES = {
            'default': {
                'ENGINE': db_engine,
                'NAME': db_name,
                'USER': os.getenv('DB_USER', 'inventory_user'),
                'PASSWORD': os.getenv('DB_PASSWORD', ''),
                'HOST': os.getenv('DB_HOST', 'localhost'),
                'PORT': os.getenv('DB_PORT', '5432'),
            }
        }

# Password validation
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
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static & Media files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 15,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# Honor the 'X-Forwarded-Proto' header for request.is_secure() behind Render proxy
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Spectacular OpenAPI Documentation settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'Inventory Management System API',
    'DESCRIPTION': 'Production-grade RESTful API for inventory tracking, transactions, automation & reports.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# CORS & CSRF Configuration for Vercel Frontend + Render Backend
cors_origins_env = os.getenv('CORS_ALLOWED_ORIGINS', '')
default_cors = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
if cors_origins_env:
    default_cors.extend([orig.strip() for orig in cors_origins_env.split(',') if orig.strip()])

CORS_ALLOWED_ORIGINS = list(set(default_cors))
CORS_ALLOW_CREDENTIALS = True

# Match any *.vercel.app deployment preview or custom domain
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.vercel\.app$",
    r"^https:\/\/.*\.onrender\.com$",
]

# CSRF Trusted Origins
csrf_origins_env = os.getenv('CSRF_TRUSTED_ORIGINS', '')
default_csrf = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://*.vercel.app',
    'https://*.onrender.com',
]
if csrf_origins_env:
    default_csrf.extend([orig.strip() for orig in csrf_origins_env.split(',') if orig.strip()])
CSRF_TRUSTED_ORIGINS = list(set(default_csrf))

CSRF_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
SESSION_COOKIE_SECURE = not DEBUG

# SMTP & Email Alert Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('SMTP_HOST') or os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('SMTP_PORT') or os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = (os.getenv('SMTP_USE_TLS') or os.getenv('EMAIL_USE_TLS', 'True')).lower() in ('true', '1', 't')
EMAIL_HOST_USER = os.getenv('SMTP_USER') or os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('SMTP_PASS') or os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL') or os.getenv('DEFAULT_FROM_EMAIL', 'Referly Notifications <ajaymahto2580@gmail.com>')
ALERT_RECIPIENT_EMAIL = os.getenv('ALERT_RECIPIENT_EMAIL', 'ajaymahto2580@gmail.com')


