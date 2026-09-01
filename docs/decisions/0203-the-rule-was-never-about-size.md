# 0203 — The rule was never about size, it was about what can be mistaken for a threat

**Accepted 2026-09-01.** Amends [0069](0069-the-sky-is-behind-the-game.md) and
[0112](0112-the-sky-has-weather.md) on what the sky may draw, and nothing else about either.
[0198](0198-the-accessibility-pass-comes-after-the-game.md) is what makes it available: the contrast
floors that would have refused a bold backdrop are advisory now.

> *"the backgrounds aren't actually really any different visually. They might be numerically
> different in the background, but visually there's nothing interesting or different about the
> levels."*

> *"I want a completely separate thing for each level — for Ember Nebula, I want to see the eagle
> nebula in a scrolling background and when the massive pipe organ kicks in music wise we see the
> pillars of god going past. […] None of those elements are transposable to a different level so we
> need to uniquely craft the backdrop for each level."*

## What the two rules actually say, and why one word in them is wrong

0069: **nothing the background draws is as big as the smallest thing that can kill the player.** One
size ceiling for the whole sky, held against `SHOTS`.

0112: the sky may draw something bigger than a bullet **only if it has no edge** — and then far
larger, fainter and slower.

⚠️ **0069's REASON IS NOT ITS RULE.** The reason it gives is that *a mark that looks like a bullet and
moves like the world is confusable with a threat.* That is a statement about **confusability**, and it
was written when the only thing in the sky was a dot — so at the time, *small enough* and *not
confusable* were the same sentence. They stopped being the same sentence the moment anything else was
proposed.

**A planet is not confusable with a bullet at any size.** 0112 already half-admits this: it lets a
nebula through by requiring it be *far larger*, which is confusability reasoning wearing a size
ceiling's clothes. The `no edge` clause is doing the work the size clause claims to do, and it is the
clause that forbids a planet, a wreck, or an ice shelf — none of which anyone could mistake for
something coming at them.

## The rule

**Nothing the sky draws may occupy the size range of a thing that can kill the player.** The ceiling
becomes a **forbidden band**, open at both ends:

| | diameter, world units | |
|---|---|---|
| the existing sky fields | up to **1.2** | below the band — a mark too small to be a bullet |
| **the band — FORBIDDEN** | **1.8 → 16** | the smallest threat, to twice the largest |
| a landmark | **75** | above the band — too big to be a body |

The smallest thing that can kill the player is a `pulse` at radius 0.9, so 1.8 across. The largest is
a `warden` at radius 4, so 8 across. **The bottom of the band is 0069's own sentence, unchanged**;
the top is the new half, with a factor of two of margin because a body seen against nothing is
harder to size than one seen next to a ship. It is derived from `SHOTS` and `ENEMIES` rather than
typed, so a new body re-ranks it — 0069's own construction, kept.

⚠️ **THE FIRST DRAFT PUT THE BOTTOM AT HALF A BULLET AND THE GUARD CAUGHT IT.** `skyFar`'s largest
mark is 1.2 units across — shipped, correct, and refused by a bound invented in the same session as
the guard that enforced it. `CLAUDE.md`'s warning about counting guards is exactly this: *every one
flagged its healthy file as loudly as its sick one.* 0203 adds a ceiling's opposite end and nothing
else.

**A landmark is also the slowest thing on screen.** Its `depth` is strictly below every field's, so it
is unambiguously furthest away. 0112's *fainter* and *slower* clauses survive unchanged; only *no
edge* is struck.

## ⚠️ What this does NOT relax

**Gameplay legibility is not deferred and 0198 says so explicitly.** A sky mark the size of a bullet
still fails hard, on every palette. This decision moves the ceiling into a band; it does not open the
band. The guard that used to read *nothing above the ceiling* now reads *nothing inside the band*,
which is strictly more work, not less — it has a floor it never had.

## A landmark is placed, not tiled, and that is what makes the ask reachable

Every existing sky layer is a **tiled field**: `extent` is a repeat period, so a field has no
position. *"When the massive pipe organ kicks in we see the pillars of god going past"* is a
statement about a **position**, and no tiled field can express it.

⚠️ **AND IT NEEDS NO COUPLING TO THE MUSIC, WHICH IS THE WHOLE TRICK.**
[0158](0158-a-level-says-where-its-sections-open.md) puts a level's section changes on a `sections`
list in level-local distance — the same axis `waves` and `bossAt` already use. Ember Nebula's organ
enters at `push`, and level two's `push` is at **1299**. So the Pillars are a backdrop entry at
`at: 1299`, and *"the pillars arrive with the organ"* is **authored, not synchronised**.

That matters because [0160](0160-the-music-free-runs.md) took the sim out of the music entirely. A
runtime hook from the sky to the audio clock would put it straight back. Placing both against the
same distance script costs nothing at runtime and is checkable as a number: `tests/sky.test.ts`
asserts the Pillars' `at` equals the `at` of the section that opens the organ.

## The sentence, which is the part `docs/state-of-play.md` demands

> **Every place has one landmark you fly past — big enough to read as *somewhere* rather than as
> texture, and far enough behind that it never looks like something coming at you.**

⚠️ **IT IS WRITTEN BEFORE THE GEOMETRY AND IS CHECKED AFTER IT**, which is the instruction the last
backdrop pass did not have and [0196](0196-the-backdrop-is-rounded-out.md) is what it cost: that pass
chose its three axes **because they cost no contrast**, wrote that down as a virtue, and the player
could not see any of them. **Nine axes over two primitives is still dots and lines.** No number in
this decision is evidence that the sentence came true; a shot at the camera the game ships is.

## What is deliberately not decided here

**What each of the seven landmarks IS.** *"None of those elements are transposable to a different
level"*, so each is its own authoring problem and its own argument about silhouette, and bundling
seven into one decision would be the shared-primitive mistake spelled differently. This decision opens
the band and defines the mechanism; Ember Nebula's Eagle Nebula and its Pillars land with it as the
first, and each of the remaining six is authored on its own terms.

**The boss backdrop** — *"the hellish demonic space starscape as a backdrop for the boss fight"* — is
a second placement question (a landmark at `bossAt`, or a sky that changes at the boundary) and waits
until one place's landmarks have been seen.
