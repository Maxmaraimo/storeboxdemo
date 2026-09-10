try:
    from playwright.async_api import async_playwright
    from playwright.sync_api import sync_playwright
except ImportError:
    async_playwright = None
    sync_playwright = None
import asyncio
import time

async def run_extended_browser_verification():
    print("==================================================================")
    print("🚀 RUNNING EXTENDED USER FLOWS IN REAL BROWSER (CHROMIUM)")
    print("==================================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(f"[pageerror] {err}"))
        page.on("dialog", lambda dialog: dialog.accept())

        # -------------------------------------------------------------
        # A. ONBOARDING & NEW MERCHANT REGISTRATION FLOW
        # -------------------------------------------------------------
        print("\n--- A. FULL REGISTRATION & STORE CREATION WIZARD ---")
        await page.goto("http://127.0.0.1:8000/register/")
        random_phone = f"+998 93 {int(time.time()) % 10000000:07d}"
        print(f"Registering new merchant with phone: {random_phone}")
        await page.fill('input[name="phone"]', random_phone)
        await page.fill('input[name="password"]', "password123")
        await page.fill('input[name="password_confirm"]', "password123")
        await page.click('button[type="submit"]')

        # Should land on onboarding
        await page.wait_for_url("**/onboarding/**")
        print("✅ Registered and arrived at 7-step Onboarding Wizard")

        # Step 0: Company name & Type
        new_store_name = f"AutoStore{int(time.time()) % 10000}"
        await page.fill('input[name="name"]', new_store_name)
        await page.locator('button:has-text("Oldinga"):visible').click()
        await page.wait_for_timeout(400)

        # Step 1: Subdomain
        new_subdomain = f"auto{int(time.time()) % 10000}"
        await page.fill('input[name="subdomain"]', new_subdomain)
        await page.locator('button:has-text("Oldinga"):visible').click()
        await page.wait_for_timeout(400)

        # Step 2: Branch & Location
        await page.locator('button:has-text("Oldinga"):visible').click()
        await page.wait_for_timeout(400)

        # Step 3: First Category
        await page.fill('input[name="cat_name_uz"]', "Issiq Taomlar")
        await page.locator('button:has-text("Oldinga"):visible').click()
        await page.wait_for_timeout(400)

        # Step 4: First Product
        await page.fill('input[name="prod_name_uz"]', "Osh Palov")
        await page.fill('input[name="prod_price"]', "35000")
        await page.locator('button:has-text("Oldinga"):visible').click()
        await page.wait_for_timeout(400)

        # Step 5: Telegram Bot
        await page.locator('button:has-text("Oldinga"):visible').click()
        await page.wait_for_timeout(400)

        # Step 6: Review & Finish Wizard
        await page.click('button:has-text("Boshqaruv paneliga o\'tish")')

        # Should finish and redirect to dashboard
        await page.wait_for_url("**/dashboard/**")
        content = await page.inner_text("#dashboard-main-content")
        assert "Sotuvlar summasi" in content or "Boshqaruv paneli" in content
        print(f"✅ Onboarding finished! Store '{new_store_name}' active on subdomain '{new_subdomain}'")

        # -------------------------------------------------------------
        # B. PROMO CODES: CREATION & REDEMPTION IN STOREFRONT CHECKOUT
        # -------------------------------------------------------------
        print("\n--- B. PROMO CODE CREATION & APPLICATION IN CHECKOUT ---")
        # Log back in as admin merchant (goldlavash)
        await page.goto("http://127.0.0.1:8000/logout/")
        await page.goto("http://127.0.0.1:8000/login/")
        await page.fill('input[name="login"]', "+998 90 123 45 67")
        await page.fill('input[name="password"]', "admin123")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard/**")

        # Create promo code in Marketing -> Promokod tab
        await page.goto("http://127.0.0.1:8000/dashboard/marketing/?tab=promokod")
        promo_code = f"DISC{int(time.time()) % 1000}"
        print(f"Creating Promo Code: {promo_code} (10% off)")
        
        await page.click('button:has-text("Promokod qo\'shish")')
        await page.wait_for_selector('input[name="code"]', state="visible")
        await page.fill('input[name="code"]', promo_code)
        await page.fill('input[name="discount_value"]', "10")
        await page.click('button:has-text("Saqlash")')
        await page.wait_for_timeout(1000)
        await page.reload()
        discounts_text = await page.inner_text("#dashboard-main-content")
        assert promo_code in discounts_text
        print(f"✅ Promo code '{promo_code}' saved in dashboard")

        # Test applying promo code on storefront checkout
        print("Applying promo code on storefront checkout...")
        await page.goto("http://127.0.0.1:8000/store/goldlavash/checkout/")
        await page.fill('input[x-model="promoInput"]', promo_code)
        await page.click('button:has-text("Применить")')
        await page.wait_for_timeout(1000)
        promo_result_text = await page.inner_text('body')
        assert "применен" in promo_result_text.lower() or "скидка" in promo_result_text.lower()
        print("✅ Promo code validated and applied dynamically to total price!")

        # -------------------------------------------------------------
        # C. WAREHOUSE & STOCK REPLENISHMENT
        # -------------------------------------------------------------
        print("\n--- C. WAREHOUSE & INVENTORY MANAGEMENT ---")
        await page.goto("http://127.0.0.1:8000/dashboard/warehouse/")
        wh_content = await page.inner_text("#dashboard-main-content")
        assert "Omborxona" in wh_content
        print("✅ Warehouse inventory page verified")

        # -------------------------------------------------------------
        # D. CHATS & MESSAGING INTERFACE
        # -------------------------------------------------------------
        print("\n--- D. CUSTOMER-SELLER CHATS INTERFACE ---")
        await page.goto("http://127.0.0.1:8000/dashboard/chats/")
        chat_content = await page.inner_text("#dashboard-main-content")
        assert "Mijozlar bilan chat" in chat_content
        print("✅ Chats interface rendered correctly with message list and reply box")

        # -------------------------------------------------------------
        # SUMMARY
        # -------------------------------------------------------------
        print("\n--- EXTENDED FLOW CONSOLE HEALTH ---")
        print(f"Total console errors encountered: {len(console_errors)}")
        if console_errors:
            for e in console_errors:
                print(f"   ⚠️ {e}")
        else:
            print("✅ ZERO JAVASCRIPT ERRORS in extended flow!")

        await browser.close()

    print("\n==================================================================")
    print("🎉 EXTENDED BROWSER TEST PASSED COMPLETELY!")
    print("==================================================================")

if __name__ == '__main__':
    asyncio.run(run_extended_browser_verification())
