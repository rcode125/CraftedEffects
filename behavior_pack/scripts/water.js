import { EnchantmentTypes, EquipmentSlot, system, world } from "@minecraft/server";
import { relicKey } from "./config.js";

// Waterbreathingeffect extras:
// - while the relic is held in the main hand: boots get Depth Strider III, the helmet Aqua Affinity
//   (vanilla maximums; higher levels would throw). Removed again when the relic is put away.
// - sprint-swimming with the relic in the inventory is faster, like dolphin's grace
//   (Bedrock has no dolphin's grace effect for scripts).

const MARK = "ce:water_ench"; // stored on the armour piece: the level it had before (0 = none)
const RELIC = "craftedeffects:relic_water";
const BOOSTS = [
  { slot: EquipmentSlot.Feet, enchantment: "depth_strider", level: 3 },
  { slot: EquipmentSlot.Head, enchantment: "aqua_affinity", level: 1 },
];
const SWIM_PUSH = 0.55;

function enchantable(itemStack) {
  try {
    return itemStack?.getComponent("minecraft:enchantable");
  } catch {
    return undefined;
  }
}

function addBoost(equippable, { slot, enchantment, level }) {
  const item = equippable.getEquipment(slot);
  const ench = enchantable(item);
  if (!ench || item.getDynamicProperty(MARK) !== undefined) return;
  const type = EnchantmentTypes.get(enchantment);
  if (!type) return;
  const before = ench.getEnchantment(type)?.level ?? 0;
  if (before >= level) return; // already as good or better
  try {
    if (!ench.canAddEnchantment({ type, level })) return;
    ench.addEnchantment({ type, level });
    item.setDynamicProperty(MARK, before);
    equippable.setEquipment(slot, item);
  } catch {
    // Item does not accept the enchantment.
  }
}

/** Restores an armour piece we enchanted; returns the cleaned item or undefined if unchanged. */
function restore(item, enchantment) {
  const before = item?.getDynamicProperty(MARK);
  if (typeof before !== "number") return undefined;
  const ench = enchantable(item);
  try {
    ench?.removeEnchantment(enchantment);
    const type = EnchantmentTypes.get(enchantment);
    if (before > 0 && type) ench?.addEnchantment({ type, level: before });
  } catch {
    // Keep going; the mark is removed anyway.
  }
  item.setDynamicProperty(MARK, undefined);
  return item;
}

function removeBoosts(player) {
  const equippable = player.getComponent("minecraft:equippable");
  for (const { slot, enchantment } of BOOSTS) {
    const cleaned = restore(equippable?.getEquipment(slot), enchantment);
    if (cleaned) equippable.setEquipment(slot, cleaned);
  }
  // Armour taken off while the relic was held: clean it in the inventory too.
  const container = player.getComponent("minecraft:inventory")?.container;
  if (!container) return;
  for (let index = 0; index < container.size; index++) {
    const item = container.getItem(index);
    if (item?.getDynamicProperty?.(MARK) === undefined) continue;
    const enchantment = item.typeId.endsWith("boots") ? "depth_strider" : "aqua_affinity";
    const cleaned = restore(item, enchantment);
    if (cleaned) container.setItem(index, cleaned);
  }
}

const holding = new Set(); // player ids that currently get the enchantments

export function setupWater() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      if (!player) continue;
      try {
        const held = player.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex);
        if (held?.typeId === RELIC) {
          holding.add(player.id);
          const equippable = player.getComponent("minecraft:equippable");
          for (const boost of BOOSTS) addBoost(equippable, boost);
        } else if (holding.has(player.id)) {
          holding.delete(player.id);
          removeBoosts(player);
        }
      } catch {
        // Player not ready.
      }
    }
  }, 10);

  // Dolphin's grace: faster sprint-swimming while the relic is carried.
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      if (!player?.isSwimming || !player.isInWater) continue;
      try {
        if (!carriesWaterRelic(player)) continue;
        const view = player.getViewDirection();
        player.applyKnockback({ x: view.x * SWIM_PUSH, z: view.z * SWIM_PUSH }, view.y * SWIM_PUSH);
      } catch {
        // Not important.
      }
    }
  }, 4);

  world.afterEvents.playerLeave.subscribe(({ playerId }) => holding.delete(playerId));
  // Left the game while holding the relic: clean the armour on the next join.
  world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!initialSpawn) return;
    system.runTimeout(() => {
      if (player.isValid && !holding.has(player.id)) removeBoosts(player);
    }, 20);
  });
}

function carriesWaterRelic(player) {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (!container) return false;
  for (let index = 0; index < container.size; index++) {
    if (relicKey(container.getItem(index)?.typeId) === "water") return true;
  }
  return player.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Offhand)?.typeId === RELIC;
}
