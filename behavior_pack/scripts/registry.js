import { EquipmentSlot, ItemStack, system, world } from "@minecraft/server";
import { DATA } from "./data.js";
import { RELIC_COUNT, relicConfig, relicDisplay, relicNumber, relicTypeId } from "./config.js";

// Keeps track of which relic currently exists in the world, so that each one
// can only exist once. Every real relic carries a serial number; the registry
// stores the serial of the one valid copy.

const REGISTRY_KEY = "ce:registry";
const SERIAL_PROPERTY = "ce:serial";
const LOSS_CHECK_DELAY_TICKS = 60;

let registry;
const pendingLosses = new Map(); // "relic:serial" -> true while checking

function load() {
  if (registry) return registry;
  registry = { nextSerial: 1, relics: {} };
  try {
    const raw = world.getDynamicProperty(REGISTRY_KEY);
    if (typeof raw === "string") registry = { ...registry, ...JSON.parse(raw) };
  } catch (error) {
    console.warn(`[CraftedEffects] Register beschädigt, wird neu angelegt: ${error}`);
  }
  return registry;
}

function save() {
  world.setDynamicProperty(REGISTRY_KEY, JSON.stringify(load()));
}

/** Serial of the valid copy of a relic, or undefined if the relic is free. */
export function registeredSerial(number) {
  return load().relics[number]?.serial;
}

export function isRelicFree(number) {
  return registeredSerial(number) === undefined;
}

export function freeRelic(number) {
  delete load().relics[number];
  save();
}

export function serialOf(itemStack) {
  const value = itemStack.getDynamicProperty(SERIAL_PROPERTY);
  return typeof value === "number" ? value : undefined;
}

/** Creates a brand-new registered relic item (used for crafting and /ce:give). */
export function claimRelic(number, itemStack, holderName) {
  const data = load();
  const serial = data.nextSerial++;
  data.relics[number] = { serial, holder: holderName };
  save();
  itemStack.setDynamicProperty(SERIAL_PROPERTY, serial);
  applyDisplay(number, itemStack);
  return itemStack;
}

export function newRelicItem(number, holderName) {
  return claimRelic(number, new ItemStack(relicTypeId(number), 1), holderName);
}

function applyDisplay(number, itemStack) {
  const { nameTag, lore } = relicDisplay(number);
  itemStack.nameTag = nameTag;
  itemStack.setLore(lore);
}

function displayIsCurrent(number, itemStack) {
  const { nameTag, lore } = relicDisplay(number);
  return itemStack.nameTag === nameTag && itemStack.getLore().join("\n") === lore.join("\n");
}

function refundIngredients(player, number) {
  const container = player.getComponent("minecraft:inventory")?.container;
  const items = [...DATA.refund, DATA.cores[number - 1]];
  for (const typeId of items) {
    const leftover = container?.addItem(new ItemStack(typeId, 1));
    if (leftover) player.dimension.spawnItem(leftover, player.location);
  }
}

/**
 * Checks one inventory slot of a player. Returns the relic number if the slot
 * holds a valid, enabled relic, otherwise 0. Invalid copies are removed.
 */
function checkSlot(player, slot) {
  const itemStack = slot.getItem();
  if (!itemStack) return 0;
  const number = relicNumber(itemStack.typeId);
  if (!number) return 0;

  const relic = relicConfig(number);
  const serial = serialOf(itemStack);
  const registered = registeredSerial(number);

  if (serial === undefined) {
    // Freshly crafted (or spawned in creative).
    if (!relic.enabled) {
      slot.setItem(undefined);
      refundIngredients(player, number);
      player.sendMessage(`§c${relic.name} ist deaktiviert. Die Zutaten wurden zurückgegeben.`);
      return 0;
    }
    if (registered !== undefined) {
      slot.setItem(undefined);
      refundIngredients(player, number);
      player.sendMessage(`§c${relic.name} existiert bereits in dieser Welt. Die Zutaten wurden zurückgegeben.`);
      return 0;
    }
    slot.setItem(claimRelic(number, itemStack, player.name));
    world.sendMessage(`§6${player.name} hat §d${relic.name}§6 erschaffen!`);
    return number;
  }

  if (registered === undefined && relic.enabled) {
    // Was marked as lost, but turned up again: it becomes the valid copy.
    load().relics[number] = { serial, holder: player.name };
    save();
  } else if (serial !== registeredSerial(number)) {
    slot.setItem(undefined);
    player.sendMessage(`§c${relic.name} war eine ungültige Kopie und wurde entfernt.`);
    return 0;
  }

  if (load().relics[number].holder !== player.name) {
    load().relics[number].holder = player.name;
    save();
  }
  if (!displayIsCurrent(number, itemStack)) {
    applyDisplay(number, itemStack);
    slot.setItem(itemStack);
  }
  return relic.enabled ? number : 0;
}

/** Scans the whole inventory, hotbar and offhand. Returns the active relics. */
export function scanPlayer(player) {
  const active = [];
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container) {
    for (let index = 0; index < container.size; index++) {
      const number = checkSlot(player, container.getSlot(index));
      if (number) active.push(number);
    }
  }
  const offhand = player.getComponent("minecraft:equippable")?.getEquipmentSlot(EquipmentSlot.Offhand);
  if (offhand) {
    const number = checkSlot(player, offhand);
    if (number) active.push(number);
  }
  return active;
}

function playerHasSerial(number, serial) {
  for (const player of world.getAllPlayers()) {
    if (!player) continue;
    const container = player.getComponent("minecraft:inventory")?.container;
    if (!container) continue;
    for (let index = 0; index < container.size; index++) {
      const item = container.getItem(index);
      if (item && relicNumber(item.typeId) === number && serialOf(item) === serial) return true;
    }
    const offhand = player.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Offhand);
    if (offhand && relicNumber(offhand.typeId) === number && serialOf(offhand) === serial) return true;
  }
  return false;
}

function hopperNearby(dimension, location) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -2; dy <= 0; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        const block = dimension.getBlock({ x: location.x + dx, y: location.y + dy, z: location.z + dz });
        if (block?.typeId === "minecraft:hopper") return true;
      }
    }
  }
  return dimension.getEntities({ location, maxDistance: 3, type: "minecraft:hopper_minecart" }).length > 0;
}

/** Detects a dropped relic disappearing (lava, fire, cactus, void, despawn). */
export function watchForLoss() {
  const pickedUp = new Set();

  world.beforeEvents.entityItemPickup.subscribe(({ item }) => {
    if (item) pickedUp.add(item.id);
  });

  world.beforeEvents.entityRemove.subscribe(({ removedEntity }) => {
    if (removedEntity?.typeId !== "minecraft:item") return;
    const itemStack = removedEntity.getComponent("minecraft:item")?.itemStack;
    const number = relicNumber(itemStack?.typeId);
    if (!number) return;
    const serial = serialOf(itemStack);
    if (serial === undefined) return;

    const entityId = removedEntity.id;
    const dimension = removedEntity.dimension;
    const location = { ...removedEntity.location };
    const key = `${number}:${serial}`;
    if (pendingLosses.has(key)) return;
    pendingLosses.set(key, true);

    system.runTimeout(() => {
      pendingLosses.delete(key);
      const wasPickedUp = pickedUp.delete(entityId);
      if (wasPickedUp || registeredSerial(number) !== serial) return;
      if (playerHasSerial(number, serial)) return;
      // Chunk unloaded (player walked away) - the item still exists there.
      if (location.y >= dimension.heightRange.min && !dimension.getBlock(location)) return;
      if (location.y >= dimension.heightRange.min && hopperNearby(dimension, location)) return;

      freeRelic(number);
      world.sendMessage(`§e${relicConfig(number).name} wurde zerstört und kann wieder gecraftet werden.`);
    }, LOSS_CHECK_DELAY_TICKS);
  });
}

export function relicStatus(number) {
  const entry = load().relics[number];
  return entry ? `existiert (zuletzt bei ${entry.holder ?? "?"})` : "frei";
}

export { RELIC_COUNT };
