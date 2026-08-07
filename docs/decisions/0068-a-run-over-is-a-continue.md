# 0068 — A run over is a continue

**Accepted 2026-08-07.** Amends [0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md)'s *the
last life ends the run outright* and the sentence in `src/app/mount.ts` that read *"Again is a new
run and not a continue"*. Everything 0039 says about **what a death costs** is untouched — a continue
pays that cost one more time rather than forgiving it.

## The rule

**The run-over screen's button says *Continue*, and it resumes the run in place.** The level does not
restart: its camera, its wave table, its enemies, their bullets and the scatter the last death threw
are exactly where the player left them, frozen behind the screen. What is replaced is the ship and
the run's numbers — the tier's full complement of lives, the starting arsenal, no upgrades, a fresh
hull with no shell — which is the same ship a death the run survives would have handed back.

**The seven-second countdown is what it costs.** It was already there
([0046](0046-a-pad-is-a-first-class-way-to-press-a-button.md)); it is now a deadline rather than a
convenience, because nothing in this game takes a coin.

## What was asked for

> *"Change the 'again' to 'continue' … When a player loses their last life, the game needs to pause
> like it does now. Then if a player hits continue, the run picks up where it was, the last death
> needs to 'pop' out the upgrades for them to collect and they start with the starting stats as if
> they had started a new run — default lives, shields, bombs etc."*

> *"The tricky bit is that the game itself doesn't reset and restart, but the ship and player stuff
> does."*

## The tricky bit was already built, and it was built for something else

*"The last death needs to pop out the upgrades"* is
[0066](0066-a-death-scatters-what-it-took.md), which scatters on **every** death including the last —
a line that read as redundant on the day it landed, and whose comment says so: *"nobody collects them
on a run that is over."* Somebody does now. The ordering 0066 could not state in any one file —
`scatterUpgrades` before `lifeLost`, because the reducer is what empties the list — is what makes the
scatter contain the loadout rather than nothing.

The five-second timer does not run while the run-over screen is up, because that screen does not step
([0017](0017-the-state-is-slices.md)'s `steps` field), so a player who takes six of their seven
seconds to decide still gets the whole scatter to fly for.

⚠️ **This is the strongest argument yet for 0066's *no hidden conditions* line.** A `lifeLost` that
had skipped the scatter when the run was over — the obvious optimisation, and the one somebody would
have made — would have made this feature impossible to add without first undoing it.

## Three things that only make sense together

**The level is kept by calling `respawn` and not `enterLevel`, and that one word is the feature.**
The two live one line apart in `src/app/lifecycle.ts` and every other transition calls the second
one.

**The run is restocked BEFORE the screen moves, and the other order is an infinite loop.**
[0017](0017-the-state-is-slices.md)'s cross-slice agreement in `src/state/root.ts` raises the
run-over screen for a run at zero lives on the playing screen — so a resume that showed the screen
first would be read at zero and would put the run-over screen straight back up. The button would do
nothing, and would do nothing every time it was pressed.

**The spawn stream is not reseeded.** `begin` and `onward` both reseed because both are the start of
a level; a fresh stream mid-level would deal the rest of that level a different hand from the one the
player was already flying through — [0021](0021-one-stream-per-concern.md).

## What was rejected

**A continue that keeps the arsenal.** It is the obvious generosity and it undoes 0039 completely:
the arsenal is what a death costs, and a run that could buy it back by running out of lives would
make dying the cheapest way to keep an upgrade. What the player gets back instead is the *scatter* —
the same offer any other death makes, which is 0066 doing exactly what it was written for.

**Limiting how many continues a run may take.** A credit counter is a coin slot without the coin, and
there is nothing here for it to be scarce against. The seven seconds are the scarcity, and they are
real: walk away and the run is gone.

**Continuing from the victory screen.** Nothing to continue into — 0042's sequence has ended, and
that screen sits on top of something the player earned.

## The refactor this needed, and why it is not incidental

`begin`, `onward` and `resume` were closures inside `mount`, over its `state`, its `world` and its
`dispatch`. **That made *does a continue reset the level* a question with no test that could ask
it** — the only way in was to boot a canvas — and
[0005](0005-a-guard-must-be-seen-to-fail.md) cannot break what nothing can reach. They are now
`src/app/lifecycle.ts`, and `tests/continue.test.ts` drives all three against a fixture world and the
real reducer.

⚠️ **What a unit test still cannot see is which of the three the BUTTON is wired to**, because that
line lives over a canvas. `tests/continue.browser.test.ts` flies the tier with the fewest lives into
a real game over and presses the real button. It cannot tell a continue from a restart — both restock
the same readout and show the same screen, and the field is not in the DOM — so it asserts only the
half it can honestly see, and the probe table below says which probe each half caught.

## Confirmed, not assumed

Probes in `scripts/probes/0068-continue.mjs`. **9 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| a continue that re-enters the level, which is what the other two transitions do | `THE REPORTED ONE: the level carries on from exactly where it stopped` |
| the restock dropped, so the screen agreement puts the run-over screen straight back up | `THE REPORTED ONE: the level carries on from exactly where it stopped` |
| the level reset by the reducer, which is `begin` copied one line too far | `THE POINT OF IT: the level does not move` |
| the lives left where the last death put them | `and everything else goes back to what a run starts with` |
| the run restocked and the wreck left on the field | `and the ship is the one a death the run survives would have given them` |
| the spawn stream reseeded mid-level, which is the line `begin` and `onward` both carry | `and never reseeds the level’s own randomness, which is what would make it a new run` |
| the scatter the last death threw swept away by the continue | `leaves the last death’s scatter where the player can still fly for it` |
| the button offering to start again rather than to continue | `says Continue, and the word is the promise` |
| the run-over button wired back to the title, which is what it did before this decision | `says Continue, and puts the player back into the game rather than back to the title` |

⚠️ **The last one is the only guard over the wiring, and it is why a browser test exists at all.**
Every other row proves what `resume` does; that row proves the run-over screen calls it.

⚠️ **The assertion that the level was kept is written in SECONDS FLOWN, not in world units** —
[0027](0027-measure-the-picture-not-the-model.md). What a continue promises is *you do not fly this
stretch again*, and the honest measure of a stretch is how long it took: the fixture has to be more
than ten seconds into the level before *"the camera did not move"* means anything at all. The first
version stopped at the first wave, half a second in, and every assertion passed.

## What this leaves owed

**Whether a free continue is the right generosity is a play-test question, and it is the whole of
this decision's risk.** A run that can always be resumed cannot be lost, and *"eight levels toward
the centre of the galaxy"* (`docs/game.md`) is a claim about a run being hard to finish. The seven
seconds are the only thing standing against that, and nobody has yet watched them run out.

**The save must still not be a retry.**
[0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) says the save is an interruption hedge
and *"must never turn a game over into a retry"* — that is about reloading a page, and it is
unchanged. A continue is offered on a screen, for seven seconds, once the run has already ended;
reloading past a game over is still refused.

**A player who dies at the very back of the box recovers more of their own scatter**, which 0066
named rather than guarded. A continue makes that slightly more common, because the wreck sits under
the screen for as long as the player takes to decide.
