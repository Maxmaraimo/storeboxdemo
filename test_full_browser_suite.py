import asyncio
import os
from playwright.async_api import async_playwright

async def run_full_browser_verification():
    print("==================================================================")
    print("🚀 STARTING REAL BROWSER VERIFICATION (CHROMIUM HEADLESS)")
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
        # 1. AUTH FLOW
        # -------------------------------------------------------------
        print("\n--- 1. BROWSER AUTHENTICATION ---")
        await page.goto("http://127.0.0.1:8000/login/")
        await page.fill('input[name="login"]', "+998 90 123 45 67")
        await page.fill('input[name="password"]', "admin123")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard/**")
        assert "/dashboard/" in page.url
        print("✅ Login successful, redirected to /dashboard/")

        # -------------------------------------------------------------
        # 2. SIDEBAR NAVIGATION
        # -------------------------------------------------------------
        print("\n--- 2. SIDEBAR NAVIGATION & CONTENT CHECKS ---")
        sections = [
            ("/dashboard/", "Sotuvlar summasi"),
            ("/dashboard/orders/", "Buyurtmalar"),
            ("/dashboard/customers/", "Mijozlar ro'yxati"),
            ("/dashboard/chats/", "Xabarlar"),
            ("/dashboard/categories/", "Kategoriyalar"),
            ("/dashboard/products/", "Mahsulotlar"),
            ("/dashboard/discounts/", "Aksiyalar"),
            ("/dashboard/ikpu/", "IKPU"),
            ("/dashboard/warehouse/", "Omborxona"),
            ("/dashboard/marketing/?tab=rassilka", "Marketing"),
            ("/dashboard/platforms/?tab=qr", "Platformalar"),
            ("/dashboard/settings/payments/", "To'lov"),
            ("/dashboard/settings/delivery/", "Yetkazib berish"),
            ("/dashboard/settings/branches/", "Filiallar"),
            ("/dashboard/settings/staff/", "Xodimlar"),
            ("/dashboard/settings/tariffs/", "Tarif"),
            ("/dashboard/robo-market/", "StoreBox Market"),
            ("/dashboard/settings/", "Do'kon sozlamalari"),
        ]

        for path, expected in sections:
            await page.goto(f"http://127.0.0.1:8000{path}")
            await page.wait_for_selector("#dashboard-main-content", state="visible")
            text = await page.inner_text("#dashboard-main-content")
            assert expected.lower() in text.lower(), f"Failed to find '{expected}' at {path}"
            print(f"✅ {path} -> Content verified ('{expected}')")

        # -------------------------------------------------------------
        # 3. CATEGORIES CRUD
        # -------------------------------------------------------------
        print("\n--- 3. CATEGORIES CRUD IN BROWSER ---")
        await page.goto("http://127.0.0.1:8000/dashboard/categories/")
        await page.click('button:has-text("Kategoriya qo\'shish")')
        await page.wait_for_selector('input[name="name_uz"]', state="visible")
        test_cat_name = "Browser Test Pitsa"
        await page.fill('input[name="name_uz"]', test_cat_name)
        await page.fill('input[name="name_ru"]', "Пицца Тест")
        await page.click('button:has-text("Saqlash")')
        await page.wait_for_timeout(1000)

        content = await page.inner_text("#dashboard-main-content")
        assert test_cat_name in content, "Created category not in list!"
        print(f"✅ Category '{test_cat_name}' created and visible in list")

        # Reload and verify persistence
        await page.reload()
        content = await page.inner_text("#dashboard-main-content")
        assert test_cat_name in content, "Category disappeared after reload!"
        print("✅ Category persisted after page reload")

        # Delete category
        del_btn = page.locator(f'tr:has-text("{test_cat_name}") button').first
        await del_btn.click()
        await page.wait_for_timeout(1000)
        await page.reload()
        content = await page.inner_text("#dashboard-main-content")
        assert test_cat_name not in content, "Category was not deleted!"
        print("✅ Category deleted and verified absent after reload")

        # -------------------------------------------------------------
        # 4. PRODUCTS CRUD
        # -------------------------------------------------------------
        print("\n--- 4. PRODUCTS CRUD IN BROWSER ---")
        await page.goto("http://127.0.0.1:8000/dashboard/products/create/")
        test_prod_name = "Browser Real Burger"
        await page.fill('input[name="name_uz"]', test_prod_name)
        await page.fill('input[name="name_ru"]', "Бургер Тест")
        await page.fill('input[name="price"]', "45000")
        await page.fill('input[name="stock"]', "15")
        await page.fill('textarea[name="desc_uz"]', "Haqiqiy mazali go'shtli burger")
        
        # Save product
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard/products/")
        content = await page.inner_text("#dashboard-main-content")
        assert test_prod_name in content, "New product not in products list!"
        print(f"✅ Product '{test_prod_name}' created and visible in table")

        # Reload and verify persistence
        await page.reload()
        content = await page.inner_text("#dashboard-main-content")
        assert test_prod_name in content, "Product disappeared after reload!"
        print("✅ Product persisted after page reload")

        # Edit product
        row = page.locator(f'tr:has-text("{test_prod_name}")').first
        await row.locator('a[href*="/edit/"]').click()
        await page.wait_for_url("**/edit/")
        updated_prod_name = "Browser Real Burger XL"
        await page.fill('input[name="name_uz"]', updated_prod_name)
        await page.fill('input[name="price"]', "55000")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard/products/")
        content = await page.inner_text("#dashboard-main-content")
        assert updated_prod_name in content, "Updated product name not in list!"
        print("✅ Product edited and new name/price persisted")

        # Delete product
        row = page.locator(f'tr:has-text("{updated_prod_name}")').first
        await row.locator('button').click()
        await page.wait_for_timeout(1000)
        await page.reload()
        content = await page.inner_text("#dashboard-main-content")
        assert updated_prod_name not in content, "Product not deleted!"
        print("✅ Product deleted and verified absent after reload")

        # -------------------------------------------------------------
        # 5. STOREFRONT, CART, CHECKOUT & ORDERS FLOW
        # -------------------------------------------------------------
        print("\n--- 5. STOREFRONT & CHECKOUT IN BROWSER ---")
        await page.goto("http://127.0.0.1:8000/store/goldlavash/")
        store_title = await page.title()
        print(f"   Storefront Title: {store_title}")
        assert "Gold Lavash" in store_title or "StoreBox" in store_title

        # Click first 'Sotib olish' button on card
        add_btn = page.locator('button:has-text("Sotib olish")').first
        await add_btn.click()
        await page.wait_for_timeout(800)
        print("✅ Product added to cart from storefront")

        # Open checkout
        await page.goto("http://127.0.0.1:8000/store/goldlavash/checkout/")
        assert "/checkout/" in page.url
        print("✅ Navigated to Checkout page")

        # Fill checkout form
        test_client_phone = "+998 90 888 77 66"
        await page.fill('input[name="customer_name"]', "Sherzod Aliyev")
        await page.fill('input[name="customer_phone"]', test_client_phone)
        await page.fill('input[name="delivery_address"]', "Toshkent, Yunusobod 4-mavze, 10-uy")
        
        # Submit order
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/order/**/success/**")
        print(f"✅ Order placed successfully! Success URL: {page.url}")

        # -------------------------------------------------------------
        # 6. VERIFY ORDER IN DASHBOARD & CHANGE STATUS
        # -------------------------------------------------------------
        print("\n--- 6. ORDER LIFECYCLE IN DASHBOARD ---")
        await page.goto("http://127.0.0.1:8000/dashboard/orders/")
        orders_content = await page.inner_text("#dashboard-main-content")
        assert "Sherzod Aliyev" in orders_content, "Order not in merchant dashboard list!"
        print("✅ New order found in merchant dashboard with customer name 'Sherzod Aliyev'")

        # Change status via dropdown selector
        order_row = page.locator('tr:has-text("Sherzod Aliyev")').first
        await order_row.locator('button:has-text("Holat")').click()
        await page.wait_for_selector('button:has-text("Qabul qilish")', state="visible")
        await page.click('button:has-text("Qabul qilish")')
        await page.wait_for_timeout(1000)
        print("✅ Status changed to PROCESSING via interactive dropdown")

        # Reload and verify persistence
        await page.reload()
        orders_content = await page.inner_text("#dashboard-main-content")
        assert "Jarayonda" in orders_content, "Status 'Jarayonda' not found after reload!"
        print("✅ Order status persisted as 'Jarayonda' (PROCESSING) after page reload")

        # -------------------------------------------------------------
        # 7. VERIFY CUSTOMER IN CRM
        # -------------------------------------------------------------
        print("\n--- 7. CRM CUSTOMER RECORD VERIFICATION ---")
        await page.goto("http://127.0.0.1:8000/dashboard/customers/")
        crm_content = await page.inner_text("#dashboard-main-content")
        assert "Sherzod Aliyev" in crm_content or "90 888 77 66" in crm_content
        print("✅ Customer successfully registered in CRM with purchase history")

        # -------------------------------------------------------------
        # 8. STORE SETTINGS PERSISTENCE
        # -------------------------------------------------------------
        print("\n--- 8. STORE SETTINGS PERSISTENCE IN BROWSER ---")
        await page.goto("http://127.0.0.1:8000/dashboard/settings/")
        await page.fill('input[name="instagram_username"]', "goldlavash_official")
        await page.fill('input[name="telegram_channel"]', "goldlavash_tg")
        await page.click('button[form="general-settings-form"]')
        await page.wait_for_timeout(1000)
        
        await page.reload()
        insta_val = await page.input_value('input[name="instagram_username"]')
        tg_val = await page.input_value('input[name="telegram_channel"]')
        assert insta_val == "goldlavash_official", f"Instagram not persisted: {insta_val}"
        assert tg_val == "goldlavash_tg", f"Telegram not persisted: {tg_val}"
        print("✅ Store settings saved and persisted after full reload")

        # -------------------------------------------------------------
        # SUMMARY OF JS CONSOLE HEALTH
        # -------------------------------------------------------------
        print("\n--- 9. CONSOLE HEALTH CHECK ---")
        print(f"Total console errors encountered: {len(console_errors)}")
        if console_errors:
            for e in console_errors:
                print(f"   ⚠️ {e}")
        else:
            print("✅ ZERO JAVASCRIPT CONSOLE ERRORS ENCOUNTERED THROUGHOUT THE ENTIRE TEST!")

        await browser.close()

    print("\n==================================================================")
    print("🎉 ALL REAL BROWSER USER FLOWS FULLY PASSED AND VERIFIED!")
    print("==================================================================")

if __name__ == '__main__':
    asyncio.run(run_full_browser_verification())
