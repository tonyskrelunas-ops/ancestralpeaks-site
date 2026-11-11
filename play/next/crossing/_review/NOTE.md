# The Crossing, realistic version: review note

Working copy: `play/next/crossing/`. Not live. The site publishes from `launch` only; this branch is `claude/play-v2-crossing`.

## What changed

Only the picture, the light and the motion. Every word, every rule, the stage order and the game logic are the same as the live page. `var SHORT=false;` and its comment are untouched. A line-by-line diff of the script against `play/crossing/index.html` shows only the road drawing, the picture sources, the relative paths and the calls that tell the scene which place and hour to show.

- **A real place behind the words.** Two photographs stand in depth behind the whole page: the far country (sky and distance) and the ground close by (the bottom of the screen, fading into the far layer). The door shows the mountains across the lake at sunset. Choosing the desert brings cloud over the red buttes with a walked sand road in front. The mountains bring the trail under the ponderosas toward the peak, with the evening meadow in front. The ocean brings the long beach under the cliff, with dark rocks and surf in front. The story is told under the moon, by a far fire in a dark meadow. The wisdom brings the fire up close.
- **Light that changes with the day.** A plain colour wash crosses over from one hour to the next: dawn for the calm, morning for the sending, then morning, day, afternoon and gold across the five meetings, evening for the arrival, dusk for the story, night for the wisdom. The place crossfades, the light crossfades, nothing cuts.
- **Gentle motion.** The far and near layers drift slowly against each other (parallax), and lean a little toward the pointer on a laptop. The near ground sways in a gusting wind on the sand road and the meadow. One 2D canvas draws what is in the air: dust on the sand road, seed over the meadow, spray over the rocks, faint motes at dusk, embers at the fire.
- **The road.** Same path, same positions, same marks. It is now a trail of light with a figure walking it (cut from the red-trail walker photo), a shadow under the feet, and the four companions as small lights behind.
- **The calm.** The drawn stone is now the round photo of a stone held in a hand, inside the breath ring.
- **The three distances.** The drawn medallions are now round photo windows on each place (so the star-compass script is no longer loaded).
- **The costume card** and the carried box have a paper grain.
- Head: `noindex` added, canonical removed. Paths fixed for the deeper folder (`../../../shared/`, `../../../media/`, the home link and the book link). The ending link still goes to `../fireside/`.

## Media used

All from the site's own `media/img`, cut by `tools/prep.py` (earlier plates) and `tools/prep2.py` (this pass; Pillow and numpy only):

| plate | source |
|---|---|
| far-home.jpg | peaks-lake-sunset-2000.jpg |
| far-desert.jpg | sedona-sunset-2200.jpg (cropped above the slab) |
| near-desert.jpg | sand-road-1600.jpg (lower part) |
| far-mountains.jpg | peaks-trail-2200.jpg |
| near-mountains.jpg | peaks-meadow-evening-1400.jpg (lower part) |
| far-ocean.jpg | pacific-torrey-1400.jpg |
| near-ocean.jpg | pacific-rocks-1600.jpg (lower part) |
| far-night.jpg | fire-moon-1600.jpg |
| near-fire.jpg | fire-circle-1600.jpg (lower part) |
| walker.png | red-trail-walker-1600.jpg (recut cleaner: the red ground under the feet removed) |
| stone-hand.png, med-*.png, paper.jpg | from the earlier pass, unchanged |

Sound is unchanged: the Oak Creek bed and the spoken lines, off until asked for.

## Page weight

First load at the door, including the idle preload of every plate: about 2.5 MB (page 40 KB, pictures 3.3 MB on disk of which 2.5 MB are fetched on a phone). No video. No WebGL. Under the 6 MB limit.

## iPhone safety

- No `mix-blend-mode`, no `backdrop-filter`, no CSS or SVG filters anywhere. The near layer's top edge uses a static CSS gradient mask.
- No WebGL. One 2D canvas, devicePixelRatio capped at 1.5.
- Animation and the canvas stop on `visibilitychange` and resume when the page returns.
- Still fallback: under `prefers-reduced-motion` the canvas is hidden and the layers stand still; if the canvas is unavailable the photographs stand still and the game runs as before. The game script does not depend on the scene.
- Everything moves by transform and opacity only.

## Tests (all passed)

Served the repo root locally and played the whole game by script in headless Chromium:

- Phone 390×844 (page inside a 390 px iframe, mobile emulation): full desert run with a wrong answer first, then every right answer; mountains and ocean runs; all twelve monsters met across the runs; arrival, story, wisdom; the ending link clicked and landing on `/play/next/fireside/?open=all&from=crossing`.
- Laptop 1440×900: the same, starting with the mountains.
- Reduced motion: loads and plays, scene still.
- Console errors: 0. Page errors: 0. Failed requests from the game page: 0.
- Captures: `phone/` (32) and `laptop/` (31), one per stage. Film: `crossing-phone-play.mp4`, 44 s, H.264, 390×844, 2.0 MB, faststart, no audio.

## Things I am unsure of

- The lower veil and panel darkness are a judgment call: dark enough to read the words over any photo, light enough to see the ground. If Tony wants more of the place on phones, the panel gradient in `.stage` is the one line to lighten.
- The laptop view of the ocean under the evening wash goes a little grey-mauve. I eased it; it may want another look on a real screen.
- `play/next/fireside/` has its own path problem (it still asks for `../../shared/site.css` and shows unstyled). That is outside this task's folder and was left alone.
- The home and book links were also deepened (`../../../`) since the folder is one level deeper; when this copy is promoted to `play/crossing/` all `../../../` paths go back to `../../`.
