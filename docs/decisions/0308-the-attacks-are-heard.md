# 0308 — The attacks are heard

**The serpent's acid sizzles, its void wumms and its lightning crackles, and all three are as loud as
the things that explode.** A cue is chosen by the attack that throws it rather than at the fire gate
above it; the row names it and shared code holds the fallback.

## What was asked

> *"for the serpent boss we need a few more changes*
>
> *1. sounds for all the attacks need to be massively buffed"*

Four more items came with it and are their own decisions. And then, on hearing the first draft:

> *"the sounds are pretty terrible still, give me acid sizzle, void null wumm wumms, lighting
> crackles etc"*

⚠️ **THAT SECOND REPORT IS THE FIRST ONE AGAIN, ONE LAYER DOWN, AND IT IS THE MOST USEFUL THING IN
THIS DECISION.** The first draft built three cues to 0089's recipe — a crack, a filtered body, a
debris tail, a boom — which is what *everything that explodes* is made of. It separated them by
filter and by length, and every measurement said it had worked: three distinct spectra, four to six
decibels louder, in the blast's family. **They still sounded like one machine**, because the recipe
*is* the machine. A table that is right about every quantity it measures can be wrong about the only
thing that matters, and the channel with nothing to look at is where that happens —
[0027](0027-measure-the-picture-not-the-model.md).

## Two faults under one sentence

**The first is that there was one sound.** `bossShot` — 0114's *"loud crashing sound"* — was what the
acid, the void and the lightning all made, because `src/app/boss.ts` emitted it **at the fire gate,
one line above the call that chooses which head throws**. For a phase whose attack is `heads` (0254)
that is not a tuning problem: the only cue the gate could name was the one every attack in the game
shared. It is
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s own tell — *a mechanism
whose output is identical for every kind* — and
[0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md) asks this channel to
separate three attacks the player has to read one at a time.

**The second is that it was the quiet one.** Measured, post-gain and post-`MASTER_GAIN`:

| cue | length | loud | A-weighted sub share |
|---|---|---|---|
| `bossShot` | 0.38 s | **−33.6 dBFS** | 0.011 |
| `blast` | 0.95 s | −26.6 dBFS | 0.053 |
| `death` | 1.30 s | −25.7 dBFS | 0.034 |
| `bossDown` | 1.75 s | −24.8 dBFS | 0.064 |

The loudest thing in the game was **seven decibels** under the quietest thing in it that goes bang,
and a fifth of its length. So *massively buffed* is not the fader: it is length, a bottom end, and
saturation.

## What it is now

| cue | what it is | length | loud | where its weight is |
|---|---|---|---|---|
| `bossAcid` | a spit, then two grain rates frying over a coarse boil, and one short gulp | 0.90 s | **−26.1 dBFS** | `hi` 1.00, `sub` 0.001 |
| `bossVoid` | three bass pulses a quarter-second apart, falling away, in a wash with no top | 0.92 s | **−32.3 dBFS** | `sub` 0.188, `air` 0.002 |
| `bossBolt` | a flash, then a grain coarsening from 5 kHz to 90 Hz, over a short clap | 0.64 s | **−28.9 dBFS** | `himid` 1.00, `hi` 0.85 |

Against `bossShot`'s **−33.6 dBFS** and its `sub` of 0.011. `scripts/weigh-cue.mjs --loud` is where
every number here comes from, and the last column is the point: no two of the three have their weight
in the same place, and none of them has it where the crash had it.

### The knob that made it possible had been in the file since 0089

⚠️ **A `noise` layer with a non-zero `from` is SAMPLE-AND-HOLD** — one fresh draw per cycle of that
rate, held flat between — and the whole table was using `from: 0`, which is white. White noise through
a falling lowpass is a boom or a hiss and **cannot be anything else**; the recipe was built on it and
so every cue built to the recipe was one of those two things.

A grain rate is what the player's three words are made of. A few kilohertz is a fine grain — frying.
A few hundred hertz is a coarse one — bubbles, ticks. And a rate that FALLS as the layer decays is a
sizzle dying down or a discharge stuttering out. `bossAcid` has three grain rates over each other;
`bossBolt` is one rate coarsening from 5 kHz to 90 Hz in half a second, which is the difference
between a crackle and the roll of thunder the first draft had.

`bossVoid` needs no grain at all: *null wumm wumms* is three sub pulses and the absence of everything
else, and what makes it a figure rather than an event is that there are **three** of them, each lower
and quieter than the last.

**The gain did none of it.** All three sit at `0.46` — under `bossDown`'s `0.468`, so the boss dying
stays the loudest single row — and the peak moved from −15.1 to −14.5 dBFS. **The ceiling is the
headroom**: `tests/sound.test.ts` holds that the four loudest rows pass the limiter untouched, which
caps their sum at 2.0 against 1.848 now.

⚠️ **AND THE WUMMS WERE AT 32 Hz FIRST, WHICH MEASURED −38.4.** A-weighting discounts the floor by
thirty decibels, correctly, for *how loud does this sound* — so a cue living entirely down there is a
cue half the machines play as silence, which is
[0140](0140-no-layer-is-inaudible.md)'s subject one bus over. Two changes, both keeping the character:
the drive went to 0.5, because a saturated 65 Hz sine puts harmonics at 130, 195 and 260 where an ear
and a laptop can both find them; and the figure moved up an octave, from 65→33 Hz to 110→55, so it is
bass rather than sub and only the third wumm reaches the floor. −38.4 → **−32.3**.

**`bossShot` is untouched and still serves thirteen bosses.** The ask is about this animal. A re-voice
of the shared crash would be a mix change to six fights nobody has played since the change that would
have caused it — 0282's *default* shape: shared code holds the fallback, and a row that has something
to say says it.

## Where the choice lives

`cue` is optional on `Head` and on `BossPhase`, and the fallback is in `src/app/boss.ts`. That is
0282's sentence applied literally: *"no row can forget it" is an argument for a DEFAULT, never for a
CONSTANT — the row still says what its version is, and shared code holds the fallback.*

**On the attack and not on the shot row, and the lightning is what proves it cannot be the shot.** The
serpent's `rain` head throws `void` — the bolt takes its damage from that row — so a cue keyed to the
bullet would make thunder sound like a void blast.

The cue is emitted **inside `throwAttack`**, before the switch, and the `heads` arm does not sound:
its recursion does. So a volley still makes exactly one noise, which is the property the gate was
protecting (0114: *"a rake puts nine shots out in one step; nine cues would be one smeared noise"*)
and which is no longer true by construction — so `tests/serpent.test.ts` measures it, driven, in all
three phases, and the sweep's twenty-one globes are measured silent too.

## Three guards moved, and each was right before it moved

**The duck rule held *long* and *rare* as one thing.** `tests/sound.test.ts` derives *a cue ducks
exactly when it outlasts a beat*, over a table where every cue over a beat was an OUTCOME: a death, a
blast, a boss coming apart. These three are 0.8 to 1.2 seconds and the serpent's last phase fires
**every 36 steps, which is 0.6 s**, against a duck that takes 0.445 s to recover — so a duck there is
not an event marker, it is the bed turned down for the rest of the fight. **The paragraph directly
above that assertion already said so about the gun**: *"a pulse that ducked would hold the bed down
for the whole game."*

So the rule gains the axis it lacked, **derived from the twin rather than from a list of names**: a
cue whose picture is a thing *appearing* is a thing being fired, and a thing being fired recurs. Over
the table as it already stood this partitions it **exactly** — all four rows that duck have a twin
that resolves (`phase-burst`, `boss-burst`, `blast-ring`, `ship-burst`), and every `-appears` row has
none. It widens the rule without moving one existing answer, which is what makes it the rule the old
one was standing in for rather than an exception carved for this change.

**And 0089's explosion recipe was widened onto these three and then taken back off.** That widening
was correct about the first draft and is what the second report condemned: a sizzle **is** a hiss —
the thing the recipe's clauses exist to forbid — and a wumm has no crack, no grain and no debris in it
at all. The list of kinds inside a guard is the cheapest possible version of *changing the work to
suit the guard* ([0192](0192-a-guard-holds-an-invariant.md)), because adding a row to it looks like
coverage rather than like a design decision. The four cues 0089's own report named are what it is a
rule about.

⚠️ **So nothing hard holds what these three sound like, and that is correct.** *A sizzle* is a taste,
and [0295](0295-a-ranking-guard-is-a-content-limiter.md) is explicit that a guard answering a question
of character in advance is the defect. What is held is what a cue must not do to the mix: end louder
than it started, click at either end, duck the bed, or be a pitch outside the key.

**The dead-weight scan read three files and a cue may now be named by a row**, so all three new cues
reported as unplayed. `src/content/bosses.ts` is added, and the reason is different from the last
widening: that one was *a readability split is not a permission boundary*, this one is a new
capability.

**And the *says where it happened* scan could not see a cue chosen by a row.** Its pattern matched a
literal name or `cueOfFlight(…)`; `onCue(cue ?? 'bossShot', boss.across)` matched neither, so the site
was not an offender and **was not checked either** — the silent half of the failure that guard exists
for. It finds the matching close paren now and asks whether there is a comma outside any nesting,
which is the question it was always asking.

## What the instrument cost, and what it caught

`scripts/weigh-cue.mjs` grew `--loud`, and `tests/spectrum.ts` grew `loudest`.

⚠️ **The first version of that measure was an A-weighted mean over the cue's whole length, and it was
wrong in the one direction that mattered.** A mean DIVIDES by the tail, so lengthening a cue made the
number go *down*: it reported the first draft of `bossAcid` at −34.6 and `bossVoid` at −37.1 against
`bossShot`'s −33.4 — *these are quieter* about two sounds two to three times as long with a boom under
them the crash never had. [0027](0027-measure-the-picture-not-the-model.md) is the rule, and this is
its other half: an instrument owed before the tuning pass can still be measuring the wrong quantity,
and the way it showed was that it disagreed with the ear about the direction of a change, not about
its size. It is the loudest 400 ms now — what a short-term meter reads, and what *how big is this*
means.

⚠️ **And it caught the thing that made `bossVoid` not decay.** `tests/sound.test.ts` holds that every
cue is quieter in its last quarter than its first, and the void failed at **0.90** of its own opening.
Two of the three things that make this cue big work against its envelope: a sine at 16 Hz keeps its
amplitude for its whole length however low it sounds, and `glue` at 0.34 is an *upward* compressor
(`saturate` is normalised at unity, so its slope at zero is three) which lifts the tail toward the
peak. Steeper curves, and a 0.14 s inhale rather than 0.20 — because a swell long enough to shift the
first quarter is a cue with no attack in its first third. 0.28 now.

⚠️ **And `glue` has a turning point, which was found rather than assumed.** Driven: `bossVoid` reads
−29.6 at 0.34 and −29.8 at 0.40. Past there the squash costs more output than the density buys.

## The claim, and why it is not a guard

`0308-loud` in `tests/authored.ts`: *a boss's attack is as loud as the things that explode*, measured
against `blast` — the quietest of the four — at **6 dB**, and it was 3 until the wumms existed. The
threshold moved because of the METER and not the mix: a cue made of bottom reads quiet on an
A-weighted scale by construction, and a threshold tight enough to fail *null wumm wumms* is a threshold
asking for a brighter wumm.

⚠️ **A taste and not a guard, on [0295](0295-a-ranking-guard-is-a-content-limiter.md)'s terms.** A
floor under how loud a boss's attack may be is a limiter on what a boss may be: a stealthy one whose
attack is a hiss is a fight somebody is entitled to write, and a hard guard here would refuse it
before it was proposed. What it buys as a claim is that the next boss's attacks are measured against a
reference rather than against nothing.

## What is owed

- **A hand.** Nothing in a test suite can hear —
  [0027](0027-measure-the-picture-not-the-model.md). `node scripts/hear.mjs --only=bossShot,bossAcid,bossVoid,bossBolt`
  writes what the game plays, and `npm run dash` has all three on buttons
  ([0126](0126-the-dashboard-is-the-instrument.md)).
- **The hydra's five heads still make one noise.** Acid, flame, laser, frost and void, all `bossShot`,
  because 0282 is explicit that *a change is finished when the thing it added can differ per instance*
  and *a feature may land on one boss and not the others*. The mechanism is there; the five cues are
  content nobody has asked for yet.
- **The place may re-voice all three** (they are in `PLACE_CUES`) and no place does. The Approach
  states no cues at all.
