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

## Third pass: the approved picture, brought to life

Branch `claude/play-v2-fireside-3`, made from `claude/fireside-photo`. The room is now the picture Tony approved on 11/10 (`src/hogan-red-rug-2528.jpg`: the log hogan at night, his red diamond rug on the centre wall, the light from the smoke hole, the fire in its ring of stones), moving. The picture itself is unchanged: nothing was added to it and nothing repainted. Everything that moves is laid over it.

What moves, in `scene.mp4` (1200 by 800, 3:2, H.264 High, faststart, 30 frames a second, 13.0 seconds, about 2.7 MB; `scene-poster.jpg` is a frame of it, about 148 KB):

- The fire is Tony's real flame from `media/video/v-fire-bowl.mp4`, two steady stretches of it (the first three seconds and a stretch near the end), cropped tight above the bowl so no city lights or garden are in it. The still scene behind the flame is taken away and only the moving light is kept, with its own colour; it is screened over the painted fire inside a large soft ellipse, scaled to the painted flame, so there is no box and no cut-out. The phone had blown the heart of the flame out to white; it is brought back to a hot yellow with orange edges.
- Firelight: a soft light map spreads from the fire across the floor, the stones, the near logs and the rug, and every frame the picture is multiplied by it according to how bright the real flame is in that frame, about plus or minus 8 percent at the fire and fading with distance.
- Three thin wisps of smoke rise slowly from the fire toward the light shaft, very faint; the shaft itself breathes very slightly (about 3 percent, twice a loop).
- A few embers lift off the fire and go out, never more than five in the air.
- Light soft film grain, new every frame.
- The loop is seamless: the last 0.8 seconds dissolve into the first.

The film is made offline by `tools/make_scene.py` (with `tools/flame.py` for the flame) in Python with numpy, Pillow and OpenCV, then ffmpeg (two passes, one keyframe, grain kept). Nothing is computed in the browser: the page is the poster, then the film fading in over it with a plain opacity change, muted, playsinline, loop, exactly as before.

On the page only two things changed: the picture frame is 3:2 instead of 5:4 (`aspect-ratio:3/2`) and the still and the film say 1200 by 800 instead of 960 by 768, so the whole picture shows, rug and fire both, on a phone at 390 px (366 by 244) and on a laptop (538 by 359). The words, the stories, the audio, the member logic and the CSS comment's neighbours are as they were. The alt text still carries the drawing's sentence; it says stars show through the smoke hole, which this picture does not show. It was left alone on purpose (the words were not to be changed); it is one sentence to revisit.

Checks run:

- Frames pulled from the film at 0, 3, 6, 9 and 12 seconds at full size and looked at: no box edge, no cut-out, the flame reads as real fire with a bright core and soft tips, the rug untouched.
- `phone-390x844-3.png` and `phone-390x844-listening-3.png`: the page inside a 390 px iframe at 2x, the film playing (`live`, not paused, 1200 by 800 decoded). `laptop-1440x900-3.png` at 1x.
- All four stories, in order: each started (audio not paused, time past 2 seconds, the bar moving, the card marked as playing). No console errors, no page errors, no failed requests.
- `room-phone-3.mp4`: the page at 390 by 844 for about 23 seconds: the room, the sound button, The Living Memory starting, a short scroll.
- The loop was measured frame to frame on the decoded film. The rendered frames join without a step. In the encoded file the first frame is the keyframe and carries a little more fine grain than the frames before it, so once a loop (every 13 seconds) there is a one-frame change in the grain about twice the usual frame-to-frame change. Four other encoder settings were tried and none removed it under the 3 MB limit; on a phone, where the film is shown at a third of its size, it averages out. Worth a look on a laptop.
