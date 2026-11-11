# Open Water, next version: what changed and how it was tested

Working copy: `play/next/open-water/`. The live piece at `play/open-water/` is untouched.
Not live. The site publishes from `launch` only.

## What changed

Only the picture, the light and the motion. Every word, every rule, the scene order and the
game logic are the same as the live piece (checked by script: all 79 prose strings and all
page text from the original are present, unchanged).

- **One WebGL canvas behind the SVG** (`ocean.js`) draws the sky and the sea for every scene:
  a lit, moving sea with real swell seen from a low camera; dense stars with a soft Milky Way
  at night; dawn colour at the shore, a high hazy sun in the calm, a low sun and glitter path
  at dusk; a storm with black cloud, heavy swell, whitecaps, rain and lightning that lights
  the water and the cloud. The swell scene shows the sea from directly above, lit from one side,
  under the same swell lines the game uses.
- **The SVG is transparent** and keeps the canoe, the rising stars, the tap targets, the tick
  marks, the clouds, the birds, the leaf, the island and the words. Tap targets are unchanged.
- **The canoe** is redrawn as a double-hulled voyaging canoe: two hulls lashed with crossbeams,
  a platform between them, one mast, a crab-claw sail on two spars, a steering paddle at the
  stern. It sits in the water (the hull below the waterline is seen through the water, with a
  line of wash) and rides the swell: its height and tilt come from the same wave sum the shader
  draws, so it lifts and heels with the sea. In the storm it climbs and drops with the big swell.
- **Sound** is exactly as before: off until the player turns it on, the same four spoken lines.

## Phone safety

- One WebGL canvas, pixel ratio capped at 1.5, a single pass, no post effects.
- No mix-blend-mode, no backdrop-filter, no animated filters.
- Rendering pauses on `visibilitychange`.
- If WebGL is missing, a still picture of each scene stands in (`img/still-*.jpg`, 232 KB in
  all, loaded only then) and the game plays exactly the same. Tested by script with WebGL
  switched off: all six scenes play, no errors.
- First load: 0.19 MB (page, ocean.js, site css, fonts, stars script). No video, no photos.
- Press-and-hold: no long-press menu, no text selection, no callout on the picture or the buttons.
- `prefers-reduced-motion`: the sea moves at a third of the speed and lightning does not flash.

## Paths

`../../shared/`, `../../js/`, `../../media/` and `../../books/` became `../../../`. The ending
link still goes to `../fireside/`. `noindex` is kept. There was no canonical link to remove.

## Tests

- Served the repo root locally and played all six scenes through by script with `?fast`,
  including both press-and-hold buttons, the three star rounds, both swell taps, the stillness
  in the calm, and the three signs, at phone size (390-px iframe, 2x) and at 1440x900.
  Console: no errors, no warnings. The ending link reads `../fireside/?open=all&from=open-water`
  and "Cross again" returns to scene 1.
- Same run with WebGL disabled: passes, stills shown.
- Captures: `phone-*.jpg` (390x844 at 2x) and `laptop-*.jpg` (1440x900), one or two per scene.
- Film: `play-phone.mp4`, 42 s, H.264, 390x844, 0.45 MB. Recorded at natural pace and
  played back at 1.85x so the whole crossing fits.

## Things to look at

- Headless Chrome rendered the shader in software; on a real iPhone the water will be smoother
  and the stars finer. Worth one look on a phone for frame rate.
- The swell scene keeps the game's line trains over the lit water so the directions stay easy to
  read; if the water alone reads clearly enough on a phone, the lines could be faded further.
