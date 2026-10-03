"""Exercise the staged Electron game's file:// asset paths in Chromium."""

import argparse
import asyncio
import json
from pathlib import Path

from playwright.async_api import async_playwright


async def run(app_dir):
    failures = []
    assets = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True,
            executable_path='/home/harrison/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
            args=['--no-sandbox', '--allow-file-access-from-files'])
        try:
            page = await browser.new_page()
            page.on('requestfailed', lambda request: failures.append(f'{request.url}: {request.failure}'))
            page.on('response', lambda response: assets.append({'url': response.url, 'status': response.status})
                    if response.url.startswith('file:') else None)
            await page.goto((app_dir / 'play.html').as_uri() + '?agent=1')
            await page.wait_for_function('window.agent && window.__devFingerprint', timeout=20000)
            await page.evaluate("window.agent.reset(123,{scenario:'standard',maxSteps:64})")
            await page.wait_for_function("""() => {
              const c=window.agent?.game?.constructor;
              return c && ['tileset','objset','mobset','playerset','itemset','fxset','fontsheet']
                .every(name=>c[name]?.complete && c[name]?.naturalWidth > 0);
            }""", timeout=20000)
            state = await page.evaluate("""() => {
              const g=window.agent.game, ctor=g.constructor;
              return {rooms:g.level.rooms.length, images:Object.fromEntries(
                ['tileset','objset','mobset','playerset','itemset','fxset','fontsheet'].map(
                  name=>[name,{complete:!!ctor[name]?.complete,width:ctor[name]?.naturalWidth??0,
                                url:ctor[name]?.src??null}]))};
            }""")
            result = {'page': page.url, 'rooms': state['rooms'], 'images': state['images'],
                      'file_responses': len(assets), 'failed_requests': failures}
            result['passed'] = state['rooms'] > 0 and all(i['complete'] and i['width'] > 0 for i in state['images'].values()) and not failures
            print(json.dumps(result, indent=2))
            if not result['passed']:
                raise SystemExit(1)
        finally:
            await browser.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--app-dir', type=Path, required=True)
    asyncio.run(run(parser.parse_args().app_dir.resolve()))
