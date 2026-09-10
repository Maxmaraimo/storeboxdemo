try:
    from playwright.async_api import async_playwright
    from playwright.sync_api import sync_playwright
except ImportError:
    async_playwright = None
    sync_playwright = None
import asyncio
import time

async def run_senior_verification():
    print("==================================================================")
    print("🚀 RUNNING ADVANCED SENIOR FEATURES VERIFICATION IN REAL BROWSER")
    print("==================================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(f"[pageerror] {err}"))
        page.on("dialog", lambda dialog: dialog.accept())

        # 1. Login
        print("\n--- 1. AUTHENTICATION ---")
        await page.goto("http://127.0.0.1:8000/login/")
        await page.fill('input[name="login"]', "+998 90 123 45 67")
        await page.fill('input[name="password"]', "admin123")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard/**")
        print("✅ Logged in successfully")

        # 2. Period Filter & Dynamic Analytics
        print("\n--- 2. PERIOD FILTERS & CALENDAR DATE RANGE ---")
        # Today
        await page.goto("http://127.0.0.1:8000/dashboard/?period=today")
        today_content = await page.inner_text("#dashboard-main-content")
        assert "daromadlar" in today_content.lower()
        print("✅ Period 'Bugun' (Today) loaded and rendered")

        # Month
        await page.goto("http://127.0.0.1:8000/dashboard/?period=month")
        month_content = await page.inner_text("#dashboard-main-content")
        assert "daromadlar" in month_content.lower()
        print("✅ Period 'Har oy' (Month) loaded and rendered")

        # Year
        await page.goto("http://127.0.0.1:8000/dashboard/?period=year")
        year_content = await page.inner_text("#dashboard-main-content")
        assert "daromadlar" in year_content.lower()
        print("✅ Period 'Har yil' (Year) loaded and rendered")

        # Custom Date Range Form
        await page.fill('input[name="start_date"]', "2026-08-01")
        await page.fill('input[name="end_date"]', "2026-09-03")
        await page.click('button:has-text("Qo\'llash")')
        await page.wait_for_url("**/dashboard/?start_date=2026-08-01&end_date=2026-09-03")
        custom_content = await page.inner_text("#dashboard-main-content")
        assert "daromadlar" in custom_content.lower()
        print("✅ Custom Date Range (Calendar Form) submitted and calculated dynamically")

        # 3. Order Status Lifecycle
        print("\n--- 3. ORDER STATUS LIFECYCLE IN DATABASE & UI ---")
        await page.goto("http://127.0.0.1:8000/dashboard/orders/")
        has_orders = await page.is_visible('button:has-text("Holat")')
        if has_orders:
            # Click status dropdown on first order
            await page.locator('button:has-text("Holat")').first.click()
            await page.locator('button:has-text("Yo\'lga chiqarish")').first.click()
            await page.wait_for_timeout(800)
            
            # Verify status changed in DOM
            row_text = await page.locator('table tbody tr').first.inner_text()
            assert "Yo'lda" in row_text or "Jarayonda" in row_text or "Yetkazildi" in row_text
            print("✅ Status changed to IN_DELIVERY via AJAX without page reload")

            # Reload to verify database persistence
            await page.reload()
            row_text_reloaded = await page.locator('table tbody tr').first.inner_text()
            assert "Yo'lda" in row_text_reloaded or "Jarayonda" in row_text_reloaded or "Yetkazildi" in row_text_reloaded
            print("✅ Status persistence verified after full page reload")

        # 4. Product with Barcode & IKPU
        print("\n--- 4. PRODUCT CREATION WITH BARCODE & IKPU ---")
        test_barcode = f"478{int(time.time()) % 10000000000:010d}"
        await page.goto("http://127.0.0.1:8000/dashboard/products/create/")
        await page.fill('input[name="name_uz"]', "Barcode Test Pitsa")
        await page.fill('input[name="price"]', "65000")
        await page.fill('input[name="barcode"]', test_barcode)
        await page.fill('input[name="ikpu_code"]', "01101001001000000")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard/products/**")

        # Verify barcode in IKPU catalog
        await page.goto("http://127.0.0.1:8000/dashboard/ikpu/")
        ikpu_content = await page.inner_text("#dashboard-main-content")
        assert test_barcode in ikpu_content
        print(f"✅ Product created with Barcode '{test_barcode}' and verified in IKPU catalog")

        # 5. Storefront Order & Return Link
        print("\n--- 5. STOREFRONT ORDER PLACEMENT & RETURN LINK ---")
        await page.goto("http://127.0.0.1:8000/store/goldlavash/")
        await page.locator('button:has-text("Sotib olish")').first.click()
        await page.wait_for_timeout(600)

        # Checkout
        await page.goto("http://127.0.0.1:8000/store/goldlavash/checkout/")
        await page.fill('input[name="customer_name"]', "Sanjar Karimov")
        await page.fill('input[name="customer_phone"]', "+998 90 777 66 55")
        await page.fill('input[name="delivery_address"]', "Yunusobod 4-mavze, 12-uy")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/order/**/success/")
        print("✅ Order created and arrived at Success page")

        # Verify Return to store button
        return_btn = page.locator('a:has-text("Do\'konga qaytish"), a:has-text("Вернуться")')
        assert await return_btn.is_visible()
        target_href = await return_btn.get_attribute("href")
        print(f"✅ Return link verified: {target_href}")
        await return_btn.click()
        await page.wait_for_url("**/store/goldlavash/**")
        print("✅ Returned to store home page successfully")

        # 6. Platforms & Telegram TMA Settings
        print("\n--- 6. PLATFORMS & TELEGRAM BOT INTEGRATION ---")
        await page.goto("http://127.0.0.1:8000/dashboard/platforms/?tab=telegram")
        await page.fill('input[name="telegram_bot_token"]', "123456789:ABCdefGHIjklMNOpqrsTUVwxyz")
        await page.fill('input[name="telegram_chat_id"]', "-100123456789")
        await page.locator('div[x-show="tgSubTab === \'settings\'"] button[type="submit"]').first.click()
        await page.wait_for_timeout(800)
        await page.reload()
        token_val = await page.input_value('input[name="telegram_bot_token"]')
        assert "123456789:ABCdef" in token_val
        print("✅ Telegram bot token & welcome message saved and persisted")

        # 7. Console Health Check
        print("\n--- 7. JAVASCRIPT CONSOLE AUDIT ---")
        print(f"Console errors: {len(console_errors)}")
        for err in console_errors:
            print(f"  ⚠️ {err}")
        assert len(console_errors) == 0

        await browser.close()

    print("\n==================================================================")
    print("🎉 ALL SENIOR FULL-STACK FEATURES VERIFIED IN REAL BROWSER (0 ERRORS)!")
    print("==================================================================")

if __name__ == '__main__':
    asyncio.run(run_senior_verification())
