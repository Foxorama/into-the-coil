# 0530 — The ions burn blue

**Accepted 2026-10-05.** Item 10 of [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md),
the last. Sold at [0523](0523-cosmo-opens.md)'s Cosmo's; fitted on [0527](0527-the-wheels-turn.md)'s
*Paint & Parts*.

## The ask

> *"also in the cosmetic shop Ion Thrusters - blue flame thrusters for your spaceship"*, priced *"Ion
> Thursters being 400 shards at the next tier"*; planned as *"the exhaust's ink becomes a slot; the blue
> flame is the first thing it sells, weighed against the frost shot on the frost ship's level before it
> ships."*

## The rule

**Ion Thrusters are 400 Star Shards at Cosmo's. Once bought they burn on any ship the player fits them
to, in the fight and in the intro; every ship burns the standard flame until then.**

| | |
|---|---|
| **the flames** | `src/content/flames.ts`: the standard, in the palette's own shot orange round the hazard's yellow, as the flame always was; and the ion, a royal blue round a periwinkle tongue. The white core is every flame's |
| **the shelf** | the ion is an ownable thing with a price, a line in `src/content/wares.ts`'s list beside the dangles and the rims |
| **the slot** | `flame` on the hangar slice, the standard on every ship; a bought flame on any ship, won in or not, as a dangle hangs on any dash |
| **the picture** | the exhaust is one set of sprites for every ship, since one ship flies at a time, so it is baked apart from a ship's hull: `bakeFlame` re-bakes the exhaust's frames in place — the ones its own table lists — when the flying ship's flame is not the atlas's. The intro's jets read the pilot's fit |
| **the band** | *Flame*, on *Paint & Parts* beside the tone; the standard, then the ion, shut until bought and saying where it is sold |
| **kept** | a new field on `itc_hangar` version 1, per ship, refused unless the document's own list owns the flame; `owned` gains the flames |

## The frost, weighed

The frost ship's shard and its hail are `#5ef0ff` — a hair from the player's own cyan, and the one level
where they are what kills. A cyan flame would trail a frost shard behind the ship there. So the ion is a
**blue**: `#3a5cff` round `#9fb8ff`, forty degrees of hue off the frost's and far deeper.

**Photographed** on the Rime's own sky, at the shipped camera and enlarged: the ion flame is a royal-blue
streak with a white core and no outline, pointed and always on the ship's nozzle; the shard is a cyan
six-point star in a dark outline, the hail a cyan octagon in one. Hue, shape and outline all differ.
What the photograph also showed: on the Rime's sky the blue is quieter than the orange — a play there is
owed. `tests/flames.test.ts` holds what a number can: the ion's two inks stay twenty-five degrees and more
off the frost's hue and the player's, and short of violet. That is a rule about this one flame and the
one shot it was weighed against, not a ranking of flames (0295).

## Why it is built the way it is

**The flame apart from the hull.** A ship's fit re-bakes its six hull sprites; the exhaust is shared, so
folding it into every ship's hull bake would have re-baked it four times for one change. It has its own
scope and its own re-bake, from the frames its own table names — never from a sprite's name (0016).

**Measured in the picture.** Nothing in the page names the flame, so the browser guard reads the game's
canvas in a run: 59 royal-blue pixels on the thrusters, twice, against 0 on the standard flame, at its
viewport.

**On a phone** the five slots of *Paint & Parts* pair off under the faces and the card goes, as it goes
on the shortest screen. Measured at all three sizes with type widened toward CI's: nothing scrolls.

## Rollback

`flame`, and the flames in `owned`, are new fields on `itc_hangar` version 1. Reverting leaves them
unread; every ship burns the standard flame, and thrusters bought are kept, unread, until it returns.

## What guards it

`tests/flames.test.ts`: the ask, the slot, the standard burning the palette's own inks, the ion's blue
off the frost and the player, the fit, the key. `tests/flames.browser.test.ts`: bought, fitted, flown, and
counted on the canvas. Probes in `scripts/probes/0530-the-ions-burn-blue.mjs`.

## Owed

- A play on the Rime with the thrusters on, against the frost ship's volleys.
