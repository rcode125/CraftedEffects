import { EntityDamageCause, system, world } from "@minecraft/server";
import { distance, lookedAtTarget, normalize } from "./targets.js";

// Auto-Mace phases:
//   rise  -> launched straight up (~20 blocks)
//   float -> slow falling at the top, waiting for the player to look at a target
//   dive  -> dashing towards the target; on contact a mace smash is dealt
const LAUNCH_STRENGTH = 2.1; // vertical knockback; 2.6 measured 31 blocks in GameTests, ~20 wanted
const LOOK_RANGE = 40;
const DIVE_STRENGTH = 1.8;
const HIT_RANGE = 3.2;
const MAX_TICKS = 260;
const MACE_ID = "minecraft:mace";

const states = new Map(); // player id -> state
const finishedAt = new Map(); // player id -> tick the Auto-Mace ended

export function isInAutoMace(player) {
  return states.has(player.id);
}

export function startAutoMace(player) {
  player.applyKnockback({ x: 0, z: 0 }, LAUNCH_STRENGTH);
  playSound(player, "wind_charge.burst");
  states.set(player.id, { phase: "rise", ticks: 0, apexY: player.location.y, target: undefined });
}

function playSound(player, sound) {
  try {
    player.dimension.playSound(sound, player.location);
  } catch {
    // Unknown sound id on this version - not important.
  }
}

function maceHotbarSlot(player) {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (!container) return -1;
  for (let slot = 0; slot < 9; slot++) {
    if (container.getItem(slot)?.typeId === MACE_ID) return slot;
  }
  return -1;
}

/** Vanilla mace smash: 6 base + 4/block (first 3) + 2/block (next 5) + 1/block after. */
export function smashDamage(fallDistance) {
  const fall = Math.max(0, fallDistance);
  const bonus = Math.min(fall, 3) * 4 + Math.min(Math.max(fall - 3, 0), 5) * 2 + Math.max(fall - 8, 0);
  return Math.round(6 + bonus);
}

/** Distance to the closest of the target's feet, middle and head (tall mobs, landing on top). */
function distanceToTarget(player, target) {
  const feet = target.location;
  const head = target.getHeadLocation();
  const middle = { x: feet.x, y: (feet.y + head.y) / 2, z: feet.z };
  return Math.min(distance(player.location, feet), distance(player.location, middle), distance(player.location, head));
}

function finish(player, reason, softLanding = true) {
  console.log(`[CraftedEffects] Auto-Mace Ende: ${reason}`);
  states.delete(player.id);
  finishedAt.set(player.id, system.currentTick);
  if (softLanding && player.isValid) {
    player.addEffect("slow_falling", 80, { amplifier: 0, showParticles: false });
  }
}

function smash(player, state) {
  const target = state.target;
  const fallDistance = state.apexY - target.location.y;
  const damage = smashDamage(fallDistance);
  // Some targets reject the maceSmash cause; fall back to a normal attack then.
  const hit =
    target.applyDamage(damage, { cause: EntityDamageCause.maceSmash, damagingEntity: player }) ||
    target.applyDamage(damage, { cause: EntityDamageCause.entityAttack, damagingEntity: player });
  console.log(`[CraftedEffects] Auto-Mace Smash: ${damage} Schaden, angekommen: ${hit}`);
  const away = normalize({ x: target.location.x - player.location.x, y: 0, z: target.location.z - player.location.z });
  target.applyKnockback({ x: away.x * 1.2, z: away.z * 1.2 }, 0.5);
  try {
    player.dimension.spawnParticle("minecraft:huge_explosion_emitter", target.location);
  } catch {
    // Particle not available - ignore.
  }
  playSound(player, "mace.heavy_smash_ground");
  player.applyKnockback({ x: 0, z: 0 }, 0.8); // bounce back up like a real mace hit
  player.sendMessage(`§6Auto-Mace: §c${damage} Schaden §7(${Math.round(fallDistance)} Blöcke Fallhöhe)`);
}

function tick(player, state) {
  state.ticks++;
  if (state.ticks > MAX_TICKS || !player.isValid) return finish(player, "Zeit abgelaufen");

  const velocity = player.getVelocity();
  state.apexY = Math.max(state.apexY, player.location.y);

  if (state.phase === "rise") {
    if (state.ticks > 4 && velocity.y <= 0.05) {
      state.phase = "float";
      player.addEffect("slow_falling", 200, { amplifier: 0, showParticles: false });
    }
    return;
  }

  if (state.phase === "float") {
    if (player.isOnGround) return finish(player, "gelandet ohne Ziel", false);
    const target = lookedAtTarget(player, LOOK_RANGE);
    if (!target) return;
    state.phase = "dive";
    state.target = target;
    player.removeEffect("slow_falling");
    const slot = maceHotbarSlot(player);
    state.hasMace = slot >= 0;
    if (state.hasMace) player.selectedSlotIndex = slot;
    playSound(player, "wind_charge.burst");
  }

  if (state.phase === "dive") {
    const target = state.target;
    if (!target?.isValid) return finish(player, "Ziel verschwunden");
    if (distanceToTarget(player, target) <= HIT_RANGE) {
      const maceHeld = state.hasMace && maceHotbarSlot(player) === player.selectedSlotIndex;
      if (maceHeld) smash(player, state);
      return finish(player, maceHeld ? "Treffer" : "am Ziel, keine Mace in der Hand");
    }
    if (player.isOnGround && state.ticks > 10) {
      return finish(player, `gelandet, ${distanceToTarget(player, target).toFixed(1)} Blöcke vom Ziel`);
    }
    const direction = normalize({
      x: target.location.x - player.location.x,
      y: target.location.y + 0.5 - player.location.y,
      z: target.location.z - player.location.z,
    });
    player.applyKnockback({ x: direction.x * DIVE_STRENGTH, z: direction.z * DIVE_STRENGTH }, direction.y * DIVE_STRENGTH);
  }
}

export function setupAutoMace() {
  system.runInterval(() => {
    for (const [playerId, state] of states) {
      const player = world.getEntity(playerId);
      if (!player) {
        states.delete(playerId);
        continue;
      }
      try {
        tick(player, state);
      } catch (error) {
        console.warn(`[CraftedEffects] Auto-Mace abgebrochen: ${error}`);
        states.delete(playerId);
      }
    }
  }, 1);

  // No fall damage while an Auto-Mace is running (or right after landing).
  world.beforeEvents.entityHurt.subscribe((event) => {
    if (event.hurtEntity?.typeId !== "minecraft:player") return;
    if (event.damageSource?.cause !== EntityDamageCause.fall) return;
    if (states.has(event.hurtEntity.id) || recentlyFinished(event.hurtEntity.id)) event.cancel = true;
  });
}

function recentlyFinished(playerId) {
  const tickFinished = finishedAt.get(playerId);
  return tickFinished !== undefined && system.currentTick - tickFinished < 100;
}
