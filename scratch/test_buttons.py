import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await ctx.new_page()

        errors = []
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: errors.append(f"[PAGE ERROR] {err}"))
        page.on("requestfailed", lambda req: errors.append(f"[REQ FAILED] {req.url} {req.failure}"))

        # Login
        await page.goto("http://127.0.0.1:8000/dashboard/login/")
        await page.fill('input[type="text"], input[name="username"], input[name="phone"]', "admin")
        await page.fill('input[type="password"]', "admin123")
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(2000)

        await page.goto("http://127.0.0.1:8000/dashboard/design/")
        await page.wait_for_timeout(2000)

        print("--- CLICKING TEMPLATE BUTTONS ---")
        for tpl in ["Restoran & Yetkazib berish", "Universal do'kon", "Vizual Butik & Moda"]:
            btn = page.locator(f'button:has-text("{tpl}")')
            if await btn.count() > 0:
                print(f"Clicking template: {tpl}")
                await btn.click()
                await page.wait_for_timeout(1000)

        print("--- CLICKING MOBILE PREVIEW BUTTON ---")
        mob_btn = page.locator('button:has-text("Mobil (iPhone)")')
        if await mob_btn.count() > 0:
            await mob_btn.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path="scratch/preview_mobile_frame.png")
            print("Saved scratch/preview_mobile_frame.png")

        print("--- CLICKING DESKTOP PREVIEW BUTTON ---")
        desk_btn = page.locator('button:has-text("Desktop")')
        if await desk_btn.count() > 0:
            await desk_btn.click()
            await page.wait_for_timeout(1000)

        print("--- CLICKING SAVE BUTTON ---")
        save_btn = page.locator('button:has-text("Saqlash va qo\'llash")').first
        if await save_btn.count() > 0:
            await save_btn.click()
            await page.wait_for_timeout(2000)

        print("--- CLICKING COLOR BUTTONS ---")
        color_btns = page.locator('input[type="color"]')
        print("Color inputs count:", await color_btns.count())

        print("Errors and logs:")
        for e in errors:
            print("  ", e)

        await browser.close()

asyncio.run(main())
