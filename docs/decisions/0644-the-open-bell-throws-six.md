# 0644 — The open bell throws six

**Accepted 2026-10-20.** Amends [0402](0402-the-jellyfish-is-glass.md)'s ring and discharges what
[0476](0476-the-jellyfish-opens.md) owed.

## The ask

[`the-road-to-v1`](../../reports/the-road-to-v1-2026-10-19.md) §2 measured 0476's owed check: on *Let
the Galaxy Burn*, the Thunderbolt's arc and the Aqua Duck's paintball never finish the jellyfish.
It offered three ways out and recommended fewer void blasts in the open phase. The answer was
*"Yes, cut the jellyfish's open-phase void ring from 8 to 6 blasts on every tier."*

## What was wrong

0476 found the arc on Burn stalling in the open phase and guessed the void. The guess was right, and
the paintball stalls the same way. The ship was held on the bell's lane 60 short, unhittable, with
missiles silenced, as `scripts/weigh-boss.mjs` flies it:

- **As built, the arc** kept her between 1,330 and 1,580 of 4,839 health from 65 s to the 200 s cap,
  with whole five-second spans of no damage at all while 50 to 73 void blasts were on the field.
- **With the void's appetite off** she died at 74 s. **With the feeding off** she stayed stuck, so the
  feeding is not the cause.
- **The paintball** stuck between 1,298 and 1,415 from 85 s, and died at 95 s with the appetite off.

The arc links to the nearest bodies, and the blasts are always nearer than the bell. A paintball is
spent on the first thing it meets. So on Burn's cadence, eight void a ring meant nothing from those
two guns reached her. A cadence of 72 instead of 48 did not free the arc; six a ring freed both.

## The rule

**The open phase throws six void a ring, on every tier.** The cadence is unchanged. 0402 took the
ring from ten to eight on *"it needs slightly less void balls firing"*, and this takes it to six. The
number is the row's, so every tier moves together, as 0356 has every tier move.

From the bell's lane, `weigh-boss medusa`, 60 / 45 short:

| | Burn before | Burn after | Savior before | Savior after |
|---|---|---|---|---|
| arc | never / never | 76 s / 75 s | 41 s / 42 s | 41 s / 42 s |
| paintball | never / never | 95 s / 94 s | 50 s / 49 s | 49 s / 49 s |
| ray | 362 s / 303 s | 99 s / 96 s | 50 s / 49 s | 50 s / 49 s |
| pulse | 204 s / 160 s | 118 s / 115 s | 65 s / 64 s | 63 s / 62 s |

Savior, the tuned tier, barely moves: the arc's forty-one seconds stays over 0260's forty-second floor,
and `tests/level.test.ts` holds that floor. What changed is the Burn fight's last fifth, where the
void stopped being a wall.

## What guards it

`tests/medusa.test.ts`, *and on Burn every gun finishes her from the bell's lane*. Every gun is held on
the bell's lane, 45 short (the ram against the hull), on Burn, and must finish her inside 240 s. **A
fight with no end is never correct**, so it holds every gun, not the two that stalled. That is why this
is an invariant and not a taste (0192). It costs 2.5 s.

The probe in `scripts/probes/0644-the-open-bell-throws-six.mjs` puts the ring back to eight.

## Not held by any guard

- **Whether six reads as a ring.** The open bell was meant to look like it is pouring out, and a quarter
  fewer may read thin. That is a play question.
- **The held lanes off the bell.** `weigh-boss` still reads *never* for the arc from the far lanes on
  Savior and Burn. That is the arc's reach, which 0476's test names as the arc's own, not the fight's.

## Owed

- **A Burn run with the Marmot or MMXXVI to the last boss**, and whether the open bell is still the
  hardest thing in the game.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): content only, nothing stored.
