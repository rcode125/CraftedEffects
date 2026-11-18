import { EquipmentSlot, ItemStack, system, world } from "@minecraft/server";
import { DATA } from "./data.js";
import { relicConfig, relicDisplay, relicKey, relicTypeId, saveConfig } from "./config.js";

// Keeps track of which relic currently exists in the world, so that each one
// can only exist once. Every real relic carries a serial number; the registry
// stores the serial of the one valid copy.
//
// Rules (5.0):
// - every player carries at most one relic; picking up a second one swaps them
// - relics cannot burn or explode; only the void destroys them
// - a relic that is not in a player's inventory for 5 minutes decays
//   (ground, chests, ender chests, barrels, shulkers ...); offline players keep theirs
// - on death the relic stays with the player, unless the killer uses the Stealing

const REGISTRY_KEY = "ce:registry_v4"; // relics of 4.x worlds stay valid across updates
const SERIAL_PROPERTY = "ce:serial";
const STASH_PROPERTY = "ce:stash";
export const STEALING_ID = "craftedeffects:stealing";
const PLAYER_HEAD_ID = "minecraft:player_head";

const DECAY_TICKS = 5 * 60 * 20; // 5 minutes outside a player's inventory
const DECAY_CHECK_TICKS = 20;
const SAVE_EVERY_TICKS = 400;
const SWAP_PICKUP_BLOCK_TICKS = 60; // the dropped old relic is not picked up again at once

let registry;
let dirty = false;
const carried = new Map(); // player id -> relic key carried at the last scan
const seenThisRound = new Set(); // relic keys found in an online inventory since the last decay check
const expectedRemovals = new Set(); // item entity ids we remove ourselves (no respawn)
const swapDrops = new Map(); // item entity id -> { playerId, until }

function load() {
  if (registry) return registry;
  registry = { nextSerial: 1, relics: {}, v5: true };
  try {
    const raw = world.getDynamicProperty(REGISTRY_KEY);
    const saved = typeof raw === "string" ? JSON.parse(raw) : undefined;
    if (saved) registry = { ...registry, ...saved, v5: saved.v5 === true };
    if (!registry.v5) {
      // Update from 4.x: we do not know where the relics are (maybe with offline players),
      // so none of them starts decaying until its holder is seen again.
      for (const entry of Object.values(registry.relics)) entry.offline = true;
      registry.v5 = true;
    }
  } catch (error) {
    console.warn(`[CraftedEffects] Register beschädigt, wird neu angelegt: ${error}`);
  }
  return registry;
}

function save() {
  dirty = false;
  world.setDynamicProperty(REGISTRY_KEY, JSON.stringify(load()));
}

function entryOf(key) {
  return load().relics[key];
}

/** Serial of the valid copy of a relic, or undefined if the relic is free. */
export function registeredSerial(key) {
  return entryOf(key)?.serial;
}

export function isRelicFree(key) {
  return registeredSerial(key) === undefined;
}

export function freeRelic(key) {
  delete load().relics[key];
  save();
  removeGroundCopies(key);
}

export function serialOf(itemStack) {
  const value = itemStack.getDynamicProperty(SERIAL_PROPERTY);
  return typeof value === "number" ? value : undefined;
}

function isValidCopy(key, itemStack) {
  const serial = serialOf(itemStack);
  return serial !== undefined && serial === registeredSerial(key);
}

/** Creates a brand-new registered relic item (used for crafting and /ce:give). */
export function claimRelic(key, itemStack, holder) {
  const data = load();
  const serial = data.nextSerial++;
  data.relics[key] = { serial, holder: holder?.name ?? holder, holderId: holder?.id, missingTicks: 0 };
  save();
  // A newly made relic always starts at level 1 (levels are lost with the old copy).
  relicConfig(key).level = 1;
  saveConfig();
  itemStack.setDynamicProperty(SERIAL_PROPERTY, serial);
  applyDisplay(key, itemStack);
  return itemStack;
}

export function newRelicItem(key, holder) {
  return claimRelic(key, new ItemStack(relicTypeId(key), 1), holder);
}

/** The item of an existing relic, rebuilt from its serial (after a death or a theft). */
function rebuildRelicItem(key, serial) {
  const itemStack = new ItemStack(relicTypeId(key), 1);
  itemStack.setDynamicProperty(SERIAL_PROPERTY, serial);
  applyDisplay(key, itemStack);
  return itemStack;
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

function giveOrDrop(player, itemStack) {
  const leftover = player.getComponent("minecraft:inventory")?.container?.addItem(itemStack);
  if (leftover) player.dimension.spawnItem(leftover, player.location);
}

function relicSlots(player) {
  const slots = [];
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container) {
    for (let index = 0; index < container.size; index++) {
      const slot = container.getSlot(index);
      if (relicKey(slot.getItem()?.typeId)) slots.push(slot);
    }
  }
  const offhand = player.getComponent("minecraft:equippable")?.getEquipmentSlot(EquipmentSlot.Offhand);
  if (offhand && relicKey(offhand.getItem()?.typeId)) slots.push(offhand);
  return slots;
}

/** A relic that already has a serial: keeps it if it is the valid copy, removes it otherwise. */
function checkRegistered(player, slot, itemStack, key) {
  const relic = relicConfig(key);
  if (!isValidCopy(key, itemStack)) {
    slot.setItem(undefined);
    player.sendMessage(`§c${relic.name} war eine ungültige oder verfallene Kopie und wurde entfernt.`);
    return false;
  }
  const entry = entryOf(key);
  if (entry.holderId !== player.id || entry.offline || entry.stashed) {
    Object.assign(entry, { holder: player.name, holderId: player.id, offline: false, stashed: false });
    dirty = true;
  }
  if (!displayIsCurrent(key, itemStack)) {
    applyDisplay(key, itemStack);
    slot.setItem(itemStack);
  }
  return true;
}

/** A freshly crafted relic (no serial yet). */
function checkFresh(player, slot, itemStack, key, alreadyCarries) {
  const relic = relicConfig(key);
  let reason;
  if (!relic.enabled) reason = `${relic.name} ist deaktiviert`;
  else if (registeredSerial(key) !== undefined) reason = `${relic.name} existiert bereits in dieser Welt`;
  else if (alreadyCarries) reason = "Du kannst nur ein Relikt gleichzeitig haben";
  if (reason) {
    slot.setItem(undefined);
    refundIngredients(player, key);
    player.sendMessage(`§c${reason}. Die Zutaten wurden zurückgegeben.`);
    return false;
  }
  slot.setItem(claimRelic(key, itemStack, player));
  world.sendMessage(`§6${player.name} hat §d${relic.name}§6 erschaffen!`);
  return true;
}

/** Drops a relic in front of the player (one-relic rule); it is not picked up again right away. */
function dropForSwap(player, slot) {
  const itemStack = slot.getItem();
  slot.setItem(undefined);
  const view = player.getViewDirection();
  const spot = { x: player.location.x + view.x * 1.5, y: player.location.y + 0.5, z: player.location.z + view.z * 1.5 };
  const entity = player.dimension.spawnItem(itemStack, spot);
  swapDrops.set(entity.id, { playerId: player.id, until: system.currentTick + SWAP_PICKUP_BLOCK_TICKS });
}

/**
 * Scans the whole inventory, hotbar and offhand: registers fresh crafts, removes
 * invalid copies and enforces one relic per player. Returns the active relic keys.
 */
export function scanPlayer(player) {
  const slots = relicSlots(player);
  const valid = []; // { key, slot }
  // Relics with a serial first, so that a fresh craft knows whether the player already has one.
  for (const slot of slots) {
    const itemStack = slot.getItem();
    const key = relicKey(itemStack.typeId);
    if (serialOf(itemStack) !== undefined && checkRegistered(player, slot, itemStack, key)) valid.push({ key, slot });
  }
  for (const slot of slots) {
    const itemStack = slot.getItem();
    if (!itemStack || serialOf(itemStack) !== undefined) continue;
    const key = relicKey(itemStack.typeId);
    if (checkFresh(player, slot, itemStack, key, valid.length > 0)) valid.push({ key, slot });
  }

  if (valid.length > 1) {
    // Swap: the relic that was just picked up stays, the one carried before is dropped.
    const previous = carried.get(player.id);
    const keep = valid.find((entry) => entry.key !== previous) ?? valid[0];
    for (const entry of valid) {
      if (entry === keep) continue;
      dropForSwap(player, entry.slot);
      player.sendMessage(`§e${relicConfig(entry.key).name} wurde abgelegt – du kannst nur ein Relikt haben.`);
    }
    valid.length = 0;
    valid.push(keep);
  }

  const current = valid[0]?.key;
  if (current) {
    carried.set(player.id, current);
    seenThisRound.add(current);
    const entry = entryOf(current);
    if (entry.missingTicks) entry.missingTicks = 0;
  } else {
    carried.delete(player.id);
  }
  return valid.filter(({ key }) => relicConfig(key).enabled).map(({ key }) => key);
}

/** The valid relic a player carries (inventory, hotbar or offhand), with its slot. */
export function carriedRelic(player) {
  for (const slot of relicSlots(player)) {
    const itemStack = slot.getItem();
    const key = relicKey(itemStack.typeId);
    if (isValidCopy(key, itemStack)) return { key, slot, itemStack };
  }
  return undefined;
}

function playerHasSerial(key, serial) {
  for (const player of world.getAllPlayers()) {
    if (!player) continue;
    for (const slot of relicSlots(player)) {
      const item = slot.getItem();
      if (relicKey(item.typeId) === key && serialOf(item) === serial) return true;
    }
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

// ---------------------------------------------------------------- loss

const DIMENSIONS = ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"];

function groundCopies(key, serial) {
  const found = [];
  for (const id of DIMENSIONS) {
    let entities = [];
    try {
      entities = world.getDimension(id).getEntities({ type: "minecraft:item" });
    } catch {
      continue;
    }
    for (const entity of entities) {
      const itemStack = entity.getComponent("minecraft:item")?.itemStack;
      if (relicKey(itemStack?.typeId) === key && (serial === undefined || serialOf(itemStack) === serial)) found.push(entity);
    }
  }
  return found;
}

function removeGroundCopies(key) {
  for (const entity of groundCopies(key)) {
    expectedRemovals.add(entity.id);
    try {
      entity.remove();
    } catch {
      expectedRemovals.delete(entity.id);
    }
  }
}

/** The relic is gone for good: free it so it can be crafted again (at level 1). */
function loseRelic(key, why) {
  if (!entryOf(key)) return;
  freeRelic(key);
  world.sendMessage(`§e${relicConfig(key).name} ${why} und kann wieder gecraftet werden.`);
}

const HAZARDS = new Set([
  "minecraft:lava", "minecraft:flowing_lava", "minecraft:fire", "minecraft:soul_fire", "minecraft:cactus",
  "minecraft:magma", "minecraft:campfire", "minecraft:soul_campfire", "minecraft:sweet_berry_bush",
]);

/** Closest air block with safe solid ground below it, near the given spot. */
function safeSpot(dimension, location) {
  const base = { x: Math.floor(location.x), y: Math.floor(location.y), z: Math.floor(location.z) };
  let best;
  let bestDistance = Infinity;
  for (let dy = -2; dy <= 5; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        const spot = { x: base.x + dx, y: base.y + dy, z: base.z + dz };
        const block = dimension.getBlock(spot);
        const below = block?.below();
        if (!block?.isAir || !below || below.isAir || below.isLiquid || HAZARDS.has(below.typeId)) continue;
        if (HAZARDS.has(block.typeId)) continue;
        const distance = dx * dx + dz * dz + dy * dy * 0.5 + (dy < 0 ? 4 : 0);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = { x: spot.x + 0.5, y: spot.y + 0.1, z: spot.z + 0.5 };
        }
      }
    }
  }
  if (best) return best;
  // Nothing found: straight up out of the danger.
  for (let y = base.y + 1; y < dimension.heightRange.max; y++) {
    const block = dimension.getBlock({ ...base, y });
    if (block?.isAir) return { x: base.x + 0.5, y: y + 0.1, z: base.z + 0.5 };
  }
  return { x: base.x + 0.5, y: base.y + 1, z: base.z + 0.5 };
}

/** Relics on the ground cannot be destroyed (lava, fire, cactus, explosions); only the void takes them. */
function watchDroppedRelics() {
  const pickedUp = new Set();

  world.beforeEvents.entityItemPickup.subscribe((event) => {
    const { item, entity } = event;
    if (!item) return;
    const block = swapDrops.get(item.id);
    if (block && block.playerId === entity?.id && system.currentTick < block.until) {
      event.cancel = true;
      return;
    }
    pickedUp.add(item.id);
  });

  world.beforeEvents.entityRemove.subscribe(({ removedEntity }) => {
    if (removedEntity?.typeId !== "minecraft:item") return;
    const entityId = removedEntity.id;
    swapDrops.delete(entityId);
    if (expectedRemovals.delete(entityId)) return;
    const itemStack = removedEntity.getComponent("minecraft:item")?.itemStack;
    const key = relicKey(itemStack?.typeId);
    if (!key) return;
    const serial = serialOf(itemStack);
    if (serial === undefined) return;
    const dimension = removedEntity.dimension;
    const location = { ...removedEntity.location };

    system.runTimeout(() => {
      if (pickedUp.delete(entityId)) return;
      if (registeredSerial(key) !== serial) return;
      if (location.y < dimension.heightRange.min) return loseRelic(key, "ist ins Void gefallen");
      if (playerHasSerial(key, serial)) return;
      // Chunk unloaded (player walked away) - the item still exists there.
      if (!dimension.getBlock(location)) return;
      if (hopperNearby(dimension, location)) return; // went into a container; it decays there
      if ((entryOf(key)?.missingTicks ?? 0) >= DECAY_TICKS - 200) return loseRelic(key, "ist verfallen");
      // Burnt, blown up, cactus ...: the relic survives and reappears on safe ground.
      const respawned = dimension.spawnItem(rebuildRelicItem(key, serial), safeSpot(dimension, location));
      try {
        respawned.clearVelocity();
      } catch {
        // Not important.
      }
    }, 2);
  });
}

/** Counts how long each relic has been outside every online player's inventory. */
function watchDecay() {
  let sinceSave = 0;
  system.runInterval(() => {
    const data = load();
    for (const key of Object.keys(data.relics)) {
      const entry = data.relics[key];
      if (seenThisRound.has(key)) {
        if (entry.missingTicks) {
          entry.missingTicks = 0;
          dirty = true;
        }
        continue;
      }
      if (entry.offline || entry.stashed) continue; // in an offline inventory or waiting for its owner's respawn
      entry.missingTicks = (entry.missingTicks ?? 0) + DECAY_CHECK_TICKS;
      dirty = true;
      if (entry.missingTicks >= DECAY_TICKS) {
        loseRelic(key, "lag 5 Minuten außerhalb eines Inventars, ist verfallen");
      }
    }
    seenThisRound.clear();
    sinceSave += DECAY_CHECK_TICKS;
    if (dirty && sinceSave >= SAVE_EVERY_TICKS) {
      sinceSave = 0;
      save();
    }
  }, DECAY_CHECK_TICKS);

  world.beforeEvents.playerLeave.subscribe(({ player }) => {
    const key = carried.get(player.id);
    carried.delete(player.id);
    if (!key) return;
    const entry = entryOf(key);
    if (entry?.holderId === player.id) {
      entry.offline = true;
      system.run(save);
    }
  });
}

// ---------------------------------------------------------------- death

function findDroppedRelic(dimension, location, key, serial) {
  return dimension
    .getEntities({ location, maxDistance: 8, type: "minecraft:item" })
    .find((entity) => {
      const itemStack = entity.getComponent("minecraft:item")?.itemStack;
      return relicKey(itemStack?.typeId) === key && serialOf(itemStack) === serial;
    });
}

/** Takes the dead player's relic away from wherever it is (dropped or kept inventory). Returns true if found. */
function takeRelicFromDead(dead, key, serial, dimension, location) {
  for (const slot of relicSlots(dead)) {
    const item = slot.getItem();
    if (relicKey(item.typeId) === key && serialOf(item) === serial) {
      slot.setItem(undefined); // keepInventory is on
      return true;
    }
  }
  const dropped = findDroppedRelic(dimension, location, key, serial);
  if (!dropped) return false;
  expectedRemovals.add(dropped.id);
  dropped.remove();
  return true;
}

function consumeStealing(killer) {
  const slot = killer.getComponent("minecraft:inventory")?.container?.getSlot(killer.selectedSlotIndex);
  if (slot?.getItem()?.typeId === STEALING_ID) slot.setItem(undefined);
  try {
    killer.dimension.playSound("random.break", killer.location);
  } catch {
    // Not important.
  }
}

function onPlayerDeath(dead, damageSource) {
  const dimension = dead.dimension;
  const location = { ...dead.location };
  const killer = damageSource?.damagingEntity;
  const killedByPlayer = killer?.typeId === "minecraft:player" && killer.id !== dead.id;
  const withStealing =
    killedByPlayer &&
    killer.getComponent("minecraft:inventory")?.container?.getItem(killer.selectedSlotIndex)?.typeId === STEALING_ID;

  if (killedByPlayer) {
    try {
      dimension.spawnItem(new ItemStack(PLAYER_HEAD_ID, 1), location);
    } catch (error) {
      console.warn(`[CraftedEffects] Spielerkopf konnte nicht erzeugt werden: ${error}`);
    }
  }

  const key = carried.get(dead.id);
  const entry = key && entryOf(key);
  if (!entry || entry.holderId !== dead.id) return;
  const serial = entry.serial;
  entry.stashed = true; // no decay while the item is in flux
  carried.delete(dead.id);

  // Drops appear right after death; look a few times.
  let tries = 0;
  const id = system.runInterval(() => {
    tries++;
    if (registeredSerial(key) !== serial) return system.clearRun(id);
    const found = takeRelicFromDead(dead, key, serial, dimension, location);
    if (!found && tries < 6) return;
    system.clearRun(id);
    if (!found) {
      // Not found (already picked up by someone, or destroyed): normal rules apply again.
      entry.stashed = false;
      save();
      return;
    }
    const relicName = relicConfig(key).name;
    if (withStealing && killer.isValid) {
      entry.stashed = false;
      Object.assign(entry, { holder: killer.name, holderId: killer.id });
      save();
      giveOrDrop(killer, rebuildRelicItem(key, serial));
      consumeStealing(killer);
      world.sendMessage(`§c${killer.name} hat ${dead.name} mit dem Stealing §d${relicName}§c abgenommen!`);
      return;
    }
    // Normal death: the relic waits for the respawn.
    dead.setDynamicProperty(STASH_PROPERTY, JSON.stringify({ key, serial }));
    save();
  }, 2);
}

function returnStash(player) {
  const raw = player.getDynamicProperty(STASH_PROPERTY);
  if (typeof raw !== "string") return;
  player.setDynamicProperty(STASH_PROPERTY, undefined);
  try {
    const { key, serial } = JSON.parse(raw);
    if (registeredSerial(key) !== serial) return; // freed by an admin meanwhile
    const entry = entryOf(key);
    Object.assign(entry, { stashed: false, offline: false, holder: player.name, holderId: player.id, missingTicks: 0 });
    save();
    giveOrDrop(player, rebuildRelicItem(key, serial));
    player.sendMessage(`§a${relicConfig(key).name} ist wieder bei dir.`);
  } catch (error) {
    console.warn(`[CraftedEffects] Relikt nach dem Respawn nicht zurückgegeben: ${error}`);
  }
}

function watchDeaths() {
  world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
    if (deadEntity?.typeId !== "minecraft:player") return;
    try {
      onPlayerDeath(deadEntity, damageSource);
    } catch (error) {
      console.warn(`[CraftedEffects] Tod konnte nicht verarbeitet werden: ${error}`);
    }
  });
  world.afterEvents.playerSpawn.subscribe(({ player }) => {
    system.runTimeout(() => {
      if (player.isValid) returnStash(player);
    }, 5);
  });
}

export function setupRegistry() {
  watchDroppedRelics();
  watchDecay();
  watchDeaths();
}

export function relicStatus(key) {
  const entry = entryOf(key);
  if (!entry) return "frei";
  let where = `bei ${entry.holder ?? "?"}`;
  if (entry.offline) where += " (offline)";
  if (entry.stashed) where += " (wartet auf Respawn)";
  if (entry.missingTicks) where += `, seit ${Math.floor(entry.missingTicks / 20)} s nicht im Inventar`;
  return `existiert ${where}`;
}
