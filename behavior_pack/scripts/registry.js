import { EquipmentSlot, ItemStack, system, world } from "@minecraft/server";
import { DATA } from "./data.js";
import { relicConfig, relicDisplay, relicKey, relicTypeId, saveConfig } from "./config.js";

// Keeps track of which relic currently exists in the world, so that each one
// can only exist once. Every real relic carries a serial number; the registry
// stores the serial of the one valid copy.

const REGISTRY_KEY = "ce:registry_v4"; // relics of 4.x worlds stay valid across updates
const SERIAL_PROPERTY = "ce:serial";
const LOSS_CHECK_DELAY_TICKS = 60;

let registry;
const pendingLosses = new Map(); // "key:serial" -> true while checking

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
export function registeredSerial(key) {
  return load().relics[key]?.serial;
}

export function isRelicFree(key) {
  return registeredSerial(key) === undefined;
}

export function freeRelic(key) {
  delete load().relics[key];
  save();
}

export function serialOf(itemStack) {
  const value = itemStack.getDynamicProperty(SERIAL_PROPERTY);
  return typeof value === "number" ? value : undefined;
}

/** Creates a brand-new registered relic item (used for crafting and /ce:give). */
export function claimRelic(key, itemStack, holderName) {
  const data = load();
  const serial = data.nextSerial++;
  data.relics[key] = { serial, holder: holderName };
  save();
  // A newly made relic always starts at level 1 (levels are lost with the old copy).
  relicConfig(key).level = 1;
  saveConfig();
  itemStack.setDynamicProperty(SERIAL_PROPERTY, serial);
  applyDisplay(key, itemStack);
  return itemStack;
}

export function newRelicItem(key, holderName) {
  return claimRelic(key, new ItemStack(relicTypeId(key), 1), holderName);
}

function applyDisplay(key, itemStack) {
  const { nameTag, lore } = relicDisplay(key);
  itemStack.nameTag = nameTag;
  itemStack.setLore(lore);
}

function displayIsCurrent(key, itemStack) {
  const { nameTag, lore } = relicDisplay(key);
  return itemStack.nameTag === nameTag && itemStack.getLore().join("\n") === lore.join("\n");
}

function refundIngredients(player, key) {
  const container = player.getComponent("minecraft:inventory")?.container;
  const items = DATA.refund[key] ?? [];
  for (const typeId of items) {
    const leftover = container?.addItem(new ItemStack(typeId, 1));
    if (leftover) player.dimension.spawnItem(leftover, player.location);
  }
}

/**
 * Checks one inventory slot of a player. Returns the relic key if the slot
 * holds a valid, enabled relic, otherwise undefined. Invalid copies are removed.
 */
function checkSlot(player, slot) {
  const itemStack = slot.getItem();
  if (!itemStack) return undefined;
  const key = relicKey(itemStack.typeId);
  if (!key) return undefined;

  const relic = relicConfig(key);
  const serial = serialOf(itemStack);
  const registered = registeredSerial(key);

  if (serial === undefined) {
    // Freshly crafted (or spawned in creative).
    if (!relic.enabled) {
      slot.setItem(undefined);
      refundIngredients(player, key);
      player.sendMessage(`§c${relic.name} ist deaktiviert. Die Zutaten wurden zurückgegeben.`);
      return undefined;
    }
    if (registered !== undefined) {
      slot.setItem(undefined);
      refundIngredients(player, key);
      player.sendMessage(`§c${relic.name} existiert bereits in dieser Welt. Die Zutaten wurden zurückgegeben.`);
      return undefined;
    }
    slot.setItem(claimRelic(key, itemStack, player.name));
    world.sendMessage(`§6${player.name} hat §d${relic.name}§6 erschaffen!`);
    return key;
  }

  if (registered === undefined && relic.enabled) {
    // Was marked as lost, but turned up again: it becomes the valid copy.
    load().relics[key] = { serial, holder: player.name };
    save();
  } else if (serial !== registeredSerial(key)) {
    slot.setItem(undefined);
    player.sendMessage(`§c${relic.name} war eine ungültige Kopie und wurde entfernt.`);
    return undefined;
  }

  if (load().relics[key].holder !== player.name) {
    load().relics[key].holder = player.name;
    save();
  }
  if (!displayIsCurrent(key, itemStack)) {
    applyDisplay(key, itemStack);
    slot.setItem(itemStack);
  }
  return relic.enabled ? key : undefined;
}

/** Scans the whole inventory, hotbar and offhand. Returns the active relics. */
export function scanPlayer(player) {
  const active = [];
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container) {
    for (let index = 0; index < container.size; index++) {
      const key = checkSlot(player, container.getSlot(index));
      if (key) active.push(key);
    }
  }
  const offhand = player.getComponent("minecraft:equippable")?.getEquipmentSlot(EquipmentSlot.Offhand);
  if (offhand) {
    const key = checkSlot(player, offhand);
    if (key) active.push(key);
  }
  return active;
}

function playerHasSerial(key, serial) {
  for (const player of world.getAllPlayers()) {
    if (!player) continue;
    const container = player.getComponent("minecraft:inventory")?.container;
    if (!container) continue;
    for (let index = 0; index < container.size; index++) {
      const item = container.getItem(index);
      if (item && relicKey(item.typeId) === key && serialOf(item) === serial) return true;
    }
    const offhand = player.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Offhand);
    if (offhand && relicKey(offhand.typeId) === key && serialOf(offhand) === serial) return true;
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
    const key = relicKey(itemStack?.typeId);
    if (!key) return;
    const serial = serialOf(itemStack);
    if (serial === undefined) return;

    const entityId = removedEntity.id;
    const dimension = removedEntity.dimension;
    const location = { ...removedEntity.location };
    const pendingId = `${key}:${serial}`;
    if (pendingLosses.has(pendingId)) return;
    pendingLosses.set(pendingId, true);

    system.runTimeout(() => {
      pendingLosses.delete(pendingId);
      const wasPickedUp = pickedUp.delete(entityId);
      if (wasPickedUp || registeredSerial(key) !== serial) return;
      if (playerHasSerial(key, serial)) return;
      // Chunk unloaded (player walked away) - the item still exists there.
      if (location.y >= dimension.heightRange.min && !dimension.getBlock(location)) return;
      if (location.y >= dimension.heightRange.min && hopperNearby(dimension, location)) return;

      freeRelic(key);
      world.sendMessage(`§e${relicConfig(key).name} wurde zerstört und kann wieder gecraftet werden.`);
    }, LOSS_CHECK_DELAY_TICKS);
  });
}

export function relicStatus(key) {
  const entry = load().relics[key];
  return entry ? `existiert (zuletzt bei ${entry.holder ?? "?"})` : "frei";
}

