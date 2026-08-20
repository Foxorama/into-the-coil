# 0186 — A place has its own gesture, and nine slots were telling every place what to be

**Accepted 2026-08-20.** Saurian Belt's chord stops being held and starts being chopped. **Its
known-adrift list goes from one entry to none** — the first place in the game with nothing under its
role.

> *"The background beat of saurian belt sounds pretty good now, but the chords and groove are pretty
> similar to ember nebula… they're obviously different, but the audible sounds are 'here are two of
> the same songs with a slightly different background beat'. It's the chords and groove that need to
> shift — rather than a higher octave bounce around it needs a lower octave fast paced drum tone."*

## The rule

**Saurian Belt's `chords` is a gate**: sixteenths at 44 ms with the filter at 620 → 240 Hz, striking
the positions the kick leaves open. One quiet sustained voice remains as glue.

**Its `groove` has a fourth voice that is a drum** — an unpitched 118 → 46 Hz sweep on the sixteenths
`sub` does not take.

## ⚠️ Both instruments that ask *are these places different* were green

| | |
|---|---|
| `weigh-apart` — is the BALANCE different? | **5.7 dB** apart at `push`, well clear of 0147's 3 dB floor |
| `weigh-notes` — are the NOTES different? | Saurian is **the only place in the game** that sounds a G# |

And the ear was still right. **Neither of them measures gesture** — how often a layer strikes, how
long it holds, how low it sits — and on that axis the two places were the same piece:

| `chords` | Ember Nebula | Saurian Belt |
|---|---|---|
| strikes a bar | 0.9 | 0.9 |
| mean note length | 4.01 beats | 3.03 beats |
| lowest note | 82 Hz | 82 Hz |

**A chord held for three-to-four beats, struck about once a bar, bottoming at 82 Hz — in both.**
Different notes, different waveforms, one gesture. `node scripts/weigh-gesture.mjs` is the instrument
[0027](0027-measure-the-picture-not-the-model.md) owed this question, and this is the **third** axis a
report has had to open by ear: [0147](0147-a-place-is-a-balance.md) found balance,
[0155](0155-a-place-follows-its-own-instrument.md) and `weigh-notes` found pitch, and this is shape.

## ⚠️ And the number that is not about Saurian at all

**Nine of the twenty-three slots are filled the same way by both places.**

```
bass · beat · drive · dread · auraSlow · drone · stomp · lead · perc
```

⚠️ **BOTH PLACES WROTE THEIR OWN VERSIONS OF THESE AND ARRIVED AT THE SAME INSTRUMENT.** `drone` is a
4.6-beat sustained thing at 55 Hz in both; `dread` is a 4.4-beat sustained thing at 62 Hz in both.
Neither is inherited — `src/content/nebula.ts` and `src/content/saurian.ts` each state their own. **The
slot's name, its pan, its bar length and its role pull every author to the same answer**, which is
[0113](0113-there-is-one-composition-and-seven-levels.md)'s failure surviving two decisions that were
supposed to have ended it.

⚠️ **THIS DECISION DOES NOT FIX THAT AND SHOULD NOT BE READ AS HAVING TRIED.** It moves two slots in
one place. The player named the cause in the same breath — *"these are the exact kind of similarity
issues that are blocking some of the differences I want on different levels"* — and the answer is
per-place slots, which is a change to `LAYER_PAN` and `LAYER_BARS` and therefore its own decision.

## What the chord was, and what it is

**Seven voices of sustained pad**, five of them saws holding for 4.4 beats with the filter open to
2600 Hz. Bright, floating, struck 0.9 times a bar. **Ember Nebula's is the same gesture with a
triangle in front of it.**

Now: two detuned saws gating sixteenths at 44 ms through a 620 → 240 Hz filter, a square carrying the
third — including the G# that is the whole of [0148](0148-a-place-has-its-own-notes.md) — and one
sustained voice at a third of the old level, highpassed at 190 Hz.

⚠️ **A HI-NRG CHORD IS A STAB AND NOT A PAD**, which is the genre reason and the measured one at once:
what the report calls *a higher octave bounce* is a pad's job, and what it asks for is the chord being
chopped against the floor rather than floating over it.

⚠️ **THE POSITIONS AVOID THE KICK.** `sub` strikes {0, 4, 8, 11, 12}; the gate strikes 1, 3, 5, 7, 9,
13 and 14. That is [0181](0181-the-floor-has-a-bottom.md)'s arithmetic for the floor tom and this
file's own argument for the offbeat bass, applied a third time.

## ⚠️ The depth had to go in `groove`, and that is a rule rather than a preference

`chords` sits at **+0.2** and [0118](0118-the-mix-has-a-width.md) refuses a panned layer carrying its
weight under 130 Hz — a panned low end spends headroom on one side and arrives in a room as the same
non-directional thump anyway. So *lower octave* could not be answered in the layer the report names.

**`groove` is centred and takes it**: a fourth voice that is an unpitched 118 → 46 Hz sweep in 90 ms,
striking where the four-on-the-floor does not. The same split 0181 made when the floor tom could not
go in `perc`.

⚠️ **AND THE GUARD THAT HOLDS THAT RULE CANNOT SEE A RE-VOICED LAYER.** It bakes `MUSIC[layer]` — the
BASE composition — so a place's own `chords` is invisible to it. **Measured across all seven places
and nothing is over the line today** (worst is Rime Shelf's `chords` at 33%), so this is a hole and not
a defect. It is 0184's class, it is named here, and it is not fixed in an authoring decision.

## What it measures

| | before | after |
|---|---|---|
| `chords` mean note length | 3.03 beats | **0.19** |
| `chords` strikes a bar | 0.9 | **2.6** |
| `groove` strikes a bar | 13.4 | **15.5** |
| slots filled the same way as Ember Nebula | 11 of 23 | **9 of 23** |
| Saurian's known-adrift entries | 1 | **0** |

⚠️ **THE GATED CHORD NEEDED FOUR TIMES THE GAIN AND THAT IS NOT A TUNING SLIP.** A pad holding for 4.4
beats puts out far more energy than sixteenths at 44 ms, so `chords` went from 0.34 to 1.5 at `push`
to keep the same role. The number moved because the instrument did.

## What is guarded

| | |
|---|---|
| the gated chord reaches the role the arrangement gave it | ✅ 0164, and the probe is this |
| the bus does not clip with a fourth low voice in `groove` | ✅ |
| a boundary only adds | ✅ 0167 |
| **what kind of thing a slot is** | ❌ **on purpose** — [0161](0161-the-shape-of-a-level-is-not-guarded.md) |

⚠️ **THE GESTURE ITSELF HAS NO GUARD AND MUST NOT GET ONE.** 0161 deleted four assertions about
musical shape and wrote down why: a threshold that a healthy level trips as readily as a sick one.
*How long a chord should be* is exactly that. `weigh-gesture` prints the reading and states no verdict.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix, no origin. Content and one list; a revert is `git revert`.
