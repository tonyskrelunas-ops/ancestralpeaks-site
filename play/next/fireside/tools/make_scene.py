"""By the Fire: the hogan picture brought to life as one looping film.

The picture (src/hogan-red-rug-2528.jpg) is never repainted. Over it, in order:
  1. Tony's real flame (flame.py) screened over the painted fire inside a large
     soft elliptical feather, scaled to the painted fire.
  2. Firelight: a soft light map radiating from the fire, multiplied into the
     picture by the real flame's brightness in that frame (about +/- 8% near the
     fire, fading with distance).
  3. Smoke: thin slow wisps rising from the fire toward the light shaft, and the
     shaft itself breathing very slightly.
  4. Embers: a few small sparks lifting off the fire and going out.
  5. Film grain, new every frame.
  6. A seamless loop: the tail of the film is dissolved into its head.

Run from the repo root:  python play/next/fireside/tools/make_scene.py [outdir]
Needs numpy, Pillow, OpenCV and ffmpeg. Writes scene.mp4 and scene-poster.jpg.
"""
import os, sys, subprocess, math
import numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import flame as FL

HERE = os.path.dirname(os.path.abspath(__file__))
ROOM = os.path.join(HERE, '..')
OUT = sys.argv[1] if len(sys.argv) > 1 else ROOM
PIC = os.path.join(ROOM, 'src', 'hogan-red-rug-2528.jpg')
W, H, FPS = 1200, 800, 30
N = 390            # the loop: 13.0 s
X = 24             # the dissolve, end into start: 0.8 s
DISSOLVE = 12      # between stretches of the flame clip
rng = np.random.default_rng(2528)

# ---- where things are in the picture (1200 x 800) ----
FIRE = (362, 650)          # the painted fire's heart
FLAME_BASE = (362, 694)    # where the real flame's base is set down
# per stretch: (anchor in the keyed crop = flame base centre, scale)
PLACE = [((310, 382), 0.38), ((340, 382), 0.30)]

def load_base():
    im = Image.open(PIC).convert('RGB').resize((W, H), Image.LANCZOS)
    return np.asarray(im).astype(np.float32) / 255.0

def hold_back(base):
    """Under the real flame the painted flame's brightest core is held back a little (x0.82), so the
    moving flame leads and the still one does not cap it. Nothing else in the picture changes."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    e = np.clip(1 - ((xx - 362) / 52) ** 2 - ((yy - 625) / 62) ** 2, 0, 1)
    lum = base.mean(axis=2); warm = base[..., 0] - base[..., 2]
    hot = np.clip((lum - 0.62) / 0.2, 0, 1) * np.clip(warm / 0.25, 0, 1)
    w = cv2.GaussianBlur(e * hot, (0, 0), 4)
    return base * (1 - 0.18 * w[..., None])

# ---------- the flame sequence ----------
def flame_sequence():
    stretches = FL.all_layers()
    placed = []   # full-frame light layers, float 0..1, for each source frame of each stretch
    for L, ((ax, ay), s) in zip(stretches, PLACE):
        seq = []
        for layer in L:
            h, w = layer.shape[:2]
            sm = cv2.resize(layer, (int(round(w * s)), int(round(h * s))), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
            sm = warm_tone(sm)
            full = np.zeros((H, W, 3), np.float32)
            x0 = int(round(FLAME_BASE[0] - ax * s)); y0 = int(round(FLAME_BASE[1] - ay * s))
            sh, sw = sm.shape[:2]
            full[y0:y0 + sh, x0:x0 + sw] = sm
            seq.append(full[520:760, 200:560].copy())   # the fire's neighbourhood only; keeps memory small
        placed.append(seq)
    # A, B, A, B with short dissolves between them
    order = [0, 1, 0, 1]
    chain = []
    for k, idx in enumerate(order):
        seg = placed[idx]
        if k == 0:
            chain.extend(seg); continue
        tail = chain[-DISSOLVE:]; del chain[-DISSOLVE:]
        for j in range(DISSOLVE):
            w = (j + 1) / (DISSOLVE + 1)
            chain.append(tail[j] * (1 - w) + seg[j] * w)
        chain.extend(seg[DISSOLVE:])
    # stretch the chain to the frames needed, blending neighbours (the fire runs a little slower)
    need = N + X
    out = []
    for i in range(need):
        p = i * (len(chain) - 1) / (need - 1)
        a = int(math.floor(p)); b = min(a + 1, len(chain) - 1); w = p - a
        out.append(chain[a] * (1 - w) + chain[b] * w)
    print('flame chain', len(chain), 'frames ->', need)
    return out

def warm_tone(v):
    """The phone blew the heart of the flame out to white; bring it back to a hot yellow with orange edges."""
    out = v * np.array([1.0, 0.88, 0.62], np.float32)
    out[..., 1] = out[..., 1] ** 1.25
    out[..., 2] = out[..., 2] ** 2.2
    return out

def feather():
    """A large soft ellipse round the fire, fading before the near stones; no edge anywhere."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy, rx, ry = 362, 624, 94, 90
    m = np.clip(1 - ((xx - cx) / rx) ** 2 - ((yy - cy) / ry) ** 2, 0, 1) ** 0.65
    m *= np.clip((700 - yy) / 26, 0, 1)                  # the base fades out before the near stones
    m = cv2.GaussianBlur(m, (0, 0), 7)
    return m[520:760, 200:560, None]

def light_map():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt((xx - FIRE[0]) ** 2 + ((yy - FIRE[1]) * 1.15) ** 2)
    L = 1.0 / (1.0 + (d / 250.0) ** 2)
    L[(d < 70)] *= 0.6          # the flame itself is screened on top; do not pump the painted core as much
    return cv2.GaussianBlur(L, (0, 0), 20)[..., None]

def shaft_mask(base):
    m = np.zeros((H, W), np.float32)
    cv2.fillPoly(m, [np.array([[515, 0], [735, 0], [470, 560], [405, 560]], np.int32)], 1.0)
    m = cv2.GaussianBlur(m, (0, 0), 40)
    lum = base.mean(axis=2)
    return (m * np.clip((lum - 0.12) / 0.25, 0, 1))[..., None]

# ---------- smoke ----------
SW, SH = W // 4, H // 4
def smoke_plan():
    """Three thin wisps: each a slow stream of soft, stretched puffs rising from the fire toward the shaft."""
    puffs = []
    for wisp in range(3):
        phase = rng.uniform(0, 2 * math.pi)
        for t0 in range(-160, N + X, 9 + wisp * 2):
            puffs.append(dict(t0=t0, life=rng.uniform(140, 190), x0=362 + rng.normal(0, 10) + (wisp - 1) * 9,
                              y0=590 + rng.normal(0, 8), vy=rng.uniform(55, 80) / FPS, vx=rng.uniform(8, 20) / FPS,
                              sway=rng.uniform(5, 11), ph=phase + rng.normal(0, 0.4), r0=rng.uniform(7, 10)))
    return puffs

def smoke_frame(puffs, i, noise):
    buf = np.zeros((SH, SW), np.float32)
    for p in puffs:
        age = i - p['t0']
        if age < 0 or age > p['life']: continue
        u = age / p['life']
        x = p['x0'] + p['vx'] * age + p['sway'] * math.sin(age * 0.045 + p['ph']) * (0.3 + u)
        y = p['y0'] - p['vy'] * age
        r = p['r0'] + 34 * u
        a = 0.075 * math.sin(math.pi * u) ** 1.2 * (1 - 0.5 * u)
        tmp = np.zeros((SH, SW), np.float32)
        cv2.ellipse(tmp, (int(x / 4), int(y / 4)), (max(1, int(r * 0.42 / 4)), max(2, int(r / 4))), 0, 0, 360, float(a), -1)
        buf += tmp
    buf = cv2.GaussianBlur(buf, (0, 0), 3.2)
    nz = np.roll(noise, -int(i * 0.9), axis=0)[:SH, :SW]
    buf = buf * (0.55 + 0.9 * nz)
    buf = np.clip(buf, 0, 0.16)
    return cv2.resize(buf, (W, H), interpolation=cv2.INTER_LINEAR)[..., None]

def smoke_noise():
    n = rng.random((SH * 2, SW)).astype(np.float32)
    n = cv2.GaussianBlur(n, (0, 0), 4)
    n = (n - n.min()) / (n.max() - n.min())
    return n

# ---------- embers ----------
def ember_plan():
    sparks = []
    t = -90.0
    while t < N + X:
        t += rng.exponential(FPS / 1.6)   # a spark lifts off now and then
        if sum(1 for s in sparks if s['t0'] + s['life'] > t) >= 5: continue   # never more than a few in the air
        sparks.append(dict(t0=t, life=rng.uniform(1.2, 2.6) * FPS, x0=362 + rng.normal(0, 20), y0=640 + rng.normal(0, 14),
                           vy=rng.uniform(45, 105) / FPS, vx=rng.normal(3, 10) / FPS, sway=rng.uniform(3, 8), ph=rng.uniform(0, 6.3),
                           size=rng.uniform(1.2, 2.2), fl=rng.uniform(5, 9)))
    return sparks

def ember_frame(sparks, i):
    core = np.zeros((H, W), np.float32)
    n = 0
    for s in sparks:
        age = i - s['t0']
        if age < 0 or age > s['life']: continue
        u = age / s['life']
        x = s['x0'] + s['vx'] * age + s['sway'] * math.sin(age / s['fl'] + s['ph'])
        y = s['y0'] - s['vy'] * age - 6 * u * u * FPS / 30
        a = (1 - u) ** 1.4 * (0.75 + 0.25 * math.sin(age * 0.9 + s['ph'])) * min(1, age / 6)
        if a <= 0.02: continue
        n += 1
        cv2.circle(core, (int(round(x)), int(round(y))), max(1, int(round(s['size'] * (1 - 0.4 * u)))), float(a), -1, cv2.LINE_AA)
    glow = cv2.GaussianBlur(core, (0, 0), 5) * 0.9
    core = cv2.GaussianBlur(core, (0, 0), 0.8)
    col_core = np.array([1.0, 0.72, 0.30], np.float32); col_glow = np.array([1.0, 0.45, 0.10], np.float32)
    return core[..., None] * col_core + glow[..., None] * col_glow, n

# ---------- the film ----------
def main():
    base = hold_back(load_base())
    seq = flame_sequence()
    fm = feather()
    bright = np.array([float((f * fm).mean()) for f in seq])
    k = np.ones(5) / 5; bs = np.convolve(np.pad(bright, 2, mode='edge'), k, mode='valid')
    norm = np.clip((bs - bs.mean()) / (2.2 * bs.std() + 1e-6), -1, 1)
    L = light_map(); SM = shaft_mask(base)
    puffs = smoke_plan(); noise = smoke_noise(); sparks = ember_plan()
    smoke_col = np.array([0.66, 0.60, 0.55], np.float32)
    counts = []

    def render(i):
        out = base * (1 + 0.08 * norm[i] * L)                                  # firelight flicker
        out = out * (1 + 0.028 * math.sin(2 * math.pi * 2 * i / N) * SM)        # the shaft breathes
        sm = smoke_frame(puffs, i, noise); out = out * (1 - sm) + sm * smoke_col
        f = seq[i] * fm
        reg = out[520:760, 200:560]
        out[520:760, 200:560] = 1 - (1 - reg) * (1 - f)                         # screen: the real flame over the painted one
        em, n = ember_frame(sparks, i); counts.append(n)
        out = out + em
        g = cv2.GaussianBlur(rng.normal(0, 1, (H, W)).astype(np.float32), (0, 0), 1.0)   # soft grain, about a pixel across
        amp = 0.016 * (0.6 if i == 0 else 0.8 if i == 1 else 1.0)   # the first frame is the encoder's keyframe and keeps all its grain; the rest keep about half, so it starts quieter and the loop point does not flash
        out = out + (g / g.std() * amp)[..., None] * (1 - 0.5 * out.mean(axis=2, keepdims=True))
        return np.clip(out, 0, 1)

    master = os.path.join(OUT, 'scene-master.mp4')
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'fast', '-crf', '8', '-pix_fmt', 'yuv444p', master], stdin=subprocess.PIPE)
    head = [render(i) for i in range(X)]
    tail = [render(N + i) for i in range(X)]
    poster = None
    for i in range(N):
        if i < X:
            w = (i + 1) / (X + 1)
            fr = tail[i] * (1 - w) + head[i] * w
        else:
            fr = render(i)
        if i == 2 * FPS: poster = fr
        enc.stdin.write((fr * 255 + 0.5).astype(np.uint8).tobytes())
        if i % 60 == 0: print('frame', i, 'embers', counts[-1] if counts else 0, flush=True)
    enc.stdin.close(); enc.wait()
    print('embers on screen: max', max(counts), 'mean %.1f' % np.mean(counts))

    final = os.path.join(OUT, 'scene.mp4')
    common = ['-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-r', str(FPS),
              '-b:v', '1650k', '-maxrate', '2300k', '-bufsize', '3200k', '-g', '390', '-tune', 'grain']   # one keyframe and grain kept: no pulse at the loop
    log = os.path.join(OUT, 'x264pass')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', master] + common + ['-pass', '1', '-passlogfile', log, '-an', '-f', 'null', '/dev/null'], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', master] + common + ['-pass', '2', '-passlogfile', log, '-an', '-movflags', '+faststart', final], check=True)
    for f in os.listdir(OUT):
        if f.startswith('x264pass'): os.remove(os.path.join(OUT, f))
    print('scene.mp4', os.path.getsize(final), 'bytes')

    im = Image.fromarray((poster * 255 + 0.5).astype(np.uint8))
    for q in (86, 82, 78, 74, 70, 66, 62, 58):
        p = os.path.join(OUT, 'scene-poster.jpg'); im.save(p, quality=q, optimize=True, progressive=True)
        if os.path.getsize(p) < 150_000: break
    print('scene-poster.jpg', os.path.getsize(p), 'bytes, quality', q)

if __name__ == '__main__':
    main()
