# 0209 — The rig hears in stereo, and the guard on the width was green the whole time

**Accepted 2026-09-02.** Fixes a defect in `scripts/hear.mjs` that has been present since
[0118](0118-the-mix-has-a-width.md) gave the mix a width. Changes nothing about the game.

> *"why is it mono? I thought we'd made it stereo ages ago?"*

## The question was right and my answer was wrong

I said the game's music was mono. It is not — [0118](0118-the-mix-has-a-width.md) gives every layer a
position through `LAYER_PAN`, `src/app/music.ts` builds a `StereoPannerNode` for each of them, and
the cue bus pans every cue through `panFor` into one of `PAN_BUCKETS`. **The game is stereo on both
channels.**

What was mono was **the instrument**. `wavOf` defaults to one channel and only `--level` passed two,
so `--music`, `--solo`, `--aura` and `--play` all summed the layers to a single number and wrote it.

## ⚠️ Every guard about the width was green while every listenable file was mono

`tests/music.test.ts` holds `panGains` to equal power across the entire sweep, and holds `LAYER_PAN`
not to lean to one side. Both true. Both about the model.

**Nothing checked that the thing a person actually plays carries any of it**, and that is
[0027](0027-measure-the-picture-not-the-model.md) inside `hear.mjs` **for the third time**:

| | what the instrument was reporting |
|---|---|
| the missing bus shaper (0104) | a mix nobody hears, under-reported by ~4.5 dB |
| two reference levels (0114) | the same music at two loudnesses, reported as a defect in the music |
| **the width (this)** | **a mix folded to one point** |

⚠️ **THE WORST OF THE FOUR IS `--play`.** Its own header says it exists because *"the game sound
effects don't blend in with the music at all… the sound doesn't mesh"* — a claim about music and cues
**in the same air**. It rendered both folded to the middle: the one arrangement in which everything
maximally collides, and the least favourable possible test of whether two things blend. **Four mix
passes were judged on it.**

## The rule

**Every render that carries the music is written in stereo**, through one `bedStereo` helper that
sums the layers at `panGains(LAYER_PAN[layer])` and applies the bus shaper **per channel** — a
`WaveShaperNode` on a stereo bus shapes each side on its own, and one curve over a mono sum then
split is a different sound. That argument already existed once, inside `--level`; it is now made in
one place instead of two.

**Cues in `--play` are placed too.** The game pans a cue by where the thing that made it was, so the
rig draws an `across` from its scatter stream for each kill, hit and threat, and leaves the ship's own
gun and tubes at centre where the player is. **This is a stated model and not a measurement** — the
rig does not know where an enemy was, only that they are spread across the lane.

**The cue catalogue stays mono, deliberately.** `--out=cues.wav` plays each cue alone to say what it
*is*; position is not part of a timbre and nothing is competing with it there. It is named in the
guard rather than left to look like an oversight.

## ⚠️ Two things this changes downstream

- **The `music vs cues` dB figures move.** That column is the one number behind *"background too
  quiet"*, and panning redistributes energy, so the ratios printed now are not comparable with any
  written down before today. **The old ones were measuring a fold.**
- **Every existing rendered WAV on disk is stale**, including anything shared for a listen.

## The cost, named

Nothing catches a mono render by ear unless somebody is listening for width, and no test can hear at
all. The guard is a source scan over `hear.mjs`'s `writeFileSync` calls, which is weaker than a
measurement — it holds that the channel count is passed, not that the sides differ. **A stronger
guard would render and measure the side channel**, and that is a minute of CI for a defect that has
occurred once. The scan plus the probe is the proportionate answer, and the weakness is written here
rather than discovered later.

⚠️ **The renders WERE measured by hand before this landed**: the arc's side channel (L−R) sits at
−29.3 dB against a mid (L+R) of −16.9 dB. Dual mono would read −∞, so the width is real and not just
a channel count.
