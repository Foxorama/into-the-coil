# 0132 — A place may be another piece entirely, and Ember Nebula is one

**Accepted 2026-08-12.** [0128](0128-a-place-plays-its-own-material.md) let a place re-voice two
layers. This lets one re-voice everything it plays, and does it.

> *"The nebula soundtrack needs to be its own theme — something very different, like celestial choir
> music: starting out with haunting hymns, pushing into pipe organs and then surging into a full
> orchestral symphonic choir before kicking into a dissonant discordant hellish boss music of inferno
> fires. I'm aware we don't have any of these sounds so they'll be all new… for the different levels I
> want drastically different music, not just riffs on the same track over and over again."*

## The rule

**A place states as much of the composition as it likes, including its own harmony.** Ember Nebula
states **twenty-one of the twenty-three layers** — every one a level can play, `bass` and `beat` being
title-only ([0095](0095-the-level-has-its-own-music.md)) — with its own sixteen-bar progression, its
own tune and its own instruments. It lives in `src/content/nebula.ts`, imported by `themes.ts` by
name.

⚠️ **NO MECHANISM CHANGED.** `ThemeRow.voices` already accepted a partial record of layers, and
`voicesOf` already resolved it; 0128 built the whole thing and used two rows of it. What is new is
that a place is now allowed to be **another piece** rather than another arrangement, and the argument
for why that is affordable.

## ⚠️ The four stages are the rungs, and that is why this cost no new machinery

The brief names four movements. `MUSIC_LADDER` already opens four groups of layers:

| the brief | the rung | what carries it |
|---|---|---|
| haunting hymns | `run` | `chords` — six sustained choir voices — plus `call`'s plainchant, a tam-tam `engine` and hand-bell `perc` |
| pipe organs | `push` | `groove` the pedalboard, `hook` the 8′ and 4′ ranks, `arp` the mixture |
| symphonic choir | `surge` | `counter`, a bowed line that falls where the hymn rises, and `crash` as a swell rather than a hit |
| the fire arriving | `approach` | `toll`, a cathedral bell, and `dread` holding the tritone alone |
| discordant, hellish | `boss` | `stomp`, `frenzy`, `wraith` and the aura, all built out of three intervals |

⚠️ **So *what a stage sounds like* is decided by WHICH layers a rung opens, and this file only decides
what those layers play.** No distance, no gain and no rung moved.

## ⚠️ The dissonance is inside the key, and that was a constraint before it was an idea

0128 required a re-voiced tune to stay in A natural minor **because the progression under it was
shared**. This place re-voices `chords`, so that reason does not reach it — and the constraint stands
for one that reaches further: **the cues are in the key too**
([0099](0099-the-cues-are-in-the-key.md)). Every pitched effect in the game glides between two tones
of `SCALE`, so a place in another key puts the player's own gun out of tune with the level for three
minutes.

⚠️ **IT COST NOTHING, WHICH IS THE PART WORTH RECORDING.** A natural minor contains **B against F** —
the tritone — and **E–F** and **B–C**, two minor seconds. `frenzy` and `wraith` are made of exactly
those, and the progression plants a **B diminished** in bar thirteen of the hymn, so by the time the
boss arrives the listener has heard the interval once every twenty-five seconds for three minutes. A
hellish boss did not need a note the scale does not have.

⚠️ **`tests/themes.test.ts`'s key guard is therefore kept with its REASON amended rather than its
bound.** A guard whose argument has been outgrown and whose bound is still right is worth saying so
on.

## ⚠️ The cost, measured before the notes were finished

[`what-a-whole-place-costs`](../../reports/what-a-whole-place-costs-2026-08-12.md) has the table. The
three findings, not restated here:

1. **Held alongside the base, this place is 94.8 MB; replacing the layers it states, it is 48.0.** A
   place's arrays are the same length as the ones they replace, so replace-in-place cannot grow
   resident audio at all. **That is what makes a place this size legal**, and it is
   `tests/sound.test.ts`'s own instruction — *"the answer there is baking the level's own set at the
   boundary"* — arriving as a requirement rather than as a suggestion.
2. **3.7 s of synthesis, 43% of it `chords`.** Spread one note at a time by 0102's existing prewarm;
   the longest single job is 2.40 s, under the 3 s ceiling.
3. **A guard hole, found by falling into it** — see below.

## ⚠️ Two guards were missing and a place is what found them

Both of these bake `MUSIC` and only `MUSIC`, so neither had ever seen a theme's own material:

| | |
|---|---|
| **a layer whose weight is under 130 Hz must be centred** (0118) | the first cathedral bell was **49% low at pan −0.5** and every guard was green |
| **no single note may be more than 3 s of synthesis** (0102) | a choir is exactly the material that reaches for a long note |

⚠️ **The bell was fixed as physics rather than as a number.** Its strike note went up an octave and
its **hum** — an octave under the strike, and the quietest thing in a real bell — became its own quiet
voice. 22% now. `scripts/probes/0132-another-piece.mjs` restores the bad bell, and it was seen red.

⚠️ **`scripts/weigh-place.mjs` is the instrument, and it is committed rather than thrown away.** Six
places are still to be written and each of them wants this table before it wants an opinion —
[0027](0027-measure-the-picture-not-the-model.md).

## What is guarded

| | |
|---|---|
| every pattern spans exactly its layer; every note is in the key; nothing is silenced by an empty array | ✅ 0128's four, re-anchored onto `nebula.ts` — the old anchors were orphaned and `npm run prove` refused to run until they were fixed, which is [0019](0019-a-probe-must-be-seen-to-apply.md) earning itself again |
| the baked audio is audibly different, layer by layer, and a shared layer is byte-identical | ✅ 0128's, unchanged |
| **a place's own material is held to the base's band rule** | ✅ new, and it caught this decision |
| **and to the base's longest-note rule** | ✅ new |
| no theme at any rung drives the bus past full scale | ✅ existing, green at these gains |

## ⚠️ What is NOT done, and it is the whole of what stands between this and a player

**`src/app/mount.ts` still never calls `setLoops`.** 0128 left the boundary bake open and this does
not close it, so **a real run of level two plays the base composition**. The dashboard is the only
place this music exists.

⚠️ **That is deliberate and it is the same order 0128 took**: the material is judgeable now and the
plumbing is not, which is the right way round — a bake wired to music nobody has approved is work
spent twice. The measurement above is what the plumbing needs, and it says what shape it has to be.

## Rollback

None owed — [0001](0001-revertability-not-risk-rating.md). Content and tests: no storage key, no save
schema, no cache prefix. The shipped page grows by the source of one composition, which is code rather
than data ([0072](0072-a-cue-is-baked-and-played.md)) — and nothing in a run reaches it until the
boundary bake lands.
