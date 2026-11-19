import { EntityDamageCause, system, world } from "@minecraft/server";
import { relicConfig, relicKey } from "./config.js";
import { registeredSerial, serialOf } from "./registry.js";
import { isInAutoMace, startAutoMace } from "./automace.js";
import { SHIELD_DOME, SWORD_FX, moveFx, removeFx, spawnFx } from "./fx.js";
import { protect } from "./protection.js";
import { distance, isValidTarget, lookedAtOrNearest, nearbyTargets, normalize } from "./targets.js";

const cooldowns = new Map(); // "playerId:relicKey" -> tick when ready again

// Tuning values.
// Dash like a riptide trident: one strong push in the view direction. Vertical 2.55 was
// measured in GameTests as ~30 blocks; horizontally air drag gives roughly 11x the start speed.
const DASH_HORIZONTAL = 2.7;
const DASH_VERTICAL = 2.55;
const DASH_LIFT = 0.25; // a little lift so a flat dash does not scrape along the ground
const RING_MAX_RADIUS = 10;
const RING_DAMAGE = 6; // 3 hearts; "magic" ignores armour, so it is 3 hearts even through full netherite
const RING_SWORDS = 12;
const FORTRESS_TICKS = 60; // 3 seconds
const FORTRESS_POWER = 6; // end crystal
const FORTRESS_HARD_RADIUS = 4;
const HARD_BLOCKS = new Set(["minecraft:bedrock", "minecraft:obsidian", "minecraft:crying_obsidian"]);
const COMET_COUNT = 8;
const COMET_RING_RADIUS = 6;
const COMET_HEIGHT = 10;
const COMET_POWER = 4;
const AEGIS_RADIUS = 3.5;
const AEGIS_TICKS = 100; // 5 seconds
const AEGIS_CONTACT_DAMAGE = 2;
const AEGIS_HIT_DAMAGE = 4;
const AEGIS_FINAL_RADIUS = 10;
const AEGIS_FINAL_PUSH = 4.5; // about 20 blocks
const BUBBLE_TICKS = 200; // 10 seconds
const BUBBLE_DAMAGE = 2; // 1 heart per second
const BUBBLE_REACH = 13; // normal reach + 10
const BUBBLE_REACH_DAMAGE = 4;

const shields = new Map(); // player id -> tick when the shield ends
const bubbles = new Map(); // trapped entity id -> { ownerId, until }

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
  dimension.createExplosion(location, COMET_POWER, { breaksBlocks: true, causesFire: false });
  // Lava where the comet struck (the explosion may have cleared the spot). The setblock
  // command places a real source block with a block update, so the lava flows.
  for (const block of [lavaBlock, dimension.getBlock(location), lavaBlock?.below()]) {
    if (block?.isValid && block.isAir) {
      const { x, y, z } = block.location;
      try {
        dimension.runCommand(`setblock ${x} ${y} ${z} lava`);
      } catch {
        block.setType("minecraft:lava");
      }
      break;
    }
  }
}

/** Obsidian and bedrock survive explosions; the fortress removes them as well (even the world floor). */
function breakHardBlocks(dimension, center, radius) {
  const r = Math.ceil(radius);
  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dz = -r; dz <= r; dz++) {
        if (dx * dx + dy * dy + dz * dz > radius * radius) continue;
        const location = { x: Math.floor(center.x) + dx, y: Math.floor(center.y) + dy, z: Math.floor(center.z) + dz };
        if (location.y < dimension.heightRange.min || location.y >= dimension.heightRange.max) continue;
        const block = dimension.getBlock(location);
        if (block && HARD_BLOCKS.has(block.typeId)) block.setType("minecraft:air");
      }
    }
  }
}

function bubbleParticles(dimension, center, tick) {
  const points = 14;
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * Math.PI * 2 + tick * 0.1;
    for (const phi of [0.5, 1.2, 1.9, 2.6]) {
      particle(dimension, "minecraft:basic_bubble_particle", {
        x: center.x + Math.cos(theta) * Math.sin(phi) * 1.3,
        y: center.y + 0.9 + Math.cos(phi) * 1.3,
        z: center.z + Math.sin(theta) * Math.sin(phi) * 1.3,
      });
    }
  }
}

// ---------------------------------------------------------------- attacks

const ATTACKS = {
  /** 30-block dash in any direction, like a riptide trident (no particles, no sound). No fall damage afterwards. */
  dash(player) {
    const view = player.getViewDirection();
    protect(player, "fall", 200);
    const flat = Math.hypot(view.x, view.z);
    const vertical = view.y * DASH_VERTICAL + (Math.abs(view.y) < 0.5 ? DASH_LIFT : 0);
    player.applyKnockback({ x: view.x * DASH_HORIZONTAL, z: view.z * DASH_HORIZONTAL }, vertical);
    // Riptide keeps pushing while the trident spins: keep the speed for the first ticks.
    repeat(4, 1, () => {
      if (!player.isValid || flat < 0.05) return false;
      player.applyKnockback({ x: view.x * DASH_HORIZONTAL, z: view.z * DASH_HORIZONTAL }, player.getVelocity().y);
      return true;
    });
    return true;
  },

  /** A ring of netherite swords flies outward; everything it passes takes 3 hearts of damage once. */
  ring(player) {
    const center = { ...player.location };
    const dimension = player.dimension;
    const hit = new Set();
    const swords = [];
    for (let i = 0; i < RING_SWORDS; i++) {
      const angle = (i / RING_SWORDS) * Math.PI * 2;
      const yaw = (angle * 180) / Math.PI - 90; // facing outward (yaw 0 = +z, 90 = -x)
      swords.push({ angle, yaw, entity: spawnFx(dimension, SWORD_FX, { x: center.x, y: center.y + 0.6, z: center.z }, yaw) });
    }
    playSound(player, "mob.warden.sonic_boom");
    repeat(RING_MAX_RADIUS * 2, 1, (tick) => {
      const radius = tick / 2;
      for (const sword of swords) {
        moveFx(sword.entity, {
          x: center.x + Math.cos(sword.angle) * radius,
          y: center.y + 0.6,
          z: center.z + Math.sin(sword.angle) * radius,
        }, sword.yaw);
      }
      if (tick >= RING_MAX_RADIUS * 2) for (const sword of swords) removeFx(sword.entity);
      if (!player.isValid) return true;
      for (const target of nearbyTargets(player, RING_MAX_RADIUS + 2)) {
        if (hit.has(target.id)) continue;
        const flat = horizontalDistance(target.location, center);
        if (flat > radius + 0.5 || Math.abs(target.location.y - center.y) > 3) continue;
        hit.add(target.id);
        target.applyDamage(RING_DAMAGE, { cause: EntityDamageCause.magic, damagingEntity: player });
        pushAway(center, target, 0.6, 0.2);
      }
      return true;
    });
    system.runTimeout(() => swords.forEach((sword) => removeFx(sword.entity)), RING_MAX_RADIUS * 2 + 5);
    return true;
  },

  /** 3 s invulnerable and slow; an explosion around you throws enemies away. */
  fortress(player) {
    player.addEffect("resistance", FORTRESS_TICKS, { amplifier: 4, showParticles: true });
    player.addEffect("slowness", FORTRESS_TICKS, { amplifier: 2, showParticles: true });
    protect(player, "explosion", FORTRESS_TICKS);
    protect(player, "fall", FORTRESS_TICKS);
    const center = { ...player.location };
    player.dimension.createExplosion(center, FORTRESS_POWER, { breaksBlocks: true, causesFire: false });
    breakHardBlocks(player.dimension, center, FORTRESS_HARD_RADIUS);
    for (const target of nearbyTargets(player, 7)) pushAway(center, target, 2.5, 0.6);
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

  /** A dome of shields for 5 s: you float, regenerate and heal; enemies are thrown back and hurt. */
  aegis(player) {
    const dimension = player.dimension;
    for (const target of nearbyTargets(player, 6)) {
      target.applyDamage(AEGIS_CONTACT_DAMAGE, { cause: EntityDamageCause.entityAttack, damagingEntity: player });
      pushAway(player.location, target, 3.5, 0.6);
    }
    playSound(player, "beacon.activate");
    player.addEffect("regeneration", AEGIS_TICKS, { amplifier: 2, showParticles: true }); // 3x regeneration
    player.addEffect("levitation", 15, { amplifier: 0, showParticles: false });
    player.addEffect("slow_falling", AEGIS_TICKS, { amplifier: 0, showParticles: false });
    protect(player, "fall", AEGIS_TICKS + 60);
    shields.set(player.id, system.currentTick + AEGIS_TICKS);
    const dome = spawnFx(dimension, SHIELD_DOME, player.location);
    const lastContact = new Map(); // target id -> tick
    repeat(AEGIS_TICKS, 1, (tick) => {
      if (!player.isValid) {
        removeFx(dome);
        return false;
      }
      const center = player.location;
      moveFx(dome, center);
      if (tick % 5 === 0) {
        for (const target of nearbyTargets(player, AEGIS_RADIUS)) {
          pushAway(center, target, 2.5, 0.4);
          if ((lastContact.get(target.id) ?? -99) + 10 <= tick) {
            lastContact.set(target.id, tick);
            target.applyDamage(AEGIS_CONTACT_DAMAGE, { cause: EntityDamageCause.entityAttack, damagingEntity: player });
          }
        }
      }
      if (tick % 20 === 0) {
        player.addEffect("saturation", 20, { amplifier: 0, showParticles: false });
        const hp = player.getComponent("minecraft:health");
        if (hp) hp.setCurrentValue(Math.min(hp.effectiveMax, hp.currentValue + 4)); // instant health I = 2 hearts
        particle(dimension, "minecraft:heart_particle", { ...center, y: center.y + 2 });
      }
      if (tick >= AEGIS_TICKS) {
        // The shield breaks: everyone around is thrown about 20 blocks away.
        removeFx(dome);
        shields.delete(player.id);
        playSound(player, "random.break");
        particle(dimension, "minecraft:huge_explosion_emitter", { ...center, y: center.y + 1 });
        for (const target of nearbyTargets(player, AEGIS_FINAL_RADIUS)) pushAway(center, target, AEGIS_FINAL_PUSH, 0.7);
      }
      return true;
    });
    return true;
  },

  /** Traps the target in a water bubble for 10 s: constant damage, no escape, no hitting, no eating. */
  bubble(player) {
    const target = lookedAtOrNearest(player, 20, 10);
    if (!target) {
      player.onScreenDisplay.setActionBar("§7Kein Ziel für die Wasserblase in der Nähe.");
      return false;
    }
    const dimension = target.dimension;
    const center = { ...target.location };
    const trap = { ownerId: player.id, until: system.currentTick + BUBBLE_TICKS };
    bubbles.set(target.id, trap);
    playSound(player, "bucket.empty_water", center);
    repeat(BUBBLE_TICKS, 1, (tick) => {
      if (!target.isValid || bubbles.get(target.id) !== trap) return false;
      try {
        target.teleport(center, { rotation: target.getRotation(), keepVelocity: false });
      } catch {
        // Chunk not loaded - keep trying.
      }
      if (tick % 20 === 0) {
        target.applyDamage(BUBBLE_DAMAGE, { cause: EntityDamageCause.drowning, damagingEntity: player.isValid ? player : undefined });
        playSound(player, "bubble.pop", center);
      }
      if (tick % 4 === 0) bubbleParticles(dimension, center, tick);
      if (tick >= BUBBLE_TICKS) {
        bubbles.delete(target.id);
        playSound(player, "bubble.pop", center);
      }
      return true;
    });
    system.runTimeout(() => {
      if (bubbles.get(target.id) === trap) bubbles.delete(target.id);
    }, BUBBLE_TICKS + 5);
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
    player.onScreenDisplay.setActionBar("§7Dieser Effekt wird noch geprüft …");
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
  const seconds = attackCooldownLeft(player, key);
  if (seconds > 0) {
    player.onScreenDisplay.setActionBar(`§c${relic.name}: Angriff noch ${seconds} s Abklingzeit`);
    return;
  }

  const attack = ATTACKS[relic.attack];
  if (!attack) return;
  try {
    if (attack(player)) {
      if (relic.cooldown > 0) cooldowns.set(cooldownId, system.currentTick + relic.cooldown * 20);
      player.onScreenDisplay.setActionBar(`§6${relic.name}: §e${relic.attack === "automace" ? "Auto-Mace!" : "Angriff!"}`);
    }
  } catch (error) {
    console.warn(`[CraftedEffects] Angriff ${relic.attack} fehlgeschlagen: ${error}`);
  }
}

/** Seconds until the special attack of this relic is ready again (0 = ready). */
export function attackCooldownLeft(player, key) {
  const readyAt = cooldowns.get(`${player.id}:${key}`) ?? 0;
  return Math.max(0, Math.ceil((readyAt - system.currentTick) / 20));
}

/** Shield hits and bubble rules: runs inside entityHurt / itemUse / swing events. */
export function setupAttacks() {
  // Chat message as soon as a special attack cooldown is over.
  system.runInterval(() => {
    const now = system.currentTick;
    for (const [id, readyAt] of cooldowns) {
      if (readyAt > now) continue;
      cooldowns.delete(id);
      const [playerId, key] = id.split(":");
      const player = world.getEntity(playerId);
      try {
        if (player?.isValid) player.sendMessage(`§6${relicConfig(key).name}: Spezialangriff ist wieder bereit.`);
      } catch {
        // Player left or not ready.
      }
    }
  }, 10);

  world.beforeEvents.entityHurt.subscribe((event) => {
    const attacker = event.damageSource?.damagingEntity;
    const hurt = event.hurtEntity;
    // A trapped enemy cannot hit anyone.
    if (attacker && bubbles.has(attacker.id)) {
      event.cancel = true;
      return;
    }
    // Hitting the shield hurts the attacker instead and throws him back.
    const shieldEnd = hurt && shields.get(hurt.id);
    if (shieldEnd && system.currentTick <= shieldEnd && attacker && attacker.id !== hurt.id) {
      event.cancel = true;
      system.run(() => {
        if (!attacker.isValid || !hurt.isValid || !isValidTarget(hurt, attacker)) return;
        attacker.applyDamage(AEGIS_HIT_DAMAGE, { cause: EntityDamageCause.thorns, damagingEntity: hurt });
        pushAway(hurt.location, attacker, 3, 0.5);
      });
    }
  });

  // A trapped enemy cannot eat (or drink).
  world.beforeEvents.itemUse.subscribe((event) => {
    if (!bubbles.has(event.source?.id)) return;
    const item = event.itemStack;
    if (item?.getComponent("minecraft:food") || item?.typeId === "minecraft:potion") event.cancel = true;
  });

  // 10 blocks more reach on the bubble.
  const lastReachHit = new Map();
  world.afterEvents.playerSwingStart.subscribe(({ player }) => {
    if (bubbles.size === 0) return;
    if ((lastReachHit.get(player.id) ?? -99) + 10 > system.currentTick) return;
    const hits = player.getEntitiesFromViewDirection({ maxDistance: BUBBLE_REACH });
    const trapped = hits.map((hit) => hit.entity).find((entity) => bubbles.get(entity.id)?.ownerId === player.id);
    if (!trapped || distance(trapped.location, player.location) <= 3.5) return; // close hits are normal melee
    lastReachHit.set(player.id, system.currentTick);
    system.run(() => {
      if (trapped.isValid) trapped.applyDamage(BUBBLE_REACH_DAMAGE, { cause: EntityDamageCause.entityAttack, damagingEntity: player });
    });
  });
}
