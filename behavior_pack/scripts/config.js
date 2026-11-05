import { world } from "@minecraft/server";
import { DATA } from "./data.js";

export const RELIC_COUNT = DATA.relics.length;
const CONFIG_KEY = "ce:config";
const ROMAN = ["", "I", "II", "III", "IV", "V"];

let cache;

function defaults() {
  return {
    pvp: true,
    relics: DATA.relics.map((relic) => ({ ...relic })),
  };
}

/** Current admin configuration, stored in the world so it survives restarts. */
export function getConfig() {
  if (cache) return cache;
  cache = defaults();
  try {
    const raw = world.getDynamicProperty(CONFIG_KEY);
    if (typeof raw === "string") {
      const saved = JSON.parse(raw);
      cache.pvp = saved.pvp !== false;
      saved.relics?.forEach((relic, index) => {
        if (index < RELIC_COUNT) Object.assign(cache.relics[index], relic);
      });
    }
  } catch (error) {
    console.warn(`[CraftedEffects] Konfiguration beschädigt, Standard wird genutzt: ${error}`);
  }
  return cache;
}

export function saveConfig() {
  world.setDynamicProperty(CONFIG_KEY, JSON.stringify(getConfig()));
}

export function resetConfig() {
  cache = defaults();
  saveConfig();
}

/** Relic number (1-12) for an item type id, or 0 if it is not a relic. */
export function relicNumber(typeId) {
  const match = /^craftedeffects:relic_(\d{2})$/.exec(typeId ?? "");
  const number = match ? Number(match[1]) : 0;
  return number >= 1 && number <= RELIC_COUNT ? number : 0;
}

export function relicTypeId(number) {
  return `craftedeffects:relic_${String(number).padStart(2, "0")}`;
}

export function relicConfig(number) {
  return getConfig().relics[number - 1];
}

export function effectLabel(relic) {
  if (relic.effect === "none") return DATA.effects.none;
  return `${DATA.effects[relic.effect] ?? relic.effect} ${ROMAN[relic.level] ?? relic.level}`;
}

export function attackLabel(relic) {
  const name = DATA.attacks[relic.attack]?.name ?? relic.attack;
  return relic.attack === "none" ? name : `${name} (${relic.cooldown} s)`;
}

/** Name and lore an existing relic item should show. */
export function relicDisplay(number) {
  const relic = relicConfig(number);
  return {
    nameTag: `§d${relic.name}`,
    lore: [
      `§7Effekt: §a${effectLabel(relic)}`,
      `§7Angriff: §c${attackLabel(relic)}`,
      relic.enabled ? "§8Einzigartig – nur einmal pro Welt" : "§4Deaktiviert",
    ],
  };
}
