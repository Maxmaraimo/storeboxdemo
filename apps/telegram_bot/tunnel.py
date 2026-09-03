import os
import re
import time
import socket
import logging
import threading
import subprocess

logger = logging.getLogger(__name__)

TUNNEL_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.tunnel_url')

_current_tunnel_url = None
_tunnel_process = None


def get_stored_tunnel_url():
    """Retrieve currently stored public HTTPS tunnel URL"""
    global _current_tunnel_url
    if os.environ.get('PUBLIC_HTTPS_URL'):
        return os.environ['PUBLIC_HTTPS_URL'].rstrip('/')

    if os.path.exists(TUNNEL_FILE):
        try:
            with open(TUNNEL_FILE, 'r') as f:
                url = f.read().strip()
                if url.startswith('https://'):
                    _current_tunnel_url = url
                    return url
        except Exception:
            pass

    return _current_tunnel_url


def set_stored_tunnel_url(url):
    """Set and persist tunnel URL"""
    global _current_tunnel_url
    if url and url.startswith('https://'):
        _current_tunnel_url = url.rstrip('/')
        try:
            with open(TUNNEL_FILE, 'w') as f:
                f.write(_current_tunnel_url)
        except Exception as e:
            logger.warning(f"Could not save tunnel URL to {TUNNEL_FILE}: {e}")
    return _current_tunnel_url


def check_tunnel_healthy(url):
    """Check if the tunnel URL is currently reachable"""
    if not url or not url.startswith('https://'):
        return False
    try:
        import requests
        res = requests.get(f"{url}/", timeout=4)
        return res.status_code in (200, 301, 302, 404)
    except Exception:
        return False


def get_public_https_base_url():
    """Returns the best available public HTTPS base URL for WebApp"""
    # 1. Environment variable
    env_url = os.environ.get('PUBLIC_HTTPS_URL')
    if env_url and env_url.startswith('https://'):
        return env_url.rstrip('/')

    # 2. Stored tunnel
    stored = get_stored_tunnel_url()
    if stored and check_tunnel_healthy(stored):
        return stored

    # 3. Fallback active localhost.run URL from running tasks
    try:
        # Check task logs or grep for lhr.life
        log_dir = os.path.join(os.path.expanduser('~'), '.gemini/antigravity/brain')
        for root, dirs, files in os.walk(log_dir):
            for file in files:
                if file.endswith('.log'):
                    log_path = os.path.join(root, file)
                    if os.path.getsize(log_path) < 100000:
                        try:
                            with open(log_path, 'r', errors='ignore') as f:
                                content = f.read()
                                match = re.search(r'(https://[a-zA-Z0-9-]+\.lhr\.life)', content)
                                if match:
                                    t_url = match.group(1)
                                    if check_tunnel_healthy(t_url):
                                        set_stored_tunnel_url(t_url)
                                        return t_url
                        except Exception:
                            continue
    except Exception:
        pass

    return stored or "https://a3a320d54a27b4.lhr.life"
