# 0311 — The acid and the void come as one ball

**At its last third the serpent stops spraying and lobs one thing: a ball of acid and void that eats
the player's fire, swells on it, and bursts into a ring of droplets if it reaches them.** The round
becomes two heads — something to shoot, then something to dodge.

## What was asked

> *"5. the acid splash and void orb attacks need to change at the lightning phase, currently they go on
> for too long and get boring → they need to change to a combined acid/void ball → it eats damage and
> gets bigger and if the player does not kill it, it explodes when it gets to 20% away from the left
> screen and the explosion size is based on how much health left, the explosion is an outward circular
> blast of acid and void droplets."*

## What *boring* was, in numbers

The last third's round was three heads: an acid `sweep` of **twenty-one globes** over a second, a void
`spray` of three, and the lightning. So **two volleys in every three were twenty-four bullets the
player could only wait out** — a stretch of the fight where nothing they do changes what is coming.

This is the opposite shape. **One object, and what happens to it is entirely theirs**: kill it and
nothing arrives, leave it and the lane fills. The round alternates between a thing to shoot and a thing
to dodge, which is the escalation the phase table was built for expressed in what the player does
rather than in how many bullets there are.

## The fuse is a place, not a clock

[0263](0263-the-frost-ship-shatters.md)'s `fission` stages burn down in steps, which is the right shape
for a thing that comes apart on its own. This comes apart **where the player let it get to**, and a
step count timed to arrive at the right distance is a number that is only correct at one speed and one
station. So `Swallow` is its own field: `{ at, into, droplets, speed }`.

⚠️ **AND `at` IS A DISTANCE FROM THE CAMERA'S TRAILING EDGE RATHER THAN A SHARE OF THE VIEW** —
[0023](0023-the-long-axis-is-the-scroll-axis.md). *"20% away from the left screen"* is a fraction of a
screen that is **177.8 world units wide at its narrowest and 240 at its widest**, so a literal share
would put the burst twelve units further from the player on a 2.4:1 monitor. The number is read off the
narrowest view once — **35.6** — and every device gets the same fight. The ship's own box runs from 10.7
to 167, so it bursts inside the room the player flies in.

## The count is the size

*"The explosion size is based on how much health left"* — so the share of its appetite still unspent
decides **how many** droplets go out, floored at two.

⚠️ **WHAT SCALES IS WHAT THE PLAYER HAS TO MOVE THROUGH.** Scaling the droplets' own size instead would
make a weak blast an easier thing to *see*; scaling the count makes it an easier thing to *fly between*,
and the second is what *a smaller explosion* means to somebody dodging one.

⚠️ **AND THE TWO HALVES OF THE ASK POINT OPPOSITE WAYS, WHICH IS WORTH SAYING OUT LOUD.** It swells as
it eats (*"it eats damage and gets bigger"*) and its blast shrinks as it is hurt (*"the explosion size
is based on how much health left"*), so **the biggest ball on the screen is the one about to make the
smallest mess.** Both are what was asked, literally, and 0291 already uses swelling as the tell for *it
is eating* on the void — so the language is consistent with what is there. Whether it reads as *nearly
dead, keep going* or simply as wrong is an eye's question and is the first thing to check in play.

## Two kinds out of one burst, which `fission` cannot do

*"Acid and void droplets."* 0263's children are the same kind by construction and its own note says why
— a shard that became a different bullet would want a rung on the hostile ladder for every stage. So
`burstMaw` walks the row's `into` list, alternating round the ring. It is `burstVoid`'s shape with the
kind read per drop.

## Killing it must leave nothing, and without one line it left seven balls

⚠️ **THE CHAIN THIS DECISION NEARLY SHIPPED.** A void that is emptied bursts into seven shards of its
own kind (0291, 0299), and the ball inherits that machinery through `spendVoid` — so a player who did
exactly what they were asked would have been handed **seven more balls**, each with a third of the
appetite and each bursting again where it arrived. *"If the player does not kill it, it explodes"* means
killing it is the half where **nothing happens**, and that is the entire reward for shooting the thing.

`spendVoid` now reads the row: a bullet that bursts where it arrives is simply gone when it is emptied.
Read off the row rather than the kind, on 0282's terms — a second shot that bursts on arrival gets the
same answer without touching that line.

## `lob`, and why it is a new arm rather than `shots: 1`

Every other arm of `BossAttack` takes its count from the phase, because a phase widening its fan as
health falls is the escalation [0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md) built. A ball
the player is meant to **shoot** is the opposite kind of object: its difficulty is its thirty points of
appetite and the ground it covers when it bursts, and three at once is not a harder version of one — it
is ninety points of shooting they cannot finish and three explosions they cannot all be away from.

The phase authors `shots: 3` and the lightning head beside this one still reads it. `ring` was tried
first and throws the phase's count round a circle; `spray` throws the phase's count in a fan. `lob`
throws **one**, by construction rather than by a row remembering to say so.

## The numbers, and which of them are guesses

| | | how it was chosen |
|---|---|---|
| appetite | 30 | about five of the arc's links, or a second and a half of the opening gun held on it — **a guess** |
| speed | 0.55 | ~3.5 s from the mouth to where it bursts, so it is shootable |
| bursts at | 35.6 | a fifth of the narrowest view, measured once |
| droplets | 16 at full | fills the ring; two at the floor |
| drawn | 14.4 | two and a half acid drops, about half the skull that spat it |

⚠️ **THE APPETITE IS THE ONE I WOULD CHECK FIRST AND IT HAS NOT BEEN DRIVEN.**
`scripts/weigh-boss.mjs` flies the whole fight at a loadout and nobody has pointed it at this. If the
base gun cannot clear a ball before it bursts, the last phase becomes *dodge the ring* for every player
who has not upgraded — which is the opposite of the ask, since the whole point is that what happens is
theirs.

⚠️ **AND ITS SIZE IS DELIBERATELY THE BIGGEST NON-HULL THING ON THE SCREEN.** `CLAUDE.md`'s *consider
the screen* is the rule and [0295](0295-a-ranking-guard-is-a-content-limiter.md) deleted the guards that
used to answer it in advance. A bullet the player is asked to destroy, held in front of them for three
and a half seconds, has to look like a target rather than like a thing to dodge.

## What it took away, said out loud

⚠️ **0304's *gate that waits for the spray* is now a mechanism no content exercises.** Its probe broke
the line and `npm run prove` reported **STILL GREEN**, because the case lived in the last third's round
of three at the hardest tier — which is the ball and the lightning now. Measured at every tier, the only
spray left is the hurt phase's and its round is never shorter than it:

| phase | tier | round | spray |
|---|---|---|---|
| hurt | legendary | 120 | 60 |
| hurt | savior | 96 | 60 |
| hurt | **burn** | **60** | **60** |

The equality is safe by construction rather than by luck — `stepBoss` throws a spray's next globe
**before** the gate — so the line is still right and is simply unreached. **The line stays and the probe
is retired**, because a probe reporting STILL GREEN is
[0019](0019-a-probe-must-be-seen-to-apply.md)'s own subject wearing a green tick. The next phase that
carries a spray longer than its own round re-arms it.

## What is owed

- **The fight, driven.** `weigh-boss` against every gun, for the appetite above.
- **The picture.** The ball, a fed ball and a burst, photographed at the shipped camera.
- **A sound of its own.** The burst borrows `bossVoid` (0308), which is right — it is a mouthful of void
  arriving all at once — but the ball *swelling* says nothing at all, and swelling is the one tell it has.
