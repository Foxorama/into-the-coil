# 0679 — The intro's staging

**Accepted 2026-10-25.** Item 4 of [`the-port-planned`](../../reports/the-port-planned-2026-10-24.md), from
[`the-port-is-a-cutout`](../../reports/the-port-is-a-cutout-2026-10-24.md), on the player's answers: *"the Viper's pad
is violet"* and *"the intro camera pushes in slowly"*. It amends:

- [0416](0416-the-viper-has-a-pilot.md): her pad.
- [0414](0414-the-chase-is-a-chase.md): the camera.
- [0439](0439-the-top-is-one-strip.md) and [0500](0500-the-desk-has-a-bar.md): the strip's bar, during the intro.

## The ask

The intro's room had been lit and given its forms (0676, 0677). It still did not stage what happens in it:

- The two pads were one pad twice.
- The alarm was two dots brightening.
- The bay's field did nothing when a ship went through it.
- The camera stood still.
- On a desktop, the strip's bar was an empty black band over the top of the room for the whole intro.

## The rule

| | was | is |
|---|---|---|
| **Her pad** | the pilot's: its field and edge lights in the player's ink, its beam and pool cyan | hers, in her violet (`padViper`, `beamViper`, `padPoolViper`; `VIPER.pad`): the room says whose each pad is before either ship lights. The pad and the beam are one painter each, `paintPad` and `paintBeam`, taking the inks |
| **Over it** | wall | the Coil's crest: a serpent coiled three turns on a dark plate, in her accent (`crest`). A mark, not a word, on the voice rule |
| **Holding her** | nothing | two clamps, a jaw either side of her keel on a post with a hazard band (`clamps`). They sink into the pad and fade from `BEATS.viperLit` to `BEATS.viperLift` |
| **The alarm** | the two beacons brightening and growing once a turn | the beacons steady, its source. What turns is their light: a red wash (`alarmWash`, light) thrown along the wall at `ALARM_WALL` and on the deck. While a beacon faces the room its wash sweeps `ALARM_SWEEP` either side of it. The two beacons are half a turn apart, so one is always throwing light |
| **The field** | still | drawn a second time a unit off for `RIPPLE_STEPS` (12) after each ship's centre crosses the bay, flicking side to side and fading. The two steps are solved once from each launch's own curve (`VIPER_THROUGH`, `BLUE_THROUGH`), so the ripple is a function of the clock |
| **The camera** | the play view, still | `introViewInto`, beside `standViewInto`. The lane is grown to fill the screen's whole height, and between `BEATS.fadeIn` and `BEATS.cut` it is pushed in on by `INTRO_PUSH` (1.08) about the room's middle. The dark outside is the filled view, held. Kept inside the lane either way, so no edge shows past what is painted |
| **The strip** | the bar's band empty over the room on a desktop | no bar while the intro is up. The shell sets the surface to none on the intro and back when it ends, and on a resize while it is up |
| **The intro's atlas** | baked at the play view's scale | at `introSharpness`, the camera's closest by the cut, so the pushed-in room is not blitted up past what it was baked at |

## Done differently from the plan, and not done

- **The push-in is computed by the painter, not the shell.** `paintPort` calls `introViewInto` into module scratch
  every frame, which keeps it a function of `t` and keeps the shell's one view the play view. The plan had the shell
  set the intro's view each frame.
- **The camera also fills the height.** The bar's band could only become the room by the lane growing into it: the
  room is the lane's height. On a 1280×720 desktop the room is drawn 1.12 times its old size from the first frame,
  and 1.20 times by the cut. A touch screen has no bar, so it starts at its old size.
- **The music room still plays under the bar.** Its field is the game's own scene at the game's atlas's scale. A view
  with no bar is a larger scale, and the game's atlas would be baked again on entering the room and again on
  leaving. That cost is not this item's, and it is not done.
- **Clamps, not a chain or a cage.** The plan offered either. Clamps say what holds a ship to a pad, and a cage
  around her would have hidden the ship the player is meant to watch light.
- **The guard is `tests/staging.browser.test.ts`, not `tests/intro.browser.test.ts`.** The intro is read at one
  step off the shell's painter and atlases, as 0675's station is. The page's intro cannot be stopped at a step
  without taking its clock.

## What it cost and the guards it moved

- **The intro's atlas**, measured in the browser with the pilot at the default and the strip's bar at its size for
  16-pixel type:
  - At 1280×720 it went from 17.77 MB at the play view's 5.38 pixels a unit to 25.77 MB at the pushed-in 6.48.
  - At 1920×1080 doubled it is 61.09 MB either way, as that bake is already at its cap.
  - The bake took 45–96 ms before and 41–87 ms after at 720p, and 76–90 ms before and 69–119 ms after at 1080p
    doubled, three runs each, within each other's spread.
- **Blits a frame**, every one a blit of a baked bitmap:
  - Up to five more in the room: the crest, the clamps until she lifts, the facing beacon's two washes, and the
    field's second sheet for the twelve steps after each crossing.
  - Her pad, beam, pool and reflection replace the pilot's pieces she used to share.
  - `tests/budget.test.ts` is green; `INTRO_VIEW` is allocated once with its `// @setup:`.
- **`tests/intro.test.ts`**, two of its tests, now read the view the picture was drawn through at that step
  (`drawAt` returns it):
  - *carries the pilot from the run into the leap without a jump* had placed the leap through the first step's
    view, and the camera has pushed in since.
  - *draws every pilot's ship no bigger than the fighter was beside the bar door* had divided by the base view's
    scale. What it holds is the ship's size in the room, which the push does not change. Against the base view the
    fighter read 25.5 units at the boarding, 6 per cent of push.
- **`tests/staging.browser.test.ts`**, *0679*, new, at 1280×720 with the strip's bar, 1.2 s in:
  - Of the strip's 74.9-pixel band over the room, short of the bay, 1.000 was the room at landing. The bound is 0.9.
  - Each pad's edge lights are read by the pad's own blit. Hers are 160, 112, 201 and must be red and blue each at
    least 30 over green. The pilot's are 101, 168, 201 and must be green and blue each at least 30 over red.
- **Re-anchored:** both of `scripts/probes/0411-the-chase-begins-at-the-port.mjs`'s probes on the beacon line and
  on the line after `surface.clear()`, which this decision moved.

Probed in `scripts/probes/0679-the-intros-staging.mjs`:

- The intro drawn under the bar again: the band read 0.34 the room.
- Her pad lit in the pilot's cyan: it read 101, 168, 201.

**Not held by any guard:** the crest's drawing, the clamps' drop, the wash's sweep and strength, the ripple, and
how far the camera pushes. They are the picture's.

**Photographed** with `scripts/shot-intro.mjs` at 0.4, 1.2, 2.6, 3.4, 4.3, 6 and 10.3 s, at 1280×720 and
844×390:

- The first build's wash was too faint to find, and it is twice as strong.
- The ripple, twelve steps long, was not caught by shots taken on the wall clock at 3.0, 3.1 and 3.2 s.

## What is owed

- A play: whether the push-in is felt and is slow enough, whether the wash reads as a light going round, and
  whether the ripple is seen at all.
- Whether the ships are now too large on a desktop. 0461 asked for them a fifth smaller, and the fill and the push
  make the whole room up to 1.2 times larger on the screen by the cut.
