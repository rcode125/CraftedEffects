import { world } from "@minecraft/server";
import { DATA } from "./data.js";

export const RELIC_KEYS = DATA.relicKeys;
const CONFIG_KEY = "ce:config";

let cache;

function defaults() {
  const relics = {};
  for (const key of RELIC_KEYS) relics[key] = { ...DATA.relics[key] };
  return { version: DATA.version, pvp: true, relics };
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
      if (saved.version === DATA.version) {
        for (const key of RELIC_KEYS) Object.assign(cache.relics[key], saved.relics?.[key] ?? {});
      } else if (saved.version === 5) {
        // Version 5 only had other relic names ("Relikt des Windes", ...): keep every setting, take the new names.
        for (const key of RELIC_KEYS) Object.assign(cache.relics[key], saved.relics?.[key] ?? {}, { name: DATA.relics[key].name });
      } else {
        // Older add-on version: new defaults, but relics keep their level (within the new maximum).
        for (const key of RELIC_KEYS) {
          const level = saved.relics?.[key]?.level;
          if (typeof level === "number") cache.relics[key].level = Math.max(1, Math.min(cache.relics[key].maxLevel, level));
        }
      }
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

/** Relic key ("speed", ...) for an item type id, or undefined if it is not a relic. */
export function relicKey(typeId) {
  const match = /^craftedeffects:relic_([a-z]+)$/.exec(typeId ?? "");
  return match && RELIC_KEYS.includes(match[1]) ? match[1] : undefined;
}

export function relicTypeId(key) {
  return `craftedeffects:relic_${key}`;
}

export function isRelicKey(key) {
  return RELIC_KEYS.includes(key);
}

export function relicConfig(key) {
  return getConfig().relics[key];
}

export function setLevel(key, level) {
  const relic = relicConfig(key);
  relic.level = Math.max(1, Math.min(relic.maxLevel, Math.round(level)));
  saveConfig();
  return relic.level;
}

const ROMAN = [
  { value: 10, letter: "X" },
  { value: 9, letter: "IX" },
  { value: 5, letter: "V" },
  { value: 4, letter: "IV" },
  { value: 1, letter: "I" },
];

/** Effect amplifier of a relic at its current level (health boost has its own steps). */
export function amplifierFor(key) {
  const relic = relicConfig(key);
  const steps = DATA.relics[key].amplifiers;
  if (steps && relic.effect === DATA.relics[key].effect) return steps[Math.min(steps.length, relic.level) - 1];
  return Math.max(0, Math.min(254, relic.level - 1));
}

export function roman(number) {
  let rest = number;
  let out = "";
  for (const { value, letter } of ROMAN) {
    while (rest >= value) {
      out += letter;
      rest -= value;
    }
  }
  return out;
}

export function effectLabel(relic, key) {
  if (relic.effect === "none") return DATA.effects.none;
  const name = DATA.effects[relic.effect] ?? relic.effect;
  if (relic.effect === "health_boost" && key) return `${name} (${10 + 2 * (amplifierFor(key) + 1)} Herzen)`;
  return `${name} ${roman(relic.level)}`;
}

export function attackLabel(relic) {
  const name = DATA.attacks[relic.attack] ?? relic.attack;
  return relic.attack === "none" ? name : `${name} (${relic.cooldown} s)`;
}

/** Name and lore an existing relic item should show. */
export function relicDisplay(key) {
  const relic = relicConfig(key);
  return {
    nameTag: `§d${relic.name}`,
    lore: [
      `§7Effekt: §a${effectLabel(relic, key)}`,
      `§7Level: §e${relic.level}/${relic.maxLevel}`,
      relic.level >= relic.maxLevel
        ? `§7Angriff: §c${attackLabel(relic)}`
        : `§7Angriff: §8${attackLabel(relic)} – ab Level ${relic.maxLevel}`,
      relic.enabled ? "§8Einzigartig – nur einmal pro Welt" : "§4Deaktiviert",
    ],
  };
}
