import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storebox.settings')
django.setup()

from playwright.sync_api import sync_playwright
from apps.stores.models import Store
from apps.catalog.models import Product

def capture():
    store = Store.objects.filter(subdomain='ozodbekqq1').first() or Store.objects.first()
    product = Product.objects.filter(store=store, is_active=True).first()
    
    artifact_dir = "/Users/ozodbekmahmarayimov/.gemini/antigravity/brain/ccc1dbf4-7f6f-4914-8f98-1985c9f5cb8e"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # Desktop context
        context = browser.new_context(viewport={'width': 1280, 'height': 850})
        page = context.new_page()

        # 1. Product Detail Page
        page.goto(f"http://127.0.0.1:8000/store/{store.subdomain}/product/{product.id}/", wait_until="networkidle")
        page.screenshot(path=f"{artifact_dir}/product_detail_page.png", full_page=False)
        print("Captured product_detail_page.png")

        # 2. Customer Profile & Orders Page
        page.goto(f"http://127.0.0.1:8000/store/{store.subdomain}/profile/", wait_until="networkidle")
        page.screenshot(path=f"{artifact_dir}/customer_profile_page.png", full_page=False)
        print("Captured customer_profile_page.png")

        # 3. Dashboard Platforms Telegram Tab
        page.goto("http://127.0.0.1:8000/login/", wait_until="networkidle")
        page.fill("input[name='login']", "+998904772809")
        page.fill("input[name='password']", "admin123")
        page.click("button[type='submit']")
        page.wait_for_url("**/dashboard/**", timeout=6000)

        page.goto("http://127.0.0.1:8000/dashboard/platforms/?tab=telegram", wait_until="networkidle")
        page.screenshot(path=f"{artifact_dir}/dashboard_telegram_platform.png", full_page=False)
        print("Captured dashboard_telegram_platform.png")

        # 4. Dashboard Scoped Analytics
        page.goto("http://127.0.0.1:8000/dashboard/?period=today", wait_until="networkidle")
        page.screenshot(path=f"{artifact_dir}/dashboard_scoped_analytics.png", full_page=False)
        print("Captured dashboard_scoped_analytics.png")

        # 5. Mobile Product Detail Page
        mobile_context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True)
        mobile_page = mobile_context.new_page()
        mobile_page.goto(f"http://127.0.0.1:8000/store/{store.subdomain}/product/{product.id}/", wait_until="networkidle")
        mobile_page.screenshot(path=f"{artifact_dir}/mobile_product_detail.png", full_page=False)
        print("Captured mobile_product_detail.png")

        browser.close()

if __name__ == '__main__':
    capture()
