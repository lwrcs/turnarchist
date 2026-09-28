"""Exercise the ordinary browser's cookie Save V2 and Continue UI.

Run against a fresh `stage-web-release.cjs` directory, never a watcher's dist/.
This uses the game's read-only fingerprints; it does not mock save/load or set
the game RNG. Every fresh random seed is recorded, including failed cases.
"""

import argparse
import asyncio
import functools
import hashlib
import json
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from importlib.metadata import version
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright

KEYS = ("ArrowRight", "ArrowUp", "ArrowDown", "ArrowLeft")
VIEWPORT = {"width": 1000, "height": 800}


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *_args):
        pass


def first_difference(left, right, path="$"):
    if type(left) is not type(right):
        return {"path": path, "left": left, "right": right}
    if isinstance(left, dict):
        for key in sorted(set(left) | set(right)):
            child = f"{path}.{key}"
            if key not in left or key not in right:
                return {"path": child, "left": left.get(key, "<missing>"),
                        "right": right.get(key, "<missing>")}
            difference = first_difference(left[key], right[key], child)
            if difference:
                return difference
    elif isinstance(left, list):
        if len(left) != len(right):
            return {"path": f"{path}.length", "left": len(left), "right": len(right)}
        for index, (a, b) in enumerate(zip(left, right)):
            difference = first_difference(a, b, f"{path}[{index}]")
            if difference:
                return difference
    elif left != right:
        return {"path": path, "left": left, "right": right}
    return None


def require_equal(left, right, label):
    difference = first_difference(left, right)
    if difference:
        raise AssertionError(f"{label}: {json.dumps(difference, ensure_ascii=False)}")


def digest(value):
    raw = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(raw).hexdigest()


def turn_count(fingerprint):
    return fingerprint["playerFingerprints"][0]["turnCount"]


async def fingerprint(page):
    return await page.evaluate("window.__devFingerprint()")


async def replay_stats(page):
    return await page.evaluate("window.__devReplayStats()")


async def press_and_settle(page, key):
    await page.keyboard.press(key)
    await page.wait_for_timeout(450)


async def local_requests_only(route):
    if urlparse(route.request.url).hostname in ("127.0.0.1", "localhost"):
        await route.continue_()
    else:
        await route.abort()


async def one_case(browser, url, index):
    record = {"case": index, "status": "running", "inputs": [], "pageErrors": []}
    original_context = await browser.new_context(viewport=VIEWPORT, service_workers="block")
    restored_context = None
    await original_context.route("**/*", local_requests_only)
    try:
        original = await original_context.new_page()
        original.on("pageerror", lambda error: record["pageErrors"].append(str(error)))
        await original.goto(url, wait_until="domcontentloaded")
        await original.wait_for_function("typeof window.__devFingerprint === 'function'")
        await original.wait_for_timeout(1000)
        await original.keyboard.press("Space")
        await original.wait_for_timeout(1800)
        initial = await fingerprint(original)
        record["initialTurn"] = turn_count(initial)
        if record["initialTurn"] != 0:
            raise AssertionError(f"fresh game began at turn {record['initialTurn']}")

        for key in KEYS:
            before = turn_count(await fingerprint(original))
            await press_and_settle(original, key)
            record["inputs"].append(key)
            if turn_count(await fingerprint(original)) > before:
                break
        else:
            raise AssertionError("no first input produced a recorded turn")

        saved = await fingerprint(original)
        saved_stats = await replay_stats(original)
        record["seed"] = saved_stats.get("seed")
        record["saveTurn"] = turn_count(saved)
        record["saveFingerprintSha256"] = digest(saved)
        record["saveReplayStats"] = saved_stats
        if saved_stats.get("count", 0) < 1:
            raise AssertionError(f"replay did not record first action: {saved_stats}")

        # The real page-exit listener writes the normal guest cookie save.
        await original.evaluate("window.dispatchEvent(new Event('pagehide'))")
        await original.wait_for_timeout(250)
        persisted = await original.evaluate("""() => {
          const cookies = Object.fromEntries(document.cookie.split(/;\\s*/).filter(Boolean)
            .map(part => { const i = part.indexOf('=');
              return [decodeURIComponent(part.slice(0, i)),
                      decodeURIComponent(part.slice(i + 1))]; }));
          const read = key => cookies[key] ?? localStorage.getItem(key);
          const count = Number(read('wr_save_meta'));
          if (!Number.isInteger(count) || count < 1) return {error:'cookie meta missing'};
          const chunks = Array.from({length:count}, (_,i) => read(`wr_save_${i}`));
          if (chunks.some(x => x == null)) return {error:'save chunk missing', count};
          const save = JSON.parse(chunks.join(''));
          return {count, version:save.saveVersion, seed:save.worldSpec?.seed,
                  replayCount:save.replay?.actions?.length,
                  cookieChunks:chunks.filter((_,i) => cookies[`wr_save_${i}`] !== undefined).length,
                  localStorageChunks:chunks.filter((_,i) => cookies[`wr_save_${i}`] === undefined).length,
                  metaLocation:cookies.wr_save_meta === undefined ? 'localStorage' : 'cookie'};
        }""")
        record["persisted"] = persisted
        if persisted.get("error") or persisted.get("version") != 2:
            raise AssertionError(f"expected chunked cookie Save V2: {persisted}")
        if persisted.get("seed") != record["seed"]:
            raise AssertionError(f"saved world seed differs from replay seed: {persisted}")
        if persisted.get("replayCount") != saved_stats["count"]:
            raise AssertionError(f"saved replay count differs: {persisted}")
        require_equal(saved, await fingerprint(original), "page exit changed original game")

        storage = await original_context.storage_state()
        restored_context = await browser.new_context(
            viewport=VIEWPORT, service_workers="block", storage_state=storage)
        await restored_context.route("**/*", local_requests_only)
        restored = await restored_context.new_page()
        restored.on("pageerror", lambda error: record["pageErrors"].append(str(error)))
        await restored.goto(url, wait_until="domcontentloaded")
        await restored.wait_for_function("typeof window.__devFingerprint === 'function'")
        await restored.wait_for_timeout(1300)
        # The actual Continue button is drawn on the canvas at this viewport.
        await restored.mouse.click(500, 340)
        await restored.wait_for_function(
            "expected => window.__devFingerprint().playerFingerprints?.[0]?.turnCount === expected",
            arg=record["saveTurn"], timeout=15000)
        await restored.wait_for_timeout(250)
        loaded = await fingerprint(restored)
        loaded_stats = await replay_stats(restored)
        require_equal(saved, loaded, "loaded full game fingerprint")
        require_equal(saved_stats, loaded_stats, "loaded replay state")
        require_equal(saved, await fingerprint(original), "restore changed original game")
        record["loadedFingerprintSha256"] = digest(loaded)

        # Compare every input, including blocked moves, until a next turn happens.
        for key in KEYS:
            before = turn_count(await fingerprint(original))
            await press_and_settle(original, key)
            await press_and_settle(restored, key)
            record["inputs"].append(key)
            left, right = await fingerprint(original), await fingerprint(restored)
            require_equal(left, right, f"next input {key} fingerprint")
            require_equal(await replay_stats(original), await replay_stats(restored),
                          f"next input {key} replay state")
            if turn_count(left) > before:
                break
        else:
            raise AssertionError("no post-Continue input produced a recorded turn")

        record["nextTurn"] = turn_count(left)
        record["nextFingerprintSha256"] = digest(left)
        record["nextReplayStats"] = await replay_stats(original)
        record["status"] = "passed"
    except Exception as error:
        record["status"] = "failed"
        record["error"] = f"{type(error).__name__}: {error}"
    finally:
        if restored_context:
            await restored_context.close()
        await original_context.close()
    return record


async def run(args, report):
    handler = functools.partial(NoCacheHandler, directory=str(args.web_root))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        url = f"http://127.0.0.1:{server.server_port}/play.html"
        async with async_playwright() as playwright:
            report["playwrightVersion"] = version("playwright")
            browser = await playwright.chromium.launch(
                headless=True, executable_path=str(args.chromium), args=["--no-sandbox"])
            try:
                report["browserVersion"] = browser.version
                for index in range(1, args.cases + 1):
                    case = await one_case(browser, url, index)
                    report["cases"].append(case)
                    args.out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
                    print(f"case {index}/{args.cases}: {case['status']} seed={case.get('seed')} "
                          f"turns={case.get('saveTurn')}->{case.get('nextTurn')}", flush=True)
                    if case["status"] == "failed":
                        print(case["error"], flush=True)
            finally:
                await browser.close()
    finally:
        server.shutdown()
        server.server_close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--web-root", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--chromium", required=True, type=Path)
    parser.add_argument("--cases", type=int, default=4)
    args = parser.parse_args()
    if not 1 <= args.cases <= 8:
        parser.error("--cases must be between 1 and 8")
    if not (args.web_root / "play.html").is_file():
        parser.error("--web-root must contain play.html")
    manifest_path = args.web_root / "release-manifest.json"
    if not manifest_path.is_file():
        parser.error("--web-root must be a staged web release")
    if not args.chromium.is_file():
        parser.error("--chromium must be an existing browser executable")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    bundle = next((item for item in manifest["files"] if item["path"] == "dist/bundle.js"), None)
    if not bundle:
        parser.error("release manifest lacks dist/bundle.js")
    if args.out.exists():
        parser.error("--out must name a new report file")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    report = {"check": "guest cookie Save V2 Continue and next action",
              "startedAtUnix": time.time(), "webRoot": str(args.web_root),
              "source": manifest["source"], "version": manifest["version"],
              "bundleSha256": bundle["sha256"], "requestedCases": args.cases,
              "cases": []}
    with args.out.open("x", encoding="utf-8") as file:
        json.dump(report, file, indent=2)
    asyncio.run(run(args, report))
    report["passed"] = sum(case["status"] == "passed" for case in report["cases"])
    report["finishedAtUnix"] = time.time()
    args.out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"{report['passed']}/{args.cases} passed; report: {args.out}")
    return 0 if report["passed"] == args.cases else 1


if __name__ == "__main__":
    raise SystemExit(main())
