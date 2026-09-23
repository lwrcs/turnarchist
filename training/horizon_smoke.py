"""Loopback-only, fresh-profile Horizon validation. Never downloads a browser."""
from __future__ import annotations
import argparse
import asyncio
import contextlib
import functools
import importlib.metadata
import json
import math
import os
import platform
import shutil
import sys
import subprocess
import signal
import time
import threading
import traceback
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


def find_browser(explicit: str | None, bundled: str | None = None) -> str:
    if explicit:
        path = Path(explicit).expanduser()
        if not path.is_file():
            raise RuntimeError(f"BROWSER_NOT_FOUND: {path}")
        return str(path.resolve())
    candidates = [bundled, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                  '/Applications/Chromium.app/Contents/MacOS/Chromium']
    for variable in ['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA']:
        if os.environ.get(variable):
            candidates.append(str(Path(os.environ[variable]) / 'Google/Chrome/Application/chrome.exe'))
    candidates.extend(shutil.which(name) for name in ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable'])
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return str(Path(candidate).resolve())
    raise RuntimeError('BROWSER_NOT_FOUND: pass --chromium with an existing Chrome/Chromium executable; no browser was downloaded')


def json_safe(value):
    """Reports only: retain non-JSON diagnostics explicitly rather than emitting invalid JSON."""
    if isinstance(value, float) and not math.isfinite(value):
        return {'diagnosticNumber': repr(value)}
    if isinstance(value, dict):
        return {str(k): json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_safe(v) for v in value]
    return value


# The evaluator runs in an owned subprocess/browser. A renderer freeze cannot disable
# the parent's deadline or erase progress already flushed to the external journal.
PROGRESS_PREFIX = 'HORIZON_SMOKE_PROGRESS_V3 '
MAX_EVENT_BYTES = 262144


def write_new(file: Path, value):
    file.parent.mkdir(parents=True, exist_ok=True)
    with file.open('x', encoding='utf8') as handle:
        json.dump(json_safe(value), handle, indent=2, allow_nan=False)
        handle.write('\n')


def read_latest(journal: Path):
    latest = None
    if not journal.is_file():
        return latest
    with journal.open('rb') as handle:
        handle.seek(max(0, journal.stat().st_size - 1048576))
        for line in handle:
            try:
                event = json.loads(line)
                if event.get('type') == 'progress' and isinstance(event.get('report'), dict):
                    latest = event['report']
            except (ValueError, UnicodeError):
                continue  # A process may die halfway through its last write.
    return latest


def timeout_result(seed, scenario, code, latest=None, message=None):
    result = dict(latest or {})
    result.update(seed=seed, scenario=scenario, pass_=False)
    result.pop('pass_', None)
    result['pass'] = False
    result['status'] = 'FAIL'
    result.setdefault('phase', 'browser-worker')
    result['partialProgressRetained'] = latest is not None
    prior = result.get('error')
    if prior:
        result['underlyingError'] = prior
    result['error'] = {'name': 'TimeoutError', 'code': code, 'message': message or code}
    return result


def stop_owned_worker(process):
    """Only the exact worker process tree created by this runner; never existing Chrome."""
    if os.name == 'nt':
        if process.poll() is None:
            subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10)
    else:
        # Workers have their own session/process group, including their Playwright browser.
        for sig in [signal.SIGTERM, signal.SIGKILL]:
            with contextlib.suppress(ProcessLookupError):
                os.killpg(process.pid, sig)
            if sig == signal.SIGTERM:
                with contextlib.suppress(subprocess.TimeoutExpired):
                    process.wait(timeout=3)
    with contextlib.suppress(subprocess.TimeoutExpired):
        process.wait(timeout=5)


async def timeout_stack(context, page, prepared=None):
    """Best effort call-stack location only: no locals, snapshots, credentials or scope values."""
    session = prepared
    result = {'available': False, 'diagnosticPhase': 'attach'}
    try:
        if session is None:
            session = await asyncio.wait_for(context.new_cdp_session(page), 2)
        scripts = {}
        session.on('Debugger.scriptParsed', lambda event: scripts.update({event.get('scriptId'): event.get('url', '')}))
        await asyncio.wait_for(session.send('Debugger.enable'), 2)
        paused = asyncio.get_running_loop().create_future()
        def received(event):
            if not paused.done():
                paused.set_result(event)
        session.on('Debugger.paused', received)
        result['diagnosticPhase'] = 'pause'
        await asyncio.wait_for(session.send('Debugger.pause'), 2)
        result['diagnosticPhase'] = 'paused-event'
        event = await asyncio.wait_for(paused, 2)
        result = {'available': True, 'reason': event.get('reason'), 'frames': [
            {'functionName': f.get('functionName', '')[:240], 'url': (f.get('url') or scripts.get(f.get('location', {}).get('scriptId'), ''))[:600],
             'location': f.get('location'), 'functionLocation': f.get('functionLocation')}
            for f in event.get('callFrames', [])[:20]]}
    except Exception as error:
        result['diagnosticError'] = type(error).__name__ + ': ' + str(error)[:600]
    finally:
        if session:
            with contextlib.suppress(Exception):
                await asyncio.wait_for(session.send('Debugger.resume'), 2)
            with contextlib.suppress(Exception):
                await asyncio.wait_for(session.detach(), 2)
    return result


async def run_worker(request, initialize_page=None):
    from playwright.async_api import async_playwright
    seed, scenario = request['seed'], request['scenario']
    latest = {'schemaVersion': 3, 'seed': seed, 'scenario': scenario, 'pass': False,
              'status': 'RUNNING', 'phase': 'browser-launch', 'results': []}
    journal = Path(request['journal'])
    errors, blocked = [], []
    browser = context = page = diagnostic_session = None
    event_count = 0
    started = time.monotonic()
    def progress(value):
        nonlocal latest, event_count
        if not isinstance(value, dict) or value.get('seed') != seed or value.get('scenario') != scenario:
            return
        text = json.dumps({'type': 'progress', 'report': json_safe(value)}, allow_nan=False)
        if len(text.encode('utf8')) > MAX_EVENT_BYTES or event_count >= 2048:
            return
        latest = value
        with journal.open('a', encoding='utf8') as handle:
            handle.write(text + '\n')
            handle.flush()
        event_count += 1
    progress(latest)
    def console(message):
        text = message.text
        if text.startswith(PROGRESS_PREFIX):
            try:
                progress(json.loads(text[len(PROGRESS_PREFIX):]))
            except (ValueError, TypeError):
                pass
        elif message.type == 'error' and len(errors) < 30:
            errors.append(text[:1500])
    result = None
    async with async_playwright() as playwright:
        try:
            executable = find_browser(request.get('chromium'), playwright.chromium.executable_path)
            browser = await playwright.chromium.launch(headless=True, executable_path=executable, timeout=30000)
            context = await browser.new_context(service_workers='block')
            async def route(request_route):
                parsed = urlsplit(request_route.request.url)
                base = urlsplit(request['url'])
                if parsed.scheme == 'http' and parsed.hostname == '127.0.0.1' and parsed.port == base.port:
                    await request_route.continue_()
                else:
                    if len(blocked) < 16:
                        blocked.append(request_route.request.url[:400])
                    await request_route.abort()
            await context.route('**/*', route)
            page = await context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)[:1500]) if len(errors) < 30 else None)
            page.on('console', console)
            page.set_default_timeout(60000)
            latest.update(phase='browser-navigation')
            progress(latest)
            if initialize_page is None:
                await page.goto(request['url'], wait_until='load')
            else:
                # Dependency injection for in-memory synthetic tests, never a CLI switch.
                await initialize_page(page)
            latest.update(phase='wait-agent')
            progress(latest)
            await page.wait_for_function("document.getElementById('game').contentWindow.agent && window.AgentHorizonSmoke && window.HorizonSmokeSession")
            # Python's timer is independent of the renderer's event loop. The inner session
            # also checks elapsed time AFTER each operation to catch timer-starving long tasks.
            try:
                result = await asyncio.wait_for(page.evaluate("""async cfg => {
                  return AgentHorizonSmoke.run(document.getElementById('game').contentWindow.agent, {
                    seed: cfg.seed, scenario: cfg.scenario, caseTimeoutMs: cfg.caseTimeoutMs,
                    operationTimeoutMs: cfg.operationTimeoutMs,
                    onProgress: report => console.info('HORIZON_SMOKE_PROGRESS_V3 ' + JSON.stringify(report))
                  });
                }""", {'seed': seed, 'scenario': scenario, 'caseTimeoutMs': request['caseTimeoutMs'],
                       'operationTimeoutMs': request['operationTimeoutMs']}), request['caseTimeoutMs']/1000 + 3)
            except asyncio.TimeoutError:
                result = timeout_result(seed, scenario, 'SMOKE_RENDERER_TIMEOUT', latest,
                                        'Renderer did not return within its externally enforced case deadline')
            if not isinstance(result, dict) or not isinstance(result.get('pass'), bool):
                raise RuntimeError('INVALID_SMOKE_REPORT: expected an explicit boolean pass result')
            if not result['pass'] and 'TIMEOUT' in result.get('error', {}).get('code', ''):
                result['timeoutStack'] = await timeout_stack(context, page, diagnostic_session)
                diagnostic_session = None
            result['browserEnvironment'] = {'chromium': executable, 'browserVersion': browser.version,
                                           'playwright': importlib.metadata.version('playwright')}
        except Exception as error:
            result = dict(latest)
            result.update({'pass': False, 'status': 'FAIL', 'partialProgressRetained': True,
                           'error': {'name': type(error).__name__, 'message': str(error)[:3000],
                                     'code': 'SMOKE_BROWSER_ERROR'}})
        finally:
            # Persist the result BEFORE teardown, which can itself fail with a frozen renderer.
            result = result or timeout_result(seed, scenario, 'SMOKE_WORKER_INTERRUPTED', latest)
            result['browserErrors'] = errors
            result['blockedExternalRequests'] = blocked
            result['workerElapsedMs'] = round((time.monotonic()-started)*1000)
            result['progressEvents'] = event_count
            write_new(Path(request['result']), result)
            if diagnostic_session:
                with contextlib.suppress(Exception):
                    await asyncio.wait_for(diagnostic_session.detach(), 2)
            for obj in [context, browser]:
                if obj:
                    with contextlib.suppress(Exception):
                        await asyncio.wait_for(obj.close(), 5)
    return 0 if result.get('pass') else 1


def worker_entry(file):
    request = json.loads(Path(file).read_text(encoding='utf8'))
    return asyncio.run(run_worker(request))


def execute_case(request, directory, worker_command=None):
    """Process watchdog is deliberately outside Playwright and its browser driver."""
    request_file = directory / 'request.json'
    write_new(request_file, request)
    command = worker_command or [sys.executable, str(Path(__file__).resolve()), '--case-worker', str(request_file)]
    options = {'start_new_session': True} if os.name != 'nt' else {'creationflags': subprocess.CREATE_NEW_PROCESS_GROUP}
    process = None
    with (directory / 'worker.log').open('x', encoding='utf8') as log:
        try:
            process = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=log, stderr=log, **options)
            # Startup and teardown are bounded separately from the unchanged 180s case default.
            process.wait(timeout=request['caseTimeoutMs']/1000 + request.get('supervisorGraceSeconds', 150))
        except subprocess.TimeoutExpired:
            stop_owned_worker(process)
            latest = read_latest(Path(request['journal']))
            result_file = Path(request['result'])
            if result_file.is_file() and result_file.stat().st_size <= 2097152:
                try:
                    terminal = json.loads(result_file.read_text(encoding='utf8'))
                    if isinstance(terminal, dict) and terminal.get('seed') == request['seed'] and terminal.get('scenario') == request['scenario'] and terminal.get('pass') is False:
                        terminal['teardownError'] = {'code': 'SMOKE_WORKER_TIMEOUT', 'message': 'Worker hung after persisting its failed case result'}
                        return terminal
                    if isinstance(terminal, dict):
                        latest = terminal
                except (ValueError, UnicodeError):
                    pass
            return timeout_result(request['seed'], request['scenario'], 'SMOKE_WORKER_TIMEOUT', latest,
                                  'Owned validation worker exceeded its external process deadline')
        except BaseException:
            if process:
                stop_owned_worker(process)
            raise
    result_file = Path(request['result'])
    if result_file.is_file() and result_file.stat().st_size <= 2097152:
        try:
            result = json.loads(result_file.read_text(encoding='utf8'))
            if not isinstance(result, dict) or not isinstance(result.get('pass'), bool) or result.get('seed') != request['seed'] or result.get('scenario') != request['scenario']:
                raise ValueError('Invalid worker result metadata')
            if process.returncode != 0 and result['pass']:
                result = timeout_result(request['seed'], request['scenario'], 'SMOKE_WORKER_EXIT', result,
                                        'Worker failed after a successful semantic test; cleanup/infrastructure not accepted')
            result['workerExitCode'] = process.returncode
            return result
        except (ValueError, UnicodeError):
            pass
    return timeout_result(request['seed'], request['scenario'], 'SMOKE_WORKER_EXIT', read_latest(Path(request['journal'])),
                          'Worker exited without a valid result; inspect worker.log')


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--chromium')
    parser.add_argument('--seeds', type=int, nargs='+', default=[1, 2])
    parser.add_argument('--scenarios', nargs='+', choices=['standard', 'cave', 'forest'], default=['standard', 'cave'])
    parser.add_argument('--case-timeout-ms', type=int, default=180000)
    parser.add_argument('--operation-timeout-ms', type=int, default=30000)
    args = parser.parse_args()
    cases = Path(str(args.out) + '.cases')
    if args.out.exists() or cases.exists():
        parser.error('Output or case directory exists; choose a new path. Nothing is overwritten.')
    if len(set(args.seeds)) != len(args.seeds) or len(set(args.scenarios)) != len(args.scenarios):
        parser.error('Duplicate cases are not allowed.')
    if any(not 0 <= seed <= 0xffffffff for seed in args.seeds) or len(args.seeds)*len(args.scenarios)>64:
        parser.error('Use unsigned 32-bit seeds and at most 64 cases.')
    if not 1000 <= args.case_timeout_ms <= 1800000 or not 1 <= args.operation_timeout_ms <= 120000:
        parser.error('case-timeout-ms must be 1000..1800000; operation-timeout-ms must be 1..120000.')
    root = Path(__file__).resolve().parents[1]
    cases.mkdir(parents=True)
    report = {'schemaVersion': 3, 'suite': 'horizon-real-browser-v3', 'pass': False, 'phase': 'python-preflight',
              'environment': {'python': sys.version, 'executable': sys.executable, 'platform': platform.platform()},
              'budgets': {'caseTimeoutMs': args.case_timeout_ms, 'operationTimeoutMs': args.operation_timeout_ms,
                          'hostStepTimeoutMs': 3000}, 'runs': [], 'caseDirectory': str(cases.resolve())}
    server = thread = None
    try:
        report['environment']['playwright'] = importlib.metadata.version('playwright')
        report['phase'] = 'loopback-bind'
        class Handler(SimpleHTTPRequestHandler):
            def log_message(self, *_):
                pass
            def end_headers(self):
                self.send_header('Cache-Control', 'no-store')
                super().end_headers()
            def copyfile(self, source, output):
                try:
                    super().copyfile(source, output)
                except (BrokenPipeError, ConnectionResetError):
                    pass  # A retired validation browser closed an asset request; not a game failure.
        server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(root)))
        server.daemon_threads = True
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        url = f'http://127.0.0.1:{server.server_address[1]}/horizon-smoke.html'
        for scenario in args.scenarios:
            for seed in args.seeds:
                report['phase'] = 'browser-cases'
                directory = cases / f'{scenario}-{seed}'
                directory.mkdir()
                request = {'seed': seed, 'scenario': scenario, 'chromium': args.chromium, 'url': url,
                           'caseTimeoutMs': args.case_timeout_ms, 'operationTimeoutMs': args.operation_timeout_ms,
                           'journal': str((directory/'progress.jsonl').resolve()), 'result': str((directory/'result.json').resolve())}
                result = execute_case(request, directory)
                result['progressJournal'] = request['journal']
                result['workerLog'] = str((directory/'worker.log').resolve())
                report['runs'].append(result)
                # Retain every completed case even if a later worker or the caller is interrupted.
                write_new(directory/'accepted-result.json', result)
        report['pass'] = bool(report['runs']) and all(run.get('pass') is True for run in report['runs'])
        report['phase'] = 'complete'
    except BaseException as error:
        report['error'] = {'name': type(error).__name__, 'message': str(error)[:3000], 'stack': traceback.format_exc(limit=8)}
    finally:
        if server:
            if thread and thread.is_alive():
                server.shutdown()
            server.server_close()
        if thread:
            thread.join(timeout=5)
    write_new(args.out, report)
    print(json.dumps({'pass': report['pass'], 'phase': report['phase'], 'runs': len(report['runs']), 'report': str(args.out.resolve())}))
    return 0 if report['pass'] else 1


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--case-worker':
        raise SystemExit(worker_entry(sys.argv[2]))
    raise SystemExit(main())
