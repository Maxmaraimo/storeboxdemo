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
from apps.stores.models import Store
from playwright.async_api import async_playwright

ARTIFACT_DIR = "/Users/ozodbekmahmarayimov/.gemini/antigravity/brain/ccc1dbf4-7f6f-4914-8f98-1985c9f5cb8e"

async def main():
    store = Store.objects.get(id=19) # Ozodbek FullStackDev (qweqwew)
    user = store.owner

    session = SessionStore()
    session['_auth_user_id'] = str(user.pk)
    session['_auth_user_backend'] = 'django.contrib.auth.backends.ModelBackend'
    session['_auth_user_hash'] = user.get_session_auth_hash()
    session['merchant_current_store_id'] = store.id
    session['current_store_subdomain'] = store.subdomain
    session.save()
    session_key = session.session_key
    print(f"Logged in user session: {session_key}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # ==========================================
        # 1. DASHBOARD DESIGN STUDIO - DESKTOP PREVIEW
        # ==========================================
        dash_ctx = await browser.new_context(
            viewport={'width': 1440, 'height': 900},
            device_scale_factor=2
        )
        await dash_ctx.add_cookies([{
            'name': 'sessionid',
            'value': session_key,
            'domain': '127.0.0.1',
            'path': '/',
            'httpOnly': True,
        }])
        dash_page = await dash_ctx.new_page()
        print("1. Loading /dashboard/design (Desktop preview)...")
        await dash_page.goto("http://127.0.0.1:8000/dashboard/design", wait_until="networkidle")
        await asyncio.sleep(2)
        
        # Click Desktop button to ensure desktop preview is active
        desktop_btn = dash_page.locator('button:has-text("Desktop")')
        if await desktop_btn.count() > 0:
            await desktop_btn.first.click()
            await asyncio.sleep(1)

        p1 = os.path.join(ARTIFACT_DIR, "dashboard_design_desktop.png")
        await dash_page.screenshot(path=p1)
        print(f"Saved: {p1}")

        # ==========================================
        # 2. DASHBOARD DESIGN STUDIO - MOBILE PREVIEW
        # ==========================================
        print("2. Switching to Mobil (iPhone) preview...")
        mobile_btn = dash_page.locator('button:has-text("Mobil (iPhone)")')
        if await mobile_btn.count() > 0:
            await mobile_btn.first.click()
            await asyncio.sleep(1.5)

        p2 = os.path.join(ARTIFACT_DIR, "dashboard_design_mobile.png")
        await dash_page.screenshot(path=p2)
        print(f"Saved: {p2}")

        # ==========================================
        # 3. DIRECT STOREFRONT - DESKTOP VIEW
        # ==========================================
        desktop_ctx = await browser.new_context(
            viewport={'width': 1440, 'height': 900},
            device_scale_factor=2
        )
        site_page = await desktop_ctx.new_page()
        print("3. Loading storefront on Desktop...")
        await site_page.goto("http://127.0.0.1:8000/store/qweqwew/", wait_until="networkidle")
        await asyncio.sleep(1.5)

        p3 = os.path.join(ARTIFACT_DIR, "storefront_desktop_full.png")
        await site_page.screenshot(path=p3)
        print(f"Saved: {p3}")

        # ==========================================
        # 4. DIRECT STOREFRONT - MOBILE VIEW
        # ==========================================
        mobile_ctx = await browser.new_context(
            viewport={'width': 390, 'height': 844},
            device_scale_factor=2,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        )
        mob_page = await mobile_ctx.new_page()
        print("4. Loading storefront on Mobile...")
        await mob_page.goto("http://127.0.0.1:8000/store/qweqwew/", wait_until="networkidle")
        await asyncio.sleep(1.5)

        p4 = os.path.join(ARTIFACT_DIR, "storefront_mobile_full.png")
        await mob_page.screenshot(path=p4)
        print(f"Saved: {p4}")

        await browser.close()
        print("All 4 design views captured successfully!")

if __name__ == '__main__':
    asyncio.run(main())
