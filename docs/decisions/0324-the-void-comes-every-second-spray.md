# 0324 — The void comes every second spray

**Status:** accepted
**Amends:** [0261](0261-the-serpent-throws-together.md) — the hurt phase's round is three heads now,
not two; [0322](0322-the-ball-is-worth-shooting.md) — the ball's appetite, and the head gap it put on
the acid; [0308](0308-the-attacks-are-heard.md) — one cue per ATTACK, where it held one per head
**Builds on:** [0254](0254-the-hydra-grows-heads.md) — heads take turns, and a round may have three of
them

**The serpent's hurt phase throws spray, void, spray — so the void lands on one spray in two, and the
spray that has no void behind it comes round in 1.4 s where the whole round takes 2.3.** The combined
ball's appetite goes 12 → 13.2.

## What was asked

> *"the void blasts probably need to be every second firing, not every firing like they are now, they
> make that wave take a bit too long*
>
> *and the combined poison/void bubbles need about 10% more health, they need to last just a bit
> longer."*

## A third head, and it is the spray again

[0254](0254-the-hydra-grows-heads.md)'s heads take turns: the k-th volley of the fight is the k-th
head's attack. Two heads alternate; **three heads whose first and third are the same attack put the
odd one on every second turn**, which is the ask read literally and no new mechanism.

⚠️ **WHAT THE PLAYER HEARS IS ALTERNATE ROUNDS AND NOT A CYCLE OF THREE.** `spray void spray | spray
void spray` is a spray with a void behind it, then a spray on its own, then round again. Driven at the
tuned tier, the cue stream and the seconds between soundings:

| | before | after |
|---|---|---|
| the round | spray, void, spray, void … | spray, **void**, spray, spray, **void**, spray … |
| a spray comes round every | 2.30 s | **2.30 s then 1.40 s**, alternating |
| a void comes round every | 2.30 s | **3.70 s** |

At `legendary` that is 2.60/1.50 s and a void every 4.10; at `burn`, 2.00/1.40 and every 3.40.
`scripts/probes/0324-the-void-comes-every-second-spray.mjs` breaks it three ways.

⚠️ **THE THIRD HEAD IS IDENTICAL TO THE FIRST, GAP AND ALL.** 0322 put 24 steps of quiet on the acid
head rather than the void's and said why — *"it is the pause after the spray, and the spray is the
thing whose hold was swallowing it."* A second spray that did not pause would be a different attack
wearing the same name, and the 1.40 s above is what the pause costs when there is no void to spend it
on.

⚠️ **AND *taking the void out of every second round* WAS THE OTHER READING, WHICH IS A REST AND NOT A
HEAD.** A head that throws nothing is a mechanism this game does not have, it would be the serpent's
alone — [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md) — and it answers *the
wave takes too long* by making the wave longer and emptier. What the report pairs *every second firing*
with is a wave that comes round sooner, and a round of three is the only thing in the game that says
so.

## The one guard this reddened, and it was right to

[0308](0308-the-attacks-are-heard.md) holds that *the acid, the void and the lightning are three
different sounds*, and its arithmetic was **one cue per head** — `new Set(cues).size === cues.length`.
That is true while no round throws the same attack twice and it is not what the claim was ever about:
the thing a player tells apart is an ATTACK, not a turn of the round, and two sprays that sounded
different would be the defect rather than the fix.

⚠️ **A BIJECTION RATHER THAN TWO COUNTS.** *Equal numbers of attacks and cues* would pass a round that
named one attack two ways and two attacks one way — 0308's own fault in a new arithmetic — so what is
held now is both halves: **an attack always sounds the same, and no two attacks sound alike.** 0308's
own probes were re-run against it and both still go red.
[0192](0192-a-guard-holds-an-invariant.md): a red guard is answered by fixing the defect, changing the
guard and saying why, or deleting it. This is the middle one.

## The ball: 12 → 13.2, and a tenth buys a whole extra bite

Driven on the rig 0322's guard flies — one ball lobbed down the ship's own lane, the opening gun, the
pilot staying on it:

| appetite | the gun empties it in | of a flight of | margin left | spare |
|---|---|---|---|---|
| 12 | 1.20 s | 2.82 s | 59.0 units | 1.62 s |
| **13.2** | **1.42 s** | 2.82 s | **51.2 units** | **1.40 s** |

⚠️ **18% SLOWER AND NOT 10%, BECAUSE DAMAGE IS QUANTISED.** The opening pulse bites one point at a
time, so twelve is twelve bites and 13.2 is fourteen. *Last just a bit longer* is a question about
bites, the appetite is the only dial that moves them, and **no fractional value between 13 and 14
behaves differently from this one** at that gun — against a four-damage shot 13 and 13.2 are the same
four bites as well. The literal tenth is the honest way to write the ask rather than a false precision.

⚠️ **THE BAR 0311 SET AND 0322 MET IS UNTOUCHED**: the gun the animal is met with still clears a ball
with half its flight to go, at every tier. 0322's probe — *the appetite back at thirty* — is
re-anchored and still red.

## What it costs the fight, which is the thing neither half could be read off alone

`scripts/weigh-boss.mjs jormungandr --difficulty=savior`, quickest fight from any place:

| gun | before | after |
|---|---|---|
| arc | 43 s | **42 s** |
| shuriken | 55 s | 52 s |
| pulse | 97 s | 94 s |

⚠️ **THE SECOND OF MARGIN WAS SPENT BY THE HEAD AND NOT BY THE BALL**, which is the opposite of what
each change looks like on its own. A void blast has an appetite of six and eats player fire that would
otherwise reach the hull ([0291](0291-the-void-has-an-appetite.md)); throwing half as many of them
hands that fire back to the animal's killer. The ball's extra 1.2 points push the other way and are
smaller. **42 s is two clear of [0260](0260-a-boss-is-fought-to-the-end.md)'s forty-second floor**, and
that floor is a driven guard in `tests/serpent.test.ts` rather than a number in this file.

⚠️ **AND THE VOLLEY FLOOR DID NOT MOVE AT ALL.** The same guard holds that every phase gets eight
volleys away; it counts a phase's duration against the phase's own cadence, and neither changed. A
round with more turns in it does not make the fight shorter — the boss's own health is what times the
phase.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0324`:

| broken on purpose | went red |
|---|---|
| the third head dropped, so the void is back behind every single spray | `THE REPORTED ONE: once hurt, the void lands on every SECOND spray` |
| the same head dropped, read off the TABLE rather than out of the fight | `THE THREE WEAPONS: five globes of acid` |
| the third head throwing void as well, so the wave is more of what was asked to be thinned | `THE REPORTED ONE: once hurt, the void lands on every SECOND spray` |

⚠️ **THE FIRST TWO ARE ONE EDIT AGAINST TWO GUARDS**, which is 0323's pair and the same argument: a head
written into the row and never reached would pass the table and fail the fight.
[0027](0027-measure-the-picture-not-the-model.md).

⚠️ **AND THREE PROBES OF OTHER DECISIONS WERE STRANDED BY THIS EDIT AND RE-ANCHORED** — 0308's void
head (the list's closing bracket is no longer the line after it), and two of 0322's (the appetite's
literal, and an acid head that now appears twice). `prove-guard` refused to run until they were fixed,
which is [0019](0019-a-probe-must-be-seen-to-apply.md) doing exactly what it is for.

⚠️ **THERE IS NO GUARD ON THE APPETITE'S VALUE AND THAT IS DELIBERATE.** *Thirteen point two* is a
tuning number; what is invariant is that the opening gun clears the ball, and 0322 already holds it.
A guard on the literal would go red for every future report about this bullet and be correct none of
those times — [0192](0192-a-guard-holds-an-invariant.md)'s admission test, failed.

## What is owed

- **The play.** Both halves are about how a fight feels at the far end of a level, and every number
  above is a model quantity — [0027](0027-measure-the-picture-not-the-model.md). The branch preview is
  where this is answered.
- **Whether the spray is now the thing that is too much.** Two sprays in three turns is more acid than
  the phase threw before, and the report is about the void. If the wave still reads long, the next
  lever is the sweep's own twenty-one globes rather than another head.
