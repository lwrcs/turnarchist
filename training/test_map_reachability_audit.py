"""Adversarial fixtures for the independent map auditor."""

import unittest

from map_reachability_audit import gate_findings, graph_findings, tile_findings


def room(rid, *, doors=(), items=(), walk=((True, True, True),), kind="DUNGEON"):
    return {"id": rid, "type": kind, "x": 0, "y": 0, "w": 3, "h": 1,
            "walk": walk, "doors": list(doors), "items": list(items), "ladders": []}


def door(other, *, key=0, locked=False, x=0):
    return {"other": other, "key": key, "locked": locked,
            "type": 1 if locked else 0, "x": x, "y": 0}


class MapReachabilityAuditTests(unittest.TestCase):
    def test_disconnected_partition_and_asymmetric_link_are_found(self):
        parts = [{"i": 0, "type": "START", "connections": [{"other": 1}]},
                 {"i": 1, "type": "DOWNLADDER", "connections": []},
                 {"i": 2, "type": "DUNGEON", "connections": []}]
        result = graph_findings(parts)
        self.assertIn("asymmetric_connection:0->1", result)
        self.assertIn("unreachable_partition:2:DUNGEON", result)

    def test_solid_barrier_separates_door_anchors(self):
        level = {"start": "A", "exit": None, "rooms": [room("A", doors=[door("B", x=0), door("B", x=2)], walk=((True, False, True),)), room("B", doors=[door("A")])]}
        self.assertTrue(any(f.startswith("tile_anchor_unreachable:A:door:2,0") for f in tile_findings(level)))

    def test_key_behind_its_own_gate_is_unreachable(self):
        level = {"start": "A", "exit": "B", "rooms": [
            room("A", doors=[door("B", key=7, locked=True)]),
            room("B", doors=[door("A", key=7, locked=True)], items=[{"kind": "Key", "key": 7, "x": 1, "y": 0}]),
        ]}
        self.assertIn("key_gated_exit_unreachable:B", gate_findings(level))
        level["rooms"][0]["items"] = [{"kind": "Key", "key": 7, "x": 1, "y": 0}]
        self.assertNotIn("key_gated_exit_unreachable:B", gate_findings(level))
