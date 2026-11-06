import { getConfig } from "./config.js";

// Entities that should never be hit by relic attacks.
const IGNORED_TYPES = new Set([
  "minecraft:item",
  "minecraft:xp_orb",
  "minecraft:arrow",
  "minecraft:small_fireball",
  "minecraft:fireball",
  "minecraft:lightning_bolt",
  "minecraft:armor_stand",
  "minecraft:painting",
  "minecraft:leash_knot",
  "minecraft:npc",
  "minecraft:ender_crystal",
]);

/** True if the attacker may damage this entity (living, not self, PvP rules). */
export function isValidTarget(attacker, entity) {
  if (!entity?.isValid || entity.id === attacker.id) return false;
  if (IGNORED_TYPES.has(entity.typeId)) return false;
  if (!entity.getComponent("minecraft:health")) return false;
  if (entity.typeId === "minecraft:player") {
    if (!getConfig().pvp) return false;
    const mode = entity.getGameMode?.();
    if (mode === "Creative" || mode === "Spectator") return false;
  }
  if (entity.getComponent("minecraft:tameable")?.tamedToPlayerId === attacker.id) return false;
  return true;
}

export function nearbyTargets(attacker, radius) {
  return attacker.dimension
    .getEntities({ location: attacker.location, maxDistance: radius })
    .filter((entity) => isValidTarget(attacker, entity));
}

/** First valid target the player is looking at, within maxDistance blocks. */
export function lookedAtTarget(player, maxDistance) {
  const hits = player.getEntitiesFromViewDirection({ maxDistance });
  return hits.map((hit) => hit.entity).find((entity) => isValidTarget(player, entity));
}

export function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
