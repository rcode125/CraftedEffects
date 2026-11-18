import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, ItemStack, system, world } from "@minecraft/server";
import { DATA } from "./data.js";
import {
  RELIC_KEYS, attackLabel, boostLabel, effectLabel, getConfig, isRelicKey, relicConfig, resetConfig, saveConfig, setLevel,
} from "./config.js";
import { STEALING_ID, freeRelic, isRelicFree, newRelicItem, relicStatus } from "./registry.js";

const RELIC_ENUM = "ce:relic";
const EFFECT_ENUM = "ce:effecttype";
const ATTACK_ENUM = "ce:attacktype";

const ok = (message) => ({ status: CustomCommandStatus.Success, message });
const fail = (message) => ({ status: CustomCommandStatus.Failure, message });
const unknownRelic = () => fail(`Unbekannter Effekt. Möglich: ${RELIC_KEYS.join(", ")}`);

const RELIC_PARAM = { name: RELIC_ENUM, type: CustomCommandParamType.Enum };

// Command callbacks may not change the world directly, so changes run one tick later.
function later(action) {
  system.run(() => {
    try {
      action();
    } catch (error) {
      console.warn(`[CraftedEffects] Befehl fehlgeschlagen: ${error}`);
    }
  });
}

function update(key, changes, message) {
  if (!isRelicKey(key)) return unknownRelic();
  later(() => {
    Object.assign(relicConfig(key), changes);
    saveConfig();
  });
  return ok(message);
}

function checkLevel(key, level) {
  const max = relicConfig(key).maxLevel;
  return level >= 1 && level <= max ? undefined : fail(`Level muss zwischen 1 und ${max} liegen.`);
}

const COMMANDS = [
  {
    name: "ce:list",
    description: "Zeigt alle CraftedEffects-Effekte",
    run(_origin) {
      const lines = RELIC_KEYS.map((key) => {
        const relic = relicConfig(key);
        const state = relic.enabled ? relicStatus(key) : "deaktiviert";
        const effect = relic.effectOn === false ? `§8${effectLabel(relic, key)} (aus)` : `§a${effectLabel(relic, key)}`;
        return `§e${key}§r ${relic.name}: ${effect}§r (Level ${relic.level}/${relic.maxLevel}), §c${attackLabel(relic)}§r, §bBoost ${boostLabel(relic)}§r – §7${state}`;
      });
      lines.push(`§7PvP: ${getConfig().pvp ? "an" : "aus"}`);
      return ok(lines.join("\n"));
    },
  },
  {
    name: "ce:level",
    description: "Setzt das Level eines Effekts",
    mandatoryParameters: [RELIC_PARAM, { name: "level", type: CustomCommandParamType.Integer }],
    run(_origin, key, level) {
      if (!isRelicKey(key)) return unknownRelic();
      const invalid = checkLevel(key, level);
      if (invalid) return invalid;
      later(() => setLevel(key, level));
      return ok(`${relicConfig(key).name}: Level ist jetzt ${level}.`);
    },
  },
  {
    name: "ce:effect",
    description: "Setzt die Dauerwirkung eines Effekts",
    mandatoryParameters: [
      RELIC_PARAM,
      { name: EFFECT_ENUM, type: CustomCommandParamType.Enum },
      { name: "level", type: CustomCommandParamType.Integer },
    ],
    run(_origin, key, effect, level) {
      if (!isRelicKey(key)) return unknownRelic();
      const invalid = checkLevel(key, level);
      if (invalid) return invalid;
      return update(key, { effect, level }, `${relicConfig(key).name}: Dauerwirkung ist jetzt ${DATA.effects[effect]} ${level}.`);
    },
  },
  {
    name: "ce:attack",
    description: "Setzt den Spezialangriff eines Effekts",
    mandatoryParameters: [RELIC_PARAM, { name: ATTACK_ENUM, type: CustomCommandParamType.Enum }],
    optionalParameters: [{ name: "abklingzeit", type: CustomCommandParamType.Integer }],
    run(_origin, key, attack, cooldown) {
      if (!isRelicKey(key)) return unknownRelic();
      const seconds = cooldown ?? relicConfig(key).cooldown;
      if (seconds < 0 || seconds > 3600) return fail("Abklingzeit muss zwischen 0 und 3600 Sekunden liegen.");
      return update(key, { attack, cooldown: seconds }, `${relicConfig(key).name}: Angriff ist jetzt ${DATA.attacks[attack]} (${seconds} s).`);
    },
  },
  {
    name: "ce:boost",
    description: "Setzt Dauer und Abklingzeit des Boost-Ups eines Effekts",
    mandatoryParameters: [
      RELIC_PARAM,
      { name: "dauer", type: CustomCommandParamType.Integer },
      { name: "abklingzeit", type: CustomCommandParamType.Integer },
    ],
    run(_origin, key, duration, cooldown) {
      if (!isRelicKey(key)) return unknownRelic();
      if (duration < 1 || duration > 600) return fail("Dauer muss zwischen 1 und 600 Sekunden liegen.");
      if (cooldown < 0 || cooldown > 3600) return fail("Abklingzeit muss zwischen 0 und 3600 Sekunden liegen.");
      return update(key, { boostDuration: duration, boostCooldown: cooldown },
        `${relicConfig(key).name}: Boost ${duration} s, Abklingzeit ${cooldown} s.`);
    },
  },
  {
    name: "ce:toggle",
    description: "Schaltet die Dauerwirkung eines Effekts an oder aus",
    mandatoryParameters: [RELIC_PARAM, { name: "an", type: CustomCommandParamType.Boolean }],
    run(_origin, key, on) {
      return update(key, { effectOn: on }, `Dauerwirkung von ${key} ist jetzt ${on ? "an" : "aus"}.`);
    },
  },
  {
    name: "ce:stealing",
    description: "Gibt ein Stealing (stiehlt beim Kill den Effekt)",
    optionalParameters: [{ name: "spieler", type: CustomCommandParamType.PlayerSelector }],
    run(origin, players) {
      const target = players?.[0] ?? (origin.sourceEntity?.typeId === "minecraft:player" ? origin.sourceEntity : undefined);
      if (!target) return fail("Kein Spieler angegeben.");
      later(() => {
        const leftover = target.getComponent("minecraft:inventory")?.container?.addItem(new ItemStack(STEALING_ID, 1));
        if (leftover) target.dimension.spawnItem(leftover, target.location);
      });
      return ok(`Stealing geht an ${target.name}.`);
    },
  },
  {
    name: "ce:name",
    description: "Benennt einen Effekt um",
    mandatoryParameters: [RELIC_PARAM, { name: "name", type: CustomCommandParamType.String }],
    run(_origin, key, name) {
      const clean = name.trim().slice(0, 40);
      if (!clean) return fail("Der Name darf nicht leer sein.");
      return update(key, { name: clean }, `Effekt ${key} heißt jetzt ${clean}.`);
    },
  },
  {
    name: "ce:enable",
    description: "Schaltet einen Effekt an oder aus",
    mandatoryParameters: [RELIC_PARAM, { name: "aktiv", type: CustomCommandParamType.Boolean }],
    run(_origin, key, enabled) {
      return update(key, { enabled }, `Effekt ${key} ist jetzt ${enabled ? "aktiv" : "deaktiviert"}.`);
    },
  },
  {
    name: "ce:free",
    description: "Gibt einen Effekt frei, damit er neu gecraftet werden kann",
    mandatoryParameters: [RELIC_PARAM],
    run(_origin, key) {
      if (!isRelicKey(key)) return unknownRelic();
      later(() => freeRelic(key));
      return ok(`Effekt ${key} ist frei. Eine noch vorhandene alte Kopie wird ungültig, sobald ein neuer gecraftet wird.`);
    },
  },
  {
    name: "ce:give",
    description: "Gibt einen freien Effekt direkt an einen Spieler",
    mandatoryParameters: [RELIC_PARAM],
    optionalParameters: [{ name: "spieler", type: CustomCommandParamType.PlayerSelector }],
    run(origin, key, players) {
      if (!isRelicKey(key)) return unknownRelic();
      if (!isRelicFree(key)) return fail(`Effekt ${key} existiert bereits. Erst /ce:free ${key} benutzen.`);
      const target = players?.[0] ?? (origin.sourceEntity?.typeId === "minecraft:player" ? origin.sourceEntity : undefined);
      if (!target) return fail("Kein Spieler angegeben.");
      later(() => {
        const item = newRelicItem(key, target);
        const leftover = target.getComponent("minecraft:inventory")?.container?.addItem(item);
        if (leftover) target.dimension.spawnItem(leftover, target.location);
      });
      return ok(`${relicConfig(key).name} geht an ${target.name}.`);
    },
  },
  {
    name: "ce:pvp",
    description: "Schaltet Effekt-Schaden gegen Spieler an oder aus",
    mandatoryParameters: [{ name: "an", type: CustomCommandParamType.Boolean }],
    run(_origin, enabled) {
      later(() => {
        getConfig().pvp = enabled;
        saveConfig();
      });
      return ok(`PvP für Effekte ist jetzt ${enabled ? "an" : "aus"}.`);
    },
  },
  {
    name: "ce:reset",
    description: "Stellt die Standardbelegung aller Effekte wieder her",
    run(_origin) {
      later(() => {
        resetConfig();
        world.sendMessage("§eCraftedEffects: Alle Effekte wurden auf Standard zurückgesetzt.");
      });
      return ok("Standardbelegung wird wiederhergestellt.");
    },
  },
];

/** Registers all /ce: commands. Returns how many worked; failures are logged one by one. */
export function registerCommands(registry) {
  registry.registerEnum(RELIC_ENUM, RELIC_KEYS);
  registry.registerEnum(EFFECT_ENUM, Object.keys(DATA.effects));
  registry.registerEnum(ATTACK_ENUM, Object.keys(DATA.attacks));
  let registered = 0;
  for (const command of COMMANDS) {
    try {
      registerOne(registry, command);
      registered++;
    } catch (error) {
      console.error(`[CraftedEffects] Befehl /${command.name} konnte nicht registriert werden: ${error}`);
    }
  }
  return registered;
}

function registerOne(registry, command) {
  registry.registerCommand(
    {
      name: command.name,
      description: command.description,
      permissionLevel: CommandPermissionLevel.GameDirectors,
      cheatsRequired: false,
      mandatoryParameters: command.mandatoryParameters,
      optionalParameters: command.optionalParameters,
    },
    (origin, ...args) => {
      try {
        return command.run(origin, ...args);
      } catch (error) {
        return fail(`Fehler: ${error}`);
      }
    },
  );
}
