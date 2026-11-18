import { system } from "@minecraft/server";
import { relicConfig, setLevel } from "./config.js";
import { carriedRelic } from "./registry.js";

export const DIADEM_ID = "craftedeffects:diadem";

/** Right-click with the diadem: the relic in the inventory, hotbar or offhand gains one level; the diadem is used up. */
export function useDiadem(player) {
  const found = carriedRelic(player);
  if (!found) {
    player.onScreenDisplay.setActionBar("§7Du hast keinen Effekt, den das Diadem verbessern könnte.");
    return;
  }
  const relic = relicConfig(found.key);
  if (relic.level >= relic.maxLevel) {
    player.onScreenDisplay.setActionBar(`§e${relic.name} ist schon auf dem Maximallevel ${relic.maxLevel}.`);
    return;
  }

  const container = player.getComponent("minecraft:inventory")?.container;
  const slot = container?.getSlot(player.selectedSlotIndex);
  const diadem = slot?.getItem();
  if (diadem?.typeId !== DIADEM_ID) return;
  if (diadem.amount > 1) {
    diadem.amount -= 1;
    slot.setItem(diadem);
  } else {
    slot.setItem(undefined);
  }

  const level = setLevel(found.key, relic.level + 1);
  player.sendMessage(`§6${relic.name} ist jetzt auf Level §e${level}/${relic.maxLevel}§6!`);
  if (level >= relic.maxLevel) player.sendMessage("§6Der Spezialangriff ist freigeschaltet!");
  try {
    player.dimension.playSound("random.levelup", player.location);
  } catch {
    // Sound not available - not important.
  }
}

export function onDiademUse(source) {
  system.run(() => {
    if (source?.isValid) useDiadem(source);
  });
}
