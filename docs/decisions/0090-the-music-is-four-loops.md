# 0090 — The music is four loops

⚠️ **SUPERSEDED IN PART BY [0114](0114-the-fight-is-a-different-piece.md), 2026-08-11.** The rule
below that *"the ladder is additive"* no longer holds: the fight closes the level's harmonic layers
and is a different piece. **Everything else here stands** — sample-locked loops of whole-multiple
lengths that cannot drift is this decision's real content and 0114 does not touch it.

⚠️ **The additive rule was a faithful reading of the ask AT THE TIME and outlived it.** Read this
file for why the loops are the shape they are; read 0114 before believing anything here about how the
ladder climbs.

**Accepted 2026-08-09.** Asked for alongside [0089](0089-a-cue-has-a-body.md) and deliberately built
after it, in the player's own words: *"this might be its own separate piece."*

**The first music the game has had.** [0072](0072-a-cue-is-baked-and-played.md) landed the effects
and explicitly did not touch this.

## The rule

**Four layers are baked as loops of identical length, started together, and looped for ever.
Intensity is nothing but their four gains.**

## What was asked for

> *"I reckon we need some background music as well — but this might be its own separate piece as it
> needs to be backgroundy and then get an increased beat and bass leading into the boss fight and
> really get pumping as the boss appears to make those fights truly epic."*

## Why it is not a sequencer, which is what it obviously should be

A clock with a lookahead, scheduling notes ahead of the playhead, is how music is normally driven and
it is the one thing this project cannot have: **every note it schedules is an allocation during
play**. [0072](0072-a-cue-is-baked-and-played.md) is the rule that sound is baked once and played,
which is [0022](0022-frame-rate-is-a-feature.md)'s *art is baked to bitmaps and blitted* with the
nouns changed, and a sequencer is that rule broken in a new channel.

**Four synchronised loops cost four source nodes for an entire run.** What that buys:

| | |
|---|---|
| **no scheduler** | nothing to allocate, nothing to drift against the clock, nothing to catch up after a stall |
| **layers that cannot separate** | identical sample counts, one start timestamp |
| **a transition that is a ramp** | four gain ramps, rather than one piece of music stopping and another starting |
| **survives a backgrounded tab** | the loops carry on from wherever the context resumes |

⚠️ **It costs the thing a sequencer would have been for**: the music cannot follow the game bar by
bar. It cannot hit a stab when the boss appears or drop out for a beat when the player dies. That is
a real limit and it is the right trade today — what was asked for is a *build*, and a build is
exactly what gains can do.

## The ladder is additive, which is the ask stated as a table

| | drone | bass | beat | drive |
|---|---|---|---|---|
| **calm** — title, level break, run over | 0.55 | — | — | — |
| **run** — cruising a level | 0.8 | 0.75 | — | — |
| **approach** — the boss is close | 0.8 | 1 | 0.9 | — |
| **boss** — it is here | 0.7 | 1 | 1 | 1 |

⚠️ **Every step opens a layer and nothing is ever closed except by going back down.** *"Backgroundy,
then an increased beat and bass, then really pumping"* describes **one piece of music getting
fuller**, not four pieces that swap — and `tests/music.test.ts` holds that as a property rather than
as these numbers.

⚠️ **The drone comes DOWN for the boss, which is the one place the ladder is not monotonic.** With all
four open the pad is what muddies the low end and the fight wants the bass and the kick underneath.
It is still open, so nothing starts or stops.

⚠️ **`calm` is not silence, and that is deliberate.** The music never stops: the levels happen inside
one continuous piece, which is why nothing anywhere calls `stop()`. A `calm` of zeros would be a
stopped piece of music wearing a running one's clothes, and the return from it would be an entry
rather than a ramp.

## What the layers are

| | |
|---|---|
| **drone** | two detuned saws, a fifth and a sub, behind a filter low enough never to compete. One note a bar, dropping to the seventh in the second — the only harmonic movement there is, and what stops two bars reading as a held note |
| **bass** | eighths, filtered and driven, with the octave under it. The same trick every explosion in `src/content/cues.ts` uses, for the same reason |
| **beat** | kick, backbeat and sixteenth hats |
| **drive** | a sixteenth arpeggio and toms rolling into every bar. A fill is what tells the ear a bar has ended |

⚠️ **A note is a `CueLayer` — the same type, through the same synthesiser.** Reusing it is not a
shortcut: a separate note type would grow its own filters and its own envelope and drift into being a
second instrument, which is how a game ends up with a soundtrack that sounds like it came from
somewhere else. What `src/app/music.ts` adds is **one line**: the wrap.

## The single failure this design cannot recover from

⚠️ **A loop whose length is not a whole number of samples.** There is no scheduler to re-align
anything, so four layers that disagree by a fraction of a sample drift apart for the length of a run:
**inaudible for the first minute and unlistenable by the fifth**, which is the worst shape a defect
can have.

`BEAT_SECONDS` is 0.45 — 133⅓ BPM, and eight beats is 3.6 seconds, which is exact at 44100, at 22050
and at 48000. `tests/music.test.ts` checks all three rather than the one it bakes at, because
[0089](0089-a-cue-has-a-body.md) has already moved the rate once.

## The seam, and the guard that had to be written for it

⚠️ **A note whose tail crosses the end of the loop must arrive at the START of it.** Without that it
is cut off at the join and the loop has a notch in it at the same place every 3.6 seconds — which
reads as a glitch in the build rather than as a bug in a synthesiser.

⚠️ **The first probe for it was pointed at the mix and came back STILL GREEN**, and so would every
other guard in the file: the lengths are right, no layer is silent, the ladder is intact, the sum does
not clip. It needed an assertion of its own, and it is stated as a property — **a loop cannot be
quieter where it begins than where it ends** — which is true of any loop whatever is in it. The drone
is what demonstrates it today (its first 10ms goes from 0.121 to 0.0034 when the wrap is removed) and
a future layer with no long tails is not exempted by name; it simply passes.

## The sim knows nothing about any of this

⚠️ **`musicLevelFor` reads the world and the world is never told.** It takes two numbers — where the
camera is and where the boss is — and returns a name.
[0024](0024-the-accessibility-floor-is-settings.md) forbids a comfort setting from reaching anything
that decides an outcome, and `src/app/frame.ts` has no idea the music exists. A player with the sound
off flies exactly the same game.

⚠️ **The boss level is keyed to a boss being on the field, not to a distance.** A boss drifts
([0061](0061-a-boss-keeps-flying.md)) and a fight lasts as long as it lasts, so the camera passes
`bossAt` in the opening seconds — a distance rule would drop the music back to a cruise while the boss
was still on screen shooting. The **approach** is a distance and the **fight** is a fact.

⚠️ **The approach is 430 world units, which is twelve seconds of scroll.** In the unit the player
experiences, per [0027](0027-measure-the-picture-not-the-model.md), and guarded in seconds rather than
in units.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0090-music.mjs`.

| broken on purpose | went red |
|---|---|
| the beat retuned to a length that does not divide the sample rate | `THE ONE THAT CANNOT BE RECOVERED FROM: the loop is a whole number of samples at every rate` |
| a layer left out of the bake, so a quarter of the music is silence | `and none of them is silence, which is the way a layer can be missing without failing` |
| a level closing a layer the level below it had open | `opens a layer at every step and never opens one twice` |
| the boss level keyed to the camera rather than to a boss being there | `and goes to the boss the moment one is on the field, wherever the camera is` |
| the boss approach cut to a length that is a sting rather than a build | `and builds as the boss gets close, in SECONDS the player experiences` |
| the loop wrap removed, so every note that crosses the end is cut off | `THE SEAM: a loop is not quieter at its start than at its end` |

⚠️ **Two of `tests/sound.browser.test.ts`'s counts moved, and one of them found a real design
mistake.** *Sound is off and the game played anyway* went red because the four looping sources were
being created with the gains — four voices running into a muted node are still four voices, and
silence should be silence. The sources are now built inside `start()` and nothing exists until the
music is wanted.

## What this does not settle

**Whether it is any good.** `node scripts/hear.mjs --music` writes the four levels and the whole arc —
cruise, the approach opening up, the boss arriving — and the verdict is a hand on the controls. Nothing
in a test suite can hear.

**One piece of music for seven levels.** It is A minor and 133 BPM from the first screen to the last
boss. A level that wanted its own key or its own tempo would need a second set of loops and a
crossfade between them, which is a bigger mechanism than this one and is not owed until somebody asks
for it.

**Whether the music should duck for the cues.** It does not: it sits at a fixed gain well under them
and gives way by being quiet rather than by being ducked. If a boss fight turns out to bury the shield
cue, that is where to look first.
