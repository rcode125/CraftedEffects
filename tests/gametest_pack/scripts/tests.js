// GameTests for CraftedEffects. They treat the add-on as a black box: they
// only look at what a player could see (item names, lore, effects, inventory, health).
//
// Tests run in parallel and every relic exists only once per world, so each test
// owns one relic and checks several things with it one after another.
import { EquipmentSlot, GameMode, ItemStack, ItemTypes } from "@minecraft/server";
import { LookDuration, registerAsync } from "@minecraft/server-gametest";

const TAG = "craftedeffects";
const ARENA = "craftedeffects:arena";
const NAMES = {
  speed: "Relikt des Windes",
  strength: "Relikt der Stärke",
  haste: "Relikt des Bergmanns",
  fire: "Relikt der Glut",
  health: "Relikt des Lebens",
  jump: "Relikt des Himmelssturzes",
};
const DIADEM = "craftedeffects:diadem";

const relicId = (key) => `craftedeffects:relic_${key}`;

function test(name, maxTicks, body) {
  registerAsync("ce", name, body).structureName(ARENA).maxTicks(maxTicks).tag(TAG).padding(8);
}

/** Runs an add-on admin command, the same way an operator would. */
function command(gameTest, text) {
  gameTest.getDimension().runCommand(text);
}

/** Frees a relic so the test starts from a clean world, whatever earlier runs left behind. */
async function freshRelic(gameTest, key) {
  command(gameTest, `ce:free ${key}`);
  await gameTest.idle(2);
}

function spawnPlayer(gameTest, x, z, name) {
  return gameTest.spawnSimulatedPlayer({ x, y: 1, z }, name, GameMode.Survival);
}

function inventory(player) {
  return player.getComponent("minecraft:inventory").container;
}

function health(entity) {
  return entity.getComponent("minecraft:health").currentValue;
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

function flatDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Waits until the condition is true, failing the test after `ticks`. */
async function waitFor(gameTest, ticks, message, condition) {
  for (let tick = 0; tick < ticks; tick++) {
    if (condition()) return;
    await gameTest.idle(1);
  }
  throw new Error(message);
}

/** Gives a "freshly crafted" relic and waits until the add-on has registered it. */
async function craft(gameTest, player, key, slot = 0) {
  player.setItem(new ItemStack(relicId(key), 1), slot, true);
  await waitFor(gameTest, 40, `${NAMES[key]} wurde nicht registriert`, () =>
    inventory(player).getItem(slot)?.nameTag?.includes(NAMES[key]),
  );
}

function loreOf(item) {
  return item?.getLore().join(" ") ?? "";
}

// ---------------------------------------------------------------- speed

test("speed_effect_while_carried_and_30_block_dash", 400, async (gameTest) => {
  await freshRelic(gameTest, "speed");
  const player = spawnPlayer(gameTest, 2, 2, "ce_speed");
  await craft(gameTest, player, "speed", 5); // hotbar, not even held
  await waitFor(gameTest, 60, "Schnelligkeit I fehlt", () => player.getEffect("speed")?.amplifier === 0);

  // In the main inventory the effect must stay.
  const relic = inventory(player).getItem(5);
  inventory(player).setItem(5, undefined);
  inventory(player).setItem(20, relic);
  await gameTest.idle(45);
  gameTest.assert(player.getEffect("speed")?.amplifier === 0, "Effekt fehlt, obwohl das Relikt im Inventar liegt");

  // Dash: 30 blocks in the looking direction, no fall damage.
  inventory(player).setItem(20, undefined);
  player.setItem(relic, 0, true);
  player.lookAtLocation(gameTest.worldLocation({ x: 2, y: 2, z: 60 }), LookDuration.Continuous);
  await gameTest.idle(5);
  const start = { ...player.location };
  player.useItemInSlot(0);
  let farthest = 0;
  for (let tick = 0; tick < 80; tick++) {
    farthest = Math.max(farthest, flatDistance(player.location, start));
    await gameTest.idle(1);
  }
  console.warn(`[CE-TEST] Speed-Dash Weite: ${farthest.toFixed(1)} Blöcke`);
  gameTest.assert(farthest >= 22 && farthest <= 40, `Dash ging ${farthest.toFixed(1)} statt ~30 Blöcke weit`);
  gameTest.assert(health(player) >= 20, `Spieler hat Schaden genommen (${health(player)} HP)`);

  // Without the relic the effect disappears.
  inventory(player).setItem(0, undefined);
  await waitFor(gameTest, 60, "Effekt blieb nach dem Ablegen bestehen", () => !player.getEffect("speed"));
  gameTest.succeed();
});

// ---------------------------------------------------------------- strength + diadem

test("strength_ring_damage_and_diadem_levels", 400, async (gameTest) => {
  await freshRelic(gameTest, "strength");
  const player = spawnPlayer(gameTest, 5, 5, "ce_strength");
  const pig = gameTest.spawnWithoutBehaviors("minecraft:pig", { x: 10, y: 1, z: 5 });
  const pigBefore = health(pig);
  await craft(gameTest, player, "strength");
  player.useItemInSlot(0);
  await waitFor(gameTest, 40, "Kraftring hat das Schwein nicht getroffen", () => !pig.isValid || health(pig) < pigBefore);
  gameTest.assert(!pig.isValid || pigBefore - health(pig) >= 5.9, `Kraftring machte ${pigBefore - health(pig)} statt 6 Schaden`);

  // Diadem: relic in the offhand, diadem in the hand.
  const equippable = player.getComponent("minecraft:equippable");
  const relic = inventory(player).getItem(0);
  inventory(player).setItem(0, undefined);
  equippable.setEquipment(EquipmentSlot.Offhand, relic);
  player.setItem(new ItemStack(DIADEM, 3), 1, true);
  await gameTest.idle(20);

  player.useItemInSlot(1);
  await waitFor(gameTest, 40, "Diadem hat das Level nicht erhöht", () =>
    loreOf(equippable.getEquipment(EquipmentSlot.Offhand)).includes("2/3"),
  );
  gameTest.assert(countItems(player, DIADEM) === 2, "Diadem wurde nicht verbraucht");
  await waitFor(gameTest, 60, "Stärke II fehlt nach dem Level-Up", () => player.getEffect("strength")?.amplifier === 1);

  player.useItemInSlot(1);
  await waitFor(gameTest, 40, "Level 3 nicht erreicht", () =>
    loreOf(equippable.getEquipment(EquipmentSlot.Offhand)).includes("3/3"),
  );
  player.useItemInSlot(1); // already at the maximum: nothing may be used up
  await gameTest.idle(10);
  gameTest.assert(countItems(player, DIADEM) === 1, "Diadem wurde am Maximallevel verbraucht");
  gameTest.succeed();
});

// ---------------------------------------------------------------- haste

test("haste_duplicate_refund_and_fortress", 400, async (gameTest) => {
  await freshRelic(gameTest, "haste");
  const owner = spawnPlayer(gameTest, 3, 3, "ce_haste");
  const copier = spawnPlayer(gameTest, 9, 9, "ce_copier");
  await craft(gameTest, owner, "haste");

  copier.setItem(new ItemStack(relicId("haste"), 1), 0, true);
  await waitFor(gameTest, 40, "Zweites Exemplar wurde nicht entfernt", () => countItems(copier, relicId("haste")) === 0);
  gameTest.assert(countItems(copier, "minecraft:diamond_pickaxe") === 2, "2 Diamant-Spitzhacken nicht zurückgegeben");
  gameTest.assert(countItems(copier, "minecraft:emerald") === 6, "6 Smaragde nicht zurückgegeben");
  gameTest.assert(countItems(copier, "minecraft:glass_bottle") === 1, "Glasflasche nicht zurückgegeben");
  copier.disconnect();

  const cow = gameTest.spawnWithoutBehaviors("minecraft:cow", { x: 5, y: 1, z: 3 }); // the test world is peaceful
  const cowBefore = health(cow);
  owner.useItemInSlot(0);
  await waitFor(gameTest, 40, "Bollwerk-Explosion hat die Kuh nicht getroffen", () => !cow.isValid || health(cow) < cowBefore);
  gameTest.assert(owner.getEffect("resistance")?.amplifier === 4, "Resistenz V fehlt");
  await gameTest.idle(20);
  gameTest.assert(health(owner) >= 20, `Spieler hat Schaden genommen (${health(owner)} HP)`);
  gameTest.succeed();
});

// ---------------------------------------------------------------- fire

test("fire_lore_comets_lava_and_admin_command", 500, async (gameTest) => {
  await freshRelic(gameTest, "fire");
  const player = spawnPlayer(gameTest, 6, 6, "ce_fire");
  await craft(gameTest, player, "fire");
  const lore = loreOf(inventory(player).getItem(0));
  gameTest.assert(lore.includes("Feuerresistenz I") && lore.includes("1/1"), `Beschreibung stimmt nicht: ${lore}`);

  player.useItemInSlot(0);
  let lava = false;
  for (let tick = 0; tick < 100 && !lava; tick++) {
    await gameTest.idle(1);
    for (let x = 0; x < 12 && !lava; x++) {
      for (let z = 0; z < 12 && !lava; z++) {
        for (let y = 0; y < 4 && !lava; y++) {
          const type = gameTest.getBlock({ x, y, z })?.typeId;
          lava = type === "minecraft:lava" || type === "minecraft:flowing_lava";
        }
      }
    }
  }
  gameTest.assert(lava, "Kometen haben keine Lava hinterlassen");
  await gameTest.idle(40);
  gameTest.assert(health(player) >= 20, `Spieler hat durch eigene Kometen Schaden genommen (${health(player)} HP)`);

  // Admin command changes the permanent effect.
  command(gameTest, "ce:effect fire speed 1");
  await waitFor(gameTest, 60, "Geänderter Effekt (Schnelligkeit) fehlt", () => player.getEffect("speed") !== undefined);
  command(gameTest, "ce:effect fire fire_resistance 1"); // restore the default
  gameTest.succeed();
});

// ---------------------------------------------------------------- health

test("health_shield_and_level_reset_after_loss", 600, async (gameTest) => {
  await freshRelic(gameTest, "health");
  const player = spawnPlayer(gameTest, 5, 5, "ce_health");
  const pig = gameTest.spawnWithoutBehaviors("minecraft:pig", { x: 7, y: 1, z: 5 });
  await craft(gameTest, player, "health");
  await gameTest.idle(30);
  player.getComponent("minecraft:health").setCurrentValue(10); // direct, no damage immunity involved
  const hurt = health(player);
  const pigStart = flatDistance(pig.location, player.location);
  player.useItemInSlot(0);
  await gameTest.idle(40);
  gameTest.assert(flatDistance(pig.location, player.location) > pigStart + 1, "Schwein wurde nicht weggestoßen");
  gameTest.assert(health(player) > hurt, "Lebensschild hat nicht geheilt");

  // Raise the level, lose the relic in lava, craft it again: back to level 1.
  command(gameTest, "ce:level health 3");
  await waitFor(gameTest, 40, "Level 3 wurde nicht gesetzt", () => loreOf(inventory(player).getItem(0)).includes("3/10"));
  const relic = inventory(player).getItem(0);
  inventory(player).setItem(0, undefined);
  gameTest.setBlockType("minecraft:lava", { x: 10, y: 1, z: 10 });
  gameTest.spawnItem(relic, { x: 10.5, y: 2, z: 10.5 });
  await gameTest.idle(120); // burn + the add-on's 3 s loss check

  await craft(gameTest, player, "health", 1);
  gameTest.assert(loreOf(inventory(player).getItem(1)).includes("1/10"), "Neu gecraftetes Relikt ist nicht auf Level 1");
  gameTest.succeed();
});

// ---------------------------------------------------------------- jump

test("jump_automace_30_blocks_and_smash", 500, async (gameTest) => {
  await freshRelic(gameTest, "jump");
  const player = spawnPlayer(gameTest, 2, 2, "ce_mace");
  inventory(player).setItem(4, new ItemStack("minecraft:mace", 1));
  const target = gameTest.spawnWithoutBehaviors("minecraft:iron_golem", { x: 9, y: 1, z: 9 });
  const before = health(target);
  await craft(gameTest, player, "jump");

  const startY = player.location.y;
  let apex = startY;
  player.useItemInSlot(0);
  for (let tick = 0; tick < 70; tick++) {
    apex = Math.max(apex, player.location.y);
    await gameTest.idle(1);
  }
  console.warn(`[CE-TEST] Auto-Mace Flughöhe: ${(apex - startY).toFixed(1)} Blöcke`);
  gameTest.assert(apex - startY >= 25 && apex - startY <= 36, `Auto-Mace flog ${(apex - startY).toFixed(1)} statt ~30 Blöcke hoch`);

  player.lookAtEntity(target, LookDuration.Continuous);
  for (let tick = 0; tick < 200 && health(target) >= before; tick++) await gameTest.idle(1);
  gameTest.assert(health(target) < before, "Auto-Mace hat das Ziel nicht getroffen");
  gameTest.assert(player.selectedSlotIndex === 4, "Es wurde nicht zur Mace gewechselt");
  console.warn(`[CE-TEST] Auto-Mace Schaden: ${(before - health(target)).toFixed(1)}`);
  await gameTest.idle(40);
  gameTest.assert(health(player) >= 20, "Spieler hat Fallschaden genommen");
  gameTest.succeed();
});

// ---------------------------------------------------------------- shipped pack

// Smoke test for the shipped pack (stable API, no simulated players needed).
registerAsync("ce", "smoke_shipped_addon_loads", async (gameTest) => {
  for (const key of Object.keys(NAMES)) {
    gameTest.assert(ItemTypes.get(relicId(key)) !== undefined, `Item ${relicId(key)} fehlt`);
  }
  gameTest.assert(ItemTypes.get(DIADEM) !== undefined, "Diadem fehlt");
  const result = gameTest.getDimension().runCommand("ce:list");
  gameTest.assert(result.successCount > 0, "/ce:list hat nicht funktioniert");
  gameTest.succeed();
})
  .structureName(ARENA)
  .maxTicks(100)
  .tag("smoke");
