# 0085 — A death does not cost the bombs

**Accepted 2026-08-09.** A play-test defect, reported against the build carrying
[0084](0084-the-dial-is-the-level-and-the-guns.md).

**Amends [0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md)** — *a death costs the arsenal* —
and gives [0068](0068-a-run-over-is-a-continue.md)'s continue the one thing it does that a death does
not.

## The rule

**A death costs the upgrades and nothing else. A continue is what puts the arsenal back to the ship's
starting kit.**

## What was asked for

> *"Bombs are reset on player death. Bombs should be reset on a continue, but not on player death."*

## What it was, and why the bug reads as a reset in both directions

`lifeLost` and `continued` returned the same arsenal — `startingArsenal()`, which is
[0053](0053-the-bomb-is-the-first-thing-the-player-spends.md)'s two charges. So a death was a
**restock**, and a restock is a cost or a gift depending on where the player was standing:

| the ship died holding | it flew again holding |
|---|---|
| five charges — a bomb pickup and two levels cleared | **two** |
| none, having spent them | **two** |

⚠️ **Both halves go, and the second one is what this decision costs the player.** *Keep what they had*
is not *never leave them with nothing*: a ship that dies empty now flies again empty. That is deliberate
and it is the same sentence — a free two charges every death is what made the banked ones worth
nothing, and [0053](0053-the-bomb-is-the-first-thing-the-player-spends.md)'s *one more per level
cleared* is a reward a restock quietly cancelled. `tests/bombs.test.ts` holds the top-up as its own
guard, because it is the half that would be re-added in good faith.

## Why this is 0039 amended rather than 0039 broken

0039 says a death goes *"back to the ship's base weapon and starting special"*, and that sentence has
two halves that turned out to be about two different things.

| half | what it is | now |
|---|---|---|
| the base weapon | the upgrade list, resolved by `weaponFor` | **still lost on every death** |
| the starting special | the arsenal's charges | **kept** |

⚠️ **The first half is the one 0039's argument was actually about.** *"An arsenal that survived a death
would make a run monotonic — the ship only ever gets stronger"* is a statement about the ladders, and
the ladders still reset. What a charge count does is different in kind: it is a **consumable the player
spends**, so it cannot ratchet — every one that is kept is one that will be pressed and gone.

⚠️ **And the scatter has since answered the monotony worry from the other side.**
[0083](0083-two-ladders-of-four.md) throws every lost upgrade back onto the field where the death
happened, so *a death costs the arsenal* was already being undone within seconds for the half that is
still lost. The half this keeps was the one nothing gave back.

## The pyre stays exactly as it is, and that is a choice with a cost

[0079](0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md) detonates *"everything the ship
never spent"* at the wreck, with the ring sized by the charge count. Four readings were put to the
hand that reported the bug, and it took the first:

> Keep it unchanged — the ring still fires, it is still sized by the bombs carried, and the ship keeps
> them.

⚠️ **So the pyre is FREE, and it is the one place in the game where the picture shows something being
spent that is not.** That is
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) read against itself, and it is worth
saying plainly rather than leaving to be discovered: the fiction is *the ordnance goes up with the hull,
and the next ship is issued the same kit*, which is a fleet rather than a pocket. It reads at the speed
a death happens; nobody counts a ring.

⚠️ **The alternatives were real and each cost something the ask wanted.** Making the pyre spend the
charges costs the player MORE than the bug did — a death would leave them at zero instead of at two.
Sizing the ring by something else, or dropping it, gives up the breathing space 0079 was asked for in
those words. `tests/death.test.ts` holds the free pyre as a guard for exactly one reason: *the pyre
fires all unspent bombs* reads as a spend, and the fix in that direction is one line.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0085-charges.mjs`.

| broken on purpose | went red |
|---|---|
| the restock put back on a death, so a run's banked charges never survive one | `a death costs the upgrades and leaves the arsenal exactly where it was` |
| the continue keeping the arsenal too, so nothing in the game ever resets the charges | `restocks the run with everything a fresh one carries` |
| a death topping the arsenal up to the starting kit rather than leaving it alone | `and a death does not TOP UP an arsenal the player has emptied` |

⚠️ **Two probes belonging to other decisions were stranded, and the two answers are different** —
`anchorFailures` reported both before a suite ran.

| probe | what happened |
|---|---|
| 0039's *a death that leaves the arsenal alone* | **deleted.** Its edit is now the shipped code; the same break in the other direction is 0085's first probe, and two probes over one line is a duplication |
| 0053's *a death emptying the arsenal* | **re-anchored.** Its claim is unchanged — a death must not leave the player holding nothing — and only the right-hand side of the line moved |

⚠️ **THREE GUARDS WERE PROVING NOTHING AND ONLY THIS CHANGE COULD SHOW IT.** While every death
restocked, `continued`'s arsenal line was a **copy** of `lifeLost`'s, so:

- `tests/continue.test.ts`'s *the continue did not restock the arsenal* was measuring a run that had
  reached the run-over screen already holding exactly what it was about to be handed. Its fixture now
  banks a charge first.
- `tests/bombs.test.ts`'s *a death costs what was earned and never the starting kit* asserted one arm
  of a reducer whose two arms were identical. It now drives both, in one test, because the ask is a
  **difference between two events** and either half alone passes against a reducer that restocks on
  both or on neither.

That is the shape [0027](0027-measure-the-picture-not-the-model.md) names — a guard that agrees with
itself — arriving through duplication rather than through units.

## What this does not settle

**What a death should cost at all.** Three deaths now cost only the ladders, and
[0083](0083-two-ladders-of-four.md) hands those straight back on the field. Whether a death is still an
event with a price is a play-test question, and the honest answer today is *the price is the beat and
the tempo*, not the loadout.

**Whether a continue should restock at all**, which is
[0068](0068-a-run-over-is-a-continue.md)'s free-continue question wearing new clothes. The restock is
now the only thing the continue takes away, so the day the continue stops being free this line is where
the argument starts.
