# 0640 — A pod pierces a wave and not a boss

**Accepted 2026-10-19.** From [`the-morning-play`](../../reports/the-morning-play-2026-10-18.md), item 4, option 1
of the four it put to the player. Amends [0375](0375-the-bomb-is-a-missile.md)'s pierce and
[0405](0405-the-surge-fires-one-down-the-middle.md)'s pod.

## The ask

> *"the supercharge missiles powerful seems to be really strong, how did we implement it and why is it so strong."*

The answer and its four options are in the report. The choice: *"Go with option 1 for the supercharge"*: a pod lands
on a boss once and keeps piercing a wave.

## What was measured

`flyCharge` in `scripts/weigh-boss.mjs` flies one charge from the first step the boss can be hurt. The ship sits on
the boss's lane at rest, the pulse fires, the fitted tubes are silent, and the ship cannot be hit. It reports the
health the boss lost over the charge's ten seconds, with the surge worn and without it.

| boss | health (savior) | the gun alone | overdrive, before | overdrive, now | hunt |
|---|---|---|---|---|---|
| jormungandr | 900 | 200 | 458 | 245 | 408 |
| volans | 1450 | 298 | 1948 | 541 | 482 |
| quetzal | 1460 | 228 | 381 | 255 | 436 |
| gyre | 1500 | 314 | 1872 | 557 | 522 |
| hoarfrost | 1800 | 410 | 976 | 554 | 618 |
| hydra | 1860 | 317 | 1674 | 506 | 525 |
| medusa | 1890 | 547 | 2752 | 780 | 754 |

The *before* column is the same run with `bossPierce` patched to the old twelve in the process. On four of seven
bosses one charge took 1,670 to 2,750 health, against an estimate from the code of about 2,000. Now the pods add 27
to 243 to what the gun does, about what a hunt charge adds.

## The rule

**A pod's `bossPierce` is how many landings a boss may take from it before it is spent.** Its `pierce` still goes
through everything else. Both surges author it, and both author `1`:

- **hunt** has a pierce of one, so it is unchanged;
- **overdrive** keeps its twelve through a wave and lands once on a boss.

A mid-boss is in the boss's pool and is a boss here.

- The count rides the shot, as `bossLeft` on the entity. The pod sets it from its row.
- `collideInto` spends it when its targets are a boss: the missiles' pass on the hull, and the pass on its body, which
  shares the count.

## What guards it

`tests/surge.test.ts`, *0640*, counted in what the player sees go. For every tube surge, over one charge at volans,
the landings on the boss are no more than the volleys fired × the pods a volley × the row's `bossPierce`. What volans
sends out is cleared each step, because a pod may pierce those.

The probe in `scripts/probes/0640-a-pod-pierces-a-wave-and-not-a-boss.mjs` hands the pod its whole pierce as its
boss allowance. Seen red: 27 volleys landed 162 times.

0375's *a pierced body does not spend an overdrive pod* is unchanged, and green.

## Owed

- **A charge on a boss in play**, whether it now reads as a pickup worth having, and whether once is right or
  twice is.
- `flyCharge` flies at rest on the boss's lane. A ram needs pressing against the hull, so its *gun alone* reads
  nothing there; `flyFight` is where the ram is weighed.
