# 0095 — The level has its own music

**Accepted 2026-08-09.** The last of the three pieces
[`the-gun-on-the-grid-mapped`](../../reports/the-gun-on-the-grid-mapped-2026-08-09.md) left unblocked,
and the largest single addition of content the game has had.

> *"After playing it, I'm thinking something like a mix of a power ballad style music and the game
> Rez, without using any copyright material obviously… keep the current background music for the title
> background music and then let's really kick it up a notch in the game."*

And from the play-test before it: *"the non-boss background music makes kinda interesting title
background music, but not great level background music."*

## The rule

**`calm` is the title's piece and `run` upward is the level's. A layer's loop may be any whole
multiple of the shortest.**

## Two pieces, which is 0090 amended on its own prediction

⚠️ **[0090](0090-the-music-is-four-loops.md) wrote this down before anybody asked for it**: *"a level
that wanted its own key or its own tempo would need a second set of loops and a crossfade between
them, which is a bigger mechanism than this one and is not owed until somebody asks for it."*

⚠️ **The cheaper answer it did not consider is MORE LAYERS ON THE SAME CLOCK.** There is no second
loop set, no second start timestamp and no crossfade mechanism: the ladder's `calm` row holds the
title's layers and the other three hold the level's, and the change of piece is the gain ramp that
was already there. **That is 0090's own design, unchanged** — what changes is that the ladder is now
permitted to close something.

⚠️ **AND THE CLOSURE IS FORCED BY HARMONY, NOT BY TASTE.** The title's bass is an A-rooted riff with
no chord changes; the level's progression is A minor – F – C – G. Held open underneath, that riff is
a wrong note for three bars in every four. `TITLE_ONLY` names exactly which layers may close, and
`tests/music.test.ts` requires the set that actually closes to equal it — so the rule is a door
rather than a hole.

⚠️ **`drone` deliberately crosses both pieces.** It sounds an A and a G, which over F, C and G are
consonances, and it is what keeps 0090's *the music never stops* literally true — the change of piece
is a swell rather than an edit.

## A layer may be a multiple, and that is the same guarantee 0090 wanted

0090's single unrecoverable failure is layers that drift apart, and its answer was that every loop is
the same number of samples. **A whole multiple gives exactly the same guarantee**: a 4-bar pad over a
2-bar drum loop is back at both position zeros every 4 bars, for ever, because both are exact.

What identical lengths *also* did was forbid a chord progression — and a progression is what a power
ballad is. `LAYER_BARS` is 2 for everything rhythmic and 4 for the two layers that carry harmony.

⚠️ **`PHRASE_SECONDS` is the longest, and [0094](0094-in-time-is-not-in-phase.md)'s re-phase now lands
on it.** A correction on a 2-bar boundary would cut the 4-bar pad in half — 0090's seam, arriving at
runtime, in the one layer carrying the harmony.

⚠️ **Four bars and not eight, and the reason is the bake.** Synthesis costs 11.5ms per second of audio
and it happens at the first press. Eight-bar chords and lead would be about 900ms on this machine —
a freeze at *tap to start* on the phone [0022](0022-frame-rate-is-a-feature.md) sizes for. It is 485ms
as built, for 35.2 seconds of audio and 6.2MB.

## What the level actually plays

| layer | | |
|---|---|---|
| **engine** | four-on-the-floor, sixteenth hats, an open hat on every offbeat, a clap on two and four | the Rez half. **Not one pitched note in it**, which is what keeps it two bars — anything pitched would be wrong for half of a four-bar progression |
| **chords** | A minor – F – C – G, four detuned saws, and a rolling offbeat sub with a sine octave under it | the ballad half, and the reason a layer may be four bars |
| **lead** | a four-bar tune over the progression: rise, hold, fall, lift | **opens at the boss and nowhere else**, so the loudest structural event in the music is the arrival of a melody |

The ladder: `calm` = drone + bass + beat (what a level used to sound like, moved to where the
play-test said it belonged). `run` = drone + engine + chords. `approach` adds `drive`. `boss` adds
`lead` and the aura.

## The spectral guard found a real defect, and it took two goes to write

⚠️ **`spectrum` moved out of `tests/sound.test.ts` into `tests/spectrum.ts`.** It was written for
[0089](0089-a-cue-has-a-body.md)'s *"a tin shed heard from outside"* — a hump in the middle with
nothing at either end — and a whole new piece of synthesised music is the same question one octave
wider. Copying it would have been the second description this project keeps finding in its documents.

⚠️ **THE FIRST BAKE HAD LESS SUB THAN THE TITLE** — 5.1e-5 against 7.8e-5 — which for a piece built on
four-on-the-floor is backwards, and **every other guard in the file was green**. The kick's tail was
too short to put energy below 60Hz at all. The fixes are a longer, deeper kick and a sine octave under
the rolling sub; it is 9.1e-5 now.

⚠️ **AND THE GUARD THAT CAUGHT IT WAS WRONG FIRST TIME, in a way worth remembering.** It compared
`spectrum` profiles between two mixes — but `spectrum` normalises each mix to *its own* loudest band,
so it measures **shape**, and two shapes from different mixes cannot be compared at all. The level
reported as bass-light because its low-mid is large. `bandEnergy` is the unnormalised measure that
question needed, and the two are now separate functions with the distinction written on them.

⚠️ **The assertion is also narrower than the one I first reached for.** *More energy below 130Hz*
conflates how much with where — the two pieces put their bass in different places on purpose, the
title's riff around 110Hz and the level's kick and sub at 38–55Hz — so it would move whenever either
was revoiced. **Sub specifically** is the thing four-on-the-floor is for, and it is what was verified.

## The pulse cue is deliberately NOT re-voiced, and the ask has been overtaken

The map's second piece was *"the pulse re-voiced as a kick — 'more of a deep bassy beat'. Pure cue
work, no balance in it."*

⚠️ **That request was made when the gun was the only rhythm in the game.** There was no drum layer at
all: asking the pulse for a deep bassy beat was asking it to be the kick, because nothing else could
be. **There is a kick on every beat now**, and it is the loudest single thing in the music.

⚠️ **Making the gun bassy too would mask both.** A gun firing seven to fifteen times a second in the
same band as a four-on-the-floor kick is two sounds fighting for one place, and the thing the player
would lose is the beat they asked for. The pulse's job changed from *being* the low end to *cutting
through* it.

**So it is not done, and this is the record of why rather than an omission.** If it still wants more
weight once the engine has been heard, that is a different edit — presence rather than bass — and it
is three numbers in `src/content/cues.ts`.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0095-level-music.mjs`.

| broken on purpose | went red |
|---|---|
| a layer length that shares no phrase with the others | `0095 — THE AMENDMENT: every layer is a whole MULTIPLE of the shortest` |
| the phrase taken from the shortest layer | `0095 — THE AMENDMENT: every layer is a whole MULTIPLE of the shortest` |
| a level layer listed as the title's | `opens a layer at every step and never opens one twice` |
| the drone closed at `run`, so the pieces have nothing joining them | `and something is open at EVERY level, because the music never stops` |
| the chord progression truncated to half its layer | `0095 — every pattern spans EXACTLY its own layer` |

⚠️ **The last of those came back STILL GREEN and produced a new guard.** *Never asks for a note past
the end* was half a rule: a pattern SHORTER than its layer leaves the rest silent, just as quietly,
and `renderVoice` does not repeat. Truncating the progression to two of its four bars left the harmony
gone for half of every cycle with the layer still not silent, its length still right and nothing
clipping. **The two halves only became different failures when the lengths did** — a 2-bar pattern in
a 4-bar layer is the most likely way to get this content wrong, and `LAYER_BARS` is what introduced
it.

⚠️ **AND A GUARD TIMED OUT IN THE FULL SUITE WHILE PASSING ALONE.**
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) says establish which it is rather
than re-run: it was the guard's own cost, baking the whole loop set once per rung. It bakes once now,
and the three tests that do real DSP carry an honest twenty-second timeout — tens of millions of
multiplies is what a Goertzel over a 6.4-second phrase costs, and five seconds is a bound written for
tests that do arithmetic.

⚠️ **Six probes belonging to 0090, 0091 and 0094 needed re-anchoring**, and one of them needed its
BREAK changed rather than its text: 0090's *a level closing what the level below had open* used to
close `bass` at the boss, and `bass` is closed at `run` on purpose now. It closes `engine` instead.

## What this does not settle

**Whether it is any good**, which is the whole point and cannot be tested. `node scripts/hear.mjs
--music` writes every rung and the arc; the verdict is a hand on the controls.

**Whether A minor – F – C – G is the right progression**, and whether a lead arriving only at the boss
reads as an event or as a surprise. Both are content and both are one table edit.

**Whether the title should have kept `beat`.** `calm` now plays the drone, the bass and the beat —
more than the title had before — on the reading that *"the non-boss background music"* the play-test
liked meant what a level sounded like, not what the title did. If the title is now busy, the row is
one line.
