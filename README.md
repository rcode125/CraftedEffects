# 9x Mace Addon

A Minecraft Bedrock Edition add-on that adds a powerful custom item: the **9x Mace**.

Crafted from 9 vanilla maces in a crafting table, this add-on introduces a new custom item with its own unique texture, display name, and crafting recipe.

## 🎯 Features

- **Custom Item**: `craftedeffects:9x_mace` - A unique item with identifier, display name "9x Mace", and max stack size of 1
- **Crafting Recipe**: 3x3 shaped recipe using 9 vanilla maces (`minecraft:mace`)
- **Custom Texture**: 16x16 pixel art texture featuring a dark metallic handle, golden mace head, red glowing details, and "9x" design
- **Realm Compatible**: Works on Minecraft Bedrock Realms (no cheats, no experimental features required)
- **Survival Friendly**: Craftable in survival mode without commands

## 📋 Requirements

- **Minecraft Bedrock Edition**: Version 1.21.0 or later (tested on 1.21.x)
- **Platform**: Windows 10/11, Android, iOS, Xbox, PlayStation, Nintendo Switch
- **Realm Support**: Yes - all content is self-contained in the packs

## 📥 Installation

### Method 1: Download Pre-built .mcaddon (Recommended)

1. Go to the [GitHub Releases](https://github.com/YOUR_USERNAME/9x-mace-addon/releases) page
2. Download the latest `9x-Mace-Addon.mcaddon` file
3. **Double-click** the `.mcaddon` file to automatically import into Minecraft Bedrock
4. Follow the in-game prompts to complete the import

### Method 2: Build from Source

#### Prerequisites
- Python 3.8+
- Pillow library (`pip install pillow`)

#### Build Steps

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/9x-mace-addon.git
cd 9x-mace-addon

# Generate the texture (if not already present)
cd scripts
python generate_texture.py
cd ..

# Run the build script
python scripts/build_addon.py
```

The output file will be at `build/9x-Mace-Addon.mcaddon`.

### Method 3: Manual Pack Installation (Advanced)

If you prefer to install the packs separately:

1. Copy the `behavior_pack` folder to:
   - **Windows**: `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\behavior_packs\`
   - **Android**: `/storage/emulated/0/games/com.mojang/behavior_packs/`
   - **iOS**: Use Files app to navigate to `On My iPad/iPhone > Minecraft > games > com.mojang > behavior_packs`

2. Copy the `resource_pack` folder to the corresponding `resource_packs` folder

3. In Minecraft, create a new world or edit an existing world
4. Under **Behavior Packs**, activate "9x Mace Addon - Behavior Pack"
5. Under **Resource Packs**, activate "9x Mace Addon - Resource Pack"
6. Create/load the world

## 🔨 How to Craft the 9x Mace

1. Open a **Crafting Table** (3x3 grid)
2. Fill **all 9 slots** with **vanilla Maces** (`minecraft:mace`)
3. The result will be **1x 9x Mace**

```
[Mace] [Mace] [Mace]
[Mace] [Mace] [Mace]   →   [9x Mace]
[Mace] [Mace] [Mace]
```

**Note**: The recipe consumes all 9 maces and produces exactly 1 9x Mace.

## 🌐 Using on a Minecraft Bedrock Realm

### For Realm Owners:

1. **Test locally first**: Create a local world with both packs enabled and verify the crafting recipe works
2. **Upload the world to your Realm**:
   - In Minecraft, go to the world settings
   - Click "Replace World" on your Realm
   - Select the local world with the packs enabled
   - Confirm the upload
3. **Realm players**: All players joining the Realm will automatically download the packs

### Important Realm Notes:

- ✅ **All custom content is included** in the behavior and resource packs
- ✅ **No server-side plugins needed** - works on vanilla Realms
- ✅ **No cheats/operator permissions required** for crafting
- ✅ **No experimental features** used
- ⚠️ **Resource pack must be enabled** on the world for textures to appear
- ⚠️ **Behavior pack must be enabled** for the recipe and item to exist
- ⚠️ **Maximum pack size limits apply** (this addon is well under limits)

## 🐛 Troubleshooting

### Missing Texture (Pink/Black Checkerboard)

**Cause**: Resource pack not enabled, or texture file not found.

**Fix**:
1. Ensure the **Resource Pack** is activated in world settings
2. Verify `resource_pack/textures/items/9x_mace.png` exists
3. Check `resource_pack/textures/item_texture.json` registers `9x_mace` correctly
4. Restart Minecraft and re-enter the world

### Invalid Manifest Error

**Cause**: JSON syntax error, duplicate UUIDs, or version mismatch.

**Fix**:
1. Run the build script: `python scripts/build_addon.py` - it validates all JSON
2. Check that all UUIDs in `manifest.json` files are unique
3. Ensure `min_engine_version` matches your Minecraft version
4. Verify behavior pack `dependencies` includes the resource pack UUID

### Recipe Not Showing

**Cause**: Behavior pack not enabled, or recipe file missing.

**Fix**:
1. Ensure the **Behavior Pack** is activated in world settings
2. Verify `behavior_pack/recipes/9x_mace_recipe.json` exists
3. Check that the recipe uses `minecraft:mace` (not a custom identifier)
4. Make sure you're using a **Crafting Table** (not 2x2 inventory grid)

### Item Not Appearing in Creative Inventory

**Cause**: Item group/category not set correctly.

**Fix**:
- The item is in the "Equipment" category under "Mace" group
- Search for "9x Mace" in creative inventory search bar
- Use `/give @s craftedeffects:9x_mace` command (if cheats enabled)

### "Unable to Import" Error on .mcaddon

**Cause**: Corrupted archive, wrong file extension, or version incompatibility.

**Fix**:
1. Re-download the `.mcaddon` file
2. Ensure file extension is exactly `.mcaddon` (not `.zip` or `.mcaddon.zip`)
3. Try building from source using the build script
4. Check Minecraft version is 1.21.0+

## 🔄 Updating the Addon

### For Local Worlds:
1. Download the new `.mcaddon` file
2. Double-click to import (will prompt to replace existing)
3. Re-enable packs in world settings if needed

### For Realms:
1. Update the packs in a local test world
2. Verify everything works
3. Upload the updated world to the Realm (Replace World)
4. All players will receive the updated packs on next join

**Note**: GitHub stores the source code only. You must manually download/build the `.mcaddon` and install it - GitHub does not automatically push updates to your Realm or Minecraft.

## 📁 Project Structure

```
9x-mace-addon/
├── README.md
├── .gitignore
├── LICENSE
├── behavior_pack/
│   ├── manifest.json
│   ├── items/
│   │   └── 9x_mace.json
│   └── recipes/
│       └── 9x_mace_recipe.json
├── resource_pack/
│   ├── manifest.json
│   ├── textures/
│   │   ├── item_texture.json
│   │   └── items/
│   │       └── 9x_mace.png
│   └── texts/
│       └── en_US.lang
├── scripts/
│   ├── build_addon.py
│   └── generate_texture.py
└── .github/
    └── workflows/
        └── build.yml
```

## ⚙️ Technical Details

### Behavior Pack
- **Format Version**: 2
- **Min Engine Version**: 1.21.0
- **Item Identifier**: `craftedeffects:9x_mace`
- **Max Stack Size**: 1
- **Damage**: 12 (higher than vanilla mace's 8)
- **Durability**: 2500 (higher than vanilla mace's 500)
- **Enchantability**: 15 (weapon slot)
- **Repairable**: With vanilla maces (250 durability each)

### Resource Pack
- **Format Version**: 2
- **Texture Resolution**: 16x16 (standard Bedrock item size)
- **Texture Format**: PNG with transparency (RGBA)
- **Language**: en_US.lang with display name translation

### Crafting Recipe
- **Type**: `minecraft:recipe_shaped`
- **Pattern**: 3x3 grid, all slots `#`
- **Key**: `#` = `minecraft:mace`
- **Result**: 1x `craftedeffects:9x_mace`
- **Crafting Station**: Crafting Table only

## ⚠️ Known Limitations

1. **Vanilla Mace Mechanics**: The 9x Mace is a *separate custom item* - it does not automatically inherit all vanilla mace mechanics (smash attack, wind charge interaction, etc.). It has its own damage, durability, and enchantability values.

2. **Smash Attack**: Bedrock's script API does not currently allow custom items to fully replicate the vanilla mace's smash attack mechanic. The 9x Mace functions as a high-damage melee weapon.

3. **Wind Charges**: The 9x Mace does not interact with wind charges like the vanilla mace.

4. **Enchantments**: Standard weapon enchantments (Sharpness, Smite, Bane of Arthropods, Fire Aspect, Knockback, Looting, Unbreaking, Mending) work normally.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

- **Minecraft Bedrock Edition** by Mojang Studios / Microsoft
- **Bedrock Addon Documentation**: https://learn.microsoft.com/en-us/minecraft/creator/
- **Bedrock Samples**: https://github.com/Mojang/bedrock-samples

## 📞 Support

- **Issues**: Report bugs on the [GitHub Issues](https://github.com/YOUR_USERNAME/9x-mace-addon/issues) page
- **Discussions**: Use [GitHub Discussions](https://github.com/YOUR_USERNAME/9x-mace-addon/discussions) for questions

---

**Enjoy your 9x Mace!** ⚔️