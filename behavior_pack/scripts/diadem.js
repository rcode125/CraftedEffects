import { EquipmentSlot, system } from "@minecraft/server";
import { relicConfig, relicKey, setLevel } from "./config.js";
import { registeredSerial, serialOf } from "./registry.js";

export const DIADEM_ID = "craftedeffects:diadem";

/** Right-click with the diadem: the relic in the offhand gains one level; the diadem is used up. */
export function useDiadem(player) {
  const equippable = player.getComponent("minecraft:equippable");
  const relicItem = equippable?.getEquipment(EquipmentSlot.Offhand);
  const key = relicKey(relicItem?.typeId);
  if (!key) {
    player.sendMessage("§7Lege ein Relikt in die Zweithand und benutze dann das Diadem.");
    return;
  }
  const relic = relicConfig(key);
  if (serialOf(relicItem) === undefined || serialOf(relicItem) !== registeredSerial(key)) {
    player.sendMessage("§7Dieses Relikt wird noch geprüft …");
    return;
  }
  if (relic.level >= relic.maxLevel) {
    player.sendMessage(`§e${relic.name} ist schon auf dem Maximallevel ${relic.maxLevel}.`);
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

  const level = setLevel(key, relic.level + 1);
  player.sendMessage(`§6${relic.name} ist jetzt auf Level §e${level}/${relic.maxLevel}§6!`);
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
