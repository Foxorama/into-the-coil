# 0153 — Desktop is the target, and the phone is a port that has not started

**Accepted 2026-08-16.** Supersedes the sizing half of
[0022](0022-frame-rate-is-a-feature.md). Keeps every rule 0022 made about *how* to be fast.

> *"Why is the phone coming into it again? The scope has changed to be desktop first, so we need to
> restructure that as well. Once we're in a good desktop place, we can then revisit what needs to
> happen to make it phone portable."*

## The rules

**Desktop is the target for SIZING as well as for play.** A budget, a ceiling or a capacity is
argued against a desktop browser. The phone is a port that has not been started and is not a
concurrent constraint on anything.

**The phone may not be cited as a reason to make something smaller, shorter or fewer.** A comment
that does is stale by definition and is corrected where it is found, not left standing.

**Everything 0022 said about HOW to be fast still holds, unchanged.** Fixed 60Hz sim with an
interpolating renderer; art baked and blitted; nothing allocating in the frame loop; cosmetics shed
before fidelity; `devicePixelRatio` capped at 2. None of those is a phone concession — every one is
correct on a desktop and several are load-bearing for correctness rather than speed.

**[0025](0025-the-frame-budget-is-counted-not-timed.md) is kept verbatim, and its argument is why.**
It counts draw calls and allocations rather than wall clock **because CI is not the target machine** —
and CI is not a desktop either. Nothing about that reasoning was ever about the phone.

## ⚠️ 0022 already said desktop was the play target, which is the whole confusion

Its own words, unchanged since 2026-08-04:

> **Desktop is the primary play target and is never the performance constraint.**

**So the phone was never the play target — it was only ever the SIZING target.** Every budget in the
repository was argued against a device nobody was expected to play on, while the device everybody
plays on was declared irrelevant. That is a coherent position for a project intending to ship to
phones, and it is the wrong one for a project that is not.

⚠️ **THIS IS A SCOPE CHANGE AND NOT A DISCOVERY.** 0022 was right when it was written. What changed
is the product, and the record should say so rather than quietly drifting.

## ⚠️ What this changes today is nothing, and that is the finding

The expected answer was *raise the audio ceilings*. Measured, they do not need raising, because the
phone had already stopped binding the music and nobody had noticed:

- **The bake-time cap on `LAYER_BARS` is already gone.** 0095 refused eight bars because *"about
  900ms of synthesis… is a freeze at tap to start on the phone."*
  [0102](0102-the-music-goes-somewhere.md) moved synthesis to the title screen and spent it. `chords`
  has been sixteen bars since.
- **The 56 MB resident ceiling is already a desktop number**, and `tests/sound.test.ts` says so in as
  many words: *"48 MB, and it is a desktop-first number stated as one."*
- **And that ceiling forbids its own next raise for a reason that still stands.** *"THE THIRD RAISE
  MUST NOT BE A NUMBER… if a change wants more than 56 MB, it wants that mechanism instead."* The
  mechanism is baking a place at the level boundary, and
  [0133](0133-the-place-is-baked-at-the-boundary.md) built it. **A desktop-first permission does not
  retire that argument**, because it was never a phone argument.

⚠️ **SO NO NUMBER MOVES HERE.** What is corrected is **reasoning that would have bound the next
change**: `src/content/themes.ts` still argued that seven per-place compositions are *"not a thing to
hold in memory on the mid-range Android… and not a thing to synthesise at a level boundary either"*,
and the game has had seven per-place compositions and a boundary bake for four decisions.

⚠️ **A stale argument costs more than a stale number**, which is why this decision exists at all: a
number that is wrong gets measured and moved, and an argument that is wrong gets cited.

## What is retained but is no longer the driver

**Touch, landscape and the on-glass triggers stay** — [0031](0031-landscape-is-the-shipped-orientation.md),
[0032](0032-touch-is-relative-drag-and-not-a-stick.md),
[0060](0060-a-trigger-is-a-place-on-the-glass.md). They work, they cost desktop nothing, and deleting
them would be spending effort to remove a finished feature. What changes is that **they stop being a
reason to constrain anything else**.

⚠️ **AND THE PORT IS DELIBERATELY NOT DESIGNED HERE.** *"Once we're in a good desktop place, we can
then revisit what needs to happen to make it phone portable."* Sizing a device nobody is building for
yet is exactly the mistake this decision is correcting; the port gets its own decision when it is
real, with its own measurements.

## ⚠️ No guard, and the reason

CLAUDE.md requires a fix to name the guard, the rule, or the reason neither is worth it. **There is
no probe here because there is no new assertion**: nothing this decision changes is executable. No
constant moves, no behaviour changes, and `npm test` is 1052 green before and after.

⚠️ **AND THE OBVIOUS GUARD WOULD BE RED ON PURPOSE.** *"The phone may not be cited as a reason to
make something smaller"* is greppable, and a test that grepped it would flag `tests/budget.test.ts`
and `src/sim/collide.ts` — the two the section below **deliberately retains**. A guard whose first
run must be suppressed for the cases its own decision allows is
[0140](0140-no-layer-is-inaudible.md)'s *"how a threshold stops meaning anything"*, and CLAUDE.md's
*no counting guard* refuses exactly that shape.

⚠️ **`tests/links.test.ts` DID FIRE, and it is the guard that matters here.** This decision was cited
from three files while still untracked, and the suite refused it: *"a GITIGNORED target is the same
defect wearing a disguise: it resolves on the machine that wrote it and on no other."* A decision
whose whole product is citations is exactly the change that guard exists for.

## What still names a phone, and is left alone on purpose

`tests/budget.test.ts`'s worst-case entity count and `src/sim/collide.ts`'s per-second figure are
sized against the 2021 device. **They are not raised here**, on the scope the player set: those are
gameplay capacities, a regression in them is a gameplay regression, and they are blocking nothing.
They are a phone-sized floor under a desktop game, which is the safe direction to be wrong in. When
one of them blocks something, it gets measured and moved then — with a play-test, not with this
decision's permission.
