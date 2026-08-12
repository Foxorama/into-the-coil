# 0127 — A cue has a place, and the low end turned out not to need one

**Accepted 2026-08-12.** [0118](0118-the-mix-has-a-width.md) gave the music a width and left the
effects with none. Asked for directly:

> *"Let's get the sfx and cues into proper stereo as well, as we'll need to do that anyway to really
> judge the sounds together."*

## The rules

**A cue sounds from where it happened.** `Speaker.play(kind, across?)` takes the world coordinate the
caller already has; `panFor` maps the lane to `CUE_PAN_LIMIT` and clamps. **No call site does that
arithmetic** — sixteen of them would be right and one would not.

**The places are a fixed pool, not a node per sound.** `PAN_BUCKETS` panners are built with the
context and never replaced, so a cue still costs exactly one allocation — the source node the
platform gives no way around, which is the reason `tests/budget.test.ts` names this file cold. The
pool is **odd**, so there is a bucket exactly at centre.

**A gridded cue keeps the place it was asked from.** [0104](0104-the-gun-plays-a-figure.md) makes an
explosion wait up to a sixteenth; by then the body that caused it is back in its pool. The position
is recorded at the ask, exactly as the accent already is.

**A cue with nowhere to be is centred, and that is an answer.** The chime answers a setting and a
menu has no world.

⚠️ **`CUE_PAN_LIMIT` IS 0.5, NARROWER THAN THE MUSIC'S 0.65, FOR THE OPPOSITE REASON.** A layer is
continuous, so a wide placement is a room. A cue is a transient landing ten times a second at max
fire, and a hard-placed transient is heard as a click at one ear rather than as an event over there.

## ⚠️ `hit` is the one cue with no place, and it is a property of the game

Every other cue is emitted beside the thing that caused it. A hit is inferred from a **count** —
bullets in flight before, minus after, minus the ones that killed — so there is no body to ask.
Placing it would mean `collideInto` logging every arrival and not only every death, which is a pool
the whole game would pay for so that one cue could be placed. It is centred, `src/app/frame.ts` says
so where it happens, and `tests/sound.test.ts` names it as the single permitted exception.

## ⚠️ A guard was written for the low end and then deleted, which is the finding here

0118 centres any MUSIC layer carrying 40% of its A-weighted energy below 130 Hz. The obvious move was
the same bound over the cue table. **Measured, it does not arise:**

| | |
|---|---|
| heaviest | `missile` **16.6%** |
| then | `bossShot` 13.7%, `blast` 13.5%, `bossDown` 11.9% |
| lightest | `threat` **0.1%** |

⚠️ **AND THE BOUND CANNOT BE REACHED.** Adding a lowpassed noise layer to `kill` at gains up to ×9
moved its share from 6.8% to **6.0% — down**, because a filter's skirt puts more into the mid than
into the sub and A-weighting discounts 25–130 Hz by about thirty decibels. Re-voicing the body into
the floor does cross it, and reddens [0089](0089-a-cue-has-a-body.md)'s **shed** guard first, every
time.

⚠️ **SO THE GUARD WOULD HAVE BEEN GREEN FOR EVER AND IT IS GONE.**
[0005](0005-a-guard-must-be-seen-to-fail.md) says that is not a guard, and
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)'s instruction is to delete it, fix
it, or leave it red. **There is therefore no `width` field and no exemption table** — which is also
the better outcome, because a field would have been a second description of a number the bake already
knows, and it would have let a boom-heavy cue be authored and then excused.

## ⚠️ And `npm run prove` found that five guards could not see the feature at all

**Removing the panner and connecting straight to the master left `tests/sound.test.ts` STILL GREEN.**
Every node-side guard drives `makeSpeaker` through a recorder double and measures the pan it
*computed* — and the pan was never the risky half. **Whether the node is wired through a panner is
not arithmetic**, and a cue on the master still sounds at the right level, on the right beat, with the
right accent. It is simply in the middle for ever.

⚠️ **THE ANSWER IS A BROWSER GUARD THAT COUNTS THE PLATFORM CALL**, which is
[0027](0027-measure-the-picture-not-the-model.md) for the channel with nothing to look at — the same
shape as counting ink on the canvas. `tests/sound.browser.test.ts` wraps the source node's own
`connect` and asserts every cue went into a `StereoPannerNode`.

⚠️ **AND THE FIRST VERSION OF THAT GUARD REPORTED 23 FAILURES ON A CORRECT BUILD**, because the music
makes buffer sources too — one per layer at every start and every re-phase. They are told apart by
**length**, which is exact rather than a heuristic: a cue is capped at 2 s and the shortest music loop
is 3.2 s.

## Four probes were orphaned by this change, and the harness refused to run

⚠️ **0072's two cue probes and 0104's two grid probes all anchored on lines this decision edited.**
`npm run prove` stopped before running anything —
[0019](0019-a-probe-must-be-seen-to-apply.md) working exactly as intended, and the point at which a
hand-run proof would have reported green. Each was re-anchored **with its break intact**; the
eleventh play-test records what a mechanical re-anchoring costs, and that was avoided here.

## What the dashboard needed, and why it is in this decision

⚠️ **`rig/` fired every cue with no position, so it centred all of them** — and it is the tool this
change would have been judged with. The gun and the tubes now sound from a **ship-across** slider, and
a kill, a hit and a threat are scattered across the lane, because that is where the bodies are.
[0126](0126-the-dashboard-is-the-instrument.md)'s own rule: an instrument that cannot show the thing
is worse than none.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the lane read as though it were already -1 to 1, so everything sits at one edge | `THE LANE IS THE FIELD: the edges reach the limit and the middle is the middle` |
| a body outside the lane no longer clamped, so it pans past the limit and off the pool | `THE LANE IS THE FIELD: the edges reach the limit and the middle is the middle` |
| an even number of places, so nothing can be exactly centred | `the places are a fixed pool with an exact centre, and nothing lands outside it` |
| a gridded cue lost the place it was asked from, so it sounds wherever the pool ended up | `A GRIDDED CUE KEEPS THE PLACE IT WAS ASKED FROM, not the one a sixteenth later` |
| a call site fired a cue without saying where it happened | `EVERY CUE THE GAME FIRES SAYS WHERE IT HAPPENED, and the one that cannot is named` |
| a cue connected straight to the master again, so the field is gone and the level is not | `0127 — EVERY CUE GOES INTO A PLACE` |

## What is owed

⚠️ **NOBODY HAS HEARD THIS.** Every number above is a model quantity;
[0027](0027-measure-the-picture-not-the-model.md) says a verdict comes from a hand. The dashboard is
where it is judged, and the question to put to it is whether a kill at the left edge reads as *over
there* or as *the mix wobbling* — the same distinction 0118 is still waiting on for the music.

⚠️ **`scripts/hear.mjs --play` IS STILL MONO** and is the mode for judging cues against the music.
`--level` writes stereo (0118) and the other three modes do not, so the WAV rig now shows a narrower
picture than the game. Named rather than fixed: the dashboard supersedes it for this question.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Nine nodes, one optional argument
and a pan. No storage key, no save field, no cache prefix.
