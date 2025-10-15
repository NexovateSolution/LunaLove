import os
import sys
import logging
import logging.config
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')
sys.path.insert(0, str(BASE_DIR / 'apps'))

SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
DEBUG = os.environ.get('DEBUG', '1') == '1'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'channels',
    'apps.payments',
]

# Optionally enable Jazzmin if available and desired
if os.environ.get('ENABLE_JAZZMIN', '1') == '1':
    try:
        import jazzmin  # type: ignore  # noqa: F401
        INSTALLED_APPS.insert(0, 'jazzmin')
    except Exception:
        # If Jazzmin isn't installed, skip without breaking dev server
        pass

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # Dev-only auto-login: ensures admin access without credentials when DEBUG and DEV_AUTO_LOGIN=1
    'tokenplatform.middleware.DevAutoLoginMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'tokenplatform.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
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

ASGI_APPLICATION = 'tokenplatform.asgi:application'

# Database: Prefer Postgres if configured; allow explicit SQLite via USE_SQLITE=1
USE_SQLITE = os.environ.get('USE_SQLITE', '0') == '1'
POSTGRES_HOST = os.environ.get('POSTGRES_HOST')
if USE_SQLITE or not POSTGRES_HOST:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('POSTGRES_DB', 'token_db'),
            'USER': os.environ.get('POSTGRES_USER', 'token_user'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'token_pass'),
            'HOST': POSTGRES_HOST,
            'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        }
    }

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Channels / Redis
REDIS_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [REDIS_URL],
        },
    },
}

# Celery
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', REDIS_URL)
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', REDIS_URL)

# Env business variables
VAT_RATE = os.environ.get('VAT_RATE', '0.15')
PLATFORM_COMMISSION_RATE = os.environ.get('PLATFORM_COMMISSION_RATE', '0.25')
GATEWAY_RATE = os.environ.get('GATEWAY_RATE', '0.03')
GATEWAY_FIXED = os.environ.get('GATEWAY_FIXED', '2.00')
COINS_PER_ETB = int(os.environ.get('COINS_PER_ETB', '1'))
CHAPA_SECRET = os.environ.get('CHAPA_SECRET', '')
CHAPA_PUBLIC = os.environ.get('CHAPA_PUBLIC', '')
TELEBIRR_API_KEY = os.environ.get('TELEBIRR_API_KEY', '')
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:8000')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
MIN_WITHDRAWAL_ETB = os.environ.get('MIN_WITHDRAWAL_ETB', '500')
MAX_DAILY_WITHDRAWAL_ETB = os.environ.get('MAX_DAILY_WITHDRAWAL_ETB', '5000')
MAX_MONTHLY_WITHDRAWAL_ETB = os.environ.get('MAX_MONTHLY_WITHDRAWAL_ETB', '50000')
KYC_ENCRYPTION_KEY = os.environ.get('KYC_ENCRYPTION_KEY')  # base64 urlsafe 32-byte key for Fernet

# Risk thresholds
RISK_TOPUPS_WINDOW_MIN = int(os.environ.get('RISK_TOPUPS_WINDOW_MIN', '60'))
RISK_TOPUPS_COUNT = int(os.environ.get('RISK_TOPUPS_COUNT', '5'))
RISK_GIFTS_ETB_WINDOW_MIN = int(os.environ.get('RISK_GIFTS_ETB_WINDOW_MIN', '60'))
RISK_GIFTS_ETB_THRESHOLD = float(os.environ.get('RISK_GIFTS_ETB_THRESHOLD', '10000'))
RISK_WITHDRAWALS_SAME_DEST_THRESHOLD = int(os.environ.get('RISK_WITHDRAWALS_SAME_DEST_THRESHOLD', '3'))

# DRF throttling
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'gifts_send': os.environ.get('GIFTS_SEND_RATE', '10/min'),
    }
}

# Jazzmin admin UI configuration
JAZZMIN_SETTINGS = {
    "site_title": "Shebalove Admin",
    "site_header": "Shebalove Platform",
    "site_brand": "Shebalove",
    "welcome_sign": "Welcome to Shebalove Admin",
    "copyright": "Shebalove",
    # Top menu shortcuts
    "topmenu_links": [
        {"name": "Dashboard", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"app": "auth"},
        {"app": "payments"},
        {"name": "Users", "model": "auth.user"},
        {"name": "Wallets", "model": "payments.wallet"},
        {"name": "Payments", "model": "payments.payment"},
    ],
    # Icons for models
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "payments": "fas fa-coins",
        "payments.coinpackage": "fas fa-sack-dollar",
        "payments.gift": "fas fa-gift",
        "payments.wallet": "fas fa-wallet",
        "payments.payment": "fas fa-credit-card",
        "payments.receipt": "fas fa-file-invoice-dollar",
        "payments.gifttransaction": "fas fa-hand-holding-heart",
        "payments.withdrawalrequest": "fas fa-money-bill-transfer",
        "payments.kycsubmission": "fas fa-id-card",
        "payments.auditlog": "fas fa-clipboard-list",
    },
    # Related models to show from change form
    "related_modal_active": True,
    "show_ui_builder": False,
}

JAZZMIN_UI_TWEAKS = {
    "theme": "darkly",  # dark theme
    "navbar": "navbar-dark navbar-primary",
    "dark_mode_theme": None,
    "accent": "accent-teal",
    "sidebar": "sidebar-dark-primary",
    "brand_colors": {
        "primary": "#6C63FF",
        "accent": "#20c997",
    },
    "button_classes": {
        "primary": "btn-primary", "secondary": "btn-secondary", "info": "btn-info",
        "warning": "btn-warning", "danger": "btn-danger", "success": "btn-success"
    },
}
