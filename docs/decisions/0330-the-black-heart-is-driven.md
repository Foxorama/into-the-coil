# 0330 — The Black Heart is driven, and one fader in it was saturating the bus

**Accepted 2026-09-16.** Three *copy this moment* pastes of level `eye`, driven on the dashboard and
handed over as the change:

> *"I want the run going for this… Then I want the push going into this… I want the surge heading into
> this… then heading into the approach as is. It'll probably need a bit of tweaking to get the
> opening, closing and loudness correct, but I want a sense of discordance between the four arcs to
> have attributes of all previous levels, but be copies of none."*

The plan this implements is
[`the-black-heart-driven`](../../reports/the-black-heart-driven-2026-09-16.md), which holds the
transcription, the measurements and the arcs read against the other six places.

## The rules

**The Black Heart's `run`, `push` and `surge` are the desk's, transcribed.**
`THEMES.core.ladder` in `src/content/themes.ts`; `approach`, `boss` and `bossPeak` are untouched.

**Its contour is `push −1.9, surge −0.8, approach −3.6, boss −3.6, bossPeak −3.6`** —
[0329](0329-a-level-may-fall.md)'s first, and `LEVEL_HOLD.core` is re-solved to it.

**One number in it is not the hand's: `beat` at `run` is 1.28 and was driven at 3.19.** At the driven
value that rung alone saturates the music bus.

**`LEADS.core` follows what the drive made the subject** — `run` the title's kit, `push` the tune —
and `surge`, `approach` and `boss` are unchanged.

## ⚠️ The one thing the desk cannot show you is the bus

The dashboard reads every layer's live gain off its own `GainNode` — [0126](0126-the-dashboard-is-the-instrument.md) — which is
the truth about that layer and says nothing about what the sum does to the shaper. Measured at `run`,
through the chain `tests/clean.ts` describes:

| the `run` | peak into the shaper | dB dirty (ceiling −16) |
|---|---|---|
| as driven, `beat` 3.19 | **1.482** | **−12.4** |
| with no kit in it at all | 0.518 | −27.3 |
| shipped here, `beat` 1.28 | 0.790 | **−20.5** |

**The entire saturation is one layer.** `push`, `surge`, `approach` and both fight rungs measure −30 dB
or cleaner and peak under 0.46; nothing else in the level is near the bus.

⚠️ **AND A BUS SHAPER DISTORTS EVERYTHING ON THE BUS**, which is why this is a fault and not a colour.
A kit driven this hot is not a distorted kit — it is the guitars, the drone and the tune being
saturated by a kick drum, which is the report
[0217](0217-the-bus-is-a-colour-and-it-was-too-thick.md) exists for: *"it just doesn't sound crystal
clear and clean."* The guitars already carry their own per-voice drive and always have.

⚠️ **1.28 IS WHERE THE GAME'S OWN SPREAD PUTS IT.** The dirtiest thing that ships is Saurian Belt's
`surge` at −20.3; this lands at −20.5, so the last level is as clean as the worst thing already in the
game and no dirtier. **1.59 is the value that keeps more of the drive** — it clears the guard by
2.6 dB at −18.6 and makes this the dirtiest rung in the game by 1.7. That is an ear's call, both
numbers are in the row, and it is one edit and a re-solve.

⚠️ **AND THE KIT IS STILL THE SUBJECT, WHICH IS THE CHECK THAT THIS IS NOT A RETREAT.** Measured
against `ROLE_MARGIN_DB`, `beat` at 1.28 sits at **+3.2 where a `part` wants +3** — it clears the
loudest role in the arrangement by two tenths of a decibel. At 3.19 it was at +11.1, which is not a
part, it is a layer flattening a mix. The value chosen for the bus is the value at which the kit leads
the rung.

## ⚠️ A `trim` was built for exactly this and measured wrong

[0191](0191-a-place-sits-somewhere.md) added the whole-place lever for Saurian Belt's clipping, and it
was the first thing tried here: it needs **3.1 dB off the entire place** to fix the one rung that is
dirty in it. Five clean rungs pay for one hot layer, and the `approach` and the fight — the half of
the level the ask says not to touch — end up 1.2 LU below where they have ever been.
[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md): *a quantity that rejects an option is
checked in the case it is applied to*, and checked here it rejects itself.

## ⚠️ What the contour is, and why it is smaller than the drive's own

Measured as the desk played it, the drive's shape was `push −3.4, surge −2.3, approach −5.1` against a
`run` of −13.13 LUFS. The opening then lost 1.5 LU to the fader above, and **nothing else in the level
moved** — so what ships is every other rung at the loudness it was heard at, and a drop that is
1.5 LU shallower because the top of it came down:

| rung | shipped before | as the desk played it | here |
|---|---|---|---|
| `run` | −18.29 | −13.13 | **−14.62** |
| `push` | −18.28 | −16.57 | **−16.52** |
| `surge` | −18.29 | −15.47 | **−15.42** |
| `approach` | −18.27 | −18.27 | **−18.23** |
| `boss` | −18.28 | −18.28 | **−18.22** |

⚠️ **THE BOTTOM THREE ROWS ARE WHY IT IS THE ABSOLUTE LEVELS THAT ARE PRESERVED AND NOT THE SHAPE.**
*"Then heading into the approach as is"* is satisfied literally: the `approach` and both fight rungs
land within 0.06 LU of where they already ship, and `LEVEL_HOLD.core` comes back at
`0.4728, 0.4212, 0.4491, 0.4266, 0.4141` against a shipped `0.4688, 0.4176, 0.4472, 0.423, 0.4105`.
**The whole change is at the front of the level.** Holding the drive's shape instead would have dragged
the untouched end of the level below anything it has ever been, to preserve a drop whose top had moved.

## ⚠️ `bass` and `beat` open in a level, and that is the ask rather than an oversight

[0095](0095-the-level-has-its-own-music.md) made them `TITLE_ONLY` because *"an A-rooted riff is a
wrong note over three chords in four"*, and over The Black Heart's sixteen bars it is exactly that —
the title's A is the ninth of G and the fourth of E minor. **It is what was driven, and dissonance is
what was asked for.** Saurian Belt has opened both since [0189](0189-a-place-is-what-it-does-not-play.md)
and the guards that hold the closure read the SHARED ladder, so a place opening them has always been a
sentence a place may say.

⚠️ **AND THE OPENING NOW HAS TWO KICK DRUMS** — the title's syncopated eighths under `sub`'s double
kick. That is the one thing in here no measurement settles, and it is the first item for an ear.

## ⚠️ `LEADS` is re-read, because a drive that edits a ladder and not a lead is half a drive

[0189](0189-a-place-is-what-it-does-not-play.md)'s rule is that a place is what it OPENS, and `LEADS`'
own header records the same failure twice — *"a lead the ladder never opens is a place following
silence"*. This is that one notch quieter: a lead the ladder has **buried**.

| rung | was | now | why |
|---|---|---|---|
| `run` | `engine` | **`beat`** | the kit is 8 dB over `engine` and 20 over `groove`; `engine` was a `part` sitting 12.0 dB under one and is a `pulse` at 2.9 clear of one |
| `push` | *(the arrangement's `hook`)* | **`call`** | the desk took `hook` to 0.17 of a rung where `call` is 0.68; no other place follows `call` at `push`, and four of the six follow `arp` |
| `surge` | `lead` | **`lead`** | `hook` is 3.4 dB up in gain and by MARGIN `hook` −2.7, `counter` −2.8 and `lead` −3.0 are the same three tenths — a tie is not a displacement |

## ⚠️ Nineteen entries on the known-adrift list, and eleven of them are faders a hand pulled

`STILL_ADRIFT.core` in `tests/themes.test.ts` goes from eight to nineteen, on
[0191](0191-a-place-sits-somewhere.md)'s terms: the drive is **subtractive** — `perc` to 0.10 and
0.15, `beat` to 0.06, `drive` to 0.06, `hook` to 0.28, `bass` faded across the level — and a layer
under its role is the definition of a whispered layer.

⚠️ **TWO ARE CONSEQUENCES RATHER THAN INTENTIONS AND THE LIST SAYS SO.** `run/groove` is the palm
mute — one of the three techniques `src/content/core.ts` names the genre by — 14 dB under `sub`
because the opening is two kick drums; and `surge/lead` is the `part` 3.0 dB under a part's margin in
the tie above. **Those are the two lines to delete first** if the chug or the twin lead is ever
reported. [0164](0164-a-role-is-a-promise-the-mix-has-to-keep.md)'s guard holds the list in both
directions, so neither can rot.

## ⚠️ And one guard is deleted, because it was the duck floor wearing a research object's name

`0167 — AND THE RE-BASED MIX IS ADDITIVE TOO` in `tests/themes.test.ts` is gone.
[0192](0192-a-guard-holds-an-invariant.md) already demoted [0167](0167-a-build-does-not-duck.md)'s
floor to the taste `0167-duck` on the admission test — *name a change to the content that would redden
this and be correct* — because a breakdown before a drop is *"the genre move Saurian Belt has now
asked for twice"*. **This one survived only because its subject read as the desk's third mix**, an
object a player could audition and not ship.
[0176](0176-the-re-based-mix-is-the-mix.md) folded that object into the shipped one a month ago, so it
has been walking the same boundaries over the same carried layers against the same `DUCK_FLOOR_DB`
ever since. Measured on this drive, the guard and the taste name **the same ten layers**.

⚠️ **DELETED RATHER THAN DEMOTED**, because the claim is already registered once; a second id would
print the same measurement twice, which is [0029](0029-the-tracked-record-is-the-record.md)'s *a
summary is a second copy* arriving in a suite. The ten it names are the drive: a fader pulled at a
boundary is a rebalance, and 0226 already paces a carried layer's fall across the arrivals.

## ⚠️ And a second guard was measuring drift, which is the transferable finding here

`0166 — THE TRAJECTORY MOVES A BOUNDARY LESS THAN THE PER-RUNG SOLVE DOES` went red on this place at
**101.6 dB against 59.8**. Neither number was a boundary.

⚠️ **`solveLevel` NEVER ADJUSTS A LAYER `roleOf` ANSWERS `null` FOR** — *"if (role === null)
continue"* — **but `renormalise` scales every gain on every one of its four hundred steps.** So a
roleless layer is carried wherever the rest of the solve goes, and where it lands is arithmetic
nobody chose. On this place `drive` and `stomp` both land on **4.46e-6** at `push`, which the guard
read as a 101.6 dB move.

⚠️ **AND IT HAS BEEN DOING IT TO SAURIAN BELT ALL ALONG, GREEN.** That place reported **158.8 dB
against 134.5** — one drift beating another, which satisfies *the trajectory moves a boundary less*
while measuring nothing about a boundary. [0027](0027-measure-the-picture-not-the-model.md)'s *a
guard that fires on the wrong quantity*, sitting green instead of red, for as long as Saurian Belt
has opened `arp` where the shared arrangement names no role for it.

⚠️ **THE FIX IS THE PREDICATE THE SOLVER ALREADY USES**, so it costs no number anybody has to defend:
`worstInLevel` skips a layer with no role at either end of the boundary. Every place then reports 5 to
18 dB — the range this guard's own header is written about — and **the claim turns out to be false in
two of the seven**, including The Labyrinth, which this change never touches. `NOT_STEADIER` names
both with their numbers, held in both directions on `STILL_ADRIFT`'s terms. The header already
explains them: *"the layers left free are the ones changing role, and a 5 dB change of target is an
18 dB change of gain."*

## ⚠️ What this widens and does not close: eleven layer-rungs with no role at all

The hole above is not only the guard's. **`ARRANGEMENT` is global, and a place that opens a layer at a
rung the shared table gives it no role for sounds something nothing checks** — outside
[0164](0164-a-role-is-a-promise-the-mix-has-to-keep.md) entirely.
[0172](0172-a-place-opens-with-its-own-four.md) left that hole in seven layer-rungs, `OWN_ROLES`'
header names it in as many words, and `docs/state-of-play.md` has been flagging it since.

**This drive widens it by eleven**: `drive` and `stomp` at `run` and `push`, and `arp`, `call`,
`toll`, `dread`, `stomp`, `frenzy` and `wraith` at `surge`. `weigh-adrift` reports *"11 of 11 with a
role"* at `surge` — the eleven it can see — and is silent about the seven it cannot.

⚠️ **THEY ARE NOT GIVEN ROLES HERE, AND THAT IS A CHOICE RATHER THAN AN OVERSIGHT.** A role is a claim
about what a listener should be able to do with a layer — *follow this, hear this under it, feel this,
do not notice this* — and inventing eleven of them would be authoring content nobody asked for, in a
place whose balance was just set by an ear. **What covers them today is that a hand heard every one of
them and set its gain**, which is the authority [0027](0027-measure-the-picture-not-the-model.md)
gives this channel. What is owed is `OWN_ROLES.core`, alongside the seven 0172 already left, and it is
owed as its own change with its own ear.

## ⚠️ The arcs, against the other six — *attributes of all, copies of none*

- **`run`** — the title's kit over the Heart's chug. Saurian Belt is the only place that opens `bass`
  and `beat`, and it holds both to the end; here they are gone by `surge`. Hats closed at the opening
  is Ember Nebula's `run`. The blast beat from bar one is nobody's: it is this place's own fight
  leaking backwards.
- **`push`** — the tune leads and the riff whispers. Saurian Belt's whispered `push` hook, with The
  Approach's opening role moved two sections late.
- **`surge`** — twenty-one layers open, `drone` closed, `arp` and `call` still running where the shared
  `RUNG_CLOSES` shuts them, `toll` and `dread` two rungs early ([0185](0185-the-belt-gets-its-bottom.md)'s
  primeval half), the fight's own three inside the level. No rung in this game has ever had that many
  open, and the loudest thing in the room is a kick.
- **`approach`** — untouched, and a drop now. It was the horizon; after the surge above it, it is the
  room emptying.

## What is owed

**An ear, on the branch preview, with the dashboard open on `eye`.** The two kicks at `run`; `beat` at
1.28 or 1.59; whether `beat` 0.06 at `push` and `drive` 0.06 at `surge` are ghosts or zeros; and
whether the boss still arrives after a `surge` that already has its blast beat. Every one of those is
one number in `THEMES.core` and a re-solve.
