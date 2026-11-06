#!/usr/bin/env python3
"""Write the GameTest arena: a stone floor with air above (.mcstructure, little-endian NBT)."""

import struct
from pathlib import Path

SIZE = (12, 8, 12)  # x, y, z
OUT = Path(__file__).resolve().parent.parent / "gametest_pack" / "structures" / "craftedeffects" / "arena.mcstructure"
BLOCK_VERSION = 18168865  # 1.21.40 block-state version; the game upgrades older states

TAG_END, TAG_INT, TAG_STRING, TAG_LIST, TAG_COMPOUND = 0, 3, 8, 9, 10


def name(text):
    raw = text.encode("utf-8")
    return struct.pack("<H", len(raw)) + raw


def int_tag(key, value):
    return bytes([TAG_INT]) + name(key) + struct.pack("<i", value)


def string_tag(key, value):
    return bytes([TAG_STRING]) + name(key) + name(value)


def compound_tag(key, body):
    return bytes([TAG_COMPOUND]) + name(key) + body + bytes([TAG_END])


def list_tag(key, element_type, payloads):
    return bytes([TAG_LIST]) + name(key) + bytes([element_type]) + struct.pack("<i", len(payloads)) + b"".join(payloads)


def int_list_payload(values):
    return bytes([TAG_INT]) + struct.pack("<i", len(values)) + b"".join(struct.pack("<i", v) for v in values)


def block(block_name):
    return string_tag("name", block_name) + compound_tag("states", b"") + int_tag("version", BLOCK_VERSION) + bytes([TAG_END])


def main():
    sx, sy, sz = SIZE
    # Index order: x outermost, then y, then z.
    layer = [0 if y == 0 else 1 for x in range(sx) for y in range(sy) for z in range(sz)]
    palette = list_tag("block_palette", TAG_COMPOUND, [block("minecraft:stone"), block("minecraft:air")])
    structure = (
        list_tag("block_indices", TAG_LIST, [int_list_payload(layer), int_list_payload([-1] * len(layer))])
        + list_tag("entities", TAG_COMPOUND, [])
        + compound_tag("palette", compound_tag("default", palette + compound_tag("block_position_data", b"")))
    )
    root = (
        int_tag("format_version", 1)
        + list_tag("size", TAG_INT, [struct.pack("<i", v) for v in SIZE])
        + compound_tag("structure", structure)
        + list_tag("structure_world_origin", TAG_INT, [struct.pack("<i", 0)] * 3)
    )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(compound_tag("", root))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
