#!/usr/bin/env python3
"""Offline Jev tactical-referee pilot for Turnarchist.

This module deliberately has no authority to perform a game action.  It builds
small, auditable decision packets from the existing privileged demonstration
operator view, asks TypeSafe Jev atomic typed questions, and records advice for
later comparison with a human or programmed teacher.

Set TYPESAFE_API_KEY only in the desktop training environment.  The key is
never accepted through a browser, written to an artifact, or echoed in logs.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import time
from collections import deque
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


PACKET_SCHEMA_VERSION = 2
REFEREE_SCHEMA_VERSION = 2
DEFAULT_ENDPOINT = "https://api.typesafe.ai/v1/systemone"
DEFAULT_MODEL = "jev-latest"
DIRECTIONS = ("up", "right", "down", "left")


class JevRequestError(RuntimeError):
    """A sanitized TypeSafe API failure suitable for an artifact or console."""


def _number(value: Any) -> float | None:
    return float(value) if isinstance(value, (int, float)) and not isinstance(value, bool) else None


def _text(value: Any, fallback: str = "unknown") -> str:
    if value is None:
        return fallback
    if isinstance(value, str) and value.strip():
        return value.strip()
    return str(value)


def _id(value: Any, prefix: str, index: int) -> str:
    text = _text(value, f"{prefix}-{index}")
    return "".join(character if character.isalnum() or character in "-_:." else "-" for character in text)


def _combat_summary(entity: dict[str, Any]) -> dict[str, Any]:
    combat = entity.get("combat") if isinstance(entity.get("combat"), dict) else {}
    return {
        "health": _number(combat.get("health")),
        "maxHealth": _number(combat.get("maxHealth")),
        "baseDamage": _number(combat.get("baseDamage")),
        "currentDamage": _number(combat.get("currentDamage")),
        "killDamageThreshold": _number(combat.get("killDamageThreshold")),
        "forwardOnly": combat.get("forwardOnly") is True,
    }


def _move_description(move: dict[str, Any]) -> str:
    action = _text(move.get("resolution"), "directional action")
    target = move.get("target") if isinstance(move.get("target"), dict) else {}
    attack = move.get("attack") if isinstance(move.get("attack"), dict) else {}
    consequence = move.get("consequence") if isinstance(move.get("consequence"), dict) else {}
    clauses = [f"{action} toward ({target.get('x')}, {target.get('y')})"]
    if move.get("occupantId"):
        clauses.append(f"touches object {move['occupantId']}")
    if attack.get("attempted"):
        clauses.append("attacks instead of walking")
        if attack.get("killsBeforeEnemyResponse") is True:
            clauses.append("is predicted to kill before the enemy response")
        elif attack.get("killsBeforeEnemyResponse") is False:
            clauses.append("does not eliminate the target before the enemy response")
    if move.get("pushOutcome"):
        clauses.append(f"push outcome: {move['pushOutcome']}")
    known = _number(consequence.get("knownIncomingDamageBeforeDefense"))
    unknown = int(consequence.get("unknownDamageSources") or 0)
    if known is not None:
        clauses.append(f"known incoming damage before defense: {known:g}")
    if unknown:
        clauses.append(f"unknown damage sources: {unknown}")
    if move.get("hint"):
        clauses.append(_text(move["hint"]))
    return "; ".join(clauses)


def candidate_actions(operator: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Map the operator's four directional previews to closed action choices.

    The previews are facts for the current state only.  They are not a promise
    that execution will still be valid when a caller eventually acts.
    """
    moves = ((operator.get("tactical") or {}).get("moves") or [])
    by_direction = {move.get("direction"): move for move in moves if isinstance(move, dict)}
    candidates: dict[str, dict[str, Any]] = {}
    for direction in DIRECTIONS:
        move = by_direction.get(direction)
        if not move:
            continue
        # A bare solid wall is never a meaningful input choice.  Keep a solid
        # direction only when an occupant gives the normal action processor an
        # interaction to resolve (for example, a wall torch or destroyable).
        if move.get("resolution") == "blocked-or-interact" and not move.get("occupantId"):
            continue
        consequence = move.get("consequence") if isinstance(move.get("consequence"), dict) else {}
        attack = move.get("attack") if isinstance(move.get("attack"), dict) else {}
        candidates[f"move_{direction}"] = {
            "direction": direction,
            "description": _move_description(move),
            "resolution": move.get("resolution"),
            "occupantId": move.get("occupantId"),
            "staysInPlace": move.get("staysInPlace"),
            "knownIncomingDamageBeforeDefense": _number(consequence.get("knownIncomingDamageBeforeDefense")),
            "unknownDamageSources": int(consequence.get("unknownDamageSources") or 0),
            "killsBeforeEnemyResponse": attack.get("killsBeforeEnemyResponse"),
            "neutralizesThreatSource": attack.get("neutralizesThreatSource"),
            "executor": "advisory-only; validate through the game action processor before execution",
        }
    if not candidates:
        raise ValueError("Operator packet contains no directional move previews")
    return candidates


def _objective_candidates(operator: dict[str, Any], limit: int = 12) -> dict[str, dict[str, Any]]:
    room = operator.get("room") if isinstance(operator.get("room"), dict) else {}
    candidates: dict[str, dict[str, Any]] = {
        "safe_reposition": {
            "description": "Move to a code-previewed position that avoids immediate known damage.",
            "kind": "position",
        },
    }
    entities = room.get("entities") if isinstance(room.get("entities"), list) else []
    for index, entity in enumerate(entities):
        if not isinstance(entity, dict) or not (entity.get("isEnemy") or entity.get("isSpawner")):
            continue
        key = "target_" + _id(entity.get("id"), "enemy", index)
        combat = _combat_summary(entity)
        candidates[key] = {
            "description": entity.get("description") or entity.get("kind") or entity.get("name") or "visible hostile entity",
            "kind": "spawner" if entity.get("isSpawner") else "enemy",
            "id": entity.get("id"),
            "health": combat["health"],
            "currentDamage": combat["currentDamage"],
            "forwardOnly": combat["forwardOnly"],
        }
        if len(candidates) >= limit:
            return candidates
    for point in ((operator.get("pathfinding") or {}).get("pointsOfInterest") or []):
        if not isinstance(point, dict) or point.get("kind") not in {"door", "ladder"}:
            continue
        key = "target_" + _id(point.get("id"), "poi", len(candidates))
        route = point.get("route") if isinstance(point.get("route"), dict) else {}
        route_actions = route.get("actions") if isinstance(route.get("actions"), list) else []
        candidates[key] = {
            "description": f"{point.get('kind')} at ({point.get('x')}, {point.get('y')}); "
            f"A* reachable: {route.get('reachable')}; route length: {len(route_actions)}",
            "kind": point.get("kind"),
            "id": point.get("id"),
        }
        if len(candidates) >= limit:
            break
    return candidates


def _inventory_summary(inventory: Any) -> list[dict[str, Any]]:
    if not isinstance(inventory, list):
        return []
    result = []
    for index, item in enumerate(inventory):
        if not isinstance(item, dict):
            continue
        traits = item.get("traits") if isinstance(item.get("traits"), dict) else {}
        categories = item.get("categories") if isinstance(item.get("categories"), list) else []
        result.append({
            "slot": item.get("slot", index), "id": item.get("id"), "kind": item.get("kind"),
            "categories": [category for category in categories if isinstance(category, str)],
            "activeWeapon": item.get("activeWeapon") is True,
            "healingAmount": _number(item.get("healingAmount")),
            "useTurnCost": _number(item.get("useTurnCost")),
            "damage": _number(traits.get("minimumAttackDamage")),
            "range": traits.get("range"), "attackPattern": traits.get("attackPattern"),
            "successfulAttackTurnCost": _number(traits.get("successfulAttackTurnCost")),
            "equippable": traits.get("equippable") is True,
        })
    return result


def _weapon_candidates(inventory: list[dict[str, Any]]) -> dict[str, str]:
    """Offer only known weapon inventory entries plus a safe no-change choice."""
    current = next((item for item in inventory if item["activeWeapon"]), None)
    current_id = current.get("id") if current else "no active weapon"
    candidates = {"keep_current": f"Keep the currently active weapon ({current_id})."}
    for item in inventory:
        if "weapon" not in item["categories"]:
            continue
        key = f"weapon_slot_{item['slot']}"
        candidates[key] = (
            f"Equip slot {item['slot']} ({item.get('id') or item.get('kind')}); "
            f"minimum damage {item.get('damage')}, range {item.get('range')}, "
            f"pattern {item.get('attackPattern')}, successful attack turn cost {item.get('successfulAttackTurnCost')}"
        )
    return candidates


def build_packet(view: dict[str, Any], operator: dict[str, Any], baseline_action: dict[str, Any] | None = None) -> dict[str, Any]:
    """Build a compact, versioned decision packet from current game facts."""
    if operator.get("privileged") is not True:
        raise ValueError("Jev referee requires the explicit privileged demonstration operator view")
    if operator.get("observationMode") != "privileged-demonstration-operator":
        raise ValueError("Unsupported operator observation mode")
    if operator.get("decision") != "world":
        raise ValueError("This UI decision does not have a directional tactical action set")
    player = operator.get("player") if isinstance(operator.get("player"), dict) else {}
    room = operator.get("room") if isinstance(operator.get("room"), dict) else {}
    tactical = operator.get("tactical") if isinstance(operator.get("tactical"), dict) else {}
    current = tactical.get("currentTile") if isinstance(tactical.get("currentTile"), dict) else {}
    inventory = _inventory_summary(operator.get("inventory"))
    packet = {
        "schemaVersion": PACKET_SCHEMA_VERSION,
        "source": {
            "operatorSchemaVersion": operator.get("schemaVersion"),
            "operatorObservationMode": operator.get("observationMode"),
            "viewObservationMode": view.get("observationMode"),
            "gameContract": view.get("contract"),
        },
        "player": {
            "health": _number(player.get("health")), "maxHealth": _number(player.get("maxHealth")),
            "mana": _number(player.get("mana")), "maxMana": _number(player.get("maxMana")),
            "coins": _number(player.get("coins")), "position": {"x": player.get("x"), "y": player.get("y")},
            "inventory": inventory,
        },
        "room": {
            "id": room.get("id"), "depth": room.get("depth"), "roomType": room.get("roomType"),
            "environment": room.get("environment"), "bossRoom": room.get("bossRoom") is True,
            "enemyCount": int(room.get("enemyCount") or 0), "enemyFree": room.get("enemyFree") is True,
            "progressBlockedByEnemies": room.get("progressBlockedByEnemies") is True,
            "progressRule": room.get("progressRule"), "sidePath": room.get("sidePath") is True,
            "sidePathHint": room.get("sidePathHint"),
        },
        "currentThreat": {
            "knownIncomingDamageBeforeDefense": _number(current.get("knownIncomingDamageBeforeDefense")),
            "unknownDamageSources": int(current.get("unknownDamageSources") or 0),
            "projectileDamage": _number(current.get("projectileDamage")),
            "instruction": tactical.get("instruction"),
        },
        "objectives": _objective_candidates(operator),
        "actions": candidate_actions(operator),
        "weaponChoices": _weapon_candidates(inventory),
        "baselineAction": baseline_action,
        "executionBoundary": "Jev returns advice only. The action processor re-validates every proposed action.",
    }
    return packet


def questions_for(packet: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Atomic questions sent together against one packet."""
    combat_targets = {
        key: value["description"] for key, value in packet["objectives"].items()
        if value.get("kind") in {"enemy", "spawner"}
    }
    combat_targets["no_combat_target"] = "No enemy or spawner should be prioritized in the current state."
    return {
        "motivation": {
            "type": "choice",
            "instructions": "Choose the broad motivation governing this decision. This is the root of the tactical tree.",
            "criteria": {
                "explore": "Cover accessible areas not visited before and investigate new doors or branches.",
                "progress": "Pursue required objectives, beat the boss, or advance to the next floor.",
                "prepare": "Gather food, items, weapons, healing, or positioning for later progression.",
                "uncertain": "The packet does not establish one primary mode with enough certainty.",
            },
        },
        "engagement": {
            "type": "choice",
            "instructions": "Choose the combat posture under the selected motivation. Evade means avoiding engagement locally without abandoning the broader objective.",
            "criteria": {
                "fight": "Engage to kill, disable, or control enemies.",
                "retreat": "Disengage and create meaningful distance because continued combat is too dangerous or unnecessary.",
                "evade": "Avoid engaging an enemy while continuing the current room-level objective.",
                "not_in_combat": "No combat posture is presently needed.",
                "uncertain": "The safe engagement posture is not established by the supplied facts.",
            },
        },
        "objective": {
            "type": "choice",
            "instructions": "Which supplied objective should be prioritized on this turn? Use safe reposition when no listed enemy, spawner, door, or ladder should be approached now.",
            "criteria": {key: value["description"] for key, value in packet["objectives"].items()},
        },
        "tactic": {
            "type": "choice",
            "instructions": "What one-turn tactical purpose best fits the supplied facts? Do not assume damage, reachability, or future enemy behavior beyond the packet.",
            "criteria": {
                "eliminate_threat": "Kill or disable a threat before it can harm the player this turn.",
                "dodge": "Leave a threatened tile or avoid a predicted immediate hit.",
                "advance_safely": "Move toward the selected objective with zero known and zero unknown incoming damage this turn.",
                "create_space": "Reposition or push to improve later tactical options without claiming immediate progress.",
                "collect": "Take a safe action to obtain a resource or interact with a useful object.",
                "heal": "Use an available zero-turn healing resource because it is the most useful immediate preparation.",
                "uncertain": "No supplied tactic is clearly supported by the packet.",
            },
        },
        "target_priority": {
            "type": "choice",
            "instructions": "If fighting, which supplied enemy or spawner should be prioritized first? Choose no_combat_target outside a fight posture.",
            "criteria": combat_targets,
        },
        "room_intent": {
            "type": "choice",
            "instructions": "Should the agent stay in or leave the current room? Do not leave without a concrete Explore, Progress, Prepare, Retreat, or Evade reason supported by the packet.",
            "criteria": {
                "stay": "Remain because the current room still contains a relevant objective, threat, resource, or unresolved route.",
                "leave": "Leave because a supplied route directly serves the selected motivation or combat posture.",
                "indifferent": "Staying and leaving are tactically equivalent for this immediate decision.",
                "uncertain": "The packet does not justify a room-level choice.",
            },
        },
        "action": {
            "type": "choice",
            "instructions": "Which supplied directional input best realizes the selected immediate purpose? Choose only from the listed actions. This is advisory; game code will validate it before execution.",
            "criteria": {key: value["description"] for key, value in packet["actions"].items()},
        },
        "weapon": {
            "type": "choice",
            "instructions": "Which listed weapon should remain or become active for this immediate state? Choose keep_current unless an alternative has a stated immediate tactical advantage. This is an advisory zero-turn equipment label; it does not execute an inventory action.",
            "criteria": packet["weaponChoices"],
        },
        "reasoning": {
            "type": "choice",
            "instructions": "Decide whether this state can be acted on directly or should enter Think. Use deeper reasoning when danger, uncertainty, or interacting tactical consequences make the atomic answers insufficient.",
            "criteria": {
                "act_now": "The supplied facts support a sufficiently confident immediate action.",
                "think_jev_chain": "Ask a short chain of additional Jev questions about competing threats, objectives, or action consequences.",
                "escalate_reasoner": "Use a more capable reasoning model because the situation requires multi-step assessment beyond this packet.",
                "uncertain": "The appropriate reasoning depth cannot be determined.",
            },
        },
        "baseline_adequate": {
            "type": "noul",
            "instructions": "Is the supplied baseline action an acceptable action for the immediate state described in this packet? If no baseline action is supplied, answer no.",
            "criteria": {
                "true": "The baseline action is a reasonable local response and does not conflict with stated immediate threat facts.",
                "false": "No baseline action is supplied, or the action conflicts with the stated immediate priority or threat facts.",
            },
        },
        "human_teaching_value": {
            "type": "score",
            "instructions": "How valuable would a human correction be for teaching an agent from this exact state? Rate ambiguity and strategic significance, not visual complexity.",
            "criteria": [
                "Routine: deterministic navigation or an obvious immediate action.",
                "Useful: a meaningful but straightforward tactical choice.",
                "High value: competing legal tactical choices, recovery, boss/spawner pressure, or preparation tradeoffs.",
            ],
        },
    }


class JevClient:
    """Small HTTP client so the pilot has no new package dependency."""

    def __init__(self, api_key: str | None = None, *, endpoint: str = DEFAULT_ENDPOINT,
                 model: str = DEFAULT_MODEL, timeout: float = 15, retries: int = 2,
                 request: Callable[[Request, float], tuple[int, bytes]] | None = None):
        self.api_key = api_key or os.environ.get("TYPESAFE_API_KEY")
        self.endpoint = endpoint
        self.model = model
        self.timeout = timeout
        self.retries = retries
        self.request = request

    def evaluate(self, packet: dict[str, Any]) -> dict[str, Any]:
        if not self.api_key:
            raise JevRequestError("TYPESAFE_API_KEY is required for a live Jev evaluation")
        body = json.dumps({"state": packet, "model": self.model, "questions": questions_for(packet)}).encode("utf-8")
        request = Request(self.endpoint, data=body, method="POST", headers={
            "Authorization": "Bearer " + self.api_key,
            "Content-Type": "application/json",
        })
        last_error: Exception | None = None
        for attempt in range(self.retries + 1):
            try:
                if self.request is not None:
                    status, data = self.request(request, self.timeout)
                    if status >= 400:
                        raise HTTPError(self.endpoint, status, "request failed", {}, None)
                else:
                    with urlopen(request, timeout=self.timeout) as response:  # noqa: S310 - fixed provider endpoint
                        data = response.read()
                decoded = json.loads(data)
                if not isinstance(decoded, dict) or not isinstance(decoded.get("answers"), dict):
                    raise JevRequestError("TypeSafe response did not contain an answers object")
                return decoded
            except HTTPError as error:
                last_error = error
                if error.code not in {429, 529} or attempt >= self.retries:
                    raise JevRequestError(f"TypeSafe request failed with HTTP {error.code}") from None
            except (URLError, TimeoutError, OSError, json.JSONDecodeError) as error:
                last_error = error
                if attempt >= self.retries:
                    raise JevRequestError("TypeSafe request failed after retrying") from None
            time.sleep(0.25 * (2 ** attempt))
        raise JevRequestError("TypeSafe request failed") from last_error


def _choice(response: dict[str, Any], question: str, allowed: set[str]) -> tuple[str | None, float | None]:
    answer = (response.get("answers") or {}).get(question)
    if not isinstance(answer, dict) or answer.get("type") != "choice":
        return None, None
    choice = answer.get("choice")
    confidence = _number(answer.get("confidence"))
    return (choice if isinstance(choice, str) and choice in allowed else None), confidence


def advice_from_response(packet: dict[str, Any], response: dict[str, Any], confidence_floor: float = 0.8) -> dict[str, Any]:
    """Validate Jev's closed-set answer without treating it as an executable action."""
    if not 0 <= confidence_floor <= 1:
        raise ValueError("confidence floor must be 0..1")
    motivation, motivation_confidence = _choice(response, "motivation", {"explore", "progress", "prepare", "uncertain"})
    engagement, engagement_confidence = _choice(response, "engagement", {"fight", "retreat", "evade", "not_in_combat", "uncertain"})
    objective, objective_confidence = _choice(response, "objective", set(packet["objectives"]))
    tactic, tactic_confidence = _choice(response, "tactic", {"eliminate_threat", "dodge", "advance_safely", "create_space", "collect", "heal", "uncertain"})
    combat_targets = {key for key, value in packet["objectives"].items() if value.get("kind") in {"enemy", "spawner"}}
    target, target_confidence = _choice(response, "target_priority", combat_targets | {"no_combat_target"})
    room_intent, room_confidence = _choice(response, "room_intent", {"stay", "leave", "indifferent", "uncertain"})
    action, action_confidence = _choice(response, "action", set(packet["actions"]))
    weapon, weapon_confidence = _choice(response, "weapon", set(packet["weaponChoices"]))
    reasoning, reasoning_confidence = _choice(response, "reasoning", {"act_now", "think_jev_chain", "escalate_reasoner", "uncertain"})
    review = ((response.get("answers") or {}).get("human_teaching_value") or {})
    review_score = _number(review.get("score")) if review.get("type") == "score" else None
    baseline = ((response.get("answers") or {}).get("baseline_adequate") or {})
    baseline_noul = _number(baseline.get("noul")) if baseline.get("type") == "noul" else None
    core_confidences = (motivation_confidence, engagement_confidence, objective_confidence,
                        tactic_confidence, room_confidence, action_confidence, reasoning_confidence)
    confidence = min(core_confidences) if all(value is not None for value in core_confidences) else None
    approved = action is not None and reasoning == "act_now" and confidence is not None and confidence >= confidence_floor
    return {
        "schemaVersion": REFEREE_SCHEMA_VERSION,
        "model": response.get("model"), "usage": response.get("usage"),
        # Preserve the provider's probability distributions for offline audit;
        # they remain advice and are never accepted as an action protocol.
        "answers": response.get("answers"),
        "motivation": {"choice": motivation, "confidence": motivation_confidence},
        "engagement": {"choice": engagement, "confidence": engagement_confidence},
        "objective": {"choice": objective, "confidence": objective_confidence},
        "tactic": {"choice": tactic, "confidence": tactic_confidence},
        "targetPriority": {"choice": target, "confidence": target_confidence},
        "roomIntent": {"choice": room_intent, "confidence": room_confidence},
        "action": {"choice": action, "confidence": action_confidence,
                   "proposedGameAction": {"type": "Move", "direction": packet["actions"][action]["direction"]} if approved else None},
        "weapon": {"choice": weapon, "confidence": weapon_confidence,
                   "execution": "advisory label only; no inventory action is proposed"},
        "reasoning": {"choice": reasoning, "confidence": reasoning_confidence,
                      "requiresThink": reasoning in {"think_jev_chain", "escalate_reasoner", "uncertain"}},
        "confidenceFloor": confidence_floor, "combinedConfidence": confidence,
        "autoActionEligible": approved,
        "humanTeachingValue": review_score,
        "baselineAdequateProbability": baseline_noul,
        "executionBoundary": "Advice only. Recompute the live preview and validate through the action processor before any action.",
    }


def _write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.write_text("".join(json.dumps(row, separators=(",", ":")) + "\n" for row in rows), encoding="utf-8")


def collect_baseline_packets(out: Path, *, seeds: int, budget: int, max_packets: int,
                             viewer_dir: Path | None = None, jev_unstick: bool = False,
                             client: JevClient | None = None) -> dict[str, Any]:
    """Collect unlabelled/referee-ready state packets from real browser gameplay."""
    from dungeon_pilot import DungeonEnv, ROOT, seed_plan  # Browser dependencies stay out of unit tests.

    if out.exists():
        raise ValueError("Output directory already exists")
    out.mkdir(parents=True)
    env = DungeonEnv(out / "browser", budget=budget, viewer_dir=viewer_dir)
    rows: list[dict[str, Any]] = []
    outcomes: list[dict[str, Any]] = []
    try:
        for episode_seed in seed_plan("training", 64)[:seeds]:
            env.reset(options={"episodeSeed": episode_seed})
            if not env.page.evaluate("() => typeof AgentBaseline !== 'undefined'"):
                env.page.add_script_tag(path=str(ROOT / "agent-baseline.js"))
            env.page.evaluate("() => { window.jevRefereeTeacher = new AgentBaseline.Policy(); }")
            decisions = 0
            recent_positions: deque[tuple[str, int, int]] = deque(maxlen=16)
            seen_positions: set[tuple[str, int, int]] = set()
            last_novelty = 0
            last_intervention = -100
            while decisions < env.budget and len(rows) < max_packets:
                before = env.view
                teacher = env.page.evaluate("(view) => window.jevRefereeTeacher.choose(view)", before)
                if not teacher:
                    break
                operator = env.page.evaluate("() => window.agent.inspectOperator()")
                room = operator.get("room") if isinstance(operator.get("room"), dict) else {}
                position = (str(room.get("id")), int(before["player"]["x"]), int(before["player"]["y"]))
                recent_positions.append(position)
                if position not in seen_positions:
                    seen_positions.add(position)
                    last_novelty = decisions
                baseline_state = env.page.evaluate("() => window.jevRefereeTeacher.inspect()")
                motivation = ("progress" if room.get("bossRoom") or room.get("progressBlockedByEnemies")
                              else "prepare" if room.get("sidePath") else "explore")
                engagement = "fight" if int(room.get("enemyCount") or 0) else "not_in_combat"
                env.tactical_status = {
                    "motivation": motivation, "engagement": engagement,
                    "roomIntent": "stay" if room.get("enemyCount") else "indifferent",
                    "action": teacher.get("direction") or teacher.get("type"),
                    "source": "programmed-baseline", "confidence": None,
                    "reason": baseline_state.get("reason"),
                }
                if before.get("decision") == "world" and operator.get("decision") == "world":
                    packet = build_packet(before, operator, teacher)
                    stalled = (jev_unstick and client is not None and room.get("enemyFree") is True and
                               decisions - last_novelty >= 12 and len(set(recent_positions)) <= 5 and
                               decisions - last_intervention >= 8)
                    if stalled:
                        intervention_packet = copy.deepcopy(packet)
                        repeated = set(recent_positions)
                        moves = {
                            move.get("direction"): move for move in
                            ((operator.get("tactical") or {}).get("moves") or []) if isinstance(move, dict)
                        }
                        escape_actions = {}
                        for key, candidate in intervention_packet["actions"].items():
                            move = moves.get(candidate.get("direction"), {})
                            target = move.get("target") if isinstance(move.get("target"), dict) else {}
                            target_position = (str(room.get("id")), target.get("x"), target.get("y"))
                            if (candidate.get("staysInPlace") is False and
                                    candidate.get("knownIncomingDamageBeforeDefense") in (None, 0) and
                                    candidate.get("unknownDamageSources", 0) == 0 and
                                    target_position not in repeated):
                                escape_actions[key] = candidate
                        if escape_actions:
                            intervention_packet["actions"] = escape_actions
                        intervention_packet["stuckEvidence"] = {
                            "decisionsWithoutNewPosition": decisions - last_novelty,
                            "recentUniquePositions": len(set(recent_positions)),
                            "repeatedPositions": [list(value) for value in sorted(repeated)],
                            "restrictedToNovelSafeMoves": bool(escape_actions),
                            "instruction": "Break the navigation cycle now. Choose one of the supplied safe actions; when restrictedToNovelSafeMoves is true, every supplied action leaves the repeated positions.",
                        }
                        response = client.evaluate(intervention_packet)
                        advice = advice_from_response(intervention_packet, response, 0.65)
                        action_choice = advice["action"].get("choice")
                        candidate = intervention_packet["actions"].get(action_choice, {})
                        if candidate:
                            proposed = {"type": "Move", "direction": candidate["direction"]}
                            if (candidate.get("knownIncomingDamageBeforeDefense") in (None, 0) and
                                    candidate.get("unknownDamageSources", 0) == 0):
                                teacher = proposed
                                last_intervention = decisions
                                packet["stuckEvidence"] = intervention_packet["stuckEvidence"]
                                packet["jevIntervention"] = advice
                                env.tactical_status = {
                                    "motivation": advice["motivation"]["choice"],
                                    "engagement": advice["engagement"]["choice"],
                                    "roomIntent": advice["roomIntent"]["choice"],
                                    "action": action_choice, "source": "jev-unstick",
                                    "confidence": advice["action"]["confidence"],
                                    "trigger": f"{decisions-last_novelty} decisions without a new position",
                                }
                    rows.append({"packet": packet, "teacherAction": teacher,
                                 "episodeSeed": episode_seed, "step": decisions})
                _reward, dead, truncated = env.execute(teacher, "jev-referee-collection")
                env.page.evaluate("""([before, action, after, turnDelta]) =>
                    window.jevRefereeTeacher.feedback(before, action, after, {turnDelta})""",
                                  [before, teacher, env.view, env.trace[-1]["turnDelta"]])
                decisions += 1
                if dead or truncated:
                    break
            outcomes.append({"episodeSeed": episode_seed, "decisions": decisions,
                             "packets": sum(1 for row in rows if row["episodeSeed"] == episode_seed),
                             "terminated": bool(env.view.get("terminated")), "truncated": bool(env.view.get("truncated"))})
            if len(rows) >= max_packets:
                break
        _write_jsonl(out / "packets.jsonl", rows)
        report = {"schemaVersion": REFEREE_SCHEMA_VERSION, "mode": "baseline-packet-collection",
                  "jevUnstick": jev_unstick,
                  "packets": len(rows), "episodes": len(outcomes), "outcomes": outcomes}
        (out / "complete.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        return report
    finally:
        env.close()


def evaluate_packets(packets: Path, out: Path, *, max_packets: int, confidence_floor: float,
                     client: JevClient) -> dict[str, Any]:
    if out.exists():
        raise ValueError("Output directory already exists")
    rows = [json.loads(line) for line in packets.read_text(encoding="utf-8").splitlines() if line.strip()]
    if not rows:
        raise ValueError("No packets found")
    out.mkdir(parents=True)
    results: list[dict[str, Any]] = []
    for source in rows[:max_packets]:
        packet = source.get("packet") if isinstance(source, dict) else None
        if not isinstance(packet, dict):
            raise ValueError("Packet row is missing packet")
        response = client.evaluate(packet)
        results.append({"packetHash": hashlib.sha256(json.dumps(packet, sort_keys=True).encode()).hexdigest(),
                        "episodeSeed": source.get("episodeSeed"), "step": source.get("step"),
                        "teacherAction": source.get("teacherAction"),
                        "advice": advice_from_response(packet, response, confidence_floor)})
    _write_jsonl(out / "advice.jsonl", results)
    report = {"schemaVersion": REFEREE_SCHEMA_VERSION, "mode": "live-evaluation", "packets": len(results),
              "autoActionEligible": sum(row["advice"]["autoActionEligible"] for row in results),
              "humanTeachingHighValue": sum((row["advice"]["humanTeachingValue"] or 0) >= 1.5 for row in results),
              "confidenceFloor": confidence_floor, "packetSource": str(packets)}
    (out / "complete.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    collect = commands.add_parser("collect", help="Collect real-game, baseline-labelled Jev packets")
    collect.add_argument("--out", type=Path, required=True)
    collect.add_argument("--seeds", type=int, default=4)
    collect.add_argument("--budget", type=int, default=256)
    collect.add_argument("--max-packets", type=int, default=200)
    collect.add_argument("--viewer-dir", type=Path,
                         help="Write a passive live-frame.png and live-state.json after each action")
    collect.add_argument("--jev-unstick", action="store_true",
                         help="Ask Jev for one safe action after an enemy-free navigation loop is detected")
    evaluate = commands.add_parser("evaluate", help="Evaluate saved packets using Jev")
    evaluate.add_argument("--packets", type=Path, required=True)
    evaluate.add_argument("--out", type=Path, required=True)
    evaluate.add_argument("--max-packets", type=int, default=200)
    evaluate.add_argument("--confidence-floor", type=float, default=0.8)
    evaluate.add_argument("--model", default=DEFAULT_MODEL)
    args = parser.parse_args()
    if args.command == "collect":
        if not 1 <= args.seeds <= 64 or not 1 <= args.budget <= 10000 or not 1 <= args.max_packets <= 10000:
            parser.error("Invalid collection bounds")
        client = JevClient() if args.jev_unstick else None
        print(json.dumps(collect_baseline_packets(args.out, seeds=args.seeds, budget=args.budget,
                                                   max_packets=args.max_packets, viewer_dir=args.viewer_dir,
                                                   jev_unstick=args.jev_unstick, client=client)), flush=True)
    else:
        if not args.packets.is_file() or not 1 <= args.max_packets <= 10000 or not 0 <= args.confidence_floor <= 1:
            parser.error("Invalid evaluation input or bounds")
        client = JevClient(model=args.model)
        print(json.dumps(evaluate_packets(args.packets, args.out, max_packets=args.max_packets,
                                          confidence_floor=args.confidence_floor, client=client)), flush=True)


if __name__ == "__main__":
    main()
