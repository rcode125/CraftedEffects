import { system, world } from "@minecraft/server";
import { scanPlayer, watchForLoss } from "./registry.js";
import { applyRelicEffects, forgetPlayer } from "./effects.js";
import { showCooldown, useRelic } from "./attacks.js";
import { setupAutoMace } from "./automace.js";
import { registerCommands } from "./commands.js";

const RELIC_COMPONENT = "craftedeffects:relic";
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
  registerCommands(customCommandRegistry);
});

watchForLoss();
setupAutoMace();

const activeRelics = new Map(); // player id -> relic numbers currently carried

// Inventory scan: registers fresh crafts, removes duplicates, updates names.
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
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
    try {
      applyRelicEffects(player, activeRelics.get(player.id) ?? []);
      const held = player.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex);
      showCooldown(player, held);
    } catch {
      // Player is dead or still loading; the next run catches up.
    }
  }
}, EFFECT_INTERVAL_TICKS);

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  activeRelics.delete(playerId);
  forgetPlayer(playerId);
});
