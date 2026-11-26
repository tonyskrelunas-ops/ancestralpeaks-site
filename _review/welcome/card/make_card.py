# The gift card "light enough to carry": 1080 x 1920, the breath and one line of his.
# Behind it: the Swiss Alps and the headlamps of mile 95 (a made picture, the one on the Peaks home and the Stone Breath cover).
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); AP = os.path.join(HERE, '..', '..', 'ap-work')
F = os.path.join(AP, 'shared', 'fonts')
def disp(size, w=800):
    f = ImageFont.truetype(os.path.join(F, 'bricolage-500-normal-latin.woff2'), size); f.set_variation_by_axes([min(96, max(12, size)), w]); return f
def text(size, w=400):
    f = ImageFont.truetype(os.path.join(F, 'figtree-400-normal-latin.woff2'), size); f.set_variation_by_axes([w]); return f
Wd, Ht = 1080, 1920
GOLD = (227, 190, 98); WHITE = (255, 255, 255); NIGHT = (16, 11, 13)
src = Image.open(os.path.join(AP, 'media', 'world', 'alps-headlamps-1600.jpg')).convert('RGB')
sw, sh = src.size; cw = round(sh * 9 / 16); x0 = (sw - cw) // 2 - 20
im = src.crop((x0, 0, x0 + cw, sh)).resize((Wd, Ht), Image.LANCZOS)
# shade: the night a little deeper at the top and the bottom, so the words read; the mountains and the lamps stay clear
sh_ = Image.new('L', (1, Ht))
for y in range(Ht):
    t = y / Ht
    a = 0.62 * max(0, 1 - t / 0.36) ** 1.2 + 0.22 * max(0, 1 - abs(t - 0.2) / 0.2) + 0.9 * max(0, (t - 0.74) / 0.26) ** 1.3
    sh_.putpixel((0, y), int(255 * min(.93, a)))
im = Image.composite(Image.new('RGB', (Wd, Ht), NIGHT), im, sh_.resize((Wd, Ht)))
d = ImageDraw.Draw(im, 'RGBA')
def center(y, s, f, fill=WHITE, track=0):
    if track:
        w = sum(d.textlength(c, font=f) for c in s) + track * (len(s) - 1); x = (Wd - w) / 2
        for c in s: d.text((x, y), c, font=f, fill=fill); x += d.textlength(c, font=f) + track
    else:
        w = d.textlength(s, font=f); d.text(((Wd - w) / 2, y), s, font=f, fill=fill)
# the mark and the name
mx, my, k = Wd / 2 - 150, 92, 1.5
pts = [(3, 31), (15, 11), (22, 22), (27, 15), (37, 31)]
d.line([(mx + x * k, my + (y - 11) * k) for x, y in pts] + [(mx + 3 * k, my + 20 * k)], fill=WHITE, width=4, joint='curve')
d.text((mx + 72, my - 4), 'Ancestral Peaks', font=disp(38, 800), fill=WHITE)
center(190, 'A GIFT LIGHT ENOUGH TO CARRY', text(25, 700), GOLD, 5)
center(238, 'The stone breath.', disp(104, 800))
center(366, 'A small stone in your hand. Three rounds. One minute.', text(34, 500), (255, 255, 255, 240))
# the four counts: the word above, the count in the ring
cols = [('In', '4'), ('Hold', '4'), ('Out', '6'), ('Hold', '4')]; cw_ = 216; gx = (Wd - cw_ * 4) / 2; cy = 498; r = 76
for i, (lab, n) in enumerate(cols):
    cx = gx + cw_ * i + cw_ / 2
    f2 = text(36, 700); w2 = d.textlength(lab, font=f2); d.text((cx - w2 / 2, cy - 56), lab, font=f2, fill=GOLD)
    d.ellipse((cx - r, cy, cx + r, cy + 2 * r), outline=GOLD + (255,), width=4, fill=(16, 11, 13, 150))
    f = disp(96, 800); w = d.textlength(n, font=f); bb = d.textbbox((0, 0), n, font=f)
    d.text((cx - w / 2, cy + r - (bb[1] + bb[3]) / 2), n, font=f, fill=WHITE)
    if i < 3: d.line((cx + r + 14, cy + r, cx + cw_ - r - 14, cy + r), fill=GOLD + (210,), width=3)
# his line, at the foot, under the lamps
q = ['“They make you things that are light,', 'that you can carry.”']
y = 1568
for ln in q: center(y, ln, disp(54, 700)); y += 70
center(y + 22, 'Tony Skrelūnas, Gifts Light Enough to Carry', text(30, 600), GOLD) if False else None
center(y + 22, 'From “Gifts Light Enough to Carry”', text(30, 600), GOLD)
center(1826, 'ancestralpeaks.com', text(28, 500), (255, 255, 255, 215))
im.save(os.path.join(HERE, 'the-breath-light-enough-to-carry.png'), optimize=True)
im.convert('RGB').resize((540, 960), Image.LANCZOS).save(os.path.join(HERE, 'the-breath-card-540.jpg'), quality=84)
print(im.size)
