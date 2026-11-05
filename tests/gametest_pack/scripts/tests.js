// GameTests for CraftedEffects. They treat the add-on as a black box: they
// only look at what a player could see (item names, effects, inventory, health).
import { GameMode, ItemStack, ItemTypes } from "@minecraft/server";
import { LookDuration, registerAsync } from "@minecraft/server-gametest";

const TAG = "craftedeffects";
const ARENA = "craftedeffects:arena";
const NAMES = {
  1: "Relikt des Himmelssturzes",
  2: "Relikt der Stärke",
  3: "Relikt des Windes",
  5: "Relikt des Lebens",
  7: "Relikt der Nacht",
  9: "Relikt des Bergmanns",
  10: "Relikt der Schatten",
};

const relicId = (number) => `craftedeffects:relic_${String(number).padStart(2, "0")}`;

function test(name, maxTicks, body) {
  registerAsync("ce", name, body).structureName(ARENA).maxTicks(maxTicks).tag(TAG).padding(4);
}

/** Runs an add-on admin command, the same way an operator would. */
function command(gameTest, text) {
  gameTest.getDimension().runCommand(text);
}

/** Frees a relic so the test starts from a clean world, whatever earlier runs left behind. */
async function freshRelic(gameTest, number) {
  command(gameTest, `ce:free ${number}`);
  await gameTest.idle(2);
}

function spawnPlayer(gameTest, x, z, name) {
  return gameTest.spawnSimulatedPlayer({ x, y: 1, z }, name, GameMode.Survival);
}

function inventory(player) {
  return player.getComponent("minecraft:inventory").container;
}

function countItems(player, typeId) {
  const container = inventory(player);
  let total = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (item?.typeId === typeId) total += item.amount;
  }
  return total;
}

/** Waits until the condition is true, failing the test after `ticks`. */
async function waitFor(gameTest, ticks, message, condition) {
  for (let tick = 0; tick < ticks; tick++) {
    if (condition()) return;
    await gameTest.idle(1);
  }
  gameTest.fail(message);
  throw new Error(message);
}

/** Gives a "freshly crafted" relic and waits until the add-on has registered it. */
async function craft(gameTest, player, number, slot = 0) {
  player.setItem(new ItemStack(relicId(number), 1), slot, true);
  await waitFor(gameTest, 40, `Relikt ${number} wurde nicht registriert`, () =>
    inventory(player).getItem(slot)?.nameTag?.includes(NAMES[number]),
  );
}

test("craft_registers_and_names_relic", 120, async (gameTest) => {
  await freshRelic(gameTest, 10);
  const player = spawnPlayer(gameTest, 3, 3, "ce_crafter");
  await craft(gameTest, player, 10);
  const lore = inventory(player).getItem(0).getLore().join(" ");
  gameTest.assert(lore.includes("Unsichtbarkeit I"), `Beschreibung nennt den Effekt nicht: ${lore}`);
  gameTest.succeed();
});

test("effect_while_carried_and_removed_after", 240, async (gameTest) => {
  await freshRelic(gameTest, 2);
  const player = spawnPlayer(gameTest, 3, 3, "ce_effects");
  await craft(gameTest, player, 2, 5); // hotbar slot 5, not even held
  await waitFor(gameTest, 60, "Stärke II wurde nicht gegeben", () => player.getEffect("strength")?.amplifier === 1);

  // Move the relic to the main inventory (slot 20): the effect must stay.
  const relic = inventory(player).getItem(5);
  inventory(player).setItem(5, undefined);
  inventory(player).setItem(20, relic);
  await gameTest.idle(45);
  gameTest.assert(player.getEffect("strength")?.amplifier === 1, "Effekt fehlt, obwohl das Relikt im Inventar liegt");

  // Drop it: the effect must go away.
  inventory(player).setItem(20, undefined);
  await waitFor(gameTest, 60, "Effekt blieb nach dem Ablegen bestehen", () => !player.getEffect("strength"));
  gameTest.succeed();
});

test("second_copy_is_removed_and_refunded", 200, async (gameTest) => {
  await freshRelic(gameTest, 3);
  const owner = spawnPlayer(gameTest, 2, 2, "ce_owner");
  const copier = spawnPlayer(gameTest, 8, 8, "ce_copier");
  await craft(gameTest, owner, 3);

  copier.setItem(new ItemStack(relicId(3), 1), 0, true);
  await waitFor(gameTest, 40, "Zweites Exemplar wurde nicht entfernt", () => countItems(copier, relicId(3)) === 0);
  gameTest.assert(countItems(copier, "minecraft:diamond") === 4, "4 Diamanten nicht zurückgegeben");
  gameTest.assert(countItems(copier, "minecraft:gold_ingot") === 4, "4 Goldbarren nicht zurückgegeben");
  gameTest.assert(countItems(copier, "minecraft:sugar") === 1, "Kern-Zutat nicht zurückgegeben");
  gameTest.assert(countItems(owner, relicId(3)) === 1, "Das Original wurde angetastet");
  gameTest.succeed();
});

test("relic_destroyed_in_lava_is_craftable_again", 400, async (gameTest) => {
  await freshRelic(gameTest, 5);
  const first = spawnPlayer(gameTest, 2, 2, "ce_loser");
  await craft(gameTest, first, 5);
  const relic = inventory(first).getItem(0);
  inventory(first).setItem(0, undefined);
  gameTest.setBlockType("minecraft:lava", { x: 9, y: 1, z: 2 });
  gameTest.spawnItem(relic, { x: 9.5, y: 2, z: 2.5 });
  await gameTest.idle(120); // burn + the add-on's 3 s loss check

  const second = spawnPlayer(gameTest, 5, 8, "ce_finder");
  await craft(gameTest, second, 5);
  gameTest.succeed();
});

test("shockwave_damages_nearby_mob", 200, async (gameTest) => {
  await freshRelic(gameTest, 9); // default: Haste II + Shockwave
  const player = spawnPlayer(gameTest, 5, 5, "ce_shock");
  const pig = gameTest.spawnWithoutBehaviors("minecraft:pig", { x: 7, y: 1, z: 5 });
  const health = pig.getComponent("minecraft:health");
  const before = health.currentValue;
  await craft(gameTest, player, 9);
  player.useItemInSlot(0);
  await waitFor(gameTest, 40, "Schockwelle hat keinen Schaden gemacht", () => !pig.isValid || health.currentValue < before);
  gameTest.succeed();
});

test("automace_launches_and_smashes", 400, async (gameTest) => {
  await freshRelic(gameTest, 1); // default: Jump Boost II + Auto-Mace
  const player = spawnPlayer(gameTest, 2, 2, "ce_mace");
  inventory(player).setItem(4, new ItemStack("minecraft:mace", 1));
  const target = gameTest.spawnWithoutBehaviors("minecraft:iron_golem", { x: 9, y: 1, z: 9 });
  const health = target.getComponent("minecraft:health");
  const before = health.currentValue;
  await craft(gameTest, player, 1);

  const startY = player.location.y;
  let apex = startY;
  player.useItemInSlot(0);
  for (let tick = 0; tick < 60; tick++) {
    apex = Math.max(apex, player.location.y);
    await gameTest.idle(1);
  }
  console.warn(`[CE-TEST] Auto-Mace Flughöhe: ${(apex - startY).toFixed(1)} Blöcke`);
  gameTest.assert(apex - startY >= 12, `Auto-Mace flog nur ${(apex - startY).toFixed(1)} Blöcke hoch`);

  player.lookAtEntity(target, LookDuration.Continuous);
  await waitFor(gameTest, 160, "Auto-Mace hat das Ziel nicht getroffen", () => health.currentValue < before);
  gameTest.assert(player.selectedSlotIndex === 4, "Es wurde nicht zur Mace gewechselt");
  console.warn(`[CE-TEST] Auto-Mace Schaden: ${(before - health.currentValue).toFixed(1)}`);
  gameTest.assert(player.getComponent("minecraft:health").currentValue >= 19, "Spieler hat Fallschaden genommen");
  gameTest.succeed();
});

test("admin_command_changes_effect", 200, async (gameTest) => {
  await freshRelic(gameTest, 7);
  command(gameTest, "ce:effect 7 speed 3");
  await gameTest.idle(2);
  const player = spawnPlayer(gameTest, 3, 3, "ce_admin");
  await craft(gameTest, player, 7);
  await waitFor(gameTest, 60, "Geänderter Effekt (Schnelligkeit III) fehlt", () => player.getEffect("speed")?.amplifier === 2);
  gameTest.assert(!player.getEffect("night_vision"), "Alter Effekt (Nachtsicht) ist noch aktiv");
  command(gameTest, "ce:effect 7 night_vision 1"); // restore the default
  gameTest.succeed();
});

// Smoke test for the shipped pack (stable API, no simulated players needed).
registerAsync("ce", "smoke_shipped_addon_loads", async (gameTest) => {
  for (let number = 1; number <= 12; number++) {
    gameTest.assert(ItemTypes.get(relicId(number)) !== undefined, `Item ${relicId(number)} fehlt`);
  }
  const result = gameTest.getDimension().runCommand("ce:list");
  gameTest.assert(result.successCount > 0, "/ce:list hat nicht funktioniert");
  gameTest.succeed();
})
  .structureName(ARENA)
  .maxTicks(100)
  .tag("smoke");
