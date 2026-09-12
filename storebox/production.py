"""VDS settings; load secrets through the systemd EnvironmentFile."""
from .settings import *

SECRET_KEY = os.environ['SECRET_KEY']
DEBUG = False
ALLOWED_HOSTS = ['.storebox.uz', '127.0.0.1', 'localhost']
CSRF_TRUSTED_ORIGINS = ['https://storebox.uz', 'https://*.storebox.uz']
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_NAME = 'storebox_sessionid'
SESSION_COOKIE_DOMAIN = '.storebox.uz'
CSRF_COOKIE_DOMAIN = '.storebox.uz'
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'SAMEORIGIN'
CORS_ALLOWED_ORIGINS = []
