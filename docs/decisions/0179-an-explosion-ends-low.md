# 0179 — An explosion ends low

**Accepted 2026-08-19.** The cue material pass, and the first thing the instrument said.

> *"Player gun-fire could be a bit more throatier with a bit more impact… missile explosions don't
> really sound like explosions now either and similar with enemy death explosions and probably the
> player bomb."*

## The rules

**An explosion's centre of gravity falls by at least 3 dB from its onset to its tail.** A cue that
ends brighter than it started is a hiss or a whoosh, whatever its layers look like.

**A cue's low voice may outlast its body when it is PITCHED.** [0109](0109-a-death-is-a-drum.md)
refused a long low NOISE body at two a second because overlap is mud; overlapping scale tones are a
note.

## ⚠️ The instrument came first, and it found the defect on its first run

`node scripts/weigh-cue.mjs` — [0027](0027-measure-the-picture-not-the-model.md) owes an instrument
**before** the first tuning pass, and the music has eight while the cues had a `.wav` and nothing
else. Its columns are the words every report about this channel has ever used: *tinny* is the sub and
low share, *throatier* is the lowmid, *impact* is crest, and *doesn't sound like an explosion* is
**fall** — how far the spectral centroid drops from the first 25 ms to the last third.

⚠️ **THE FIRST RUN, OVER THE TABLE AS SHIPPED:**

| | fall |
|---|---|
| `blast` | −12.5 dB |
| `bossDown` | −12.3 dB |
| `death` | −11.4 dB |
| `missile` | −7.1 dB |
| **`kill`** | **+22.5 dB** |

**The enemy death rose from 266 Hz to 3534 Hz.** It ended as a bright hiss climbing, and it is the
second most repeated sound in the game.

## ⚠️ Eighty-four guards were green over it, and each for a good reason

[0089](0089-a-cue-has-a-body.md)'s asks whether the body **has** a falling lowpass. It does — and the
body was finished at 0.17 s while the cue ran to 0.36. The shed guard asks about spread and the one
under it about which band is loudest; both average the **whole** cue, so a bright ending disappears
into a dark beginning.

⚠️ **NOT ONE OF THEM HAS A TIME AXIS**, which is the same hole
[0171](0171-a-boundary-is-a-build.md) found in the music's three mix guards one channel over — 0164,
0166 and 0167 are all about level, and none of them could see a boundary. This is that sentence
again, in the effects.

## ⚠️ What was 0144's streak, and it is not being taken back

The cause is [0144](0144-a-chain-of-deaths-is-a-cymbal-streak.md): *"enemy death needs a sharper
percussive beat where the sound lasts a bit longer so a chain of deaths sounds like a sharp cymbal
streak."* It answered that by lengthening the debris layer to 0.36 s at a highpass of 1500 Hz, on the
explicit reasoning that a chain of overlapping **tops** is a streak rather than mud. That was right.

⚠️ **What it left is a layer with a falling highpass and NO `lowTo` at all**, holding 7 kHz flat over
a body that had stopped. The streak keeps its length, its gain and its highpass; what changes is that
it now darkens like everything else instead of being the last thing left.

## ⚠️ And the fix is mostly the low voice, which the probe established rather than the author

| kill | fall |
|---|---|
| shipped | +22.5 dB |
| the streak darkened, low voice unchanged | −1.9 dB |
| **both** | **−5.2 dB** |

⚠️ **THE FIRST VERSION OF THE GUARD ASKED ONLY FOR A DIRECTION AND `npm run prove` REPORTED STILL
GREEN.** With the low voice at 0.30 s, restoring the shipped streak still left the cue falling — by
1.9 dB, which is flat. **The margin is read off those two measurements** rather than argued, which is
[0102](0102-the-music-goes-somewhere.md)'s method for its own sub floor: a bound between what it must
catch and what it must pass, never beside either.

## ⚠️ Saturation adds top, and that was measured after being assumed

The first pass put `drive` on the noise bodies of `kill` and `missile` on the reasoning that
saturation is what *heavier* is made of. It is not, on a band-limited noise body: the missile's `hi`
band went 0.401 → 0.953 and the kill's loudest band stayed put. **Squashing noise generates
harmonics, and harmonics are above.** The drive came back down and the fall came from the filters,
which is where it was always going to come from.

## What each row got

| cue | what the report said | what moved |
|---|---|---|
| `pulse` | *throatier, more impact* | the chunk's lowpass 1700→1500/320→250, `q` 1.1→1.5, `drive` 0.55→0.72; saturation on the body; the 0102 sub up 0.50→0.58. **Its loudest band moves from `himid` to `mid`** |
| `missile` | *doesn't sound like an explosion* | the body falls to 440 Hz rather than 600 and reaches 46 Hz rather than 60. Fall **−7.1 → −8.5 dB** |
| `kill` | *doesn't sound like an explosion* | the body to 430/62 Hz, the streak darkens, the low voice to 0.30 s. Fall **+22.5 → −5.2 dB** |
| `blast` | *probably the player bomb* | the body to 300/34 Hz with more drive. Fall **−12.5 → −13.2 dB** |
| `bomb` | — | **nothing.** It is the throw and it RISES on purpose — 0099's *"the thing it turns into has not happened yet"*. Making it explode would answer the wrong sentence |

## What this is not

**Not a verdict.** Every number here is a model quantity. `node scripts/hear.mjs --only=pulse,missile,kill,bomb,blast`
writes what the game plays and the ear is the judge — 0027, in the one channel that has nothing to
look at.

**Not a missile impact sound.** There is no such cue: `CUE_KINDS` has `missile` for the launch, and a
missile that destroys something plays `kill`. If *"missile explosions"* meant the moment of impact,
the answer is a new row and a caller in `src/app/frame.ts`, which is a feature and not a re-voice.

**Not a length change on anything the cadence bounds.** 0104's ceilings are untouched; `pulse` is
still 0.064 s against a 0.067 s fastest volley.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the streak left undarkened, so the cue's fall flattens to 1.9 dB | `0179 — THE REPORTED ONE: an explosion ENDS LOWER THAN IT STARTED, which none of the above sees` |
| the low voice back inside the body's own length, so the last third has no bottom | `0179 — THE REPORTED ONE: an explosion ENDS LOWER THAN IT STARTED, which none of the above sees` |

⚠️ **AND FIVE OTHER DECISIONS' PROBES WERE STRANDED BY THIS PASS AND RE-ANCHORED** — 0089, 0102,
0104, 0109 and 0143 all name a `cues.ts` line this touched. `anchorFailures` reported every one
before a tree was copied, which is the two-second failure
[0079](0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md) built it for.

## Rollback

No storage key, no save field, no service-worker cache prefix, no origin. `src/content/cues.ts` is
baked at run start and nothing persists a sample, so reverting the commit restores the previous sound
on the next load with no migration.
