import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACTS_DIR = "/Users/ozodbekmahmarayimov/.gemini/antigravity/brain/ccc1dbf4-7f6f-4914-8f98-1985c9f5cb8e"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await ctx.new_page()

        print("Capturing Storefront Desktop without duplicate categories...")
        await page.goto("http://127.0.0.1:8000/store/shop-655/", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Scroll to categories
        await page.evaluate("window.scrollBy(0, 320)")
        await page.wait_for_timeout(500)

        shot = os.path.join(ARTIFACTS_DIR, "storefront_categories_clean.png")
        await page.screenshot(path=shot)
        print("Saved:", shot)

        # Also capture in design studio desktop
        await page.goto("http://127.0.0.1:8000/dashboard/login/")
        await page.fill('input[type="text"], input[name="username"], input[name="phone"]', "admin")
        await page.fill('input[type="password"]', "admin123")
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(2000)

        await page.goto("http://127.0.0.1:8000/dashboard/design/")
        await page.wait_for_timeout(2000)
        shot_studio = os.path.join(ARTIFACTS_DIR, "design_studio_categories_clean.png")
        await page.screenshot(path=shot_studio)
        print("Saved:", shot_studio)

        await browser.close()

asyncio.run(main())
