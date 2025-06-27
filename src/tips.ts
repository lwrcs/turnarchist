const tips = [
  "Too dark? Equip a light source to light up the area around you.",

  "Red X's show dangerous tiles, stay off of them to avoid taking damage.",

  "If you kill an enemy, it can't hit you on the next turn.",

  "Use weapon fragments on your weapon to repair broken weapons.",

  "A yellow box around an item means it can be used on another item.",

  "Lanterns can be refueled with coal.",

  "Some objects can be pushed and kill enemies by crushing them.",

  "Reapers spawn other enemies. Target them first to avoid being overrun.",

  "Occultists apply a purple occult shield to enemies, giving them an extra health.",

  "Killing an Occultist also removes the shields of each shielded enemy.",

  "Some enemies have helmets, giving them extra health.",

  "The shield absorbs one damage, and regenerates within 15 turns.",

  "Explore alternate pathways like caves to gather resources to prepare for tough battles.",

  "Vending machine sell useful items in exchange for coins.",

  "Different enemies have different movement and attack patterns.",

  "Frogs can only deal half damage, but can attack two tiles away in any direction.",

  "Sometimes you will need to switch weapons mid-fight to use the best one for the situation.",

  "Once you reach the end of a level you can get back to the beginning easily through tunnel doors.",

  "Dual daggers give you an extra turn. After attacking you can attack or move again.",

  "The Warhammer does two damage for taking out enemies with more than one health.",

  "The spear has an attack range of two, so you can hit enemies from a safe distance.",

  "Bombs can be placed to blow up enemies, just be sure to avoid blowing yourself up.",

  "Mushrooms heal one half health.",

  "Weapon blood can be applied to your weapon, giving it a powerful bleed effect upon attacking.",

  "Weapon poison can be applied to your weapon poisoning enemies upon attacking.",

  "The spellbook can attack multiple enemies from long range, great for getting out of tough situations.",

  "Bishops can move diagonally and might sneak up on you if you aren't careful.",

  "Rooks can move every turn and attack from any direction.",

  "Queens can move any direction and have two health, but retreat when hit.",

  "Dark? Equip light source.",

  "Red X = danger. Avoid.",

  "Kill enemy = safe next turn.",

  "Use fragments to repair weapons.",

  "Yellow box = usable on items.",

  "Coal refuels lanterns.",

  "Push objects to crush enemies.",

  "Kill reapers first - they spawn enemies.",

  "Occultists give enemies purple shields.",

  "Kill occultist = remove all shields.",

  "Helmets = extra enemy health.",

  "Shield: 1 damage, regens in 15 turns.",

  "Explore caves for resources.",

  "Vending machines: coins for items.",

  "Enemies have unique patterns.",

  "Frogs: half damage, 2-tile range.",

  "Switch weapons mid-fight.",

  "Tunnel doors = quick return to start.",

  "Dual daggers = extra turn after attack.",

  "Warhammer: 2 damage vs multi-health.",

  "Spear: 2-tile range.",

  "Bombs blow up enemies (not you).",

  "Mushrooms: heal 0.5 health.",

  "Weapon blood = bleed effect.",

  "Weapon poison = poison effect.",

  "Spellbook: multi-enemy, long range.",

  "Bishops: diagonal movement.",

  "Rooks: move every turn, any direction.",

  "Queens: 2 health, retreat when hit.",
];

export class Tips {
  static getRandomTip(): string {
    return tips[Math.floor(Math.random() * tips.length)];
  }
}
