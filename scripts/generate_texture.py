#!/usr/bin/env python3
"""
Generates a 16x16 pixel art texture for the 9x Mace item.
Creates a Minecraft-style texture with:
- Dark metallic handle (dark gray/black)
- Large golden mace head (gold/yellow)
- Red glowing details
- "9x" design on the mace head
- Transparent background
"""

from PIL import Image, ImageDraw
import os
import argparse
from pathlib import Path

def create_9x_mace_texture():
    # Create a 16x16 image with transparent background
    img = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Color palette
    # Dark metallic handle colors
    HANDLE_DARK = (30, 30, 35, 255)
    HANDLE_MID = (50, 50, 55, 255)
    HANDLE_LIGHT = (70, 70, 75, 255)
    HANDLE_HIGHLIGHT = (90, 90, 95, 255)
    
    # Gold mace head colors
    GOLD_DARK = (180, 130, 20, 255)
    GOLD_MID = (218, 165, 32, 255)
    GOLD_LIGHT = (255, 215, 0, 255)
    GOLD_HIGHLIGHT = (255, 235, 100, 255)
    
    # Red glowing details
    RED_DARK = (180, 0, 0, 255)
    RED_MID = (220, 20, 20, 255)
    RED_BRIGHT = (255, 50, 50, 255)
    RED_GLOW = (255, 100, 100, 200)
    
    # Dark outline
    OUTLINE = (20, 20, 20, 255)
    
    # "9x" text color (white with dark outline)
    TEXT_COLOR = (255, 255, 255, 255)
    TEXT_OUTLINE = (0, 0, 0, 255)
    
    # Draw handle (vertical, centered, from bottom to middle)
    # Handle is 2 pixels wide, centered at x=7,8
    handle_x = [7, 8]
    for y in range(10, 16):
        for x in handle_x:
            # Gradient from dark at bottom to lighter at top
            if y >= 14:
                color = HANDLE_DARK
            elif y >= 12:
                color = HANDLE_MID
            else:
                color = HANDLE_LIGHT
            draw.point((x, y), fill=color)
    
    # Handle highlight (right side)
    for y in range(10, 16):
        draw.point((8, y), fill=HANDLE_HIGHLIGHT)
    
    # Handle outline
    for y in range(10, 16):
        draw.point((6, y), fill=OUTLINE)
        draw.point((9, y), fill=OUTLINE)
    draw.point((7, 9), fill=OUTLINE)
    draw.point((8, 9), fill=OUTLINE)
    
    # Draw mace head (large gold cube-ish shape at top)
    # Mace head spans roughly x=4-11, y=1-9
    
    # Base of mace head (wider part)
    for x in range(4, 12):
        for y in range(7, 10):
            # Gradient
            if y == 9:
                color = GOLD_DARK
            elif y == 8:
                color = GOLD_MID
            else:
                color = GOLD_LIGHT
            draw.point((x, y), fill=color)
    
    # Main body of mace head
    for x in range(4, 12):
        for y in range(2, 7):
            if x == 4 or x == 11 or y == 2:
                # Edges - darker
                color = GOLD_DARK
            elif x == 5 or x == 10 or y == 3:
                # Inner edges
                color = GOLD_MID
            else:
                # Center - brightest
                color = GOLD_LIGHT
            draw.point((x, y), fill=color)
    
    # Top highlight
    for x in range(5, 11):
        draw.point((x, 2), fill=GOLD_HIGHLIGHT)
    
    # Red glowing details - vertical lines on mace head
    # Left glow line
    for y in range(3, 8):
        draw.point((5, y), fill=RED_BRIGHT if y % 2 == 0 else RED_MID)
    # Right glow line
    for y in range(3, 8):
        draw.point((10, y), fill=RED_BRIGHT if y % 2 == 0 else RED_MID)
    # Center glow line
    for y in range(3, 8):
        draw.point((7, y), fill=RED_GLOW)
        draw.point((8, y), fill=RED_GLOW)
    
    # Red glowing spikes/flanges on sides of mace head
    # Left side spikes
    draw.point((3, 5), fill=RED_BRIGHT)
    draw.point((3, 6), fill=RED_MID)
    draw.point((3, 7), fill=RED_DARK)
    draw.point((3, 8), fill=RED_MID)
    
    # Right side spikes
    draw.point((12, 5), fill=RED_BRIGHT)
    draw.point((12, 6), fill=RED_MID)
    draw.point((12, 7), fill=RED_DARK)
    draw.point((12, 8), fill=RED_MID)
    
    # Top spikes
    draw.point((5, 1), fill=RED_BRIGHT)
    draw.point((6, 1), fill=RED_MID)
    draw.point((9, 1), fill=RED_MID)
    draw.point((10, 1), fill=RED_BRIGHT)
    
    # "9x" text on the front face of mace head (around y=4-6, x=6-9)
    # Draw "9" at x=6-7, y=4-6
    # 9 shape: top curve, middle bar, bottom curve
    nine_pixels = [
        (6, 4), (7, 4),  # top
        (8, 4),          # top right
        (8, 5),          # right middle
        (6, 5), (7, 5), (8, 5),  # middle bar
        (6, 6),          # left bottom
        (6, 6), (7, 6), (8, 6),  # bottom
    ]
    # Simpler 9: 3x3 block at (6,4) to (8,6)
    for px, py in [(6,4),(7,4),(8,4), (8,5), (6,5),(7,5),(8,5), (6,6),(7,6)]:
        draw.point((px, py), fill=TEXT_OUTLINE)
    for px, py in [(7,4), (7,5), (7,6)]:
        draw.point((px, py), fill=TEXT_COLOR)
    
    # Draw "x" at x=9-10, y=4-6
    # X shape: diagonal lines
    x_pixels = [
        (9, 4), (10, 4),  # top
        (9, 5), (10, 5),  # middle
        (9, 6), (10, 6),  # bottom
    ]
    # Draw X with crossing diagonals
    for px, py in [(9,4), (10,6)]:  # \
        draw.point((px, py), fill=TEXT_OUTLINE)
    for px, py in [(10,4), (9,6)]:  # /
        draw.point((px, py), fill=TEXT_OUTLINE)
    draw.point((9,5), fill=TEXT_OUTLINE)
    draw.point((10,5), fill=TEXT_OUTLINE)
    # Center of X
    draw.point((9,5), fill=TEXT_COLOR)
    draw.point((10,5), fill=TEXT_COLOR)
    
    # Mace head outline
    for x in range(4, 12):
        draw.point((x, 1), fill=OUTLINE)
        draw.point((x, 9), fill=OUTLINE)
    for y in range(1, 10):
        draw.point((3, y), fill=OUTLINE)
        draw.point((12, y), fill=OUTLINE)
    
    # Add some shine/specular highlights on gold
    draw.point((6, 3), fill=GOLD_HIGHLIGHT)
    draw.point((9, 3), fill=GOLD_HIGHLIGHT)
    draw.point((7, 4), fill=(255, 245, 150, 255))
    
    return img

def main():
    parser = argparse.ArgumentParser(description="Generate 9x Mace texture")
    parser.add_argument(
        "--output-dir",
        default=os.getenv('GITHUB_WORKSPACE', Path.cwd()),
        help="Directory where the generated texture will be saved (default: GITHUB_WORKSPACE or current directory)",
    )
    args = parser.parse_args()

    workspace = Path(args.output_dir)
    output_dir = workspace / "resource_pack" / "textures" / "items"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "9x_mace.png"

    img = create_9x_mace_texture()
    img.save(output_path)
    print(f"Texture saved to {output_path}")
    print(f"Image size: {img.size}")
    print(f"Image mode: {img.mode}")

if __name__ == "__main__":
    main()