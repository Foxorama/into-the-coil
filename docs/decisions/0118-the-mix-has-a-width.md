# 0118 — The mix has a width, and the low end does not use it

**Accepted 2026-08-11.** Asked for by name after the
[0117](0117-a-section-change-lands-on-the-beat.md) renders: *"Let's add stereo and see how that
changes things."*

**It supersedes nothing.** Every gain, rung, distance and note is unchanged. What is added is a
**position**.

## The rules

**Every layer has a place in the field**, as a `Record<MusicLayer, number>` in `src/content/music.ts`
— a hub over the closed union, on [0016](0016-a-hub-enumerates-kinds.md)'s terms.

**A layer whose weight is below 130 Hz sits at centre**, and that is checked against the **baked
audio** rather than a list of names.

**Nothing is hard panned.** `PAN_LIMIT` is 0.65, so every layer is present in both ears.

**The buffers stay mono.** Twenty-three `StereoPannerNode`s, built with the graph.

## Why a position and not another gain

⚠️ **TWENTY-THREE LAYERS CAME OUT OF ONE POINT IN SPACE.** Two sounds in the same frequency band had
nothing to separate them but level — so every report of one part covering another could only ever be
answered by turning something down, which is what has happened six rounds running.
[0114](0114-the-fight-is-a-different-piece.md) says the next attempt must not be another gain.
**A position is not a level.**

Both halves of the report are masking:

> *"It's currently playing over the top of the music so it's drowning out some of the subtler other
> melody parts."*

> *"The surge and then the approach are less noticeable because the ongoing beat and melody is strong
> and the additions are subtle."*

⚠️ **The second one names the mechanism precisely.** `push` opens `arp` and `surge` opens `hook`; in
one place they compete with everything already playing on level alone. A third of the field apart they
are two parts. `tests/music.test.ts` holds that pair, and three others, apart.

## It costs no memory, which is not what a first reading suggests

⚠️ **THE OBVIOUS BUILD IS STEREO BUFFERS AND IT WOULD HAVE DOUBLED 52 MB** against a ceiling
`tests/sound.test.ts` says in as many words must not be raised a third time — *"if a change wants more
than 56 MB, it wants that mechanism instead."* **The layers stay mono and take a panner each**:
twenty-three nodes at context creation, nothing per frame,
[0022](0022-frame-rate-is-a-feature.md)'s budget untouched.

## Why nothing is hard panned

⚠️ **`PAN_LIMIT` IS 0.65 AND THE REASON IS A PLAYER WITH ONE EARBUD IN.**
[0024](0024-the-accessibility-floor-is-settings.md) bans a channel that carries information alone, and
music is not information — so this is not that rule. It is *"there is one game and it is the loud
one"*: a layer at ±1 is a layer somebody simply **does not have**, depending on how they are
listening. At 0.65 every part is present both sides.

## The low end is centred, and it is a measurement

⚠️ **DRIVEN OFF THE BAKED AUDIO, so it survives a layer being re-voiced.** A typed list of names would
go on passing the day a layer was dropped an octave. A panned low frequency spends headroom on one
side and arrives in a room as the same non-directional thump anyway.

⚠️ **AND THE GUARD DOES NOT COVER `groove`, WHICH A PROBE ESTABLISHED RATHER THAN AN ASSUMPTION.** The
first version of that probe panned the bass line and went red **on the wrong test** — because `groove`
measures 18% in `low` and is not low-heavy at all. **It is a bass line in the sense of a part, not in
the sense of a spectrum.** It is centred by hand, and the guard is about `sub`.

## What the measurement said, and it corrected me first

⚠️ **THE FIRST TABLE HANDED TO THE PLAYER WAS RAW RMS, WHICH IS ENERGY AND NOT LOUDNESS.** They
answered *"I don't even think I've heard `itc-solo-sub` either"* — about the layer that table called
the loudest in the game. A-weighted, which is what `tests/spectrum.ts` has done since
[0089](0089-a-cue-has-a-body.md) *"because the ear is thirty decibels less sensitive at 50 Hz"*:

| layer | gain | raw RMS | as heard | on a small speaker |
|---|---|---|---|---|
| `engine` | 0.90 | 0.0874 | **0.0 dB** | **0.0 dB** |
| `groove` | 0.80 | 0.0311 | −4.1 dB | −4.5 dB |
| `chords` | 0.86 | 0.0527 | −5.7 dB | −6.0 dB |
| `sub` | 0.86 | **0.0963** | **−9.3 dB** | **−13.2 dB** |
| `call` | 0.62 | 0.0062 | −12.2 dB | −12.3 dB |

⚠️ **`sub` HAS THE HIGHEST ENERGY IN THE FILE AND IS THE SECOND QUIETEST THING AN EAR HEARS.** It is
spending the headroom `MUSIC_GAIN` is capped by ([0092](0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md),
[0104](0104-the-gun-plays-a-figure.md) both measured that ceiling against it) and returning −13 dB on
a normal speaker. **That is 0027 firing on my own instrument**, and it is the third time in this arc.

⚠️ **NONE OF IT IS ACTED ON HERE.** The player named `engine` and reported `groove` as never heard;
that is a level and a spectrum change, it is a different mechanism from a position, and landing both
at once makes the next verdict unattributable. **It is the whole of what 0119 is for**, and this
decision records the measurement so that one starts from it.

## What was rejected

**Panning the aura narrow.** It is atmosphere and it is the one thing that should surround; it sits at
±0.6, the widest pair in the table.

**Spreading `chords`' six voices across the field.** One pan per LAYER, so a layer is one place. Voices
would need their own panners and their own table — a second mechanism for a thing no report has asked
for.

**A mono setting.** Nothing here loses information ([0024](0024-the-accessibility-floor-is-settings.md)
is satisfied by `PAN_LIMIT`), and a setting that gates nothing is what
[0113](0113-there-is-one-composition-and-seven-levels.md) refused.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the sub pushed off centre, so the deepest thing in the game is panned | `THE ONE THAT IS A MEASUREMENT AND NOT A TASTE: a layer whose weight is low is centred` |
| a layer pushed hard to one side, so half the mix is gone in one earbud | `and nothing is hard panned, because a player may have one earbud in` |
| every layer centred, so the graph is stereo and the mix is not | `THE POINT OF IT: the field is actually used, and the two sides are balanced` |
| the riff moved on top of the sixteenths, so nothing but level separates the two things a rung opens | `and the two layers most likely to mask each other are not in the same place` |

⚠️ **TWO OF THOSE FOUR FAILED FIRST, AND NEITHER WAS THE GUARD'S FAULT.** *"Every layer centred"*
zeroed two of twenty-three and reported STILL GREEN — correct, fourteen were still placed. *"The bass
line panned"* went red on the wrong test. **Both were breaks that did not reach what the guard reads**
— [0019](0019-a-probe-must-be-seen-to-apply.md)'s other half, hit three times in this session.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save schema, no
cache prefix, no origin. Twenty-three nodes and a table of positions; every note and every gain is
what it was.
