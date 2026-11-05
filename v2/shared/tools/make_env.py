#!/usr/bin/env python3
"""make_env.py — loudness envelope sidecar for the shared audio player (site.js, AP.player / AP.say).

Why: when a page is opened from a folder (file://), browsers will not let Web Audio read an <audio> element,
so the live analyser falls silent. This writes name.env.json beside the audio: three bands (low, mid, high)
at 25 frames a second, one byte each, base64. The player reads it and the visual follows the recording exactly.
Over http(s) the analyser is used and the sidecar is ignored.

usage: make_env.py file.mp3 [more.mp3 ...]      -> writes file.env.json beside each
Needs ffmpeg and numpy (both on this Mac). Never touches the audio file.
"""
import sys, os, json, base64, subprocess
import numpy as np
SR = 11025
RATE = 25
def env(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype='<f4').astype(np.float64)
    hop = SR // RATE
    n = len(x) // hop
    x = x[:n * hop].reshape(n, hop)
    win = np.hanning(hop)
    X = np.abs(np.fft.rfft(x * win, axis=1))
    f = np.fft.rfftfreq(hop, 1 / SR)
    lo = X[:, (f >= 60) & (f < 300)].mean(1)
    mi = X[:, (f >= 300) & (f < 1500)].mean(1)
    hi = X[:, (f >= 1500) & (f < 5000)].mean(1)
    def norm(v):
        v = np.sqrt(np.maximum(v, 0))
        p = np.percentile(v, 97) or 1.0
        v = np.clip(v / p, 0, 1) ** 0.8
        # a touch of smoothing so the picture breathes
        k = np.array([.15, .7, .15]); v = np.convolve(v, k, mode='same')
        return (v * 255).astype(np.uint8)
    data = np.stack([norm(lo), norm(mi), norm(hi)], 1).reshape(-1)
    return {'rate': RATE, 'bands': ['low', 'mid', 'high'], 'frames': int(n), 'duration': round(n / RATE, 2), 'data': base64.b64encode(data.tobytes()).decode()}
for p in sys.argv[1:]:
    base = os.path.splitext(p)[0]
    j = env(p)
    with open(base + '.env.json', 'w') as fh: json.dump(j, fh, separators=(',', ':'))
    # the same data as a script, because fetch() is refused on file:// pages; site.js loads this when the JSON cannot be read
    key = os.path.basename(base)
    with open(base + '.env.js', 'w') as fh: fh.write('window.AP_ENV=window.AP_ENV||{};window.AP_ENV[' + json.dumps(key) + ']=' + json.dumps(j, separators=(',', ':')) + ';\n')
    print(f"{os.path.basename(base)}.env.json/.js  {j['frames']} frames  {j['duration']} s  {os.path.getsize(base + '.env.json')} bytes")
