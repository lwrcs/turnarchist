"""Compare real browser worlds across two staged web releases at fixed seeds.

The generated room GID is excluded because it varies between identical builds;
all other player fields, all room fingerprints, and the RNG state are exact.
"""

import argparse
import asyncio
import contextlib
import copy
import functools
import hashlib
import json
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright

CASES = (("standard", 1), ("standard", 2), ("standard", 3),
         ("standard", 123), ("cave", 1), ("cave", 2))


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *_args):
        pass

    def copyfile(self, source, output):
        with contextlib.suppress(BrokenPipeError, ConnectionResetError):
            super().copyfile(source, output)


async def local_only(route):
    if urlparse(route.request.url).hostname in ("127.0.0.1", "localhost"):
        await route.continue_()
    else:
        await route.abort()


def normalized(fingerprint):
    value = copy.deepcopy(fingerprint)
    for player in value["playerFingerprints"]:
        player.pop("roomPathId", None)
    return value


def first_difference(left, right, path="$"):
    if type(left) is not type(right):
        return {"path": path, "before": left, "after": right}
    if isinstance(left, dict):
        for key in sorted(set(left) | set(right)):
            child = f"{path}.{key}"
            if key not in left or key not in right:
                return {"path": child, "before": left.get(key, "<missing>"),
                        "after": right.get(key, "<missing>")}
            result = first_difference(left[key], right[key], child)
            if result:
                return result
    elif isinstance(left, list):
        if len(left) != len(right):
            return {"path": f"{path}.length", "before": len(left), "after": len(right)}
        for index, (a, b) in enumerate(zip(left, right)):
            result = first_difference(a, b, f"{path}[{index}]")
            if result:
                return result
    elif left != right:
        return {"path": path, "before": left, "after": right}
    return None


def sha(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


async def capture(browser, url, scenario, seed):
    context = await browser.new_context(service_workers="block")
    await context.route("**/*", local_only)
    try:
        page = await context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_function("window.agent && window.__devFingerprint", timeout=30000)
        await page.evaluate("input => window.agent.reset(input.seed, {scenario:input.scenario, maxSteps:64})",
                            {"seed": seed, "scenario": scenario})
        fingerprint = await page.evaluate("window.__devFingerprint()")
        return fingerprint, errors
    finally:
        await context.close()


async def run(args, report):
    servers = [ThreadingHTTPServer(("127.0.0.1", 0),
               functools.partial(Handler, directory=str(root)))
               for root in (args.before, args.after)]
    for server in servers:
        threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        urls = [f"http://127.0.0.1:{server.server_port}/play.html?agent=1" for server in servers]
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(
                headless=True, executable_path=str(args.chromium), args=["--no-sandbox"])
            try:
                report["browserVersion"] = browser.version
                for scenario, seed in CASES:
                    case = {"scenario": scenario, "seed": seed, "status": "running"}
                    try:
                        before, before_errors = await capture(browser, urls[0], scenario, seed)
                        after, after_errors = await capture(browser, urls[1], scenario, seed)
                        left, right = normalized(before), normalized(after)
                        case.update({"beforeSha256": sha(left), "afterSha256": sha(right),
                                     "rngBefore": before["rngState"], "rngAfter": after["rngState"],
                                     "roomCountBefore": len(before["roomFingerprints"]),
                                     "roomCountAfter": len(after["roomFingerprints"]),
                                     "generatedRoomGidBefore": before["playerFingerprints"][0]["roomPathId"],
                                     "generatedRoomGidAfter": after["playerFingerprints"][0]["roomPathId"],
                                     "pageErrors": before_errors + after_errors})
                        difference = first_difference(left, right)
                        if before_errors or after_errors:
                            case["error"] = "Browser page error during generation"
                            case["status"] = "failed"
                        elif difference:
                            case["firstDifference"] = difference
                            case["status"] = "failed"
                        else:
                            case["status"] = "passed"
                    except Exception as error:
                        case["status"] = "failed"
                        case["error"] = f"{type(error).__name__}: {error}"
                    report["cases"].append(case)
                    args.out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
                    print(f"{scenario} seed {seed}: {case['status']}", flush=True)
            finally:
                await browser.close()
    finally:
        for server in servers:
            server.shutdown()
            server.server_close()


def manifest(root):
    path = root / "release-manifest.json"
    if not (root / "play.html").is_file() or not path.is_file():
        raise ValueError(f"Expected a staged web release at {root}")
    value = json.loads(path.read_text(encoding="utf-8"))
    bundle = next(item for item in value["files"] if item["path"] == "dist/bundle.js")
    return {"source": value["source"], "version": value["version"],
            "bundleSha256": bundle["sha256"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--before", type=Path, required=True)
    parser.add_argument("--after", type=Path, required=True)
    parser.add_argument("--chromium", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    if args.out.exists():
        parser.error("--out must name a new report file")
    if not args.chromium.is_file():
        parser.error("--chromium must name an existing browser executable")
    report = {"check": "dungeon generation fixed-seed browser parity",
              "startedAtUnix": time.time(), "before": manifest(args.before),
              "after": manifest(args.after), "cases": []}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("x", encoding="utf-8") as file:
        json.dump(report, file, indent=2)
    asyncio.run(run(args, report))
    report["passed"] = sum(case["status"] == "passed" for case in report["cases"])
    report["finishedAtUnix"] = time.time()
    args.out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"{report['passed']}/{len(CASES)} passed; {args.out}")
    return 0 if report["passed"] == len(CASES) else 1


if __name__ == "__main__":
    raise SystemExit(main())
