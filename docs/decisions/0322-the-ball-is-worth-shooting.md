# 0322 — The ball is worth shooting

**Status:** accepted
**Amends:** [0291](0291-the-void-has-an-appetite.md) — a swallowing blast's growth is a share of its
appetite, on its row, not a step per bite; [0311](0311-the-acid-and-the-void-come-as-one-ball.md) — the
ball's appetite, and the round it arrives in; [0304](0304-the-serpent-sprays.md) — the opening arc is
two phases now; [0307](0307-the-serpent-is-armoured.md) — the health that pays for the appetite
**Demotes:** `tests/level.test.ts`'s *a later phase throws at least as much as the one before it*, to
`0322-volley` in `tests/authored.ts` — [0295](0295-a-ranking-guard-is-a-content-limiter.md)

**The serpent's last third throws half as often, its ball is a third of the appetite, and how big that
ball gets is decided by the damage it ate rather than by how many shots that took.** The opening is two
phases — three globes while whole, five once it is a fifth down — and the void's fan now arrives in a
lane the acid spray has left.

## What was asked

> *"at the start it needs to fire slightly fewer acid balls, then increase them, then it gets to the acid
> spray and void balls.*
>
> *the acid spray and void balls needs the a slightly slower fire rate and the void balls to be spaced out
> slightly more between the acid sprays.*
>
> *the last stage with the combined balls is great, but the fire rate of the serpent is too fast, you can't
> kill the combined balls fast enough at all and still damage the serpent and avoid everything."*

## The defect underneath the third sentence, which nobody had looked for

⚠️ **A BALL FED BY THE OPENING GUN REACHED A HURTBOX OF 51.9 WORLD UNITS ON A HUNDRED-UNIT LANE.** Driven,
the trace of one ball's radius as the pulse fed it:

| bites taken | 1 | 2 | 4 | 8 | 12 | 16 | 20 | 24 | 28 |
|---|---|---|---|---|---|---|---|---|---|
| hurtbox radius | 4.0 | 4.4 | 5.3 | 7.7 | 11.3 | 16.5 | 24.2 | 35.5 | **51.9** |

[0291](0291-the-void-has-an-appetite.md) grew a swallowing blast by `VOID_SWELL = 1.1` **per bite**, and
its own note says what that was measured on: *"a full appetite of six leaves it about three quarters again
as wide."* Six bites. 0311's ball takes **thirty** — twenty-nine of them from the one-damage pulse — and
1.1²⁹ is fifteen. On a ball drawn 14.4 units wide, that is a wall across half the room the player flies
in, and **the worse the gun, the bigger the wall**: the same thirty points in four-damage bites gave seven
steps and a radius of 5.3.

⚠️ **SO THE PLAYER WAS PUNISHED FOR DOING THE THING THEY WERE ASKED TO DO.** A maw eats what hits it
(0291, 0292), so every pulse spent on it made the eater bigger, and a blast that big is impossible to fly
around, impossible to shoot past, and still thirty points from dead. *"You can't kill the combined balls
fast enough at all and still damage the serpent"* is a precise description of that.

⚠️ **AND IT IS `CLAUDE.md`'s OWN RULE, WORD FOR WORD**: *a quantity that rejects an option is checked in
the case it is applied to, never the case it was measured in.* The constant was correct for the void and
nobody re-checked it against a bullet with five times the appetite —
[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md).

### The fix is that the row says a SIZE and the frame spends it per point

`bite(blast, row, damage)` in `src/app/frame.ts`, one description where there were four copies of
`blast.swell *= VOID_SWELL; blast.radius *= VOID_SWELL;` — the guns, the missiles, the bomb and the arc:

```
blast.health -= damage;
const swell = row.swallows!.swell ** (damage / row.health);
```

⚠️ **A WHOLE APPETITE MULTIPLIES OUT TO EXACTLY THE ROW'S NUMBER, HOWEVER IT WAS DIVIDED.** That is the
claim the guard drives: half the appetite fed in bites of one, two, three and six leaves the same hurtbox
to within a hundredth of a unit. Nothing about a bullet's size is the player's rate of fire to choose.

⚠️ **AND IT IS LOCAL, WHICH IS WHY IT IS AN EXPONENT AND NOT AN INTERPOLATION.** `1 + (swell − 1) × share
eaten` needs to know what the blast was thrown with, and [0299](0299-a-shard-is-killable.md)'s shards are
born with `shardAppetite` of it — so a share-of-health form would hand every shard two thirds of the swell
at birth. The exponent asks only what this bite cost, so a shard grows by its own third of the swell over
its own life and nothing has to remember anything.

### `swallows: true` → `swallows: { swell: number }`

⚠️ **NESTED, SO THE TYPE REFUSES THE HALF-AUTHORED ROW.** A flag beside a separate `swell?: number` is two
fields that mean nothing apart and a guard to hold them together; nested, a bullet that eats cannot forget
to say what eating looks like, and one that does not eat cannot say it anyway —
[0016](0016-a-hub-enumerates-kinds.md)'s *the table is the guard*, where a test would otherwise be.

⚠️ **AND THE ROW RATHER THAN A CONSTANT IS [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)**,
whose tell is *a mechanism whose output is identical for every kind*. The void keeps **1.77**, which is
what 0291's per-bite figure came to on its own six-point appetite; the ball asks for **1.5**, and it is
already the biggest thing on the screen that is not a hull. The appetite stays `health` — 0291's *a flag
and not an amount* argument is untouched, because this is not an amount eaten, it is an amount grown.

## The numbers, and what each one was measured against

| | was | is | why |
|---|---|---|---|
| the ball's appetite | 30 | **12** | four seconds of the opening gun against a flight of 2.3–2.9 s — it could not be cleared at any tier, ever |
| its swell when empty | ×15 (pulse) | **×1.5** | a row now, spent per point; 10.8 units across a 100-unit lane |
| the last phase's cadence | 36 | **60** | *"the fire rate is too fast"*, and the lightning's own two seconds |
| the lob head's gap | — | **42** | a thing to shoot and a thing to dodge, not both at once |
| the hurt phase's cadence | 60 | **66** | *"slightly slower"*, one notch of the fire grid |
| the acid head's gap | — | **24** | *"the void balls spaced out more between the acid sprays"* |
| the opening's arc | 5 | **3, then 5** | *"slightly fewer… then increase them"* |
| the phase bands | 1 / .66 / .33 | **1 / .78 / .55 / .33** | sized by the eight-volley floor, not by round numbers |
| the serpent's health | 1000 | **1100** | the smaller appetite handed the boss's damage back and cost 0260's floor two seconds |

### The last phase, flown, before and after

`GameFrame` for forty seconds in the last third with a pilot that flies onto the nearest ball's lane and
the opening gun running — the player who is trying to deal with the balls:

| | balls thrown | most at once | a ball in the lane | ring on the screen | **hits taken** |
|---|---|---|---|---|---|
| before, `legendary` | 34 | 3 | 100% | 0% | **31** |
| after, `legendary` | 15 | 1 | 74% | 0% | **4** |
| before, `savior` | 40 | 3 | 100% | 0% | **38** |
| after, `savior` | 18 | 2 | 89% | 13% | **6** |
| before, `burn` | 63 | 5 | 100% | 92% | **42** |
| after, `burn` | 24 | 2 | 100% | 30% | **22** |

⚠️ **THE PILOT NEVER DODGES, SO THESE ARE A PRESSURE INDEX AND NOT A SURVIVABILITY CLAIM.** It holds the
ball's lane to shoot it, which is the worst place to stand; what the column shows is how often that player
is touched by something, and it falls by a factor of seven at the two easier tiers.

⚠️ **AND `burn` IS STILL A MEAT GRINDER, WHICH IS SAID HERE RATHER THAN LEFT TO BE FOUND.** Twenty-four
balls in forty seconds against an opening gun that needs 1.6 s each, a ring up thirty per cent of the time,
and twenty-two touches. The tier halves every cadence (`fireGap` 0.5) while a bullet's flight only shortens
by a fifth, so **the head gap is the only lever that helps the hard tiers proportionally** — it is a fixed
number of steps. 42 is where the easiest tier kills every ball it is shown; the sweep over 18, 30 and 42 is
in the session's working notes and the trend is monotonic at every tier.

### And the lightning's period moved, which is worth saying out loud

*"Don't change the lightning attack it's really good"*, twice. **Nothing about the attack changes** — the
column, the 45-step warning and the strike are 0248's and untouched. Its **period** is a different thing,
and it had already moved twice without a decision: 1.8 s when the round had three heads, then **1.2 s**
when 0311 took one head out and left `fireEvery` at 36. It is 2.7 s at `legendary` now. A round with a
thing to shoot in it cannot also strike every two seconds; that is the trade the report asked for, and
this is the third time the number has moved, so it is written down here rather than in a comment.

## A head can hold the round, and `fireEvery` could not

⚠️ **REPORTED**: *"the void balls to be spaced out slightly more between the acid sprays."*

The acid head is a `sweep` and a sweep pushes `fireIn` out to its own sixty steps
([0304](0304-the-serpent-sprays.md)), so the spray's length is a **floor** under the cadence and the
cadence is what it floors. Measured at every tier before this change, with the phase at `fireEvery` 60:

| tier | the phase's gap | the spray | the void arrived |
|---|---|---|---|
| `legendary` | 60 | 60 | on the last globe |
| `savior` | 48 → held to 60 | 60 | on the last globe |
| `burn` | 30 → held to 60 | 60 | on the last globe |

**No value of `fireEvery` moves that**, because raising it raises the whole round and the hold still wins
at the hard tiers. So `Head` takes an optional `gap`: extra steps of quiet after *this head's* volley,
added **after** the recursion in `throwAttack` — the only place it survives, since the sweep sets the
cadence from inside that call. Driven, the void now arrives **0.5 s** after the last globe at `legendary`
and **0.4 s** at `savior` and `burn`.

⚠️ **ON THE HEAD AND NOT ON THE PHASE, ON 0282's TERMS.** *The pause after the acid* and *the phase is
slower* are different fights, and a round of three where one head wants room is a thing this table has to
be able to say. The lob's head uses the same field for the opposite reason — to keep a bolt off a ball —
which is what makes it a mechanism rather than a fix.

⚠️ **AND THE OTHER READING OF *spaced out* WAS CONSIDERED AND REFUSED**: the fan's own `spread`, pushing
the three void balls apart. It is not what the sentence pairs with *between the acid sprays*, and a wider
fan is a **harder** volley — the ask is for room, and room here is time.

## Two guards squeeze the opening from opposite ends, and that is where the bands came from

Splitting a phase halves its band, and `tests/serpent.test.ts` holds that **every phase gets eight volleys
away** in the quickest fight any gun can fly (0260's *"I only saw about 50% of their attacks"*). At the old
cadence a half-band got **6.7**. The obvious answer — slow the late phases, which is what the report asked
for — is refused by `tests/difficulty.test.ts`: **a later phase never fires slower than an earlier one.**
Slower at the end forces slower at the start, and slower at the start fails the volley floor.

**So the whole ladder moved**: cadences **78, 72, 66, 60** (one notch of the fire grid apart, each phase
quicker than the last at every tier) over bands **0.22, 0.23, 0.22, 0.33**. Flown at the quickest gun's
quickest place, that is **8.8, 8.9, 10 and 17** volleys against a floor of eight. The pretty version —
fifths of the bar — measured 7.9 in the second phase, which is why the boundaries are 0.78 and 0.55 and not
0.8 and 0.6.

⚠️ **NEITHER GUARD WAS TOUCHED, AND THE OPENING IS SIX STEPS QUICKER AS A RESULT.** Three globes every 78
against five every 84: at the tuned tier that is **4.5 bullets a second down to 3.0**, so *"slightly
fewer"* is delivered in what arrives even though the cadence went the other way. The cadence moved because
the band did, and the band moved because two guards said so.

## The demotion, which is the third time this quantity has been re-fitted

`tests/level.test.ts`'s *a later phase throws at least as much as the one before it* has been rebuilt twice
to keep one table green:

- **0304** widened it from `shots` to *the attack's own count*, because a spray of twenty-one lives in a
  phase whose `shots` is three.
- **0311** widened it again to *a swallowing bullet is worth its appetite*, because one ball replacing
  twenty-four bullets read as a relief.
- **0322** is the third correct change to redden it: the appetite is twelve, so the same conversion says
  twelve against a spray's twenty-one.

⚠️ **THE CLAIM IS RIGHT AND THE NUMBER CANNOT HOLD IT.** *A later phase is never a relief* is about what
the fight **asks**; the serpent's last third asks the player to destroy a thing and then stand out of a
column of lightning. **Bullets on the screen and difficulty stopped being the same axis the moment a bullet
had to be shot down** — which is [0295](0295-a-ranking-guard-is-a-content-limiter.md) arriving at a second
table, one whose rows are phases rather than kinds. It is printed every run as `0322-volley` and can fail
nothing; the two clauses that stay are invariants (phases ordered full to empty, a cadence that never
slows). Demoted rather than deleted, which is
[0192](0192-a-guard-holds-an-invariant.md)'s own asymmetry: *demoting a guard takes one edit and a reason.*

⚠️ **AND 0304's PROBE FOR THAT CLAUSE IS RETIRED WITH IT**, because a probe against a taste reports STILL
GREEN — [0019](0019-a-probe-must-be-seen-to-apply.md)'s subject wearing a green tick. Its claim rests on
the two probes about the arc itself instead.

## The health, and the thing it teaches about a bullet with an appetite

⚠️ **CUTTING THE APPETITE MADE THE FIGHT SHORTER, AND 0260's FLOOR CAUGHT IT.** A maw eats the player's
fire, so thirty points of appetite were thirty points of damage that never reached the serpent — **the
bullet was tanking for the boss.** With twelve, the arc's quickest fight fell from 40.0 s to **38.0**, under
the forty-second floor. At 1100 health it is **43 s**, three clear, and every phase gets ten volleys or
more. 0307 said this in advance about a different change — *"the void rule the same decision changed made
the lightning the quickest gun here"* — and it is worth stating as a rule of thumb: **a change to what a
bullet does is a change to how long the fight takes, every time.**

## What is owed

- **The picture.** A fed ball photographed at the shipped camera beside an unfed one: 1.5 is a number chosen
  against the lane, and whether it reads as *it is eating* is an eye's question — `scripts/shot-sheet.mjs`.
- **The play.** Everything above is a model quantity or a flown fixture. Whether the last third now reads as
  *shoot the thing, then dodge the bolt* is [0027](0027-measure-the-picture-not-the-model.md)'s question and
  only the player can answer it.
- **`burn`.** Twenty-two touches over forty seconds with an unupgraded gun. If that tier is meant to be
  survivable at the opening loadout, the lever is the head gap and not the appetite — and it wants its own
  report rather than a number guessed here.
- **A sound for the swelling**, still. 0311 owed it and this decision does not pay it: the ball's growth is
  the one tell it has and it is silent.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0322`:

| broken on purpose | went red |
|---|---|
| the swell put back to a step per bite | `THE REPORTED ONE: how big a fed ball gets is what it ATE` |
| the ball asking to be four times its own size when fed | `and a fed ball is a TARGET rather than a wall` |
| the appetite back at thirty | `THE REPORTED ONE: the OPENING gun clears a ball before it reaches the ship` |
| the head's gap never added | `and the void gets a lane the spray has LEFT` |
| the acid head's gap taken off the row | `and the void gets a lane the spray has LEFT` |
| the opening phase back at five globes | `THE REPORTED ONE: whole, it throws a forward arc` |

⚠️ **THE FOURTH AND FIFTH ARE THE SAME CLAIM FROM BOTH SIDES**, which is deliberate: one takes the field off
the row and the other takes the line that spends it out of the frame. A probe on the row alone proves the row
is read; a probe on the line alone proves the line runs. The pair is what says the mechanism is wired.

⚠️ **AND SIX OLDER PROBES WERE RE-ANCHORED RATHER THAN LEFT TO STRAND** — 0124, 0291 (×3), 0292 (×2), 0304,
0307, 0311 (×2). Every one of them is a string that moved because this change moved the code under it, and
`tests/prove-guard.test.ts` is what refuses to let them sit there passing.
