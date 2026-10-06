# 0551 — The wheel is held closer

**Accepted 2026-10-06.** The Firebird's Catherine wheel, [0549](0549-the-wheel-is-playable.md), played and
changed again. Supersedes 0549's reach, leash, clock, ember life and tether width; the rest of 0549 stands.

⚠️ **Its throw, its life and three of its boss weights are [0553](0553-the-wheel-comes-round-sooner.md)'s since
2026-10-06**: each 0.4 s sooner. The numbers below are this decision's, kept as the record.

## The ask

> *"need to change the catherine wheel*
>
> *let's make it 60% instead of 75% of screen size to get a bit more control for the player*
>
> *the tether looks good, but it's still a bit too thick*
>
> *the end of the tether also starts on the hood of the car and then moves forward so the end attaches to
> the weapon nozzle*
>
> *the spark spray diameter needs a 20% reduction in size, it's very strong atm*
>
> *The timing needs be reduced for firing and for length of time the catherine wheel lasts, reduce both by
> 30% so that the wheel lasts 30% less time and refires 30% faster (keeping the same cadence for wheel
> decay and refire gap that we have now)*
>
> *and the decay wheel leaves a yellow disc on screen after the sparks have finished, physics wise, the
> disc would decay first then the last of the fired sparks would disappear, so it shouldn't be left
> hanging aorund like that."*

## The rule

**The wheel is thrown every six beats (2.4 s), lets go of its tether at 2.27 s and is gone at 2.67 s —
0549's clock at two thirds. It is thrown 60% of the screen ahead of the muzzle, or to the no-fly wall where
that is nearer. Its tether is 0.5 units either side, and is drawn starting on the muzzle the player sees.
Its sparks fly fourteen steps. While it burns down it shrinks to nothing and keeps throwing, so its last
sparks are still flying after it has gone.**

| | |
|---|---|
| **the clock** | `fireEvery` 216 → 144, `life` 240 → 160, `fade` 36 → 24, the tether's painted fade `TETHER_FADE_STEPS` 12 → 8 — every one two thirds |
| **the reach** | `reach` 0.75 → 0.6 of `view.alongSpan`; `leash` 0.8 → 0.65, moved with it (139 units on 16:9 over a 128-unit throw, as 170 was over 160) |
| **the tether** | `tether` 0.7 → 0.5: as wide as it lands, so the hurt width narrows with the picture |
| **its start** | `Entity.prevFromAlong`/`prevFromAcross`: the offset from the wheel to the muzzle the step before, so the painter draws the start between that and this step's |
| **the spray** | `emberLife` 17 → 14: the spray's visible edge 28.7 → 23.6 units from the hub, 18% in |
| **the burn-down** | `swell` and the hurtbox shrink from whole to nothing over `fade`; embers are thrown through it off the shrinking rim; the crackle cue still stops when the tether lets go |
| **the bosses** | each boss's `gunWeights.catherine` re-measured on `scripts/weigh-boss.mjs` — see below |

## Why it is built the way it is

**A third, not three tenths, because the gun is on the beat.** 30% off nine beats is 6.3, and every gun
throws on the beat grid (0094; `tests/wheel.test.ts` holds it). Six beats is the nearest, at a third off;
seven would be 22%. The ask's own condition — *"keeping the same cadence for wheel decay and refire gap"* —
says the shape of the overlap must not change, so the life, the burn-down and the tether's fade are all a
third off with the throw, and not 30% off a throw that is 33% off. The overlap is the same shape at two
thirds the size: 0.13 s from letting go to the next throw, 0.27 s of the last wheel burning beside the new one.

**The tether's root was on the hood because the painter interpolated one end.** A bolt is an entity at one
end carrying an offset to the other (0233), and the whole link interpolates as one thing — right for a
lightning link, which does not move. A tether's ends are a wheel flying out at five units a step and a ship
moving on its own. The wheel's end was drawn at its interpolated place and the muzzle's end at that plus
*this* step's offset, so it sat up to a step of the wheel's flight behind the muzzle — on the hood — and
slid forward onto the nozzle as the wheel slowed to hang. That is exactly what was reported. The fix
interpolates the offset as well, which is the muzzle's own interpolated place. A guard measures it in
pixels, painted half way between two steps while the wheel is still flying out.

**The disc decays first because the sim stopped its sparks first.** Until now the wheel stopped throwing the
step it began to burn down, and hung — darker, but whole and gold-hearted — for 36 steps while its last
embers lived 17. So for over a quarter of a second it was a yellow disc with nothing coming off it. Now it
shrinks to nothing over its burn-down and throws throughout, so the last sparks are thrown on its last step
and outlive it by an ember's life. The hurtbox shrinks with it: a wheel that lands wider than it is drawn
would lie about what it is touching.

**The spray is 18% smaller, not 20%, because an ember's life is whole steps.** Measured as what the player
sees — how far the furthest ember gets from a hanging wheel's hub, plus the half of its cooled streak that
leads — 0549's seventeen steps reached 28.7 units; fourteen reach 23.6 (18%) and thirteen 21.6 (25%).
Fourteen is the nearer. The shorter life also means fewer sparks in the air at once, which is the
*"very strong"* half of the ask. The row's speed was left alone rather than tuned to make up the two points.

**The leash moved with the reach.** 0549 found a leash longer than a ship can get from its wheel never acts,
and its guard could not fail. Kept at 0.8 over a 0.6 throw, it would be 43 units of slack the wheel never
reaches in most flight; 0.65 keeps the same margin over the throw that 0.8 had over 0.75.

## The bosses

**0549 raised six weights because its wheel overshot; this one comes back onto the boss, so they come down.**
0549 found the wheel thrown to the wall hanging past the middle of most bosses, with most of its spray
missing, and raised each boss's weight to put the instrument's best place back on the floor. At 60% of the
screen, from the ship at rest, the wheel hangs on the boss again — and at 0549's weights the floor guards
went red by a factor of three (the fish in 12.7 s against forty). Flown on `scripts/weigh-boss.mjs`'s places,
the Catherine wheel alone, the quickest of held lanes and on its lane:

| boss | 0549 weight | at 0549's weight | 0551 weight | 0551 |
|---|---|---|---|---|
| jormungandr | 0.6 (the gun's) | 42.7 | unchanged | 42.7 |
| volans | 1.45 | 12.7 | 0.45 | 42.7 |
| quetzal | 1.8 | 23.6 on its lane | 1.05 | 43.8 on its lane, 56.6 held |
| gyre | 1.42 | 12.5 | 0.42 | 41.4 |
| hoarfrost | 1.6 | 22.9 | 0.9 | 41.6 |
| hydra | 0.9 | 26.8 on its lane | 0.57 | 41.2 on its lane, 69 held |
| medusa | 0.57 | 36.5 | 0.5 | 44.6 |

The quetzal at 1.15 met the floor in the Firebird and not in the fighter that borrows the wheel (38.9 s), so it
is 1.05; the medusa at 0.53 was 40.9 s, too near the floor for the ships that borrow it, so it is 0.5.

⚠️ **THE WHEEL NOW HAS A NARROW BEST PLACE AGAINST A BOSS.** The medians are three times the best: from the
ship at rest it hangs on the boss, and from 60 or 45 units short it is thrown past it, so only the tether
lands. That is the reach the player asked for meeting a boss; whether it should be answered — a reach that
shortens near a boss, say — is the player's call after a play, not something to tune away here.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). No storage, save schema or shipped surface
is touched: the gun's numbers are content, and the two entity fields are per-frame pool state, never saved.

## What guards it

`tests/wheel.test.ts`: 0549's clock at two thirds, to the step, and within half a beat of the 30% asked; the
reach as 60% of the screen from the back of the box and the wall from the middle of it; the tether lets go at
2.27 s; the disc shrinks over its burn-down with its hurtbox, keeps throwing, is gone with sparks still in the
air, and they are gone within an ember's life of it; the spray's visible edge within three points of four
fifths of 0549's, flown at both lives on the same flight; the tether's start painted on the muzzle the
player sees, to a pixel, between steps while the wheel flies out. The boss floors, in every ship. Probes in
`scripts/probes/0551-the-wheel-is-held-closer.mjs`; 0549's and 0545's re-anchored on the lines this moved.

## Owed

- **A play** on the Firebird: whether 60% gives the control asked for, whether the tether at 0.5 is thin
  enough, whether the burn-down reads as the wheel dying in a last spray and not as it vanishing.
- **A play against the bosses** at the weights above.
