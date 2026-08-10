# 0113 — There is one composition and seven levels, and the mix is not a track

**Accepted 2026-08-11.** The music item of the tenth play-test, which is the eighth round of
substantially the same report and the first one to be answered by reading the architecture rather
than by moving a number.

**It supersedes nothing and reopens everything**: [0090](0090-the-music-is-four-loops.md),
[0092](0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md),
[0095](0095-the-level-has-its-own-music.md), [0102](0102-the-music-goes-somewhere.md),
[0104](0104-the-gun-plays-a-figure.md), [0107](0107-a-level-is-a-place.md) and
[0108](0108-the-bed-is-felt-and-the-boss-arrives.md) are each correct about the piece they tuned.
There is only one piece, and none of them says so.

## The rules

**A theme owns its own composition.** `MUSIC` is a table over `ThemeKind`, not a single score, and a
level's music is baked when the level is entered rather than at prewarm. Themes may share a voice
array; a theme that shares every array has no music of its own and fails a test.

**The beat is a per-level quantity, threaded as an argument.** `STEPS_PER_BEAT` stops being a module
constant. It remains constant *within* a level, which is all
[0093](0093-the-gun-is-on-the-grid.md) ever needed.

**A theme carries its beat and its subdivision ladder together, and every subdivision divides the
beat.** The ladder cannot stay on `ShipRow`: the reload ladder is what pins the tempo, so the two are
one choice or neither is free.

**A theme's tempo is a gameplay number.** Every cadence in this game is a fraction of a beat, so the
gun's real-time reload moves with the tempo. A guard bounds the spread across the seven — a level may
not be quietly easier because its music is slower.

## What was asked for

> *"music still needs a lot of work, it's the same repetitive couple of beats still and only changes
> when the boss aura starts to appear… it has no depth, no intricacy, no variety. It sounds like it's
> 1,2,3,4,5,6,7,8 repeat overset with every 4sec or so a note that almost sounds like a bell ring…
> it doesn't change per level."*

And, decisively:

> *"I've given the same feedback a lot now, so I'm obviously describing the wrong thing the wrong
> way, because I'm not really noticing much if any difference sound over the past few prompts."*

⚠️ **THE DESCRIPTION WAS NEVER WRONG.** It is a correct transcription of what the code plays, and
the last seven rounds each answered it inside the constraint that guarantees it cannot be fixed.

## What the code actually plays

`MUSIC` in `src/content/music.ts` is one `Record<MusicLayer, Voice[]>` — one key (A minor), one
progression (Am–F–C–G / Am–F–G–E), one tempo (150 BPM), one drum kit. What a level themes is a **gain
multiplier per layer** (`THEMES[…].mix`, [0107](0107-a-level-is-a-place.md)). **Not one note differs
between any two of the seven levels.** Level two is level one with the drone at 1.35× and the arp at
0.72×.

Measured, on `bossAt: 6350` at 36 units/second:

| | |
|---|---|
| longest loop in the game | **12.8 s** — `chords`, `sub`, `arp` at 8 bars |
| every other layer | 3.2 s or 6.4 s |
| the `run` rung | **the first 60 seconds of every level** |
| melodic layers open during those 60 s | **none** — `arp`, `hook`, `lead`, `toll`, `drive` all 0 |

What is open at `run` is a pad, a sine sub, a kick on every beat with a clap on 2 and 4, hand
percussion, and a sixteenth bass. **A four-on-the-floor kick with nothing melodic above it, looping
every 6.4 seconds, is what *"1,2,3,4,5,6,7,8 repeat"* is a description of.** The aura is the only
continuous quantity in the piece, which is exactly why it is the only change the player reports
hearing.

## Why seven passes produced nothing audible

Every one of them moved gains, loop lengths or velocities **inside the single piece**. The report
each time was *there is one track and it repeats*; the answer each time was *make the one track
better*. 0102 lengthened `chords` to eight bars. 0104 mastered the bus. 0107 gave the level a mix.
0108 raised the floor and gave `engine` four bars. All correct, all inside the wall.

⚠️ **The class failure is that no pass ever asked whether a mix can be a track.** It cannot. A gain
multiplier changes how loud an instrument is, and *this level sounds different* is a claim about what
the instruments are playing.

## What was rejected

**An accessibility setting that unlocks a louder mix.** Asked for explicitly, on the theory that
something was holding the audio back. **Nothing is.** `src/content/sound.ts` offers `on` and `off`
and nothing else; [0024](0024-the-accessibility-floor-is-settings.md) says the default game is
*"fast, bright, full of audio cues and warnings. Nothing in this decision restrains it."* A setting
that gates nothing is a setting that lies about why the music is thin.

**Carrying the variety in the boss aura.** Offered by the player as the fallback — *"if the only way
we can add actually musical changes to a level is by enemy auras, let's do that."* An aura is a gain
envelope over two existing layers. It can make material louder and quieter; it cannot add material,
and *no depth, no intricacy, no variety* is a claim about material.

**Keeping 150 BPM everywhere.** [0102](0102-the-music-goes-somewhere.md) named the grid as the reason
tempo could not rise and left *"whether the grid is worth what it costs"* as the next conversation.
It is worth what it costs — the gun, the enemies and the phase-lock all ride it — but it only has to
hold **within** a level, and nothing ever needed it to be one number for the whole game.

## The tempo lever was recommended before it was measured, and the measurement nearly killed it

⚠️ **A PER-LEVEL BPM WAS PROPOSED, ACCEPTED, AND THEN FOUND NOT TO EXIST IN THE FORM PROPOSED.** The
sim is 60 Hz ([0022](0022-frame-rate-is-a-feature.md)), a beat is a whole number of sim steps, and
`ShipRow.firePerBeat` subdivides it by **3, 4 and 6** — so the beat must be a multiple of twelve
steps. That is the complete list of tempos this game could express:

| beat | BPM |
|---|---|
| 12 steps | 300.0 |
| **24 steps** | **150.0** — today |
| 36 steps | 100.0 |
| 48 steps | 75.0 |

**Nothing between 100 and 150. Nothing between 150 and 300.** *"Level one at 132, level seven at
168"* was not a number anybody could have picked, and it was recommended without checking that the
grid could hold it — which is the same failure as tuning a channel nobody can look at, one layer up.

## So the ladder moves to the theme, and that is what widening costs

⚠️ **THE TRIPLETS ARE WHAT PIN THE TEMPO.** A ladder of 3, 4 and 6 mixes eighth-note triplets with
sixteenths; the least common multiple of those is twelve, and every coarse tempo grid in the table
above is that twelve. A ladder confined to powers of two frees the beat to multiples of eight —
112.5, 150, 225 — and still leaves holes.

⚠️ **SO THE LADDER IS AUTHORED WITH THE BEAT RATHER THAN AGAINST IT.** A theme states its beat and
the subdivisions it uses, and the subdivisions have only to divide *that* beat. Driven out, that
reaches a real spread with a whole `FIRE_GRID` and a reload in the four-to-nine-step band the game
already lives in:

| beat | BPM | ladder | reloads, in steps | feel |
|---|---|---|---|---|
| 18 | 200.0 | ÷3, ÷6 | 6, 3 | triplet |
| 20 | 180.0 | ÷4, ÷5 | 5, 4 | straight |
| **24** | **150.0** | **÷3, ÷4, ÷6** | **8, 6, 4** | **today** |
| 28 | 128.6 | ÷4, ÷7 | 7, 4 | straight |
| 30 | 120.0 | ÷5, ÷6 | 6, 5 | straight |
| 32 | 112.5 | ÷4, ÷8 | 8, 4 | straight |
| 36 | 100.0 | ÷4, ÷6, ÷9 | 9, 6, 4 | either |

⚠️ **WHAT THIS SPENDS IS [0093](0093-the-gun-is-on-the-grid.md)'s 5:1 PULSE-TO-MISSILE CROSS-RHYTHM
AND A CONSTANT WEAPON FEEL ACROSS A RUN.** A tier-three gun on level two is a different subdivision
from a tier-three gun on level five. The player was shown that cost in the option they chose and took
it; it is written here so the next hand does not discover it as a bug. **What it must NOT spend is
balance** — the real-time reload band is what the guard holds, not the subdivision.

## The instrument that should have been written first

⚠️ **Three rounds of *"the metronome"* were answered by guessing which layer it was.** 0102 answered
it in `beat`; 0108 answered it in `engine`. Two different layers, from the same four words, with
nothing in the repository able to settle which — while
[0027](0027-measure-the-picture-not-the-model.md) has said since it was written that a channel nobody
can look at must not be tuned from a description.

`node scripts/hear.mjs --solo` writes one file per layer at a rung's own gains. **The file name is
the answer.** It is nine lines of rig against three passes spent on the wrong layer, and the ordering
failure — building it after the third guess instead of before the first — is the transferable half of
this decision.
