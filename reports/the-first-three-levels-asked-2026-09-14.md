# The first three levels asked for — 2026-09-14

A brief rather than a play-test, and a plan rather than a build, under the standing instruction of
2026-09-10: *"when it comes to bullets and enemies, stop assuming, present a plan."* This file is
the record of what was said, what the levels measure as today, and the queue that answers it — one
PR each, in the order recommended — because chat evaporates between sessions
([0029](../docs/decisions/0029-the-tracked-record-is-the-record.md)). Nothing here is built.

## What was said

> *"levels 4, 5, 6 and 7 have decent enemy and bullet ratios, it's not perfect, but it's good.*
>
> *1,2,3 have sparse shooting enemies and a lot of the enemies that do shoot either start off the
> bottom/top of the screen or enter 1/2 to 3/4s of the way into the screen and barely shoot at all.*
>
> *almost all the shooting is straight patterns as well, there's no curving bullets, no patterns, no
> waves etc.*
>
> *basically, the game overall is a bit boring, we need more interesting enemies and more interesting
> flight paths for the enemy waves for the player to engage with, where they can curve back and come
> onto the screen again or have more than 5 enemies in a group so that the wave doesn't immediately
> die as soon as it appears, or be tougher but fly slower so they can be dealt with.*
>
> *Some of these differences can be level specific as well so that each level has a few more unique
> elements to it"*

## What was said back, later the same day

> *"keep the cap, patterns only, start on PR 1 — make sure that we still have some straight firing
> bullets an enemies — if everything curves or weaves we've over corrected.*
>
> *additionally, the 'announce with bullet' is the problem, enemies shoot too fast when they appear
> and die too fast without firing → sounds like an oxymoron but it's how the game feels. enemies need
> to appear, be recognisable, then fire. so there needs to be enough enemies in a group or they need
> to swarming in groups enough that some survive to fire. go with that and crank them out"*

So the queue's first item is not *a flanker announces itself* but
[0326](../docs/decisions/0326-an-enemy-is-seen-before-it-fires.md): a body is seen for half a second
before it fires, from either edge, with the groups the answer names. Its figures supersede the tables
below where they overlap. Two of the four questions are answered above (the cap stays; patterns only);
the two place-only bodies still want names, and the pool stayed at 40 without needing more.

The third item landed the next day as [0327](../docs/decisions/0327-a-shot-has-a-path.md), with the
two path arms on rows the levels send — the picket's ripple and the spinner's curl — because a guard
refuses an arm nothing flies. The second item was folded into 0326. The fourth landed on 2026-09-16
as [0328](../docs/decisions/0328-a-body-flies-an-arc.md), with a ninth shared kind, the swift, to fly
the arc; the plan's *spend the loop on other kinds* was refused there, on 0258's own terms.

## What is there today, measured

Three instruments, all driving the real frame at the tier `tests/world.ts` defaults to (the
gentlest) — `scripts/weigh-bullets.mjs` as it ships, a census of the wave tables, and
`scripts/weigh-presence.mjs`, which lands with this report and tags every body by where it entered
and counts what it did while it could be seen
([0027](../docs/decisions/0027-measure-the-picture-not-the-model.md): the instrument before the
first tuning pass).

### The tables — what each level sends

| level | waves | bodies | bodies that can fire | what the firing bodies throw |
|---|---|---|---|---|
| 1 The Approach | 69 | 357 | 108 (30%) | spray 108 — 49 lancers at ONE straight shot, 21 pickets at a fan of two, 38 turrets at a fan of three |
| 2 Ember Nebula | 75 | 342 | 144 (42%) | spray 73 · wall 33 (wardens) · aimed 35 (moths) · spiral 3 |
| 3 Saurian Belt | 66 | 315 | 155 (49%) | spray 136 — **96 lancers**, 40 turrets · wall 19 |
| 4 | 67 | 355 | 111 (31%) | wall 78 (sowers) · spray 33 |
| 5 | 67 | 299 | 189 (63%) | spray 81 · spiral 56 · wall 52 |
| 6 | 72 | 383 | 196 (51%) | spray 115 · wall 71 · spiral 10 |
| 7 | 76 | 433 | 229 (53%) | wall 100 · spray 71 · aimed 53 · spiral 5 |

Counts per wave: level 1 sends 4–6, level 2 sends 3–6 (twenty waves of three), level 3 sends 4–5
and nothing else. Level 7 sends six in 54 of its 76 waves. No wave in the game is larger than six.

**Every enemy bullet in the game flies a straight line at constant speed.** `spray`, `wall`,
`spiral` and `aimed` differ in where the straight lines point; the one shot with a life after the
muzzle is the shard's frost (level 5, [0263](../docs/decisions/0263-the-frost-ship-shatters.md)),
and the only thrown things that bow or rise are the bosses' whip and breaker. The lancer's
"spray" is `shots: 1, spread: 0` — one bullet, straight down the lane — and the lancer is 49 of
level 1's 108 shooters and 96 of level 3's 155. *"Almost all the shooting is straight patterns"*
is exact.

### What the shooters do while they can be seen

At the capped loadout sweeping the lane, which is what a player carries from level 2 on
([0259](../docs/decisions/0259-the-bullets-stay-on-the-screen.md)'s own case):

| level · kind · entered from | bodies | visible, seconds | volleys while visible | never fired while visible | first seen, units ahead of the camera |
|---|---|---|---|---|---|
| 1 lancer · lead | 37 | 0.62 | 0.78 | 27% | 181 |
| 1 picket · lead | 17 | 0.51 | 1.29 | 41% | 180 |
| 1 turret · lead | 29 | 1.58 | 5.28 | 3% | 173 |
| 2 warden · lead | 32 | 1.25 | 1.75 | 13% | 178 |
| 2 moth · lead | 32 | 0.41 | 0.63 | 63% | 181 |
| 2 turret · lead | 20 | 1.15 | 4.05 | 15% | 175 |
| **3 lancer · side** | **70** | **1.72** | **0.57** | **50%** | **109** |
| 3 lancer · lead | 21 | 0.39 | 0.57 | 52% | 181 |
| 3 sower · lead | 10 | 0.92 | 3.20 | 30% | 180 |
| 3 turret · lead | 16 | 1.44 | 4.88 | 13% | 181 |
| **3 turret · side** | **19** | **3.36** | **6.00** | **0%** | **120** |
| 4 turret · side | 15 | 3.31 | 7.00 | 0% | 119 |
| 5 shard · lead | 26 | 1.01 | 5.04 | 27% | 181 |
| 5 spinner · lead | 10 | 1.22 | 3.90 | 30% | 181 |

A lead body is first seen at the leading edge, as it should be; a side body is first seen three
fifths of the way in. At the guns level 1 is actually played with (one weapon rung, no tube) its
lancer is visible for 1.45 s and fires 1.30 volleys; one in nine still never fires.

Bullet on the screen, share of the waves' time (`weigh-bullets`, capped, sweeping): level 1 58%
(the run-up is its 13 s dry stretch, authored by
[0086](../docs/decisions/0086-the-teeth-wait-for-the-gun.md)), level 2 70%, level 3 49%, level 4
45%, level 5 82%, level 6 64%, level 7 65%.

## What the ask means against that

**"Enter 1/2 to 3/4 of the way into the screen" is the flank entry, and where it enters is the
player's own cap.** [0048](../docs/decisions/0048-a-threat-may-arrive-from-the-side.md) placed a
flanker at *"50% from the right side of the screen — the player has a safe spawn zone from the
left"*, and [0197](../docs/decisions/0197-a-wave-arrives-as-a-wave.md) moved it ahead of a ship at
the front. On the drive they are first seen 109–120 units ahead of the camera on a 178-unit view:
three fifths to two thirds in. The cap is doing what it was asked to; the plan below keeps it.

**"Barely shoot at all" is a defect against 0259's own rule, and it is the whole of level 3.**
*A body announces itself by firing* is keyed to the hull crossing the LEADING edge of the view
(`fireEnemies` in `src/app/frame.ts`). A flanker either never crosses it — it is placed inside the
view — or crosses it while still outside the lane, where the across gate skips the volley. Its first
shot is wherever its spawn-quantised count happens to land, up to a full reload after it enters the
lane, and it has already spent 0.6 s crossing in (20 units at 0.55 a step) before it is allowed to.
Level 3's idea is `origin` ([0071](../docs/decisions/0071-five-more-levels-and-one-idea-each.md)),
24 of its 66 waves flank, 70 of its flankers are lancers, and **half of those never fire while they
can be seen.** Levels 4–7 flank as often or more and do not read this way because what they flank
with is turrets and wardens: a flanking turret is the most present shooter in the game, 3.4 s on
screen, six volleys, none silent — it holds station, and the side entry puts it mid-screen where
it stays.

**"Sparse shooting" in levels 1 and 3 is bullets per visible body, not firing waves.** Level 4 has
fewer firing bodies than level 3 and less bullet time, and reads as fine, because its shooters throw
walls of four; level 3's throw one straight lance and die inside four tenths of a second of being seen.
[0259](../docs/decisions/0259-the-bullets-stay-on-the-screen.md) found this shape once — the guns
kill what fires before it fires — and answered it for the first volley. It did not touch what a
body throws, and a one-bullet body that fires once is one bullet.

**"Curving bullets, patterns, waves" is a gap in the vocabulary, not in the tables.** A shot row
has a speed, a life after the muzzle, a trail and an appetite; it has no path. Nothing an author
can write today makes a hostile bullet bend.

**"Curve back and come onto the screen again" is half there.** `loop` turns a body at the ends of
the player's box ([0258](../docs/decisions/0258-one-pilot-a-level.md)) and any row may carry it,
but only the charger does; `circle` orbits, and it is a pilot's arm. Nothing flies an arc — in from
a side, across the lane, and out again — which is the shape the ask describes.

**"More than 5 in a group" and "tougher but slower" need no mechanism.** A column of ten is 126
units deep against a 240-unit horizon; a line of nine folds into three ranks
([0202](../docs/decisions/0202-a-wave-is-as-wide-as-the-volley.md)); the enemy pool holds 40. The
warden is a four-hit body at a fifth of a unit a step and level 1 never sends it; level 3 sends five.
Whether a swarm reads as a swarm or a wall is a play question, and the counts are a row edit.

**"Level specific" is what [0071](../docs/decisions/0071-five-more-levels-and-one-idea-each.md)
already asks for** — one idea a level — and what 0232 gives each place one body for. The plan
spends the new vocabulary per place rather than everywhere, so a curve is level 2's and a burst is
level 3's, on [0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s
terms: a mechanism whose output is identical for every kind is the tell.

## The plan — one PR each, in this order

The order is: the measured defect first, then what needs no mechanism, then the two pieces of
vocabulary, then each level spending them. The first two are cheap and land the specific complaint;
the rest are what *"more interesting"* costs.

### 1. A flanker announces itself — amends 0259

*A body announces itself by firing* becomes true of a body that enters across the lane: the entry
volley is dealt on the step a flanker's hull first enters the lane, on the same `ENTRY_VOLLEY` and
the same per-member slot, and the leading-edge case is untouched. One condition in `fireEnemies`
beside the one that exists; `THE ENTRY VOLLEY` in `tests/bullets.test.ts` gets a flanking fixture
and its probe in `scripts/probes/`. The figure it is held to is the table above, re-read with
`scripts/weigh-presence.mjs`: level 3's side lancers from 0.57 volleys and half silent to about 1.5
and none.

**Consider the screen.** About seventy more single straight lances across level 3, each fired from
mid-screen down the lane; the crossing-in already costs the body 0.6 s, so the shot still leaves
after the player has seen it arrive. Level 3's 49% bullet time is the number to re-read.

### 2. Bigger waves, and the slow tough body, in the first three — authoring, no mechanism

Rows in `src/content/levels.ts` only:

- **Swarms.** Waves of eight to ten of the one-hit kinds — drifters and weavers in the Approach's
  teaching stretch and run-up, where a wave is meant to be a picture; a column of ten and a folded
  line of nine, so both shapes are seen.
- **The warden into the Approach**, after the run-up ends at 1,600 (0086 holds until then) and
  into the Belt in more than one wave: four hits at a fifth of a unit a step is *"tougher but fly
  slower so they can be dealt with"* in a row that exists, and it throws a wall, which level 1 has
  never shown.
- **Flanking turrets earlier in the Belt.** They are its last four waves today and its most present
  shooter; the origin idea is *the edge is three edges*, and a thing that arrives from the side and
  STAYS is that idea at its plainest.
- **Level 2's twenty waves of three** revisited against the same table: a three-wide warden line at
  1.7 volleys a body is the level's shooter, and there are eleven of them.

Held by what already holds: the lane-edge, density, mix, fight and bullet-time guards, and a peak
read of the enemy pool under the drive (40; if a swarm wants more it is a boot allocation and a
budget, not a frame cost). **Owed:** whether a swarm dies as a picture or as a wall, which only a
play can say.

### 3. A shot has a path — bullets that bend and wave

`ShotRow` gains an optional `path`, on 0282's DEFAULT shape — absent is *straight*, which is every
shot in the game today — with two arms, each stepped in the hot loop without allocating:

- `{ kind: 'arc'; turn: number }` — a constant turn per step, so the bullet flies a circle segment
  at its row's speed. The seeker missile already steers per step through `seekTurn`
  ([0235](../docs/decisions/0235-a-seeker-hunts-the-nearest-body.md)); this is that stepping with a constant in
  place of a target, so nothing new runs in the frame.
- `{ kind: 'wave'; amplitude: number; wavelength: number }` — the weaver's own arm applied to a
  shot: a swing across as a function of `along`, so two shots fired a second apart trace the same
  curve through the same piece of world and the pattern can be drawn on a map.

Neither reads the ship, so [0258](../docs/decisions/0258-one-pilot-a-level.md) is untouched and
[0110](../docs/decisions/0110-an-attack-is-a-pattern.md)'s question — *where is the gap* — is
what both ask. A homing hostile bullet is refused here in advance: it is an aimed shot that keeps
aiming, and one pilot a level already says where aiming lives.

A curving bullet is a new **shot row** and not a field on a row that also flies straight
([0258](../docs/decisions/0258-one-pilot-a-level.md)'s rejection: a kind that does one thing in one
level and another in the next is two kinds with one name). Each row says its own `turn` or its own
swing, so a fast tight arc and a slow lazy one are two rows and not one constant.

**Consider the screen.** An arc of radius `speed / turn` covers `2 × radius` of the lane and is on
the screen longer than a straight shot at the same speed; a wave sweeps `±amplitude` of lane on
top of its heading. Both are argued per row against `scripts/threat-sheet.mjs` and a bench
photograph. **At least one guard in the player's units:** the widest reach across the lane as a
fraction of it, and the seconds a curving shot takes to cross the view, held under a number a play
owns.

### 4. A body flies an arc — flight paths that come back

`Motion` gains `{ kind: 'arc'; turn: number; sweep: number }`: a constant turn per step in the
camera's frame at the row's speed, for `sweep` radians, then straight on. Sent from a side it is a
body that swings in, crosses the lane and leaves — the way it came (a U) or the far side (an S, by
the sign of the turn) — and that is *"curve back and come onto the screen again"* as a picture
rather than a chase. Not a pilot's arm: it reads nothing about the ship. `loop` stays what it is
and is spent on kinds other than the charger in the same PR — a lancer wave that turns once at the
back of the box comes past the guns twice.

Held by: the roam band (an arc's extent is `2 × speed / turn`, so
`tests/level.test.ts`'s lane check can compute it exactly as it does a weaver's swing);
[0105](../docs/decisions/0105-a-body-is-on-screen-long-enough-to-answer.md)'s on-screen floor in
seconds, which an arc lengthens rather than shortens; and *it leaves* — every arc ends straight so
the pool is a pace and not a total. `tests/pilot.test.ts` reads the new arm as not reacting.

**Consider the screen.** A four-hit body on a slow arc is on screen for the whole sweep with its gun
live; its cadence and what it throws are argued on the row against `weigh-presence`, and a warden's
wall thrown from an arc walks its hole across the lane, which is the sower's lesson at a different
speed.

### 5. The Approach spends it

The serpent's place, and the coil's. The picket's spit on a `wave` path — a snaking bullet from the
one body here that hunts, so the thing that finds the player throws the thing that does not fly
straight; swarms from PR 2; the warden after the run-up. Nothing else new: level 1 teaches, and it
should have one idea to teach on top of the eight it has.

### 6. Ember Nebula spends it

The moth stays the pilot. A second place-only body — an ember: a slow, tough, wide hull on an `arc`,
in from a side and out again, throwing a bending shot in the fire ink
([0296](../docs/decisions/0296-a-bullet-belongs-to-its-place.md): fire is the same red everywhere)
— so level 2 is where a bullet first curves and a body first comes back. It is not the signature
([0232](../docs/decisions/0232-each-place-has-its-own-enemy.md) names one per place; the kite and
the minnow are already place-only bodies that are not it) and it does not react. **Its name and its
shape arrive from the player** — the fish's brief is the evidence that a drawn thing converges in
one pass ([`the-fish-asked`](the-fish-asked-2026-09-12.md)); a placeholder name is used until then.

### 7. Saurian Belt spends it

The origin level, with PR 1 already landed on it. A second place-only body that lays a **clutch**:
a slow shot that bursts into a fan after a fuse — 0263's `fission`, which no enemy but the shard
uses and no level before 5 has shown — so the Belt's idea, *where things come from*, is asked of a
bullet as well as a body. Flankers on the `arc` motion re-using the edge twice; flank turrets from
the first third. The raptor stays the pilot and keeps its bite.

## What is deliberately not proposed

- **Moving the flank cap.** It is the player's own ask (0048), and the entry is where they said.
- **Making the lancer hunt or aim again.** 0258 is six days old and was played for; the fix is that
  it fires, not that it looks for the player.
- **A homing hostile bullet.** Aimed under another name; refused above.
- **Any guard that ranks kinds against each other** — a curving bullet slower than a straight one
  by rule, an arc body tougher than a line body by rule.
  [0295](../docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md): every one of those is a
  design somebody will want.
- **Weakening the guns to make bodies last longer.** The ask is about the enemies.

## Questions, none blocking

1. **The flank cap stays at half the widest view?** Recommended yes; PR 1 fixes the firing and not
   the entry.
2. **Curves are patterns only, never homing?** Recommended yes, on 0258's terms.
3. **Two new place-only bodies (levels 2 and 3) want a word each from you** — a name is the fiction
   arriving, and the art follows the name ([0020](../docs/decisions/0020-the-fiction-transfers-the-code-does-not.md)).
   Placeholders until then.
4. **If swarms want the enemy pool above 40, that is a boot allocation.** Recommended: raise it when
   the drive says so and not before.

## How it was measured

```
node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-bullets.mjs
node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-presence.mjs
node --experimental-transform-types --import ./scripts/ts.mjs scripts/weigh-presence.mjs approach --weapon=1 --missiles=0
```

Both drive as `weigh-bullets` drives — capped guns, two tubes, the ship sweeping the lane, the
mid-boss put to one health. `weigh-presence` attributes each new enemy shot to the nearest live body
and records, per body, where it entered (outside the lane across is a flanker), its visible steps and
its visible volleys; a body never inside the view is not a row. The census is a count over the wave
tables in `src/content/levels.ts` by kind, formation, count and origin, and is reproducible from
them by hand.
