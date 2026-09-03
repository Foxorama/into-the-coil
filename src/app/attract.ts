/**
 * The music room's flythrough — what is in front of the camera while a place plays.
 *
 * `docs/decisions/0213-the-room-is-a-flythrough.md`. Reported 2026-09-03, of the room
 * [0212](../../docs/decisions/0212-the-room-walks-the-level.md) had just given a moving camera:
 * *"the initial background screen has a bunch of enemies showing that scroll off-screen and then
 * there's no enemies at all showing again… can we do something fun (not necessarily enemies, but
 * something a bit fun and engaging for the background in addition to the screen scroll) and remove
 * the enemies from that starting screen."*
 *
 * ── EVERYTHING HERE IS A FUNCTION OF WHERE THE CAMERA IS, AND NOTHING ACCUMULATES ───────────────
 *
 * ⚠️ **THAT IS THE DESIGN, NOT A STYLE.** The room has a **seek bar** (0212), so the picture has to
 * be able to arrive at any position without having travelled there. A ship steered by adding a
 * velocity every step would land somewhere different depending on how the listener got there — drag
 * to 2:00 and the weave is wherever the accumulation happens to be, which is nowhere in particular
 * and different every time. Position as a pure function of `cameraAlong` means **a place looks the
 * same at 1:46 however you reached 1:46**, and it is what lets a headless test check the picture at
 * all.
 *
 * ⚠️ **AND IT IS WHY THE RENDERER STILL INTERPOLATES.** `src/render/scene.ts` draws
 * `prev + (now - prev) * alpha`, so the caller asks for the same position twice — once at the
 * camera's previous value and once at its current one — and the smoothness comes out for free rather
 * than from a second, differently-shaped copy of this arithmetic.
 *
 * ── NOTHING HERE IS SIMULATED, AND THAT IS THE ANSWER TO THE ONE CONSTRAINT ─────────────────────
 *
 * ⚠️ **Asked for as *"1 and 2 if we can do both without the ship getting hit by debris and
 * exploding"*.** The room is a screen `src/state/screens.ts` marks `steps: false`: `src/app/frame.ts`
 * returns before `stepEntities` and before `collide` ever run, so **there is no code path in which
 * anything here can touch anything else**. The motes are `DEBRIS` bodies, which carry radius `0`,
 * damage `0` and are drawn on the backmost layer. The guarantee is structural — the collision pass
 * does not execute — rather than a matter of keeping things apart, and `tests/room.browser.test.ts`
 * holds the ship's health across a whole walk.
 */

import { ACROSS_SPAN, MAX_ALONG_SPAN } from '../sim/camera.ts';
import type { Rng } from '../sim/rng.ts';

/**
 * How far the ship may stray from the middle of the lane, in world units.
 *
 * ⚠️ **A HAND'S NUMBER, ARGUED AGAINST THE LANE RATHER THAN CHOSEN.** The lane is a fixed hundred
 * (0023) and the ship is about seven across, so ±35 from the middle leaves it a clear eight units
 * off either wall at full deflection — visibly flying the lane rather than skimming it, and never
 * touching the box `docs/decisions/0074-the-box-is-drawn.md` draws.
 */
const WEAVE_REACH = 35;

/**
 * The two wavelengths the weave is built from, in world units.
 *
 * ⚠️ **TWO, AND DELIBERATELY NOT A COMMON MULTIPLE OF EACH OTHER.** One sine is a machine: it
 * arrives at the same place at the same rate for ever, and a listener watching for two minutes sees
 * the loop. Two that do not divide each other take **41 seconds** to come back into phase and read
 * as somebody flying.
 *
 * ⚠️ **In UNITS and not in seconds**, like everything else this project paces (0102), so the weave is
 * a shape cut into the level rather than a thing the clock does — and it therefore survives the seek
 * bar, which is what the header above is about.
 */
const WEAVE_LONG = 430;
const WEAVE_SHORT = 197;

/** How the reach is split between them. The long swing carries it; the short one stops it looping. */
const WEAVE_SHARE = 0.74;

const TAU = Math.PI * 2;

/**
 * Where the ship sits across the lane, at a given camera position.
 *
 * ⚠️ **The camera's position and not the ship's**, because the ship holds station in the camera's
 * frame — `SHIP_START_ALONG` is *"the ship's own place in the camera's frame"* and
 * [0023](../../docs/decisions/0023-the-long-axis-is-the-scroll-axis.md) is why the camera does not
 * follow the player. Feeding it the ship's own `along` would be the same number plus a constant and
 * would read identically, but it would say the weave belongs to the ship rather than to the level it
 * is being flown through.
 */
export function weaveAcross(cameraAlong: number): number {
  const long = Math.sin((cameraAlong / WEAVE_LONG) * TAU);
  const short = Math.sin((cameraAlong / WEAVE_SHORT) * TAU + 1.1);
  return ACROSS_SPAN / 2 + WEAVE_REACH * (WEAVE_SHARE * long + (1 - WEAVE_SHARE) * short);
}

/**
 * One drifting mote: where it sits in the field, and how much of the world's motion it takes.
 *
 * ⚠️ **`depth` IS A SHARE OF THE CAMERA'S OWN TRAVEL, WHICH IS THE ONLY PARALLAX AVAILABLE HERE.**
 * `src/render/surface.ts`'s `blit` takes one scale for the whole frame, so an entity cannot be drawn
 * smaller to read as further away — the sky gets its depth from tiled layers and an entity cannot.
 * What an entity CAN do is move: a mote that carries 70% of the camera's travel falls behind at 30%
 * of the world's rate and reads as distant, and one at 10% rushes past like something close. **The
 * depth is a rate, not a size**, and that is a limit of the painter stated rather than worked around.
 */
export interface Mote {
  /** Where it starts in the band, as a fraction of it. */
  phase: number;
  /** How much of the camera's travel it carries, `0` (fixed in the world) to `1` (fixed on screen). */
  depth: number;
  /** The lane it holds, in world units across. */
  lane: number;
  /** How far it sways across, in world units, and over what wavelength. */
  sway: number;
  swayOver: number;
}

/**
 * How many motes the field carries.
 *
 * ⚠️ **AGAINST `CAPACITY.debris`, WHICH IS 160**, so this spends under a third of the pool a run uses
 * for the fragments of things blowing up — and the room never blows anything up, so the rest is
 * genuinely spare rather than borrowed. It is a **budget** in
 * [0192](../../docs/decisions/0192-a-guard-holds-an-invariant.md)'s sense and `tests/budget.test.ts`
 * owns the number it is spent from.
 *
 * ⚠️ **48 is a hand's number and it is a TASTE, not a measurement.** Enough that the lane never looks
 * empty at any depth, few enough that it reads as dust rather than as weather — the sky is what
 * carries weather (0112), and a mote field competing with it would be two answers to *what is the
 * background*.
 */
export const ATTRACT_MOTES = 48;

/** The band a mote lives in: everything the widest device can see, plus a margin behind the camera. */
export const MOTE_BAND = MAX_ALONG_SPAN + 20;

/**
 * Deal a field of motes. Seeded, so the room looks the same every time it is opened.
 *
 * ⚠️ **A FRESH STREAM, ON `seedField`'s OWN TERMS** — 0021. The field is dealt when the room is
 * entered, and a generator shared with anything else would make the dust depend on what the player
 * did before opening the menu.
 *
 * ⚠️ **THE DEPTHS ARE SPREAD RATHER THAN RANDOM ACROSS THE WHOLE RANGE.** A uniform draw clusters,
 * and a clustered depth field has visible bands of dust all moving together; walking the index
 * guarantees the spread and leaves the randomness to where in the band each one sits.
 */
export function makeMotes(rng: Rng): Mote[] {
  const motes: Mote[] = [];
  for (let i = 0; i < ATTRACT_MOTES; i++) {
    motes.push({
      phase: rng.range(0, 1),
      // 0.12 to 0.78: never fixed in the world (which would rush past faster than anything a level
      // contains) and never fixed to the camera (which would be a speck stuck to the glass).
      depth: 0.12 + (i / ATTRACT_MOTES) * 0.66,
      lane: rng.range(2, ACROSS_SPAN - 2),
      sway: rng.range(0.5, 4),
      swayOver: rng.range(120, 420),
    });
  }
  return motes;
}

/**
 * Where a mote is along the lane, at a given camera position.
 *
 * ⚠️ **WRAPPED INTO THE BAND AHEAD OF THE CAMERA, WHICH IS WHAT MAKES A FIXED POOL AN ENDLESS
 * FIELD.** A mote that simply fell behind would be gone for good and the room would empty out over
 * two minutes — which is **exactly the defect this file was written to fix**, seen from the other
 * side: the seeded bodies scrolled off and nothing replaced them.
 *
 * ⚠️ **The double modulo is not superstition.** JavaScript's `%` keeps the sign of its left operand,
 * so a camera behind a mote's origin yields a negative remainder and the mote is placed behind the
 * player, off screen, for ever. The same footnote `src/app/chrome.ts`'s focus ring carries.
 */
export function moteAlong(mote: Mote, cameraAlong: number): number {
  const from = cameraAlong - 20;
  const raw = mote.phase * MOTE_BAND + cameraAlong * mote.depth;
  return from + (((raw - from) % MOTE_BAND) + MOTE_BAND) % MOTE_BAND;
}

/** Where a mote sits across the lane. A slow sway, so a still frame is not a grid of dots. */
export function moteAcross(mote: Mote, along: number): number {
  const swayed = mote.lane + mote.sway * Math.sin((along / mote.swayOver) * TAU);
  return swayed < 0 ? 0 : swayed > ACROSS_SPAN ? ACROSS_SPAN : swayed;
}
