import { system, world } from "@minecraft/server";
import { scanPlayer, watchForLoss } from "./registry.js";
import { applyRelicEffects, forgetPlayer } from "./effects.js";
import { showCooldowns, useRelic } from "./attacks.js";
import { setupAutoMace } from "./automace.js";
import { registerCommands } from "./commands.js";
import { onDiademUse } from "./diadem.js";
import { setupProtection } from "./protection.js";

const RELIC_COMPONENT = "craftedeffects:relic";
const DIADEM_COMPONENT = "craftedeffects:diadem";
const SCAN_INTERVAL_TICKS = 10;
const EFFECT_INTERVAL_TICKS = 20;

system.beforeEvents.startup.subscribe(({ itemComponentRegistry, customCommandRegistry }) => {
  itemComponentRegistry.registerCustomComponent(RELIC_COMPONENT, {
    onUse({ source, itemStack }) {
      system.run(() => {
        if (source?.isValid) useRelic(source, itemStack);
      });
    },
  });
  itemComponentRegistry.registerCustomComponent(DIADEM_COMPONENT, {
    onUse({ source }) {
      onDiademUse(source);
    },
  });
  const commands = registerCommands(customCommandRegistry);
  console.log(`[CraftedEffects] geladen: Relikte, Diadem und ${commands} Befehle registriert`);
});

watchForLoss();
setupProtection();
setupAutoMace();

const activeRelics = new Map(); // player id -> relic keys currently carried
let reportedUnreadable = false;

// Inventory scan: registers fresh crafts, removes duplicates, updates names.
system.runInterval(() => {
  const players = world.getAllPlayers();
  if (!reportedUnreadable && players.some((player) => !player)) {
    reportedUnreadable = true;
    console.warn("[CraftedEffects] Einige Spieler sind für das Script nicht lesbar und werden übersprungen");
  }
  for (const player of players) {
    if (!player) continue;
    try {
      activeRelics.set(player.id, scanPlayer(player));
    } catch (error) {
      console.warn(`[CraftedEffects] Inventar von ${player.name} nicht lesbar: ${error}`);
    }
  }
}, SCAN_INTERVAL_TICKS);

// Permanent effects of all carried relics.
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    if (!player) continue;
    try {
      applyRelicEffects(player, activeRelics.get(player.id) ?? []);
      showCooldowns(player);
    } catch {
      // Player is dead or still loading; the next run catches up.
    }
  }
}, EFFECT_INTERVAL_TICKS);

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  activeRelics.delete(playerId);
  forgetPlayer(playerId);
});
