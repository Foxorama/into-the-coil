# 0325 — The fight sounds like the fight

**Status:** accepted
**Amends:** [0308](0308-the-attacks-are-heard.md) and [0323](0323-a-sound-is-made-for-the-hundredth-time.md)
— the serpent's three attacks state a note now; [0172](0172-a-place-opens-with-its-own-four.md) — level
one states a ladder at its fight rungs, and that guard is about an OPENING
**Demotes:** `tests/sound.test.ts`'s *a place that states nothing hands the base set straight back*,
deleted — no place states nothing any more — [0192](0192-a-guard-holds-an-invariant.md)
**Builds on:** [0188](0188-a-place-owns-four-slots.md) — the maracas are level one's `ownA`;
[0099](0099-the-cues-are-in-the-key.md) — the key they are in

**Every cue in this game was measured against the music for the first time, and every one of them had
no note in it.** The serpent's acid, void and lightning now hold scale tones the fight's bed is
already holding, and level one's boss music grows a maraca and a rattle.

## What was asked

> *"the sounds also aren't quite right. I think the issue is that they don't fit into the music or
> other sounds so they sound discordant because they're in their own little area of sound so we need
> to blend with them a bit more melody and a slightly deeper bass to make them fit the game.*
>
> *additional thing for the boss music for this level is that we need to work some maraca's into the
> boss music for that rattlesnake effect type, it should be subtle but interwoven into the boss
> music"*

## The instrument first, because this is the third report about this channel

[0027](0027-measure-the-picture-not-the-model.md) owes the instrument before the tuning pass, and
0323's own closing note said the next pass starts from a table. **There was no table for the thing
this report is about.** `scripts/weigh-cue.mjs` measures a cue ALONE — bands, centroid, level — and
every column in it is right about a sound nobody is playing music underneath. `scripts/hear.mjs
--play` writes the pair and has since 0114, because a play-test said *"the game sound effects don't
blend in with the music at all"*; a wav is a verdict and not a diff.

**`scripts/weigh-fit.mjs`** is the missing half, and its four columns are the report's four phrases:

| column | the phrase it answers |
|---|---|
| `melody` | *they sound discordant* — dB by which the sound prefers the key's own frequencies to the quarter-tones between them |
| `stands` | *a bit more melody* — the same ratio at ONE frequency: the loudest scale tone against the quarter-tone beside it |
| `bottom` | *a slightly deeper bass* — its share of 25–130 Hz, against the bed's own share |
| `apart` | *their own little area of sound* — the band where the cue most exceeds the bed's profile |

⚠️ **A COMB AND NOT A PITCH DETECTOR, BECAUSE 0099 ALREADY PROVED THAT QUESTION UNANSWERABLE.** Two
defensible models of the death cue's pitch disagreed by four semitones. A scale tone and the
quarter-tone above it are the same distance from every other note, so a signal with no pitch in it —
noise, a sweep, a click — puts equal energy either side and reads 0 dB. The arithmetic is `keyFit` in
`tests/spectrum.ts`, shared with the taste below rather than restated (0029).

### Calibrating it, which is the step 0308 skipped

`node scripts/weigh-fit.mjs --layers` runs the same arithmetic over the bed's own layers at level
one's fight — voices that unarguably hold notes:

| | `melody` | `stands` |
|---|---|---|
| `dread` (the fight's part) | **+29.5 dB** | +50.5 |
| `drone` | +30.1 | +36.0 |
| `toll` | +26.3 | +26.6 |
| **THE BED, all of it** | **+24.5** | +45.0 |
| `ride` — a cymbal | **−0.3** | +17.3 |
| `crash` — a cymbal | +1.2 | +1.4 |

### And the finding, which is larger than the report

| cue | `melody` | `stands` |
|---|---|---|
| `bossAcid` | +0.2 dB | **+0.2** |
| `bossVoid` | +0.2 | **+0.2** |
| `bossBolt` | +0.8 | **+0.8** |
| `bossShot` — the crash thirteen bosses share | +0.8 | +0.2 |
| `pulse` — the player's own gun | +0.5 | +0.4 |
| `kill` | 0.0 | 0.0 |

⚠️ **NOT ONE CUE IN THE GAME STATES A NOTE.** They measure as percussion — `ride` and `crash` are the
company they keep — over a piece that measures +24.5. *"They're in their own little area of sound"* is
exact, and this is the number under it.

⚠️ **AND EVERY ONE OF THOSE CUES IS ALREADY IN THE KEY, WHICH IS WHY NOTHING HAD CAUGHT IT.**
[0099](0099-the-cues-are-in-the-key.md)'s guard walks the two numbers each pitched layer carries and
holds both to scale tones; it is green and has been since it landed. **A layer that names `inKey(9)`
and glides away from it in 40 ms has stated no note** — the row is in the key and the sound is not.
0099's own note says a fast chirp has no pitch in the sense the question assumes, and that is the
sentence this report is the other side of.

## What the three attacks say now

A **held** voice — `to` equal to `from`, which is what the field means — in each, and all of them on
notes the fight's bed is holding at the same moment (`drone` sounds the root and the fifth, `sub`,
`dread` and `frenzy` the root):

| cue | what was added | `stands` |
|---|---|---|
| `bossAcid` | its glide C3→C2 becomes **two held notes, C3 then A1** — the minor third falling to the root — plus the octave over the landing so a laptop hears it | 0.2 → **+7.8 dB** |
| `bossVoid` | **A and E held under the three wumms**, slow in, longer than the wash: a drone the pulses fall into | 0.2 → **+12.6** |
| `bossBolt` | **a held root under the clap**, 55 Hz, ending before the ticks do | 0.8 → **+15.6** |

⚠️ **THE CHARACTER OF ALL THREE IS UNTOUCHED, WHICH IS THE PART THAT MATTERS MOST.** 0323 cut the
acid's sizzle an octave and to a third of its length because 2–5 kHz was the fatigue: the acid's `hi`
share is **0.333 after against 0.336 before**. The void's three wumms and the bolt's four grain layers
are not edited at all — *"don't change the lightning attack it's really good"* is about the attack and
0323 left its timbre alone for the third time; this goes underneath it. Levels move by less than half
a decibel (`bossAcid` −30.2 dBFS, `bossVoid` −32.7, `bossBolt` −28.2) and all three peaks are
unchanged.

⚠️ **THE ACID'S SECOND NOTE WAS SHAPED BY A GUARD RATHER THAN BY A TASTE.** At the first draft's
`curve` 2.4 over 0.34 s the root was still ringing when the cue ended and *starts and ends at zero*
went red — 0.0873 against 0.0801, a cue louder at its end than at its start. 3.6 over 0.30 s is the
same note in the same place, gone before the cue is.

⚠️ **AND THE `apart` COLUMN BARELY MOVED, WHICH IS SAID HERE RATHER THAN LEFT TO BE NOTICED.** The
acid is still `himid` +4.4 dB over the bed's profile and the bolt still `hi` +4.6. **A held note under
a wash does not change where the wash is.** If *their own little area of sound* turns out to have been
about the band rather than the harmony, the next pass is a re-voice of the noise layers themselves —
and that is a different change from this one, on a cue 0323 has already shortened once for fatigue.

## The maracas, and what a subtle layer costs

`src/content/approach.ts` is level one's first own material: **an `ownA` opened at `boss` and
`bossPeak` and nowhere else.** Two voices — a maraca on the two sixteenths after each beat, four bars
of rising weights, and a **rattle** that runs and grows in the fourth bar only.

⚠️ **AN OWN SLOT AND NOT A RE-VOICED `perc`, BECAUSE THE ASK NAMES THE FIGHT.** `perc` is open from
`run`, so a rattle written into it would play through the whole level. An own slot ([0188](0188-a-place-owns-four-slots.md))
is the one thing in the game that can be opened at a fight rung alone.

⚠️ **`pulse` AND NOT `air`, AND THE ROLE IS WHERE *subtle* IS SAID.** `ROLE_MARGIN_DB` reads `pulse`
as *a pulse you can pick out when you attend to it* and `air` as *you never notice*; the second would
be authorising the layer to be inaudible. Naming the role is also what puts the layer inside 0164 at
all — a slot opened with no role is one whose audibility nothing checks.

⚠️ **AND IT IS DARKER THAN A MARACA WOULD LIKE TO BE, BECAUSE THE AIR IS TAKEN.** Level one's `ride`
sits **+9.9 dB over the bed** in 5–12 kHz and its `crash` +8.6; a shaker left white was a third thing
in the one crowded band, and driven at that voicing it took `frenzy` and `wraith` under their roles.
The grain runs 5 kHz → 2.1 with its top off at 4.2 kHz, which is where a rattle actually lives.

⚠️ **IT STILL COST `wraith` 0.6 dB AT `bossPeak`, AND THE LAYER IT TOOK THAT FROM IS WHERE IT WAS PUT
BACK.** Driven by `scripts/weigh-adrift.mjs`, the rattle's best band is the `hi` — `wraith`'s window —
and it took that layer from 5.0 dB under its `counter` role to 5.5, past `ROLE_FLOOR_DB`. The ladder
lifts `wraith` 0.92 → 1.04 at that rung, and 0164 is green **without `bossPeak/wraith` being added to
the list of things allowed to be adrift.** Adding a line to that list is the version of this change
that would have been invisible.

⚠️ **THE HOLD MOVED BY 0.07 dB, WHICH IS WHAT *subtle* MEASURES AS.** `node scripts/solve-hold.mjs`
re-solved level one: `boss` came back the same number to four places and `bossPeak` went 0.6191 →
**0.6138**. A layer the loudness solver can barely see.

## The two guards this moved, and both were about level one being the reference

- **0172 — *six of the seven state a `run` of their own*.** It read `THEMES.approach.ladder` is
  undefined. Level one states a ladder now, at its fight rungs. **That guard is about an OPENING** —
  0172 is *a place opens with its own four*, measured at `run` — so it reads `ladder?.run` and the
  claim is unchanged. The narrower version is also the one that cannot rot.
- **0133 — *a place that states nothing hands the base set straight back*, deleted.** Its own comment
  predicted this: *"`approach` is the last one and it is unlikely to move… but the day it does state
  material, this skips loudly rather than asserting nothing."* It did not skip, it went red. No place
  states nothing any more, so the claim has no content to be true of; THE COST MODEL above it holds
  the sharing mechanism, is probed, and is now exercised by level one too — twenty-two of its
  twenty-three layers are shared and one is its own.

## No hard guard, and the admission test is why

[0192](0192-a-guard-holds-an-invariant.md): *name a change to the content that would redden this and
be CORRECT.* **A boss whose attacks are a machine — a shutter, a rail, a click — is right to have no
pitch in it at all**, so *every attack states a note* is a taste and belongs in the register. It is
`0325-note` in `tests/authored.ts`, printed every run, measured by the same `keyFit` the instrument
prints, at a hand's threshold of 6 dB — which sits in a gap that is not a hand's: **0.0 to +0.8 for a
cue with no note, +17 to +50 for a layer that holds one.**

⚠️ **IT IS UNMET AS IT LANDS, AND THAT IS THE POINT OF A REGISTER.** `bossShot` — the crash thirteen
bosses share — still states nothing, and the register names it on every run rather than leaving it for
a fourth report.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0325`:

| broken on purpose | went red |
|---|---|
| level one stating a `run` of its own, so there is nothing to read the other six against | `and six of the seven state a `run` of their own` |
| the maracas emptied while the fight still opens the slot | `THE ONE THAT CANNOT BE RECOVERED FROM: a slot a place OPENS has voices and a role at that rung` |
| the maracas opened with no role, so nothing asks whether *subtle* came out as *not there* | the same guard, its other half |
| the wraith lift taken back off, so the maracas mask the layer they were mixed around | `0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT` |
| the acid's root note ringing past the end of the cue | `starts and ends at zero, because a buffer that stops mid-waveform clicks` |

⚠️ **THE FOURTH IS THE ONE WORTH READING TWICE.** It is the guard that would have caught this decision
being careless, and it is red because the lift is in the ladder rather than in a list of exceptions.

## What is owed

- **A HAND, and it is the only thing that can answer the report.** `npm run dash` has every cue on a
  button and every music layer on one beside it ([0126](0126-the-dashboard-is-the-instrument.md)); the
  maracas are `ownA` at the two fight rungs. `node scripts/hear.mjs --play` writes the pair. Every
  number above is a quantity and *fits* is not one.
- **The other eleven cues.** The instrument now measures all fourteen and the table above says every
  one of them has no note. The gun and the kill are deliberately not touched here: they fire ten times
  a second and a pitched gun is a melody nobody asked for — but `bossShot` is a boss attack by any
  reading and is the obvious next one.
- **The band half of *their own little area of sound***, if that is what it meant. `apart` did not
  move and this decision says so above.
