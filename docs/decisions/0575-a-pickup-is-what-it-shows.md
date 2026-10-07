# 0575 — A pickup is what it shows

**Accepted 2026-10-07.** Item 2 of [`the-arms-planned`](../../reports/the-arms-planned-2026-10-07.md).
**Supersedes [0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)'s cycle** and with it
[0236](0236-the-guns-answer-the-first-play-test.md)'s three seconds and
[0432](0432-the-key-cycles.md)'s turning key. **Amends [0256](0256-a-pickup-keeps-the-count.md)**: a level
authors places, not kinds. **Keeps [0447](0447-the-ward-is-a-third-trigger.md)**: a shield on a tier with
no shell is offered as the ward.

## The ask

> *"change all the ingame pickups to be a random pickup that doesn't rotate. The pickup spawns with a
> random powerup that can be a shield/missile or special weapon. It doesn't rotate and can be picked up
> as is — burn doesn't get shields still"*

Asked how the draw should go, given that a draw over every face makes the tubes two chances in nine:
*"mid-boss one of each"* — a kind first, at even odds, everywhere, and the mid-boss's three always one of
each kind.

## The rule

**A pickup is drawn on one face when it spawns and keeps it until it is taken or leaves.**

| | |
|---|---|
| **the kind** | a level's pickup place is drawn as the bomb, the tubes or the shield with a third each (`drawKind` over `DRAWN_KINDS`, the rows that say `drawn`). The mid-boss still throws `MID_BOSS_DROP`, one of each |
| **the face** | drawn with even odds among its row's faces (`drawFace`) — a gun special, straight or homing tubes, the plate, the void or the nova |
| **Burn** | a shield drawn on a tier with no shell is offered as its `bare`, the ward, whose faces are the void and the nova — as the mid-boss's was |
| **the stream** | `pickupRng`, a stream of its own (0021), **reseeded for every run from a seed the shell draws** (`makeLifecycle`'s `seedRun`); every other stream opens the same each run, and a pickup stream that did would deal the same pickups every run |
| **the wait** | `PICKUP_LINGER_STEPS`, every pickup alike: **fifteen seconds** — see below |
| **How to play** | one row per pickup with every face standing side by side, and a line a face saying what it gives; on a phone the faces are their names on one line |

## Why it is built the way it is

**A place, not a kind, on the level's row.** `PickupEntry` lost `kind`: the frame draws what is there,
so a kind written in the table would be a field nothing read. The places are the ask's as they were — a
fifth of the way in, and level one's two extras before the mid-boss and between the fights.

**The kind first and then the face**, because the player chose it: the tubes have two faces and the gun
specials four, so a face-for-face draw starves a run of tubes — and since item 3 a tube is how a ship
without bought tubes gets any.

**Fifteen seconds, and ten had stopped doing what it said.** The cycle's repetitions set every pickup's
wait — 24 seconds for the bomb, 18 for the shield, 12 for the tubes — and 0233's ten-second floor was
only ever a floor. Made the whole wait, it was measured: a pickup arrives at the front wall, falls back
the length of the box and leaves **without once turning**. 0364's zoom made the box longer and nothing
moved the floor, because every pickup's longer wait hid it. Measured on every kind, the wait's share
alone:

| wait | turns | comes back toward the player |
|---|---|---|
| 600 | 0 | 0 units |
| 720 | 2 | 16 |
| 900 | 2 | 63 |
| 1080 | 2 | 110 |

At 900 it bounces where a player can see it; that is the wait for every pickup. **The player may want
it shorter or longer** — the number is one constant.

**The key stopped turning because the field did.** A key that turned would teach a thing the field no
longer does. Eleven lines of faces put How to play 45–120 pixels under the fold on every phone size the
layout guard holds, so a phone shows the faces' names and the row's label still says what each gives.

**A fight is tuned for a run that drew its places at their odds.** The mid-bosses' healths are solved at
the loadout a run carries in (`carriedAt`, 0406), which read each place's authored kind. A place is a
third of a tube now, so the walk counts it as one — the thirds summed and floored — beside the mid-boss's
drop, which is a tube every time. CI caught the first push reading the field the table no longer has:
it counted no tubes at all and measured Ember Nebula's harrow at 21 seconds against its 18. At the odds
every mid-boss is inside 0269's three seconds, and no health moved.

## Rollback

None needed — no storage key, save field or shipped surface is touched.

## What guards it

`tests/weapons.test.ts`, *0575 — a pickup is what it shows*: through the real frame a pickup keeps one
face from spawn to leaving over a dozen runs' streams; the draw comes out a third each to three
hundredths over six thousand draws with every face seen; and the face shown is the face handed over.
`tests/pickups.test.ts`: a dropped piece drawn and kept, every face of the bomb seen over the drop's
draws; an authored pickup dealt a face past its first drawn as it to the cull; the places' budget and
where they stand; and the wander's turn at the back wall, which is what failed at ten seconds.
`tests/continue.test.ts`: a run begun on a seed is dealt from it, and two seeds deal apart.
`tests/hud.browser.test.ts`: the key's faces all up, still and apart. Probes in
`scripts/probes/0575-a-pickup-is-what-it-shows.mjs`.

## Owed

- A play: whether a pickup that cannot be waited out reads as a gift or as a lottery, and the fifteen
  seconds.
- [0502](0502-the-window-is-the-fight.md)'s window — next in the plan.
