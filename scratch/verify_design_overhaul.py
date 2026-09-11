import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACTS_DIR = "/Users/ozodbekmahmarayimov/.gemini/antigravity/brain/ccc1dbf4-7f6f-4914-8f98-1985c9f5cb8e"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await ctx.new_page()

        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_logs.append(f"[PAGE ERROR] {err}"))
        page.on("requestfailed", lambda req: console_logs.append(f"[REQ FAILED] {req.url}"))

        # Login
        await page.goto("http://127.0.0.1:8000/dashboard/login/")
        await page.fill('input[type="text"], input[name="username"], input[name="phone"]', "admin")
        await page.fill('input[type="password"]', "admin123")
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(2000)

        # 1. Open Design Studio Page
        print("1. Opening /dashboard/design/...")
        await page.goto("http://127.0.0.1:8000/dashboard/design/")
        await page.wait_for_timeout(2500)

        shot1 = os.path.join(ARTIFACTS_DIR, "design_studio_desktop_view.png")
        await page.screenshot(path=shot1, full_page=False)
        print("   Saved:", shot1)

        # 2. Switch to Mobile Device Preview
        print("2. Switching to Mobile Preview...")
        mob_btn = page.locator('button:has-text("Telefon (Mobil)")')
        if await mob_btn.count() > 0:
            await mob_btn.click()
            await page.wait_for_timeout(1500)
            shot2 = os.path.join(ARTIFACTS_DIR, "design_studio_mobile_view.png")
            await page.screenshot(path=shot2, full_page=False)
            print("   Saved:", shot2)

        # 3. Click Tab 2 (Ranglar & Uslub)
        print("3. Switching to Tab 2 (Ranglar & Uslub)...")
        tab_colors = page.locator('button:has-text("2. Ranglar")')
        if await tab_colors.count() > 0:
            await tab_colors.click()
            await page.wait_for_timeout(800)
            shot3 = os.path.join(ARTIFACTS_DIR, "design_studio_tab_colors.png")
            await page.screenshot(path=shot3, full_page=False)
            print("   Saved:", shot3)

        # 4. Click a color preset and click Save
        print("4. Clicking color and Save button...")
        emerald_btn = page.locator('button:has-text("Zumrad Yashil")')
        if await emerald_btn.count() > 0:
            await emerald_btn.click()
            await page.wait_for_timeout(500)

        save_btn = page.locator('button:has-text("Saqlash va qo\'llash")').first
        if await save_btn.count() > 0:
            await save_btn.click()
            await page.wait_for_timeout(1500)
            shot4 = os.path.join(ARTIFACTS_DIR, "design_studio_saved.png")
            await page.screenshot(path=shot4, full_page=False)
            print("   Saved:", shot4)

        # 5. Check Storefront directly to confirm burger icon is GONE from header
        print("5. Checking Storefront Header (Zero Burger Icon)...")
        await page.goto("http://127.0.0.1:8000/store/shop-655/")
        await page.wait_for_timeout(1500)
        shot5 = os.path.join(ARTIFACTS_DIR, "storefront_header_no_burger.png")
        await page.screenshot(path=shot5, full_page=False)
        print("   Saved:", shot5)

        # Also check storefront on mobile
        mobile_ctx = await browser.new_context(
            viewport={'width': 393, 'height': 852},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
        )
        m_page = await mobile_ctx.new_page()
        await m_page.goto("http://127.0.0.1:8000/store/shop-655/")
        await m_page.wait_for_timeout(1500)
        shot6 = os.path.join(ARTIFACTS_DIR, "storefront_mobile_header_no_burger.png")
        await m_page.screenshot(path=shot6, full_page=False)
        print("   Saved:", shot6)

        print("\nConsole and Network logs:")
        err_count = 0
        for l in console_logs:
            if "REQ FAILED" in l or "PAGE ERROR" in l or "error" in l.lower():
                print("  [ALERT]", l)
                err_count += 1
        print(f"Total critical errors found: {err_count}")

        await browser.close()

asyncio.run(main())
