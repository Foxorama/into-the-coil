# 0134 — A place may be another piece and may not be a slower one

**Accepted 2026-08-12.** [0132](0132-a-place-may-be-another-piece-entirely.md) let Ember Nebula be its
own composition. It was, and it was **half the speed of the game it plays under**.

> *"The new level 2 Ember Nebula is pretty cool, but it doesn't fit the high paced gameplay we want
> yet. It's very high on the treble with no deep bassy times and needs either an undercurrent or
> emphasis riff that speeds through as a counterpoint, with a different styling for opening, push and
> surge. I think it also needs some really higher octave hits as well in a few spots… basically, the
> surge from level one should be the default music 'speed' for the next levels at the start to keep
> the intensity and pace of the game up."*

## ⚠️ Every clause of that was a number, and nothing here measured any of them

`scripts/weigh-rung.mjs` was written before a note was changed —
[0027](0027-measure-the-picture-not-the-model.md), and the report is what it exists to make checkable.
The two quantities are **notes a bar** ([0102](0102-the-music-goes-somewhere.md) settled that the rate
of events IS what a listener calls pace, since the tempo cannot move) and the **share of energy under
300 Hz**.

| rung | level one | Ember Nebula, as reported |
|---|---|---|
| `run` | 118 notes/bar · 44.5% low | **61 · 43.6%** |
| `push` | 188 · 40.7% | **92 · 36.0%** |
| `surge` | 172 · 39.7% | **90 · 31.5%** |
| `approach` | 139 · 38.5% | **86 · 30.6%** |

**Half the notes at every rung, and eight points of bottom missing where the organ plays.** The player
described it by ear and was right to the decimal.

## The rule

**A place may not be substantially slower or brighter than the base composition at any rung.** Held
at 0.9 of the base's own figure, per rung, in `tests/themes.test.ts`.

⚠️ **THE FLOOR IS A PROPORTION OF THE BASE AND THAT IS WHAT MAKES IT STRUCTURAL.**
[0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md) says nothing asserts on a tuned value,
and neither guard does: what is asserted is that a place is not much thinner than the piece every
other level plays. It is [0104](0104-the-gun-plays-a-figure.md)'s *the title is the minimum base level
we build upon* pointed at places rather than at rungs.

⚠️ **0.85 WAS THE FIRST BOUND AND THE PROBE REFUSED IT.** Both breaks reported **STILL GREEN** —
holding the undercurrent leaves 88% of the pace, pulling the entire floor out of the mix leaves 88% of
the bottom. [0019](0019-a-probe-must-be-seen-to-apply.md) doing the more valuable half of its job, and
the bound moved rather than the code. **The margin at 0.9 is three or four points and is stated in the
guard**, because it is less than is comfortable and the alternative was a guard that does not fire.

## What the material does now

| | |
|---|---|
| **the undercurrent** | `groove` is a running organ pedal — eight notes a bar in the bottom octave, three ranks. It was two notes a bar and held, which is a drone with a rhythm drawn on it. **Deep and fast is one fix, not two.** |
| **a different styling for opening, push and surge** | three kinds of fast, not three amounts: eighths in the organ's **feet** at `run`, sixteenths in its **mixture** at `push`, a bowed **tremolo** at `surge`. Two layers that both walked the chord would be one layer twice. |
| **higher octave hits** | eight struck plates in sixteen bars at 3.5 kHz, and the organ's top rank on the bar each phrase turns on. Rare and loud rather than frequent and quiet. |
| **the drums** | the processional lands on **every beat** and there is a sixteenth breath over it. Nothing in the first version subdivided past an eighth, which is most of what *doesn't fit the pace* was. |

| rung | level one | now | of the base |
|---|---|---|---|
| `run` | 118 · 44.5% | **124 · 48.4%** | 105% · 109% |
| `push` | 188 · 40.7% | **184 · 41.8%** | 98% · 103% |
| `surge` | 172 · 39.7% | **189 · 38.6%** | 110% · 97% |
| `approach` | 139 · 38.5% | **157 · 35.7%** | 113% · 93% |
| `boss` | 182 · 37.3% | **170 · 37.4%** | 94% · 100% |

## ⚠️ *The surge from level one as the default speed* is NOT delivered, and here is why

Level one's `surge` is 172 notes a bar across **fourteen** open layers. A level's `run` opens **nine**,
and the ladder decides which — not the place. Ember Nebula's opening is now 124, which is above level
one's opening and **72% of its surge**; getting the rest by material alone would mean a choir denser
than the organ section that follows it, and the build would have nowhere left to go.

⚠️ **The lever that WOULD deliver it exactly is structural and is not taken here.** Levels two and up
could open at `push` instead of `run` — Ember Nebula's `push` is 184 notes a bar against level one's
surge at 172, which is the ask to within 7%. It costs **one section boundary per level**, and *fewer
bigger sections* is the option refused by name in [0125](0125-the-build-starts-sooner.md): *"sounds
like it's going to flatten things out and probably not in a good way."* **That is a call for the
player, with the numbers now in hand, rather than one to make inside a tuning pass.**

## ⚠️ A third guard was measuring the wrong audio, and this is the class

*No theme at any rung drives the bus past full scale* baked **one** set of loops with no theme in it
and applied every place's multipliers to **level one's samples** — so the one thing it exists to
catch, a place whose own material clips, was the one thing it could not see. It ran green over the
whole of 0132 without baking a note of it.

⚠️ **It cost a tuning pass before it was found.** Five gains were trimmed to chase a clip that the real
audio does not have, and had to be put back. The false signal is what made them look necessary.

⚠️ **THAT IS THREE GUARDS IN TWO DECISIONS WITH ONE SHAPE**, and the class is one sentence: *a guard
written before a place could re-voice anything bakes `MUSIC` and means it.* The band rule and the
longest-note rule were the other two ([0132](0132-a-place-may-be-another-piece-entirely.md)).
**Anything under `tests/` that measures AUDIO and loops over `THEME_KINDS` is suspect until it passes
a theme to `loopsAt`.** That is the repair to the class, and it is why `loopsAt` takes one now.

## ⚠️ The cost, and an intermittency that had to be fixed rather than reported

`tests/themes.test.ts` went from **22 s to 49 s**, and every probe over it pays that —
[0115](0115-a-probe-runs-its-own-guard.md) is the decision that number belongs to. It is the price of
guards that bake a place instead of assuming it. Three things kept it from being far worse:

| | |
|---|---|
| a shared layer is cached under the base's key | six places answer from one bake rather than six — **118 s** before this |
| the pace guards read `loopsAt`'s buffers | rather than synthesising a second copy of the same audio |
| the clip guard reads each sample once for all seven rungs | **45 s → 27 s**, and see below |

⚠️ **THE CLIP GUARD PASSED ALONE AND TIMED OUT AT 60 s UNDER THE FULL SUITE**, which is
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)'s own shape — *a rerun is not
evidence*. Baking a second composition is what pushed it over; the walk had been near the edge since
the phrase doubled. **It was fixed and not given a longer timeout**: the buffers do not change between
rungs and only the gains do, so reading a sample once and taking seven dot products is the same
arithmetic with a seventh of the indexing. Same samples, same shaper, same peak, same assertion — 27.3
seconds against a 60-second budget, which is margin rather than luck.

## Rollback

None owed — [0001](0001-revertability-not-risk-rating.md). Content, a test helper and two guards. No
storage key, no save schema, no cache prefix.

## What is owed

**A listen.** Every number above is a model quantity and the report was an ear —
[0027](0027-measure-the-picture-not-the-model.md). `npm run dash`, level `descent`, and the rung
buttons: the question is whether *a different styling for opening, push and surge* reads as three
things rather than as three volumes.
