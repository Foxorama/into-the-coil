# 0148 — A place has its own notes, and six of them had the same seven

**Accepted 2026-08-14.** [0147](0147-a-place-is-a-balance.md) fixed the balance and said the material
question was next. This is that question.

> *"Level 3 currently reads as a copy of level 2 with some slight variation. It should be completely
> different thematically as a euro-beat technical trance melody. This issue carries on into 4-7 as
> well, the level melodies are copies of the earlier ones and aren't their own unique themes and
> styles. This game is a journey through the galaxy so each destination is light-years or millions of
> light-years apart, so for player feel, the music needs to reflect the completely alien different
> environments of each level."*

## The rule

**A place states the notes it may sound, and only the ROOT is shared.** `ThemeRow` gains a `scale`,
defaulting to `SCALE`; `tests/themes.test.ts` holds a place to the mode it declares rather than to the
natural minor, and holds every place to sounding A and E.

## ⚠️ THE MELODIES WERE NOT COPIES, AND THAT IS THE FINDING

Every place has its own file, its own sixteen-bar progression and its own tunes —
[0132](0132-a-place-may-be-another-piece-entirely.md) and
[0146](0146-three-more-places-and-two-after-them.md) wrote six of them. **A third set of notes would
have produced this report a fourth time.** `scripts/weigh-notes.mjs`, written for this:

| | |
|---|---|
| distinct pitch-class sets across seven places | **2** |
| places sounding exactly `A B C D E F G` | **six of the seven** |
| the odd one out | `approach` — **the base composition, which nobody wrote as a place** |
| chromatic share, the six authored places | **0.0%**, every one |
| chromatic share, the base composition | **5.9%** |

⚠️ **THE NEWEST AND MOST DELIBERATELY AUTHORED MUSIC IN THE GAME WAS THE HARMONICALLY FLATTEST**, and
the oldest was the only thing with any colour in it. Six places could choose their rhythm, their
balance, their timbre and their room, and could not choose a note.

## ⚠️ The guard that did it was wider than its own reason, and the shipped design already broke it

`tests/themes.test.ts` required every re-voiced note to be a tone of A natural minor. Two reasons, and
**both are arguments about the tonic**:

1. *"the place is simply wrong over its own bed"* — [0128](0128-a-place-plays-its-own-material.md),
   true of a place that shares `chords` and stated as outgrown in the guard's own comment.
2. *"a place in another KEY would put the player's own gun out of tune"* —
   [0099](0099-the-cues-are-in-the-key.md).

⚠️ **NEITHER IS AN ARGUMENT FOR BANNING THE OTHER FIVE NOTES.** A mode is not a key. And
`src/content/music.ts` has broken the ban **ninety-three times** since before the guard existed — a G#
in `chords`, `groove` and `arp`, a flat second and a tritone right through the fight — over these same
cues, with nothing ever reported out of tune.

⚠️ **THE EXEMPTION WAS AN ACCIDENT OF ORDERING RATHER THAN A JUDGEMENT.** The guard iterates
`revoicedBy`, and nobody re-voices the base, so the one composition with chromatic colour in it was
never in the loop. [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) says a guard the
shipped design fails is measuring the wrong quantity; this one was failed by the design in the file it
is written about, and stayed green for three weeks because of a `for` loop.

## What level three is now

**The V chord is E major.** `Am F C G · Am F Dm E · C G Am E · F G Am E` — four cadences in sixteen
bars where the old progression had none, and its own comment called that *"the genre"*:

> *"IT NEVER RESOLVES AND THAT IS THE GENRE. Every four-bar phrase ends on G and the loop starts again
> on Am, so the harmony is permanently falling into the next bar."*

⚠️ **THAT IS A FAIR DESCRIPTION OF TRANCE AND THE OPPOSITE OF EUROBEAT**, which is built out of hard
V–i arrivals. The defect was written down as a feature, in the file, in capitals.

⚠️ **AND THE TWO HALVES OF THE BRIEF NOW DISAGREE BY ONE NOTE.** The bone flute is pentatonic and
sings the natural seventh; the floor underneath plays the sharp one. `FLUTE` **rests on every E bar**,
so they are never sounding it at once — the breath every fourth bar and the cadence are the same
event. *Jurassic × eurobeat* stops being a register split and becomes a disagreement about a note.

## ⚠️ The supersaw was always reachable, and this project's own comment said it was not

`src/content/saurian.ts` said, and `src/content/nebula.ts` assumed:

> *"this synthesiser has no detune (`src/app/sound.ts` takes a semitone, not a cent), so the stack is
> built the way `drone` builds its own — two voices an octave apart through different filters."*

⚠️ **TRUE OF `steps`, WHICH IS SEMITONES. FALSE OF `octave`, WHICH IS A FLOAT.**
`src/app/music.ts:100` bakes at `MUSIC_ROOT * 2^(octave + semitone/12)` and nothing has ever required
the left term to be whole. `hook`, `counter` and `chords` are now detuned stacks at ±14, ±22 and ±16
cents. **No engine change, no new field, no bake cost** — and it is the one thing the octave trick
cannot fake, because two voices an octave apart are consonant and do not beat at all.

⚠️ **A `cents` HELPER RATHER THAN `2.0117`**, so the next place does not have to rediscover the
arithmetic or trust a magic number.

## ⚠️ And the kick stops for a bar, which is the gesture this game has never made

The sixteenth bar of `sub` drops the kick and nothing else. `groove`, `sub`'s own offbeat stab, the
hats and the pad all carry on, so the floor does not fall out — what goes is the thing the listener
has been counting, on the bar the progression cadences on, with two sixteenths as the run-up back in.

⚠️ **[0114](0114-the-fight-is-a-different-piece.md) SAYS THE ONLY MECHANISM THAT HAS EVER READ AS A
BOUNDARY HERE IS SOMETHING STOPPING**, and says it about the rungs, where it has cost three attempts
and is still open. Inside a loop it costs nothing: sixteen numbers.

## ⚠️ What was measured about the risk, and what the control is

The stated risk of a chromatic place is the player's gun: cues are baked once, in A
([0072](0072-a-cue-is-baked-and-played.md), 0099), so a G# in the level meets a G in the pulse.
`scripts/weigh-notes.mjs` prints both sides.

| | chromatic share | against the cues |
|---|---|---|
| **Saurian Belt, now** | **2.6%** | G# against G and A |
| **the base composition, always** | **5.9%** | G# against G and A; A# against A and B; D# against D and E |

⚠️ **THE CONTROL IS LEVEL ONE AND IT CARRIES MORE THAN TWICE THE EXPOSURE.** It has done so over the
same cues for the life of the project and has never been reported. That is the strongest evidence
available before a listen, and it is evidence about a picture rather than a model —
[0027](0027-measure-the-picture-not-the-model.md).

⚠️ **IT IS STILL A PROXY.** `weigh-notes` compares note CLASSES; it does not render a cue over a place
and measure roughness. If the next round says the gun sounds wrong on level three, **the proxy is what
to replace, not the G#** — 0147's own closing argument, one axis over.

## What replaces the old guard

| guard | what it refuses |
|---|---|
| a re-voiced tune stays in the notes **its own place states** | the typo the old bound was genuinely catching |
| **a place is rooted on A, whatever mode it states** | the half of the old guard that was always right — 0099 |
| **no two places that chose their notes chose the same ones** | the next place copying this one's mode |

⚠️ **THE THIRD ONE IS WEAKER THAN IT WANTS TO BE, ON PURPOSE.** *No two places share a mode* is a
bound **the shipped design fails** — five places still state none. Asserting it would mean either a
red suite or five declared modes no material plays, and a declaration nothing sounds is a lie a guard
would then protect. 0147 deleted a guard for this exact reason within an hour of writing it; this one
was narrowed instead of deleted because the narrow version still catches the failure that matters.

## What is NOT changed

⚠️ **The key, the root, the tempo, the grid, the rungs, the distances, `MUSIC_GAIN`, `MUSIC_DRIVE`.**
Every place is still rooted on A at 150 BPM on [0093](0093-the-gun-is-on-the-grid.md)'s beat.

⚠️ **Levels 1, 2, 4, 5, 6 and 7.** Not a note. The player asked for level three first and for the rest
after hearing it, and changing the reference in the same pass is what
[0109](0109-a-death-is-a-drum.md) forbids.

⚠️ **The mix row moved by one number and it is a trim, not a lean.** The detuned voices put saurian's
share under 300 Hz at `approach` to 27.96% against 0147's 28% floor; the fix is **less treble on
`counter`**, not more bass. 0147 records *more bass as the universal answer* as the thing that made
every place bass-led, and `scripts/weigh-mix.mjs` says every one of the six bounds is satisfied.

## ⚠️ And the clipping guard's budget was for two compositions

Six extra voices in one place took `and no theme at any rung drives the bus past full scale` from
**52.6 s to 62.2 s in CI, against a stated 60 s.** It had been at **88% of its budget on main** before
this decision touched anything.

⚠️ **THE GROWTH LAW IS NOT ABOUT 0148.** The cost is *samples × layers × rungs × places*, and four of
the seven places still have no material of their own. **Whichever of levels 4 to 7 had been written
first would have tipped it** — this decision was simply first.

⚠️ **THE ARITHMETIC WAS FIXED BEFORE THE CLOCK WAS.** `MUSIC_LADDER` holds a zero for **80 of the 161
(layer, rung) pairs**, and each was a multiply and an add against zero at every sample of every place.
Compacting each rung to the layers it opens is the same peak from the same samples.

⚠️ **AND IT MOVED THE TEST BY 9%, WHICH IS THE NUMBER THAT SETTLED WHAT TO DO NEXT.** The seven bakes
are **27.0 s** and the entire walk is **3.7 s** — 88% of this guard is `bakeLoops`, which is the thing
[0134](0134-the-place-keeps-the-games-pace.md) requires it to do. The clock goes to three minutes and
**the assertion does not move**: the same samples, the same shaper, the same `≤ 1`.

⚠️ **THIS IS THE THIRD TIME THIS GUARD HAS HIT SIXTY SECONDS**, and the two comments already in it are
the previous two. The difference is that this one is sized from a measurement of where the minute
goes rather than from whatever made it green again.

## ⚠️ What is owed

**A listen, and it is the only thing that settles this.** Every number above is a model quantity.

**And levels 4, 5, 6 and 7 have no mode of their own.** They are the rest of the report and they are
deliberately untouched: this pass exists to find out whether a mode, a detune and a break are what
*"somewhere else in the galaxy"* is made of. **If level three now reads as eurobeat, the technique is
proven and the other four are a day's work.** If it does not, the answer is not four more of the same.
