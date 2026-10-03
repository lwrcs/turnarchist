"""Live service-worker update and offline reopening check for a staged web build.

Run with the training WSL Python environment and an immutable web stage.
"""

import argparse
import asyncio
import functools
import json
import threading
from urllib.parse import urlsplit
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.async_api import async_playwright


class Handler(SimpleHTTPRequestHandler):
    version = 1

    def translate_path(self, request_path):
        path = urlsplit(request_path).path
        if path.startswith('/turnarchist/'):
            path = path[len('/turnarchist'):]
        return super().translate_path(path)

    def log_message(self, *_):
        pass

    def do_GET(self):
        request_path = urlsplit(self.path).path
        if request_path in ('/style.css', '/turnarchist/style.css'):
            data = (Path(self.directory, 'style.css').read_bytes() +
                    f'\n/* web-audit-version:{Handler.version} */\n'.encode())
            self.send_response(200)
            self.send_header('Content-Type', 'text/css')
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(data)
            return
        if request_path in ('/dist/bundle.js', '/turnarchist/dist/bundle.js'):
            data = (Path(self.directory, 'dist/bundle.js').read_bytes() +
                    f'\n;window.__bundleAuditVersion={Handler.version};\n'.encode())
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript')
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(data)
            return
        super().do_GET()


async def run(root):
    server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(root)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    result = {}
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True,
                executable_path='/home/harrison/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
                args=['--no-sandbox'])
            try:
                context = await browser.new_context(service_workers='allow')
                await context.route('https://**/*', lambda route: route.abort())
                page = await context.new_page()
                url = f'http://127.0.0.1:{server.server_port}/turnarchist/play.html?agent=1'
                await page.goto(url)
                await page.wait_for_function('window.agent && window.__devFingerprint')
                await page.evaluate('navigator.serviceWorker.ready')
                await page.reload()
                await page.wait_for_function('navigator.serviceWorker.controller && window.agent')
                async def style_version():
                    return await page.evaluate("""async () => {
                      const text = await (await fetch('style.css')).text();
                      return /web-audit-version:(\\d+)/.exec(text)?.[1] ?? null;
                    }""")
                result['initial_style'] = await style_version()
                result['initial_bundle'] = await page.evaluate('window.__bundleAuditVersion')
                await page.evaluate("""() => new Promise((resolve,reject) => {
                    const img = new Image(); img.onload=resolve; img.onerror=reject;
                    img.src='res/levels/0_0.png?v=online-prime';
                })""")
                Handler.version = 2
                result['updated_style'] = await style_version()
                await page.reload()
                await page.wait_for_function('window.agent && window.__bundleAuditVersion === 2')
                result['updated_bundle'] = await page.evaluate('window.__bundleAuditVersion')
                await context.set_offline(True)
                try:
                    await page.reload(timeout=12000)
                    await page.wait_for_function('window.agent && window.__devFingerprint', timeout=12000)
                    result['offline_reopen'] = True
                    result['offline_bundle'] = await page.evaluate('window.__bundleAuditVersion')
                    await page.wait_for_function("""() => {
                      const c=window.agent?.game?.constructor;
                      return c && ['tileset','objset','mobset','playerset','itemset','fxset','fontsheet']
                        .every(name=>c[name]?.complete && c[name]?.naturalWidth > 0);
                    }""", timeout=12000)
                    result['offline_sprite_sheets'] = True
                    result['offline_png_query'] = await page.evaluate("""() => new Promise(resolve => {
                        const img=new Image();img.onload=()=>resolve(img.naturalWidth>0);
                        img.onerror=()=>resolve(false);img.src='res/levels/0_0.png?v=offline-new-query';
                    })""")
                except Exception as error:
                    result['offline_reopen'] = False
                    result['offline_error'] = str(error).splitlines()[0]
                await context.close()
            finally:
                await browser.close()
    finally:
        server.shutdown()
        server.server_close()
    result['passed'] = (result['initial_style'] == '1' and result['updated_style'] == '2'
        and result['initial_bundle'] == 1 and result['updated_bundle'] == 2
        and result['offline_reopen'] and result.get('offline_bundle') == 2
        and result.get('offline_sprite_sheets') is True
        and result.get('offline_png_query') is True)
    print(json.dumps(result, indent=2))
    if not result['passed']:
        raise SystemExit(1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--web-root', type=Path, required=True)
    args = parser.parse_args()
    asyncio.run(run(args.web_root.resolve()))
