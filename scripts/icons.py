"""Generate original app icons. Optional development tool; no runtime dependency."""
from pathlib import Path
from PIL import Image, ImageDraw
from math import cos, sin, radians
root = Path(__file__).resolve().parents[1] / 'public' / 'assets'
for size in (192, 512):
    scale = size / 512
    im = Image.new('RGB', (size, size), '#102438')
    d = ImageDraw.Draw(im)
    coords = []
    for t in range(361):
        x, y = 188*cos(radians(t)), 92*sin(radians(t))
        coords.append(((256+x*cos(radians(-35))-y*sin(radians(-35)))*scale, (256+x*sin(radians(-35))+y*cos(radians(-35)))*scale))
    d.line(coords, fill='#73d6df', width=max(2, round(14*scale)))
    d.ellipse(tuple(v*scale for v in (196,196,316,316)), outline='#73d6df', width=max(2, round(14*scale)))
    for line in ((256,55,256,99),(256,413,256,457),(55,256,99,256),(413,256,457,256)):
        d.line(tuple(v*scale for v in line),fill='#73d6df',width=max(2,round(14*scale)))
    d.ellipse(tuple(v*scale for v in (378,128,416,166)),fill='#ffd18a')
    im.save(root/f'icon-{size}.png')
    print(f'Original icon generated: {size}x{size}')
