# 0291 — The void has an appetite

**Accepted 2026-09-09**, from the first play of the long serpent —
[`the-chain-played`](../../reports/the-chain-played-2026-09-09.md):

> *"the void blasts should be bigger and a bit random and should eat x amount of damage and then
> explode in a void blast"*

Refining the original brief for this boss —
[`the-serpent-played`](../../reports/the-serpent-played-2026-09-08.md):

> *"void blasts should be larger balls that absorb the player's weapons/missiles/bomb… it'll be
> interesting to see how it interacts with the lightning gun"*

## The rules

**A shot may say the player's fire can reach it. Almost none does.**

**Its `health` is its appetite** — one number, and it is the one every other body already uses for
*how much it takes*.

**A shot that survives a hit owes the player a picture.**

## ⚠️ Nothing in this game had ever let a player's shot touch an enemy's

Hostile bullets collide with the ship and with nothing else. So `swallows` is not a tuning number:
**it is the switch that puts a bullet in front of the guns at all**, and a game where every bullet
can be shot down is a different game from the one in `docs/game.md`.

⚠️ **AND IT IS NOT A PAIRING OVER THE WHOLE POOL.** `collideInto` spends a shot on a target; this has
to spend the target on the shot as well, and only for the rows that eat. The outer loop is the hostile
pool with an early-out on the row — 150 reads a step, of which only the two or three voids on the
field reach the inner loop over the player's 88. [0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)'s
own arithmetic: the product of two small sets, never the square of one big one.

## ⚠️ It was two numbers for one commit, and the first driven test caught it

`appetite: 6` on the row, beside `health: 1`. `reset` gives a shot its ROW's health, so the field that
was supposed to say six sat there being read by nobody while a single pulse popped the blast — and
the guard reported the player's fire going *straight through*, because the tally it was reading never
moved.

⚠️ **ONE NUMBER.** `swallows` is a flag and the appetite is `health`, which is what health has always
meant. The rule this breaks is the one 0282 states about defaults, and it is worth naming: *no row can
forget it* argued correctly for an optional field — and then the optional field was given a value that
duplicated a required one. **A default is not a licence to add a second answer.**

## ⚠️ It swells as it feeds, and a flash could not have done it

A blast that swallowed a pulse and showed nothing reads as a shot passing through it —
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md), whose own finding is that this
class gets **reported as a collision fault that does not exist**, three times over.

A flash was the obvious answer and is the wrong one twice:

- the void's `spriteHit` **is** its own sprite, so a hurt twin is four steps of a colour change on a
  bullet two units across;
- and `tests/combat.test.ts` holds *a shot never flashes*, because every shot but a blade is spent by
  arriving.

⚠️ **SO IT GROWS — a tenth a bite, three quarters again as wide by the time it bursts.** That is the
tell the sentence already asks for, it is legible at a glance rather than for four frames, and it
makes a nearly-full blast a bigger target, which is a feedback loop rather than a decoration.

⚠️ **THE DRAWING AND THE HURTBOX GROW TOGETHER**, and the size roll at the muzzle moves both for the
same reason: a blast drawn bigger than it collides as is a blast that hits from a place the picture
calls empty. Same bug, other direction.

## ⚠️ The burst is 0263's machinery and not a second copy of it

`throwChild` already spawns one child of a row about a heading, drops a burst that will not fit rather
than growing the pool, and is written to be called with the parent released first so the first child
takes its slot. The ring is seven of those.

⚠️ **AND THE SHARDS CANNOT THEMSELVES BE EATEN, OR THE POOL EXPLODES.** They are the same row, so they
carry the same `swallows` — and one pulse would pop each of seven into seven more, for ever. They are
spawned at stage 1 and only stage 0 eats. `turnsLeft` is the stage every shot already carries and
nothing else reads on one (0263), so *what came out of a burst* is a question the entity could already
answer.

⚠️ **NO FUSE.** The obvious build makes the burst a `fission` stage — and a stage carries an `after`,
which is a timer, and the ask is that it explodes when FED. Rather than smuggle in a sentinel meaning
*never*, the appetite calls the burst directly. An unfed void flies on and hits the ship, which is
what it did before.

## ⚠️ And the collision is swept, because the first version was sampled and was wrong

The first `feedVoids` compared two current positions. `overlaps` is the closest approach between the
two paths over the step — the thing `src/sim/collide.ts` wrote to **delete this class rather than
police it with a speed ceiling**, and the reason it is exported.

⚠️ **AND THERE IS NO PROBE FOR IT, BECAUSE THE HARNESS REFUSED THE ONE THAT WAS WRITTEN.** Putting the
sampled test back came out **STILL GREEN**: a pulse closes about 3.5 units a step against a reach of
about 3.1, so it cannot pass through a blast this size in one step whichever way the test is written.
The sampled version is wrong in principle and indistinguishable in this fight.

⚠️ **SO THE SWEEP IS NOT A CLAIM THIS DECISION HOLDS.** It is a shared helper used the way every other
pairing uses it, and it is guarded where it lives. Leaving a probe that reddens nothing would be
[0019](0019-a-probe-must-be-seen-to-apply.md)'s own failure wearing a tick — **a probe that cannot
break its guard has proved that the guard does not hold the thing** — and the answer to that is to say
so, not to weaken the guard until the probe passes.

## What is held, and where

| Claim | Where |
|---|---|
| a void blast eats the player's fire, and bursts when it has had enough | `tests/serpent.test.ts`, driven |
| and it grows while it eats, in the hurtbox as well as the drawing | `tests/serpent.test.ts`, driven |
| nothing else the serpent throws can be shot out of the air | `tests/serpent.test.ts`, driven |
| a shot that survives a hit is a blade or a swallower | `tests/combat.test.ts`, amended |
| the acid and the void are still told apart in the air | `tests/serpent.test.ts`, amended |

⚠️ **0248's LADDER WAS REVERSED ON PURPOSE AND ITS GUARD SAYS SO.** *An acid blast is fatter than a
void one* was the authored choice; a bullet the player is meant to aim at has to be worth aiming at,
so the void went 1.3 → 2.2. What that guard was protecting is 0098's *three kinds of shot the player
cannot separate is one bullet wearing three shapes*, so the size claim is a MARGIN now and the parts
of the ladder that still have a direction — slower, worth more — are left pointing where they were.

## What is owed

**Missiles and the bomb.** The original brief says *"absorb the player's weapons/missiles/bomb"* and
this feeds on `playerShots` alone. Two more pairings, each with its own question — a missile is
guided and would need to choose a blast as a target, and a bomb's blast is an area rather than a
body. Neither is hard and neither is this.

⚠️ **AND *how it interacts with the lightning gun* IS STILL AN OPEN QUESTION THE PLAYER ASKED.** The
arc's bolts are strokes rather than pooled shots (0233), so they do not go through `playerShots` at
all and cannot feed a void as things stand. That is worth knowing before it is played, because the
answer *the lightning gun ignores void blasts entirely* is a finding and not a bug.
