import { EntityDamageCause, WeatherType, system, world } from "@minecraft/server";
import { relicConfig, relicKey, setEffectOn } from "./config.js";
import { registeredSerial, serialOf } from "./registry.js";
import { attackCooldownLeft, useRelic } from "./attacks.js";
import { protect } from "./protection.js";
import { nearbyTargets } from "./targets.js";

// Controls with a relic in the main hand:
//   right-click                      -> special attack (attacks.js)
//   sneak + short right-click         -> boost-up
//   sneak + hold right-click for 5 s  -> permanent effect on/off

const HOLD_TICKS = 100; // 5 seconds (matches minecraft:use_modifiers.use_duration)
const holds = new Map(); // player id -> { key, start, done }
const boostCooldowns = new Map(); // "playerId:key" -> tick when ready again
const veinUntil = new Map(); // player id -> tick (haste boost: 3x3 mining)
const lavaUntil = new Map(); // player id -> tick (fire boost: lava swimming)

const UNBREAKABLE = new Set([
  "minecraft:bedrock", "minecraft:barrier", "minecraft:end_portal_frame", "minecraft:end_portal",
  "minecraft:end_gateway", "minecraft:portal", "minecraft:command_block", "minecraft:chain_command_block",
  "minecraft:repeating_command_block", "minecraft:structure_block", "minecraft:structure_void", "minecraft:jigsaw",
  "minecraft:allow", "minecraft:deny", "minecraft:border_block", "minecraft:light_block", "minecraft:reinforced_deepslate",
]);
const LAVA_LIKE = new Set(["minecraft:lava", "minecraft:flowing_lava", "minecraft:fire", "minecraft:soul_fire"]);

function playSound(player, sound) {
  try {
    player.dimension.playSound(sound, player.location);
  } catch {
    // Not important.
  }
}

function isValidRelic(player, itemStack, key) {
  if (serialOf(itemStack) === undefined || serialOf(itemStack) !== registeredSerial(key)) {
    player.sendMessage("§7Dieser Effekt wird noch geprüft …");
    return false;
  }
  return relicConfig(key).enabled;
}

export function boostCooldownLeft(player, key) {
  const readyAt = boostCooldowns.get(`${player.id}:${key}`) ?? 0;
  return Math.max(0, Math.ceil((readyAt - system.currentTick) / 20));
}

/** Start of a right-click with a relic (custom component onUse). */
export function onRelicUse(player, itemStack) {
  const key = relicKey(itemStack?.typeId);
  if (!key) return;
  if (!player.isSneaking) {
    useRelic(player, itemStack);
    return;
  }
  if (!isValidRelic(player, itemStack, key)) return;
  // onUse runs one tick late (system.run in main.js), so the hold started a tick earlier.
  holds.set(player.id, { key, start: system.currentTick - 1, done: false });
}

function releaseHold(player) {
  const hold = holds.get(player.id);
  holds.delete(player.id);
  if (!hold || hold.done) return;
  if (system.currentTick - hold.start >= HOLD_TICKS - 5) {
    toggleEffect(player, hold.key);
  } else {
    useBoost(player, hold.key);
  }
}

function completeHold(player) {
  const hold = holds.get(player.id);
  if (!hold || hold.done) return;
  hold.done = true;
  toggleEffect(player, hold.key);
}

function toggleEffect(player, key) {
  const relic = relicConfig(key);
  const on = relic.effectOn === false;
  setEffectOn(key, on);
  player.sendMessage(on ? `§a${relic.name}: Dauerwirkung ist wieder an.` : `§e${relic.name}: Dauerwirkung ist jetzt aus.`);
  player.onScreenDisplay.setActionBar(on ? "§aDauerwirkung an" : "§eDauerwirkung aus");
  playSound(player, on ? "random.levelup" : "random.click");
}

/** Sneak + short right-click: the boost-up of the relic. */
export function useBoost(player, key) {
  const relic = relicConfig(key);
  if (relic.boost === "none") return;
  const seconds = boostCooldownLeft(player, key);
  if (seconds > 0) {
    player.onScreenDisplay.setActionBar(`§c${relic.name}: Boost noch ${seconds} s Abklingzeit`);
    return;
  }
  const ticks = relic.boostDuration * 20;
  try {
    switch (relic.boost) {
      case "effect":
        player.addEffect(relic.boostEffect, ticks, { amplifier: relic.boostAmplifier, showParticles: true });
        if (relic.boostEffect === "health_boost") {
          system.run(() => player.isValid && player.getComponent("minecraft:health")?.resetToMaxValue());
        }
        break;
      case "vein":
        veinUntil.set(player.id, system.currentTick + ticks);
        break;
      case "lava":
        lavaUntil.set(player.id, system.currentTick + ticks);
        player.addEffect("fire_resistance", ticks, { amplifier: 0, showParticles: true });
        protect(player, "fire", ticks);
        break;
      case "rain":
        world.getDimension("minecraft:overworld").setWeather(WeatherType.Rain, ticks);
        break;
      default:
        return;
    }
  } catch (error) {
    console.warn(`[CraftedEffects] Boost ${relic.boost} fehlgeschlagen: ${error}`);
    return;
  }
  boostCooldowns.set(`${player.id}:${key}`, system.currentTick + relic.boostCooldown * 20);
  player.onScreenDisplay.setActionBar(`§b${relic.name}: Boost-Up!`);
  playSound(player, "beacon.power");
}

/** Haste boost: every mined block also mines the 3x3 area around it, across the view direction. */
function mineArea(player, block, dimension) {
  const view = player.getViewDirection();
  const ax = Math.abs(view.x);
  const ay = Math.abs(view.y);
  const az = Math.abs(view.z);
  const center = block.location;
  for (let a = -1; a <= 1; a++) {
    for (let b = -1; b <= 1; b++) {
      if (a === 0 && b === 0) continue;
      let offset;
      if (ay >= ax && ay >= az) offset = { x: a, y: 0, z: b };
      else if (ax >= az) offset = { x: 0, y: a, z: b };
      else offset = { x: a, y: b, z: 0 };
      const location = { x: center.x + offset.x, y: center.y + offset.y, z: center.z + offset.z };
      const other = dimension.getBlock(location);
      if (!other || other.isAir || other.isLiquid || UNBREAKABLE.has(other.typeId)) continue;
      try {
        dimension.runCommand(`setblock ${location.x} ${location.y} ${location.z} air destroy`);
      } catch {
        // Protected area or unloaded - skip this block.
      }
    }
  }
}

function lavaTick(player, tick) {
  const feet = player.dimension.getBlock(player.location);
  const body = feet?.above();
  const inLava = (feet && LAVA_LIKE.has(feet.typeId)) || (body && LAVA_LIKE.has(body.typeId));
  if (inLava) {
    const view = player.getViewDirection();
    player.applyKnockback({ x: view.x * 0.9, z: view.z * 0.9 }, view.y * 0.6 + 0.04);
  }
  if (tick % 20 === 0) {
    for (const target of nearbyTargets(player, 5)) target.setOnFire(4, true);
  }
}

/** Shows the hold progress or the cooldowns while a relic is held. */
function showStatus(player, heldItem) {
  const hold = holds.get(player.id);
  if (hold && !hold.done) {
    const seconds = Math.min(5, Math.floor((system.currentTick - hold.start) / 20));
    const action = relicConfig(hold.key).effectOn === false ? "Einschalten" : "Ausschalten";
    player.onScreenDisplay.setActionBar(`§e${action} … ${seconds}/5 s`);
    return;
  }
  const key = relicKey(heldItem?.typeId);
  if (!key) return;
  const attack = attackCooldownLeft(player, key);
  const boost = boostCooldownLeft(player, key);
  if (attack === 0 && boost === 0) return;
  const parts = [];
  if (attack > 0) parts.push(`Angriff ${attack} s`);
  if (boost > 0) parts.push(`Boost ${boost} s`);
  player.onScreenDisplay.setActionBar(`§7${relicConfig(key).name}: §c${parts.join(" · ")}`);
}

export function setupBoosts() {
  world.afterEvents.itemReleaseUse.subscribe(({ source, itemStack }) => {
    if (source?.typeId === "minecraft:player" && relicKey(itemStack?.typeId)) releaseHold(source);
  });
  world.afterEvents.itemCompleteUse.subscribe(({ source, itemStack }) => {
    if (source?.typeId === "minecraft:player" && relicKey(itemStack?.typeId)) completeHold(source);
  });
  world.afterEvents.itemStopUse.subscribe(({ source, itemStack }) => {
    if (source?.typeId === "minecraft:player" && relicKey(itemStack?.typeId)) releaseHold(source);
  });

  world.afterEvents.playerBreakBlock.subscribe(({ player, block, dimension }) => {
    if ((veinUntil.get(player.id) ?? 0) < system.currentTick) return;
    system.run(() => {
      if (player.isValid) mineArea(player, block, dimension);
    });
  });

  // Fire boost: no damage from lava/fire while it runs.
  world.beforeEvents.entityHurt.subscribe((event) => {
    const until = lavaUntil.get(event.hurtEntity?.id);
    if (!until || until < system.currentTick) return;
    const cause = event.damageSource?.cause;
    if (cause === EntityDamageCause.lava || cause === EntityDamageCause.fire || cause === EntityDamageCause.fireTick) event.cancel = true;
  });

  system.runInterval(() => {
    const now = system.currentTick;
    for (const [playerId, until] of lavaUntil) {
      if (until < now) {
        lavaUntil.delete(playerId);
        continue;
      }
      const player = world.getEntity(playerId);
      if (!player?.isValid) continue;
      try {
        lavaTick(player, now);
      } catch {
        // Player not ready.
      }
    }
    for (const [playerId, until] of veinUntil) if (until < now) veinUntil.delete(playerId);
    // Hold fallback: if the complete event did not arrive, 5 s of holding still toggles.
    for (const [playerId, hold] of holds) {
      const player = world.getEntity(playerId);
      if (!player?.isValid) {
        holds.delete(playerId);
        continue;
      }
      if (!hold.done && now - hold.start >= HOLD_TICKS + 5) {
        const held = player.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex);
        if (player.isSneaking && relicKey(held?.typeId) === hold.key) completeHold(player);
        else holds.delete(playerId);
      }
      if (now - hold.start > HOLD_TICKS + 200) holds.delete(playerId);
    }
  }, 1);

  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      if (!player) continue;
      try {
        const held = player.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex);
        showStatus(player, held);
      } catch {
        // Player dead or loading.
      }
    }
  }, 5);

  world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    holds.delete(playerId);
    veinUntil.delete(playerId);
    lavaUntil.delete(playerId);
  });
}
