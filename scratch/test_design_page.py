import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await ctx.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_errors.append(f"[PAGE ERROR] {err}"))

        # Login
        await page.goto("http://127.0.0.1:8000/dashboard/login/")
        await page.fill('input[type="text"], input[name="username"], input[name="phone"]', "admin")
        await page.fill('input[type="password"]', "admin123")
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(2000)

        # Go to design page
        print("Navigating to /dashboard/design/...")
        await page.goto("http://127.0.0.1:8000/dashboard/design/")
        await page.wait_for_timeout(3000)

        print("Page URL:", page.url)
        print("Console logs:")
        for log in console_errors:
            print("  ", log)

        await page.screenshot(path="scratch/page_design_current.png", full_page=True)
        print("Saved scratch/page_design_current.png")

        await browser.close()

asyncio.run(main())
