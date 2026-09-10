import asyncio
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storebox.settings')

import django
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
django.setup()

from django.contrib.sessions.backends.db import SessionStore
from apps.accounts.models import User
from apps.stores.models import Store
from playwright.async_api import async_playwright

ARTIFACT_DIR = "/Users/ozodbekmahmarayimov/.gemini/antigravity/brain/ccc1dbf4-7f6f-4914-8f98-1985c9f5cb8e"

async def main():
    store = Store.objects.get(id=19)
    user = store.owner

    session = SessionStore()
    session['_auth_user_id'] = str(user.pk)
    session['_auth_user_backend'] = 'django.contrib.auth.backends.ModelBackend'
    session['_auth_user_hash'] = user.get_session_auth_hash()
    session.save()
    session_key = session.session_key
    print(f"Logged in user session: {session_key}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # 1. MOBILE (iPhone 375x812) STOREFRONT
        mobile_ctx = await browser.new_context(
            viewport={'width': 375, 'height': 812},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
        )
        mobile_page = await mobile_ctx.new_page()
        print("1. Loading mobile storefront /store/qweqwew/...")
        await mobile_page.goto("http://127.0.0.1:8000/store/qweqwew/", wait_until="networkidle")
        await asyncio.sleep(1)
        mobile_png = os.path.join(ARTIFACT_DIR, "storefront_mobile_pinterest.png")
        await mobile_page.screenshot(path=mobile_png, full_page=False)
        print(f"Saved: {mobile_png}")

        # 2. DESKTOP (1280x800) STOREFRONT
        desktop_ctx = await browser.new_context(viewport={'width': 1280, 'height': 800})
        desktop_page = await desktop_ctx.new_page()
        print("2. Loading desktop storefront /store/qweqwew/...")
        await desktop_page.goto("http://127.0.0.1:8000/store/qweqwew/", wait_until="networkidle")
        await asyncio.sleep(1)
        desktop_png = os.path.join(ARTIFACT_DIR, "storefront_desktop_pinterest.png")
        await desktop_page.screenshot(path=desktop_png, full_page=False)
        print(f"Saved: {desktop_png}")

        # 3. DASHBOARD DESIGN STUDIO (http://127.0.0.1:8000/dashboard/design)
        dash_ctx = await browser.new_context(viewport={'width': 1440, 'height': 900})
        await dash_ctx.add_cookies([
            {
                'name': 'sessionid',
                'value': session_key,
                'domain': '127.0.0.1',
                'path': '/',
                'httpOnly': True,
            }
        ])
        dash_page = await dash_ctx.new_page()
        print("3. Loading /dashboard/design...")
        await dash_page.goto("http://127.0.0.1:8000/dashboard/design", wait_until="networkidle")
        await asyncio.sleep(2)
        dash_png = os.path.join(ARTIFACT_DIR, "dashboard_design_studio.png")
        await dash_page.screenshot(path=dash_png, full_page=False)
        print(f"Saved: {dash_png}")

        await browser.close()
        print("All screenshots taken successfully!")

if __name__ == '__main__':
    asyncio.run(main())
