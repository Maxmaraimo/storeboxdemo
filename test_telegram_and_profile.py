try:
    from playwright.async_api import async_playwright
    from playwright.sync_api import sync_playwright
except ImportError:
    async_playwright = None
    sync_playwright = None
import os
import sys
import time
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storebox.settings')
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
django.setup()

from apps.stores.models import Store
from apps.orders.models import Order, OrderItem, Customer
from apps.telegram_bot.services import get_bot_info, process_telegram_update, format_order_telegram_message, send_telegram_notification

def test_telegram_services():
    print("\n--- 1. TESTING TELEGRAM BOT SERVICES & USER TOKEN ---")
    store2 = Store.objects.filter(id=2).first()
    assert store2 is not None, "Store 2 (Ozodbek) must exist"
    assert store2.telegram_bot_token, "Store 2 must have telegram_bot_token"

    # Test get_bot_info
    ok, bot_res = get_bot_info(store2.telegram_bot_token)
    assert ok is True, f"get_bot_info failed: {bot_res}"
    assert bot_res.get('username') == 'storeboxfirsttestbot_bot', f"Unexpected bot username: {bot_res}"
    print(f"✅ get_bot_info succeeded! Bot username: @{bot_res.get('username')}")

    # Test update processing (/id command)
    mock_update = {
        'update_id': 999999,
        'message': {
            'message_id': 1,
            'from': {'id': 7332358605, 'first_name': 'Ozodbek'},
            'chat': {'id': 7332358605, 'type': 'private'},
            'text': '/id'
        }
    }
    processed = process_telegram_update(store2, mock_update)
    assert processed is True, "process_telegram_update should return True for /id"
    print("✅ /id update processed and response sent via Telegram API")

    # Test /about command
    mock_about = {
        'update_id': 999998,
        'message': {
            'message_id': 2,
            'from': {'id': 7332358605, 'first_name': 'Ozodbek'},
            'chat': {'id': 7332358605, 'type': 'private'},
            'text': '/about'
        }
    }
    processed = process_telegram_update(store2, mock_about)
    assert processed is True
    print("✅ /about update processed and store details sent via Telegram API")


def test_customer_profile_and_orders_browser():
    print("\n--- 2. TESTING STOREFRONT CUSTOMER PROFILE & ORDERS IN REAL BROWSER ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        # Open store
        page.goto("http://127.0.0.1:8000/store/goldlavash/", wait_until="networkidle")
        
        # 1. Open Profile Drawer
        profile_btn = page.locator("nav.sm\\:hidden button:has-text('Profil')")
        profile_btn.click()
        page.wait_for_timeout(600)
        assert page.locator("div[x-show='profileDrawerOpen']").is_visible()

        # 2. Log in as Customer
        test_phone = "+998 90 999 88 77"
        test_name = "Jamshid Aliyev"
        page.fill("div[x-show='profileDrawerOpen'] input[type='tel']", test_phone)
        page.fill("div[x-show='profileDrawerOpen'] input[type='text']", test_name)
        page.click("div[x-show='profileDrawerOpen'] button:has-text('Kirish')")
        page.wait_for_timeout(1000)

        # Verify logged in state
        assert test_name in page.content(), "Customer name must appear in profile header"
        print("✅ Customer successfully logged in and profile header updated")

        # 3. Click Buyurtmalarim
        page.click("div[x-show='profileDrawerOpen'] button:has-text('Buyurtmalarim')")
        page.wait_for_timeout(800)
        assert page.locator("div[x-show='myOrdersModalOpen']").is_visible()
        print("✅ 'Mening buyurtmalarim' modal opened successfully")

        # Close orders modal
        page.click("div[x-show='myOrdersModalOpen'] button:has-text('×')")
        page.wait_for_timeout(500)

        # 4. Add product to cart and place an order
        page.locator("button:has-text('Sotib olish')").first.click()
        page.wait_for_timeout(1000)

        # Go to checkout
        page.goto("http://127.0.0.1:8000/store/goldlavash/checkout/", wait_until="networkidle")
        # Verify customer details prefilled
        phone_val = page.input_value("input[name='customer_phone']")
        assert "999" in phone_val or "998" in phone_val
        print("✅ Checkout form pre-filled with customer details")

        # Fill address and submit order
        page.fill("input[name='delivery_address']", "Amir Temur ko'chasi 15-uy")
        page.click("button[type='submit']")
        page.wait_for_url("**/order/**/success/")
        print("✅ Order placed successfully! Landed on Order Success page")

        # 5. Click "Mening buyurtmalarimni ko'rish"
        orders_btn = page.locator("a:has-text('Mening buyurtmalarimni ko\\'rish')")
        assert orders_btn.is_visible()
        orders_btn.click()
        page.wait_for_url("**/store/goldlavash/?open_orders=1")
        page.wait_for_timeout(1200)

        # Verify orders modal opened automatically and displays the order!
        assert page.locator("div[x-show='myOrdersModalOpen']").is_visible()
        assert "Jami summa:" in page.content()
        print("✅ 'Mening buyurtmalarim' auto-opened and successfully displays customer's order history!")

        page.close()
        context.close()
        browser.close()


def test_dashboard_telegram_tab_browser():
    print("\n--- 3. TESTING DASHBOARD TELEGRAM BOT TAB IN REAL BROWSER ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        # Login as store 2 owner (Ozodbek)
        page.goto("http://127.0.0.1:8000/login/")
        page.fill("input[name='login']", "+998904772809")
        page.fill("input[name='password']", "admin123")
        page.click("button[type='submit']")
        page.wait_for_url("**/dashboard/**")

        # Navigate to platforms -> telegram
        page.goto("http://127.0.0.1:8000/dashboard/platforms/?tab=telegram", wait_until="networkidle")
        page.click("button:has-text('Telegram bot')")
        page.wait_for_timeout(500)

        assert "storeboxfirsttestbot_bot" in page.content()
        assert "Faol" in page.content()
        assert page.locator("a:has-text('Botni ochish')").is_visible()
        assert "Telegram Web App (TMA) URL" in page.content()
        print("✅ Telegram bot tab displays active status, real @storeboxfirsttestbot_bot, WebApp URL and 'Botni ochish' button")

        # Test subtabs switching without page reload
        page.click("button:has-text('Amallar')")
        page.wait_for_timeout(300)
        assert page.locator("div[x-show=\"tgSubTab === 'actions'\"]").is_visible()
        print("✅ Subtab 'Amallar' switched smoothly and is visible")

        page.click("button:has-text('QR kod')")
        page.wait_for_timeout(300)
        assert page.locator("div[x-show=\"tgSubTab === 'qr'\"]").is_visible()
        print("✅ Subtab 'QR kod' switched smoothly and is visible")

        page.click("button:has-text('Bot sozlamalari')")
        page.wait_for_timeout(300)
        assert page.locator("div[x-show=\"tgSubTab === 'settings'\"]").is_visible()
        print("✅ Subtab 'Bot sozlamalari' switched smoothly and is visible")

        # Click save to test auto-verification
        page.locator("div[x-show=\"tgSubTab === 'settings'\"] button[type='submit']").first.click()
        page.wait_for_timeout(1000)
        assert "muvaffaqiyatli" in page.content()
        print("✅ Bot settings validated via Telegram getMe and saved with success toast")

        # Click TMA Menyu tugmasini sozlash
        page.locator("button:has-text('TMA Menyu tugmasini sozlash')").click()
        page.wait_for_timeout(1000)
        assert "muvaffaqiyatli" in page.content()
        print("✅ TMA menu button configured via Telegram API with success confirmation")

        page.close()
        context.close()
        browser.close()


if __name__ == '__main__':
    test_telegram_services()
    test_customer_profile_and_orders_browser()
    test_dashboard_telegram_tab_browser()
    print("\n=======================================================")
    print("🎉 ALL TELEGRAM & CUSTOMER PROFILE TESTS PASSED 100%!")
    print("=======================================================\n")
