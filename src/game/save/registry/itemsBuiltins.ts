import type { Item } from "../../../item/item";
import { Coin } from "../../../item/coin";
import { Key } from "../../../item/key";
import { GoldenKey } from "../../../item/goldenKey";
import { BluePotion } from "../../../item/usable/bluePotion";
import { GreenPotion } from "../../../item/usable/greenPotion";
import { Backpack } from "../../../item/backpack";
import { Apple } from "../../../item/usable/apple";
import { Fish } from "../../../item/usable/fish";
import { Heart } from "../../../item/usable/heart";
import { Hourglass } from "../../../item/usable/hourglass";
import { Shrooms } from "../../../item/usable/shrooms";
import { WeaponPoison } from "../../../item/usable/weaponPoison";
import { WeaponBlood } from "../../../item/usable/weaponBlood";
import { WeaponCurse } from "../../../item/usable/weaponCurse";
import { Spellbook } from "../../../item/weapon/spellbook";
import { Dagger } from "../../../item/weapon/dagger";
import { Sword } from "../../../item/weapon/sword";
import { Spear } from "../../../item/weapon/spear";
import { DualDagger } from "../../../item/weapon/dualdagger";
import { Greataxe } from "../../../item/weapon/greataxe";
import { Warhammer } from "../../../item/weapon/warhammer";
import { QuarterStaff } from "../../../item/weapon/quarterStaff";
import { Scythe } from "../../../item/weapon/scythe";
import { Crossbow } from "../../../item/weapon/crossbow";
import { Shotgun } from "../../../item/weapon/shotgun";
import { Slingshot } from "../../../item/weapon/slingshot";
import { Weapon } from "../../../item/weapon/weapon";
import { Pickaxe } from "../../../item/tool/pickaxe";
import { DivingHelmet } from "../../../item/divingHelmet";
import { GoldRing } from "../../../item/jewelry/goldRing";
import { EmeraldRing } from "../../../item/jewelry/emeraldRing";
import { ZirconRing } from "../../../item/jewelry/zirconRing";
import { AmberRing } from "../../../item/jewelry/amberRing";
import { GarnetRing } from "../../../item/jewelry/garnetRing";
import { SpellbookPage } from "../../../item/usable/spellbookPage";
import { WeaponFragments } from "../../../item/usable/weaponFragments";
import { Coal } from "../../../item/resource/coal";
import { Geode } from "../../../item/resource/geode";
import { Stone } from "../../../item/resource/stone";
import { BlueGem } from "../../../item/resource/bluegem";
import { GreenGem } from "../../../item/resource/greengem";
import { RedGem } from "../../../item/resource/redgem";
import { OrangeGem } from "../../../item/resource/orangegem";
import { GoldOre } from "../../../item/resource/goldOre";
import { IronOre } from "../../../item/resource/ironOre";
import { GoldBar } from "../../../item/resource/goldBar";
import { IronBar } from "../../../item/resource/ironBar";
import { Equippable } from "../../../item/equippable";
import { Torch } from "../../../item/light/torch";
import { Lantern } from "../../../item/light/lantern";
import { Candle } from "../../../item/light/candle";
import { GlowStick } from "../../../item/light/glowStick";
import { GlowBugs } from "../../../item/light/glowBugs";
import { Light } from "../../../item/light/light";
import { ShroomLight } from "../../../item/usable/shroomLight";
import { Armor } from "../../../item/armor";
import { WoodenShield } from "../../../item/woodenShield";
import { FishingRod } from "../../../item/tool/fishingRod";
import { Hammer } from "../../../item/tool/hammer";

import type { LoadContext, SaveContext } from "../context";
import type {
  BaseWeaponItemSaveV2,
  CrossbowWeaponItemSaveV2,
  DivingHelmetItemSaveV2,
  HourglassItemSaveV2,
  ItemKind,
  ItemSaveV2,
  KeyItemSaveV2,
  LightItemSaveV2,
  ShieldItemSaveV2,
  WeaponItemSaveV2,
  WeaponStatusSaveV2,
} from "../schema";
import { itemRegistryV2, type ItemCodecV2 } from "./items";

const itemToKind = (item: Item): ItemKind | null => {
  if (item instanceof Coin) return "coin";
  if (item instanceof Key) return "key";
  if (item instanceof GoldenKey) return "golden_key";
  if (item instanceof BluePotion) return "blue_potion";
  if (item instanceof GreenPotion) return "green_potion";
  if (item instanceof Backpack) return "backpack";
  if (item instanceof Apple) return "apple";
  if (item instanceof Fish) return "fish";
  if (item instanceof Heart) return "health_potion";
  if (item instanceof Hourglass) return "hourglass";
  if (item instanceof Shrooms) return "mushrooms";
  if (item instanceof WeaponPoison) return "weapon_poison";
  if (item instanceof WeaponBlood) return "weapon_blood";
  if (item instanceof WeaponCurse) return "weapon_curse";
  if (item instanceof Spellbook) return "spellbook";
  if (item instanceof SpellbookPage) return "spellbook_page";
  if (item instanceof WeaponFragments) return "weapon_fragments";
  if (item instanceof Coal) return "coal";
  if (item instanceof Geode) return "geode";
  if (item instanceof Stone) return "stone";
  if (item instanceof BlueGem) return "blue_gem";
  if (item instanceof GreenGem) return "green_gem";
  if (item instanceof RedGem) return "red_gem";
  if (item instanceof OrangeGem) return "orange_gem";
  if (item instanceof GoldOre) return "gold_ore";
  if (item instanceof IronOre) return "iron_ore";
  if (item instanceof GoldBar) return "gold_bar";
  if (item instanceof IronBar) return "iron_bar";
  if (item instanceof Torch) return "torch";
  if (item instanceof Lantern) return "lantern";
  if (item instanceof Candle) return "candle";
  if (item instanceof GlowStick) return "glow_stick";
  if (item instanceof GlowBugs) return "glow_bugs";
  if (item instanceof ShroomLight) return "glowshrooms";
  if (item instanceof Dagger) return "dagger";
  if (item instanceof Sword) return "sword";
  if (item instanceof Spear) return "spear";
  if (item instanceof DualDagger) return "dual_daggers";
  if (item instanceof Greataxe) return "greataxe";
  if (item instanceof Warhammer) return "warhammer";
  if (item instanceof QuarterStaff) return "quarterstaff";
  if (item instanceof Scythe) return "scythe";
  if (item instanceof Crossbow) return "crossbow";
  if (item instanceof Shotgun) return "shotgun";
  if (item instanceof Slingshot) return "slingshot";
  if (item instanceof Pickaxe) return "pickaxe";
  if (item instanceof FishingRod) return "fishing_rod";
  if (item instanceof Hammer) return "hammer";
  if (item instanceof Armor) return "occult_shield";
  if (item instanceof WoodenShield) return "wooden_shield";
  if (item instanceof DivingHelmet) return "diving_helmet";
  if (item instanceof GoldRing) return "gold_ring";
  if (item instanceof EmeraldRing) return "emerald_ring";
  if (item instanceof ZirconRing) return "zircon_ring";
  if (item instanceof AmberRing) return "amber_ring";
  if (item instanceof GarnetRing) return "garnet_ring";
  return null;
};

const isKeyItemSaveV2 = (v: ItemSaveV2): v is KeyItemSaveV2 => {
  if (v.kind !== "key") return false;
  if (!("doorId" in v) || typeof v.doorId !== "number") return false;
  if (!("depth" in v) || !(v.depth === null || typeof v.depth === "number")) return false;
  if (!("showPath" in v) || typeof v.showPath !== "boolean") return false;
  return true;
};

const isLightItemSaveV2 = (v: ItemSaveV2): v is LightItemSaveV2 => {
  if (
    v.kind !== "torch" &&
    v.kind !== "lantern" &&
    v.kind !== "candle" &&
    v.kind !== "glow_stick" &&
    v.kind !== "glow_bugs" &&
    v.kind !== "glowshrooms"
  )
    return false;
  if (!("fuel" in v) || typeof v.fuel !== "number") return false;
  return true;
};

const isWeaponItemSaveV2 = (v: ItemSaveV2): v is WeaponItemSaveV2 => {
  return (
    v.kind === "dagger" ||
    v.kind === "sword" ||
    v.kind === "spear" ||
    v.kind === "dual_daggers" ||
    v.kind === "greataxe" ||
    v.kind === "warhammer" ||
    v.kind === "quarterstaff" ||
    v.kind === "scythe" ||
    v.kind === "crossbow" ||
    v.kind === "shotgun" ||
    v.kind === "slingshot" ||
    v.kind === "spellbook" ||
    v.kind === "pickaxe"
  );
};

const isShieldItemSaveV2 = (v: ItemSaveV2): v is ShieldItemSaveV2 => {
  return v.kind === "occult_shield" || v.kind === "wooden_shield";
};

const isDivingHelmetItemSaveV2 = (v: ItemSaveV2): v is DivingHelmetItemSaveV2 => {
  return v.kind === "diving_helmet";
};

const isHourglassItemSaveV2 = (v: ItemSaveV2): v is HourglassItemSaveV2 => {
  return v.kind === "hourglass";
};

/**
 * Registers built-in item codecs for SaveV2.
 * Idempotent: safe to call multiple times.
 */
export const registerBuiltinItemCodecsV2 = (): void => {
  const register = (kind: ItemKind, codec: ItemCodecV2) => {
    if (!itemRegistryV2.has(kind)) itemRegistryV2.register(kind, codec);
  };

  // Generic codec: most items only need envelope fields.
  type LightKind = LightItemSaveV2["kind"];
  type WeaponKind = WeaponItemSaveV2["kind"];
  type ShieldKind = ShieldItemSaveV2["kind"];
  type SpecialKind = DivingHelmetItemSaveV2["kind"] | HourglassItemSaveV2["kind"];
  type GenericItemKind = Exclude<ItemKind, "key" | LightKind | WeaponKind | ShieldKind | SpecialKind>;
  const genericSave = (
    kind: GenericItemKind,
    item: Item,
  ): ItemSaveV2 => {
    const roomGid = item.level ? item.level.globalId : undefined;
    const equipped = item instanceof Equippable ? item.equipped : undefined;
    return {
      kind,
      gid: item.globalId,
      x: item.x,
      y: item.y,
      roomGid,
      stackCount: item.stackCount,
      pickedUp: item.pickedUp,
      equipped,
    };
  };

  const GENERIC_ITEM_KINDS = [
    "coin",
    "golden_key",
    "blue_potion",
    "green_potion",
    "health_potion",
    "apple",
    "fish",
    "mushrooms",
    "weapon_poison",
    "weapon_blood",
    "weapon_curse",
    "spellbook_page",
    "weapon_fragments",
    "coal",
    "backpack",
    "geode",
    "stone",
    "blue_gem",
    "green_gem",
    "red_gem",
    "orange_gem",
    "gold_ore",
    "iron_ore",
    "gold_bar",
    "iron_bar",
    "fishing_rod",
    "hammer",
    "gold_ring",
    "emerald_ring",
    "zircon_ring",
    "amber_ring",
    "garnet_ring",
  ] as const satisfies readonly GenericItemKind[];

  for (const kind of GENERIC_ITEM_KINDS) {
    register(kind, {
      save: (value) => genericSave(kind, value),
      spawn: (value, room, _ctx) => {
        // Construct by kind; only for supported builtins.
        let item: Item;
        switch (kind) {
          case "coin":
            item = new Coin(room, value.x, value.y);
            break;
          case "golden_key":
            item = new GoldenKey(room, value.x, value.y);
            break;
          case "blue_potion":
            item = new BluePotion(room, value.x, value.y);
            break;
          case "green_potion":
            item = new GreenPotion(room, value.x, value.y);
            break;
          case "health_potion":
            item = new Heart(room, value.x, value.y);
            break;
          case "apple":
            item = new Apple(room, value.x, value.y);
            break;
          case "fish":
            item = new Fish(room, value.x, value.y);
            break;
          case "mushrooms":
            item = new Shrooms(room, value.x, value.y);
            break;
          case "weapon_poison":
            item = new WeaponPoison(room, value.x, value.y);
            break;
          case "weapon_blood":
            item = new WeaponBlood(room, value.x, value.y);
            break;
          case "weapon_curse":
            item = new WeaponCurse(room, value.x, value.y);
            break;
          case "spellbook_page":
            item = new SpellbookPage(room, value.x, value.y, value.stackCount);
            break;
          case "weapon_fragments":
            item = new WeaponFragments(room, value.x, value.y, value.stackCount);
            break;
          case "coal":
            item = new Coal(room, value.x, value.y);
            break;
          case "backpack":
            item = new Backpack(room, value.x, value.y);
            break;
          case "geode":
            item = new Geode(room, value.x, value.y);
            break;
          case "stone":
            item = new Stone(room, value.x, value.y);
            break;
          case "blue_gem":
            item = new BlueGem(room, value.x, value.y);
            break;
          case "green_gem":
            item = new GreenGem(room, value.x, value.y);
            break;
          case "red_gem":
            item = new RedGem(room, value.x, value.y);
            break;
          case "orange_gem":
            item = new OrangeGem(room, value.x, value.y);
            break;
          case "gold_ore":
            item = new GoldOre(room, value.x, value.y);
            break;
          case "iron_ore":
            item = new IronOre(room, value.x, value.y);
            break;
          case "gold_bar":
            item = new GoldBar(room, value.x, value.y);
            break;
          case "iron_bar":
            item = new IronBar(room, value.x, value.y);
            break;
          case "fishing_rod":
            item = new FishingRod(room, value.x, value.y);
            break;
          case "hammer":
            item = new Hammer(room, value.x, value.y);
            break;
          case "gold_ring":
            item = new GoldRing(room, value.x, value.y);
            break;
          case "emerald_ring":
            item = new EmeraldRing(room, value.x, value.y);
            break;
          case "zircon_ring":
            item = new ZirconRing(room, value.x, value.y);
            break;
          case "amber_ring":
            item = new AmberRing(room, value.x, value.y);
            break;
          case "garnet_ring":
            item = new GarnetRing(room, value.x, value.y);
            break;
          default:
            throw new Error(`Unsupported builtin item kind: ${kind}`);
        }
        // Apply generic state
        item.stackCount = value.stackCount;
        item.pickedUp = value.pickedUp;
        if (item instanceof Equippable && "equipped" in value && typeof value.equipped === "boolean") {
          item.equipped = value.equipped;
        }
        // Assign gid after construction
        item.globalId = value.gid;
        return item;
      },
    });
  }

  register("diving_helmet", {
    save: (value) => {
      if (!(value instanceof DivingHelmet)) throw new Error("diving_helmet codec received non-DivingHelmet");
      const roomGid = value.level ? value.level.globalId : undefined;
      return {
        kind: "diving_helmet",
        gid: value.globalId,
        x: value.x,
        y: value.y,
        roomGid,
        stackCount: value.stackCount,
        pickedUp: value.pickedUp,
        equipped: value.equipped,
        currentAir: value.currentAir,
      };
    },
    spawn: (value, room, _ctx) => {
      if (!isDivingHelmetItemSaveV2(value)) throw new Error("diving_helmet codec spawn received non-diving_helmet save");
      const it = new DivingHelmet(room, value.x, value.y);
      it.currentAir = value.currentAir;
      if (value.equipped !== undefined) it.equipped = value.equipped;
      it.stackCount = value.stackCount;
      it.pickedUp = value.pickedUp;
      it.globalId = value.gid;
      return it;
    },
  });

  register("hourglass", {
    save: (value) => {
      if (!(value instanceof Hourglass)) throw new Error("hourglass codec received non-Hourglass");
      const roomGid = value.level ? value.level.globalId : undefined;
      return {
        kind: "hourglass",
        gid: value.globalId,
        x: value.x,
        y: value.y,
        roomGid,
        stackCount: value.stackCount,
        pickedUp: value.pickedUp,
        durability: value.durability,
        durabilityMax: value.durabilityMax,
        broken: value.broken,
      };
    },
    spawn: (value, room, _ctx) => {
      if (!isHourglassItemSaveV2(value)) throw new Error("hourglass codec spawn received non-hourglass save");
      const it = new Hourglass(room, value.x, value.y);
      it.durability = value.durability;
      it.durabilityMax = value.durabilityMax;
      it.broken = value.broken;
      it.stackCount = value.stackCount;
      it.pickedUp = value.pickedUp;
      it.globalId = value.gid;
      return it;
    },
  });

  register("key", {
    save: (value) => {
      if (!(value instanceof Key)) {
        throw new Error("key codec received non-Key item");
      }
      const roomGid = value.level ? value.level.globalId : undefined;
      return {
        kind: "key",
        gid: value.globalId,
        x: value.x,
        y: value.y,
        roomGid,
        stackCount: value.stackCount,
        pickedUp: value.pickedUp,
        equipped: value instanceof Equippable ? value.equipped : undefined,
        doorId: value.doorID,
        depth: value.depth === undefined ? null : value.depth,
        showPath: value.showPath === true,
      };
    },
    spawn: (value, room, _ctx) => {
      if (isKeyItemSaveV2(value)) {
        const k = new Key(room, value.x, value.y);
        k.doorID = value.doorId;
        k.depth = value.depth;
        k.showPath = value.showPath;
        k.stackCount = value.stackCount;
        k.pickedUp = value.pickedUp;
        k.globalId = value.gid;
        return k;
      }
      throw new Error("key codec spawn received non-key save");
    },
  });

  const saveLight = (kind: LightItemSaveV2["kind"], value: Light): LightItemSaveV2 => {
    const roomGid = value.level ? value.level.globalId : undefined;
    const equipped = value instanceof Equippable ? value.equipped : undefined;
    return {
      kind,
      gid: value.globalId,
      x: value.x,
      y: value.y,
      roomGid,
      stackCount: value.stackCount,
      pickedUp: value.pickedUp,
      equipped,
      fuel: value.fuel,
    };
  };

  const spawnLight = (value: LightItemSaveV2, room): Light => {
    let it: Light;
    switch (value.kind) {
      case "torch":
        it = new Torch(room, value.x, value.y);
        break;
      case "lantern":
        it = new Lantern(room, value.x, value.y);
        break;
      case "candle":
        it = new Candle(room, value.x, value.y);
        break;
      case "glow_stick":
        it = new GlowStick(room, value.x, value.y);
        break;
      case "glow_bugs":
        it = new GlowBugs(room, value.x, value.y);
        break;
      case "glowshrooms":
        it = new ShroomLight(room, value.x, value.y);
        break;
    }
    it.fuel = value.fuel;
    it.broken = it.fuel <= 0;
    if (value.equipped !== undefined) it.equipped = value.equipped;
    it.stackCount = value.stackCount;
    it.pickedUp = value.pickedUp;
    it.globalId = value.gid;
    return it;
  };

  register("torch", {
    save: (v) => {
      if (!(v instanceof Torch)) throw new Error("torch codec received non-Torch");
      return saveLight("torch", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isLightItemSaveV2(value)) throw new Error("torch codec spawn received non-light save");
      return spawnLight(value, room);
    },
  });
  register("lantern", {
    save: (v) => {
      if (!(v instanceof Lantern)) throw new Error("lantern codec received non-Lantern");
      return saveLight("lantern", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isLightItemSaveV2(value)) throw new Error("lantern codec spawn received non-light save");
      return spawnLight(value, room);
    },
  });
  register("candle", {
    save: (v) => {
      if (!(v instanceof Candle)) throw new Error("candle codec received non-Candle");
      return saveLight("candle", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isLightItemSaveV2(value)) throw new Error("candle codec spawn received non-light save");
      return spawnLight(value, room);
    },
  });
  register("glow_stick", {
    save: (v) => {
      if (!(v instanceof GlowStick)) throw new Error("glow_stick codec received non-GlowStick");
      return saveLight("glow_stick", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isLightItemSaveV2(value)) throw new Error("glow_stick codec spawn received non-light save");
      return spawnLight(value, room);
    },
  });
  register("glow_bugs", {
    save: (v) => {
      if (!(v instanceof GlowBugs)) throw new Error("glow_bugs codec received non-GlowBugs");
      return saveLight("glow_bugs", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isLightItemSaveV2(value)) throw new Error("glow_bugs codec spawn received non-light save");
      return spawnLight(value, room);
    },
  });

  register("glowshrooms", {
    save: (v) => {
      if (!(v instanceof ShroomLight)) throw new Error("glowshrooms codec received non-ShroomLight");
      return saveLight("glowshrooms", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isLightItemSaveV2(value)) throw new Error("glowshrooms codec spawn received non-light save");
      return spawnLight(value, room);
    },
  });

  const weaponStatusToSave = (w: Weapon): WeaponStatusSaveV2 => {
    return {
      poison: w.status.poison,
      blood: w.status.blood,
      curse: w.status.curse,
    };
  };

  const saveBaseWeapon = (kind: BaseWeaponItemSaveV2["kind"], w: Weapon): BaseWeaponItemSaveV2 => {
    const roomGid = w.level ? w.level.globalId : undefined;
    return {
      kind,
      gid: w.globalId,
      x: w.x,
      y: w.y,
      roomGid,
      stackCount: w.stackCount,
      pickedUp: w.pickedUp,
      equipped: w.equipped,
      durability: w.durability,
      durabilityMax: w.durabilityMax,
      broken: w.broken,
      cooldown: w.cooldown,
      cooldownMax: w.cooldownMax,
      status: weaponStatusToSave(w),
    };
  };

  const saveCrossbow = (w: Crossbow): CrossbowWeaponItemSaveV2 => {
    const roomGid = w.level ? w.level.globalId : undefined;
    return {
      kind: "crossbow",
      gid: w.globalId,
      x: w.x,
      y: w.y,
      roomGid,
      stackCount: w.stackCount,
      pickedUp: w.pickedUp,
      equipped: w.equipped,
      durability: w.durability,
      durabilityMax: w.durabilityMax,
      broken: w.broken,
      cooldown: w.cooldown,
      cooldownMax: w.cooldownMax,
      status: weaponStatusToSave(w),
      crossbowState: w.state,
    };
  };

  const applyWeaponSave = (w: Weapon, s: WeaponItemSaveV2): void => {
    w.durability = s.durability;
    w.durabilityMax = s.durabilityMax;
    w.broken = s.broken;
    w.cooldown = s.cooldown;
    w.cooldownMax = s.cooldownMax;
    w.status = { ...s.status };
    if (s.equipped !== undefined) w.equipped = s.equipped;
    w.stackCount = s.stackCount;
    w.pickedUp = s.pickedUp;
    w.globalId = s.gid;

    if (s.kind === "crossbow" && w instanceof Crossbow) {
      w.state = s.crossbowState;
      // 0=EMPTY, 1=LOADED, 2=COCKED, 3=FIRING (see CrossbowState in crossbow.ts).
      if (w.state === 0) w.tileX = 23;
      if (w.state === 1) w.tileX = 24;
      if (w.state === 2) w.tileX = 25;
      w.disabled = w.state !== 2;
    }
  };

  const saveShield = (kind: ShieldItemSaveV2["kind"], s: Armor | WoodenShield): ShieldItemSaveV2 => {
    const roomGid = s.level ? s.level.globalId : undefined;
    return {
      kind,
      gid: s.globalId,
      x: s.x,
      y: s.y,
      roomGid,
      stackCount: s.stackCount,
      pickedUp: s.pickedUp,
      equipped: s.equipped,
      health: s.health,
      rechargeTurnCounter: s.rechargeTurnCounter,
    };
  };

  const applyShieldSave = (s: Armor | WoodenShield, v: ShieldItemSaveV2): void => {
    s.health = v.health;
    s.rechargeTurnCounter = v.rechargeTurnCounter;
    s.cooldown = v.rechargeTurnCounter;
    if (v.equipped !== undefined) s.equipped = v.equipped;
    s.stackCount = v.stackCount;
    s.pickedUp = v.pickedUp;
    s.globalId = v.gid;
  };

  // Weapons
  register("dagger", {
    save: (v) => {
      if (!(v instanceof Dagger)) throw new Error("dagger codec received non-Dagger");
      return saveBaseWeapon("dagger", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isWeaponItemSaveV2(value) || value.kind !== "dagger")
        throw new Error("dagger codec spawn received non-dagger save");
      const w = new Dagger(room, value.x, value.y);
      applyWeaponSave(w, value);
      return w;
    },
  });
  register("sword", {
    save: (v) => {
      if (!(v instanceof Sword)) throw new Error("sword codec received non-Sword");
      return saveBaseWeapon("sword", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isWeaponItemSaveV2(value) || value.kind !== "sword")
        throw new Error("sword codec spawn received non-sword save");
      const w = new Sword(room, value.x, value.y);
      applyWeaponSave(w, value);
      return w;
    },
  });
  register("spear", {
    save: (v) => {
      if (!(v instanceof Spear)) throw new Error("spear codec received non-Spear");
      return saveBaseWeapon("spear", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isWeaponItemSaveV2(value) || value.kind !== "spear")
        throw new Error("spear codec spawn received non-spear save");
      const w = new Spear(room, value.x, value.y);
      applyWeaponSave(w, value);
      return w;
    },
  });
  register("dual_daggers", {
    save: (v) => {
      if (!(v instanceof DualDagger)) throw new Error("dual_daggers codec received non-DualDagger");
      return saveBaseWeapon("dual_daggers", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isWeaponItemSaveV2(value) || value.kind !== "dual_daggers")
        throw new Error("dual_daggers codec spawn received non-dual_daggers save");
      const w = new DualDagger(room, value.x, value.y);
      applyWeaponSave(w, value);
      return w;
    },
  });
  register("greataxe", {
    save: (v) => {
      if (!(v instanceof Greataxe)) throw new Error("greataxe codec received non-Greataxe");
      return saveBaseWeapon("greataxe", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isWeaponItemSaveV2(value) || value.kind !== "greataxe")
        throw new Error("greataxe codec spawn received non-greataxe save");
      const w = new Greataxe(room, value.x, value.y);
      applyWeaponSave(w, value);
      return w;
    },
  });
  register("warhammer", {
    save: (v) => {
      if (!(v instanceof Warhammer)) throw new Error("warhammer codec received non-Warhammer");
      return saveBaseWeapon("warhammer", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isWeaponItemSaveV2(value) || value.kind !== "warhammer")
        throw new Error("warhammer codec spawn received non-warhammer save");
      const w = new Warhammer(room, value.x, value.y);
      applyWeaponSave(w, value);
      return w;
    },
  });
  register("quarterstaff", {
    save: (v) => {
      if (!(v instanceof QuarterStaff)) throw new Error("quarterstaff codec received non-QuarterStaff");
      return saveBaseWeapon("quarterstaff", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isWeaponItemSaveV2(value) || value.kind !== "quarterstaff")
        throw new Error("quarterstaff codec spawn received non-quarterstaff save");
      const w = new QuarterStaff(room, value.x, value.y);
      applyWeaponSave(w, value);
      return w;
    },
  });
  register("scythe", {
    save: (v) => {
      if (!(v instanceof Scythe)) throw new Error("scythe codec received non-Scythe");
      return saveBaseWeapon("scythe", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isWeaponItemSaveV2(value) || value.kind !== "scythe")
        throw new Error("scythe codec spawn received non-scythe save");
      const w = new Scythe(room, value.x, value.y);
      applyWeaponSave(w, value);
      return w;
    },
  });
  register("crossbow", {
    save: (v) => {
      if (!(v instanceof Crossbow)) throw new Error("crossbow codec received non-Crossbow");
      return saveCrossbow(v);
    },
    spawn: (value, room, _ctx) => {
      if (!isWeaponItemSaveV2(value) || value.kind !== "crossbow")
        throw new Error("crossbow codec spawn received non-crossbow save");
      const w = new Crossbow(room, value.x, value.y);
      applyWeaponSave(w, value);
      return w;
    },
  });
  register("shotgun", {
    save: (v) => {
      if (!(v instanceof Shotgun)) throw new Error("shotgun codec received non-Shotgun");
      return saveBaseWeapon("shotgun", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isWeaponItemSaveV2(value) || value.kind !== "shotgun")
        throw new Error("shotgun codec spawn received non-shotgun save");
      const w = new Shotgun(room, value.x, value.y);
      applyWeaponSave(w, value);
      return w;
    },
  });
  register("slingshot", {
    save: (v) => {
      if (!(v instanceof Slingshot)) throw new Error("slingshot codec received non-Slingshot");
      return saveBaseWeapon("slingshot", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isWeaponItemSaveV2(value) || value.kind !== "slingshot")
        throw new Error("slingshot codec spawn received non-slingshot save");
      const w = new Slingshot(room, value.x, value.y);
      applyWeaponSave(w, value);
      return w;
    },
  });
  register("spellbook", {
    save: (v) => {
      if (!(v instanceof Spellbook)) throw new Error("spellbook codec received non-Spellbook");
      return saveBaseWeapon("spellbook", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isWeaponItemSaveV2(value) || value.kind !== "spellbook")
        throw new Error("spellbook codec spawn received non-spellbook save");
      const w = new Spellbook(room, value.x, value.y);
      applyWeaponSave(w, value);
      return w;
    },
  });
  register("pickaxe", {
    save: (v) => {
      if (!(v instanceof Pickaxe)) throw new Error("pickaxe codec received non-Pickaxe");
      return saveBaseWeapon("pickaxe", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isWeaponItemSaveV2(value) || value.kind !== "pickaxe")
        throw new Error("pickaxe codec spawn received non-pickaxe save");
      const w = new Pickaxe(room, value.x, value.y);
      applyWeaponSave(w, value);
      return w;
    },
  });

  // Shields
  register("occult_shield", {
    save: (v) => {
      if (!(v instanceof Armor)) throw new Error("occult_shield codec received non-Armor");
      return saveShield("occult_shield", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isShieldItemSaveV2(value) || value.kind !== "occult_shield")
        throw new Error("occult_shield codec spawn received non-occult_shield save");
      const it = new Armor(room, value.x, value.y);
      applyShieldSave(it, value);
      return it;
    },
  });
  register("wooden_shield", {
    save: (v) => {
      if (!(v instanceof WoodenShield)) throw new Error("wooden_shield codec received non-WoodenShield");
      return saveShield("wooden_shield", v);
    },
    spawn: (value, room, _ctx) => {
      if (!isShieldItemSaveV2(value) || value.kind !== "wooden_shield")
        throw new Error("wooden_shield codec spawn received non-wooden_shield save");
      const it = new WoodenShield(room, value.x, value.y);
      applyShieldSave(it, value);
      return it;
    },
  });
};

export const getItemKindV2 = (item: Item): ItemKind | null => itemToKind(item);


