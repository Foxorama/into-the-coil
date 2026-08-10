# 0109 — A death is a drum, and the music does not get out of its way

**Accepted 2026-08-10.** Item 6 of
[the-ninth-play-test](../../reports/the-ninth-play-test-2026-08-10.md).

## The rules

**Nothing the level script schedules by the hundred may duck the music.** A duck takes 0.445 seconds
to recover and a level sends about two bodies a second; ducking for each one is the bed turned down,
not an effect.

**A cue the level schedules is shorter than the beat it lands on**, so two of them are two events.

**A cue does not sweep below the band the music's own fundamental occupies.**

## What was asked for

> *"the player weapons are definitely feeling more like part of the music now, but the enemy deaths
> don't, they're on their own sound band at the moment and instead of punctuating the music, they
> detract from it."*

⚠️ **HALF OF [0104](0104-the-gun-plays-a-figure.md) IS CONFIRMED AND HALF IS REPORTED BACK, AND THE
HALVES ARE THE FIELDS.** That decision gave the pulse a `figure` and a length that fits its own
cadence, and gave `kill` `onGrid` and a `duck` — **neither of the two that worked.**

| | `pulse` | `kill`, as shipped |
|---|---|---|
| on the grid | — | ✅ |
| struck at more than one weight | ✅ | — |
| shorter than its own cadence | ✅ | — |
| ducks the music | deliberately not | 0.18 |

## The duck's own comment adds up the wrong two numbers

⚠️ **`src/app/music.ts` says of the hold: *"the bed is back up by the time the next gridded cue can
land. Anything longer and a busy fight would hold the music down continuously."*** It counts
`DUCK_HOLD_SECONDS` and forgets `DUCK_UP_SECONDS`. Trigger to recovered is
`DOWN + HOLD + UP` = **0.445 s**, which is four and a half sixteenths.

⚠️ **A LEVEL SENDS 1.65 TO 2.33 BODIES A SECOND**, driven over all seven rows of
`src/content/levels.ts`. At the busiest, `2.33 × 0.445` is **104% of the level**: the bed was not being
ducked for an explosion, it was being held down and let up briefly between them. **That is what
*"instead of punctuating the music, they detract from it"* is a description of**, and it is arithmetic
rather than taste.

⚠️ **0104 REFUSED EXACTLY THIS FOR THE GUN, IN WRITING** — *"a pulse that ducked would hold the bed
down for the whole game"* — and the sentence reaches `kill` the moment anybody multiplies the two
numbers. The gun fires four times as often, and past about twice a second the duck saturates either
way.

⚠️ **The three duck constants are UNCHANGED and 0104's reasoning about the asymmetry stands.** What was
wrong is which cues may spend it, which is a property of the row.

## It was longer than a beat, so two kills were never two events

⚠️ **0.46 s at 150 BPM is 1.15 beats.** 0104 measured this exact defect on the gun — *"sounding 110% of
the time and 165% at full rate… a continuous tone with bumps in it"* — and fixed it there. At two
bodies a second the explosions overlapped themselves continuously.

⚠️ **`hold` cannot do this job and was never meant to.** It is 2 steps against a cue 16 steps long, and
0104 records that every row in the table is deliberately longer than its own hold: two kills close
together *should* both sound. The bound that was missing is a ceiling on the LENGTH, and the beat is
what makes it a rhythmic statement rather than an arbitrary one — a mark that is over before the next
beat is one the ear can place.

## *Their own sound band*, read the other way round

⚠️ **The kill was not beside the music — it was underneath it.** Its lower tonal voice fell to
`inKey(-6)`, which is **31 Hz**, and [0108](0108-the-bed-is-felt-and-the-boss-arrives.md) had just put
the music's own fundamental at **41–65 Hz**. Two things claiming one band, twice a second, is mud.

⚠️ **Measured as A-weighted `sub`-band level against the `run` bed's**: the kill was at **0.77×** the
bed and is now at **0.15×**. It is a tuned tom in the drum band, where a thing that punctuates belongs.

⚠️ **THE PLAYER'S OWN WEAPONS REACH BELOW THE BED TOO, AND ARE DELIBERATELY LEFT ALONE.** The pulse
falls to `inKey(-7)` (27.5 Hz) and the missile to `inKey(-12)`, and the pulse's `sub`-band level is
**1.84×** the bed's while it plays — which at the cap is 96% of the time. That is a real interaction
between 0102's *"too tinny"* fix and 0108's new floor, and it is **measured and not acted on**: the
ninth play-test signed the weapons off in the same breath as it reported this row, and changing two
channels at once is what makes the next verdict unattributable. It is owed as its own single-lever
change.

## What it cost

| | before | after |
|---|---|---|
| length | 0.460 s | **0.260 s** |
| duck | 0.18 | **none** |
| `figure` | none | **4** |
| `sub`-band level vs the `run` bed | 0.77× | **0.15×** |
| peak against the bed's RMS | — | −7.5 dB, and **+3.6 dB over the pulse** |

⚠️ **The gain went 0.33 → 0.36 and that is buying back the duck rather than adding loudness.** A cue
that ducks is louder against the bed by the depth of its own duck; 0.9 dB of gain replaces 0.18 of
duck at the instant it lands, and leaves the music alone for the 0.4 seconds afterwards.

## What the proof found

⚠️ **Four probes, four guards, and one orphaned anchor in [0089](0089-a-cue-has-a-body.md)** — its
*highpass taken off an explosion's body* probe pointed at the exact layer this decision re-voiced. It
is re-pointed rather than deleted: the rule it holds is still the right one, and the layer it holds it
over is still there.

## Rollback

**None owed.** No storage key, no save field, no service-worker cache prefix and no origin. The cue is
synthesised from this table at load and nothing about it is persisted.

## What this does not settle

⚠️ **Whether the weapons should come out of the bottom octave**, measured above and deliberately
untouched.

⚠️ **`bossDown`, `blast` and `death` keep their ducks** — all three are events a player can count on
one hand per level, so the arithmetic that condemns the kill's acquits theirs. Nothing measures their
rate, because nothing can: two are player-driven and one happens once.

⚠️ **Whether a kill should be PITCHED to the chord that is sounding.** It hangs on the seventh, which
is consonant over all four chords of the progression, so the harmony works everywhere and belongs
nowhere. Transposing per bar would need each layer's scale DEGREE rather than the resolved Hz the rows
store — 0104 names that as the reason `figure` is a velocity and not a pitch, and it is still the
reason.
