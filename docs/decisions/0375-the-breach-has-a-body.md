# 0375 — The breach has a body

**Accepted 2026-09-26.** `bossBreach` — the sound of the flying fish going through the edge of the
lane, four times in its entrance and once a breaker — is re-voiced: its weight is below the middle of
the spectrum and its centre of gravity no longer climbs. The row's share of the mix, its hold and its
room are 0313's, unmoved. **Amends** [0313](0313-the-fish-breaches.md)'s cue and nothing else of it.
**Builds on** [0089](0089-a-cue-has-a-body.md), [0179](0179-an-explosion-ends-low.md).

## The ask

> *"intro sound is terrible"* — of the fish boss, 2026-09-26.

## What was measured before a note was moved

`scripts/weigh-cue.mjs --only=bossBreach`, on the row 0313 wrote — the instrument
[0027](0027-measure-the-picture-not-the-model.md) owes before the first tuning pass:

| | sub | low | lowmid | mid | himid | hi | air | onset | tail | fall |
|---|---|---|---|---|---|---|---|---|---|---|
| 0313's row | 0.008 | 0.151 | 0.247 | 0.784 | 0.694 | **1.000** | 0.623 | 306 Hz | 666 Hz | **+6.8 dB** |
| this row | 0.080 | **0.719** | **0.549** | 0.852 | 0.930 | 1.000 | 0.310 | 231 Hz | 212 Hz | **−0.7 dB** |

The instrument's own words for the first line: a centroid that RISES *is a whoosh*, and weight in the
top two bands with nothing under it is *tinny*. That is what the report heard. 0313 wrote a sheet of
noise whose lowpass OPENED to 9.5 kHz — the one layer in the table that widened upward, on purpose,
as *the event* — over a sample-and-hold grain at 900 Hz falling to 180 and rung at `q` 2.3. Heard once
that is a spray; heard four times in two and a half seconds, a grain sampled at a few hundred hertz is
a pitched buzz, and a spray that ends brighter than it began is a hiss with a click on the front.
Nothing about it was the size of the animal.

## The rule

**A breach is a body displacing the place, so its weight is low and its top leaves first** — the shape
`weigh-cue` calls an explosion and every other big cue in the table has (0179). Five layers, three of
them turned round:

| | |
|---|---|
| the whoomph | the fifth of the key falling below the root, over a third of a second where it was a fifth: a forty-two-unit animal, not a door |
| the surge | white noise whose lowpass opens 240 Hz → 2.2 kHz over a quarter second with a slow attack — gas shoved ahead of the body, the one layer that rises, because it is the one part that is a thing arriving |
| the splash | white noise whose lowpass CLOSES 3.8 kHz → 380 over half a second, panned across the field — the sheet, turned the other way round |
| the embers | sample-and-hold at 5.5 kHz falling to 2.2, low, late and short — a crackle, an octave and a half above the note it was |
| the wake | 0313's, kept: the resonant peak 1.4 kHz → 200, the mass going past |

⚠️ **THE ROW'S GAIN DID NOT MOVE, AND A DRAFT OF THIS MOVED IT.** 0.46 → 0.5 reddened
`tests/sound.test.ts`'s *the four loudest cues at once stay under the limiter's threshold*; the body is
in the layers' balance, not in the row's share of the mix, and the guard that says so was right.

## The spit

`bossSpit` is new, for [0373](0373-the-fish-spits-its-adds.md): the bodies leaving the mouth are the
event, and the cue says WHERE — a fifth falling to the root under a burst of resonant noise that
darkens, a sixth of a second, a gob rather than a gun, with a spray of embers at the lip as its picture
(`spit-appears`, 0024's twin). It is in `scripts/hear.mjs`'s fight take for any boss whose last phase
spits, so it is heard over the bed it plays in.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0375`:

| broken on purpose | went red |
|---|---|
| the splash opening upward again, so the breach ends as a hiss | `THE ASKED-FOR ONE: the breach's weight is below the middle of the spectrum` |
| the whoomph pulled out, so the breach has no body under its spray | the same |
| the spit given the threat's picture, so nothing on the screen is its twin | `and the spit is a tenth of a second with a picture` |

The guard holds the two quantities above with bounds between the two rows (`low + lowmid ≥ 0.8`
against 0.40 before and 1.27 after; a climb of at most 2 dB against +6.8 and −0.7), on
[0140](0140-no-layer-is-inaudible.md)'s way of setting a bound off the measurements that bracket it.
**A test cannot hear.** `node scripts/hear.mjs --only=bossBreach,bossSpit --place=nebula` writes the
file, and the ear that reported the old one is owed the new.

## What this deliberately does not do

- **It does not touch the crossings, the burst or the hold.** Four crossings, four sprays, four cracks
  is 0313's picture and stays; what changed is what a crack sounds like.
- **It does not re-voice the breaker's use of the same cue.** The wave off the edge shares the sound
  of the edge being broken on purpose, and a second cue for it would be 0282's *one instance*.
