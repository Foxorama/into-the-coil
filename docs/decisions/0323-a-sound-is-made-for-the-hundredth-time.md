# 0323 — A sound is made for the hundredth time

**Status:** accepted
**Amends:** [0308](0308-the-attacks-are-heard.md) — the acid's length, band and level; [0089](0089-a-cue-has-a-body.md)
and [0099](0099-the-cues-are-in-the-key.md) — the death resolves now; [0104](0104-the-gun-plays-a-figure.md)
— its rule is asked about a boss for the first time
**Builds on:** [0322](0322-the-ball-is-worth-shooting.md) — whose cadences are what make the new guard green

**A cue that recurs is designed for the hundredth hearing, not the first.** The serpent's acid is a third
of its old length with its weight out of the ear's sore band; its three attacks are struck at four
different weights so no two soundings are identical; the crash thirteen bosses share is shorter than the
tightest cadence that throws it; and the ship's death lands on the root instead of leaving a question
hanging.

## What was asked

> *"and the sound is horrible, it's actively unpleasant too listen to for the serpent's attacks.*
>
> *and while we're at it, the player's death needs to sound better, you're going to be hear the death noise
> a lot so it needs to be a sound you want to hear over and over and over again"*

## ⚠️ I cannot hear, and this decision is written so that matters less

[0308](0308-the-attacks-are-heard.md) is the cautionary tale and it is two decisions old: every
measurement it took said the re-voice had worked, and the answer that came back was *"the sounds are
pretty terrible still."* Its own note says why — *"a table that is right about every quantity it measures
can be wrong about the only thing that matters, and the channel with nothing to look at is where that
happens."*

So nothing here is tuned by taste. **Every change below is a quantity that was measured against a rule
this repository already wrote down for a different sound**, and the one thing owed at the end is a hand on
`scripts/hear.mjs`.

## The first fault: 0104's rule was never asked about a boss

`tests/sound.test.ts` has held this since 0104, for every gun and every tube the player can carry:

> *an auto-weapon's cue finishes before its own next volley … a sound with no gap in it is not a rhythm —
> it is a continuous tone with bumps, and no amount of putting it ON the beat could have made a beat
> audible inside it.*

**Nothing in the repository had ever asked it about a boss**, which throws on a cadence the content
authors exactly as the gun does. Measured over the table as the report found it:

| cue | sounds for | comes back every | where |
|---|---|---|---|
| `bossAcid` | 0.95 s | **0.70 s** | the serpent's opening phase, `burn` |
| `bossAcid` | 0.95 s | 1.10 s | the same phase, `savior` — 0.15 s of silence |
| `bossVoid` | 0.96 s | **0.60 s** | the last third, `burn` |
| `bossVoid` | 0.96 s | 1.00 s | the last third, `savior` — 0.04 s of silence |
| `bossBolt` | 0.66 s | **0.60 s** | the last third, `burn` |
| `bossShot` | 0.38 s | **0.30 s** | the **medusa's** last phase, `burn` |

⚠️ **AND 0308 KNEW THE CADENCE AND ASKED THE WRONG QUESTION ABOUT IT.** Its own note reads *"the
serpent's last phase fires every 36 steps, which is 0.6 s"* — and uses that only to argue about whether
the cue should duck the music. The number was on the page and the overlap was not the question anybody
asked of it.

⚠️ **WHICH OF THESE THE PLAYER ACTUALLY HEARD DEPENDS ON THE TIER, AND I DO NOT KNOW WHICH THEY PLAY.**
At `legendary` the acid had 0.45 s of silence between soundings and did not overlap at all. So the overlap
is a real fault and it is not necessarily *their* fault — which is why the three below matter as much.

## The second fault: it lived in the one band an ear cannot take for long

`scripts/weigh-cue.mjs`, the table as it stood:

| | `bossAcid` |
|---|---|
| loudest band | **`hi`, 2–5 kHz, at 1.00** — against `mid` 0.52 |
| centroid | 512 Hz → **1509 Hz**, a rise of **9.4 dB** |
| loud | **−25.0 dBFS**, the loudest cue in the game bar the boss dying |
| length | 0.95 s, arriving every 0.7–1.4 s |

Four properties, and every one of them is the same instruction: *put the energy where the ear is most
sensitive, make it the loudest thing on the bus, sweep it upward so it thins as it goes, and repeat it
before it has finished.* 2–5 kHz is where a listener's fatigue lives; a rising centroid is a whoosh; and
0179 already holds for every explosion in the game that **an explosion leaves its top behind**, which this
cue did the exact reverse of.

⚠️ **0308's OWN ARGUMENT FOR THE RISING HIGHPASS IS WHY IT IS WORTH NAMING.** *"Acid stops by drying, and a
tail that fills out as it fades is being switched off rather than running out."* That is a good sentence
about one hearing of one cue. Forty of them a fight is a kettle.

### What the acid is now

| | before | after |
|---|---|---|
| length | 0.95 s | **0.34 s** |
| `hi` (2–5 kHz) | **1.00** | **0.32** — the loudest band is `himid` now |
| centroid | +9.4 dB (rising) | +0.8 dB (flat) |
| loud | −25.0 dBFS | **−30.4** |
| room (`air`) | 0.30 | 0.22 |
| weights | one | **four** |

**The wet half is what was kept and the bright half is what went.** The glop, the bubbles and the fry are
the character the word *acid* asks for; the long fine sizzle sitting on top of them was the fatigue. The
grain rates come down about an octave, the lowpasses close further, and the highpass **falls** where it
rose, so the tail fills out as the thing dries rather than thinning into the sore band.

⚠️ **THE CENTROID IS FLAT RATHER THAN FALLING, AND THAT IS A LIMIT RATHER THAN AN OVERSIGHT.** Getting it
to fall means closing the bubbles' lowpass to about 400 Hz, and 0089's *"there is almost no bottom in it,
which is the point"* is this cue's own design — a boomy acid spit is a different fault. What is fixed is
the rise; what is left is level, over a third of a second, at 400 Hz.

⚠️ **AND IT IS QUIETER BY FIVE DECIBELS, WHICH IS 0308's ASK READ PROPERLY.** *"Massively buffed"* was
written about attacks that measured −33.6 dBFS against a blast at −26.6. At −30.4 the acid is still three
decibels over the crash it replaced and eight over an enemy volley, and it is no longer louder than the
player's own death. An attack that is the loudest thing in the game is a mix with its priorities upside
down.

## The third fault: every sounding was bit-identical

[0102](0102-the-music-goes-somewhere.md) found this in the drums and named it: *"identical repetition at a
fixed interval is not LIKE a metronome, it is the definition of one."* 0104 answered it for the gun and the
kill with `figure` — a weight per sixteenth of the beat, indexed by **where in the beat the cue lands**, so
a shot on the downbeat is accented because it is on the downbeat.

**No boss cue had one.** The serpent's acid sounds forty-odd times in a fight; all three of its attacks
have a figure now, which is four numbers each and no new mechanism. The void's and the bolt's are the
*only* change either of them gets:

- `bossVoid` measures 0.96 s inside a round of 1.7 s, `hi` **0.099**, a centroid that **falls 8.4 dB**,
  −32.1 dBFS. There is nothing here the measurements condemn, and the player named this cue in their own
  words — *"void null wumm wumms"*.
- `bossBolt` has the biggest fall in the table (**−17.5 dB**) and belongs to the attack they have twice
  said not to change.

⚠️ **SO IF THE REPORT MEANT THOSE TWO AS WELL, THIS DECISION HAS NOT FIXED THEM**, and that is said here
rather than discovered later. What it has done is give them variation and leave a table of numbers to
start the next pass from.

## The crash thirteen bosses share is 0.38 → 0.28 s, and the medusa is why

The new guard is over the whole table, so it found a boss nobody was asking about: **`bossShot` at 0.38 s
against a recurrence of 0.30 s in the medusa's last phase at `burn`**, and within a fortieth of a second of
overlapping itself on the harrow, the shoal-mother, the axis and the fish. It was the tightest sound in the
game and nothing had ever measured it.

⚠️ **THE CADENCE WAS THE OTHER CANDIDATE AND IT WOULD HAVE BEEN THE WRONG PAYER.** Slowing a boss nobody
has complained about, to fit a sound, is [0192](0192-a-guard-holds-an-invariant.md)'s *a red guard is never
answered by changing the work to suit it* pointed at the content instead of at the guard. **The sound is
what is too long.** Its character is untouched — the same strike, ring and two-note body — and its gain
goes 0.42 → 0.46 to put back what an eighth of the length cost a 400 ms meter (−33.6 → −35.0 → −34.2 dBFS),
which keeps the four loudest rows summing to 1.848 and passing the limiter untouched.

⚠️ **THE MEDUSA NOW HAS TWO HUNDREDTHS OF A SECOND OF MARGIN**, which is the tightest row in the table and
is exactly what the guard is for: the next decision that quickens that fight will hear about it.

## The death resolves, which reverses the choice 0099 was proudest of

The old row's own note:

> *F3 → G1 … **IT DOES NOT RESOLVE, AND THAT IS THE WHOLE CHOICE.** The blast and the boss both fall onto
> the root because the player did those; a death falls from the sixth onto the seventh — a step UP in the
> scale under a falling pitch — so the ear is left waiting for a note that never comes. It is the only cue
> in the game that ends unfinished.*

⚠️ **THAT IS A GOOD IDEA ABOUT A SOUND HEARD ONCE AND THE WRONG IDEA ABOUT A SOUND HEARD TWO HUNDRED
TIMES.** An unresolved cadence is a question; a question asked every ninety seconds is nagging. *"A sound
you want to hear over and over"* is the instruction, and a thing you want to hear again is a thing that
finishes.

| | before | after |
|---|---|---|
| the fall | F3 → **G1** (the seventh) | F3 → **A1** (the root) |
| the low body | F2 → G0 | F2 → **A0** |
| the tail | 0.85 s of filtered saw | **two `tri` voices a minor third apart**, struck a tenth of a second in |
| the noise body | 1.15 s, lowpass to 340 | 0.95 s, lowpass to 260 |
| centroid | −11.4 dB | **−11.0 dB** |
| loud | −25.7 dBFS | −26.3 |

**A + C, the two notes that say the key is minor**, sagging one degree each as a struck body does, ringing
for most of a second under the fall. `tri` is the wave this file's own note calls *"the ones that have to
be pleasant"*, and it is the only pleasant thing in a cue that is otherwise a hull failing. The saw it
replaces was 0.85 s of filtered buzz contributing weight the two sines already had.

⚠️ **WHAT IS DELIBERATELY UNCHANGED: the impact, the duck and the twin.** It still starts with the ship
coming apart, it still pulls the music down by 0.4 while it lands (0104's rule: it is over a beat and its
twin resolves), and it is still instantly distinguishable from `shield`, which rises. A death that stopped
sounding like a death would be a different defect — 0036's, in the channel 0024 will not let carry
information alone.

## The guard, and why there are two of them

**The arithmetic** (`tests/sound.test.ts`): for every boss, every phase and every tier, the gap between
two soundings of a cue against its own length. A `heads` phase gives each head one turn per round, so a
head's cue recurs every **round** — the sum of the turns, each one the tier's cadence plus whatever that
head holds it out by: a `gap` (0322), a `beam`'s warning and hold, or a `sweep`'s own length rounded to the
fire grid. Measuring against `fireEvery` alone would refuse the serpent's void for a gap it never has.

**The fight** (`tests/serpent.test.ts`): the same claim driven — twelve flights, every phase at every
tier, twenty seconds each, measuring the gap between two soundings as the frame actually emits them.
Everything in the arithmetic is a model of `stepBoss` and
[0027](0027-measure-the-picture-not-the-model.md) is explicit that a model of a thing is not the thing;
[0019](0019-a-probe-must-be-seen-to-apply.md) is why both exist rather than one.

⚠️ **AN INVARIANT AND NOT A TASTE, WHICH THE ADMISSION TEST SETTLES.** *Name a change to the content that
would redden this and be correct.* There is none: a cue still ringing when the same cue starts again is not
a design choice at any cadence, for the reason 0104 gives. What a row is free to do is be **shorter**, and
that is the axis content moves on.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0323`:

| broken on purpose | went red |
|---|---|
| the sizzle back at 0.95 s, so the acid is still sounding when the serpent spits again | `THE REPORTED ONE: and a BOSS’s attack finishes before its own next volley` |
| the shared crash back at 0.38 s, where the medusa's own cadence overlaps it | `THE REPORTED ONE: and a BOSS’s attack finishes before its own next volley` |
| the death falling onto the seventh again, so the sound the player hears most never lands | `0323 — the death RESOLVES` |
| the sizzle back at 0.95 s, **measured in the flown fight** rather than in the table | `THE REPORTED ONE, DRIVEN: no attack of this animal is still sounding when it sounds again` |

⚠️ **THE FIRST AND THE LAST ARE THE SAME EDIT AGAINST TWO DIFFERENT GUARDS, WHICH IS THE POINT OF HAVING
BOTH.** The table says the acid comes back every 0.70 s at `burn`; the fight says it came back after
**0.60 s** at 0.7 of the bar. Neither number is the other's, and a break that reddens both is a break the
arithmetic and the frame agree about.

⚠️ **THERE IS NO PROBE FOR THE BAND OR FOR THE WEIGHTS, AND THAT IS DELIBERATE.** *Do not put the energy
in 2–5 kHz* would be a guard against a bright sound — the `threat` cue is 1.00 there and is right to be —
which is [0295](0295-a-ranking-guard-is-a-content-limiter.md)'s content limiter exactly. The weights are a
taste (`0323-struck`) for the same reason: a boss that IS a machine is a fight somebody may author. Both
are recorded here as measurements rather than held as rules.

⚠️ **AND TWO OLDER PROBES WERE RE-ANCHORED** — 0099's *the death dropped a semitone onto a note outside
the key* (it named the old endpoint) and 0308's *the acid ducking the music* (it named the old `air`).
Both were re-proven rather than merely edited.

## What is owed

- **A HAND, and it is the only one that can answer the report.**
  `node scripts/hear.mjs --only=bossAcid,bossVoid,bossBolt,bossShot,death` writes what the game plays, and
  `npm run dash` has every one of them on a button ([0126](0126-the-dashboard-is-the-instrument.md)). Every
  number above is a quantity; *pleasant* is not one.
- **The void and the bolt, if the report meant them.** They measure healthy and they are unchanged bar the
  weights; the table in this decision is where the next pass starts.
- **The death, heard twenty times in a row**, which is the actual test of the ask and cannot be done by a
  suite.
