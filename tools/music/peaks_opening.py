#!/usr/bin/env python3
"""
Peaks Opening — an original composition for the Ancestral Peaks home page.

Everything here is synthesized from scratch in numpy: no samples, no recordings, no voices.
One shared musical language for three audiences:
  Baltic      kankles (plucked zither, Karplus-Strong + body modes), skuduciai panpipes (breathy, hocketed),
              and an open-fifth drone in the spirit of sutartines (instruments only).
  East Asian  koto (plucked zither, picked near the bridge, pentatonic), a shakuhachi-like breathy flute
              with a scoop into each tone, and a temple bowl built from inharmonic partials.
  Western     a warm string ensemble (many detuned voices, slow attacks, moving low-pass) and a cello/bass
              foundation, the film-score bed under everything.
Shape: eleven 18-second breath cycles (in 4 · hold 4 · out 6 · hold 4) = 198 s, a slow arc from bowl and
strings, through the zithers and flutes, to a warm full middle, and back to calm; the tail is folded into
the head so the file loops without a seam.

Usage: python peaks_opening.py OUTDIR    (writes peaks-opening.wav, 48 kHz / 24-bit, -20 LUFS, <= -2 dBTP)
"""
import sys, os, math, json
import numpy as np
import scipy.signal as sg
import soundfile as sf

SR = 48000
CYCLE = 18.0
CYCLES = 11
LENGTH = CYCLE * CYCLES          # 198 s
TAIL = 14.0                      # rendered past the loop point, then folded into the head
rng = np.random.default_rng(2026)

def f_of(m): return 440.0 * 2 ** ((m - 69) / 12)
def sec(t): return int(round(t * SR))
def smooth(x): return x * x * (3 - 2 * x)

# ---------------------------------------------------------------- a stereo scratch buffer
class Bus:
    def __init__(self, name, send=0.3, gain=1.0):
        self.name, self.send, self.gain = name, send, gain
        self.L = np.zeros(sec(LENGTH + TAIL) + SR)
        self.R = np.zeros_like(self.L)
    def add(self, t, mono, pan=0.0, width=0.0):
        """pan -1..1 ; width adds a small decorrelated spread by a short delay on one side"""
        i = sec(t); n = len(mono)
        if i >= len(self.L): return
        n = min(n, len(self.L) - i)
        m = mono[:n]
        gl, gr = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
        self.L[i:i + n] += m * gl
        if width > 0:
            d = int(width * SR)
            self.R[i + d:i + n] += m[:n - d] * gr if i + d < len(self.R) else 0
        else:
            self.R[i:i + n] += m * gr
    def stereo(self): return self.L * self.gain, self.R * self.gain

# ---------------------------------------------------------------- instruments
def biquad_peaks(x, modes, gains, qs):
    y = x.copy()
    for f0, g, q in zip(modes, gains, qs):
        b, a = sg.iirpeak(f0, q, fs=SR)
        y += g * sg.lfilter(b, a, x)
    return y

def pluck(f, dur, vel, bright=0.6, decay=3.0, pick=0.22, kind='kankles'):
    """Karplus-Strong string with a tuned fractional delay, a pick-position comb and velocity-dependent brightness."""
    N = SR / f
    Ni = int(math.floor(N - 0.5)); frac = N - 0.5 - Ni
    n = sec(dur)
    # excitation: a burst of noise one period long, low-passed by brightness, combed by pick position
    ex = rng.uniform(-1, 1, Ni)
    lp = 0.25 + 0.6 * (1 - bright * vel)
    ex = sg.lfilter([1 - lp], [1, -lp], ex)
    pk = max(1, int(pick * Ni))
    ex = ex - np.concatenate([np.zeros(pk), ex[:-pk]])
    if kind == 'koto':            # a harder plectrum: a touch of the second harmonic and a sharper edge
        ex = ex + 0.35 * np.roll(ex, Ni // 2)
    x = np.zeros(n); x[:Ni] = ex
    g = 10 ** (-3 / (decay * f))                   # -60 dB at `decay` seconds
    a = np.zeros(Ni + 3); a[0] = 1
    a[Ni] = -g * 0.5 * (1 - frac); a[Ni + 1] = -g * 0.5; a[Ni + 2] = -g * 0.5 * frac
    y = sg.lfilter([1.0], a, x)
    y /= (np.max(np.abs(y)) + 1e-9)
    # a gentle fade so a cut-off tail never clicks
    r = sec(0.25); y[-r:] *= np.linspace(1, 0, r)
    return y * vel

def bowl(f, dur, vel, small=False):
    """A temple bowl: inharmonic partials, each a pair of slightly detuned sines so it shimmers, with a soft strike."""
    n = sec(dur); t = np.arange(n) / SR
    ratios = [1.0, 2.71, 4.86, 7.36, 10.28, 13.6]
    amps = [1.0, 0.42, 0.26, 0.14, 0.08, 0.05]
    decs = [dur * 0.55, 5.5, 3.2, 2.0, 1.3, 0.9]
    if small: ratios = [1.0, 2.76, 5.1, 7.9]; amps = [1.0, 0.5, 0.25, 0.1]; decs = [dur * 0.5, 3.0, 1.8, 1.0]
    y = np.zeros(n)
    for r, a, d in zip(ratios, amps, decs):
        beat = 0.6 + rng.uniform(0, 1.6)
        ph = rng.uniform(0, 2 * math.pi, 2)
        env = np.exp(-t / d) * a
        y += env * (np.sin(2 * math.pi * f * r * t + ph[0]) + np.sin(2 * math.pi * (f * r + beat) * t + ph[1])) * 0.5
    # the strike: 12 ms of low-passed noise
    s = sec(0.012); strike = rng.uniform(-1, 1, s) * np.linspace(1, 0, s) ** 2
    strike = sg.sosfilt(sg.butter(2, 3500, fs=SR, output='sos'), strike)
    y[:s] += strike * 0.35
    a = sec(0.004); y[:a] *= np.linspace(0, 1, a)
    y /= (np.max(np.abs(y)) + 1e-9)
    return y * vel

def tv_lowpass(x, cutoffs, block=2048):
    """Low-pass whose cutoff moves block by block (a filter following the bow pressure)."""
    y = np.empty_like(x); zi = None
    for i in range(0, len(x), block):
        fc = float(np.clip(cutoffs[min(i, len(cutoffs) - 1)], 200, 16000))
        sos = sg.butter(2, fc, fs=SR, output='sos')
        if zi is None: zi = sg.sosfilt_zi(sos) * x[0]
        y[i:i + block], zi = sg.sosfilt(sos, x[i:i + block], zi=zi)
    return y

def strings(f, dur, vel, voices=7, attack=2.2, release=3.0, detune=0.010, dark=0.0, vib_depth=0.0035):
    """A section: many detuned voices with their own slow vibrato, a soft saw, a low-pass that opens with the swell."""
    n = sec(dur + release); t = np.arange(n) / SR
    env = np.ones(n)
    a = sec(attack); env[:a] = smooth(np.linspace(0, 1, a))
    r = sec(release); env[-r:] *= smooth(np.linspace(1, 0, r))
    out = np.zeros(n)
    for v in range(voices):
        det = 1 + rng.normal(0, detune / 2)
        vr = rng.uniform(4.2, 5.6); vph = rng.uniform(0, 6.28)
        vib_on = np.clip((t - rng.uniform(0.6, 1.4)) / 1.2, 0, 1)
        drift = 1 + 0.0015 * np.sin(2 * math.pi * rng.uniform(0.05, 0.12) * t + rng.uniform(0, 6))
        freq = f * det * drift * (1 + vib_depth * vib_on * np.sin(2 * math.pi * vr * t + vph))
        ph = np.cumsum(freq) / SR + rng.uniform(0, 1)
        saw = 2 * (ph % 1.0) - 1
        tri = 2 * np.abs(saw) - 1
        out += (0.65 * saw + 0.35 * tri) / voices
    # bow noise, very low
    bn = sg.sosfilt(sg.butter(2, [1500, 5000], btype='band', fs=SR, output='sos'), rng.uniform(-1, 1, n)) * 0.012
    out = out + bn
    cut = (900 + 2600 * vel * (0.35 + 0.65 * env) ) * (1 - 0.5 * dark)
    out = tv_lowpass(out, cut)
    return out * env * vel

def flute(f, dur, vel, kind='shaku'):
    """A breathy end-blown flute: scoop into the tone, vibrato that arrives late, air in the sound, soft edges."""
    rel = 0.45 if kind == 'shaku' else 0.18
    att = 0.22 if kind == 'shaku' else 0.06
    n = sec(dur + rel); t = np.arange(n) / SR
    if kind == 'shaku':
        vib = 1 + 0.0055 * np.clip((t - 0.7) / 1.1, 0, 1) * np.sin(2 * math.pi * rng.uniform(4.6, 5.4) * t + rng.uniform(0, 6))
        scoop = 1 - 0.035 * np.exp(-t / 0.16)
        breath = 0.22; harm = [1.0, 0.28, 0.10, 0.05]
    else:   # skuduciai panpipe: more air, an octave in the sound, a short flutter at the start
        vib = 1 + 0.0025 * np.sin(2 * math.pi * 5.8 * t) * np.clip(t / 0.3, 0, 1)
        scoop = 1 - 0.012 * np.exp(-t / 0.05)
        breath = 0.5; harm = [1.0, 0.42, 0.08, 0.03]
    drift = 1 + 0.0012 * np.sin(2 * math.pi * 0.21 * t + rng.uniform(0, 6))
    freq = f * vib * scoop * drift
    ph = 2 * math.pi * np.cumsum(freq) / SR
    tone = sum(h * np.sin(k * ph + rng.uniform(0, 6)) for k, h in enumerate(harm, start=1))
    # air: noise shaped around the fundamental (the pipe resonance) plus a broad hiss
    noise = rng.uniform(-1, 1, n)
    res = sg.lfilter(*sg.iirpeak(min(f, 8000), 6 if kind == 'shaku' else 3, fs=SR), noise)
    hiss = sg.sosfilt(sg.butter(2, [900, 4200], btype='band', fs=SR, output='sos'), noise)
    air = (res * 0.8 + hiss * 0.12)
    env = np.ones(n)
    a = sec(att); env[:a] = smooth(np.linspace(0, 1, a))
    r = sec(rel); env[-r:] *= smooth(np.linspace(1, 0, r))
    swell = 1 + 0.12 * np.sin(math.pi * np.clip(t / max(dur, 0.1), 0, 1))     # a breath shape across the note
    chiff = 1 + 1.8 * np.exp(-t / 0.08)                                        # more air at the attack
    y = (tone + air * breath * chiff) * env * swell
    y /= (np.max(np.abs(y)) + 1e-9)
    return y * vel

# ---------------------------------------------------------------- the hall
def hall_ir(rt60=3.6, pre=0.018):
    n = sec(rt60 + 0.6); t = np.arange(n) / SR
    out = []
    for ch in range(2):
        noise = rng.uniform(-1, 1, n)
        env = np.exp(-6.91 * t / rt60)
        # high frequencies die faster than low ones: a cutoff that falls through the tail
        cut = 9000 * np.exp(-t / (rt60 * 0.45)) + 900
        tail = tv_lowpass(noise, cut, block=1024) * env
        # early reflections
        er = np.zeros(n)
        for k in range(10):
            d = sec(0.008 + 0.075 * k / 10 + rng.uniform(0, 0.006) + (0.0025 if ch else 0))
            er[d] += (0.5 - 0.04 * k) * rng.choice([-1, 1])
        ir = np.concatenate([np.zeros(sec(pre)), er * 0.35 + tail])
        out.append(ir / (np.sqrt(np.sum(ir ** 2)) + 1e-9))
    return out

def reverb(L, R, ir):
    return sg.oaconvolve(L, ir[0])[:len(L)], sg.oaconvolve(R, ir[1])[:len(R)]

# ---------------------------------------------------------------- loudness (ITU-R BS.1770-4)
def k_weight(x):
    # pre-filter (high shelf) and RLB (high-pass), coefficients for 48 kHz from the standard
    b1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]; a1 = [1, -1.69065929318241, 0.73248077421585]
    b2 = [1.0, -2.0, 1.0]; a2 = [1, -1.99004745483398, 0.99007225036621]
    return sg.lfilter(b2, a2, sg.lfilter(b1, a1, x))
def lufs(L, R):
    kl, kr = k_weight(L), k_weight(R)
    blk = sec(0.4); hop = sec(0.1)
    loud = []
    for i in range(0, len(L) - blk, hop):
        p = np.mean(kl[i:i + blk] ** 2) + np.mean(kr[i:i + blk] ** 2)
        loud.append(-0.691 + 10 * math.log10(p + 1e-12))
    loud = np.array(loud)
    g = loud[loud > -70]
    if not len(g): return -70.0
    rel = -0.691 + 10 * math.log10(np.mean(10 ** ((g + 0.691) / 10))) - 10
    g2 = g[g > rel]
    return -0.691 + 10 * math.log10(np.mean(10 ** ((g2 + 0.691) / 10)))
def true_peak(L, R):
    up = max(np.max(np.abs(sg.resample_poly(L, 4, 1))), np.max(np.abs(sg.resample_poly(R, 4, 1))))
    return 20 * math.log10(up + 1e-12)

# ---------------------------------------------------------------- the composition
D = {'D3': 50, 'E3': 52, 'F3': 53, 'G3': 55, 'A3': 57, 'B3': 59, 'C4': 60, 'D4': 62, 'E4': 64, 'F4': 65, 'G4': 67,
     'A4': 69, 'B4': 71, 'C5': 72, 'D5': 74, 'E5': 76, 'F5': 77, 'G5': 79, 'A5': 81, 'B5': 83, 'D6': 86}
def hum_t(t, s=0.022): return max(0.0, t + rng.normal(0, s))
def hum_v(v, s=0.07): return float(np.clip(v * (1 + rng.normal(0, s)), 0.05, 1.0))

def compose():
    busB = Bus('bowl', send=0.55, gain=0.62)
    busS = Bus('strings', send=0.45, gain=0.46)
    busC = Bus('cello', send=0.35, gain=0.55)
    busK = Bus('kankles', send=0.38, gain=0.50)
    busO = Bus('koto', send=0.40, gain=0.50)
    busF = Bus('shakuhachi', send=0.5, gain=0.42)
    busP = Bus('skuduciai', send=0.5, gain=0.30)
    log = {'bowl': 0, 'strings': 0, 'cello': 0, 'kankles': 0, 'koto': 0, 'shakuhachi': 0, 'skuduciai': 0}

    # dynamics of the arc, one value per cycle: soft, rising to the warm middle, back to calm
    dyn = [0.34, 0.42, 0.50, 0.58, 0.70, 0.82, 0.92, 0.80, 0.64, 0.50, 0.40]
    # the chords, one per cycle (D Dorian; the bass stays on D like a drone, then walks)
    chords = [
        [38, 45, 57, 62],                # D open fifth
        [38, 45, 50, 53, 57],            # Dm
        [38, 45, 50, 53, 57, 62],
        [38, 45, 55, 59, 62],            # G over D (the Dorian colour)
        [38, 45, 50, 53, 57, 64],        # Dm add9
        [36, 43, 48, 52, 55, 60],        # C
        [38, 45, 50, 53, 57, 62, 65],    # Dm, full
        [43, 50, 55, 59, 62, 67],        # G
        [45, 52, 57, 60, 64],            # Am
        [36, 43, 48, 52, 55, 62],        # C add9
        [38, 45, 50, 57, 62, 69],        # D open, the return
    ]
    cello_line = [38, 38, 38, 38, 38, 36, 38, 43, 45, 36, 38]

    for c in range(CYCLES):
        T = c * CYCLE; v = dyn[c]
        # --- strings: the chord swells in over the in-breath, every voice its own slow attack
        for i, m in enumerate(chords[c]):
            hi = m >= 57
            y = strings(f_of(m), CYCLE - 1.5 + rng.uniform(0, 1), hum_v(v * (0.9 if hi else 1.0), 0.05),
                        voices=6 if hi else 4, attack=2.4 + rng.uniform(0, 1.2), release=3.4, dark=0.0 if hi else 0.4)
            busS.add(hum_t(T - 0.8 + i * 0.25, 0.05), y, pan=rng.uniform(-0.65, 0.65)); log['strings'] += 1
        # --- cello / bass foundation
        y = strings(f_of(cello_line[c]), CYCLE + 0.5, hum_v(v * 0.95, 0.04), voices=3, attack=1.8, release=4.0, detune=0.006, dark=0.6, vib_depth=0.0025)
        y = biquad_peaks(y, [110, 205, 330], [0.5, 0.35, 0.2], [2.5, 3, 4])
        busC.add(hum_t(T - 0.5, 0.05), y, pan=-0.12); log['cello'] += 1
        if c in (5, 7, 9):  # an answering upper note in the out-breath
            y = strings(f_of(cello_line[c] + 7), 7.0, hum_v(v * 0.6), voices=3, attack=1.2, release=2.5, detune=0.006, dark=0.5)
            busC.add(hum_t(T + 8.2), y, pan=0.1); log['cello'] += 1
        # --- the temple bowl: the big bowl on every second in-breath, the small one at the rest
        if c % 2 == 0:
            busB.add(hum_t(T + 0.05, 0.01), bowl(f_of(50), 16, hum_v(0.5 + 0.45 * v)), pan=-0.1); log['bowl'] += 1
        else:
            busB.add(hum_t(T + 14.2, 0.03), bowl(f_of(69), 7, hum_v(0.35 * v + 0.15), small=True), pan=0.3); log['bowl'] += 1
        # --- kankles: rising figure on the in-breath, a ring on the hold, a descent on the out-breath, an open fifth on the rest
        if 2 <= c <= 8:
            rise = [[62, 64, 65, 69, 71, 74, 76], [62, 65, 69, 74, 76, 81], [62, 64, 67, 69, 71, 74, 79], [62, 65, 67, 69, 74, 77, 81]][c % 4]
            fall = [[76, 74, 71, 69, 67, 65, 64, 62], [81, 79, 76, 74, 71, 69, 65, 62], [79, 77, 76, 74, 71, 69, 67, 64], [81, 76, 74, 72, 71, 69, 67, 62]][c % 4]
            k = 0.55 + 0.45 * v
            for i, m in enumerate(rise):
                busK.add(hum_t(T + 0.35 + i * (3.3 / len(rise))), pluck(f_of(m), 4.5, hum_v(k * (0.7 + 0.3 * i / len(rise))), bright=0.75, decay=2.6, pick=0.18), pan=-0.35 + 0.1 * i); log['kankles'] += 1
            busK.add(hum_t(T + 4.3), pluck(f_of(rise[-1]), 5, hum_v(k * 0.8), bright=0.8, decay=4.0, pick=0.12), pan=0.2); log['kankles'] += 1
            busK.add(hum_t(T + 4.32), pluck(f_of(rise[-1] - 5), 5, hum_v(k * 0.6), bright=0.8, decay=4.0, pick=0.12), pan=-0.2); log['kankles'] += 1
            if c in (4, 5, 6):
                busK.add(hum_t(T + 6.1), pluck(f_of(74), 4, hum_v(k * 0.55), bright=0.7, decay=3.0), pan=0.3); log['kankles'] += 1
            for i, m in enumerate(fall):
                busK.add(hum_t(T + 8.2 + i * (5.2 / len(fall))), pluck(f_of(m), 4.0, hum_v(k * (0.85 - 0.3 * i / len(fall))), bright=0.6, decay=2.4, pick=0.22), pan=0.35 - 0.09 * i); log['kankles'] += 1
            # sutartines: the open fifth, two strings at once, on the rest
            busK.add(hum_t(T + 14.4), pluck(f_of(62), 4.5, hum_v(k * 0.7), bright=0.55, decay=3.2), pan=-0.4); log['kankles'] += 1
            busK.add(hum_t(T + 14.43), pluck(f_of(69), 4.5, hum_v(k * 0.6), bright=0.55, decay=3.2), pan=0.4); log['kankles'] += 1
        # --- koto: a pentatonic answer in the out-breath, picked near the bridge
        if 4 <= c <= 7:
            phr = [[81, 79, 76, 74], [74, 76, 79, 81, 79], [83, 81, 76, 74, 71], [79, 76, 74, 71, 69, 62]][c - 4]
            tt = T + 9.0 + (0.6 if c == 5 else 0)
            for i, m in enumerate(phr):
                busO.add(hum_t(tt + i * (0.55 + 0.1 * i)), pluck(f_of(m), 4.5, hum_v(0.5 + 0.4 * v), bright=0.9, decay=3.8, pick=0.11, kind='koto'), pan=0.55 - 0.1 * i); log['koto'] += 1
            # a koto 'kakezume': two quick strings, an octave apart, closing the phrase
            busO.add(hum_t(tt + 4.2), pluck(f_of(62), 5, hum_v(0.5), bright=0.9, decay=4.5, pick=0.1, kind='koto'), pan=0.5); log['koto'] += 1
            busO.add(hum_t(tt + 4.26), pluck(f_of(74), 5, hum_v(0.42), bright=0.9, decay=4.5, pick=0.1, kind='koto'), pan=0.6); log['koto'] += 1
        # --- shakuhachi-like flute: long tones, the whole in-breath and hold
        if c in (3, 5, 7, 9, 10):
            m1 = {3: 69, 5: 74, 7: 67, 9: 62, 10: 69}[c]
            busF.add(hum_t(T + 0.4), flute(f_of(m1), 7.2, hum_v(0.55 + 0.4 * v), 'shaku'), pan=0.15, width=0.0); log['shakuhachi'] += 1
            if c in (5, 7):
                m2 = {5: 72, 7: 65}[c]
                busF.add(hum_t(T + 8.6), flute(f_of(m2), 5.0, hum_v(0.5 + 0.3 * v), 'shaku'), pan=0.1); log['shakuhachi'] += 1
        # --- skuduciai: two panpipe players trading short breathy notes through the out-breath
        if c in (4, 5, 6, 8):
            pair = [[69, 74], [74, 76], [69, 76], [67, 74]][(c - 4) % 4]
            for i in range(6):
                m = pair[i % 2]
                busP.add(hum_t(T + 8.4 + i * 0.95, 0.03), flute(f_of(m), 0.62, hum_v(0.45 + 0.3 * v), 'pan'), pan=-0.5 if i % 2 == 0 else 0.5); log['skuduciai'] += 1
    return [busB, busS, busC, busK, busO, busF, busP], log

def main():
    outdir = sys.argv[1] if len(sys.argv) > 1 else '.'
    os.makedirs(outdir, exist_ok=True)
    print('composing…'); buses, log = compose(); print('events:', log)
    # body resonances for the zithers
    for bus, modes, gains in ((buses[3], [310, 520, 980, 1650], [0.45, 0.3, 0.18, 0.1]), (buses[4], [190, 360, 720, 1250], [0.5, 0.3, 0.16, 0.08])):
        bus.L = biquad_peaks(bus.L, modes, gains, [3, 4, 5, 6]); bus.R = biquad_peaks(bus.R, modes, gains, [3, 4, 5, 6])
    # the breath itself, a slow swell locked to the cycle, laid over the sustaining instruments
    n = len(buses[0].L); t = np.arange(n) / SR; tc = t % CYCLE
    swell = np.where(tc < 4, 0.72 + 0.28 * smooth(tc / 4), np.where(tc < 8, 1.0, np.where(tc < 14, 1.0 - 0.28 * smooth((tc - 8) / 6), 0.72)))
    swell = sg.sosfilt(sg.butter(1, 0.6, fs=SR, output='sos'), swell)
    for b in (buses[1], buses[2], buses[5]): b.L *= swell; b.R *= swell
    print('hall…'); ir = hall_ir()
    dryL = np.zeros(n); dryR = np.zeros(n); wetL = np.zeros(n); wetR = np.zeros(n)
    for b in buses:
        L, R = b.stereo(); dryL += L; dryR += R; wetL += L * b.send; wetR += R * b.send
    rL, rR = reverb(wetL, wetR, ir)
    L = dryL + rL; R = dryR + rR
    # fold the tail into the head so the loop is seamless
    Ls = sec(LENGTH); tail = np.concatenate([np.ones(sec(TAIL) - sec(2)), np.linspace(1, 0, sec(2))])
    tl = L[Ls:Ls + sec(TAIL)] * tail; tr = R[Ls:Ls + sec(TAIL)] * tail
    L = L[:Ls].copy(); R = R[:Ls].copy(); L[:len(tl)] += tl; R[:len(tr)] += tr
    # gentle top: a soft high-shelf-ish roll above 14 kHz and a DC/rumble cut
    sos = sg.butter(2, 28, btype='high', fs=SR, output='sos'); L = sg.sosfilt(sos, L); R = sg.sosfilt(sos, R)
    # master: -20 LUFS integrated, true peak at or under -2 dBTP
    cur = lufs(L, R); g = 10 ** ((-20 - cur) / 20); L *= g; R *= g
    tp = true_peak(L, R)
    if tp > -2.0:
        # a slow, transparent limiter: scale the few peaks that reach past -2.5 dBTP
        ceil = 10 ** (-2.5 / 20); env = np.maximum(np.abs(L), np.abs(R))
        env = sg.sosfilt(sg.butter(1, 40, fs=SR, output='sos'), env)
        gain = np.minimum(1, ceil / np.maximum(env, 1e-9)); gain = np.minimum.accumulate(gain[::-1])[::-1] if False else gain
        gain = sg.sosfiltfilt(sg.butter(1, 30, fs=SR, output='sos'), gain); gain = np.minimum(gain, 1)
        L *= gain; R *= gain
        cur = lufs(L, R); g = 10 ** ((-20 - cur) / 20); L *= g; R *= g; tp = true_peak(L, R)
    final = lufs(L, R)
    stats = {'length_s': LENGTH, 'lufs_integrated': round(final, 2), 'true_peak_dbtp': round(tp, 2), 'events': log, 'sample_rate': SR}
    print(stats)
    sf.write(os.path.join(outdir, 'peaks-opening.wav'), np.stack([L, R], 1), SR, subtype='PCM_24')
    json.dump(stats, open(os.path.join(outdir, 'peaks-opening.json'), 'w'), indent=1)

if __name__ == '__main__':
    main()
