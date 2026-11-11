#!/usr/bin/env python3
"""
By the Fire: builds play/next/fireside/scene.mp4 and scene-poster.jpg.

The room (an eight-sided hogan of cribbed logs, the roof rings drawing in to the
smoke hole, a packed-earth floor, a ring of hearth stones, three logs in the fire,
a plank door in the east wall) is ray-cast once in numpy, textured with procedural
wood grain, bark, earth and chinking, and lit from the fire. The flame is Tony's own
fire, media/video/v-fire-bowl.mp4: the two steady stretches of it are stabilised,
cropped tight to the flame, softened at the edge with a large feathered window,
and laid over the room with a screen blend, so the black of night falls away on
its own and the flame keeps its bright core and soft edge. Embers rise from it,
thin smoke drifts up to the smoke hole and catches the firelight, and a slight
haze, film grain and a soft vignette are baked in.

Needs: python3 with numpy, scipy and Pillow; ffmpeg with libx264.

    python3 play/next/fireside/tools/make-scene.py            # full build
    python3 play/next/fireside/tools/make-scene.py --still    # one frame, for a look
    python3 play/next/fireside/tools/make-scene.py --seconds 2   # a short test film

Everything is deterministic (fixed seeds), and everything loops: the flame track is
built from the stretches with soft cross-dissolves that wrap around, and the embers,
smoke and star twinkle are periodic over the length of the film.
"""
import argparse, os, subprocess, sys, time
import numpy as np
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOM = os.path.normpath(os.path.join(HERE, '..'))
REPO = os.path.normpath(os.path.join(HERE, '..', '..', '..', '..'))
SRC = os.path.join(REPO, 'media', 'video', 'v-fire-bowl.mp4')

W, H = 960, 768
FPS = 30
SEG = 118            # frames taken from each steady stretch
XF = 15              # cross-dissolve, frames
NSEG = 4
T = NSEG * (SEG - XF)   # 412 frames, 13.73 s, loops

# ------------------------------------------------------------------ helpers

def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

def hash2(i, j, seed=0):
    """Deterministic pseudo-random in [0,1) from integer lattice coords."""
    i = i.astype(np.int64); j = j.astype(np.int64)
    h = (i * 374761393 + j * 668265263 + seed * 982451653) & 0xFFFFFFFF
    h = (h ^ (h >> 13)) * 1274126177 & 0xFFFFFFFF
    h = h ^ (h >> 16)
    return (h & 0xFFFFFF).astype(np.float32) / float(0x1000000)

def vnoise(u, v, seed=0):
    """Value noise at continuous coords, smooth, in [0,1]."""
    i0 = np.floor(u); j0 = np.floor(v)
    fu = u - i0; fv = v - j0
    fu = fu * fu * (3 - 2 * fu); fv = fv * fv * (3 - 2 * fv)
    i0 = i0.astype(np.int64); j0 = j0.astype(np.int64)
    a = hash2(i0, j0, seed); b = hash2(i0 + 1, j0, seed)
    c = hash2(i0, j0 + 1, seed); d = hash2(i0 + 1, j0 + 1, seed)
    return (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv

def fbm(u, v, octaves=4, seed=0, gain=0.5, lac=2.0):
    s = np.zeros_like(u, dtype=np.float32); amp = 1.0; tot = 0.0
    for k in range(octaves):
        s += amp * vnoise(u, v, seed + k * 7); tot += amp
        u = u * lac + 17.3; v = v * lac + 9.1; amp *= gain
    return s / tot

def tile_noise(h, w, cells_y, cells_x, seed, octaves=4):
    """fbm on an image grid that tiles in both directions (for the smoke scroll)."""
    y = np.arange(h, dtype=np.float32)[:, None] / h
    x = np.arange(w, dtype=np.float32)[None, :] / w
    out = np.zeros((h, w), np.float32); amp = 1.0; tot = 0.0
    cy, cx = cells_y, cells_x
    for k in range(octaves):
        u = x * cx; v = y * cy
        i0 = np.floor(u); j0 = np.floor(v); fu = u - i0; fv = v - j0
        fu = fu * fu * (3 - 2 * fu); fv = fv * fv * (3 - 2 * fv)
        i0 = i0.astype(np.int64) % cx; j0 = j0.astype(np.int64) % cy
        i1 = (i0 + 1) % cx; j1 = (j0 + 1) % cy
        sd = seed + 11 * k
        a = hash2(i0, j0, sd); b = hash2(i1, j0, sd); c = hash2(i0, j1, sd); d = hash2(i1, j1, sd)
        out += amp * ((a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv)
        tot += amp; amp *= 0.5; cy *= 2; cx *= 2
    return out / tot

def normalize(v):
    return v / (np.linalg.norm(v, axis=-1, keepdims=True) + 1e-9)

def gauss(img, sigma):
    if img.ndim == 3:
        return ndimage.gaussian_filter(img, (sigma, sigma, 0))
    return ndimage.gaussian_filter(img, sigma)

def srgb(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, 12.92 * x, 1.055 * np.power(x, 1 / 2.4) - 0.055)

def aces(x):
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)

# ------------------------------------------------------------------ the room

# metres; z up, x east (the door), y north. The camera sits at the west side looking east.
R = 3.0                 # wall apothem
LOG = 0.214             # wall log thickness; 7 logs make the 1.5 m wall
HW = 7 * LOG
RD = 0.21               # roof log thickness
NR = 7                  # roof rings
STEP = (R - 0.5) / NR   # each ring draws in by this much; the smoke hole apothem is 0.5
CAM = np.array([-2.2, 0.0, 0.75], np.float32)
PITCH = np.radians(15.0)
VFOV = np.radians(76.0)
FIRE = np.array([0.0, 0.0, 0.0], np.float32)

ANG = np.radians(np.arange(8) * 45.0)
NRM = np.stack([np.cos(ANG), np.sin(ANG), np.zeros(8)], 1).astype(np.float32)   # face normals (outward)
TAN = np.stack([-np.sin(ANG), np.cos(ANG), np.zeros(8)], 1).astype(np.float32)  # along the face

rng = np.random.RandomState(7)
# hearth stones: a ring, each a flattened ellipsoid half in the earth
STONES = []
for k in range(13):
    a = k / 13 * 2 * np.pi + rng.uniform(-0.12, 0.12)
    rad = 0.58 + rng.uniform(-0.03, 0.03)
    rx = rng.uniform(0.10, 0.15); ry = rng.uniform(0.09, 0.13); rz = rng.uniform(0.07, 0.10)
    STONES.append((np.array([rad * np.cos(a), rad * np.sin(a), 0.01]), np.array([rx, ry, rz]), rng.uniform(0, np.pi)))
# three logs in the fire
FIRELOGS = []
for k, a in enumerate([0.15, 1.25, 2.35]):
    d = np.array([np.cos(a), np.sin(a), 0.18 if k != 1 else 0.28]); d /= np.linalg.norm(d)
    c = np.array([0.0, 0.0, 0.08 + 0.05 * k]) + d * 0.05
    FIRELOGS.append((c.astype(np.float32), d.astype(np.float32), 0.065, 0.36))

def camera_rays():
    f = (H / 2) / np.tan(VFOV / 2)
    px = (np.arange(W, dtype=np.float32) + 0.5 - W / 2)
    py = (np.arange(H, dtype=np.float32) + 0.5 - H / 2)
    X, Y = np.meshgrid(px, py)
    fwd = np.array([np.cos(PITCH), 0, np.sin(PITCH)], np.float32)
    right = np.array([0, -1, 0], np.float32)
    up = np.cross(right, fwd)
    d = fwd[None, None] * f + right[None, None] * X[..., None] - up[None, None] * Y[..., None]
    return normalize(d).astype(np.float32), f

def project(p, f):
    fwd = np.array([np.cos(PITCH), 0, np.sin(PITCH)]); right = np.array([0, -1, 0]); up = np.cross(right, fwd)
    v = np.asarray(p) - CAM
    z = v @ fwd; x = v @ right; y = v @ up
    return W / 2 + f * x / z, H / 2 - f * y / z

def apothem(p):
    return np.max(p @ NRM.T, axis=-1)

def plane_hits(o, d, apo):
    """Nearest of the 8 vertical faces at apothem apo along each ray: t and face index."""
    nd = d @ NRM.T                                   # (H,W,8)
    no = o @ NRM.T
    with np.errstate(divide='ignore', invalid='ignore'):
        t = (apo - no) / nd
    t = np.where(nd > 1e-6, t, np.inf)
    face = np.argmin(t, axis=-1)
    return np.min(t, axis=-1), face

def ellipsoid_hit(o, d, c, r, rot):
    cr, sr = np.cos(rot), np.sin(rot)
    M = np.array([[cr, sr, 0], [-sr, cr, 0], [0, 0, 1]], np.float32)
    oo = ((o - c) @ M.T) / r; dd = (d @ M.T) / r
    A = np.sum(dd * dd, -1); B = 2 * np.sum(oo * dd, -1); C = np.sum(oo * oo, -1) - 1
    disc = B * B - 4 * A * C
    ok = disc > 0
    sq = np.sqrt(np.where(ok, disc, 0))
    t = (-B - sq) / (2 * A)
    t = np.where(ok & (t > 1e-4), t, np.inf)
    p = o + d * t[..., None]
    n = ((p - c) @ M.T) / (r * r) @ M
    return t, normalize(n)

def cylinder_hit(o, d, c, axis, rad, half):
    oc = o - c
    dA = d @ axis; ocA = oc @ axis
    dp = d - dA[..., None] * axis; op = oc - ocA[..., None] * axis
    A = np.sum(dp * dp, -1); B = 2 * np.sum(dp * op, -1); C = np.sum(op * op, -1) - rad * rad
    disc = B * B - 4 * A * C
    ok = (disc > 0) & (A > 1e-9)
    sq = np.sqrt(np.where(ok, disc, 0))
    t = (-B - sq) / (2 * np.where(A > 1e-9, A, 1))
    h = ocA + t * dA
    ok = ok & (t > 1e-4) & (np.abs(h) < half)
    t = np.where(ok, t, np.inf)
    p = o + d * t[..., None]
    n = normalize(p - c - ((p - c) @ axis)[..., None] * axis)
    # end caps
    for s in (-1, 1):
        with np.errstate(divide='ignore', invalid='ignore'):
            tc = (s * half - ocA) / dA
        pc = o + d * tc[..., None]
        q = pc - c - s * half * axis
        okc = (np.abs(dA) > 1e-6) & (tc > 1e-4) & (np.sum(q * q, -1) < rad * rad) & (tc < t)
        t = np.where(okc, tc, t)
        n = np.where(okc[..., None], (s * axis)[None, None, :], n)
        p = np.where(okc[..., None], pc, p)
    return t, n

def build_room():
    """Ray-cast the static room once. Returns the shaded light maps and emissive map."""
    t0 = time.time()
    d, f = camera_rays()
    o = np.broadcast_to(CAM, d.shape)
    INF = np.full((H, W), np.inf, np.float32)
    best_t = INF.copy()
    kind = np.zeros((H, W), np.int8)       # 0 sky, 1 floor, 2 wall, 3 roof face, 4 roof underside, 5 stone, 6 fire log, 7 door
    N = np.zeros((H, W, 3), np.float32)
    face = np.zeros((H, W), np.int16); ring = np.zeros((H, W), np.int16)

    def take(t, k, n, fc=None, rg=None):
        nonlocal best_t
        m = t < best_t
        best_t = np.where(m, t, best_t); kind[m] = k
        N[m] = n[m] if n.ndim == 3 else n
        if fc is not None: face[m] = fc[m] if np.ndim(fc) else fc
        if rg is not None: ring[m] = rg

    # floor
    with np.errstate(divide='ignore', invalid='ignore'):
        tf = np.where(d[..., 2] < -1e-6, -CAM[2] / d[..., 2], np.inf)
    take(tf, 1, np.array([0, 0, 1], np.float32))
    # walls
    tw, fw = plane_hits(o, d, R)
    zw = CAM[2] + tw * d[..., 2]
    take(np.where((zw >= 0) & (zw <= HW), tw, np.inf), 2, -NRM[fw], fw)
    # roof rings
    for k in range(1, NR + 1):
        a_k = R - k * STEP; a_prev = R - (k - 1) * STEP
        z_k = HW + (k - 1) * RD
        tr, fr = plane_hits(o, d, a_k)
        zr = CAM[2] + tr * d[..., 2]
        take(np.where((zr >= z_k) & (zr <= z_k + RD), tr, np.inf), 3, -NRM[fr], fr, k)
        with np.errstate(divide='ignore', invalid='ignore'):
            tu = np.where(d[..., 2] > 1e-6, (z_k - CAM[2]) / d[..., 2], np.inf)
        pu = o + d * tu[..., None]
        ap = apothem(pu)
        okU = (ap >= a_k) & (ap <= a_prev)
        fu = np.argmax(pu @ NRM.T, axis=-1)
        take(np.where(okU, tu, np.inf), 4, np.array([0, 0, -1], np.float32), fu, k)
    # hearth stones and fire logs
    for c, r, rot in STONES:
        ts, ns = ellipsoid_hit(o, d, c.astype(np.float32), r.astype(np.float32), rot)
        take(ts, 5, ns)
    for c, ax, rad, half in FIRELOGS:
        tc, nc = cylinder_hit(o, d, c, ax, rad, half)
        take(tc, 6, nc)
    P = o + d * np.where(np.isfinite(best_t), best_t, 0)[..., None]
    sky = kind == 0
    print('  cast %.1fs' % (time.time() - t0)); t0 = time.time()

    # ---- materials: albedo, bumped normal, emissive, per surface kind
    alb = np.zeros((H, W, 3), np.float32)
    emis = np.zeros((H, W), np.float32)
    x, y, z = P[..., 0], P[..., 1], P[..., 2]

    def log_surface(m, u, v, logid, facenrm, upvec, seed):
        """Round cribbed log with bark, grain and chinking in the valleys. u along the log, v across (0..1)."""
        if not m.any(): return
        u = u[m]; v = v[m]; lid = logid[m]
        fn = facenrm[m] if facenrm.ndim == 3 else np.broadcast_to(facenrm, (m.sum(), 3))
        uv = upvec[m] if upvec.ndim == 3 else np.broadcast_to(upvec, (m.sum(), 3))
        # per-log variation
        h1 = hash2(lid, np.zeros_like(lid), seed); h2 = hash2(lid, np.ones_like(lid), seed); h3 = hash2(lid, 2 * np.ones_like(lid), seed)
        bark_on = smoothstep(0.42, 0.5, h3)                                   # some logs keep their bark, some are peeled
        peeled = np.stack([0.30 + 0.16 * h1, 0.20 + 0.08 * h1 + 0.04 * h2, 0.11 + 0.05 * h2], 1) * (0.6 + 0.8 * h2)[:, None]
        barked = np.stack([0.17 + 0.10 * h1, 0.11 + 0.05 * h1 + 0.03 * h2, 0.07 + 0.03 * h2], 1) * (0.55 + 0.9 * h2)[:, None]
        base = peeled * (1 - bark_on)[:, None] + barked * bark_on[:, None]
        # grain along the log, bark ridges broken into plates, fine texture, fissures and the odd knot
        ridge = fbm(u * 1.6 + 31 * h3, v * 5.0, 3, seed + 3, gain=0.6)
        breakup = 0.45 + 0.55 * vnoise(u * 0.8 + 2 * h2, lid * 0.37 + 0.5, seed + 23)
        plates_ = fbm(u * 4.0 + 13 * h1, v * 5.0, 2, seed + 13)
        grain = fbm(u * 9.0 + 7 * h2, v * 60.0, 3, seed + 5)
        fiss = fbm(u * 1.1 + 5 * h1, v * 7.0, 2, seed + 9)
        tone = 0.70 + 0.34 * ridge * breakup + 0.14 * (grain - 0.5)
        tone = tone * (1 - 0.6 * smoothstep(0.60, 0.70, fiss))                          # dark fissures
        tone = tone * (1 - bark_on * 0.5 * smoothstep(0.35, 0.65, plates_))             # bark plates, rough and dark
        knots = smoothstep(0.86, 0.9, vnoise(u * 1.3 + 3 * h1, v * 1.0 + 2, seed + 21))
        tone = tone * (1 - 0.45 * knots)
        col = base * tone[:, None]
        # roundness: the normal rolls over the log; the valleys hold earth chinking
        edge = np.abs(v - 0.5)
        phi = np.clip((v - 0.5) / 0.34, -1, 1) * np.pi * 0.46
        chink = smoothstep(0.31, 0.36, edge)
        tone = tone * (0.45 + 0.55 * np.cos(phi))                                 # the log turns away from the room at its edges
        ncol = fn * np.cos(phi)[:, None] + uv * np.sin(phi)[:, None]
        # bump from the bark
        eps = 0.01
        g_u = (fbm((u + eps) * 1.6 + 31 * h3, v * 5.0, 3, seed + 3, gain=0.6) - ridge) / eps
        g_v = (fbm(u * 1.6 + 31 * h3, (v + eps) * 5.0, 3, seed + 3, gain=0.6) - ridge) / eps
        tvec = np.cross(uv, fn); tvec = normalize(tvec)
        ncol = normalize(ncol - (0.02 + 0.03 * bark_on)[:, None] * g_u[:, None] * tvec - (0.01 + 0.015 * bark_on)[:, None] * g_v[:, None] * uv)
        earth = np.stack([0.52 + 0.08 * h2, 0.40 + 0.05 * h2, 0.27 + 0.03 * h1], 1) * (0.8 + 0.4 * fbm(u * 15, v * 15, 3, seed + 31))[:, None]
        earth = earth * (0.6 + 0.4 * smoothstep(0.32, 0.42, edge))[:, None]          # pressed in behind the round of the log
        chn = normalize(fn + 0.25 * (fbm(u * 30, v * 30, 2, seed + 41) - 0.5)[:, None] * tvec)
        col = col * (1 - chink)[:, None] + earth * chink[:, None]
        ncol = normalize(ncol * (1 - chink)[:, None] + chn * chink[:, None])
        alb[m] = col; N[m] = ncol

    UP = np.array([0, 0, 1], np.float32)
    # walls (cribbed logs, 7 high); the east face carries the door
    m = kind == 2
    fi = face
    uwall = np.sum(P * TAN[fi], -1) + 10 * fi
    vwall = (z / LOG) % 1.0
    logid = np.floor(z / LOG) + 100 * fi
    door = m & (fi == 0) & (np.abs(y) < 0.46) & (z < 1.36)
    frame = m & (fi == 0) & ~door & (np.abs(y) < 0.58) & (z < 1.5)
    log_surface(m & ~door & ~frame, uwall, vwall, logid, -NRM[fi], UP, 1)
    # the door: plain vertical planks, set a little back, a dark line between them
    if door.any():
        yy = y[door]; zz = z[door]
        plank = np.floor((yy + 0.46) / 0.153); pf = ((yy + 0.46) / 0.153) % 1.0
        hp = hash2(plank, np.zeros_like(plank), 77)
        g = fbm(zz * 5.0 + 9 * hp, yy * 45.0, 3, 55)
        tone = (0.55 + 0.5 * g) * (0.85 + 0.3 * hp) * (1 - 0.7 * (smoothstep(0.0, 0.06, pf) * smoothstep(1.0, 0.94, pf) < 0.5))
        alb[door] = np.stack([0.28, 0.18, 0.10], 0)[None] * tone[:, None] * 0.9
        gz = (fbm(zz * 5.0 + 9 * hp, (yy + 0.004) * 45.0, 3, 55) - g) / 0.004
        N[door] = normalize(np.array([-1, 0, 0], np.float32)[None] + 0.004 * gz[:, None] * np.array([0, 1, 0], np.float32)[None])
    if frame.any():
        # door posts and lintel: squared timbers
        yy = y[frame]; zz = z[frame]
        g = fbm(zz * 6.0, yy * 40.0, 3, 61)
        alb[frame] = np.array([0.33, 0.21, 0.11], np.float32)[None] * (0.6 + 0.5 * g)[:, None]
        N[frame] = np.array([-1, 0, 0], np.float32)
    # roof ring faces
    m = kind == 3
    zr = HW + (ring - 1) * RD
    vroof = np.clip((z - zr) / RD, 0, 1)
    log_surface(m, np.sum(P * TAN[fi], -1) + 10 * fi + 3 * ring, vroof, ring * 8 + fi + 1000, -NRM[fi], UP, 2)
    # roof ring undersides: the bottom of each ring log, earth plaster pressed into the joint behind it
    m = kind == 4
    if m.any():
        a_k = R - ring * STEP; a_prev = R - (ring - 1) * STEP
        ap = apothem(P)
        vund = np.clip((ap - a_k) / (a_prev - a_k), 0, 1)
        # flip so v=0.5 is the log's underside centre and the far edge becomes chinking
        vv = 0.5 + 0.5 * np.clip(vund / 0.78, 0, 1) * 0.96
        log_surface(m, np.sum(P * TAN[fi], -1) + 10 * fi + 3 * ring, vv, ring * 8 + fi + 2000, -UP[None, None, :] * np.ones_like(P), -NRM[fi], 3)
    # floor: packed earth, trodden, ash and darker near the hearth
    m = kind == 1
    if m.any():
        xx = x[m]; yy = y[m]
        big = fbm(xx * 1.3, yy * 1.3, 3, 101); mid = fbm(xx * 6, yy * 6, 4, 103); fine = fbm(xx * 40, yy * 40, 3, 105)
        tone = (0.86 + 0.25 * big) * (0.92 + 0.16 * mid) * (0.96 + 0.08 * fine)
        col = np.stack([0.34, 0.245, 0.165], 0)[None] * tone[:, None]
        rr = np.sqrt(xx * xx + yy * yy)
        ash = smoothstep(0.95, 0.45, rr)
        col = col * (1 - 0.55 * ash)[:, None] + np.array([0.09, 0.085, 0.08], np.float32)[None] * ash[:, None] * (0.6 + 0.8 * mid)[:, None]
        # cracks and small stones
        crack = smoothstep(0.55, 0.6, fbm(xx * 3.0 + 50, yy * 3.0, 3, 107)) * smoothstep(0.64, 0.58, fbm(xx * 3.0 + 50, yy * 3.0, 3, 107))
        col = col * (1 - 0.35 * crack)[:, None]
        eps = 0.01
        gx = (fbm((xx + eps) * 6, yy * 6, 4, 103) - mid) / eps; gy = (fbm(xx * 6, (yy + eps) * 6, 4, 103) - mid) / eps
        alb[m] = col
        N[m] = normalize(np.stack([-0.03 * gx, -0.03 * gy, np.ones_like(gx)], 1))
    # stones: grey-warm sandstone and basalt, a little rough
    m = kind == 5
    if m.any():
        xx = x[m]; yy = y[m]; zz = z[m]
        sid = np.floor(np.arctan2(yy, xx) / (2 * np.pi) * 13 + 0.5)
        hs = hash2(sid, np.zeros_like(sid), 303)
        n1 = fbm(xx * 7 + zz * 4, yy * 7, 3, 301)
        dark = np.stack([0.09, 0.085, 0.08], 0)[None]; warm = np.stack([0.21, 0.165, 0.125], 0)[None]
        base = dark * (1 - hs)[:, None] + warm * hs[:, None]
        radial = normalize(np.stack([xx, yy, np.zeros_like(xx)], 1))
        soot = np.clip(-np.sum(N[m] * radial, 1), 0, 1)                       # the faces toward the fire are blackened
        alb[m] = base * (0.75 + 0.5 * n1)[:, None] * 0.55 * (1 - 0.55 * soot)[:, None]
        g1 = (fbm((xx + 0.01) * 7 + zz * 4, yy * 7, 3, 301) - n1) / 0.01; g2 = (fbm(xx * 7 + zz * 4, (yy + 0.01) * 7, 3, 301) - n1) / 0.01
        N[m] = normalize(N[m] - 0.03 * np.stack([g1, g2, np.zeros_like(g1)], 1))
    # fire logs: charred, with ember cracks that glow with the fire
    m = kind == 6
    if m.any():
        xx = x[m]; yy = y[m]; zz = z[m]
        n1 = fbm(xx * 25 + zz * 10, yy * 25, 4, 401)
        char = fbm(xx * 60, yy * 60 + zz * 30, 3, 403)
        alb[m] = np.stack([0.022, 0.015, 0.011], 0)[None] * (0.5 + 0.9 * n1)[:, None] * (0.6 + 0.8 * char)[:, None]
        cr = smoothstep(0.05, 0.0, np.abs(n1 - 0.60)) * (0.3 + 0.7 * char)
        up = np.clip(N[m][:, 2] + 0.5, 0, 1)
        emis[m] = cr * (0.4 + 0.6 * up)
    print('  materials %.1fs' % (time.time() - t0)); t0 = time.time()

    # ---- lighting from the fire: three warm points (centre, left, right), shadowed by the stones and logs
    LIGHTS = [(np.array([0.0, 0.0, 0.40]), 1.00), (np.array([0.0, 0.28, 0.30]), 0.55), (np.array([0.0, -0.28, 0.30]), 0.55)]
    FIRECOL = np.array([1.0, 0.56, 0.24], np.float32)
    maps = []
    occluders = [(c, r, rot) for c, r, rot in STONES]
    V = normalize(CAM - P)
    for L, strength in LIGHTS:
        toL = L[None, None, :] - P
        dist2 = np.sum(toL * toL, -1); dist = np.sqrt(dist2)
        l = toL / dist[..., None]
        ndl = np.clip(np.sum(N * l, -1), 0, 1)
        # shadows: does the segment to the light pass through a stone or a fire log?
        sh = np.ones((H, W), np.float32)
        for c, r, rot in occluders:
            ts, _ = ellipsoid_hit(P + l * 0.01, l, c.astype(np.float32), r.astype(np.float32), rot)
            sh *= np.where(ts < dist, 0.15, 1.0)
        for c, ax, rad, half in FIRELOGS:
            tc, _ = cylinder_hit(P + l * 0.01, l, c, ax, rad, half)
            sh *= np.where(tc < dist, 0.25, 1.0)
        sh = gauss(sh, 1.2)
        # a little gloss on wood and stone
        hv = normalize(l + V)
        spec = np.power(np.clip(np.sum(N * hv, -1), 0, 1), 18) * 0.10 * (kind != 5)
        att = np.exp(-dist * 0.5) / (dist2 + 0.10)      # inverse square, and the smoky air takes a little more
        shade = (ndl + spec) * att * sh * strength
        shade[sky] = 0
        shade[kind == 6] *= 0.45                        # the fire logs sit under the flame, in each other's shadow
        maps.append((alb * shade[..., None] * FIRECOL).astype(np.float32))
    # ambient: faint cool from the sky through the hole, faint warm bounce near the fire
    dist2 = np.sum((P - FIRE) ** 2, -1)
    amb = alb * (np.array([0.010, 0.012, 0.018], np.float32) * (0.7 + 0.3 * np.clip(N[..., 2], 0, 1))[..., None]
                 + FIRECOL * (0.045 / (1 + 0.9 * dist2))[..., None])
    amb[sky] = 0
    print('  lights %.1fs' % (time.time() - t0))
    # depth of the flame plane (x = 0) for occlusion of the fire by the near stones
    with np.errstate(divide='ignore', invalid='ignore'):
        tbb = np.where(d[..., 0] > 1e-6, (0.0 - CAM[0]) / d[..., 0], np.inf)
    infront = (best_t < tbb - 0.02).astype(np.float32)
    return dict(maps=maps, amb=amb, emis=emis, sky=sky, infront=infront, f=f, kind=kind)

# ------------------------------------------------------------------ the flame

def read_frames(start, count):
    """Source frames as float32 RGB (0..1), 960x960."""
    cmd = ['ffmpeg', '-v', 'error', '-i', SRC, '-vf', 'select=between(n\\,%d\\,%d)' % (start, start + count - 1),
           '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    raw = subprocess.run(cmd, check=True, stdout=subprocess.PIPE).stdout
    a = np.frombuffer(raw, np.uint8)
    n = a.size // (960 * 960 * 3)
    return a[:n * 960 * 960 * 3].reshape(n, 960, 960, 3).astype(np.float32) / 255

def register(frames, band):
    """Camera drift of each frame against the first, measured on the top band of the picture
    (the trunk, the plants and the far lights), with the bright flame clipped flat so it cannot pull."""
    def prep(fr):
        l = np.clip(fr[:band] @ np.array([0.3, 0.59, 0.11], np.float32), 0, 0.6)
        l = l - gauss(l, 10)
        win = np.outer(np.hanning(l.shape[0]), np.hanning(l.shape[1]))
        return np.fft.fft2(l * win)
    ref = prep(frames[0]); shifts = []
    for fr in frames:
        F = prep(fr); Rr = ref * np.conj(F); Rr /= np.abs(Rr) + 1e-6
        c = np.fft.ifft2(Rr).real
        p = np.unravel_index(np.argmax(c), c.shape)
        shifts.append([(q if q < s // 2 else q - s) for q, s in zip(p, c.shape)])
    s = np.array(shifts, np.float32)
    s = ndimage.median_filter(s, size=(7, 1))
    s = ndimage.gaussian_filter1d(s, 2, axis=0)
    return s   # (n,2) dy,dx: subtract from the crop origin to hold the background still

def flame_track(plate_w, plate_h):
    """The looping flame plate: the two steady stretches, stabilised, cropped, softened; mirrored copies in between."""
    from PIL import Image
    print('flame plate %dx%d' % (plate_w, plate_h))
    stretches = [(0, 102, 300, (100, 330, 840, 440), None), (375, 102, 340, (0, 382, 960, 503), (0.95, 0.29, 0.15, 0.21))]   # (first frame, count, band, crop x,y,w,h on frame 0, quiet spot)
    plates = []
    for start, count, band, (cx, cy, cw, ch), spot in stretches:
        fr = read_frames(start, count)
        count = len(fr); sh = register(fr, band)
        print('  stretch from frame %d: drift up to %.0f px' % (start, np.abs(sh).max()))
        out = np.zeros((count, plate_h, plate_w, 3), np.float32)
        for i in range(count):
            dy, dx = sh[i]
            x0 = int(round(cx - dx)); y0 = int(round(cy - dy))
            x0 = max(0, min(960 - cw, x0)); y0 = max(0, min(960 - ch, y0))
            crop = fr[i, y0:y0 + ch, x0:x0 + cw]
            im = Image.fromarray((np.clip(crop, 0, 1) * 255).astype(np.uint8)).resize((plate_w, plate_h), Image.LANCZOS)
            out[i] = np.asarray(im, np.float32) / 255
        if spot:
            # a shoe sits at the edge of this stretch; once the crop is stabilised it holds still, so a soft spot there goes dark
            sx_, sy_, rx_, ry_ = spot
            yy_ = (np.arange(plate_h, dtype=np.float32)[:, None] + 0.5) / plate_h
            xx_ = (np.arange(plate_w, dtype=np.float32)[None, :] + 0.5) / plate_w
            rr_ = np.sqrt(((xx_ - sx_) / rx_) ** 2 + ((yy_ - sy_) / ry_) ** 2)
            out *= smoothstep(0.7, 1.3, rr_)[None, ..., None]
        plates.append(out)
    # levels: the night and the lit plants sink to black, the flame keeps its core; a touch of lift in the warm bottom
    def clean(p):
        p = np.clip((p - 0.20) / 0.80, 0, 1) ** 1.5
        p *= np.array([1.0, 0.95, 0.58], np.float32)      # the camera's violet cast goes; the flame stays yellow-white
        return p
    plates = [clean(p) for p in plates]
    # the feathered window: a wide soft superellipse, tighter at the bottom where the flame meets the logs
    yy = (np.arange(plate_h, dtype=np.float32)[:, None] + 0.5) / plate_h
    xx = (np.arange(plate_w, dtype=np.float32)[None, :] + 0.5) / plate_w
    cyf = 0.56
    ay = np.where(yy < cyf, 0.60, 0.36)
    r = (np.abs((xx - 0.5) / 0.5) ** 2.6 + np.abs((yy - cyf) / ay) ** 2.6) ** (1 / 2.6)
    feather = smoothstep(1.0, 0.50, r).astype(np.float32)
    # the lower part reads as the coal bed: warmer and a little quieter
    warm = np.stack([np.ones_like(yy), 1 - 0.35 * smoothstep(0.55, 0.95, yy), 1 - 0.6 * smoothstep(0.5, 0.95, yy)], -1)
    quiet = (1 - 0.5 * smoothstep(0.55, 0.95, yy))[..., None]
    wlow = smoothstep(0.50, 0.78, yy)[..., None]
    for p in plates:
        p *= feather[None, ..., None] * warm[None] * quiet[None]
        for i in range(len(p)):
            p[i] = p[i] * (1 - wlow) + gauss(p[i], 3.0) * wlow
    # speed: each stretch is stretched gently (fire looks right a little slow) to SEG frames
    def stretch_to(p, n):
        src = np.linspace(0, len(p) - 1.001, n)
        i0 = np.floor(src).astype(int); fr_ = (src - i0)[:, None, None, None].astype(np.float32)
        return p[i0] * (1 - fr_) + p[i0 + 1] * fr_
    A = stretch_to(plates[0], SEG); B = stretch_to(plates[1], SEG)
    segs = [A, B[:, :, ::-1], A[:, :, ::-1], B]
    track = np.zeros((T, plate_h, plate_w, 3), np.float32)
    wsum = np.zeros(T, np.float32)
    ramp = np.ones(SEG, np.float32)
    ramp[:XF] = np.linspace(0, 1, XF + 2)[1:-1]; ramp[-XF:] = np.linspace(1, 0, XF + 2)[1:-1]
    for j, s in enumerate(segs):
        for i in range(SEG):
            k = (j * (SEG - XF) + i) % T
            track[k] += s[i] * ramp[i]; wsum[k] += ramp[i]
    track /= np.maximum(wsum, 1e-6)[:, None, None, None]
    return track, feather

# ------------------------------------------------------------------ the film

def ember_paths(n, fire_px, fire_py, base_w, seed=3):
    r = np.random.RandomState(seed)
    P = []
    for i in range(n):
        P.append(dict(phase=r.uniform(0, 1), cycles=r.choice([4, 5, 6]), x0=fire_px + r.uniform(-0.3, 0.3) * base_w,
                      y0=fire_py - r.uniform(0.0, 0.35) * base_w, vy=r.uniform(55, 120), vx=r.uniform(-12, 12),
                      wob=r.uniform(6, 20), wf=r.uniform(1.5, 4.0), wp=r.uniform(0, 6.3), size=r.uniform(1.1, 2.2),
                      bright=r.uniform(0.5, 1.0), life=r.uniform(1.6, 3.2)))
    return P

def render_frames(frames, room, track, geom, out_path, worker):
    maps, amb, emis, sky, infront = room['maps'], room['amb'], room['emis'], room['sky'], room['infront']
    fire_px, fire_py, base_w, pw, ph, px0, py0, hole_px, hole_py, embers, stars, smoke_noise, haze, vig = geom
    rngg = np.random.RandomState(1000 + worker)
    # soft occlusion of the flame by the near stones, cut to the plate window
    occ = (1 - gauss(infront[py0:py0 + ph, px0:px0 + pw], 0.8))
    smoke_h, smoke_w = smoke_noise.shape
    sx = np.arange(W, dtype=np.float32)[None, :]; sy = np.arange(H, dtype=np.float32)[:, None]
    s_path = np.clip((fire_py - 0.25 * base_w - sy) / (fire_py - 0.25 * base_w - hole_py), 0, 1.2)
    lateral = (sx - fire_px) / (24 + 110 * s_path)
    plume = np.exp(-lateral ** 2 * 1.4) * smoothstep(0.0, 0.08, s_path) * (1 - smoothstep(0.75, 1.05, s_path))
    with open(out_path, 'wb') as fh:
        for n in frames:
            t = n / FPS
            pl = track[n]
            lum = pl @ np.array([0.3, 0.59, 0.11], np.float32)
            b = lum.mean() / track_mean[0]; bl = lum[:, : pw // 2].mean() / track_mean[1]; br = lum[:, pw // 2:].mean() / track_mean[2]
            w0 = 0.72 + 0.28 * b; w1 = 0.45 + 0.55 * bl; w2 = 0.45 + 0.55 * br
            lin = amb + maps[0] * w0 + maps[1] * w1 + maps[2] * w2
            lin = lin * 2.6
            # ember cracks in the fire logs
            glow = (0.55 + 0.45 * b) * (0.92 + 0.08 * np.sin(2 * np.pi * 7 * t / (T / FPS)))
            lin += emis[..., None] * np.array([1.0, 0.22, 0.03], np.float32) * (0.6 * glow)
            # stars through the smoke hole
            lin[sky] = np.array([0.004, 0.006, 0.014], np.float32)
            tw = 0.75 + 0.25 * np.sin(2 * np.pi * (stars['cyc'] * t / (T / FPS)) + stars['ph'])
            for k in range(stars['n']):
                lin[stars['sl'][k]] += stars['dots'][k][..., None] * (tw[k] * stars['b'][k]) * np.array([0.9, 0.95, 1.0], np.float32)
            img = srgb(aces(lin))
            # the flame: screen blend of the real fire, plus its bloom on the room
            fl = pl * occ[..., None]
            region = img[py0:py0 + ph, px0:px0 + pw]
            img[py0:py0 + ph, px0:px0 + pw] = 1 - (1 - region) * (1 - fl)
            bloom = np.zeros((H, W, 3), np.float32)
            bloom[py0:py0 + ph, px0:px0 + pw] = fl
            small = bloom[::4, ::4]
            bl1 = gauss(small, 3.0); bl2 = gauss(small, 14.0)
            bsum = (0.30 * bl1 + 0.55 * bl2) * np.array([1.0, 0.72, 0.42], np.float32)
            bsum = np.kron(bsum, np.ones((4, 4, 1), np.float32))[:H, :W]
            img = 1 - (1 - img) * (1 - np.clip(bsum, 0, 1))
            # embers
            em = np.zeros((H, W), np.float32)
            for e in embers:
                age = ((t / (T / FPS)) * e['cycles'] + e['phase']) % 1.0
                a = age * e['life']
                ex = e['x0'] + e['vx'] * a + e['wob'] * np.sin(e['wf'] * a + e['wp']) * np.sqrt(a)
                ey = e['y0'] - e['vy'] * a - 10 * a * a
                fade = (1 - age) ** 1.4 * smoothstep(0, 0.06, age) * e['bright'] * (0.6 + 0.4 * b)
                ix, iy = int(round(ex)), int(round(ey))
                if 2 <= ix < W - 2 and 2 <= iy < H - 2:
                    em[iy - 2:iy + 3, ix - 2:ix + 3] += fade * np.exp(-((np.arange(-2, 3)[:, None] - (ey - iy)) ** 2 + (np.arange(-2, 3)[None, :] - (ex - ix)) ** 2) / (2 * e['size'] ** 2))
            emc = np.clip(em, 0, 1.4)[..., None] * np.array([1.0, 0.45, 0.10], np.float32)
            img = 1 - (1 - img) * (1 - np.clip(emc, 0, 1))
            # thin smoke drifting up to the smoke hole, lit by the fire where it is low
            scroll = int(round((t / (T / FPS)) * 2 * smoke_h)) % smoke_h
            sn = np.roll(smoke_noise, scroll, axis=0)
            sn2 = np.roll(smoke_noise, (scroll * 2 // 3 + smoke_h // 3) % smoke_h, axis=0)
            dens = plume * np.clip((0.55 * sn[:H, :W] + 0.45 * sn2[:H, :W] - 0.40) * 2.4, 0, 1)
            alpha = dens * 0.55
            lit = (1 - smoothstep(0.0, 0.55, s_path)) * (0.6 + 0.4 * b)
            scol = np.array([0.27, 0.25, 0.24], np.float32)[None, None] * (1 - lit[..., None]) + np.array([0.72, 0.44, 0.22], np.float32)[None, None] * lit[..., None]
            img = img * (1 - alpha[..., None]) + scol * alpha[..., None]
            # haze: a slight warm lift that breathes with the fire; a soft vignette; film grain
            img = img * (1 - haze[..., None]) + np.array([0.11, 0.07, 0.045], np.float32) * haze[..., None] * (0.8 + 0.2 * b)
            img = img * vig[..., None]
            g = rngg.normal(0, 1, (H, W)).astype(np.float32)
            img = img + g[..., None] * (0.011 + 0.012 * (1 - img)) * np.array([1.0, 0.9, 0.85], np.float32)
            fh.write((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8).tobytes())
            if (n - frames[0]) % 20 == 0 and worker == 0:
                print('  frame %d/%d' % (n, T), flush=True)

track_mean = [1.0, 1.0, 1.0]

def main():
    global track_mean
    ap = argparse.ArgumentParser()
    ap.add_argument('--still', action='store_true', help='write one frame to the work dir and stop')
    ap.add_argument('--seconds', type=float, default=0, help='render only this many seconds (test)')
    ap.add_argument('--work', default=os.environ.get('SCENE_WORK', '/tmp/scene-work'))
    ap.add_argument('--jobs', type=int, default=4)
    ap.add_argument('--kbps', type=int, default=1250, help='video bitrate; 1250k keeps 13.7 s under 2.5 MB')
    args = ap.parse_args()
    os.makedirs(args.work, exist_ok=True)
    from PIL import Image

    print('room')
    room = build_room()
    f = room['f']
    fx, fy = project([0, 0, 0.17], f)            # where the fire sits
    bx0, _ = project([0, -0.525, 0.17], f); bx1, _ = project([0, 0.525, 0.17], f)
    base_w = abs(bx1 - bx0)                        # 1.05 m across, in pixels
    scale = 0.58 * (491.5 / f)                     # the flame about knee to waist high at the hearth
    pw = int(round(840 * scale)); ph = int(round(440 * scale))
    px0 = int(round(fx - pw / 2)); py0 = int(round(fy + 0.33 * ph - ph))
    hx, hy = project([0, 0, HW + NR * RD], f)
    print('fire at %.0f,%.0f, plate %dx%d at %d,%d, hole at %.0f,%.0f' % (fx, fy, pw, ph, px0, py0, hx, hy))

    track, feather = flame_track(pw, ph)
    lum = track @ np.array([0.3, 0.59, 0.11], np.float32)
    track_mean = [lum.mean(), lum[:, :, : pw // 2].mean(), lum[:, :, pw // 2:].mean()]

    # stars through the smoke hole: fixed places, a slow twinkle that repeats with the film
    r = np.random.RandomState(5)
    sky = room['sky']; ys, xs = np.nonzero(sky)
    stars = dict(n=0, sl=[], dots=[], b=[], cyc=[], ph=[])
    if len(ys):
        pick = r.choice(len(ys), 34, replace=False)
        for k in pick:
            y0, x0 = ys[k], xs[k]
            if y0 < 2 or x0 < 2 or y0 >= H - 2 or x0 >= W - 2: continue
            sz = r.uniform(0.55, 1.0)
            sl = (slice(y0 - 2, y0 + 3), slice(x0 - 2, x0 + 3))
            dot = np.exp(-((np.arange(-2, 3)[:, None]) ** 2 + (np.arange(-2, 3)[None, :]) ** 2) / (2 * sz ** 2)).astype(np.float32)
            dot *= sky[sl]
            stars['sl'].append(sl); stars['dots'].append(dot); stars['b'].append(r.uniform(0.15, 0.9) ** 2 * 1.2)
            stars['cyc'].append(r.choice([3, 5, 7, 9])); stars['ph'].append(r.uniform(0, 6.3))
        stars['n'] = len(stars['sl'])
    stars['cyc'] = np.array(stars['cyc'], np.float32); stars['ph'] = np.array(stars['ph'], np.float32)

    embers = ember_paths(60, fx, fy - 0.1 * ph, base_w)
    smoke_noise = tile_noise(1024, 1024, 6, 6, 909, 5)
    yy = (np.arange(H, dtype=np.float32)[:, None] - fy) / H; xx = (np.arange(W, dtype=np.float32)[None, :] - fx) / W
    haze = (0.035 + 0.075 * np.exp(-(xx * xx * 2.2 + yy * yy * 3.0) * 6)).astype(np.float32)
    ry = (np.arange(H, dtype=np.float32)[:, None] - H / 2) / (H / 2); rx = (np.arange(W, dtype=np.float32)[None, :] - W / 2) / (W / 2)
    vig = (1 - 0.42 * np.clip(np.sqrt(rx * rx + ry * ry) / 1.25, 0, 1) ** 2.4).astype(np.float32)
    geom = (fx, fy, base_w, pw, ph, px0, py0, hx, hy, embers, stars, smoke_noise, haze, vig)

    nframes = T if not args.seconds else min(T, int(args.seconds * FPS))
    if args.still:
        nframes = 1
    print('render %d frames' % nframes)
    t0 = time.time()
    parts = []
    if args.jobs > 1 and nframes > 8:
        import multiprocessing as mp
        chunks = np.array_split(np.arange(nframes), args.jobs)
        procs = []
        for w, ch in enumerate(chunks):
            p = os.path.join(args.work, 'part%d.rgb' % w); parts.append(p)
            pr = mp.Process(target=render_frames, args=(list(ch), room, track, geom, p, w)); pr.start(); procs.append(pr)
        for pr in procs:
            pr.join()
            if pr.exitcode: sys.exit('render worker failed')
    else:
        p = os.path.join(args.work, 'part0.rgb'); parts.append(p)
        render_frames(list(range(nframes)), room, track, geom, p, 0)
    print('rendered in %.0fs' % (time.time() - t0))
    raw = os.path.join(args.work, 'frames.rgb')
    with open(raw, 'wb') as out:
        for p in parts:
            with open(p, 'rb') as fh: out.write(fh.read())
            os.remove(p)
    if args.still:
        a = np.fromfile(raw, np.uint8).reshape(H, W, 3)
        Image.fromarray(a).save(os.path.join(args.work, 'still.png'))
        print('still:', os.path.join(args.work, 'still.png')); return
    out_mp4 = os.path.join(ROOM, 'scene.mp4'); poster = os.path.join(ROOM, 'scene-poster.jpg')
    # two passes to a bitrate that keeps the film under 2.5 MB; one keyframe per loop
    common = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, H), '-r', str(FPS), '-i', raw,
              '-c:v', 'libx264', '-preset', 'slow', '-b:v', '%dk' % args.kbps, '-maxrate', '%dk' % int(args.kbps * 1.3), '-bufsize', '%dk' % (args.kbps * 2),
              '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-tune', 'film', '-x264-params', 'keyint=%d:min-keyint=%d' % (T, 30),
              '-passlogfile', os.path.join(args.work, 'x264'), '-an']
    subprocess.run(common + ['-pass', '1', '-f', 'null', '-'], check=True)
    subprocess.run(common + ['-pass', '2', '-movflags', '+faststart', out_mp4], check=True)
    a = np.fromfile(raw, np.uint8, count=H * W * 3).reshape(H, W, 3)
    Image.fromarray(a).save(poster, quality=70, optimize=True, progressive=True)
    print('wrote', out_mp4, os.path.getsize(out_mp4), 'bytes;', poster, os.path.getsize(poster), 'bytes')

if __name__ == '__main__':
    main()
