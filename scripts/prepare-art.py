"""Slice, align, and export the approved artwork for the game.
Requires Pillow. Original artwork is preserved in assets/source.
"""
from pathlib import Path
from PIL import Image
import json

root = Path(__file__).resolve().parents[1]
source = Image.open(root / 'assets/source/adventurer-original.png').convert('RGBA')
cell = 64
sheet = Image.new('RGBA', (cell * 4, cell * 4))
frames = []
for row, direction in enumerate(['down', 'left', 'right', 'up']):
    for column in range(4):
        tile = source.crop((round(column * source.width / 4), round(row * source.height / 4), round((column + 1) * source.width / 4), round((row + 1) * source.height / 4)))
        alpha = tile.getchannel('A').point(lambda a: 255 if a >= 90 else 0)
        bounds = alpha.getbbox()
        assert bounds, 'Sprite cell must not be empty'
        x0, y0, x1, y1 = bounds
        # The lower body determines the foot anchor, independent of torch position.
        feet = alpha.crop((0, y1 - 18, tile.width, y1)).getbbox()
        foot_x = (feet[0] + feet[2]) / 2 if feet else (x0 + x1) / 2
        artwork = tile.crop(bounds)
        scale = min(54 / artwork.height, 57 / artwork.width)
        artwork = artwork.resize((round(artwork.width * scale), round(artwork.height * scale)), Image.Resampling.NEAREST)
        # Keep alpha crisp to prevent color fringes at runtime.
        artwork.putalpha(artwork.getchannel('A').point(lambda a: 255 if a >= 100 else 0))
        left = round(32 - (foot_x - x0) * scale)
        left = max(1, min(63 - artwork.width, left))
        top = 60 - artwork.height
        sheet.alpha_composite(artwork, (column * cell + left, row * cell + top))
        frames.append({'direction': direction, 'frame': column, 'x': column * cell, 'y': row * cell, 'width': cell, 'height': cell})
sheet.save(root / 'public/assets/adventurer.png', optimize=True)
Image.open(root / 'assets/source/cavern-original.png').convert('RGB').save(root / 'public/assets/cavern.webp', quality=90, method=6)
(root / 'public/assets/adventurer.json').write_text(json.dumps({'frameWidth':cell, 'frameHeight':cell, 'footAnchor':[32,60], 'frameRate':6.67, 'frames':frames}, indent=2) + '\n')
print('Exported aligned 256 x 256 sprite sheet and cave background.')
