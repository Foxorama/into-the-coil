# 0401 — The vessels beat with the music

**Accepted 2026-09-28.** The Black Heart's vessels, and the heart itself, beat on the heartbeat the
player hears, read off the music's own clock. **Keeps [0160](0160-the-music-free-runs.md)**: the music
still reads nothing, and this is the other direction. **Amends [0354](0354-the-heart-has-veins.md)**:
the pulse stops keeping a beat of its own. **`Surface.blit` takes an `alpha`**, on `turn`'s terms
([0306](0306-the-serpent-coils-in.md)).

## The ask

> 5. the background arteries for the level need to pulse in time with the heartbeat to the music to
>    really sell the 'heartbeat' effect.

## What it was

A bead ran down each vein and swelled on `beatAt`, two thumps and a rest every 66 steps. That is a
heart the music never played: [0331](0331-the-heart-beats-under-it.md) gave this place five hearts at
five speeds, 3.8 s apart at the opening and 0.8 s in the fight. The vessels themselves never changed.

## The rules

**The heart's strength is read off the voice the music plays.** `VEINS_OF.core.hearts` names one voice
per stretch of the level: `ownC`, `ownD`, `crash`, `ownB`, and the fight's `sub` double kick. Each has
a strength at the rungs it is heard in. `heartAt(theme, veins, rung, seconds)` finds the last step that
voice struck, against the loop its layer plays over (`barsOf`), and falls away from it over about a
sixth of a second. There is no second table of when the heart beats: a heart moved in the music moves
in the picture.

**The clock is the audio one.** `MusicOut.clock()` is `currentTime − anchorAudio`, where a voice's
steps are measured from. The shell reads it once a frame, at the rung and place it has just asked the
music for, and writes `World.heartBeat`. Only `draw` reads that field. **Nothing that steps reads it**,
so a seeded run is the same run with or without music, and a fixture that never writes it draws a heart
at rest.

**What beats.** The whole of every vessel flares on a lub: `skyVeins` is the weather tile's vessels as
light and nothing else, baked at half detail in the place's gas colour, and blitted over the tile at
the heart's strength. Nothing is drawn below 0.02. The beads swell with it. The vessels into the heart
widen towards it (0400). The heart swells by its seat's `throb`.

**The strengths climb** — 0.45, 0.6, 0.75, 0.9 and 1. The report on the sound was *"subtle at first
and then a noticeable heartbeat at the end"*, and the picture says it too.

## What was refused

- **A beat on the sim's clock at the music's tempo.** It is right until the first dropped step and then
  wrong for the rest of the run. That is [0159](0159-the-two-clocks-come-apart.md)'s whole finding, and
  it would be a cheap mechanism wearing the ask's name ([0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md)).
- **Baking the lit vessels at several brightnesses.** It is a full sky tile per step of brightness to
  draw a continuous quantity. A faded blit is one draw of one bitmap, so it hides nothing from
  [0025](0025-the-frame-budget-is-counted-not-timed.md)'s count.
- **Reading the layers' live gains.** They would follow the fades exactly, but a gain belongs to the
  shell's audio graph, and the rung's strength is a statement about the picture that a test can read.

## The guards, and that each was seen to fail

`scripts/probes/0401-the-vessels-beat-with-the-music.mjs`, all in `tests/heart.test.ts`:

| guard | the break |
|---|---|
| *every rise is a struck step of the heard voice* | the lookback reading the step after |
| *subtle at first … climbs to the fight* | the opening as strong as the fight |
| *IN PIXELS: the lit vessels are laid over the weather at the heart's strength* | the overlay drawn opaque |

`tests/heart.test.ts`'s bead guard now hands the painter a beat rather than stepping through one.

## Not held by any guard

**That what the speakers play and what the screen shows land together on a real machine.** The audio
output's own latency is not in `currentTime`, and no instrument here measures it. Owed an eye and an
ear on the preview.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md).
