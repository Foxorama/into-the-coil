# 0174 — A send has to mean something

**Accepted 2026-08-19.** Amends [0173](0173-a-cue-happens-somewhere.md), which shipped a reverb bus
mixed over its own source. Found by a player in one listen.

> *"The enemy death sounds like it's happening inside a tin can, it doesn't fit an explosion or a
> gamey sound at all."*

## The rule

**The room's impulse carries unit energy, per channel.** So `air × CUE_ROOM_GAIN == 1` means *the wet
is as loud as the dry*, and every value in `CUES` is the share of itself it looks like it is.

**And no cue is quieter than its own reverb.** `tests/sound.test.ts` holds it at −6 dB.

## ⚠️ The wet was louder than the dry, on every explosion

Measured against the same cue, wet path alone, total energy and peak:

| | `air` | energy | peak |
|---|---|---|---|
| `kill` | 0.3 | **+2.5 dB** | +5.7 dB |
| `blast` | 0.62 | **+7.8 dB** | +15.7 dB |
| `death` | 0.7 | **+8.8 dB** | +17.6 dB |
| `bossDown` | 0.75 | **+9.0 dB** | +18.4 dB |

After:

| | energy | peak |
|---|---|---|
| `kill` | −22.9 dB | −19.7 dB |
| `blast` | −17.6 dB | −9.6 dB |
| `death` | −16.6 dB | −7.8 dB |
| `bossDown` | −16.4 dB | −6.9 dB |

⚠️ **THAT IS NOT A ROOM, IT IS A REVERB BUS MIXED OVER THE SOURCE**, and *tin can* is a good name for
it. Nine decibels more energy in the tail than in the event means the event is the quiet part.

## ⚠️ `normalize = false` hands the level to the author, and 0173 said so and then did not author it

0173's own comment: *"the impulse's level is authored: the browser's default rescales an impulse to
unit power, which would make `CUE_ROOM_GAIN` mean something different on every engine."* The reasoning
is right and the second half never happened. A convolution sums the **whole impulse per input
sample**, so a 1.1-second full-amplitude noise buffer has an enormous integrated gain —
`CUE_ROOM_GAIN` at 0.5 and `air` up to 0.75 were chosen against a scale nobody had measured.

⚠️ **THE FIX IS ONE FACTOR AND IT IS THE ONE THAT MAKES THE TABLE READABLE.** A convolution's RMS gain
over broadband input is the impulse's root energy, so scaling by `1 / sqrt(sum of squares)` makes
`air` a share of the dry signal. It is [0140](0140-no-layer-is-inaudible.md)'s *a gain is not a
loudness*, one bus over: fourteen numbers were authored against nothing.

## ⚠️ Every guard 0173 wrote was green over it, and that is the transferable half

Three of them, all correct, all silent:

| what it measured | why it could not see this |
|---|---|
| the tail's **length** — 950 ms → 1426 ms on `blast` | length is set by the impulse's decay and is **insensitive to level** |
| the tail's **width** — channels correlating at −0.018 | a ratio between two channels, unchanged by scaling both |
| the tail's **decay** — 61.2 dB head to tail | a ratio inside one channel, likewise |

⚠️ **A GUARD CAN BE RIGHT ABOUT EVERYTHING IT MEASURES AND SILENT ABOUT THE ONE THING THAT MATTERS.**
This is [0027](0027-measure-the-picture-not-the-model.md)'s warning in a shape it has not taken here
before: not a model that disagrees with the picture, but **three models that agree with it on three
axes while the fourth is nine decibels out.** The missing assertion is the one a listener would make
first — *is the reverb quieter than the sound* — and it is now the first one in the block.

## ⚠️ Two wrong diagnoses came before the right one, and both were instrument failures

⚠️ **THE COMB HYPOTHESIS.** Five bare early reflections at 7–29 ms with no diffusion is textbook
metallic colouring, and `ROOM_DIFFUSERS` in `src/app/music.ts` documents exactly that failure from
0136: *"what a listener would have got is a hollow, metallic colour on the choir: the classic missing
half of a Schroeder reverb."* Measured as 29.8 dB of ripple over the first 60 ms — **and the measure
was wrong**: a 60 ms window of noise is naturally that ragged, so the number was the noise's own
spectrum and not a comb.

⚠️ **THE ALLPASS FIX MADE IT WORSE, WHICH IS WHAT SAID SO.** Three diffusers took the strongest
discrete echo from 7.1% of zero-lag to **10.9%**. Allpasses diffuse a *sparse* signal; a noise tail is
already maximally dense, so they only added structure. Removing the early taps entirely moved it to
7.0% — **0.1%** — which is what finally showed that no version had a comb worth hearing and that the
whole line of enquiry was about the wrong property.

⚠️ **THE TAPS AND THE DIFFUSERS ARE THEREFORE UNCHANGED.** They are not what was wrong, and taking
them out to be safe would have been a change made on a refuted theory.

## Confirmed, not assumed

- `npm run typecheck` clean, `npm test` green, `npm run build` clean.
- Both tables above, over the baked cues and the drawn impulse, comparing **total energy** rather than
  RMS — the wet buffer is longer than the dry, so a mean over its own length divides by the tail it
  just added. That error was made and caught while measuring this.
- Two probes, seen red, trees restored: `node scripts/prove-guard.mjs 0174`.

| broken on purpose | went red |
|---|---|
| the impulse un-normalised, which is the room 0173 shipped and a player called a tin can | `THE REPORTED ONE: no cue is quieter than its own reverb` |
| the two channels sharing one scale, so the room is 3 dB off what the table says | ``and the impulse carries unit energy, which is what makes `air` a share of the dry`` |

⚠️ **THE `air` VALUES ARE UNCHANGED AND THAT IS DELIBERATE.** They were authored per cue with reasons
in place; what was wrong was the scale they sat on, not their order. Whether 0.3 on `kill` is the
right *share* is an ear's question and is now a question that can be asked, which it could not be
before.

## Rollback

Shipped audio. The normalisation in `makeRoomImpulse`, `src/app/sound.ts`. Reverting restores the
room a player called a tin can. No storage key, save schema, SW cache prefix or origin.
