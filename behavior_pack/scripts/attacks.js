import { EntityDamageCause, system } from "@minecraft/server";
import { relicConfig, relicNumber } from "./config.js";
import { registeredSerial, serialOf } from "./registry.js";
import { isInAutoMace, startAutoMace } from "./automace.js";
import { nearbyTargets, normalize } from "./targets.js";

const cooldowns = new Map(); // "playerId:relic" -> tick when ready again

function playSound(player, sound) {
  try {
    player.dimension.playSound(sound, player.location);
  } catch {
    // Sound not available on this version - not important.
  }
}

function particle(player, name, location) {
  try {
    player.dimension.spawnParticle(name, location);
  } catch {
    // Particle not available - not important.
  }
}

const ATTACKS = {
  fireball(player) {
    const view = player.getViewDirection();
    const head = player.getHeadLocation();
    const right = normalize({ x: -view.z, y: 0, z: view.x });
    for (const offset of [-0.15, 0, 0.15]) {
      const direction = normalize({ x: view.x + right.x * offset, y: view.y, z: view.z + right.z * offset });
      const spawn = { x: head.x + direction.x * 1.5, y: head.y + direction.y * 1.5, z: head.z + direction.z * 1.5 };
      const fireball = player.dimension.spawnEntity("minecraft:small_fireball", spawn);
      const projectile = fireball.getComponent("minecraft:projectile");
      if (projectile) {
        projectile.owner = player;
        projectile.shoot({ x: direction.x * 1.6, y: direction.y * 1.6, z: direction.z * 1.6 });
      }
    }
    playSound(player, "mob.blaze.shoot");
    return true;
  },

  lightning(player) {
    const entityHit = player.getEntitiesFromViewDirection({ maxDistance: 48 })[0];
    const blockHit = player.getBlockFromViewDirection({ maxDistance: 48 });
    const location = entityHit?.entity.location ?? blockHit?.block.location;
    if (!location) {
      player.sendMessage("§7Kein Ziel in Reichweite (48 Blöcke).");
      return false;
    }
    player.dimension.spawnEntity("minecraft:lightning_bolt", location);
    return true;
  },

  shockwave(player) {
    for (const target of nearbyTargets(player, 6)) {
      const away = normalize({ x: target.location.x - player.location.x, y: 0, z: target.location.z - player.location.z });
      target.applyDamage(8, { cause: EntityDamageCause.entityAttack, damagingEntity: player });
      target.applyKnockback({ x: away.x * 2.5, z: away.z * 2.5 }, 0.6);
    }
    particle(player, "minecraft:huge_explosion_emitter", player.location);
    playSound(player, "random.explode");
    return true;
  },

  dash(player) {
    const view = normalize({ ...player.getViewDirection(), y: 0 });
    player.applyKnockback({ x: view.x * 3, z: view.z * 3 }, 0.35);
    playSound(player, "wind_charge.burst");
    return true;
  },

  teleport(player) {
    const view = player.getViewDirection();
    const start = player.location;
    let destination;
    for (let step = 1; step <= 16; step++) {
      const point = { x: start.x + view.x * step, y: start.y + view.y * step, z: start.z + view.z * step };
      const feet = player.dimension.getBlock(point);
      const head = player.dimension.getBlock({ ...point, y: point.y + 1 });
      if (!feet || !head || !(feet.isAir || feet.isLiquid) || !(head.isAir || head.isLiquid)) break;
      destination = point;
    }
    if (!destination || !player.tryTeleport(destination, { checkForBlocks: true, keepVelocity: false })) {
      player.sendMessage("§7Kein freier Platz zum Teleportieren.");
      return false;
    }
    playSound(player, "mob.endermen.portal");
    return true;
  },

  heal(player) {
    const players = player.dimension.getPlayers({ location: player.location, maxDistance: 8 });
    for (const friend of players.filter(Boolean)) {
      friend.addEffect("instant_health", 1, { amplifier: 1, showParticles: true });
      friend.addEffect("regeneration", 100, { amplifier: 1, showParticles: true });
    }
    playSound(player, "random.levelup");
    return true;
  },

  shield(player) {
    player.addEffect("resistance", 160, { amplifier: 2, showParticles: true });
    player.addEffect("absorption", 160, { amplifier: 1, showParticles: true });
    playSound(player, "item.shield.block");
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
  const number = relicNumber(itemStack?.typeId);
  if (!number) return;
  const relic = relicConfig(number);
  if (!relic.enabled || relic.attack === "none") return;
  if (serialOf(itemStack) === undefined || serialOf(itemStack) !== registeredSerial(number)) {
    player.sendMessage("§7Dieses Relikt wird noch geprüft …");
    return;
  }

  const key = `${player.id}:${number}`;
  const readyAt = cooldowns.get(key) ?? 0;
  if (system.currentTick < readyAt) {
    const seconds = Math.ceil((readyAt - system.currentTick) / 20);
    player.onScreenDisplay.setActionBar(`§c${relic.name}: noch ${seconds} s Abklingzeit`);
    return;
  }

  const attack = ATTACKS[relic.attack];
  if (!attack) return;
  try {
    if (attack(player)) {
      cooldowns.set(key, system.currentTick + relic.cooldown * 20);
      player.onScreenDisplay.setActionBar(`§6${relic.name}: §e${relic.attack === "automace" ? "Auto-Mace!" : "Angriff!"}`);
    }
  } catch (error) {
    console.warn(`[CraftedEffects] Angriff ${relic.attack} fehlgeschlagen: ${error}`);
  }
}

/** Shows the remaining cooldown while the player holds a relic. */
export function showCooldown(player, heldItem) {
  const number = relicNumber(heldItem?.typeId);
  if (!number) return;
  const readyAt = cooldowns.get(`${player.id}:${number}`) ?? 0;
  if (system.currentTick < readyAt) {
    const seconds = Math.ceil((readyAt - system.currentTick) / 20);
    player.onScreenDisplay.setActionBar(`§7${relicConfig(number).name}: §c${seconds} s`);
  }
}
