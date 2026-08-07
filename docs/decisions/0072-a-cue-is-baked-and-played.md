# 0072 — A cue is baked and played

**Accepted 2026-08-07.** The first sound in the game. Lands `src/content/cues.ts`,
`src/content/sound.ts`, `src/app/sound.ts`, a cue call beside every event the frame already draws,
the second setting on the title screen, and a fifth capability in the layer table.

Sits under [0024](0024-the-accessibility-floor-is-settings.md), which reserved the cue table and
named the field it had to carry, and next to [0070](0070-a-style-is-a-setting-and-the-first-one.md),
whose mechanism it is the first user of.

## The rule

**A cue is synthesised once at boot and played as a buffer; it names the picture it is the twin of;
and nothing that decides an outcome may know whether anyone is listening.**

[0022](0022-frame-rate-is-a-feature.md) says *art is baked to bitmaps and blitted*. This is that
sentence with the nouns changed, and the parallel is exact enough to be the whole design:
`bakeCues()` is `bakeAtlas()`, an `AudioBuffer` is a bitmap, and a one-shot source node is a blit.

## What was asked for

> *"pick up the sound work and see what we can do with it"*

Scope was settled before building: **effects only.** `docs/game.md` leaves music explicitly Open, it
is a much larger piece with its own decisions to make — what it is a function of, whether it survives
a death, how it ducks under effects — and it cannot land before this does. It stays Open.

## Four rules had already decided most of it

This is unusual and worth recording, because it is what a constitution is supposed to buy.

| already written down | what it settled |
|---|---|
| [0015](0015-the-layer-ladder.md) names `app/` as *"boot, the rAF loop, input, audio, wiring"*, and its probe plants **`src/audio/`** as a violation | there is no new layer, and there was never a question |
| [0024](0024-the-accessibility-floor-is-settings.md): *"the cue table does not exist, so the twin can be a required field on the row"* | `CueRow.twin`, and it was specified before anything was built |
| [0016](0016-a-hub-enumerates-kinds.md) | a closed `CUE_KINDS`, rows in a `Record`, behaviour on the row |
| [0003](0003-single-file-build.md) | synthesised, because a `.wav` beside the page is a sidecar and the list is closed |

## The twin field, and exactly what it proves

`twin` is required and its type is a closed union of pictures that exist. So a cue cannot be written
without naming what the player *sees* for the same event, and cannot name a picture that is not on
the list.

⚠️ **It does not prove the picture is drawn.** No type reaches across to a blit.
`tests/sound.test.ts` holds the two halves that are checkable — every cue has a twin, and **every
twin is claimed by a cue**, so the list cannot fill up with pictures nobody draws. The rest is
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)'s, and every event named here is
already guarded per event by the suite that owns it.

⚠️ **`TWIN_KINDS` is a LIST the union is derived from**, not a union written out — a bare union
cannot be walked, so the orphan half could never have been checked.
`src/content/sprites.ts` records what the same shape cost when it was three hand-kept descriptions of
one order.

## Twelve cues, and one of them needs its exemption argued

Eleven are events the model resolves, and each call sits beside the line that makes the thing
visible. The twelfth is `chime`, which sounds when the player switches sound **on**.

0036's boundary is *"an event the model does NOT resolve, the picture must not invent."* By the same
token the ear must not either — so this needs saying rather than assuming: **it is the answer to *did
that work*, on the one press in the game whose entire subject is whether sound comes out.** Switching
sound on and hearing nothing is indistinguishable from a broken build, and on a phone the same press
is what unlocks the audio context. A setting with no feedback is the failure; this is not an
invention of feedback for a non-event.

⚠️ **One cue for all six pickup faces**, and the split play will ask for first is the extra life —
[0052](0052-a-pickup-is-two-things-and-the-camera-says-which.md) already makes every pickup two
things, and the readout says which was taken.

## A survived hit is the one event nothing reported

`collideInto` returns what it destroyed and logs where. A hit that was *survived* is reported by
neither: its only trace is the flash written onto the body, which nothing reads back. So the frame
counts it — a player shot is released exactly when it arrives, and an arrival either killed or did
not:

```
survived = (shots in flight before) − (shots in flight after) − (kills returned)
```

⚠️ **Counted in `app/` rather than added to `Deaths` as a second log.** `sim/` may import `brand` and
nothing else, so a survivals log would be one more out-parameter threaded through the densest loop in
the game to serve a sound, and the two pool sizes already say it exactly.

## The frame budget, and the one allocation that cannot be removed

⚠️ **`src/app/sound.ts` is reached from a step and it allocates.** An `AudioBufferSourceNode` is
single-use by specification — `start()` may be called once and the node cannot be rewound — so there
is no pool to take it from.

**It is therefore on `tests/budget.test.ts`'s cold list with the reason written out, rather than on
the hot list.** Listing it as hot would be worse than not listing it: the scan looks for `new` and
for array methods, and `ctx.createBufferSource()` is neither, so the file would report clean while
allocating once per shot.

What bounds it instead is `MAX_VOICES` — **at most four cues may START on one fixed step**, asserted.
That is [0025](0025-the-frame-budget-is-counted-not-timed.md)'s own move, *count the thing rather
than time it*, applied to the budget it did not anticipate.

⚠️ **Past the cap, cues are DROPPED rather than queued** — the same choice `src/sim/pool.ts` makes
for a spawn, and safe here for a reason 0024 did not write it for: every cue has a visual twin, so a
dropped cue loses emphasis and can never lose information.

## Three things that decide when, and the flam is the one nobody expects

- **Off** — the mute, checked first because it is a boolean.
- **A per-cue `hold`, in fixed steps.** Two kills on consecutive steps are two identical sounds 17ms
  apart, which is not heard as two events: it is heard as one with a smeared attack, and at four it
  is heard as a fault. Per-step de-duplication cannot fix it, because the second kill genuinely is on
  the next step.
- **The voice cap**, above.

⚠️ **`voices` counts what SOUNDED, never what was asked for.** A cap counting drops would let four
retriggers of one held cue fill a step's budget and lock out the different cues behind them — the cap
causing exactly the failure it was added to prevent, on the busiest steps only.

⚠️ **The ORDER of the hold and the cap does not matter, and a comment in the first draft said it
did.** See *What the probes changed* below.

## The boss's cue is the one the cap would eat

`bossDown` is emitted at the very bottom of the step — behind the pulse, the threat and the hit. A
boss death also empties `Deaths`, so it would fire the ordinary `kill` cue too, and four voices are
already spoken for: **the loudest event in the game is the one the ceiling drops.**

So `kill` is suppressed on the step `bossJustDied(w)` is true, and that predicate is a function
because its two call sites are two hundred lines apart. `tests/sound.test.ts` drives a real boss to
death **through a real speaker with the cap on**, and asserts what came out rather than what was
asked for — an assertion about the ask would be green with the boss dying in silence.

## The unlock, and the gap it has

Every browser refuses to make a sound before a gesture, and a context created outside one starts
suspended. So **the context is built on the first gesture**, not at boot: a player who never presses
anything pays nothing, and the press that starts a run is the press that turns the sound on. The
title screen cannot be got past without one ([0047](0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md)
put the tier there), so no gameplay cue can be the first thing that needed it.

⚠️ **A GAMEPAD CANNOT GRANT ACTIVATION, AND IT ASKS ANYWAY.** The Gamepad API produces no DOM events
at all — it is polled — and user activation is granted by input *events*, so there is nothing for the
platform to attribute a pad press to. [0046](0046-a-pad-is-a-first-class-way-to-press-a-button.md)
made the pad first-class for every button in the game and cannot make it first-class for this.

**But the shell attempts the unlock from the menu-pad path regardless, and that is worth doing.**
Activation is sticky per page: a player who clicked anything at all earlier — itch's own play button,
the canvas, a tab — already has it, and the `resume()` then succeeds. What is left is narrow: a cold
load, a pad, and a browser that has never seen a click on this origin.

⚠️ **The first draft of this section said *nothing in this repository can*, and that was wrong** —
true of the platform, false about the code. It came back as an objection within the hour: *"if the
gamepad can move between menus and select a menu option to start a game, how can that not be counted
as input to start sounds?"* The platform answer stands; **not trying was a choice this file had made
and had dressed up as a law.** That is the more useful half of the correction, and it is the same
shape as the two probe findings above: a confident sentence about a mechanism, standing in for a
check nobody ran.

⚠️ **`resume()` runs on every gesture, not only the first** — a mobile browser suspends the context
when the tab is backgrounded, and a first-run-only unlock is silent for the rest of the session after
one phone call.

## The ban, and why it is the same shape as 0070's

`src/app/frame.ts` **names cues**, so it must import `src/content/cues.ts`. It must never see
`src/content/sound.ts`, which is why the setting lives in a second file: with one file the scan would
have to allow the import and inspect the *usage*, which is a claim about intentions rather than a
fact about the import graph — and 0070 chose the graph deliberately, because it *"goes on working
after everybody who remembers the reason has gone."*

⚠️ **The scan strips comments, and 0070's does not.** That is not an inconsistency, it is this
repository's house style catching up with its guards: every rule in `src/` cites the file it comes
from, so the frame names `src/content/sound.ts` in prose *precisely because* it may not import it. A
raw scan would fire on the sentence explaining the guard, and the only way to keep it green would be
to stop writing the citation — the documentation convention losing an argument to a regex. An import
cannot hide in a comment.

## The capability table had a hole, and audio is what found it

`tests/layering.test.ts` enumerates what a module may reach for: `dom`, `clock`, `random`, `storage`.
**`AudioContext` matches none of them.** `src/sim/` could have reached for an audio device and every
scan in that file would have stayed green — in a layer whose entire value is that it runs headless and
replays from a seed.

A fifth row, `audio`, granted to `app` alone. The probe plants `new AudioContext()` in `src/sim/` and
watches the layer scan go red, which it could not have done the day before.

## Retro is not silent, and that is deliberate

A style says what the game *looks* like ([0070](0070-a-style-is-a-setting-and-the-first-one.md)) and
a sound setting says whether it makes a noise. They are two settings on one screen, not one axis:
tying silence to retro would make a player who wanted the older look unable to have it loud, and
0024's *one game, knobs over it* is the rule against exactly that.

## The layout guard fired again, and this time it means something

0070 recorded the style row pushing the title screen *"nine pixels into needing a scrollbar"* on the
smallest landscape phone, and moved it into the left column with the pickup key. **A second row put
it six pixels over again.** Measured at 480×320:

| | |
|---|---|
| the pickup key | 191px |
| the tier buttons | 214px |
| so the left column's slack | 23px |
| two stacked settings | 51px |

**The deficit was vertical and the space going spare was horizontal.** The settings are now a
full-width wrapping row under both columns — 225px of content against 442px available, so they fit on
one line — and the short-axis padding drops from `5cqh` to `4cqh`, which affects nothing above a
container about 800px tall. That restores 9px of headroom, which is where 0070 started.

⚠️ **THE TITLE SCREEN IS NOW FULL, AND THE QUEUE HAS THREE MORE SETTINGS IN IT.** The palette, reduced
motion and flash intensity are all waiting, and a third row will not fit — the horizontal space this
change spent is spent. **This is the evidence 0070 said it did not have when it rejected a settings
screen**: it refused to invent one *"to hold a single two-option row"*, and that reasoning does not
survive a fourth. The next setting carries the screen, and with it the back-intent switch
[0017](0017-the-state-is-slices.md) still defers and
[0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) names as its trigger.

## An ears-on rig, and why it is owed now rather than later

[0027](0027-measure-the-picture-not-the-model.md) owes an eyes-on rig **before the first tuning pass
on anything the player watches move**, and its subject applies here with one thing worse: nothing in a
test suite can hear, so *every* assertion about audio is necessarily about the model.

`scripts/hear.mjs` writes every cue to a `.wav`, using the same `sampleCue` the game bakes with and
the same seeded streams — so the file is sample-for-sample what a browser plays. That is what
[0021](0021-one-stream-per-concern.md)'s seeded generator buys here, and it is why `Math.random` would
have cost more than it saved: the rig would have written a file nobody could claim was the game's
sound.

```bash
node scripts/hear.mjs --out=cues.wav
```

⚠️ **Every number in `src/content/cues.ts` is a play-test number on
[0037](0037-the-ship-has-mass.md)'s terms.** Nothing asserts one. The two most likely to be wrong are
named on their rows: `threat`, because at 0022's worst case there are 150 enemy bullets on screen and
this is what decides whether that is exciting or exhausting; and `pulse`, because auto-fire never
stops.

## What the probes changed — two guards did not fire, and both were right not to

[0019](0019-a-probe-must-be-seen-to-apply.md) earned itself twice in one sitting. Both times the
harness said **STILL GREEN** and both times the *code* was what was wrong, not the test.

**1. A fade-out that could not matter.** Every cue ended with a 2ms ramp to zero, because a buffer
that stops mid-waveform clicks. Deleting it on purpose left the suite green — at `DECAY` time
constants the envelope is already at 0.7% of peak when the buffer ends, a hundred times below where a
click is audible. **The ramp was defending a discontinuity the decay had already removed.** The fade
is gone, the assertion's threshold is now one only the decay can meet, and the probe breaks the decay
instead.

**2. An ordering that was not load-bearing.** The first draft asserted — and commented — that the hold
is checked before the cap, *"so a flam cannot spend the budget."* Swapping them left the suite green,
correctly: whichever runs first, a held repeat returns before `voices` moves, so the ordering cannot
be observed. **The claim was false and the comment said it anyway.** What is real is that the cap
counts what sounded rather than what was asked for; that is what the test and the probe now say.

⚠️ **Both were confident, plausible comments about mechanisms that did nothing** — the class 0019
exists for, and neither would have been caught by reading.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0072-sound.mjs`. **10 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the pulse cue moved inside the barrel loop, so a five-barrel volley is five clicks | `says one thing per volley and not one per barrel` |
| the step given sight of the sound setting, so silence could become a difficulty | `THE BAN: nothing that decides an outcome may import the sound setting` |
| the voice cap counting cues that were dropped, so repeats of one sound lock out the others | `does not let a cue held back spend the step’s budget anyway` |
| the ordinary kill cue firing for the boss too, which is what puts its own cue past the cap | `THE ONE THAT WOULD BE EATEN BY THE CAP: a boss dying is heard, through a real speaker` |
| the model reaching for an audio device, which no capability pattern used to match | `no layer reaches for a capability it was not granted` |
| the envelope never falling, so every cue ends at full amplitude and clicks into the next | `starts and ends at zero, because a buffer that stops mid-waveform clicks` |
| the noise stream taken by position rather than by name, so a new cue re-rolls the old ones | `takes its stream from the cue’s NAME, so a thirteenth row cannot change the twelve above it` |
| the settings slice rebuilt without the other field, so choosing a sound throws the style away | `and does not take the style with it, which a slice of two fields makes possible for the first time` |
| the unlock never wired up, so every cue is correct and the game is silent everywhere | `THE WHOLE CHAIN: a press unlocks it, the cues bake once, and a run makes voices` |
| the sound setting never reaching the speaker, so Off is a button that does nothing | `and choosing Off makes it silent without making it any less unlocked` |

⚠️ **Two of the ten can only be seen in a browser, and they are the two that would actually ship.** A
build where every cue fires on the right step, the table is perfect and the speaker's arithmetic is
right — and the context is never resumed — passes every unit test there is and is silent on every
device in the world. `tests/sound.browser.test.ts` wraps Web Audio's own constructors before the
page's script runs and counts them, which is the audible form of `tests/style.browser.test.ts`
counting ink on the canvas.

## What this leaves owed

**Music.** Still Open in `docs/game.md`, deliberately and by the same scoping decision that made this
effects-only. Procedural synthesis keeps the single-file build; a baked track does not.

**A hand on the twelve numbers.** Nothing here has been heard in play. The rig writes the file; the
verdict is a play-test, and it should be the same one that finally covers the fourteen unplayed
changes `docs/state-of-play.md` has been holding.

**A volume, rather than On/Off.** Two options is the smallest honest thing and the row is already the
right shape — a ladder is more entries in `SOUND_KINDS`, no new mechanism. It waits for somebody to
want one.

**Nothing persists.** A reload is sound back on, exactly as it is back to `DEFAULT_STYLE` — and this
is the second setting to say so. `save/` is queued with the first `itc_*` key.
