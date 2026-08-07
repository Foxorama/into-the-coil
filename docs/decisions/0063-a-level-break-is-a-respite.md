# 0063 — A level break is a respite, not a screen

**Accepted 2026-08-07.** Amends `SCREENS.cleared` and what a timeout means. Extends
[0046](0046-a-pad-is-a-first-class-way-to-press-a-button.md), which introduced the expiring screen,
and [0042](0042-a-run-is-a-sequence-of-levels.md), which put a screen between two levels in the first
place.

## The rule

**A screen says two things, not one: whether it STOPS the world, and whether it HIDES it.** They were
one field for as long as every screen with chrome on it did both.

The level break does the second without the first: `steps: true`, `dims: false`. The sky the boss died
in goes on scrolling, the player goes on flying, the HUD stays up, and *Level clear* is a line of text
at the top of the screen with `pointer-events: none` under it.

**A screen that expires acts for the player, and `timeout.then` says how:** `null` presses the
screen's own first control, a named screen goes there instead. *(Amended before landing — the first
version of this decision had no `then` at all. See the section below.)*

**Only a dimming screen shows a countdown.**

## What was reported

> *"The between-levels screen should become a brief respite. The current pause/level screen interrupts
> the flow."*

And, in the same breath, the thing that makes this more than a polish item:

> *"This will probably change how we implement the journey star-map between levels, and the player
> choice will probably get scrapped, because a flowing continuation to the next run with a brief
> respite will feel better than the hard pause interruption now."*

⚠️ **That is a product finding about a feature that does not exist yet.** `docs/game.md` puts a
branching chart between levels and [0042](0042-a-run-is-a-sequence-of-levels.md) records a straight
line as a deliberate first step *"decided against levels somebody has played"*. Somebody has now
played them, and the answer they came back with is about the SHAPE of the boundary rather than about
what is on it. Recorded rather than acted on: this decision changes the break, not the chart.

## Two fields where there was one

Every screen with chrome on it stopped the simulation **and** painted over the scene, so nothing had
ever needed to say which of the two it meant — `steps` did both jobs and only one of them was in its
name. The level break wants the second without the first, so the two came apart.

⚠️ **`dims` also decides the countdown**, and that is a relationship rather than a filter. A screen
that has stopped the world owes the player a number saying when it will stop doing that; a banner over
a world that never stopped does not, and a countdown there is exactly the *restating what the screen
already shows* `docs/game.md` bans.

## `onTick`, which is not a second `onIdle`

`onIdle` answers *a fixed step happened and the simulation did not take it* — it is where the menu pad
is read (0046). The countdown lived inside it, which was correct for exactly as long as every
counting screen was also a stopped screen.

The level break counts down **while stepping**, so its timer would simply never have ticked. `onTick`
runs on every step, on both sides of the branch, and the countdown moved there. Two probes hold the
pair: one removes the tick, the other runs the menu reader on every step and spends 0046's *exactly
one snapshot per fixed step* twice.

## `then` was deleted here and earned itself back within the week

A timeout used to carry `then: Screen` beside its duration. This decision deleted it, on the grounds
that it was a second description of what the screen's own control already did: the run-over screen's
*Again* went to the title and its timeout went to the title, and the two agreed only because somebody
kept them in step. Expiring pressed the first control instead — which is what made this decision
possible at all, because *Onward* carries the run into the next level and is not a `Screen` value that
could ever have been named.

**Then [0068](0068-a-run-over-is-a-continue.md) landed on `main` while this branch was open, and
turned *Again* into *Continue* — a button that RESUMES the run.** Pressing the first control on expiry
now handed the run back to a player who had walked away, which is the exact opposite of what those
seven seconds are for. It merged clean, typechecked, and was caught only by
`tests/menu.browser.test.ts` sitting through the countdown.

So `then` is back, as `Screen | null`: `null` for the level break, `'title'` for the run over.

**What was actually wrong was not the de-duplication, it was the reasoning behind it.** Two values
that agree today are not one value — they are two values that agree today. The question *what happens
when the player does nothing* and the question *what happens when they press the only button* have the
same answer only while that button is a way of giving up, and nothing in the code said so. Collapsing
them was a silent bet on every label the game would ever show, and it lost the first one.

The general form is worth more than the field: **a de-duplication is a claim that two things are the
same thing, and it needs the argument that a rule needs.** *They are equal right now* is not that
argument. The cost of being wrong is not a duplicate — it is a screen that lies about what it does,
found by a browser test seven seconds at a time.

## The end of `STYLE` broke twice, and the second one was invisible

Both branches in flight appended a block to the end of the stylesheet, so both merges conflicted at
the same line. The first resolution dropped the tap strip's rules entirely. The second kept them and
ate the opening `/*` of the comment above them — which is not a syntax error in TypeScript, because
`STYLE` is a template literal and a string with rubbish in it is a perfectly good string.

The CSS parser is what finds out. It discards from the rubbish to wherever it can next recover, and
what it discarded was `.itc-playing-strip`'s `display: none` and `pointer-events: none`: a strip
drawn on every desktop, over a screen with no touch on it, swallowing the taps it exists to point at.
Three browser tests caught it — at seconds apiece, and only because somebody had already written them
for something else.

`tests/chrome.test.ts` now walks the sheet's comments. **A count of openers against closers would
not do**: a closer followed by an opener balances and is entirely broken, so it answers the question
the parser actually asks, which is whether it is inside a comment at this character.

⚠️ **The lesson is about the resolution, not the merge.** A conflict at the end of a file where both
sides append is not a choice between two versions — it is *keep both*, and the only hard part is the
part a diff will not show you: whether what you pasted still parses. Nothing in `npm run check`
knew, and that is now false.

## Confirmed, not assumed

Probes in `scripts/probes/0063-respite.mjs`. **10 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the level break stopping the world again, which is the interruption that was reported | `the level break keeps the world running and does not paint over it` |
| the countdown spent only on steps the simulation skipped, so a running screen never expires | `a countdown gets a step whether or not the simulation took it` |
| the menu reader run on every step rather than only on the ones the simulation skipped | `a countdown gets a step whether or not the simulation took it` |
| a screen that expires onto its own control with no control for the expiry to press | `a screen that expires onto its own control has a control to press` |
| the run-over countdown pressing its own Continue button, which hands back the dead run | `a screen whose control RESUMES the run does not expire onto it` |
| the shell pressing the control on expiry rather than going where the row says | `counts down and returns to the title with no input at all` |
| a stylesheet comment's opener eaten, so the parser discards the rules behind it | `every comment in the stylesheet is opened and closed` |
| the level break painting the space colour over a scene that is still moving | `paints nothing over the scene and takes no pointer` |
| the break left taking pointer events, so it swallows the thumb that is still flying | `takes no pointer` |
| the control left unable to take a press, so the break cannot be skipped | `while its control still does` |

⚠️ **Three of them are computed style, and none of the three is visible in a screenshot.** An overlay
that paints the space colour looks like every other screen; one that swallows pointer events looks
like nothing at all until a thumb is on it; a control that cannot be pressed looks exactly like one
that can.

⚠️ **The banner's position was wrong and the cascade is why.** Its `margin-top` rule was written
beside the other level-break rules, near the top of the stylesheet — where the shared `margin: auto`
that centres every panel beat it on source order. The banner went on sitting over the middle of the
playfield, which is where the ship is. Caught by measuring where the button actually landed, in a
fraction of the overlay, which is the only thing that could have caught it —
[0027](0027-measure-the-picture-not-the-model.md).

⚠️ **The run-over countdown's own browser test now drives the new mechanism end to end.** It loses a
run by flying into things and waits seven real seconds for the title; every step of that goes through
`onTick` and `chrome.activate()`, which is the strongest thing said about either.

## What this leaves owed

**Three seconds has not been played**, and it is the number most likely to be wrong: too short and the
break is a flicker, too long and it is the pause wearing a different coat.
[0037](0037-the-ship-has-mass.md)'s terms.

**It hands over from `docs/decisions/0062-a-boss-dies-loudly.md`'s beat**, and the two want playing as one
sequence: explosion, banner, next level. Neither has been felt beside the other.

**The chart is now a question rather than a plan.** `docs/game.md` still puts a branching map between
levels; the play-test says a flowing continuation may be worth more than the choice. That is not
settled here and is written down where the next session will find it.
