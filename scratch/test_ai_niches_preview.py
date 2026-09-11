import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={'width': 1440, 'height': 960})
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

        # 1. Click Flowers (🌸)
        print("Clicking Flowers preset...")
        btn_flowers = page.locator('button:has-text("🌸")')
        await btn_flowers.scroll_into_view_if_needed()
        await btn_flowers.click()
        await page.wait_for_timeout(2500)
        await page.screenshot(path="scratch/niche_flowers.png", full_page=False)
        print("Saved scratch/niche_flowers.png")

        # 2. Click Restaurant (🍽️)
        print("Clicking Restaurant preset...")
        btn_rest = page.locator('button:has-text("🍽️")')
        await btn_rest.scroll_into_view_if_needed()
        await btn_rest.click()
        await page.wait_for_timeout(2500)
        await page.screenshot(path="scratch/niche_restaurant.png", full_page=False)
        print("Saved scratch/niche_restaurant.png")

        # 3. Click Fashion (👗)
        print("Clicking Fashion preset...")
        btn_fashion = page.locator('button:has-text("👗")')
        await btn_fashion.scroll_into_view_if_needed()
        await btn_fashion.click()
        await page.wait_for_timeout(2500)
        await page.screenshot(path="scratch/niche_fashion.png", full_page=False)
        print("Saved scratch/niche_fashion.png")

        # 4. Click Tech (📱)
        print("Clicking Tech preset...")
        btn_tech = page.locator('button:has-text("📱")')
        await btn_tech.scroll_into_view_if_needed()
        await btn_tech.click()
        await page.wait_for_timeout(2500)
        await page.screenshot(path="scratch/niche_tech.png", full_page=False)
        print("Saved scratch/niche_tech.png")

        print("Finished all niche clicks and screenshots!")
        await browser.close()

asyncio.run(main())
