import { system, world } from "@minecraft/server";
import { DATA } from "./data.js";

// Stealing bottle (Ominous Bottle + Amethyst Shard). Drinking it gives the player a few minutes
// of Stealing (2-6 min, depending on the level of the Ominous Bottle). Killing a player with an
// effect during that time steals the effect (registry.js) and uses the Stealing up.
// The time only runs while the player is online and ends when the player dies.

const PROPERTY = "ce:stealing_ticks"; // remaining Stealing time in ticks
const STEP_TICKS = 20;
const MINUTES = DATA.stealing; // item id -> minutes

export const STEALING_IDS = Object.keys(MINUTES);

function ticksLeft(player) {
  const value = player.getDynamicProperty(PROPERTY);
  return typeof value === "number" ? value : 0;
}

export function hasStealing(player) {
  return ticksLeft(player) > 0;
}

export function endStealing(player) {
  player.setDynamicProperty(PROPERTY, undefined);
}

/** Called when a Stealing bottle has been drunk. */
export function drinkStealing(player, typeId) {
  const minutes = MINUTES[typeId];
  if (!minutes) return;
  // A new bottle never shortens a running Stealing.
  player.setDynamicProperty(PROPERTY, Math.max(ticksLeft(player), minutes * 60 * 20));
  player.onScreenDisplay.setActionBar(`§5Stealing aktiv: §d${minutes} min§5 – töte einen Spieler mit Effekt!`);
  try {
    player.dimension.playSound("mob.evocation_illager.prepare_attack", player.location);
  } catch {
    // Not important.
  }
}

export function setupStealing() {
  // Respawn after death: the Stealing is gone (like a potion effect).
  world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!initialSpawn && player.isValid) endStealing(player);
  });

  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      if (!player) continue;
      try {
        const left = ticksLeft(player);
        if (left <= 0) continue;
        const next = left - STEP_TICKS;
        if (next > 0) {
          player.setDynamicProperty(PROPERTY, next);
          try {
            player.dimension.spawnParticle("minecraft:witchspell_emitter", { ...player.location, y: player.location.y + 1 });
          } catch {
            // Not important.
          }
        } else {
          endStealing(player);
          player.onScreenDisplay.setActionBar("§7Dein Stealing ist abgelaufen.");
        }
      } catch {
        // Player not ready.
      }
    }
  }, STEP_TICKS);
}
