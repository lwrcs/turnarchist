import copy
import json
import unittest

from jev_referee import (JevClient, JevRequestError, advice_from_response,
                          build_packet, candidate_actions, questions_for)


def operator():
    return {
        'schemaVersion': 1, 'privileged': True,
        'observationMode': 'privileged-demonstration-operator', 'decision': 'world',
        'player': {'x': 8, 'y': 11, 'health': 1.0, 'maxHealth': 2.0, 'mana': 0, 'maxMana': 1, 'coins': 3},
        'inventory': [{'slot': 0, 'id': 'dagger', 'kind': 'dagger', 'activeWeapon': True,
                       'categories': ['weapon'],
                       'traits': {'minimumAttackDamage': 1, 'range': 1, 'attackPattern': 'adjacent-cardinal'}}],
        'room': {
            'id': 'room-a', 'depth': 0, 'roomType': 'BOSS', 'environment': 'sewer',
            'bossRoom': True, 'enemyCount': 2, 'enemyFree': False, 'progressBlockedByEnemies': True,
            'progressRule': 'Kill every enemy in this boss room before progression unlocks.',
            'sidePath': False, 'sidePathHint': None,
            'entities': [
                {'id': 'zombie-a', 'isEnemy': True, 'description': 'armored zombie',
                 'combat': {'health': 2, 'maxHealth': 2, 'baseDamage': 1, 'currentDamage': 1,
                            'killDamageThreshold': 2, 'forwardOnly': True}},
                {'id': 'spawner-a', 'isEnemy': True, 'isSpawner': True, 'description': 'zombie spawner',
                 'combat': {'health': 4, 'maxHealth': 4, 'baseDamage': 0, 'currentDamage': 0}},
            ],
        },
        'tactical': {
            'currentTile': {'knownIncomingDamageBeforeDefense': 1, 'unknownDamageSources': 0, 'projectileDamage': 0},
            'instruction': 'Either leave this warning or kill its source.',
            'moves': [
                {'direction': 'up', 'target': {'x': 8, 'y': 10}, 'resolution': 'attack', 'occupantId': 'zombie-a',
                 'staysInPlace': True, 'attack': {'attempted': True, 'killsBeforeEnemyResponse': False,
                                                     'neutralizesThreatSource': False},
                 'consequence': {'knownIncomingDamageBeforeDefense': 1, 'unknownDamageSources': 0}},
                {'direction': 'right', 'target': {'x': 9, 'y': 11}, 'resolution': 'move', 'staysInPlace': False,
                 'attack': {'attempted': False},
                 'consequence': {'knownIncomingDamageBeforeDefense': 0, 'unknownDamageSources': 0}},
                {'direction': 'down', 'target': {'x': 8, 'y': 12}, 'resolution': 'move', 'staysInPlace': False,
                 'attack': {'attempted': False},
                 'consequence': {'knownIncomingDamageBeforeDefense': 0, 'unknownDamageSources': 1}},
                {'direction': 'left', 'target': {'x': 7, 'y': 11}, 'resolution': 'blocked-or-interact', 'staysInPlace': True,
                 'attack': {'attempted': False},
                 'consequence': {'knownIncomingDamageBeforeDefense': 1, 'unknownDamageSources': 0}},
            ],
        },
        'pathfinding': {'pointsOfInterest': [
            {'id': 'tile:10,11', 'kind': 'door', 'x': 10, 'y': 11,
             'route': {'reachable': True, 'steps': [{'x': 9, 'y': 11}]}}
        ]},
    }


class JevRefereeTests(unittest.TestCase):
    def view(self):
        return {'observationMode': 'player-perception', 'contract': {'actionSchemaVersion': 5}}

    def test_packet_uses_existing_preview_and_closed_choices(self):
        packet = build_packet(self.view(), operator(), {'type': 'Move', 'direction': 'right'})
        self.assertEqual(set(packet['actions']), {'move_up', 'move_right', 'move_down'})
        self.assertNotIn('move_left', packet['actions'])
        self.assertEqual(packet['actions']['move_up']['killsBeforeEnemyResponse'], False)
        self.assertEqual(packet['actions']['move_right']['knownIncomingDamageBeforeDefense'], 0)
        self.assertIn('target_zombie-a', packet['objectives'])
        self.assertIn('target_spawner-a', packet['objectives'])
        self.assertEqual(set(packet['weaponChoices']), {'keep_current', 'weapon_slot_0'})
        questions = questions_for(packet)
        self.assertEqual(set(questions), {'mode', 'objective', 'tactic', 'action', 'weapon', 'baseline_adequate', 'human_teaching_value'})
        self.assertEqual(set(questions['action']['criteria']), set(packet['actions']))

    def test_packet_requires_privileged_operator_boundary(self):
        invalid = operator(); invalid['privileged'] = False
        with self.assertRaisesRegex(ValueError, 'privileged'):
            build_packet(self.view(), invalid)
        invalid = operator(); invalid['decision'] = 'vending'
        with self.assertRaisesRegex(ValueError, 'directional tactical'):
            build_packet(self.view(), invalid)

    def test_advice_rejects_unknown_choice_and_gates_low_confidence(self):
        packet = build_packet(self.view(), operator())
        response = {'model': 'jev-latest', 'usage': {'input_tokens': 12, 'output_tokens': 2}, 'answers': {
            'mode': {'type': 'choice', 'choice': 'fight', 'confidence': .9},
            'objective': {'type': 'choice', 'choice': 'target_zombie-a', 'confidence': .9},
            'tactic': {'type': 'choice', 'choice': 'dodge', 'confidence': .9},
            'action': {'type': 'choice', 'choice': 'move_right', 'confidence': .79},
            'weapon': {'type': 'choice', 'choice': 'keep_current', 'confidence': .9},
            'baseline_adequate': {'type': 'noul', 'noul': .8},
            'human_teaching_value': {'type': 'score', 'score': 1.7, 'confidence': .8},
        }}
        advice = advice_from_response(packet, response, .8)
        self.assertFalse(advice['autoActionEligible'])
        self.assertIsNone(advice['action']['proposedGameAction'])
        self.assertEqual(advice['answers']['action']['choice'], 'move_right')
        self.assertEqual(advice['weapon']['choice'], 'keep_current')
        response = copy.deepcopy(response); response['answers']['action']['choice'] = 'not-a-candidate'; response['answers']['action']['confidence'] = 1
        self.assertFalse(advice_from_response(packet, response, .8)['autoActionEligible'])

    def test_client_requires_key_without_sending_request(self):
        called = []
        client = JevClient(api_key='', request=lambda request, timeout: called.append((request, timeout)))
        with self.assertRaisesRegex(JevRequestError, 'TYPESAFE_API_KEY'):
            client.evaluate(build_packet(self.view(), operator()))
        self.assertEqual(called, [])

    def test_client_sends_closed_questions_to_fixed_endpoint(self):
        received = []
        response = {'model': 'jev-latest', 'answers': {'mode': {'type': 'choice'}}}

        def request(request, timeout):
            received.append((request.full_url, request.get_header('Authorization'), timeout,
                             json.loads(request.data.decode('utf-8'))))
            return 200, json.dumps(response).encode('utf-8')

        packet = build_packet(self.view(), operator())
        answer = JevClient(api_key='test-only-key', request=request).evaluate(packet)
        self.assertEqual(answer, response)
        url, authorization, timeout, body = received[0]
        self.assertEqual(url, 'https://api.typesafe.ai/v1/systemone')
        self.assertEqual(authorization, 'Bearer test-only-key')
        self.assertEqual(timeout, 15)
        self.assertEqual(body['state'], packet)
        self.assertEqual(set(body['questions']['action']['criteria']), set(packet['actions']))


if __name__ == '__main__':
    unittest.main()
