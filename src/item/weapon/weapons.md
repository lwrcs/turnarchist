# Weapons Guide

## Weapon Types and Uses

1. **Dagger**: Basic melee weapon with 1 damage.
2. **Dual Daggers**: Allows two attacks per turn.
3. **Spear**: Melee weapon with 2-tile range.
4. **Slingshot**: Ranged weapon with 5-tile range.
5. **Shotgun**: Ranged weapon with 3-tile range and penetration.
6. **Pickaxe**: Melee weapon that can mine.
7. **Spellbook**: Magical weapon that shoots fireballs.

## Developer Guide: Implementing New Weapons

1. Create a new class extending `Weapon` in `src/weapon/`.
2. Implement the `constructor`:
   - Set `tileX` and `tileY` for sprite rendering.
   - Set `canMine` if applicable.

3. Override `weaponMove(newX: number, newY: number): boolean`:
   - Handle weapon-specific logic.
   - Return `true` if nothing was hit, `false` if the player should move.

4. Implement `getDescription(): string` to provide weapon info.

5. Optional: Override `tickInInventory()` for special inventory behavior.

6. Add particle effects using `GenericParticle` or custom particles.

7. Use `Sound.hit()` for attack sounds.

8. Handle screen shake with `this.game.shakeScreen()`.

9. Access game state via `this.game` and `this.wielder`.

10. Use `this.game.rooms[this.wielder.levelID]` for room-specific operations.

Remember to balance new weapons and consider their impact on gameplay.