"""Lift Tony's flame out of his fire-bowl video.

Two steady stretches of media/video/v-fire-bowl.mp4 are used. Each stretch is
steadied (the hand-held drift is measured against its first frame on the bowl,
with the flame left out), a background is taken as the dim end of each pixel
over time, and what is left after taking the background away is the moving
light of the flame. A soft warm key keeps the flame and drops the lit leaves
behind it. The result is a light layer: black where there is no flame, so it
can be screened over any picture.
"""
import cv2, numpy as np

SRC = 'media/video/v-fire-bowl.mp4'
# (first frame, last frame inclusive, crop x0,y0,x1,y1 in the 960x960 source)
# The crops are generous: the soft mask that goes round the flame later must lie well inside them.
STRETCHES = [
    (0,   95,  (0, 200, 740, 680)),
    (345, 430, (0, 300, 760, 760)),
]

def read_frames(a, b):
    cap = cv2.VideoCapture(SRC)
    cap.set(cv2.CAP_PROP_POS_FRAMES, a)
    out = []
    for _ in range(b - a + 1):
        ok, f = cap.read()
        if not ok: break
        out.append(f)
    cap.release()
    return out

def warm_key(bgr):
    """0..1 weight: bright and warm (flame), not the pink-lit leaves."""
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    warm = np.clip((42 - h) / 12, 0, 1) * (h < 42)          # hue 0..30 full, fades out by 42
    warm = np.maximum(warm, np.clip((v - 215) / 40, 0, 1))  # the white core counts whatever its hue
    bright = np.clip((v - 95) / 70, 0, 1)
    return warm * bright

def steady_shift(ref_edges, edges):
    (dx, dy), r = cv2.phaseCorrelate(ref_edges, edges)
    return dx, dy

def edges_for(gray, flame_w):
    g = cv2.GaussianBlur(gray, (0, 0), 1.2)
    e = cv2.magnitude(cv2.Sobel(g, cv2.CV_32F, 1, 0), cv2.Sobel(g, cv2.CV_32F, 0, 1))
    e = e * (1 - flame_w)
    e = cv2.GaussianBlur(e, (0, 0), 2) * np.hanning(e.shape[0])[:, None] * np.hanning(e.shape[1])[None, :]
    return e.astype(np.float32)

def edge_window(h, w, n):
    """1 inside, falling smoothly to 0 over the last n pixels of every edge."""
    def ramp(L):
        r = np.ones(L, np.float32); t = np.linspace(0, 1, n, dtype=np.float32)
        r[:n] = 0.5 - 0.5 * np.cos(np.pi * t); r[-n:] = r[:n][::-1]
        return r
    return ramp(h)[:, None] * ramp(w)[None, :]

def flame_layers(stretch):
    a, b, (x0, y0, x1, y1) = stretch
    frames = read_frames(a, b)
    grays = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32) for f in frames]
    keys = [warm_key(f) for f in frames]
    # steady: measure the drift of the lower, static part of the frame against the first frame
    ref = edges_for(grays[0][480:], cv2.GaussianBlur(keys[0], (0, 0), 12)[480:])
    aligned = []
    for f, g, k in zip(frames, grays, keys):
        dx, dy = steady_shift(ref, edges_for(g[480:], cv2.GaussianBlur(k, (0, 0), 12)[480:]))
        M = np.float32([[1, 0, -dx], [0, 1, -dy]])
        aligned.append(cv2.warpAffine(f, M, (960, 960), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT))
    stack = np.stack([f[y0:y1, x0:x1] for f in aligned]).astype(np.float32)
    bg = np.percentile(stack, 8, axis=0)                     # the dim end of every pixel over time: the still scene
    bg_lum = cv2.GaussianBlur(bg.mean(axis=2), (0, 0), 2.0)
    border = edge_window(stack.shape[1], stack.shape[2], 48)   # the crop's own edges fade to nothing
    layers = []
    for f in stack:
        lum = f.mean(axis=2)
        lift = np.clip((lum - bg_lum - 22) / 70, 0, 1)      # how much brighter than the still scene: the moving light
        k = warm_key(f.astype(np.uint8))
        a = cv2.GaussianBlur(lift * k, (0, 0), 1.2) * border
        rgb = cv2.cvtColor((f * a[..., None]).astype(np.uint8), cv2.COLOR_BGR2RGB)   # the flame keeps its own colour
        layers.append(rgb)
    return layers

def all_layers():
    return [flame_layers(s) for s in STRETCHES]

if __name__ == '__main__':
    import sys
    out = sys.argv[1]
    for i, s in enumerate(STRETCHES):
        L = flame_layers(s)
        pick = [L[j] for j in range(0, len(L), max(1, len(L) // 8))][:8]
        sheet = np.concatenate([cv2.resize(p, (240, int(240 * p.shape[0] / p.shape[1]))) for p in pick], axis=1)
        cv2.imwrite(f'{out}/key-{i}.jpg', cv2.cvtColor(sheet, cv2.COLOR_RGB2BGR))
        print(i, len(L), L[0].shape)
