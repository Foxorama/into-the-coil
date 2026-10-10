# 0590 — The settings are tidied, and the game has a left hand

**Accepted 2026-10-10.** Supersedes [0070](0070-a-style-is-a-setting-and-the-first-one.md)'s *Look* band
and amends [0512](0512-the-touch-is-yours.md)'s trigger side into the hand. Sits under
[0024](0024-the-accessibility-floor-is-settings.md): a knob over the picture and the input, never over the sim.

## The ask

> *"Let's tidy up the settings in general and also add a setting to play left handed. Left handed is
> basically mirror mode so instead of flying to the right, you fly to the left and everything is
> correctly mirrored for that, buttons bosses, attacks etc. And let's remove retro mode from settings it
> was supposed to degraphic everything back to like atari64 graphics, but it's not doing that so it's just
> wasting space at the moment."*

## The rule

**Settings is four bands: Sound, Travel, Hand, and on a touch screen Steering.** The look is gone.

**Hand: Right or Left, on every device. Left is the field shown mirrored** — the ship flies to the left,
and every enemy, boss, bullet, beam, the sky and the box's wall are mirrored with it — **and on a touch
screen the trigger discs stand up the left edge.** The world steps the identical game in either hand.

## Why the look went

0070's Retro was *the game before the sky*: the parallax sky off and a monospaced chrome. It never
reached the sprites, so it was never the Atari-era look the ask now describes, and every art pass since
has been made in the default. It was a band on the screen that said *Retro* and delivered a sky toggle.

**Removed outright, not kept as a test instrument.** One guard leaned on it —
`tests/room.browser.test.ts`'s *opens on an empty lane, and keeps something in it for a whole walk*, which
counted lit pixels in a band of the lane with the sky off. Measured on the build before this change, the
same band held **about 1,070 lit pixels of sky against 76 of motes**, so with the sky on, deleting the
motes leaves the count green: the vacuous guard [0005](0005-a-guard-must-be-seen-to-fail.md) exists for.
It is deleted with the reason written where it stood ([0192](0192-a-guard-holds-an-invariant.md): a guard
is deleted with a reason). The field's arithmetic is still held by `tests/attract.test.ts` (*never empties,
at any point of any walk*). **What is now owed:** a picture-level check that the shell wires the motes into
the room, by some instrument other than turning the sky off.

A kept document written before this still carries `style`. [0510](0510-the-settings-are-kept.md)'s
per-field read ignores it and reads its neighbours; no version bump.

## How the mirror is made

**The canvas element is shown with `transform: scaleX(-1)`** (`applyMirror` in `src/app/mount.ts`). One
fact the compositor applies to the whole picture, so nothing in `src/render/` or `src/app/frame.ts` learns
a hand exists, no sprite is baked twice and no blit pays for a flip — the frame budget
([0025](0025-the-frame-budget-is-counted-not-timed.md)) is untouched.

**Pushes are read back through the same mirror in one place**: `combineDevices` in `src/app/devices.ts`
negates `along` after every device has added. A push to the screen's left is forward, on the keyboard, the
pad and the glass alike. `across` and the right stick's `aim` run up and down the screen, which a
left-for-right mirror does not cross.

**Not the port.** The intro and the hangar's tabs stand in a room with DOM over the canvas — doors over
the shopfronts, the dash at the ship — and the shop's sign is lettered in the canvas. Mirrored, every door
stands over the wrong shop. Nothing flies there. **The finale is mirrored**, because it is the fight's last
frame going on, and its speech bubble is placed at the mirrored mouth and hangs to its left.

**Landscape only**, which is the only orientation the field is flown in ([0031](0031-landscape-is-the-shipped-orientation.md)).

The readout stays as it is: its words must read left to right, and its ship is a counter, not the ship.

### Rejected

- **Flipping in the painters** — a negative-scale transform per blit, or every sprite baked twice. Costs
  per frame or doubles the atlas for an answer the compositor gives free, and puts the hand in the hot path.
- **Keeping the trigger side as its own band.** The ask is that the buttons are mirrored with the game;
  0512's *Left* already meant *a left thumb*, so it became the hand. A right-flying game with left-edge
  discs is no longer offered. If that combination is wanted back, it is a band of its own on the touch
  section.
- **Flipping each device's arithmetic.** Three devices each learning the hand is three places to be wrong;
  after the sum is one.

## Tidied

- The look's band, its table (`src/content/styles.ts`), its slice field, its saved field, the chrome's
  monospaced face and its stylesheet are deleted.
- On a touch phone the bands are **two columns of two** — Sound and Travel, then Hand and Steering — where
  they were three and two, and **each band's name is back over its track**: *Right · Left* and *Gentle ·
  Standard · Quick* with no name over them were choices the player had to read a hint to identify.

## What guards it

- `tests/hand.test.ts`: nothing in `src/sim/`, `src/render/`, `src/app/frame.ts` or `src/app/boss.ts` may
  import the hand; the combiner turns `along` and only `along`; the left arrow flies a mirrored ship forward.
- `tests/hand.browser.test.ts`: Left mirrors the field behind Settings and through a run (past the intro,
  which is not), Right puts it back, and the hangar is never mirrored; and the live option of a band is
  filled rather than coloured — 0024's floor, moved here from the look's browser test, which was never about
  the look.
- `tests/settings.test.ts`: the four bands in order and on which devices, every setting on exactly one
  screen (moved here from the deleted `tests/style.test.ts`), the slice outliving a run, and an old
  document naming the look read field by field.
- `tests/touch-section.browser.test.ts`: the hand is offered on a desktop, the steering is not, and Left
  still draws every disc where a left thumb is read.

Probes in `scripts/probes/0590-the-game-has-a-left-hand.mjs`, every one seen red. They carry 0070's three
breaks that were about every setting rather than the look (the slice's identity, its outliving a run, the
filled option), so `tests/prove-guard.test.ts` names 0070's table as re-proven here rather than unbacked.
