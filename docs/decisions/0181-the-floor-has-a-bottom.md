# 0181 — The floor has a bottom, and a pad is standing on it

**Accepted 2026-08-19.** A deep fast drum, and the measurement that says it cannot be the answer on
its own.

> *"Let's add some new sounds to saurian level to get some deeper eurobeat notes, I'm thinking some
> deep fast drum beats instead of the higher notes we've got a lot of."*

## The rules

**Saurian Belt has a floor tom**: 150 → 44 Hz, sixteenths, in `engine`, striking only where the kick
has nothing.

**A new layer cannot make a place deeper on its own.** The bottom is a fixed allocation and adding to
it spends another layer's room — measured here at a ceiling of **+0.004** before something goes adrift.

## ⚠️ "Deeper" was a measurement before it was a preference

The band a place's bottom lives in is 0.24 to 0.55 of its energy under 300 Hz
([0147](0147-a-place-is-a-balance.md)). Saurian:

| rung | calm | run | **push** | surge | **approach** | boss |
|---|---|---|---|---|---|---|
| saurian | 0.396 | 0.364 | **0.255** | 0.282 | **0.259** | 0.317 |
| the base | 0.401 | 0.417 | **0.378** | 0.383 | **0.351** | 0.360 |

**Within two points of the floor at `push` and `approach`**, where the base holds twelve points more —
at exactly the rungs a dancefloor should be driving hardest. The ear was right and the table says so.

## ⚠️ Where it goes, and it is not a free choice

`perc` is the obvious home and is **forbidden**: it sits at −0.45 and
[0118](0118-the-mix-has-a-width.md) refuses a placed layer whose weight is under 130 Hz — the note
above `perc` in `src/content/saurian.ts` already says so about the rattles. The centred layers are
`drone`, `bass`, `beat`, `sub`, `engine`, `groove` and `stomp`; `engine` is where the low half of the
kit already lives.

⚠️ **AND IT PLAYS WHERE THE KICK DOES NOT, WHICH IS THE FILE'S OWN LESSON.** `sub`'s four-on-the-floor
records what happened when two low transients shared a sixteenth: *"the boss mix clipping at 1.004 of
full scale."* Its three variants strike `{0,4,8,11,12}`, `{0,4,7,8,11,12,15}` and `{0,14,15}`; this
strikes 2, 5, 6, 9, 10 and 13 — disjoint from all three. The genre's reason and the arithmetic's are
the same one: the drop between kicks is where a floor tom belongs.

## ⚠️ Three guards shaped this, and each caught something a hand would not have

**0095 — the pattern must span its own layer.** Written at 32 steps against a `perBeat: 4` in a
four-bar layer, it covered half the loop: *"saurian/engine voice 4 spans 3.20s inside a 6.4s layer —
the rest of the layer is silence."* It is 64 steps.

**0164 — the ceiling on the gain.** At 0.62 and 0.45 the guard reports `saurian/approach/drive` more
than a whole role under what the arrangement asked; it passes at 0.32. **That is the number in the
file, and it is a bound rather than a taste.**

**And the saturation came off**, which is [0179](0179-an-explosion-ends-low.md)'s lesson two days old
arriving in the music: `drive: 0.3` on a sine sweeping to 44 Hz put harmonics in the **lowmid**, and
`weigh-adrift` named the victim exactly — `drive` masked by `engine −1.9 (lowmid)`. Squashing a low
sine does not make it deeper, it makes it wider.

## ⚠️ THE DEPTH IS A BALANCE AND THE THING STANDING ON IT IS THE PAD

`node scripts/weigh-heard.mjs saurian --rung=push` — [0140](0140-no-layer-is-inaudible.md)'s
instrument, which asks what survives the mix rather than what a soloed layer measures:

```
layer     out     margin   window    under
chords  -17.9      1.6     low R     groove -5.6
sub     -30.2    -11.4     low L     chords +7.6
groove  -25.4     -6.0     low L     chords +2.8
drone   -31.8    -16.2     low L     chords +12.1
```

⚠️ **`chords` IS THE LOUDEST LAYER IN THE PLACE BY SEVEN DECIBELS, AND ITS WINDOW IS `low`.** The
supersaw pad is five saw voices at octave 1 and 2 with a lowpass and **no highpass at all**; its
fundamental is 110 Hz and its measured centroid is 108. It sits **7.6 dB over `sub` in `sub`'s own
window** and 12.1 over `drone`.

**That is why a tom moves the number by 0.004.** There is no room at the bottom — a chord pad is
already standing in it, and the kick and the sub are underneath a thing that is not a drum.

## ⚠️ What was NOT done, and why it is being handed back rather than decided

**The pad is not high-passed here.** Clearing 40–130 Hz off `chords` is the change that would make
this place deep, and it is a change to the signature sound of a place — the supersaw whose closing
filter [0148](0148-a-place-has-its-own-notes.md) calls *"the single most recognisable gesture in the
genre."* Its fundamental is inside the band that would be cleared, so it is a re-voice and not a trim.

**The mix is not touched.** `ride` at 8.43× is [0162](0162-a-place-has-its-own-ladder.md)'s deliberate
dancefloor and `sub` at 0.28× is part of the balance approved by ear eight days ago —
[0176](0176-the-re-based-mix-is-the-mix.md), *"re-based now sounds and blends incredibly well."*
Answering *"deeper"* by undoing *"blends incredibly well"* is a trade only the ear that made the first
verdict can make, and [0126](0126-the-dashboard-is-the-instrument.md) says where.

⚠️ **THE ASK WAS TO ADD SOUNDS AND A SOUND WAS ADDED.** The rest is reported with its measurement
rather than acted on, because the two candidate levers both spend a verdict already given.

## What this is not

**Not a claim the high end is wrong.** *"Instead of the higher notes"* is answered here by adding
underneath rather than by cutting above, for the reason above.

**Not a pace change.** The place plays 228 notes a bar at `push` before this and after it; the tom is
inside a layer that already sounded.

## Rollback

No storage key, no save field, no service-worker cache prefix, no origin. One voice in
`src/content/saurian.ts`. The music is baked at run start and nothing persists a sample, so reverting
restores the previous sound on the next load.
