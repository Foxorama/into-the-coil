# 0479 — The flame slows, and the void lasts

**Accepted 2026-10-04.** Item 4 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md)
(its 8 and 11), from the second set of notes that day:

> *"the 'fire' projectile rate is too fast, not that the fire rate is too fast. there's barely any time
> to see it, let alone dodge it. on both the fish and the hydra"*
>
> *"the void bomb needs to last 1 sec longer"*

## The flame

**It was the bullet, not the cadence.** `flame` flew at 1.8 a step, the fastest hostile bullet that
flies by a third — spit 1.4, quill 1.3, flak 1.0 — and the biggest. The fish throws it as a whip whose
tip flies `1 + reach` times the root ([0249](0249-the-eagle-summons.md)), with `reach` 0.9.

**The rule: `flame.speed` 1.1, and the fish's whip `reach` 0.5.** One row, because the flame is one
bullet thrown by three bosses and the plan refused a per-boss speed — the whip already has its own knob.
Seconds across the 95 units from the fish's station to a ship at 60, at Savior's `shotSpeed` (1.15),
arithmetic on the rows:

| | before | after |
|---|---|---|
| the fish's whip, root | 0.77 s | 1.25 s |
| the fish's whip, tip | **0.40 s** | **0.83 s** |
| the hydra's spray of flame | 0.77 s | 1.25 s |
| the gyre's wheel | 0.77 s | 1.25 s |
| the next quickest bullet any boss throws (spit) | 0.98 s | 0.98 s |

**What a parked ship takes did not move.** `scripts/weigh-threat.mjs` on the gyre and the hydra reads the
same hits a second before and after, gun for gun (the gyre 0.20–0.32 median, the hydra 0.36–0.42), so
the wheel's spiral did not close up and its `spin` is untouched. The paths are the same; what changed is
how long the player has to read them.

## Consider the screen: the flame is on it longer

A slower bullet is on the screen longer, so more of them are on it at once. The gyre's fight — curtains
of forty-one beside the wheel's flame — **peaked at 174 hostile bullets at Legend and 158 at Savior**,
flown by `scripts/weigh-stuck.mjs` ([0474](0474-a-wave-keeps-its-heading.md)) with the pool unbounded,
where the pool held 150. A curtain that meets a full pool comes out short, and the end of a short curtain
is a second way through: `tests/level.test.ts`'s *every wall arrives whole* reddened on the gyre's
seventh wall. **And at Legend the gyre's fight was already reaching exactly 150 before the flame moved**,
so the pool was at its edge on `main`. Every other level peaks at 80 or under, at every tier.

**The pool is 200** — the same tenth and more of headroom the player's shots keep over their worst.

## The void

**`rift.steps` 150, from 90**: two and a half seconds, amending [0377](0377-the-void.md)'s *"a second and
a half."* The hush holds for the rift and lengthens with it; `tests/void.test.ts` reads the row and passes
as it is. **The blast pool is 9, from 6**: a salvo thrown at the triggers' fastest holds eight rifts open
at once now, and a wreck's pyre is the ninth. At six, `tests/void.test.ts`'s salvo opened six of eight.

## The ledger

`tests/budget.test.ts`'s worst case is a running total with a line for every rise, and it moves
**691 → 744**: fifty more hostile bullets and three more blasts, fifty-three more blits of a baked bitmap
at the worst second of one fight, on a desktop target ([0153](0153-desktop-is-the-target.md)). The
particle share was not touched.

## Guards

**No new hard guard**, and that is [0295](0295-a-ranking-guard-is-a-content-limiter.md)'s answer: a guard
ranking every bullet against every other on speed is a content limiter. Instead, **a taste** in
`tests/authored.ts`, `0479-seen`: *every bullet a boss throws takes at least 0.8 s across 95 units at
Savior* — a whip's tip at `1 + reach` — read on every run, and unable to fail one. Met at 0.83 s.

**The pools are held by the guards that needed them**, and 0479's probes put each back:

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0479`:

| broken on purpose | went red |
|---|---|
| the hostile-shot pool at 150 under the slower flame | `EVERY WALL ARRIVES WHOLE` |
| the blast pool at six under the longer rift | `a salvo thrown as fast as the triggers allow opens every rift it throws` |

## Not held by any guard

**The flame's speed itself.** Put back to 1.8, nothing reddens; the taste prints it unmet. That is the
choice above, not an oversight.

## Owed

- **A play of the fish's last stage and the hydra's second head**: whether 1.1 is slow enough to read and
  fast enough to matter. One number.
- **A play of the void at two and a half seconds**, and whether the hush that lengthens with it is right.
- **The pyre and the gyre's wall at Legend**: the pool was full there before this change; a play at
  Legend is the first since it has room.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Content and pool sizes; nothing persisted.
