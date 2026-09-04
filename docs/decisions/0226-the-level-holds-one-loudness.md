# 0226 — The level holds one loudness

**Accepted 2026-09-04.** The sixth report on the same stretch of The Approach, and the first answer
that changed what the music is asked to do rather than how well it does it.

> *"the music track volume increases so much that it drowns out the bullets and game SFX at 41 secs in
> the approach, it's like someone turns up the volume knob, then again at like 45secs, then 50secs,
> then stays at that high level… happens in the approach and in other levels as well… the tempo
> should be increasing, but the volume should be consistent for each track for the level."*

## The rules

**Every rung of a place sits at its `run` loudness, K-weighted, through the shipped bus.**
`LEVEL_HOLD` in `src/content/themes.ts` is a scale over each rung, solved by
`node scripts/solve-hold.mjs` against `tests/clean.ts`'s `loud`, and `rungOf` multiplies it in.
`tests/themes.test.ts` holds every place and every rung to within `HOLD_BAND_DB` of its own `run`.
**A rung is a change of arrangement and of pace; it is no longer a change of level.**

**The music bus's compressor has its makeup gain divided back out.** `MUSIC_COMPRESSOR.makeup` is the
lift the browser's `DynamicsCompressorNode` applies below its knee — measured, not derived — and
`makeMusicOut` follows the node with a gain of its reciprocal. `tests/picture.browser.test.ts` reads
the number back from a real node.

**Whatever falls at a boundary falls in the arrivals' own steps.** A carried layer the hold lowers,
and a layer the rung closes, take one step per arrival, when it lands, by that arrival's share of the
arriving power. This supersedes 0215's fade across the build. `levelWrites` is the whole of it, and
`setLevel` cancels once per layer because a layer may now carry several writes.

**The sound channel has a picture instrument.** `node scripts/weigh-picture.mjs` drives
`rig/arc.html`, which renders a level through the game's own graph in Chromium's own nodes and prints
LUFS second by second. Nothing in it models the mixer; `makeMusicOut` builds the graph.

## ⚠️ Five answers were each correct about a model, and the model was two nodes short of the speaker

| | measured | in | changed | the report came back |
|---|---|---|---|---|
| [0215](0215-a-transition-is-a-shape-not-an-instant.md) | the one-bar **rate** | node, power sum | ramps | yes |
| [0218](0218-push-is-an-entrance-not-the-climb.md) | how **evenly** the climb spread | node, through a modelled shaper | three ladder cells | yes |
| [0219](0219-range-and-clean-stop-being-one-knob.md) | the **band** | node, through a modelled compressor | a compressor node | yes |
| **0226** | **the picture** | **Chromium, the shipped graph, LUFS** | **the premise** | — |

[0027](0027-measure-the-picture-not-the-model.md) says the instrument that renders what the player gets
is owed *before the first tuning pass*. For sound it was owed for six passes. Rendering the level
through the browser's own nodes for the first time found two things at once, and neither was visible
from node.

### ⚠️ The compressor 0219 added lifts the whole bus by 4.5 dB, and nothing knew

A `DynamicsCompressorNode` applies makeup gain by specification — `(1 / curve(1.0))^0.6` — and every
shipping browser descends from the one WebKit kernel that does. On a 1 kHz sine at
`MUSIC_COMPRESSOR`'s settings, out of Chromium:

| in dBFS | out dBFS | gain |
|---|---|---|
| −36 | −31.5 | **+4.5** |
| −18 | −13.5 | **+4.5** |
| −12 | −9.0 | +3.0 |
| 0 | −2.8 | −2.8 |

`tests/compress.ts` models the curve and the detector and says out loud it is *"not the browser's
implementation"*; the difference was not a detail of the knee. **From 2026-09-03 the music bus sat
4.5 dB above every number the suite, `scripts/hear.mjs` and the desk had for it, and above the cue
bus, which passes through no such node.** *"Drowns out the bullets and game SFX"* is the day-old
compressor's makeup gain. It is divided out rather than folded into the models because every mix
decision since [0104](0104-the-gun-plays-a-figure.md) was taken against a bus with no lift in it.

### ⚠️ And the climb was real, small in the model's unit, and the whole complaint

Through Chromium, before, K-weighted, settled per rung:

| rung | LUFS | over `run` |
|---|---|---|
| run | −22.9 | 0.0 |
| push | −20.9 | **+2.0** |
| surge | −20.5 | **+2.4** |
| approach | −21.0 | +1.8 |
| boss | −21.8 | +1.1 |
| bossPeak | −21.0 | +1.8 |

Two LU, arriving as `arp`, `ride`, `hook` and `lead` land one a bar from the downbeat at 0:35 of sim
time — 0:39 to 0:50 on a clock that starts at the press — which is *"41 secs… then 45… then 50, then
stays"* to the second. 0218 had measured the same step at 2.9 dB unweighted and called the fix done
when it was 2.9 rather than 3.6; 0219 measured a 2.3 dB band and called the fix done when it was 2.3
rather than 3.8. **Each was asked to make the climb smaller and did. The report was that there is a
climb.**

## ⚠️ Why a hold and not a smaller ladder

**Every guard on the ladder demanded the climb.** 0108's *a rung that arrives at the same loudness is
not a rung* held `push` over `run` by 1.02; 0218 held `surge` over `push` by 0.5 dB; `tests/music.test.ts`
held every rung louder than the one below and the fight 1.5 dB over the opening. 0219 tried to raise
`run` to meet `push` and *"three guards refused it, correctly"* — correctly against a rule this
decision retires. [0123](0123-a-rung-changes-the-notes.md) had already found that *loudness does not
predict a section*: what a listener hears as a rung is the notes changing and the pace rising, and
[0168](0168-the-pace-is-on-the-desk.md) measures that. The climb was decoration on top of the thing
that actually reads, and it read as a knob.

**A hold is one number per rung, so it is not the thing 0167 forbade.**
[0167](0167-a-build-does-not-duck.md) refused to pay for arrivals out of carried layers because the
solved mix did it *per layer* and the border became *"a hard jump between sounds"*; its guard names
*a per-rung renormalise* as the first thing anyone reaches for. This is that, and the distinction is
what it renormalises: every ratio inside a rung is untouched, the rung is lower by one number, and the
number is paced across the build. 0167's guard now measures a carried layer's fall *relative to its
rung*, which is the thing it was always about.

**Solved through the bus, in the ear's unit, because the compressor halves every move.** A rung held
2 LU quieter at the speaker is 3.4 dB quieter into the compressor; The Labyrinth's `approach` is
10 dB down in gain for 6.6 LU out. A closed form over gains would be wrong by half the move, which is
why `scripts/solve-hold.mjs` bisects on `driveGains` rather than dividing.

## ⚠️ Unweighted RMS could not see it, and the unit had to change

`sub` dominates an unweighted sum and an arriving `lead` barely moves it. ITU-R BS.1770's K-weighting
is a +4 dB shelf above 1.5 kHz and a high-pass at 38 Hz, and after it a mean square is LUFS —
`tests/loudness.ts`. **The design is `libebur128`'s, not the cookbook's**: the textbook high-shelf
biquad fed the standard's three parameters lands 0.44 dB low at 1.5 kHz, which a guard reproducing
the 48 kHz table to six places caught before the hold was re-solved on it.

## ⚠️ The hole the hold digs, and why one fade could not fill it

Lowering the bed on the downbeat while the parts stagger in over three bars is a dip: the picture
showed **−2 LU for four seconds** where the ladder had a step, and `tests/transition.test.ts` caught
The Toxic Mire at −2.5 dB below both ends. Three single-fade shapes were tried — from the downbeat,
from the middle of the build, slower — and the best left the Mire at −1.2, because its `groove`
arrives three bars after its bed has started to leave and **no one exponential follows a staircase**.

So a falling layer now takes one step per arrival, when that arrival lands, by its share of the
arriving power, at that arrival's own ramp; the last step is the target itself. Measured in the arc,
K-weighted, hole and one-bar rise:

| place, boundary | before | after |
|---|---|---|
| The Toxic Mire, `run → push` | −1.5 / +1.1 | **−0.4 / +0.4** |
| The Toxic Mire, `surge → approach` | −1.4 / +0.7 | **−0.6 / +0.3** |
| The Approach, `run → push` | −0.4 / +0.3 | **−0.1 / +0.1** |
| The Labyrinth, every boundary | | ≤ 0.2 |

**The shares are gains squared, and a gain is not a loudness** ([0140](0140-no-layer-is-inaudible.md)).
They decide only *when* room is made; the endpoint is exact, and the targets carry 0176's re-based
balance, which is the nearest thing to loudness the shell holds without a bake in its hands.

**`tests/arc.ts` weighs each layer with the same K-weighting now**, so a hole and a hold are in one
unit; unweighted, `sub` and `drone` — exactly the layers the hold eases — dominated the sum and
reported a dip a third larger than the ear meets.

## Where every place landed

Hold in gain, from `run`; the picture after, The Approach, settled per rung against `run`:

| place | push | surge | approach | boss |
|---|---|---|---|---|
| The Approach | −3.4 dB | −4.9 | −3.1 | −4.2 |
| Ember Nebula | −1.9 | −1.6 | −2.5 | −3.2 |
| Saurian Belt | −0.4 | −1.3 | −1.1 | −1.9 |
| The Labyrinth | −5.4 | −9.4 | **−10.0** | −9.0 |
| Rime Shelf | −3.2 | −4.6 | −4.4 | −1.8 |
| The Toxic Mire | −4.1 | −6.9 | −5.9 | −6.4 |
| The Black Heart | −6.6 | −7.6 | −7.0 | −7.5 |

| The Approach, after | LUFS | over `run` |
|---|---|---|
| run | −27.1 | 0.0 |
| push | −27.2 | −0.1 |
| surge | −27.6 | −0.5 |
| approach | −27.1 | 0.0 |
| boss | −28.8 | −1.7 |
| bossPeak | −27.6 | −0.5 |

`run` is 4.2 dB lower than before, which is the makeup gain gone; the speaker knob is the player's.
The fight's −1.7 is the last five seconds of `boss` in a walk where the aura is still closing —
`driveAt` holds the fight at the aura's ceiling and the walk has not reached it — and it ends at
`run`. Nothing climbs.

## What this retires, and what it amends

- **Retired**: `tests/music.test.ts`'s *every rung louder than the one below* and *the fight is
  louder than the opening*; `tests/themes.test.ts`'s *no boundary inside a level is bigger than the one
  that opens it* with 0218's `surge` floor and 0219's `LEVEL_BAND_DB`. Each held the climb over a
  signal the game either never plays (the bare composition) or now holds flat.
- **Amended to the bare ladder**: `tests/pace.ts`'s `loudestOf`, which 0140, 0147 and 0164 ask *can
  this be heard against the rest of what is playing* through — the hold changes no ratio inside a
  rung, and across rungs it compared levels no listener hears together; and 0107's aura ratio, which
  is a claim about the row's shape. Neither guard's claim changed.
- **Amended to divide out the hold**: 0167's duck guard and its taste in `tests/authored.test.ts`;
  0116's two-place guard in `tests/sound.test.ts`, which picks its set off the bare ladder now.
- **Superseded**: 0215's *a departure fades across the build*, by the staircase above; its two
  probes are re-aimed at the staircase and still redden the same two guards.
- **Re-unit**: `tests/arc.ts` weighs each layer with the K-weighting, so 0215's hole and rise guards
  read in LU.
- **Probes re-aimed** at the hold guard: 0108's *bus driven flat* and 0218's *push back at its
  reported row*. The second measured **+0.45 LU** against a first draft of the band at 0.5 and walked
  through; the band is 0.25, which the solve's 0.02 leaves room for and a ladder edited without a
  re-solve does not.
- **Probes the hold's headroom stranded**: the loudest sample reaching the shaper anywhere is now
  **0.969** of full scale (Saurian Belt, `surge`), so 0176's *shaper without the clamp* and 0191's
  *trim dropped* no longer drive anything past it and are retired with that number in their files;
  0189's *boss bed lifted* is re-aimed at the hold guard, which reddens first on a row edited under a
  solved hold. 0116's two-place guard compares with a tolerance now, because `(x · h) / h` is not `x`
  in floating point and the balance dropped on purpose measured as one part in 10¹⁶ of difference.
- **Probes retired**: 0219's *compressor bypassed* and *detector removed*. Measured, the compressor
  moves the held band by 0.17 LU at most — the range is content now, and a break the tree cannot see
  is what [0005](0005-a-guard-must-be-seen-to-fail.md) says not to keep. Its *threshold at −6* is
  re-aimed at the makeup guard, because the makeup is a function of the threshold and that is the
  one thing the node still does that a guard can read.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0226`.

| broken on purpose | went red |
|---|---|
| The Approach's `push` let off its hold | `every rung of a place holds its run loudness` |
| `rungOf` ignoring the table | same |
| the shelf designed at the wrong corner | `the K-weighting … reproduces the standard's table` |
| the makeup gain recorded as zero | `the browser's compressor lifts what passes below its knee by exactly what the content says` |

The picture, after, is in the second table above and was rendered by the instrument this decision
adds, not by the model that solved the hold.

## What is owed

**A listen, and the tempo.** The report's other half — *"the tempo should be increasing"* — is
answered today by subdivision and by pace ([0102](0102-the-music-goes-somewhere.md),
[0168](0168-the-pace-is-on-the-desk.md)); a BPM that moves is what
[0160](0160-the-music-free-runs.md) made possible and nothing has yet done. It is a different piece of
work: the loops are baked at one tempo, and a tempo that moves either re-bakes per rung or changes
the pitch with the speed.

**`scripts/hear.mjs` and `scripts/weigh-arc.mjs` still print the model's units.** Both are correct
about what they model; neither is the picture. When a sound is reported, `weigh-picture` first.
