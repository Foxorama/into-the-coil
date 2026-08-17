# 0160 — The music free-runs

**Accepted 2026-08-17.** The second half of *drop the whole sim step rule*, and the last place the
sim reached the music. [0094](0094-in-time-is-not-in-phase.md) is superseded in the half that was
about phase; the half that was about the gun survives untouched.

## The rule

**The music runs on the audio clock and nothing corrects it.** `phaseTo`, `rephaseIn` and
`REPHASE_SECONDS` are gone, and `src/app/mount.ts` no longer tells the music anything about
`world.steps`.

## ⚠️ Why a correction became worse than no correction

0094 existed for one thing: `src/app/loop.ts` throws away everything past `MAX_STEPS` rather than
spiralling ([0022](0022-frame-rate-is-a-feature.md) working as designed), so a sim that fell behind
wall clock left the gun and the loops out of phase. The repair dragged the music back to the sim.

**[0159](0159-the-two-clocks-come-apart.md) ended the premise.** Sim seconds and musical time are no
longer the same quantity, and the moment a level authors a tempo they diverge by construction. A
re-phase would then drag the music towards a clock it has no relationship with, on a schedule nobody
could predict — **a correction towards a clock you no longer share is not a correction, it is a
glitch with a rule behind it.**

⚠️ **AND THE AUDIO CLOCK IS THE BETTER ONE**, which is the part worth keeping in mind rather than
mourning: `AudioContext.currentTime` does not drop steps. The music is now anchored to the clock it
is actually played against, and `anchorAudio` is the only origin left.

## ⚠️ What survives, and why it is not the same thing

`stepsToGrid` — the player's reload landing on a multiple of its own cadence from the run's origin —
**is kept.** Its stated reason was musical and is now false; the mechanism is not.

> *Every rung divides `STEPS_PER_BEAT`, so landing on a multiple of the cadence from the run's origin
> lands on a subdivision of the beat.*

What an absolute reload actually buys is **a gun whose phase does not move**: the same rhythm at
every tier, across every upgrade and after every death, rather than one that resets to wherever the
player happened to die. That is a thing a player can learn, and it was true before anybody connected
it to a beat.

⚠️ **A MECHANISM CAN OUTLIVE THE REASON IT WAS BUILT FOR; WHAT MUST NOT OUTLIVE IT IS THE CLAIM.**
Three of 0094's six probes survive on exactly this basis — the reload, a death rejoining the lattice,
and the sim clock counting only steps the game ran. None of the three was ever a claim about a beat.

## ⚠️ Six tests and three probes retired, on 0159's rule

| | |
|---|---|
| `tests/music.test.ts`'s whole `0094` block | six tests over `rephaseIn` — the settling rule, the loop wrap, the boundary landing, the notice window |
| three probes in `scripts/probes/0094-in-phase.mjs` | the three that broke `rephaseIn` |

Every one was right about its subject and every subject is gone. **A probe whose guard has been
deleted cannot be re-anchored, only retired** — the rule 0159 wrote for itself, applied a second time
in the same day.

## ⚠️ It also closes a bug class in the shell that the rig had already escaped

`rig/dash.ts` records an hour spent on this: a scrub jump makes the step clock disagree with the
audio clock by however far you jumped, the re-phase reads that as drift, and it restarts the loop set
at the next **phrase** boundary — up to 25.6 s ahead. `anchorAudio` becomes that future instant and
**the whole ladder freezes at whatever it was showing until the anchor arrives.**

The dashboard avoided it by never calling `phaseTo`. The shell called it every frame, and the same
trap was reachable there by any sufficiently large step backlog. **It is now unreachable from
either.**

## What is guarded

| | |
|---|---|
| the whole audio chain still reaches a speaker: a press unlocks, the cues bake once, a run makes voices | ✅ `tests/sound.browser.test.ts`, **in a real browser against the built page** |
| every cue still goes into its place rather than the master | ✅ same file, and it is the only guard that can see it |
| the reload lands on its own cadence from the run's origin; a death rejoins rather than restarts | ✅ unchanged — 0094's surviving three |
| the sim clock counts the steps the game ran | ✅ unchanged |

⚠️ **THE VERIFICATION IS WORTH RECORDING BECAUSE MY FIRST ATTEMPT AT IT WAS WRONG.** An improvised
probe on the dev server — wrapping `AudioBufferSourceNode.prototype.start` from the console — read
**zero starts** over twenty seconds of a running game, which looks exactly like *the music is
silent*. The same wrap on `/rig/` read 208. What settled it was the project's own instrument:
`tests/sound.browser.test.ts` wraps Web Audio **before any page script runs** and drives the built
page, and all five of its tests pass with none skipped.

⚠️ **A HAND-ROLLED INSTRUMENT AND A BUILT ONE DISAGREED, AND THE BUILT ONE WAS RIGHT.** The console
wrap almost certainly lost its patch to a dev-server reload; the point is that it produced a
confident, specific, wrong number, and the only reason it did not become a bug report is that a
better instrument already existed. [0027](0027-measure-the-picture-not-the-model.md) is usually
invoked against a model that disagrees with the picture — this is the same rule applied to two
instruments disagreeing with each other.

## What it costs

| | |
|---|---|
| `dist/index.html` | **253,400 → 253,039, 361 bytes smaller.** A per-frame call, a threshold, a wrapped-error calculation and an anchor, all gone |
| the frame loop | **one call lighter every frame** — `phaseTo` ran sixty times a second and returned early almost every time |

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix, no origin. Nothing here is serialised and nothing here is content.
