# 0567 — A fitting is felt

**Accepted 2026-10-07.** Item 8, the last, of the queue in
[the hangar family, reviewed](../../reports/the-hangar-family-reviewed-2026-10-07.md), its §7.

## The ask

The review: *"A fit that lands with a clunk and a ship that bobs on its pad feels like a fit; a pill
changing colour does not."* It listed the feel as owed a look in motion: the sound per action, the
ship answering a fit, and the balance counting on a purchase.

## The rule

| | |
|---|---|
| **the ship hops** | when anything on the ship on the pad is fitted or bought, it stands up off its beam and settles, with one small bounce, in under half a second (`hopAt` in `src/render/port.ts`). A pure function of the stand's clock and the step it was fitted at, so it allocates nothing in the frame loop |
| **a sound** | a fitting plays the pickup's cue, and a purchase the chime the sound setting plays when it is turned on. **Both are cues the game already has**: a new one is the synth's and the mix's, and needs the player's ear |
| **the balance counts** | a total that moved on a screen that stands counts from where it was to where it is over most of a second. The figure a reader hears and a test reads is said at once underneath. `prefers-reduced-motion` stills it. The same lines said again no longer rebuild the sheet, which the hangar's shell did on every press |

## Not done, and why

- **No sound for a step, a tab or a refusal.** A cursor step sounding on every press of a d-pad held
  down is a sound the player would turn off, and nothing in the cue table is the right size for it.
  It is a new cue, raised for the ear and not guessed at.
- **No haptics.** Nothing in the game vibrates today. A first vibration is a setting under 0024
  before it is a feature.
- **The dangle's swing when it is hung** is 0466's and already runs on the readout.

## What the guards say

`tests/stand.test.ts`: a fifth of a second after a fitting the ship's sprite stands more than six
pixels higher on a 1280×720 screen than with nothing fitted, and half a second after, it is back. Its
probe takes the hop out. The count was photographed mid-purchase, at 1015 on its way from 1240 to 990.

## What is owed

A listen: whether the pickup's cue and the chime are the right sounds here, or whether the hangar
wants cues of its own.
