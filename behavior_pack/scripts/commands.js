import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system, world } from "@minecraft/server";
import { DATA } from "./data.js";
import { RELIC_COUNT, attackLabel, effectLabel, getConfig, relicConfig, resetConfig, saveConfig } from "./config.js";
import { freeRelic, isRelicFree, newRelicItem, relicStatus } from "./registry.js";

const EFFECT_ENUM = "ce:effecttype";
const ATTACK_ENUM = "ce:attacktype";

const ok = (message) => ({ status: CustomCommandStatus.Success, message });
const fail = (message) => ({ status: CustomCommandStatus.Failure, message });

function checkRelic(number) {
  return Number.isInteger(number) && number >= 1 && number <= RELIC_COUNT;
}

const RELIC_PARAM = { name: "relikt", type: CustomCommandParamType.Integer };

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

function update(number, changes, message) {
  if (!checkRelic(number)) return fail(`Relikt muss zwischen 1 und ${RELIC_COUNT} liegen.`);
  later(() => {
    Object.assign(relicConfig(number), changes);
    saveConfig();
  });
  return ok(message);
}

const COMMANDS = [
  {
    name: "ce:list",
    description: "Zeigt alle CraftedEffects-Relikte",
    run(_origin) {
      const lines = getConfig().relics.map((relic, index) => {
        const state = relic.enabled ? relicStatus(index + 1) : "deaktiviert";
        return `§e${index + 1}§r ${relic.name}: §a${effectLabel(relic)}§r, §c${attackLabel(relic)}§r – §7${state}`;
      });
      lines.push(`§7PvP: ${getConfig().pvp ? "an" : "aus"}`);
      return ok(lines.join("\n"));
    },
  },
  {
    name: "ce:effect",
    description: "Setzt den Dauer-Effekt eines Relikts",
    mandatoryParameters: [
      RELIC_PARAM,
      { name: EFFECT_ENUM, type: CustomCommandParamType.Enum },
      { name: "stufe", type: CustomCommandParamType.Integer },
    ],
    run(_origin, number, effect, level) {
      if (level < 1 || level > 5) return fail("Stufe muss zwischen 1 und 5 liegen.");
      return update(number, { effect, level }, `Relikt ${number}: Effekt ist jetzt ${DATA.effects[effect]} ${level}.`);
    },
  },
  {
    name: "ce:attack",
    description: "Setzt den Spezialangriff eines Relikts",
    mandatoryParameters: [RELIC_PARAM, { name: ATTACK_ENUM, type: CustomCommandParamType.Enum }],
    optionalParameters: [{ name: "abklingzeit", type: CustomCommandParamType.Integer }],
    run(_origin, number, attack, cooldown) {
      const seconds = cooldown ?? DATA.attacks[attack].cooldown;
      if (seconds < 0 || seconds > 3600) return fail("Abklingzeit muss zwischen 0 und 3600 Sekunden liegen.");
      return update(number, { attack, cooldown: seconds }, `Relikt ${number}: Angriff ist jetzt ${DATA.attacks[attack].name} (${seconds} s).`);
    },
  },
  {
    name: "ce:name",
    description: "Benennt ein Relikt um",
    mandatoryParameters: [RELIC_PARAM, { name: "name", type: CustomCommandParamType.String }],
    run(_origin, number, name) {
      const clean = name.trim().slice(0, 40);
      if (!clean) return fail("Der Name darf nicht leer sein.");
      return update(number, { name: clean }, `Relikt ${number} heißt jetzt ${clean}.`);
    },
  },
  {
    name: "ce:enable",
    description: "Schaltet ein Relikt an oder aus",
    mandatoryParameters: [RELIC_PARAM, { name: "aktiv", type: CustomCommandParamType.Boolean }],
    run(_origin, number, enabled) {
      return update(number, { enabled }, `Relikt ${number} ist jetzt ${enabled ? "aktiv" : "deaktiviert"}.`);
    },
  },
  {
    name: "ce:free",
    description: "Gibt ein Relikt frei, damit es neu gecraftet werden kann",
    mandatoryParameters: [RELIC_PARAM],
    run(_origin, number) {
      if (!checkRelic(number)) return fail(`Relikt muss zwischen 1 und ${RELIC_COUNT} liegen.`);
      later(() => freeRelic(number));
      return ok(`Relikt ${number} ist frei. Eine noch vorhandene alte Kopie wird ungültig, sobald ein neues gecraftet wird.`);
    },
  },
  {
    name: "ce:give",
    description: "Gibt ein freies Relikt direkt an einen Spieler",
    mandatoryParameters: [RELIC_PARAM],
    optionalParameters: [{ name: "spieler", type: CustomCommandParamType.PlayerSelector }],
    run(origin, number, players) {
      if (!checkRelic(number)) return fail(`Relikt muss zwischen 1 und ${RELIC_COUNT} liegen.`);
      if (!isRelicFree(number)) return fail(`Relikt ${number} existiert bereits. Erst /ce:free ${number} benutzen.`);
      const target = players?.[0] ?? (origin.sourceEntity?.typeId === "minecraft:player" ? origin.sourceEntity : undefined);
      if (!target) return fail("Kein Spieler angegeben.");
      later(() => {
        const item = newRelicItem(number, target.name);
        const leftover = target.getComponent("minecraft:inventory")?.container?.addItem(item);
        if (leftover) target.dimension.spawnItem(leftover, target.location);
      });
      return ok(`${relicConfig(number).name} geht an ${target.name}.`);
    },
  },
  {
    name: "ce:pvp",
    description: "Schaltet Relikt-Schaden gegen Spieler an oder aus",
    mandatoryParameters: [{ name: "an", type: CustomCommandParamType.Boolean }],
    run(_origin, enabled) {
      later(() => {
        getConfig().pvp = enabled;
        saveConfig();
      });
      return ok(`PvP für Relikte ist jetzt ${enabled ? "an" : "aus"}.`);
    },
  },
  {
    name: "ce:reset",
    description: "Stellt die Standardbelegung aller Relikte wieder her",
    run(_origin) {
      later(() => {
        resetConfig();
        world.sendMessage("§eCraftedEffects: Alle Relikte wurden auf Standard zurückgesetzt.");
      });
      return ok("Standardbelegung wird wiederhergestellt.");
    },
  },
];

export function registerCommands(registry) {
  registry.registerEnum(EFFECT_ENUM, Object.keys(DATA.effects));
  registry.registerEnum(ATTACK_ENUM, Object.keys(DATA.attacks));
  for (const command of COMMANDS) {
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
}
