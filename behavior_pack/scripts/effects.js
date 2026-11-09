import { amplifierFor, relicConfig } from "./config.js";

// Effects are given with a long duration and refreshed before they run low.
// Night vision flickers below 10 seconds, so we always stay above that.
const EFFECT_DURATION_TICKS = 400;
const REFRESH_BELOW_TICKS = 300;

const givenEffects = new Map(); // player id -> Set of effect ids we applied

/** Gives every effect of the active relics; removes ones no longer provided. */
export function applyRelicEffects(player, activeRelics) {
  const wanted = new Map(); // effect id -> highest amplifier
  for (const key of activeRelics) {
    const relic = relicConfig(key);
    if (relic.effect === "none") continue;
    const amplifier = amplifierFor(key);
    wanted.set(relic.effect, Math.max(wanted.get(relic.effect) ?? 0, amplifier));
  }

  for (const [effectId, amplifier] of wanted) {
    try {
      const current = player.getEffect(effectId);
      if (current && current.amplifier === amplifier && current.duration > REFRESH_BELOW_TICKS) continue;
      if (current && current.amplifier > amplifier) continue; // a stronger potion is active
      player.addEffect(effectId, EFFECT_DURATION_TICKS, { amplifier, showParticles: false });
    } catch (error) {
      console.warn(`[CraftedEffects] Effekt ${effectId} konnte nicht gesetzt werden: ${error}`);
    }
  }

  const previous = givenEffects.get(player.id) ?? new Set();
  for (const effectId of previous) {
    if (wanted.has(effectId)) continue;
    try {
      const current = player.getEffect(effectId);
      // Only remove it if it still looks like ours (not a potion drunk later).
      if (current && current.duration <= EFFECT_DURATION_TICKS) player.removeEffect(effectId);
    } catch {
      // Player not ready (e.g. dead); nothing to clean up.
    }
  }
  givenEffects.set(player.id, new Set(wanted.keys()));
}

export function forgetPlayer(playerId) {
  givenEffects.delete(playerId);
}
