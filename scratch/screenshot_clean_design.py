import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await ctx.new_page()

        # Login
        await page.goto("http://127.0.0.1:8000/dashboard/login/")
        await page.fill('input[type="text"], input[name="username"], input[name="phone"]', "admin")
        await page.fill('input[type="password"]', "admin123")
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(2000)

        # Go to design page
        await page.goto("http://127.0.0.1:8000/dashboard/design/")
        await page.wait_for_timeout(3000)

        await page.screenshot(path="scratch/design_page_clean_no_ai_niches.png", full_page=False)
        print("Screenshot saved to scratch/design_page_clean_no_ai_niches.png")
        await browser.close()

asyncio.run(main())
