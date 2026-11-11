# By the Fire, upgraded room: review note

Branch `claude/play-v2-fireside`, folder `play/next/fireside/`. Nothing outside that folder was touched. The live site still publishes from `launch` only.

## What changed

The flat drawing of the hogan is gone. In its place the page shows one short film of the room, `scene.mp4`, with a still of the same room, `scene-poster.jpg`, underneath it.

The film was made offline, not in the browser:

- The room itself is built in three dimensions and lit from the fire: an eight-sided hogan of cribbed logs, the roof logs laid ring on ring and drawing in to the smoke hole, a packed-earth floor, a ring of hearth stones, three logs in the fire, and a plain plank door in the east wall, straight across the fire from where you sit. The walls carry nothing.
- The fire is Tony's own flame, keyed out of his fire-bowl video (`media/video/v-fire-bowl.mp4`, two steady stretches of it) and set on the logs.
- The firelight on the logs is re-lit every frame from how bright the real flame is in that frame, so the flicker across the walls and roof follows the real fire. Smoke rises to the smoke hole, embers lift off the fire, and stars show through the hole.
- 13.8 seconds, looping, 960 by 768, H.264 (High profile), faststart, 30 frames a second, about 1.4 MB. The poster is about 50 KB.

On the page: the video is `muted`, `playsinline`, `loop`, with a poster. It fades in over the still with a plain opacity change once it is playing. No `mix-blend-mode`, no `backdrop-filter`, no filters, no canvas, no WebGL. When a story is being told a faint warm glow (an ordinary translucent gradient, no blend mode) comes up over the lower part of the picture.

First load: the page, the shared stylesheet, the poster and the film come to about 1.5 MB. The story and fire audio load only when the visitor asks for them.

## What stayed the same

Every word on the page, the four stories, their order, their audio files, the free/member logic and `var all=true;` with its comment are exactly as they were. The alt text on the still is the same sentence the drawing carried.

Sound is still off until the visitor pushes the button or chooses a story.

## Small deliberate changes

- `<meta name="robots" content="noindex">` added; the canonical link removed; the stylesheet and home links go one folder deeper (`../../../`).
- Sound mix: while a story plays, the music now steps back to .16 (was .22) and the fire bed steps back to .26 (it did not step back before), so the voice sits clearly on top. Resting levels are fire .5, music .45.
- Page hidden (phone locked, tab switched): the film pauses and starts again when the page comes back. A story that is playing keeps playing. Before, the story was stopped as well; it was changed on purpose to match the brief. If no story is playing, the fire and music still pause as before.
- If the film cannot play (Low Power Mode, reduced motion, an old browser), the still stays and nothing else changes. A first touch anywhere on the page tries the film once more.
- `flame.mp4` is no longer used by this copy and was removed from it.

## Tests run

Served the repo root locally and drove the page with headless Chromium:

- Each of the four stories, in order: tapped, audio started (not paused, time moving past 2 s), progress bar moved, the card marked as playing, the fire and music ducked under it. All four passed.
- Hid the page while a story played: the film paused, the story kept playing. Passed.
- No console errors, no page errors, no failed requests.
- Screenshots: `phone-390x844.png` and `phone-390x844-listening.png` (the page inside a 390 px iframe, 2x), `laptop-1440x900.png`.
- Film: `room-phone.mp4`, the page at 390 by 844 for about 26 seconds: the room, then the sound button, then The Living Memory starting, then a short scroll.

## If it looks wrong on a real iPhone

The one thing to check by hand is that the film starts on its own on an iPhone with Low Power Mode off, and that with it on, the still shows and a tap starts the film.
