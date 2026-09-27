# 0391 — A target takes a blade only so often

**Accepted 2026-09-27.** A target takes the shuriken's blades at most thirty times a second, however
many cross it, and a boss is one target — its hull and its body together. With the ceiling in, every
end boss's health is cut by about fifteen percent, and the serpent's flank counts again.
**Amends [0234](0234-a-blade-circles-the-ship.md)**, which counts a blade's landings per blade, and
**[0307](0307-the-serpent-is-armoured.md)**, which armoured the serpent.

## The ask

> Does it speed up because it has more hit box and the shurikens hit it more times? if that's the case
> let's cap the max number of shuriken hits on any one target. given there's two shurikens fired, and a
> large number of shurikens on field at any one time, it'll end up being more hits than a single
> lightning strike or bullet
>
> so do an analysis of level 4 weapons against level 2 mini boss for a 'hit per sec'

And, choosing the ceiling of thirty a second:

> should we reduce max boss health by 10-15% as well to account for the damage loss? it'll speed up the
> bosses for the other guns as well which won't be a bad thing. it'll also mean we can have the serpent
> boss on level one have hits count on body as well which make that fight feel a bit faster and more
> intuitive too

## What was measured

Landings a second, each gun at its last rung, firing on its own cadence through the real frame — the
flight of every shot included — from `scripts/weigh-boss.mjs`'s fifteen held places, the boss's health
held so the fight runs twenty seconds after three to settle. The best place:

| target | pulse | arc | shuriken, before | shuriken, with the ceiling |
|---|---|---|---|---|
| harrow (level 2 mid-boss) | 28 → 28 health/s | 21 → 62 | 28 → 56 | 23 → 47 |
| hydra, one head | 84 → 53 | 20 → 59 | 80 → 94 | 60 → 60 |
| hydra, five heads | 97 → 57 | 18 → 55 | **151 → 219** | 60 → 60 |
| gyre, either end | 60 → 60 | 23 → 68 | **89 → 178** | 30 → 60 |

**The report was right.** The pulse and the arc barely move between one head and five; the shuriken's
landings nearly double and its damage goes up 2.3 times, because a blade lands once per flash on
whatever it is crossing (0234) and five heads are more to cross. **And the gyre's slow first phase on
the shuriken was not the gyre**: its first and last phases measure the same at a steady state, so what
0386 saw there is in the fight's first seconds, which the steady state leaves out — not measured further.

## What changed

**The ceiling — `landGap` on the weapon row, two steps for the shuriken.** Each landing adds the gap to
the target's clock (`bladeIn`, counted down once a step), and a blade is refused — not spent, not landed
— while more than `BLADE_BURST`, four, landings are owed. A bucket and not a gate: a gate of one landing
every two steps clipped the harrow from 56 health a second to 43 while the gun averaged 28 landings
there, because blades arrive in bursts. With the bucket it is 47 — the ceiling does bite on the harrow
while blades are across it, which is what thirty a second means. **A boss's body shares its hull's
clock**, or five heads would be five ceilings. Shots spent by arriving are never held back; the
whirlpool special is not the gun and is untouched.

**The health.** Every end boss by fifteen percent, to the nearest ten, but two:

| boss | was | now |
|---|---|---|
| the serpent | 770 | **700** |
| Volans | 1520 | **1300** |
| Quetzal | 1640 | 1390 |
| the gyre | 1760 | 1500 |
| the hoarfrost | 1880 | 1600 |
| the hydra | 2000 | 1700 |
| Medusa | 2200 | 1870 |

Volans at 1300 and not 1290, because [0260](0260-a-boss-is-fought-to-the-end.md)'s floor reads 39.7
seconds at 1290. The serpent at 700 and not 650, because its flank counting already makes it quicker and
at 650 the shuriken a player can carry to it killed it in 26.8 seconds, under 0307's flown floor of 28.

**The serpent's flank counts again** (`hurt: 1`). 0307 armoured it because a blade rode the whole
133-unit flank; the ceiling answers that for every boss. Flown at 700 with the ceiling, the best fights
are 25 seconds on the shuriken, 26 on the arc and 51 on the pulse, where armour at 770 had them at 44,
29 and 68.

**Mid-bosses are unchanged.** Their health is solved against the seconds each level authors, at the
loadout they are met with (0269), and re-solved with the ceiling the table did not move by a digit. The
sentinel reads 14 seconds against its 17 before this change and after it; that is owed, and not this
change's.

**The phase bands stay where 0386 put them.** Re-solved with all of this in, none moves by more than a
point — and the shuriken is even now where it was not: 9.5, 9.1, 9.1, 9.1, 9.1 seconds across the
hydra's five phases, where it was 7.1 down to 3.7.

## Guards changed, and why

- **0260's arithmetic floor skips any boss with a chain**, where it skipped only an armoured one. It
  reads `health × toughness / FASTEST` — every shot of the fullest loadout counting — and says twenty
  seconds for a serpent the flown fight's quickest gun takes twenty-five over. The flown floor in
  `tests/serpent.test.ts` is the measure for a chain, as 0307 argued for armour.
- **0307's armour test runs on a row made for it**, the serpent's own wearing `hurt: 0`, as the
  half-share test already did: the mechanism outlives its only row's use of it. The serpent's own test
  holds the flank counting.
- **`tests/sound.test.ts` kills two bosses**, the serpent and the eagle: the serpent now dies through
  its body's drain, which left the hull pairing unexercised and its 0072 probe STILL GREEN.

## The guards, and that each was seen to fail

`tests/blade-ceiling.test.ts`, and seven breaks in `scripts/probes/0391-a-target-takes-a-blade-so-often.mjs`:

| guard | the break |
|---|---|
| THE REPORTED ONE, IN LANDINGS A SECOND: the hydra's five heads, flown, never over the ceiling | the ceiling gone; each head on a clock of its own |
| each target keeps its own clock, and a refused blade is neither spent nor landed | one clock for the whole pool; a refused blade marked landed |
| a shot spent by arriving is never held back | the ceiling reaching the pulse |
| the serpent's flank is a hit on the serpent | the flank armoured again |
| a boss dying through its body is heard | that death logged as an ordinary kill |

**Re-anchored**, on only what they break: 0034's two collision probes, 0072's boss pairing, 0124's two
healths, 0260's Volans, and 0307's hit log and serpent health.

## Not held by any guard

**The health numbers**, which are play numbers — [0192](0192-a-guard-holds-an-invariant.md). And **the
fights' lengths as a player flies them**: every end boss is shorter on the pulse and the arc and longer
on the shuriken than before this; owed a play.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
