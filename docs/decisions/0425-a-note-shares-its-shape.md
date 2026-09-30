# 0425 — A note shares its shape

**Accepted 2026-09-30.** The cold bake, which [0424](0424-a-bake-is-kept-for-its-source.md) said
plainly it did not shorten: every CI job starts with an empty store, and a probe that breaks `src/`
bakes cold by construction. So the cold bake itself had to get cheaper — and it could only do so
without changing a single sample.

## The rule

**Everything about a note but its pitch, its gain and its oscillator is computed once per shape and
read by every note of that shape** — the envelope, the pitch glide, the vibrato, the scoop and both
filters' coefficients along their sweeps. A shape is keyed on every field those are made of.
`tests/shapes.test.ts` holds that a shape reused is the shape built fresh, field by field and over the
music itself; the bytes are held by the fingerprint below.

## Where the time was

`sampleLayerInto` asked, for **every sample of every note**: `Math.exp` for the envelope, `Math.pow`
and `Math.sin` for the vibrato, `Math.pow` for each filter's sweep and `Math.tan` for its
coefficient. None of those depends on the note's pitch or weight — only on its length, envelope,
sweeps, vibrato and scoop, which a voice fixes. The Black Heart's `groove` is 2,078 notes over eight
voices: the same sequences, computed about 250 times each.

## Why it is exact

⚠️ **EACH TABLE HOLDS THE EXPRESSION THE LOOP USED TO EVALUATE, OVER THE SAME INPUTS, IN THE SAME
ORDER, IN A `Float64Array`**, so nothing is rounded on the way in and the loop reads the value it
would have computed. A multiplier the loop applied in two steps — the vibrato, then the scoop — is two
tables and never one, because folding them changes the rounding. The filter's `g * a2` is stored as
`ga2` because `makeFilter` evaluated it in that order before multiplying by the input.

**Fingerprinted before and after**: every layer of the base and all seven places, and every cue of
each, hashed together — **SHA-256 `acb03376…` both times**, the same value 0422's `pow` skip was held to.

⚠️ **THE ONE WAY REUSE CAN BE WRONG IS THE KEY**, and it is the one a fingerprint of today's music
cannot see: two notes that differ in exactly one field, one after the other, only exist if the music
happens to hold them. So `tests/shapes.test.ts` builds its own — one note with every part of a shape
switched on, varied one field at a time, each sampled straight after the first and compared with
itself sampled fresh — and counts shapes built, so a reuse that never happens cannot pass for one that
is right.

Only the few most recent shapes are kept: a voice's notes are baked one after another, by
`layerNotes` and by the prewarm alike, so a handful is every hit there is and the memory stays a few
shapes wide.

## What it cost, measured

A bake of every layer of the base and the seven places, in one process on the development box:

| | before | after |
|---|---|---|
| The Black Heart | 26.1 s | **7.9 s** |
| the base | 3.0 s | 1.3 s |
| all eight | 52.9 s | **19.3 s** |

The whole suite, every bake cold — the condition CI runs in:

| | before (today's runs) | after |
|---|---|---|
| the whole suite | 389–534 s | **199 s** |
| the clip guard | 230–342 s | **96.8 s** |
| `tests/sound.test.ts` | 382–400 s | **195 s** |
| its boundary-bake guard | 128 s | **36.5 s** |
| `tests/themes.test.ts` | 378 s | **191 s** |

**And it is the game's own synth**: the prewarm on the title screen, the boundary bake on its deadline
and the music room all bake through it.

⚠️ **The budgets are not re-sized here.** The clip guard's 420 s, which
[0423](0423-the-pool-is-taken-out-and-a-page-boot-is-sized-under-the-suite.md) found under three times
its worst, is now four times it; nothing measured is over. Shrinking them is a separate edit with its
own measurements.

## What was rejected

**Reusing the filter's result object.** 0422 measured it: byte-identical and no faster.

**Approximating any of it** — a cheaper `tan`, an envelope stepped instead of computed. Faster, and
it changes the music, which is the user's ear and not this decision's.

## Confirmed, not assumed

Probes in `scripts/probes/0425-a-note-shares-its-shape.mjs`.

| broken on purpose | went red |
|---|---|
| the lowpass’s destination left out of the key, so a note sweeps to where the one before it swept | `THE KEY: a note that differs in any one part of its shape does not wear the shape before it` |
| the vibrato left out of the key, so a steady note wobbles as the one before it did | `THE KEY: a note that differs in any one part of its shape does not wear the shape before it` |
| the length left out of the key, so a longer note is cut to the envelope of a shorter one | `THE KEY: a note that differs in any one part of its shape does not wear the shape before it` |
| a shape never found again, so every note builds its own and the reuse this is for never happens | `and a note that differs only in pitch and weight DOES share it` |

⚠️ **And the synth's own guards still fire through the tables.** Three probes were anchored on lines
this moved and were re-aimed onto the tables — 0072's envelope that never falls, 0089's lowpass
dropped, 0099's glide held — and each set is red there: 10, 5 and 4 probes.

⚠️ **No probe breaks the speed**, for 0115's reason.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). The synth's output is byte-identical
by fingerprint; `src/app/sound.ts`, `tests/`, `scripts/probes/` and documents.
