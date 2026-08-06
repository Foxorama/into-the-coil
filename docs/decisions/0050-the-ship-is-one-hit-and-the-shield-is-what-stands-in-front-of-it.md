# 0050 — The ship is one hit, and a shield is what stands in front of it

**Accepted 2026-08-06.** The first half of the list asked for after playing the two-level build:
*"one hit destroys the ship"*, and *"shields — a pickup, capped at 3. Each absorbs one hit and is
destroyed; an enemy or an enemy effect that meets a shield never reaches the hull."*
[0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) said what a death costs; this says what
a death *is*.

## The rule

| | |
|---|---|
| **the hull** | `SHIPS.proof.health` = **1**. Anything that lands ends the life |
| **a shield** | a **pickup**, `effect: 'shield'`, capped at `MAX_SHIELDS` = 3 |
| **where it lives** | the ship's `health`, above the hull. `shieldsOf(row, health)` is the only description |
| **what a landing costs** | exactly **one hit**, whatever hit it — the clamp in `src/app/frame.ts` |
| **what it looks like** | one ring per shield, orbiting the ship, evenly spaced, turning with the **camera** |
| **the readout** | the HUD's pips are the **shell**, not the health. A life opens with three empty |
| **a spent shield** | leaves a burst where the mark was |

## Health is a count of hits, and that is what makes all of it one number

⚠️ **A ship carrying two shields has `health` 3.** Not a `shields` field beside a `health` field —
one number, with the hull at the bottom of it. Everything else is derived:

- the collision takes one off, exactly as it always did;
- the shell spawns a mark per shield above the hull;
- the readout fills a pip per shield above the hull.

The alternative — a counter beside `health` — is a second answer to *what is left between this ship
and the end of the life*, and only one of the two is moved by a collision. The shell would then keep
a mark the player had already spent, on precisely the frame they looked down to check whether they
had. `src/content/sprites.ts` records what a second description of one table cost this project once
already; this is the same mistake wearing a gameplay costume.

### The clamp, which is where a number becomes a count

⚠️ **An enemy carries 2 damage and a shield absorbs one HIT, so the raw arithmetic is wrong twice
over.** Un-clamped, one contact spends two shields — the pips and the marks both say three hits in
hand when there are two — and the `hardy` assist's half leaves the ship on two and a half shields,
which is not a number of rings anybody can draw.

So `src/app/frame.ts` clamps what one landing may cost to `ONE_HIT`, after the three pairings rather
than inside `src/sim/collide.ts`. Only one of the three can land in a step — the first sets
`invulnFor` and the rest skip a target that has it — so *what did the ship lose this step* has exactly
one answer, and the collision keeps its monotonicity argument untouched: it still takes the **worst**
of an overlap set, and the clamp still shrinks as that set does.

⚠️ **This makes `resilience: hardy` degenerate, and that is owed rather than hidden.** Halving damage
cannot mean anything against a one-hit hull: half of a hit is still the hit that kills you.
[0024](0024-the-accessibility-floor-is-settings.md)'s rule survives — the rung is never *harder* than
standard, only no longer softer — but the assist ladder now has a middle rung that does nothing, and
re-reading it is real work this decision does not do. There is no settings screen yet, so nothing
ships a knob that lies.

## The shell is a picture of that number and is nothing else

Three rings in the player's own ink, in their own pool, in no collision pairing at all. A mark with
a hurtbox would be a second answer to *what did this hit*, and the two would disagree the first time
a bullet passed between two marks.

⚠️ **Evenly spaced about the CURRENT count**, so three marks are a triangle and two are opposite each
other. Fixed slots of three would leave a single shield sitting at an arbitrary angle, which reads as
a piece having fallen off rather than as a shell.

⚠️ **Turning with the camera rather than with a step counter**, which is `src/content/enemies.ts`'s
argument for the weave: a shape in the world can be authored against and a wobble in time cannot.

⚠️ **A spent shield leaves a burst**, because absorbing a hit is an event the model resolves —
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) records three such events each
reported as a collision bug that did not exist, and *the hit landed and the ship is fine* is the most
confusable of them all.

### And the marks were too small, which only the picture could say

They shipped at 2.2 world units and `scripts/shot.mjs` at 640×360 — a phone's worth of pixels —
showed three specks of hairline. Every number in the model was correct. They are 3 now.
[0027](0027-measure-the-picture-not-the-model.md).

## The readout changed meaning, so a life now opens looking empty

The HUD's pips were one per point of health, when a ship had five. The hull is one hit, so a row of
one pip would be a readout that never moves. The pips are the **shell** — three sockets, filled as
the player finds shields — and a fresh life shows all three empty.

⚠️ **That is the honest picture and it is meant to be uncomfortable.** Nothing stands between this
ship and the next thing that touches it until the player flies for a shield. Which is why the first
thing in each level's pickup script is now a shield, inside the empty opening stretch
[0043](0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) gave the player to find the controls in.

## What the pools cost, and the guard that did not exist

⚠️ **The shell's three slots come out of the PARTICLE share**, which is the only share
[0022](0022-frame-rate-is-a-feature.md) names as sheddable — *background parallax, particle counts,
debris lifetime, screen-space effects*. The shell is the opposite of sheddable: it is how a player
reads what is left of their life. So `debris` goes to 197, the total stays at exactly 500, and
nothing about the frame budget moves.

⚠️ **Nothing was holding that sum.** `src/app/mount.ts` said *"the total is now EXACTLY 500"* in a
comment and asserted it nowhere, so the pools and 0022's worst case agreed only for as long as
somebody did the arithmetic in their head — with three more pools queued in `docs/state-of-play.md`
(missiles, a bomb's blast, and this). `tests/budget.test.ts` holds it now.

## What this leaves owed

⚠️ **The two harder tiers were sized against a five-health ship and have never been played.**
[0047](0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md) aimed `savior` at *"level four
with challenge"* and `burn` at *"maybe the end boss of level two"*, against a hull that took five
hits. This is the largest single change to what a mistake costs since those numbers were written, and
none of them has been moved here: a guess corrected by a second guess is not a correction. They are
the first thing the next play-test is for.

⚠️ **Shields are not in the save schema**, and nothing is wrong with that:
[0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) stores lives, arsenal and level, and a
shield is armour on the life being flown rather than a property of the run.

## What was rejected

**A `shields` counter on the run slice.** It is where an upgrade goes, and a shield is not an
upgrade: an upgrade is worth the same on the last frame of a life as on the first, and a shield is
consumed by the thing it protects against. Putting it in the list `weaponFor` resolves and a death
empties would have been two wrong answers at once, and it would have been the second description the
section above exists to refuse.

**Pips that count hits — the hull plus the shell.** It reads better on a fresh life (one pip lit
rather than three empty) and it is a worse readout: the hull is not a resource the player can do
anything about, so a pip for it is a pip that never moves and never means anything.

**Keeping `shield` as the name of the special.** [0045](0045-the-player-can-see-what-they-are-carrying.md)
settled this in advance — *"it is the SPECIAL that gets renamed, because this is the word a player
already used for the thing that keeps them alive"* — so `SPECIAL_KINDS` now reads `mines`, which is
`docs/game.md`'s own *"orbiting mines that are half shield and half weapon"*. A rename and not a
deletion: 0039's rule needs a list that can hold two different things for its guard to be falsifiable.

## Confirmed, not assumed

`npm run prove 0050` — every guard broken on purpose and seen to fail.

| broken | what went red |
|---|---|
| the hull given health back, so the ship survives hits it should not | `dies to a single contact` |
| damage riding through, so one contact spends two shields | `an enemy that reaches a shielded ship still only takes one shield` |
| the shell left to spawn but never to release, so a spent shield keeps its mark | `wears one mark per shield` |
| a spent shield leaving no burst, so absorbing a hit is invisible | `leaves a burst where a mark was` |
| the shell spaced against a fixed three rather than against what it is carrying | `spaces its marks evenly` |
| the shell turned by a clock rather than by the camera | `turns as the camera travels` |
| the shell left in place across a respawn | `is gone the moment the ship is` |
| the upgrade list and the pickup table allowed to disagree | `every upgrade-effect pickup is an upgrade kind` |
| a pool grown without taking the slots from anywhere | `never asks the frame to draw more entities than the budget was measured for` |
| the readout drawing the hull instead of the shell | `draws one pip per shield the ship can carry` |

⚠️ **One of the ten went green first and the guard was the thing at fault.** *The shell turned by a
clock rather than by the camera* passed, because the first version of that test stopped the
simulation and asserted the shell held — which a step counter passes just as happily, since a frame
that does not step turns nothing either. The camera advances a fixed amount per step, so *distance
travelled* and *steps taken* are the same number until something separates them. The test now stops
the **world** while the simulation keeps running.
[0005](0005-a-guard-must-be-seen-to-fail.md), and the second guard in two decisions caught this way.
