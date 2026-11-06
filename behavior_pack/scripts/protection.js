import { EntityDamageCause, system, world } from "@minecraft/server";

// Relic attacks must never hurt the player who used them: no fall damage after
// a dash or Auto-Mace, no damage from one's own explosions, comets and lava.

const FALL = new Set([EntityDamageCause.fall]);
const EXPLOSION = new Set([EntityDamageCause.entityExplosion, EntityDamageCause.blockExplosion]);
const FIRE = new Set([EntityDamageCause.lava, EntityDamageCause.fire, EntityDamageCause.fireTick, EntityDamageCause.magma]);

const shields = new Map(); // player id -> { fall, explosion, fire } = tick until which it applies

/** Protects a player from one kind of damage ("fall", "explosion", "fire") for some ticks. */
export function protect(player, kind, ticks) {
  const entry = shields.get(player.id) ?? {};
  entry[kind] = Math.max(entry[kind] ?? 0, system.currentTick + ticks);
  shields.set(player.id, entry);
}

function isProtected(playerId, kind) {
  const until = shields.get(playerId)?.[kind];
  return until !== undefined && system.currentTick <= until;
}

export function setupProtection() {
  world.beforeEvents.entityHurt.subscribe((event) => {
    const hurt = event.hurtEntity;
    if (hurt?.typeId !== "minecraft:player") return;
    const cause = event.damageSource?.cause;
    if (FALL.has(cause) && isProtected(hurt.id, "fall")) event.cancel = true;
    else if (EXPLOSION.has(cause) && isProtected(hurt.id, "explosion")) event.cancel = true;
    else if (FIRE.has(cause) && isProtected(hurt.id, "fire")) event.cancel = true;
  });

  // Forget expired entries now and then.
  system.runInterval(() => {
    for (const [playerId, entry] of shields) {
      if (Object.values(entry).every((until) => until < system.currentTick)) shields.delete(playerId);
    }
  }, 200);
}
