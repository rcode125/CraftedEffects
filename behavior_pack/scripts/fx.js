import { system, world } from "@minecraft/server";

// Purely visual entities (netherite sword ring, shield dome). The script moves
// and removes them; leftovers (e.g. after a server restart) are cleaned up.

export const SWORD_FX = "craftedeffects:sword_fx";
export const SHIELD_DOME = "craftedeffects:shield_dome";
const FX_TYPES = [SWORD_FX, SHIELD_DOME];
const DIMENSIONS = ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"];

const alive = new Set(); // entity ids currently used by an attack

/** Spawns an effect entity; returns undefined if that is not possible (e.g. unloaded chunk). */
export function spawnFx(dimension, type, location, yaw = 0) {
  try {
    const entity = dimension.spawnEntity(type, location);
    entity.setRotation({ x: 0, y: yaw });
    alive.add(entity.id);
    return entity;
  } catch (error) {
    console.warn(`[CraftedEffects] Effekt ${type} konnte nicht erzeugt werden: ${error}`);
    return undefined;
  }
}

export function moveFx(entity, location, yaw) {
  if (!entity?.isValid) return;
  try {
    entity.teleport(location, yaw === undefined ? undefined : { rotation: { x: 0, y: yaw } });
  } catch {
    // Chunk not loaded - the cleanup removes it later.
  }
}

export function removeFx(entity) {
  if (!entity) return;
  alive.delete(entity.id);
  try {
    if (entity.isValid) entity.remove();
  } catch {
    // Already gone.
  }
}

export function isFxEntity(entity) {
  return FX_TYPES.includes(entity?.typeId);
}

export function setupFx() {
  system.runInterval(() => {
    for (const id of DIMENSIONS) {
      for (const type of FX_TYPES) {
        let entities = [];
        try {
          entities = world.getDimension(id).getEntities({ type });
        } catch {
          continue;
        }
        for (const entity of entities) {
          if (!alive.has(entity.id)) entity.remove();
        }
      }
    }
  }, 100);
}
