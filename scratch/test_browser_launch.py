import asyncio
from playwright.async_api import async_playwright

async def test_launch():
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox', '--single-process', '--disable-dev-shm-usage', '--disable-gpu']
            )
            print("Successfully launched chromium!")
            await browser.close()
    except Exception as e:
        print("Launch failed:", type(e), e)

if __name__ == '__main__':
    asyncio.run(test_launch())
