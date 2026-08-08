# 0081 — What the player must tell apart is told apart by more than ink

**Accepted 2026-08-08.** Chunk 4 of
[`the-third-play-test`](../../reports/the-third-play-test-2026-08-08.md), and the fifth of its five
reported defects.

**Reads [0024](0024-the-accessibility-floor-is-settings.md) against itself** — and comes out the same
way round.

## The rule

**Two things the player must not confuse differ in shape and in size, with ink as a third channel
rather than the only one. Colour carries the SIDE; shape and size carry the rest.**

## What was asked for

> *"visual sprite differentiation. currently we've gone too hard on the visual accessibility
> requirement and it's now very hard for sighted users to differentiate between power ups,
> player/enemy fire, different types of enemies. When they're all the same colour and essentially the
> same size, they're all the same."*

> *"Additional autofire and missile upgrades don't change the look of the player's ship"*

## The confirmed defect, and it was literal

⚠️ **`SHOTS.spit` named `SPRITE.bullet`.** The thing that kills the player and the thing they kill
with were the **same bitmap, in the same ink, at the same 1.8 units** — for as long as there have been
enemies that shoot. *"Player/enemy fire"* was not a matter of degree; there was no channel separating
them at all.

| | shape | size | ink |
|---|---|---|---|
| before | one disc | 1.8 | `bullet` |
| now | disc vs **square** | 1.8 vs **2.6** | `bullet` vs **`enemy`** |

⚠️ **A square, because it is the last primitive that survives fifteen pixels.**
[`enemy-silhouettes`](../../reports/enemy-silhouettes-2026-08-05.md) is the report that cost this
project an art pass: concavity and point count fail at size, and what survives is a primitive and an
axis. A disc against a square is *corners against none*. It is deliberately **not** a diamond, which
is a square turned 45° and would read as the drifter.

⚠️ **The hurtbox is untouched at 0.9.** This is a legibility change and not a difficulty one; nothing
about dodging one has moved. The band `tests/combat.test.ts` holds puts it at 0.35 of its own extent,
well inside.

⚠️ **The bigger of the two is the one the player must not touch**, because size is the cue that needs
no learning at all — the same argument `src/content/sprites.ts` already makes for enemy hulls carrying
their toughness.

## Why this does not weaken 0024

[0024](0024-the-accessibility-floor-is-settings.md)'s rule is **colour never carries meaning alone**,
and every change here *adds* a channel. What it does change is what `bullet` MEANS: it used to be *a
shot, whoever fired it*, and it is now *the player's fire*.

⚠️ **Sharing the `enemy` ink between a hull and a bullet costs nothing and buys a rule.** A spit is a
square at 2.6 units and an enemy is a five-to-nine-unit silhouette, so nothing is told apart by hue
here either. What the player gets is one sentence instead of two: **pink will hurt you.**

⚠️ **The blast keeps `hazard`, and that is the honest exception.** A bomb's blast hurts the player as
well ([0053](0053-the-bomb-is-the-first-thing-the-player-spends.md)), so it is the one thing the ship
fires that the ship has to get away from, and it wears the warning role.

## The general rule, whose absence is why this lived so long

⚠️ **`src/content/pickups.ts` has held *every kind has its own silhouette* since
[0041](0041-a-pickup-is-the-answer-to-what-a-death-costs.md). `SHOTS` never had one.** That is the
whole of how a threat wore the player's bitmap for months with a green suite: the property was
structural and stated in one place and not the other. `tests/legibility.test.ts` now holds it over
`SHOT_KINDS`.

## The ship wears what it is carrying

⚠️ **`docs/game.md` has said *"every upgrade changes how the ship looks on screen"* the whole time**,
and the ship had one silhouette from the first pickup to the last.

**Three hulls**, resolved on the `Weapon` as `tier` and applied by `wearHull`:

- **The same wedge with more of it**, not three different ships. Each tier adds a pair of swept fins
  outside the hull above it and leaves the nose alone. What the player reads is *the same ship,
  further along* — a hull that changed KIND would say *I am flying something else*, which is the one
  thing that is not true.
- **Counted over the whole upgrade list**, one tier per two upgrades. A player who spends four
  upgrades on missiles has upgraded exactly as much as one who spent them on the pulse, and a hull
  keyed to barrels would tell the first of them nothing.
- **Three, and not one per upgrade.** `weaponFor` caps barrels, launchers and both fire rates, and
  past those an upgrade becomes weight — so a hull per upgrade needs an unbounded number of them.
  Three is what a player can tell apart at ship size.
- **The extent does not change.** A ship that got physically larger as it upgraded would be a ship
  that got easier to hit for picking things up, which is the opposite of a reward.
- **A pair per tier**, base and hit. `stepEntities` derives `sprite` from both, so a tier without its
  own twin flashes back to the bare hull — a silhouette changing at the one moment the player is
  least able to read it.

⚠️ **A death puts it back with no second description of what a bare ship is.** `tier` is a pure
function of the upgrade list, and [0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) empties
that list — so the base hull is *what an empty list resolves to*, exactly as the base weapon is.

## What this deliberately does not do

**It does not touch the pickups.** They are six kinds at one size in one ink, and the report calls
them *"the lynchpin of whether this game is actually good"* in a different paragraph — **chunk 5**
merges two of them into one and re-authors their budgets, which changes what there is to tell apart
before anything is redrawn. Redrawing six silhouettes now and five again next week is the order that
wastes the work.

**It does not re-space the enemy hulls.** They already run 5 to 9.5 units across six distinct
primitives, and `tests/combat.test.ts` holds size against toughness. If a play-test says the enemies
still read alike, that is a claim about those six drawings rather than about the channels available to
them.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0081-legibility.mjs`. **8 red, and every tree back to what it was copied
as.**

| broken on purpose | went red |
|---|---|
| what shoots back given the player's own silhouette again, which is what shipped | `THE REPORTED ONE: they differ in shape, in size and in ink` |
| the enemy's shot left in the bullet ink, so colour still says nothing about sides | `and the ship's own fire is never in the ink of the things trying to kill it` |
| the enemy's shot drawn at the pulse's size, so only shape and ink separate them | `THE REPORTED ONE: they differ in shape, in size and in ink` |
| two shots given one silhouette, which is the shape of the defect rather than the defect | `no two shots in the game share a silhouette at all` |
| the hull ladder collapsed to one, so an upgrade never shows on the ship | `THE REPORTED ONE: a hull that has taken upgrades is not the hull that has not` |
| the hull never applied, so the tier is resolved and nothing draws it | `is the hull the painter actually blits, and a death puts it back` |
| the hull keyed to barrels, so a missile loadout is drawn as a bare ship | `climbs with the upgrade list whatever the upgrades were spent on` |
| the hull ladder unclamped, so a long run runs off the end of the hulls there are | `climbs with the upgrade list whatever the upgrades were spent on` |

⚠️ **One probe was re-aimed, and the re-aiming is a finding.** *The hull never applied* broke two of
`wearHull`'s three lines and came back **STILL GREEN**: the third line writes `sprite` directly, for
the frame drawn before the next step, and that alone painted the new hull. A probe that models a
mistake nobody would make proves nothing — the mistake that matters is the resolved tier never
reaching the ship at all, so the break is now the whole body.

⚠️ **The load-bearing assertion is in PIXELS of a 1280×720 screen**, per
[0027](0027-measure-the-picture-not-the-model.md), because *"essentially the same size"* is a claim
about the glass and world units cannot answer it.

## And it was looked at, with one thing it could not show

`node scripts/shot.mjs` at 1280×720, across a real run of level one.

**The player's own fire reads as the player's**: a line of small orange discs leaving a cyan wedge,
against green pickups and pink hulls. Four roles, four readings.

⚠️ **A `spit` was NOT caught in a still, and the reason is worth writing down.** The opening levels
put very little enemy fire on screen, and the rig walks a real run **with nobody flying** — so the
ship is dead or respawning through most of the stretches where anything shoots back, and a shot at
190 seconds landed on the title screen, because the unattended run had already ended and expired.
`scripts/shot.mjs` can photograph what the level puts in front of a stationary ship; it cannot
photograph a fight.

**What is known about it is therefore arithmetic and guards**: a different bitmap, a different ink
role, and 8.8 more pixels across on the screen the report was made on. That is a real argument and it
is not the same as having looked — the play-test this chunk is queued behind is what closes it, and
this is exactly the class [0027](0027-measure-the-picture-not-the-model.md) says to be honest about
rather than to claim.
