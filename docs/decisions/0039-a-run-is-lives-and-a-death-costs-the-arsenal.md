# 0039 — A run is lives, and a death costs the arsenal

**Accepted 2026-08-05.** The first decision about what the *game* is rather than about how the code
is shaped. Sits inside [0017](0017-the-state-is-slices.md), which said where `src/state/` goes and
deliberately said nothing about what it holds.

## The rule

| | |
|---|---|
| **lives** | three, fixed for the whole run. Extras are findable in a level |
| **a death** | spends a life and **clears the arsenal back to the ship's base weapon and starting special** |
| **the last life** | game over. The run is gone; the next one starts at the prologue |
| **the save** | an interruption hedge, never a safety net — see below |
| **carry forward** | means across *levels*, not across *deaths* |

Three screens exist: `title`, `playing`, `gameOver`. The simulation steps on `playing` and on nothing
else.

## What "upgrades carry forward" was always supposed to mean

`docs/game.md` said *"Upgrades, buffs and items carry forward for the whole run"* and *"carried to
the end of the run"*, and neither line said what a death does — so both read as *a death costs
nothing*. The intent was the level boundary: **you keep what you found when you move on, and you
lose it when you die.** Both lines are amended by this decision, and so is the resume line below.

That reading is what makes a pickup worth flying across the lane for. Under the other one, a run is
monotonic — every upgrade is permanent, the ship only ever gets stronger, and the last level is the
easiest thing in the game.

## Why a death takes everything rather than a tier

R-Type rather than Raiden II, and the reason is the shape of the thing being taken rather than a
preference about difficulty. `docs/game.md` says **the arsenal is a LIST, never a slot**, and calls
that a code constraint. Emptying a list is an operation the list already supports. *Dropping a
tier* is not: it needs an ordered power level running through every upgrade in the game, which is a
second model living alongside the list and disagreeing with it — and every upgrade authored
thereafter has to declare where it sits on a ladder that exists to serve one rule.

⚠️ **The cost is real and it lands on level authoring, not here.** A death that empties the arsenal
makes the level's pickup density load-bearing: a player who dies at the end of a level and cannot
rearm has been handed the hardest part of it with the weakest loadout. That constraint arrives with
the first authored level and is named here so it arrives as a known requirement rather than as a
play-test complaint.

## Why the save cannot resume from the start of the level

`docs/game.md` said a run resumes **from the start of the last level reached**, written when a death
was assumed to cost nothing. With three lives and a real game over, that sentence hands every player
an unlimited retry: lose your last life on level 5, close the tab, reopen, and you are at level 5
with a full complement.

The save exists so that **closing the page mid-run does not destroy the run** — a mobile hedge, for
a player whose browser was killed in the background. It does not exist to let a run be retried.

So: **the save stores the run's current lives and current arsenal, and the resume places the player
at the start of the level they were in.** Closing the page costs the progress made through that
level and returns nothing. There is no version of "quit and reopen" that is better than playing on.

⚠️ **The rejected alternative is the one that looks tidier.** Snapshotting the loadout as it stood at
the level's start would make a resume identical to a fresh attempt at that level — and that is
exactly the retry this refuses, plus a second copy of the run to keep in step. It also pays the
player to force-quit whenever a level goes badly, which is the strongest possible signal that the
mechanic is wrong.

This binds `save/`, which does not exist yet. It is recorded now because it is the reason the run
slice below carries live values and no snapshot.

## What the run slice holds, and the one field that is empty on purpose

```
lives    number
level    number
arsenal  a LIST
```

⚠️ **`arsenal` is empty today, and shipping it empty is the point.** Nothing is authored to put in
it — specials and weapon upgrades are their own work. What is decided *now* is its shape, because
two things downstream are designed against it: the save schema, which serialises this slice, and the
death rule above, which empties it. `docs/game.md` says a ship modelled with one special field makes
a second special *"a rewrite instead of a pickup"*, and the same is true of a save that persists one.
Declaring the list before there is anything to hold costs one type; discovering it later costs a
migration of a schema that has already shipped to players.

The guard is a test that a death empties it, which is a real assertion over an empty list and stays
a real one over a full one.

## Rejected: lives that refill at a level boundary

It was the recommendation, on the grounds that a bad level should cost the level rather than the
run. It is refused because it makes the game over unreachable in practice — with a refill and a
level-start resume, nothing in the game can end a run except quitting, and a *game over* screen that
no player ever sees is a screen that is never tested and never designed. Extra lives as pickups
solve the same problem in the level's own vocabulary, where the level author controls the answer.

⚠️ **Three is a play-test number, not a decided one.** It sits with `SHIP_SPEED` and `SCROLL_PER_STEP`
in [0037](0037-the-ship-has-mass.md)'s category: a starting point placed by a hand, settled by
playing. It cannot be settled honestly before a full level exists to lose it in.

## Deferred, with the trigger named: the back-intent switch

[0017](0017-the-state-is-slices.md) says adding a screen is *"a member on the `Screen` union, a row
in the router registry, and an arm in the back-intent switch"*. The first two land here. The third
does not, and the reason is that **none of these three screens has a back**: `title` is the root,
`playing` is entered from it, and `gameOver` returns to the root. Writing a back-intent switch now
would mean inventing a navigation graph to satisfy a sentence, and proving it against its own
fixture — [0005](0005-a-guard-must-be-seen-to-fail.md)'s failure shape.

It lands with the first screen a player can back *out* of, which is `settings` or `pause`,
whichever is authored first.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md).
`npm run prove 0039`:

| broken on purpose | went red |
|---|---|
| a death that leaves the arsenal alone | `a death clears the arsenal back to base` |
| a death spent from the last life without reaching game over | `the last life ends the run` |
| a life spent below zero rather than stopping at the game over | `lives never go below zero` |
| the root reducer given an arm that decides instead of routing | `the root reducer routes and does not decide` |
| a screen's chrome given a class outside its own prefix | `every screen's chrome namespaces its classes` |
