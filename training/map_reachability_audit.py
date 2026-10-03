"""Independent read-only reachability audit of browser-generated Turnarchist maps.

Run in the training WSL venv against an immutable staged web artifact:
  python training/map_reachability_audit.py --web-root /path/to/stage --out /tmp/maps.json
The browser supplies map data; all reachability searches below run in Python.
"""

import argparse
import asyncio
import functools
import json
import re
import threading
from collections import deque
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.async_api import async_playwright


CHROME = Path("/home/harrison/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome")
SEEDS = (1, 2, 3, 123)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def reachable(start, edges):
    if start not in edges:
        return set()
    seen = {start}
    queue = deque([start])
    while queue:
        for other in edges[queue.popleft()]:
            if other in edges and other not in seen:
                seen.add(other)
                queue.append(other)
    return seen


def graph_findings(partitions, *, side=False, require_exit=True):
    findings = []
    edges = {p["i"]: {c["other"] for c in p["connections"]} for p in partitions}
    starts = [p["i"] for p in partitions if p["type"] == ("ROPECAVE" if side else "START")]
    goals = [p["i"] for p in partitions if p["type"] == "DOWNLADDER"]
    if not starts:
        findings.append("missing_start")
    if require_exit and not goals:
        findings.append("missing_downladder")
    for src, links in edges.items():
        for dst in links:
            if src not in edges.get(dst, set()):
                findings.append(f"asymmetric_connection:{src}->{dst}")
    if starts:
        seen = reachable(starts[0], edges)
        for p in partitions:
            if p["i"] not in seen:
                findings.append(f"unreachable_partition:{p['i']}:{p['type']}")
    return findings


def tile_findings(level):
    findings = []
    rooms = level["rooms"]
    by_id = {r["id"]: r for r in rooms}
    room_edges = {r["id"]: set() for r in rooms}
    for room in rooms:
        w, h = room["w"], room["h"]
        walkable = {(x, y) for y in range(h) for x in range(w) if room["walk"][y][x]}
        # Closed doors are traversable after opening; keep them as anchors.
        anchors = []
        for door in room["doors"]:
            pos = (door["x"] - room["x"], door["y"] - room["y"])
            if 0 <= pos[0] < w and 0 <= pos[1] < h:
                walkable.add(pos)
                anchors.append(("door", pos))
            if door["type"] != 3 and door["other"] in by_id:
                room_edges[room["id"]].add(door["other"])
                partner = [d for d in by_id[door["other"]]["doors"] if d["other"] == room["id"] and d["type"] != 3]
                if not partner:
                    findings.append(f"unpaired_door:{room['id']}->{door['other']}")
        for item in room["items"]:
            if item["kind"] == "Key":
                anchors.append((f"key:{item['key']}", (item["x"] - room["x"], item["y"] - room["y"])))
        for tile in room["ladders"]:
            anchors.append((tile["kind"], (tile["x"] - room["x"], tile["y"] - room["y"])))
        if anchors:
            first_name, first_pos = anchors[0]
            seen = reachable(first_pos, {p: {q for q in ((p[0]+1,p[1]),(p[0]-1,p[1]),(p[0],p[1]+1),(p[0],p[1]-1)) if q in walkable} for p in walkable})
            for name, pos in anchors:
                if pos not in seen:
                    findings.append(f"tile_anchor_unreachable:{room['id']}:{name}:{pos[0]},{pos[1]}:from:{first_name}")
    start = level["start"]
    if start not in room_edges:
        findings.append("missing_runtime_start")
        return findings
    seen = reachable(start, room_edges)
    if level["exit"] is not None and level["exit"] not in seen:
        findings.append(f"runtime_exit_unreachable:{level['exit']}")
    for room in rooms:
        if room["id"] not in seen:
            findings.append(f"runtime_room_unreachable:{room['id']}:{room['type']}")
    return findings


def gate_findings(level):
    """Search room/key states; guarded doors clear after combat, tunnels are shortcuts."""
    rooms = {r["id"]: r for r in level["rooms"]}
    if level["start"] not in rooms:
        return ["missing_runtime_start"]
    state = {(level["start"], frozenset())}
    queue = deque(state)
    while queue:
        rid, keys = queue.popleft()
        room = rooms[rid]
        held = keys | {i["key"] for i in room["items"] if i["kind"] == "Key" and i["key"] > 0}
        for door in room["doors"]:
            other = door["other"]
            if other not in rooms or door["type"] == 3:
                continue
            if door["type"] == 1 and door["locked"] and door["key"] not in held:
                continue
            next_state = (other, frozenset(held))
            if next_state not in state:
                state.add(next_state)
                queue.append(next_state)
    seen_rooms = {rid for rid, _ in state}
    findings = []
    if level["exit"] is not None and level["exit"] not in seen_rooms:
        findings.append(f"key_gated_exit_unreachable:{level['exit']}")
    for room in rooms.values():
        for door in room["doors"]:
            if door["type"] == 1 and door["locked"] and (not door["key"] or not any(i["kind"] == "Key" and i["key"] == door["key"] for r in rooms.values() for i in r["items"])):
                findings.append(f"key_gate_without_local_key:{room['id']}:{door['x']},{door['y']}:key={door['key']}")
    # Main stairs may require a key earned in a castle side path, outside this level.
    for room in rooms.values():
        for ladder in room["ladders"]:
            if ladder["kind"] == "DownLadder" and ladder["lock"] == 1 and ladder["key"] > 0:
                local = any(i["kind"] == "Key" and i["key"] == ladder["key"] for r in rooms.values() for i in r["items"])
                if not local and not ladder["side"] and not any(t["kind"] == "DownLadder" and t["side"] for r in rooms.values() for t in r["ladders"]):
                    findings.append(f"main_ladder_key_without_sidepath:{room['id']}:{ladder['key']}")
    return sorted(set(findings))


PARTITIONS_JS = """async ({asset,side}) => {const g=window.agent.game;const p=await g.levelgen.pngPartitionGenerator.generatePartitionsFromPng(asset,g,0,side);return p.map((q,i)=>({i,x:q.x,y:q.y,w:q.w,h:q.h,type:q.type,connections:q.connections.map(c=>({x:c.x,y:c.y,other:p.indexOf(c.other)}))}));}"""

LEVEL_JS = """() => {const g=window.agent.game,l=g.levels.at(-1);return {source:l.genSource,url:l.pngUrl,start:l.startRoom?.globalId??null,exit:l.exitRoom?.globalId??null,rooms:l.rooms.map(r=>({id:r.globalId,type:r.type,x:r.roomX,y:r.roomY,w:r.width,h:r.height,walk:Array.from({length:r.height},(_,j)=>Array.from({length:r.width},(_,i)=>r.roomArray[r.roomX+i]?.[r.roomY+j]?.isSolid?.()===false)),doors:r.doors.map(d=>({x:d.x,y:d.y,type:d.type,locked:d.locked,key:d.lockable?.keyID??0,other:d.linkedDoor?.room?.globalId??null})),items:r.items.map(i=>({kind:i.constructor.name,x:i.x,y:i.y,key:i.doorID??0})),ladders:Array.from({length:r.height},(_,j)=>Array.from({length:r.width},(_,i)=>r.roomArray[r.roomX+i]?.[r.roomY+j])).flat().filter(t=>t?.constructor?.name==='DownLadder'||t?.constructor?.name==='UpLadder').map(t=>({kind:t.constructor.name,x:t.x,y:t.y,lock:t.lockable?.getLockType?.()??0,key:t.lockable?.keyID??0,side:t.isSidePath??false}))}))};}"""
SIDE_LEVEL_JS = LEVEL_JS.replace("l=g.levels.at(-1)", "l=window.__auditSideRoom.level")


async def fresh_page(browser, url, seed):
    page = await browser.new_page()
    await page.goto(url, wait_until="domcontentloaded")
    await page.wait_for_function("window.agent && window.__devFingerprint")
    await page.evaluate("seed => window.agent.reset(seed,{scenario:'standard',maxSteps:64})", seed)
    return page


async def run(args):
    root = args.web_root.resolve()
    assets = sorted(["res/level.png"] + [p.relative_to(root).as_posix() for p in (root / "res/levels").glob("*.png")])
    server = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(root)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    records = []
    try:
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True, executable_path=str(CHROME), args=["--no-sandbox"])
            try:
                url = f"http://127.0.0.1:{server.server_port}/play.html?agent=1"
                page = await fresh_page(browser, url, SEEDS[0])
                for asset in assets:
                    name = Path(asset).name
                    main = bool(re.fullmatch(r"\d+_\d+\.png", name))
                    castle = bool(re.fullmatch(r"castle_[123]\.png", name))
                    side = castle or name.startswith("c_")
                    parts = await page.evaluate(PARTITIONS_JS, {"asset": asset, "side": side})
                    findings = graph_findings(parts, side=side, require_exit=main or castle or (not side and any(p["type"] == "START" for p in parts)))
                    records.append({"case": asset, "kind": "authored_graph", "selectable": main or castle, "partitions": len(parts), "findings": findings})
                    print(f"graph {asset}: {len(parts)} partitions, {len(findings)} findings", flush=True)
                await page.close()
                main_assets = [r["case"] for r in records if r["selectable"] and re.fullmatch(r"\d+_\d+\.png", Path(r["case"]).name)]
                for asset in main_assets:
                    page = await fresh_page(browser, url, SEEDS[0])
                    try:
                        level = await page.evaluate("""async asset => {const g=window.agent.game;await g.levelgen.generate(g,Number(asset.split('/').at(-1).split('_')[0]),false,()=>{},0,false,'main',undefined,{forcePngUrl:asset});return (""" + LEVEL_JS + """)();}""", asset)
                        findings = tile_findings(level) + gate_findings(level)
                        records.append({"case": asset, "kind": "authored_populated", "seed": SEEDS[0], "rooms": len(level["rooms"]), "source": level["source"], "findings": findings})
                        print(f"populated {asset}: {len(level['rooms'])} rooms, {len(findings)} findings", flush=True)
                    except Exception as exc:
                        records.append({"case": asset, "kind": "authored_populated", "seed": SEEDS[0], "findings": [f"generation_error:{type(exc).__name__}:{exc}"]})
                    finally:
                        await page.close()
                for seed in SEEDS:
                    page = await fresh_page(browser, url, seed)
                    try:
                        level = await page.evaluate(LEVEL_JS)
                        findings = tile_findings(level) + gate_findings(level)
                        records.append({"case": f"standard:{seed}:depth0", "kind": "procedural_seed", "seed": seed, "rooms": len(level["rooms"]), "source": level["source"], "findings": findings})
                        print(f"seed {seed}: {len(level['rooms'])} rooms, {len(findings)} findings", flush=True)
                        for depth in (1, 2):
                            await page.evaluate("""async depth => {const g=window.agent.game;await g.levelgen.generate(g,depth,false,()=>{},0,false,'main',undefined,{forceProcedural:true});}""", depth)
                            level = await page.evaluate(LEVEL_JS)
                            findings = tile_findings(level) + gate_findings(level)
                            records.append({"case": f"standard:{seed}:depth{depth}", "kind": "procedural_seed", "seed": seed, "rooms": len(level["rooms"]), "source": level["source"], "findings": findings})
                            print(f"seed {seed} depth {depth}: {len(level['rooms'])} rooms, {len(findings)} findings", flush=True)
                    finally:
                        await page.close()
                seen_castle = set()
                # These choices cover the three castle PNG variations under the
                # xorshift selection for the fixed audit-castle path ID.
                for seed in (1, 4, 64):
                    page = await fresh_page(browser, url, seed)
                    try:
                        await page.evaluate("""async () => {const g=window.agent.game;await g.levelgen.generate(g,0,true,r=>{window.__auditSideRoom=r},3,false,'audit-castle',{envType:3,mapWidth:30,mapHeight:30,caveRooms:12,locked:true});}""")
                        level = await page.evaluate(SIDE_LEVEL_JS)
                        if level["url"] in seen_castle:
                            continue
                        seen_castle.add(level["url"])
                        findings = tile_findings(level) + gate_findings(level)
                        records.append({"case": level["url"] or f"castle_seed:{seed}", "kind": "castle_populated", "seed": seed, "rooms": len(level["rooms"]), "source": level["source"], "findings": findings})
                        print(f"castle seed {seed}: {level['url']}, {len(level['rooms'])} rooms, {len(findings)} findings", flush=True)
                        if len(seen_castle) == 3:
                            break
                    except Exception as exc:
                        records.append({"case": f"castle_seed:{seed}", "kind": "castle_populated", "findings": [f"generation_error:{type(exc).__name__}:{exc}"]})
                    finally:
                        await page.close()
                if len(seen_castle) != 3:
                    records.append({"case": "castle_variation_coverage", "kind": "coverage", "findings": [f"expected_3_variations_saw:{sorted(seen_castle)}"]})
            finally:
                await browser.close()
    finally:
        server.shutdown()
        server.server_close()
    manifest = json.loads((root / "release-manifest.json").read_text(encoding="utf-8"))
    active_findings = sum(len(r["findings"]) for r in records if r["kind"] != "authored_graph" or r["selectable"])
    report = {"web_root": str(root), "source_commit": manifest["source"]["commit"],
              "source_dirty": manifest["source"]["dirty"], "cases": len(records),
              "findings": sum(len(r["findings"]) for r in records),
              "active_findings": active_findings, "records": records}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Report: {args.out} ({report['cases']} cases, {report['findings']} findings; {active_findings} active)")
    if active_findings:
        raise SystemExit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--web-root", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    asyncio.run(run(parser.parse_args()))
