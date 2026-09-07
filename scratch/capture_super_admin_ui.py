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
from playwright.async_api import async_playwright

ARTIFACT_DIR = "/Users/ozodbekmahmarayimov/.gemini/antigravity/brain/ccc1dbf4-7f6f-4914-8f98-1985c9f5cb8e"

async def main():
    admin = User.objects.filter(is_superuser=True).first()
    session = SessionStore()
    session['_auth_user_id'] = str(admin.pk)
    session['_auth_user_backend'] = 'django.contrib.auth.backends.ModelBackend'
    session['_auth_user_hash'] = admin.get_session_auth_hash()
    session.save()
    session_key = session.session_key
    print(f"Created superuser session: {session_key}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        
        await context.add_cookies([
            {
                'name': 'sessionid',
                'value': session_key,
                'domain': '127.0.0.1',
                'path': '/',
                'httpOnly': True,
            }
        ])

        page = await context.new_page()

        print("1. Capturing Super Admin Servers List...")
        await page.goto("http://127.0.0.1:8000/super-admin/servers/", wait_until="domcontentloaded")
        await asyncio.sleep(2)
        servers_png = os.path.join(ARTIFACT_DIR, "super_admin_servers_list.png")
        await page.screenshot(path=servers_png, full_page=False)
        print(f"Saved: {servers_png}")

        print("2. Capturing Tenant Detail (Information Tab)...")
        await page.goto("http://127.0.0.1:8000/super-admin/servers/19/?tab=info", wait_until="domcontentloaded")
        await asyncio.sleep(2)
        detail_info_png = os.path.join(ARTIFACT_DIR, "super_admin_server_detail_info.png")
        await page.screenshot(path=detail_info_png, full_page=False)
        print(f"Saved: {detail_info_png}")

        print("3. Capturing Tenant Reconciliation (Сверка)...")
        await page.goto("http://127.0.0.1:8000/super-admin/servers/19/?tab=reconciliation", wait_until="domcontentloaded")
        await asyncio.sleep(2)
        rec_png = os.path.join(ARTIFACT_DIR, "super_admin_server_reconciliation.png")
        await page.screenshot(path=rec_png, full_page=False)
        print(f"Saved: {rec_png}")

        print("4. Capturing Tenant Subscriptions (Подписки & BUY)...")
        await page.goto("http://127.0.0.1:8000/super-admin/servers/19/?tab=subscriptions", wait_until="domcontentloaded")
        await asyncio.sleep(2)
        subs_png = os.path.join(ARTIFACT_DIR, "super_admin_server_subscriptions.png")
        await page.screenshot(path=subs_png, full_page=False)
        print(f"Saved: {subs_png}")

        print("5. Capturing SaaS Reports & Global Analytics...")
        await page.goto("http://127.0.0.1:8000/super-admin/reports/", wait_until="domcontentloaded")
        await asyncio.sleep(2)
        reports_png = os.path.join(ARTIFACT_DIR, "super_admin_reports.png")
        await page.screenshot(path=reports_png, full_page=False)
        print(f"Saved: {reports_png}")

        await browser.close()
        print("\nAll UI screenshots captured successfully!")

if __name__ == '__main__':
    asyncio.run(main())
