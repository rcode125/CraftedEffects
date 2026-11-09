import { EntityDamageCause, system } from "@minecraft/server";
import { relicConfig, relicKey } from "./config.js";
import { registeredSerial, serialOf } from "./registry.js";
import { isInAutoMace, startAutoMace } from "./automace.js";
import { protect } from "./protection.js";
import { nearbyTargets, normalize } from "./targets.js";

const cooldowns = new Map(); // "playerId:relicKey" -> tick when ready again

// Tuning values. The dash and launch strengths are checked by GameTests.
const DASH_STEP = 3; // blocks per tick
const DASH_TICKS = 10; // 10 x 3 = 30 blocks
// The dash moves the player by teleporting a few blocks every tick: sideways knockback
// on players is damped to a fraction (measured in GameTests: 2.5 -> 0.2 blocks/tick).
const RING_MAX_RADIUS = 10;
const RING_DAMAGE = 6; // 3 hearts
const FORTRESS_TICKS = 60; // 3 seconds
const COMET_COUNT = 8;
const COMET_RING_RADIUS = 6;
const COMET_HEIGHT = 10;
const AEGIS_RADIUS = 4;
const AEGIS_TICKS = 100; // 5 seconds

function playSound(player, sound, location = player.location) {
  try {
    player.dimension.playSound(sound, location);
  } catch {
    // Sound not available on this version - not important.
  }
}

function particle(dimension, name, location) {
  try {
    dimension.spawnParticle(name, location);
  } catch {
    // Particle not available or chunk not loaded - not important.
  }
}

function pushAway(from, entity, strength, lift) {
  const away = normalize({ x: entity.location.x - from.x, y: 0, z: entity.location.z - from.z });
  entity.applyKnockback({ x: away.x * strength, z: away.z * strength }, lift);
}

function horizontalDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Runs `step(tick)` every `every` ticks until it has run `total` ticks or returns false. */
function repeat(total, every, step) {
  let elapsed = 0;
  const id = system.runInterval(() => {
    elapsed += every;
    let keepGoing = false;
    try {
      keepGoing = step(elapsed) !== false;
    } catch (error) {
      console.warn(`[CraftedEffects] Angriff abgebrochen: ${error}`);
    }
    if (!keepGoing || elapsed >= total) system.clearRun(id);
  }, every);
}

/** Where the player ends up after moving `length` blocks, or undefined if the way is blocked. */
function freeSpotAlong(dimension, from, direction, length) {
  let last;
  for (let travelled = 0.5; travelled <= length + 0.01; travelled += 0.5) {
    const spot = { x: from.x + direction.x * travelled, y: from.y + direction.y * travelled, z: from.z + direction.z * travelled };
    const feet = dimension.getBlock(spot);
    const head = dimension.getBlock({ ...spot, y: spot.y + 1 });
    const passable = (block) => block && (block.isAir || block.isLiquid);
    if (!passable(feet) || !passable(head)) break;
    last = spot;
  }
  return last;
}

// ---------------------------------------------------------------- comets

// Comets are simulated by the script (vanilla fireballs cannot be spawned by scripts):
// a burning point falls a little faster every tick and explodes on the first block or creature.
const COMET_MAX_TICKS = 80;

function launchComet(owner, start) {
  const dimension = owner.dimension;
  const position = { ...start };
  let speed = 0.4;
  repeat(COMET_MAX_TICKS, 1, () => {
    speed = Math.min(1.5, speed + 0.1);
    const steps = Math.ceil(speed / 0.5); // check every half block so fast comets do not skip blocks
    for (let i = 0; i < steps; i++) {
      position.y -= speed / steps;
      particle(dimension, "minecraft:basic_flame_particle", position);
      particle(dimension, "minecraft:lava_particle", position);
      const block = dimension.getBlock(position);
      if (!block) return false; // left the loaded world
      const hitCreature = dimension
        .getEntities({ location: position, maxDistance: 1.5 })
        .some((entity) => entity.id !== owner.id && entity.getComponent("minecraft:health"));
      if (!block.isAir || hitCreature) {
        cometImpact(owner, dimension, { ...position }, block.isAir ? block : block.above());
        return false;
      }
    }
    return true;
  });
}

function cometImpact(owner, dimension, location, lavaBlock) {
  if (owner.isValid) {
    protect(owner, "explosion", 40);
    protect(owner, "fire", 200);
  }
  // No "source": protect() already keeps the owner safe, and passing the player fails for some player types.
  dimension.createExplosion(location, 2, { breaksBlocks: true, causesFire: false });
  // Lava where the comet struck (the explosion may have cleared the spot).
  for (const block of [lavaBlock, dimension.getBlock(location), lavaBlock?.below()]) {
    if (block?.isValid && block.isAir) {
      block.setType("minecraft:lava");
      break;
    }
  }
}

// ---------------------------------------------------------------- attacks

const ATTACKS = {
  /** 30-block dash in any direction, no fall damage afterwards. */
  dash(player) {
    const view = player.getViewDirection(); // fixed at the start: the dash keeps its direction
    protect(player, "fall", 200);
    playSound(player, "wind_charge.burst");
    repeat(DASH_TICKS, 1, () => {
      if (!player.isValid) return false;
      const next = freeSpotAlong(player.dimension, player.location, view, DASH_STEP);
      if (!next) return false; // wall ahead: the dash ends here
      player.teleport(next, { keepVelocity: false, checkForBlocks: false });
      particle(player.dimension, "minecraft:wind_explosion_emitter", next);
      return true;
    });
    return true;
  },

  /** An expanding ring of particles; everything it passes takes 3 hearts of damage once. */
  ring(player) {
    const center = { ...player.location };
    const dimension = player.dimension;
    const hit = new Set();
    playSound(player, "mob.warden.sonic_boom");
    repeat(RING_MAX_RADIUS * 2, 1, (tick) => {
      const radius = tick / 2;
      const points = Math.max(8, Math.round(radius * 6));
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        particle(dimension, "minecraft:critical_hit_emitter", {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + 1,
          z: center.z + Math.sin(angle) * radius,
        });
      }
      if (!player.isValid) return true;
      for (const target of nearbyTargets(player, RING_MAX_RADIUS + 2)) {
        if (hit.has(target.id)) continue;
        const flat = horizontalDistance(target.location, center);
        if (flat > radius + 0.5 || Math.abs(target.location.y - center.y) > 3) continue;
        hit.add(target.id);
        target.applyDamage(RING_DAMAGE, { cause: EntityDamageCause.entityAttack, damagingEntity: player });
        pushAway(center, target, 0.6, 0.2);
      }
      return true;
    });
    return true;
  },

  /** 3 s invulnerable and slow; an explosion around you throws enemies away. */
  fortress(player) {
    player.addEffect("resistance", FORTRESS_TICKS, { amplifier: 4, showParticles: true });
    player.addEffect("slowness", FORTRESS_TICKS, { amplifier: 2, showParticles: true });
    protect(player, "explosion", FORTRESS_TICKS);
    protect(player, "fall", FORTRESS_TICKS);
    const center = { ...player.location };
    player.dimension.createExplosion(center, 4, { breaksBlocks: true, causesFire: false });
    for (const target of nearbyTargets(player, 6)) pushAway(center, target, 2.5, 0.6);
    return true;
  },

  /** 8 comets in a ring 10 blocks above you; each explodes and leaves lava. */
  comets(player) {
    const center = player.location;
    protect(player, "explosion", 200);
    protect(player, "fire", 300);
    for (let i = 0; i < COMET_COUNT; i++) {
      const angle = (i / COMET_COUNT) * Math.PI * 2;
      const spawn = {
        x: center.x + Math.cos(angle) * COMET_RING_RADIUS,
        y: center.y + COMET_HEIGHT,
        z: center.z + Math.sin(angle) * COMET_RING_RADIUS,
      };
      launchComet(player, spawn);
    }
    playSound(player, "mob.ghast.fireball");
    return true;
  },

  /** Pushes enemies away and keeps them out of a 5 s shield that feeds and heals you. */
  aegis(player) {
    for (const target of nearbyTargets(player, 6)) pushAway(player.location, target, 2.5, 0.5);
    playSound(player, "beacon.activate");
    repeat(AEGIS_TICKS, 5, (tick) => {
      if (!player.isValid) return false;
      const center = player.location;
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        for (const height of [0.2, 1.2, 2.2]) {
          const ring = AEGIS_RADIUS * Math.sin(Math.acos((height - 1.2) / AEGIS_RADIUS));
          particle(player.dimension, "minecraft:villager_happy", {
            x: center.x + Math.cos(angle) * ring,
            y: center.y + height,
            z: center.z + Math.sin(angle) * ring,
          });
        }
      }
      for (const target of nearbyTargets(player, AEGIS_RADIUS)) pushAway(center, target, 1.5, 0.3);
      if (tick % 20 === 0) {
        player.addEffect("saturation", 20, { amplifier: 0, showParticles: false });
        const hp = player.getComponent("minecraft:health");
        if (hp) hp.setCurrentValue(Math.min(hp.effectiveMax, hp.currentValue + 4)); // instant health I = 2 hearts
        particle(player.dimension, "minecraft:heart_particle", { ...player.location, y: player.location.y + 2 });
      }
      return true;
    });
    return true;
  },

  automace(player) {
    if (isInAutoMace(player)) return false;
    startAutoMace(player);
    return true;
  },
};

/** Called when a player right-clicks with a relic. */
export function useRelic(player, itemStack) {
  const key = relicKey(itemStack?.typeId);
  if (!key) return;
  const relic = relicConfig(key);
  if (!relic.enabled || relic.attack === "none") return;
  if (serialOf(itemStack) === undefined || serialOf(itemStack) !== registeredSerial(key)) {
    console.log(`[CraftedEffects] ${relic.name}: Seriennummer ${serialOf(itemStack)} passt nicht zu ${registeredSerial(key)}`);
    player.sendMessage("§7Dieses Relikt wird noch geprüft …");
    return;
  }

  if (relic.level < relic.maxLevel) {
    const missing = relic.maxLevel - relic.level;
    player.onScreenDisplay.setActionBar(
      `§7${relic.name}: Spezialangriff ab Level ${relic.maxLevel} – noch ${missing} ${missing === 1 ? "Diadem" : "Diademe"}`,
    );
    return;
  }

  const cooldownId = `${player.id}:${key}`;
  const readyAt = cooldowns.get(cooldownId) ?? 0;
  if (system.currentTick < readyAt) {
    const seconds = Math.ceil((readyAt - system.currentTick) / 20);
    player.onScreenDisplay.setActionBar(`§c${relic.name}: noch ${seconds} s Abklingzeit`);
    return;
  }

  const attack = ATTACKS[relic.attack];
  if (!attack) return;
  try {
    if (attack(player)) {
      cooldowns.set(cooldownId, system.currentTick + relic.cooldown * 20);
      player.onScreenDisplay.setActionBar(`§6${relic.name}: §e${relic.attack === "automace" ? "Auto-Mace!" : "Angriff!"}`);
    }
  } catch (error) {
    console.warn(`[CraftedEffects] Angriff ${relic.attack} fehlgeschlagen: ${error}`);
  }
}

/** Shows the remaining cooldown while the player holds a relic. */
export function showCooldown(player, heldItem) {
  const key = relicKey(heldItem?.typeId);
  if (!key) return;
  const readyAt = cooldowns.get(`${player.id}:${key}`) ?? 0;
  if (system.currentTick < readyAt) {
    const seconds = Math.ceil((readyAt - system.currentTick) / 20);
    player.onScreenDisplay.setActionBar(`§7${relicConfig(key).name}: §c${seconds} s`);
  }
}
