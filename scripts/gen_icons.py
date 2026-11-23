from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public'
OUT.mkdir(exist_ok=True)
font_path = 'C:/Windows/Fonts/arialbd.ttf'
for size in (192, 512):
    img = Image.new('RGBA', (size, size), (13, 39, 50, 255))
    d = ImageDraw.Draw(img)
    pad = int(size * 0.08)
    d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=int(size * 0.18), fill=(217, 119, 6, 255))
    font = ImageFont.truetype(font_path, int(size * 0.34))
    text = 'LET'
    box = d.textbbox((0, 0), text, font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    d.text(((size - w) / 2, (size - h) / 2 - h * 0.12), text, font=font, fill=(20, 20, 10, 255))
    img.save(OUT / f'icon-{size}.png')
    print(OUT / f'icon-{size}.png', img.size)
