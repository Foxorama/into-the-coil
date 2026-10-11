# 0592 — The crashes are counted

**Accepted 2026-10-11.** Item 1 of [`the-secret-pilots-planned`](../../reports/the-secret-pilots-planned-2026-10-11.md).
Builds on [0546](0546-the-marmot-rides.md)'s lock and [0521](0521-the-hangar-opens.md)'s hangar. No pilot
uses any of it yet.

## The ask

From the handwritten page: the least weasel opens after *"10 non-bullet deaths"*, and the Aqua Duck after
*"x customisations"*. Answered while it was planned: *"hints for unlocks is good"*.

## The rule

**A death says what did it. A life lost to something the ship flew into is a crash, and the hangar counts
crashes for good. A pilot's lock can name a number of crashes and a number of things bought, beside
0546's wins, and the pilot band's hint counts down what is left.**

| | |
|---|---|
| **the cause** | `DeathCause` on `src/state/slices/run.ts`: `fire` is an enemy shot or a bolt; `body` is an enemy, a boss, a serpent's flank or the stone. The frame keeps what landed the last hit (`killedBy`) and hands it to `onDeath`, which puts it on `lifeLost` |
| **the count** | `crashes` on the hangar, raised by `src/state/root.ts`'s fourth agreement: a `lifeLost` that spent a life, with `body` as its cause. Across every run, pilot and tier, and never taken back |
| **what was bought** | `waresBought`: every ware with a price the player owns. Read off `owned`, so nothing new is saved for it |
| **the lock** | `opens` on every pilot row (it was `opensAfter`): `after`, `crashes`, `bought`. All three must be met; the four starting pilots' and the Marmot's say 0 for both counts. `pilotRecord` builds what a lock is read against |
| **the hint** | `lockHint`: what is left of each part, joined into a sentence — *Lose 3 more lives to a crash and buy 1 more thing at Cosmo's to fly …* (it said *crash into something*, which a crash a shield takes does not count; reworded by the review of the secret pilots) 0546's sentence is its first part, unchanged |

## Why it is built the way it is

**The cause is read off the order the pairings already run in.** Only one hit lands in a step, because
the first sets the window and the rest skip the ship. The fire is paired first, so the hull's health
between the fire and the bodies says which landed. No pairing learned anything new, and nothing in the
step allocates.

**The count is an agreement in the root, not a dispatch in the shell.** It is a rule about two slices —
a run's death moves the hangar — so it lives where 0521's win does, and the real reducer is what the test
drives. A death reported at nought lives moves no run, so it counts nothing.

**The two counts are not the same kind of thing, and only one is saved.** A crash happens once and is
gone, so it has to be counted when it happens. What was bought is still there to count, in `owned`.

**Every row says its whole lock** — 0282: the four starting pilots say nothing in all three parts, rather
than a shared default standing in for them.

**The stone is a body.** The page says *non-bullet*, and a wall is not a bullet. With the stone at the
`solid` assist the wall only pushes, so it cannot crash a ship. That makes the count slower to earn,
never the game harder (0024).

## Rollback

⚠️ **Owed** — [0001](0001-revertability-not-risk-rating.md): `crashes` is a new field on `itc_hangar`
version 1. An older build reads the document as before and ignores the field, but writes the hangar back
without it the next time anything in it changes, so a player who goes back to an older build loses the
count. Nothing else is lost, and the count starts again from nought. No version bump: an older build can
still read everything it knows.

## What guards it

`tests/crashes.test.ts`: the frame names an enemy shot as fire, and an enemy body and the stone as bodies;
a body death is one crash, a fire death none, the death that ends the run one like any other, and a
report at nought lives none; the count survives the
save, and a document written before it, or holding something that is not a whole count, reads as none;
nothing free counts as bought; a lock is shut until every part is met; and the hint counts down. Probes in
`scripts/probes/0592-the-crashes-are-counted.mjs`. 0546's, 0522's and 0590's probes are re-anchored.

## Owed

Nothing to play yet: no pilot names a count. Item 2 of the plan is the first that will, and the hint is
seen there.
