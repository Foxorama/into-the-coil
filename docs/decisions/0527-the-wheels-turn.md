# 0527 — The wheels turn

**Accepted 2026-10-05.** Item 7 of [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
The slot's rule is [0521](0521-the-hangar-opens.md)'s dash rule for a car's own rims, and
[0523](0523-cosmo-opens.md)'s *a bought thing fits any ship* for the one Cosmo's sells.

## The ask

> *"Each car authors its own set of rims"* — the plan's item 7, and after item 6:
>
> *"for the wheels, from Golf-Stars add the full sick spinning wheels from The Mothership into Cosmo's for
> 1000 shards"*

and, asked how the hangar should hold eight slots: *"Third tab"*, named *"Paint & Parts"*.

## The rule

**A car's wheels wear a rim: its own, the other car's once both are won in, or the Mothership's spinners
once they are bought — 1000 Star Shards at Cosmo's. The spinners turn, in the fight and on the card.
The ship's looks are fitted on a third tab, *Paint & Parts*, between *Hangin' Out* and *Cosmo's*.**

| | |
|---|---|
| **the rims** | `src/content/rims.ts`: the Firebird's gold snowflakes, the estate's whitewalls, and the Mothership's spinners — the predecessor's `ufo`'s landing-gear wheels: a cross of silver spokes on a dark dish, a hub here lit in the player's cyan. The Mothership's own had a silver rim and four hairline spokes; at the fight's camera a car's tyre is about five pixels in radius, under 0106's floor for both, so the cross is two bars half a radius thick, which is also what reads as turning. Each says where it comes from, its price, and how fast it turns (the spinners 0.7 s and 0.8 s a turn, front and back, as the Mothership's two did) |
| **the wheels** | on each car's row: where each wheel stands and its tyre's radius, said once in the predecessor's frame the cars were drawn in. The painters read them and so does the frame, so the picture and the turning wheel cannot part. A rim is drawn to the tyre it is put in, as fractions the cars' own drawings already used |
| **the slot** | `rim` on the hangar slice, each car's own by default and `null` on a ship with none. `rimOpen`: a car's rim on the dash's rule, a sold one once owned, nothing on a ship without wheels |
| **the shelf** | `src/content/wares.ts`: everything ownable — the dangles and the rims — in one list, so `owned` is one record and the shelf is everything with a price. Item 10's flame is a line there |
| **the tab** | *Paint & Parts*: the pilots again (one setting, three bands), their card, and the wheels. The plan's nose art, livery and flame go here as they land; *Hangin' Out* keeps the dash, what hangs, the gun and the special |
| **the turning** | a pool of two over the ship, stepped by hand as the exhaust is: while a car flies on a rim that turns, a picture of it stands over each wheel, swelled to that tyre, turned at its rate, wearing the ship's hurt twin when the ship does. The card on *Paint & Parts* turns the same two pictures with the stylesheet, still for a reader who asks for less motion |
| **the fit** | 0526's gun scope became a `Fit` — the gun and the rim — so one re-bake carries every look; the run's row carries the rim as it carries the gun |
| **kept** | a new field on `itc_hangar` version 1, per ship, refused unless its wins or purchases open it; `owned` gains the rims |

## Why it is built the way it is

**A turning picture, not a turning bake.** A rim baked into the hull cannot turn, and baking the car at
enough angles to turn would be dozens of sprites for one look. Two blits of one small bitmap, turned by
the blit's own `turn`, is the whole cost: the frame budget is 746, two over 744, with the reason beside
the number. The baked hull wears the spinner still, which is what every other picture of the car shows
— the readout's icon, the intro — and the turning one covers it exactly.

**The third tab was asked for, with the layout it saves.** At four slots the hangar already filled a
1280x720, and eight bands and the pilots do not fit a 480x320 at all. Measured at all three sizes: the
tab clears the readout and Back keeps the screen with nothing scrolling.

**One table of what can be owned.** The shelf was the dangles with a price. A rim on it, and a flame
after, would have made the shelf a union of tables at every place it is read; one list read off the
tables is the explicit registry 0016 asks for.

## Rollback

`rim`, and the rims in `owned`, are new fields on `itc_hangar` version 1. Reverting leaves them unread:
every car rolls on its own rims, and spinners bought are kept in the key, unread, until it returns.

## What guards it

`tests/wheels.test.ts`: the ask (on the shelf at 1000, turning), every car on its own, the rule for each
kind of rim, nothing on a ship without wheels, the band and the shelf's words, the key, the run's row,
and **the spinner turning once round in 0.7 s** — in the seconds the player watches, with the back wheel
out of step — flashing with the car and gone with it. `tests/wheels.browser.test.ts`: bought at Cosmo's,
fitted on *Paint & Parts*, and turning on the card. The run flying them was photographed on both cars,
two frames apart, and is not held by a browser guard: nothing in the page names a wheel. Probes in
`scripts/probes/0527-the-wheels-turn.mjs`.

## Owed

- A play of the spinners on both cars, and the eye on the silver against each place's colours.
- *Paint & Parts* filling as items 8, 9 and 10 land.
