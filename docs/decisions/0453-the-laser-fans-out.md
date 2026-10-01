# 0453 — The laser fans out

**Accepted 2026-10-02.** Amends [0388](0388-the-laser-is-jagged.md)'s one swing a row and its twelve
knots, and [0403](0403-the-tentacles-pull-out-of-the-heart.md)'s claim that one seed a volley keeps a
ship-wide gap.

## The ask

> *"for the lazer attacks, I wanted them jagged, but also having wider peaks and lows so that they
> spread out more*
>
> *If there's one lazer attack - centralised path over all, but the jagged high and low bits should
> spread out longer so it's harder to dodge*
>
> *two attacks - the center of the two attacks shouldn't touch, but the outside jagged path should be
> longer to cover more screen.*
>
> *three attacks - a fan pattern where the center attack behaves like now, the two outside attacks are
> angled a bit more diagonally outwards and have a jagged path like when there's only two.*
>
> *5 attacks is - a fan pattern where the inner two are angled but more contained path and the other two
> have a more deeper jagged penetration on the outside.*
>
> *at the moment the lightning boss attacks are jagged, but there's basically just straight lines still."*

## What changed

**A beam row's `jag` is a shape now, not a number.** `{ knots, paths }`: how many knots the row's beams
turn at, and one `BeamPath` per root, in `from`'s order. Each path has a `lean`, which is how far outward
its far end stands from its root (that makes a fan), and an `outward` and `inward` swing. Outward is the
side of the hull its root is on, so each half of a fan is authored once and mirrors itself. The bolt
stores the swing towards larger across (`jag`) and towards smaller (`jagLow`), plus `lean` and `knots`.
`src/sim/jag.ts`'s `beamShift` is the one place they combine, and the painter, the hurt and the rift all
call it.

**The shared code changed in three ways, and every beam feels all three.** The knot count rides the
row; `BEAM_MAX_KNOTS` (12) is only the painter's buffer. The knot's swing floor rose from a fifth of
the swing to half, because *"wider peaks and lows"* means no near-straight legs. And the last knot
swings only as far as its leg is long (below).

| beams | boss | knots | paths (lean / outward / inward) | half-width |
|---|---|---|---|---|
| one | quetzal's throat | 5 | 0 / 30 / 30 | 6 |
| one | hydra's pterodactyl head | 5 | 0 / 24 / 24 | 3 |
| two | quetzal's shoulders | 6 | 0 / 24 / 6 each | 1.5 |
| three | quetzal, everything | 6 | shoulders 30 / 24 / 6; throat 0 / 7 / 7 (*"like now"*) | 2.5 |
| five | jellyfish, first volley | 5 | outer 32 / 22 / 4; inner 14 / 12 / 5; middle 0 / 7 / 7 | 1.5 |
| five | jellyfish, held volley | 5 | outer 36 / 26 / 4; inner 16 / 14 / 6; middle 0 / 9 / 9 | 1.8 |

## Why it is built the way it is

**The shape is the row's, never a rule keyed on how many beams there are** —
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md). The ask is written per count,
and a `switch` on `from.length` would have encoded it in one place. But the hydra's single beam and the
quetzal's single beam already want different widths, and a sixth boss with two beams would inherit the
shoulders' character without saying so. Each row's numbers sit beside its roots in
`src/content/bosses.ts`.

**Fewer knots is the "spread out longer".** Twelve knots on a 150-unit beam was a turn every 11.5
units. Even an 18-unit swing read as a straight beam with a fringe on it, which was the report. Five or
six knots is a leg of 20 to 25 units.

## What was found on the way

**The jellyfish's gap was never a ship wide.** 0403's guard subtracted two half-widths from the tips'
spacing and called it the room *"the whole way down"*. That is true across the lane. But a ship is hurt
by the nearest leg, and beside a steep leg the room is the spacing times the cosine of its angle. This
was measured on the shipped twelve-knot zigzag (with the new swing floor), over the ship's whole box,
80 volleys. The best room between two neighbours at the worst along was **−0.5 lane units at the
median**: less than a ship. The guard now flies volleys and measures exactly that.

**The last leg made a beam leave its mouth sideways.** `beamT`'s shift makes the last leg anywhere from
nothing to a whole leg. A whole swing over almost nothing is a near-flat leg, and every pinch in the
first fan (down to −2.9) was at that one leg, 2% from the tips. Now the last knot swings only as far as
its leg is long, up to the full swing at half a leg.

**The lane is 120 across, not 100** (`ACROSS_SPAN`). `CLAUDE.md`'s *"`across` is a fixed 100"* is
stale. Two thresholds sized against 100 failed on first run.

## What was rejected

- **A count rule in shared code**, above.
- **More knots to keep the jellyfish's gaps open.** At four and five knots the pinch stayed where it was,
  because it was the last leg and not the leg count.
- **A guaranteed gap between the brace's three beams.** Their roots are 11 apart. The centre swings 7
  (the ask kept it as it was) and a shoulder swings 6 inward, so near the hull the two can meet.
  Measured, the gap pinches only in the last tenth of the beam, about 13 units from the hull. Down the
  lane the lean opens it, and lane is always open outside the fan. 0398 already called these gaps
  *"a thing a player can thread and not be sure of"*.

## Confirmed, not assumed

Measured on 80 volleys a phase in the game, in lane units, at the ship's whole along box:

| claim | measured | held by |
|---|---|---|
| one beam is central and sweeps wide | sweeps 45 / 53 / 57 (p10 / p50 / p90); mean lean 0.0 | `tests/quetzal.test.ts`, *one beam is central* (≥ a third of the lane, every volley) |
| two beams never touch their middle | worst clearance for a ship on the centre line: +1.5 | *two beams never touch the line between them* |
| the pair reaches further out than in | at the ship, mean outward ≈ 6, never inward past 6 | same guard, outward / inward > 2 |
| three is a fan, centre straight | at the ship the shoulders stand 14 out, the centre 0.4 | *three beams are a fan* |
| five is a fan with room between every two | worst room at any along: +0.86 / +0.19 (each phase) | `tests/medusa.test.ts`, *between every two neighbouring lasers* and *five lasers are a fan* |
| legs are longer | a turn every 19 to 25 units, from 9 to 11.5 | *the peaks spread out longer*, and the fan guard |
| the fan is drawn where it burns | every stroked point within 0.05 of a burning line | *THE PICTURE: the fan is drawn where it burns* |
| the picture | photographed on a scratch boss page at 1280×720: each count, held | eyes on, not a guard |

`node scripts/prove-guard.mjs 0453`: twelve probes, all red. **Re-anchored**, each on only what it
breaks: 0250's mouth warning, beam width and flicker; 0255's tip roots; 0388's painter branch, mouth
knot and *the ask*. All proven red again. One threshold was raised after its probe went red by only
0.4: an outer jellyfish laser's deep outside swing alone biases its far end about 5 outward. The fan
guard now asks for ten, so it is not reading the zigzag as the lean.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Nothing persisted moves.

## Owed

- **A play of the pterodactyl and the jellyfish.** The throat's beam is now much harder to dodge, which
  is what was asked. Whether it is too hard is the ear's and the hands' question, and every number
  above is the row's to change.
- **The hydra's lance** took the single-beam shape on its narrower beam, unasked by name. It was not
  photographed, because its head fires in rotation.
