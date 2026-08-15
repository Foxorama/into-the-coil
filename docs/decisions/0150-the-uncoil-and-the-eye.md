# 0150 — the uncoil, and the eye

**A phase can empty everything the boss has in one unavoidable curtain, and a phase can stop shooting
and open.** Two new arms of a new closed union on `BossPhase`.

⚠️ **The uncoil is the first thing in this game [0050](0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md)'s
shield is FOR** — it cannot be dodged, so a shield is the only thing that pays for it.
[0053](0053-the-bomb-is-the-first-thing-the-player-spends.md)'s bomb gets **less than that and it is
worth saying so**: it lands for `damageScale` in the window like everything else, which is a reason to
be holding one at the end of a fight and is not a moment the bomb is *for*. **A bomb still cannot
clear the curtain** — `blastInto` is not paired against `enemyShots` and this decision does not change
that, because an uncoil that a bomb answers is an uncoil that is dodgeable with an inventory.

## What was reported

> *"The bosses need to be more interactive with more varied attacks, a baseline is the jormungdar boss
> battle from Golf-Stars. We currently have one unique boss in into-the-coil which is level 3, all the
> other boss attacks are almost exactly identical."*

[`the-boss-vocabulary-is-one-fan`](../../reports/the-boss-vocabulary-is-one-fan-2026-08-14.md) is the
survey behind it, and it is item **1** of `docs/state-of-play.md`'s queue — the ordering is that
report's own.

⚠️ **THE REPORT'S CENTRAL FINDING IS THAT THE WORD IS *INTERACTIVE*, AND THAT IT IS ABOUT THE FINISHER
RATHER THAN ABOUT THE ATTACKS.** Four of the five `BOSS_ATTACK_KINDS` are one mechanism — a fan of *n*
bullets across a spread — and adding a fifth aiming would not change what a fight IS. What makes the
predecessor's fight interactive is that the player's own choices change it: shields are hoarded for a
barrage designed to be unsurvivable without them, and the fight ends on a window rather than on a
health bar reaching zero.

## What is built

| stance | what it does |
|---|---|
| `volley` | the phase's fan, at the row's aim. What every phase in the game did |
| `overwhelm` | the phase's fan — **and one curtain right across the lane on the step the phase opens** |
| `bare` | it **stops shooting and opens**: no fan at all, and `damageScale`× on every hit that lands |

Authored on **the chorus (level six) and the axis (level seven)**, and on nothing else. Six phases
each: four fights, an uncoil, and a window.

## ⚠️ Three things the report asked for that this does differently, each for a measured reason

### 1. `overwhelm` is a PHASE stance and not an arm of `BossAttack`

The report proposes it alongside `sweep`, `lance` and `mine` as four arms of the attack union. Three of
those four are **ideas** — a boss can be built around a walking curtain, a telegraphed lance, a
detonating mine, and [0111](0111-a-boss-has-one-idea.md) says a boss has exactly one. **`overwhelm` is
not an idea.** A boss whose every volley was unavoidable would not be a fight; a barrage sized against
the shield pool is a *moment* in one. `BossAttack` says what a boss IS and `BossStance` says what a
phase DOES, which is the axis the report's own finisher — *"a phase that says stop shooting and
open"* — was already asking for.

**Items 2 and 3 of the queue are unaffected.** `lance`, `sweep` and `mine` are ideas and belong where
the report puts them.

### 2. The curtain is thrown ONCE, as the phase opens — not on a cadence

⚠️ **This is the whole of what made it affordable, and the arithmetic is not close.** A phase is keyed
to remaining health ([0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md)), so how long a
player stands inside one is a function of their loadout — measured, the same band is **4.8 seconds at
the design loadout and 25 at the base weapon**. An unavoidable attack on `fireEvery` therefore bills a
well-armed player one shield and a base-weapon player a dozen, and **no gap between volleys is right
for both**. `MAX_SHIELDS` is three.

Thrown once, on the step the phase turns over, it costs **exactly one hit to anybody** — which is what
*"your shields must absorb N strikes"* can mean when the pool is three. `tests/level.test.ts` drives a
fight and measures that hit rather than asserting it.

⚠️ **It makes no sound of its own.** It lands on the step the phase changes and `src/app/frame.ts`
already cues `bossPhase` there; two cues on one step against
[0104](0104-the-gun-plays-a-figure.md)'s four-voice ceiling would let the cap choose which of them the
player heard. **The phase cue IS this attack's announcement** and the burst beside it is its picture —
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md).

### 3. The window is measured in the units the player experiences, and the guard that already existed got it wrong

⚠️ **[0124](0124-the-boss-is-a-boss.md)'s *"every phase lasts long enough to be seen as one"* reads a
band of health against a rate of damage, and it was green on a window a third of the length it
reported.** A bared boss takes `damageScale` times as much off per pulse, so the band 0124 calls 5.3
seconds is **1.8** in the player's hands. That is
[0027](0027-measure-the-picture-not-the-model.md)'s exact subject — a guard firing on the wrong
quantity — and [0019](0019-a-probe-must-be-seen-to-apply.md) could not have caught it, because the
guard and the break would have shared a vocabulary.

So 0124's guard now skips a bare phase and says why, and 0150's own guard measures the window as
`band / damageScale` **against `BOSS_DEATH_STEPS`** rather than against a number of its own: a window
shorter than the explosion it runs into is one the player only meets inside it.

## ⚠️ The curtain is sized against the SMALLEST hurtbox, not the standard one

A ship sitting exactly between two neighbours is `spacing / 2` from each, so the curtain is impassable
iff `spacing < 2 × (shipRadius + shotRadius)`.
[0024](0024-the-accessibility-floor-is-settings.md) permits `forgiving` to shrink the player's circle
to 0.7 and nothing here would break that rule — but a player who turned it on would sail through **the
one attack in the game that exists to teach them what a shield is for**, and never find out. Sizing
against the smallest circle costs half a unit of spacing and nothing else.

⚠️ **`gap` is a CEILING on the spacing rather than the spacing.** The curtain spans the whole lane and
100 does not divide by every number a hand might pick, so `curtainSpacing` rounds the count up and
divides the lane by it — which puts a shot on each edge and leaves every hole the same width. Stepping
outward by `gap` until the lane runs out leaves a wider one at whichever end the arithmetic stopped on,
**and a curtain with one wide hole in it is a fan.**

## ⚠️ WHAT THE PROBE FOUND, AND IT CHANGED THE DESIGN

The bare rows were first authored with `fireEvery: 0, shots: 0, spread: 0`, on the argument that zeros
are a true statement about a phase that throws nothing. **The probe that removes the early return in
`stepBoss` left the suite green** — the boss was silent because the row said zero, not because the
stance said stop.

Two descriptions of one fact, and the guard could not tell them apart. The zeros came out: **a bare row
now carries the fan and the cadence it would have thrown, and the stance is the only thing that
silences it.** That is the more dangerous half to lean on — a hand authoring a new window by copying a
volley row is exactly how a boss ends up firing through its own vulnerability.

⚠️ **AND IT PAID A SECOND TIME, ON A GUARD NOBODY HAD LOOKED AT.** A zeroed row needed carving out of
`tests/level.test.ts`'s *throws no less than the one before it* — and, found only when the full proof
ran, out of `tests/difficulty.test.ts`'s *fires STRICTLY faster on every tier*, which is a different
guard written for a different reason ([0096](0096-the-enemies-play-along.md)). Two exemptions for one
convenience is exactly the shape [0148](0148-a-place-has-its-own-notes.md) is the standing warning
about. Carrying the real numbers needs none.

[0019](0019-a-probe-must-be-seen-to-apply.md) doing the more valuable half of its job, again.

## What is guarded

Five probes, all seen red — `node scripts/prove-guard.mjs 0150`:

| broken on purpose | went red |
|---|---|
| an uncoil widened just enough for the ship to fly between its shots | an uncoil has no hole the ship can fly through, at any hurtbox |
| the window given a multiplier that shortens it below the death beat | a window lasts longer than the death it runs into |
| the uncoil stopped being thrown | the uncoil is thrown, and the ship cannot get out of the way |
| a bared boss stopped shedding anything | the picture says so for as long as the window lasts |
| the bare phase stopped returning early | a bared boss throws nothing and dies faster for it |

Two of the eight assertions are stated in the player's own units rather than the model's — the
curtain's spacing against the ship's radius, and the window's length against the death beat.

## ⚠️ What is deliberately NOT here

- **`lance`, `sweep` and `mine`** — queue items 2 and 3, and the report says why they are separate: a
  telegraph is a new drawing primitive and 0036 governs it.
- **Re-authoring the seven bosses** so no two share a mechanism — the report's item 4, and it is
  downstream of all of this.
- **The other five bosses.** Two rows is a demonstration and seven is a re-authoring; a verdict on
  *does a fight feel interactive now* is attributable from two and not from seven changed at once.
  The chorus and the axis were chosen because they are the **two longest fights in the game** (30.2s
  and 35.1s at max weapons) and a window has to fit inside one — the harrow's 17.8s cannot carry both
  an uncoil and a window without dropping two of its volley phases.
- **A new cue.** The music and sound channel is parked at the player's own instruction — *"we can go
  back to working on the music when I get back"* — and 0148 left the bake budget at its limit. The
  window's picture is debris and silence.
- **A difficulty re-size.** [0084](0084-the-dial-is-the-level-and-the-guns.md) sizes a boss against
  the volley it throws, and the report says the tiers are re-sized after the vocabulary lands, not
  during.

## ⚠️ What is unflown, and what to watch for

**None of this has been played.** [0027](0027-measure-the-picture-not-the-model.md) says a green suite
cannot answer a question about the picture, and there are three of them here:

1. **Does the curtain read as *spend a shield* or as *that was unfair*?** It is the first thing in the
   game the player cannot dodge, and a player carrying no shield loses a life to it. That is the
   design — it is what makes the shield worth carrying — but it is the half most likely to come back
   as a bug report.
2. **Does the window read as an opening, or as the boss having stopped working?** Debris and silence
   is everything this game can say about a state with no new drawing primitive, and
   [`where-the-art-ceiling-is`](../../reports/where-the-art-ceiling-is-2026-08-14.md) owns the other
   half.
3. **Is `damageScale: 3` enough to feel?** There are no damage numbers on screen. What the player has
   to notice is that the last stretch of the fight is short.

## The rollback note

**Nothing irreversible.** No storage key, no save-schema field, no service-worker cache prefix and no
origin. Reverting the commit restores the previous seven-row phase tables exactly; a save carrying a
run in progress stores the level reached and never a boss's phase
([0021](0021-one-stream-per-concern.md)), so a rollback mid-run is a fight that changes shape and not a
save that fails to load.
