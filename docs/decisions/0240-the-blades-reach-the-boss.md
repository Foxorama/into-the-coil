# 0240 — The blades reach the boss

**Accepted 2026-09-05**, the same day as [0239](0239-the-guns-answer-the-third-play-test.md), from
[`the-blades-played-again`](../../reports/the-blades-played-again-2026-09-05.md):

> *"shurikens need to stretch out a bit further as well, same original problem as the lightning,
> it doesn't reach far enough and as a result you have to get too close to bosses… autofire gun
> colour symbol needs to be more orangey and the regular fire missiles icon needs to be more orangey
> to match the projectiles."*

Two items, both answered. **Amends [0237](0237-the-blades-answer-the-first-play-test.md)**: a
blade's ring is no longer centred on the ship, nor round. **Amends
[0239](0239-the-guns-answer-the-third-play-test.md)**: the first face of a pickup no longer keeps
the pickup ink.

## The rules

**A ring is centred ahead of the ship and stretched along the lane.** `BLADE_LEAD` is 30 and
`BLADE_STRETCH` 1.5 in `src/app/frame.ts`: a blade's place is the ship's, plus the lead, plus its
radius round an ellipse half again as long as it is wide. **A spiral centred on the ship cannot
reach a boss, however it is wound**: the ship flies about forty units from the edge behind it, so
a round ring about the ship leaves by that edge at forty-odd units out — before it is fifty ahead —
and a boss sits a hundred ahead. Lead and stretch together carry the same ring to eighty and more
ahead before the edge behind takes it, and it still sweeps the lane's width across. Held by
`THE REACH` in `tests/blades.test.ts` as a ratio in the player's units — further ahead than across
by at least two fifths — and never as the distance. Lead alone does not reach (the round ring still
leaves behind first) and stretch alone does not (the ring is still about the ship); both are probed.

**A blade still starts at the nose.** It begins at the BACK of its ring, at the radius that puts the
back of the ring `BLADE_START` ahead of the ship — so a throw still leaves the ship, and the ring
grows out past it. `THE SPIRAL` holds the start within a tenth of the lane of the nose.

**The winding is rewound for the longer ring.** `turn` is a tenth of a radian (from 0.12), so the
rim of a ring half again as long does not whip, and every rung of `orbit` opens slower again
(`[120, 150, 185, 220, 260]`) so the pitch stays where 0239 put it and the first rung still goes
round the ship once before the edge behind takes the blade. `THE SPIRAL` is measured as extremes
per turn now — each time round, further ahead and further across than the last — because a ring
whose back passes over the ship does not widen its distance from the ship on every step.

**The pulse's and the missile's faces are orange.** `INK_OF.pickupWeapon` and `pickupMissile` are
`bullet`, the ink of the projectiles they offer. 0239 had held the first face of each pickup to the
pickup ink so a fresh pickup read as one; that clause and its probe are retired. The bubble (0236)
is in the pickup ink on every face and is what says *pickup*; a pickup is eight units in a ring and
a glow, and no enemy shot is orange — `enemy` is what shoots at the player — so an orange face is
the player's own colour and not a thing to dodge.

## The figures, from a ship in the middle of the lane at its starting place

| rung | `orbit` | a blade lives | furthest ahead | furthest across | rim speed, units a step | blades in the air |
|---|---|---|---|---|---|---|
| 1 | 120 | 1.8 s | 116 | 54 | 8.4 | 4 |
| 2 | 150 | 2.0 s | 104 | 55 | 8.3 | 5 |
| 3 | 185 | 2.1 s | 95 | 48 | 7.2 | 6 |
| 4 | 220 | 2.9 s | 110 | 55 | 8.2 | 10 |
| 5 | 260 | 3.1 s | 102 | 51 | 7.7 | 13 |

Where 0239's ring got about fifty ahead at every rung, this one gets a hundred. The furthest-ahead
figure varies by rung with where in its turn the blade is when the edge takes it; the balance —
a sweep that now crosses a boss — is a hand's.

## ⚠️ What was rejected

**A lead per rung, on the arc's model.** The arc's reach ladder answers *too close to bosses* with
a climb; a blade's ring is already as wide as the screen at every rung, and what it lacked was
direction, not size. One lead and one stretch for every rung, and the rungs keep buying turns.

**A bigger stretch.** At seven tenths the rim covered eleven units a step — a blade at the lane's
edge crossing a fifth of the screen in a step — and the first rung left by the edge behind after
half a turn. Half, with a slower turn, keeps the rim under nine and the first rung round once.

**A ring that stays round and starts ahead.** It reaches, but a blade that pops into being thirty
units ahead of the nose is not thrown.

## What is owed

- **An eye on the ring in motion**, at the shipped camera: whether an ellipse ahead of the ship
  reads as the ship's whirlpool or as a thing it is towing.
- **The balance**, again: a sweep that reaches a boss is a stronger gun.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content, a flight and two inks;
nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0240`:

| broken on purpose | went red |
|---|---|
| the ring centred on the ship and round again | `THE REACH: a blade gets much further ahead` |
| the ring left round, so a lead alone does not carry it | `THE REACH: a blade gets much further ahead` |
| the blade started at the front of its ring | `THE SPIRAL: a thrown blade starts at the nose` |

And `0237` and `0239`, re-run over the moved constants and the retired clause: every probe still
red.

⚠️ **The ring is gone and so are these probes** — [0242](0242-a-blade-coils-ahead-of-the-ship.md)
replaced it with a coil up the lane, and the lead and stretch the three breaks touched no longer
exist. The table above records a session that was real on the day; `tests/prove-guard.test.ts`
carries the exemption, and 0242's table covers what replaced it.
