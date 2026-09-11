import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # 1. Storefront context (Mobile 400x750)
        cust_ctx = await browser.new_context(viewport={'width': 400, 'height': 750})
        cust_page = await cust_ctx.new_page()

        print("1. Opening customer storefront...")
        await cust_page.goto("http://127.0.0.1:8000/store/shop-655/")
        await cust_page.wait_for_timeout(2000)
        await cust_page.screenshot(path="scratch/storefront_mobile_bottom_bar.png")
        print("Saved scratch/storefront_mobile_bottom_bar.png")

        # 2. Click Live Chat icon in bottom bar
        print("2. Opening Live Chat modal...")
        chat_btn = cust_page.locator('nav button[title="Sotuvchi bilan chat"]')
        await chat_btn.click()
        await cust_page.wait_for_timeout(1000)

        # 3. Enter phone and message
        print("3. Typing customer message...")
        phone_input = cust_page.locator('input[placeholder="+998 90 ..."]')
        if await phone_input.is_visible():
            await phone_input.fill("+998 90 999 88 77")

        msg_input = cust_page.locator('input[placeholder="Xabaringizni yozing..."]')
        await msg_input.fill("Salom! Men yangi buyurtma bermoqchiman, yetkazib berish bepulmi?")
        await cust_page.wait_for_timeout(500)

        # Send message
        send_btn = cust_page.locator('form:has(input[placeholder="Xabaringizni yozing..."]) button[type="submit"]')
        await send_btn.click()
        await cust_page.wait_for_timeout(2000)
        await cust_page.screenshot(path="scratch/storefront_customer_chat_sent.png")
        print("Saved scratch/storefront_customer_chat_sent.png")

        # 4. Merchant Dashboard Context (Desktop 1440x900)
        dash_ctx = await browser.new_context(viewport={'width': 1440, 'height': 900})
        dash_page = await dash_ctx.new_page()

        print("4. Logging into merchant dashboard...")
        await dash_page.goto("http://127.0.0.1:8000/dashboard/login/")
        await dash_page.fill('input[type="text"], input[name="username"], input[name="phone"]', "admin")
        await dash_page.fill('input[type="password"]', "admin123")
        await dash_page.click('button[type="submit"]')
        await dash_page.wait_for_timeout(2000)

        print("5. Navigating to /dashboard/chats/...")
        await dash_page.goto("http://127.0.0.1:8000/dashboard/chats/")
        await dash_page.wait_for_timeout(2500)
        await dash_page.screenshot(path="scratch/dashboard_chats_received.png")
        print("Saved scratch/dashboard_chats_received.png")

        # 6. Merchant replies
        print("6. Merchant sending reply...")
        reply_input = dash_page.locator('input[placeholder="Xabaringizni yozing..."]')
        await reply_input.fill("Assalomu alaykum! Ha, albatta, 100 000 so'mdan yuqori buyurtmalarga yetkazib berish mutlaqo bepul!")
        reply_btn = dash_page.locator('form:has(input[placeholder="Xabaringizni yozing..."]) button[type="submit"]')
        await reply_btn.click()
        await dash_page.wait_for_timeout(2000)
        await dash_page.screenshot(path="scratch/dashboard_chats_replied.png")
        print("Saved scratch/dashboard_chats_replied.png")

        # 7. Check Customer storefront for merchant reply (polling)
        print("7. Checking customer storefront for merchant reply...")
        await cust_page.wait_for_timeout(3500)
        await cust_page.screenshot(path="scratch/storefront_customer_chat_replied.png")
        print("Saved scratch/storefront_customer_chat_replied.png")

        await browser.close()
        print("Live chat E2E test finished successfully!")

asyncio.run(main())
