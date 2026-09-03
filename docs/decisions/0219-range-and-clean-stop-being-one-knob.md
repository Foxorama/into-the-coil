# 0219 — Range and clean stop being one knob

**Accepted 2026-09-03.** The fifth pass at the same six seconds of The Approach, and the one that
changed the mechanism instead of a number.

> *"you keep talking about decibels and I keep talking about volume… at the 41 second mark plus I have
> to turn the volume down because the volume is too loud."*
>
> *"can we raise the volume of the first section instead? I'm after a more smoother volume tone overall
> and I can adjust speaker volume… and if we reduce the overall volume we're going to just never hear
> the really quiet parts of the music composition."*

## The rule

**The music bus has a compressor, in front of the shaper.** `MUSIC_COMPRESSOR` — −18 dB threshold,
2:1, 6 dB knee. The shaper stays where it is and keeps its job: it is the colour.

**`run` takes half its headroom up to `push`**, so the first section is louder and no carried layer
ducks.

## ⚠️ Four answers to one report, and the first three were all about shape

| | measured | changed | did it answer the report |
|---|---|---|---|
| [0215](0215-a-transition-is-a-shape-not-an-instant.md) | the one-bar **rate** | +2.2 dB/bar → +1.1 | no |
| [0218](0218-push-is-an-entrance-not-the-climb.md) | how **evenly** the climb spread | one boundary carrying 88% → 71% | no |
| a master cut | the **absolute** level | built, then withdrawn | it would have taken the quiet end with it |
| **0219** | the **band** | 3.8 dB → **2.3** | yes |

⚠️ **THE PHRASE THAT GAVE IT AWAY WAS THE COMPLAINT ABOUT MY VOCABULARY.** Every instrument built for
this had two rungs in it, so every answer was a difference, so every answer was in dB. The quantity
being reported was *the spread one setting of a speaker has to cover*, and nothing printed it.

## ⚠️ Range and cleanliness were the same knob, and that is why this kept failing

`saturate` narrows a range by squashing, so **every decibel of range it takes out arrives as
distortion**. [0217](0217-the-bus-is-a-colour-and-it-was-too-thick.md) halved it the day before,
correctly, for *"doesn't sound crystal clear and clean"* — and widened every contrast in the game as a
side effect nobody had measured. The Approach's `run → push` went **3.2 → 3.6 dB** in that change.

**A compressor separates them.** After it, the band is 2.3 dB *and* the distortion at `push` improved
from −21.1 to **−24.1 dB** — because the shaper now sees a level that barely moves instead of one that
swings four decibels.

## ⚠️ 0104 refused a compressor, and its reason was right twice over

> *"A compressor has an attack and a release, so it is a function of the signal's history;
> `tests/music.test.ts` sums the layers sample by sample and could not model one, which would have
> meant weakening the assertion that holds the mix."*

**The first attempt here tried to dodge that** by modelling only the static curve — threshold, knee and
ratio are a pure function of level, so surely that is where the range lives. **It measured 3.8 dB
before and 3.8 dB after.** With a −18 threshold most individual samples are below it: applied per
sample, a compressor's curve is a **waveshaper**, and every decibel of range reduction lives in the
**detector**.

⚠️ **SO THE ENVELOPE IS MODELLED, AND IT TURNS OUT TO BE ONE VARIABLE.** A one-pole follower is a
function of history and nothing more. What made it look impossible in 0104 was the shape of the test of
the day — a stateless sum — not the compressor. **The objection was about the guard, and the answer was
a walk that carries a number.**

## ⚠️ And a threshold at the obvious place does nothing

−6 dB was the first choice, on the reasoning that a threshold at the quiet end leaves the quiet end
alone. **A ratio only narrows a range where both ends are above it.** At −6 the detector barely crossed
the threshold at any rung, so every rung passed through equally. At −18 the quiet end sits just above
and the loud end well above, which is the whole mechanism. It costs `run` **0.6 dB**; −22 buys another
0.3 dB of band for 2.1 dB of level, which is the *"never hear the really quiet parts"* half of the same
report arriving by another route.

## What raising the first section could and could not do

`run`'s carried layers sat **0.0 to 1.9 dB** below their `push` values, and they now take half of that.
**Taking all of it was tried and three guards refused it, correctly**: `push` arrived 0.16 dB over `run`
on the base mix against 0108's floor — *a rung that arrives at the same loudness is not a rung* — the
aura went backwards, and Saurian Belt's `bass` fell a whole role under the arrangement.

⚠️ **AND LOWERING THE TOP INSTEAD IS NOT AVAILABLE AT ALL.** Trimming `push` and above while leaving
`run` alone **ducks every carried layer**, which [0167](0167-a-build-does-not-duck.md) forbids
and 0215's hole guard catches; a global version made Saurian Belt and Ember Nebula *quieter* at `push`
than at `run`. **There is no way to narrow the ladder from the top without ducking, or from the bottom
past where the ladder stops being one** — which is precisely why this is a bus change.

## Where every place ended up

| place | band, `run` to loudest |
|---|---|
| Saurian Belt | 1.0 |
| Ember Nebula | 1.8 |
| **The Approach** | **2.3** |
| Rime Shelf | 2.7 |
| The Toxic Mire | 4.4 |
| The Black Heart | 4.8 |
| The Labyrinth | 7.4 |

⚠️ **THE LAST THREE ARE NOT GUARDED AND ARE WRITTEN DOWN INSTEAD.** Their ladders climb that far on
their own; a ceiling wide enough to admit them would hold nothing, which is 0218's reason for naming
one place rather than inventing a rule the content cannot keep.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0219`. **Six probes belonging to other decisions were stranded by the
`run` row and re-anchored** — 0095, 0102, 0104, 0108, 0113 and 0122 all pin that line.

| broken on purpose | went red |
|---|---|
| the compressor bypassed, so the band is back to what one speaker setting cannot cover | `no boundary inside a level is bigger than the one that opens it` |
| the threshold raised to the quiet end, where a ratio has nothing to work on | same |
| the detector removed, so the compressor is a waveshaper with extra parameters | same |

## What is owed

**A listen, and one caveat that is worth knowing before it bites.** The model here is faithful to the
Web Audio specification's static characteristic and to a standard one-pole detector; **it is not the
browser's implementation**. What is claimed on it is the band, which the threshold, knee and ratio
decide. If the mix sounds like it is being ridden — pumping against the kick — that is the envelope,
`attack` and `release` are the two numbers, and **no guard holds them**.

⚠️ **AND `tests/music.test.ts`'s `mixAt` DOES NOT MODEL THE COMPRESSOR**, so every guard built on it now
measures a bus one node short of the shipped one. None of their claims is about level range, so none is
wrong today — but it is the same blind spot that let this report survive four passes, and it is written
here rather than discovered later.
