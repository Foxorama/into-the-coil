# 0416 — The Viper has a pilot, the jets surge, and the sky outside is the first level's

**Accepted 2026-09-29.** Venoma Krait runs out of the bar, hooded, with a bag in the Viper's acid, and
boards her ship before its engines light. Every launch the intro plays is seen as a surge of flame on
the step it is heard. The dark outside flies the first level's own sky at the first level's own rate,
the ships in it are framed smaller, and every fade is to the backdrop the screens either side are
drawn on rather than to black. **Amends [0411](0411-the-chase-begins-at-the-port.md)**, whose two star
tiles are gone, and **[0414](0414-the-chase-is-a-chase.md)**, whose zoom and beats move.

## The ask

> *"can we make the starfield for the ships cooler, like it looks super basic compared to the level 1
> starfield and it should kinda lead straight into level 1. zoom out on the ships a bit more, just so
> they're a bit tighter looking. And can we add a viper hooded character running to the viper ship as
> well? with a viper coloured golf bag too"*

> *"ooh we also need the jets to supercharge fire when the blast off happens in the movie as well to
> match the blast off sound they have"*

## What changed

- **The sky is the level's, not a copy of it.** The intro's atlas is its own pieces followed by every
  one of the game's (`withTheGame` in `src/render/port-bake.ts`) — two lists of references, recomposed
  whenever the game's atlas changes, because `CanvasSurface.setAtlas` is never called mid-frame and the
  sky lives in the game's. The painter is the level's own (`paintSky` in `src/render/scene.ts`, now
  exported with a sprite offset), with the layers `world.sky` holds, so a style with no sky has none
  here either. Outside, the camera behind it flies at `SCROLL_PER_STEP` — every layer at its own depth,
  exactly as in play — and it is not framed by the shot's zoom. Through the bay it drifts at a tenth of
  that. 0411's `stars` and `starsNear` tiles are deleted. **The rate is read in the painter
  (`SKY_SPEED` in `src/render/port.ts`), not in `src/content/port.ts`**, and it was in content first:
  `tests/combat.test.ts` keeps the ship's constants out of every content table, because a table naming
  them is a threat written relative to the ship. This is not a threat, but it is the sim's number and
  not the intro's, so the painter that draws the sky is where it is read — the guard was right about
  where it lives.
- **The intro's place is the first level's.** `placeOnScreen` answers `placeFor(0)` while the intro is
  up, so it is backed and coloured by the same path a run in it is. ⚠️ **Today that changes nothing,
  and it was checked rather than assumed:** `applyPlace` memoises on the backdrop colour, The
  Approach's is the palette's own, and so entering it from the title has never re-baked its sky —
  level 1 has always been drawn in the title's colours. The intro now shows what level 1 shows, and
  will follow it when that is fixed; the fix changes level 1's look and is its own piece of work.
- **The ships are framed at 0.65**, from 0414's 0.8. The fighter's place in the chase moved back from
  40 to 30 so the gap ON SCREEN is still the one 0414 asked for — the zoom shrinks every distance in
  the shot, and 0414's guard measured it at 32% of the screen where it holds 35%.
- **Venoma Krait** (`VENOMA` in `src/content/port.ts`, a `RunnerRow` — the type every golfer's row now
  extends): the Wyrm-Ship's green hood, its dark, its acid on the bag, sleeves to the wrist. The door
  slides back for her as the room fades up, she runs at nearly twice the pilot's pace and leaps for the
  canopy, and the Viper lights when she is in. The runner art takes a hood, a bag colour, trousers and
  long sleeves from the row, with the kit as the fallback, so the golfers are drawn as they were.
- **The beats moved by 186 steps from `viperLit` on** to make room for her — three seconds; the intro
  is 23 s where it was 20. Nothing about the chase changed but when it starts.
- **The surge** (`viperSurge`, `blueSurge`): a burn near twice a flare's length in its own bigger box,
  laid over the flame on each of the four steps a `launch` cue plays and dying back into the burn over
  the cue's roar, 0.95 s, on the roar's own curve.
- **The veil**: every fade goes to and comes up from the palette's space, which is what the splash, the
  golfers and the title are drawn on. The last frame was read off a photograph at `#0b0b14`, the title's.

## Guards

`tests/intro.test.ts`, in pixels at the screens it already draws at:

- **Venoma comes out of the bar door, is drawn every step until she is in, is in before the Viper's
  engines light, and runs into her leap without a jump**;
- **neither ship is ever drawn over her**;
- **on every `launch` in the cue table, a surge is drawn at full on that step, none the step before,
  and none once `SURGE_STEPS` have passed** — held against the cues, so a launch moved in one table and
  not the other fails;
- **every layer of the sky a place in space is built with is drawn outside, unzoomed, each moving
  `SCROLL_PER_STEP` × its depth a step — what it moves in a step of play — and the sky shows through
  the bay**.

Changed, with the reasons beside them: the fade tests now look for the veil rather than black; the
cue-twin table counts her steps and the surges; `drawAt` flies `SKY`, built the way `src/app/mount.ts`
builds it.

**Not guarded, and said:** the veil's colour is a bake and the test surface records sprites, not pixels
— it was read off the photograph; and `placeOnScreen`'s answer for the intro has no observable effect
until the memo above is fixed, so a guard on it would be green over its own deletion.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `scripts/probes/0416-the-viper-has-a-pilot.mjs`: nobody
running for the Viper; the Viper drawn again over her; her surge left out; a surge a tenth of a second
late; a surge that never settles — held at a fifth, because one that runs out draws nothing and the
guard passes over nothing; no sky outside; the sky at 0411's rate. Re-anchored, breaking what they
broke: 0401's vein flare (the sky's sprites are offset now), 0411's last beat, fades and frame, and
0414's chase gap. **And 0412's dead-door probe, which CI's full proof found STILL GREEN and mine did
not, because 0412 was not among the decisions I proved:** Venoma opens the bar's door too, so taking
out the golfer's door left hers playing the cue. It now takes out both.
A change reaches probes in decisions it does not name, and only the full proof walks them all —
[0005](0005-a-guard-must-be-seen-to-fail.md), met again.

## Owed

- A look at Venoma, and at the surges beside their sounds.
- **Level 1's own sky colours**, which it has never been drawn in — see above.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Nothing is persisted or shipped
past a page load.
