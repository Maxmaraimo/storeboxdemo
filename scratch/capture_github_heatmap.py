import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2
        )
        page = await context.new_page()

        print("Navigating to /dev-login/ to authenticate...")
        await page.goto("http://localhost:8000/dev-login/?next=/dashboard/")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(2000)

        print("Locating heatmap button in chart switcher...")
        # Find the 3rd button in the chart switcher (with svg or title)
        heatmap_btn = page.locator('button[title*="GitHub"]')
        await heatmap_btn.wait_for(state="visible", timeout=10000)
        await heatmap_btn.click()
        await page.wait_for_timeout(1000)

        # Ensure heatmap container is rendered
        await page.locator('text="Real vaqtdagi buyurtmalar faolligi"').wait_for(state="visible", timeout=10000)
        print("Heatmap is visible!")

        # Find any green cell with orders in the grid (not the legend)
        green_cells = page.locator('.flex.items-center.gap-1 div.w-3.h-3[class*="bg-[#"]')
        print("Active day cells count:", await green_cells.count())
        if await green_cells.count() > 0:
            active_cell = green_cells.last # Latest active day (e.g. Sep 9 or Sep 10)
            print("Found active day cell in grid, hovering...")
            await active_cell.hover()
            await page.wait_for_timeout(800)

        out_dir = "/Users/ozodbekmahmarayimov/.gemini/antigravity/brain/ccc1dbf4-7f6f-4914-8f98-1985c9f5cb8e"
        screenshot_path = os.path.join(out_dir, "dashboard_github_heatmap_active.png")
        await page.screenshot(path=screenshot_path)
        print(f"Saved active heatmap screenshot to {screenshot_path}")

        # Now let's hover over an empty cell (e.g. level 0 cell in June)
        empty_cells = page.locator('div.w-3.h-3.rounded-\\[2\\.5px\\]:not([class*="bg-[#"])')
        total_empty = await empty_cells.count()
        print(f"Total empty cells found: {total_empty}")
        if total_empty > 50:
            mid_cell = empty_cells.nth(150)
            await mid_cell.hover()
            await page.wait_for_timeout(800)
            empty_path = os.path.join(out_dir, "dashboard_github_heatmap_empty.png")
            await page.screenshot(path=empty_path)
            print(f"Saved empty day tooltip screenshot to {empty_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
