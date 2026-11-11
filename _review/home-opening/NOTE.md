# The new opening of the home page

Branch `claude/home-opening-v2`. Nothing on `launch` has changed. A hidden preview copy is at `home-next/index.html` (noindex, paths fixed for one folder deeper) so it can go on a preview link before anything goes live.

## What changed, in plain words

**The music.** The 30-second creek loop is gone from the opening. In its place is *Peaks Opening*, an original piece of 3 minutes 18 seconds, composed and synthesized from scratch in `tools/music/peaks_opening.py`. It is the first sound when a visitor presses *Sound on*, and it loops without a seam (the tail of the piece is folded into its head). Sound still never starts by itself.

**The film.** The six shots from the first launch were the base. Two were cut: the red-wall clip (the dog swims through it) and the handheld pan at the end of the pebbles clip. What remains is steadied, trimmed to its calm part, slowed to two-thirds speed, and graded to one filmic look (slightly lifted blacks, warm shadows, cool highlights, a soft vignette). Shots crossfade over 3.2 seconds with a slow drift. The shot-name label and the ripple overlay are gone.

**The layout.** The words sit on the left over a quiet, static shade so they always read; the picture breathes on the right with the breath ring over it. On a phone the ring sits over the picture at the top and the words follow on a near-solid shade. The gift links are two tidy hairline rows with a gold arrow; the breathing line and the voice button sit under them. The ring has a hairline guide, a soft gold disc and eighteen ticks (one a second: gold for the in-breath and the out-breath, quiet for the holds). Every word of the headline, lede, buttons, gift lines and breathing line is exactly as before.

**iPhone safety.** In the opening there is now no blend mode, no backdrop blur and no filter over the film (the ring used to carry a drop-shadow filter; the old sitting chip used a backdrop blur; the ripples canvas used screen blending). At most two films play at once (measured: never more than 2). Films pause when the opening is off screen or the tab is hidden. H.264 mp4, faststart, playsinline, muted, each with a poster that is its own first frame. The first phone load of the opening is one 52 KB photograph; the first film (1.3 MB) is fetched seven seconds later.

The site-wide top bar, bottom bar and menu are untouched. `shared/site.js` and `shared/site.css` are untouched, so no `?v=` or `sw.js` bump was needed.

## How the music is built

Everything is mathematics in numpy: no recordings, no samples, no voices anywhere. Eleven 18-second breath cycles (in 4 · hold 4 · out 6 · hold 4) make 198 seconds. A slow swell locked to the cycle is laid over the sustaining instruments, so the strings and the flute breathe with the ring. The arc: bowl and strings alone (cycles 1 to 2), the kanklės enters (cycle 3), the flute (cycle 4), the koto and the panpipes (cycles 5 to 8, the warm full middle), then the return to calm (cycles 9 to 11). Key: D Dorian, with the pentatonic D E G A B inside it, so the Baltic and the East Asian voices share one scale over one drone.

| Culture | Instrument | How it is made |
|---|---|---|
| Baltic | kanklės (Lithuanian plucked zither) | Karplus-Strong string with a tuned fractional delay, pick-position comb, velocity-dependent brightness, body resonances at 310/520/980/1650 Hz; rising modal figures on the in-breath, descents on the out-breath |
| Baltic | sutartinės spirit | an open fifth D–A, two strings struck together on every rest; the bass stays on D like a drone |
| Baltic | skudučiai (panpipes) | breathy flute model with heavy air, an octave in the tone, a chiff at the attack; two players trade short notes across the stereo field through the out-breath |
| East Asian | koto | the same string model picked near the bridge with a harder plectrum, longer decay, its own body (190/360/720/1250 Hz); pentatonic answers, closing with an octave pair |
| East Asian | shakuhachi-like flute | sine with soft harmonics, a scoop into each tone, vibrato that arrives late, shaped air around the fundamental, long tones through in-breath and hold |
| East Asian | temple bowl | six inharmonic partials (1, 2.71, 4.86, 7.36, 10.28, 13.6), each a detuned pair so it shimmers, with a 12 ms strike; the big bowl on every second in-breath, a small bowl at the rest |
| Western cinematic | string ensemble | four to six detuned voices per note, each with its own slow vibrato, a soft saw, a low-pass that opens with the swell, 2.4 to 3.6 s attacks |
| Western cinematic | cello / bass | the same section model, three voices, darker, with low body resonances; D pedal that walks to C, G and A in the middle |
| All | the hall | a generated stereo impulse (3.6 s, early reflections, highs dying faster than lows), convolved per instrument send |

Timing is humanised (±22 ms) and so is velocity (±7 %). No piano. Master: 48 kHz stereo, integrated loudness −20.0 LUFS (confirmed by ffmpeg's ebur128), true peak −5.7 dBTP (within the −2 dBTP ceiling), loudness range 11.6 LU.

Files: `media/sound/peaks-opening.m4a` (AAC 160k, 4.05 MB, registered for the opening), `media/sound/peaks-opening.mp3` (192k, 4.75 MB, used only by a browser that cannot play AAC), `_review/home-opening/music-excerpt-60s.mp3` (the middle minute, for the phone).

## The no-voices check

Whisper could not run here: this environment's network policy refuses the hosts that serve the Whisper models (huggingface.co and openaipublic.azureedge.net both answered 403/blocked), and no PyPI package carries the weights. So the proof is three things:

1. The composer script contains no audio input at all; every sample is computed. There is nothing in the file that was ever recorded.
2. PocketSphinx (CMU's recogniser, whose English model ships inside the package) was run over the whole 198-second file and, as a control, over a real voice line from the site. On the voice line it transcribed the sentence almost perfectly ("standing tall ... your body it is safe to think again"). On the music it produced only disconnected filler ("for a room nowhere favorite blue moon that's so to and ..."), the noise an ASR forced to output words makes over anything tonal, with no sentence and no phrase. Full output in `speech-check-pocketsphinx.json`.
3. A WebRTC voice-activity detector was also tried; it flags the old creek recording as 99.8 % speech, so it tells nothing and is not used as evidence.

If Whisper can be run on a machine with normal internet, the same check is: `whisper media/sound/peaks-opening.m4a --model base`; it should return no segments with a low no-speech probability.

## The clips

Used, all his own, from `media/`:
- `peaks-morning-2000.jpg` (the Peaks under morning cloud) opens the cut, 10 s, slow push-in
- `v-canyon-waterfall.mp4`, first 7.5 s, steady
- `v-pebbles.mp4`, stabilised over its whole length, then the calm middle (1.8 to 7.4 s) taken
- `peaks-trail-2200.jpg` (the trail to the Peaks), 10 s
- `media/video/v-creek-rapids-2.mp4`, tripod-steady water over the boulders, 12 s
- `v-rapids-white.mp4`, first 5.5 s, stabilised, the slow tilt kept
- `sedona-sunset-2200.jpg`, 10 s

Left out: `v-redwall-water.mp4` (the dog in the water), the end of `v-pebbles.mp4` (handheld pan), and, when looked at as alternates, the garden clips (a sign in frame), the lake clip (houseboats and a concrete ramp), the beach clips (crowds), the golf-course meadow (the dog again), the train-window canyon and the walking path (shaky).

Every clip is encoded twice: a portrait file for phones (576×1024, about 1.0 to 2.0 MB) and a landscape file for laptops (1280×720, about 1.6 to 3.3 MB); the page picks by the screen's shape. The stills are also two files each. Total in `media/opening/`: 16 MB on disk, of which a phone visit that watches the whole 60-second cycle fetches about 5.9 MB, and a laptop visit about 9.6 MB, spread over the minute.

## Page weight

First load of the opening on a phone: the page, the shared shell, fonts, and one 52 KB photograph; the first film (1.3 MB) begins fetching after seven seconds. The home page as a whole still fetches about 9.3 MB within six seconds on a phone, almost all of it the photographs and loops of the sections further down (the two biggest, 841 KB and 812 KB, are the Today section's pictures). Those sections were outside this job and were not touched; they are the next thing to lighten.

## Tests (Playwright, Chromium, repo served at the root)

- `/` and `/home-next/` at 390×844, 1280×800 and 1440×900: zero console errors, zero page errors.
- Sound is off before any press. Press *Sound on*: `media/sound/peaks-opening.m4a` plays (not paused, 2.4 s in after 2.5 s, label says *Sound off*). Press again: it stops, the bed is released, label says *Sound on*.
- *Begin one minute*: after 1.5 s the ring says *In* with a count, the disc grows from r 150 to r 215 by the *Hold*, the eighteen ticks are present, the button says *Breathing…*.
- Phone: at most two films running at any moment, sampled every half second for 24 s; the cut crossfades; scrolling the opening off screen pauses every film.
- Screenshots: `home-*.png` and `home-next-*.png` at the three sizes, plus `home-laptop-1440-sound-on.png` and `home-laptop-1440-breathing.png`.
- Phone film with the music: `phone-opening-26s.mp4` (720×1558, H.264 + AAC), the sound pressed on at frame 0, *Begin one minute* pressed at 5 s.

## Not done, and why

- Whisper, as above: blocked network. The PocketSphinx control check and the sample-free synthesis stand in for it.
- The old file `media/beds/bed-creek-oakcreek.mp3` is still in the repo because `play/crossing/` uses it; only the home page's registration changed.
