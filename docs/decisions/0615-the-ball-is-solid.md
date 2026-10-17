# 0615 — The ball is solid, and the War Dance is a pinball

**Accepted 2026-10-17.** From a play of [0613](0613-the-dance-is-earned.md)'s Hamster Ball. **Amends
[0609](0609-the-ball-takes-its-knocks.md)**: a wall reflects the War Dance, where it turned it onto the next of
six headings. **Amends 0613**: the bar is twenty landings, where it was twenty-four.

## The ask

> *"for the hamster ball — there's no physicallity when you hit something, you should bounce back off bosses and
> objects that don't get immediately destroyed or take two or more hits. at the moment you just move right
> through them and the physics feels off. for the special as well, it spends most of it's time bouncing through
> the back half off the screen without doing a lot to enemies and barely touches a boss - it also doesn't have
> good physics on the bounce and the sound should be more akin to a pinball like sound than the current sound."*

## The rule

**After the ram has landed, whatever it is still inside — a body it did not break, the boss, a piece of the
boss — puts it back out to touching and sends it off. A body the ram broke is already gone, so the ball goes on
through what it kills and comes off what it does not. The War Dance comes off walls as a ball does, off every
body it cannot break as a ball off a bumper, bends at what it is dancing at, and sounds like a pinball table.**

| | |
|---|---|
| **the knock** | `knockRam` in `src/app/frame.ts`, after `settleRam`: the deepest body the ram is inside (`deepest`, over the enemies and, unless the boss is beaten, its hull and body). The ship is put back to touching along the line between their centres and sparks fly where they met (0036) |
| **the steered ball** | its velocity in the body's frame is reflected about that line, keeping the ram row's `give` (0.4) of it, and leaves at no less than its `knock` (2.0 a step); then `flyShip`'s mass hands it back to the stick |
| **the dance off a body** | reflected, thrown off at `kick` (1.5) times its speed settling over `kickSteps` (20), a burst where it met it, and `danceBumper` |
| **the dance off a wall** | `bounceDance` reflects the component into the wall and keeps the other — `heading` (0.62) is only the throw now, where 0609's `angles` were six headings in turn |
| **the bend** | `pullDance`: up to `pull` (0.12 rad) a step toward the boss while one is up and not beaten, or the nearest body in view; the target held inside the ship's box; not for `free` (3) steps after any wall or body turned it, so a target past a wall cannot hold the dance against it |
| **the sound** | `danceBounce` is a slingshot's rubber now — a dry thwack, a snap, a small bell off the post; `danceBumper` is new — a solenoid's thock under the table's chime, a square bell on the root four octaves up and its fifth, and the score's bloop. Every landing in a dance is the bumper, and the ball's own landings stay `ram` |
| **the bar** | `charge: { fill: 20 }` on the ball's row |

## Why it is built the way it is

### After the landing, so *"immediately destroyed"* decides itself

The ask draws the line at what dies: through what breaks, off what does not. Run after the ram's pairings, the
knock never has to ask: a body killed by this step's landing has been released from its pool, and whatever is
left in reach is by construction a body that survived it — whatever its health, whether the ram's clock let it
land at all, whether it is the boss in its entrance. Run before them, it would have to predict a kill the
pairings have not made, and a probe that does exactly that ([the probe file](../../scripts/probes/0615-the-ball-is-solid.mjs))
bounces the ball off a body of one.

### The deepest body only

Two at once would be two normals and a ship pushed into one by the other. Pressed into a crowd, one body is the
whole contact on any step, and the next step has the next.

### Two units with the stick held, measured in what it costs

A reflection alone is not enough: a ball pressed in at the stick's full speed meets the body, the reflection
sends it back at `give` of that, and the stick takes it straight back. The knock is the least it leaves at.
Flown at the stick into a body of a thousand, with the stick still held:

| `knock` | back off it, the stick held | held ram on the fourteen bosses, landings a second |
|---|---|---|
| none (0609) | through it | 6.6 |
| 1.1 | under 8 px | 7.1 |
| 1.6 | 8 px, measured | 6.3 |
| **2.0** | **over 12 px, the guard — two units by the arithmetic, and about eight let go** | **5.3** |
| 2.4 | about 17 px by the arithmetic | 4.5 |

Pixels on a 1280-wide screen; the ram on every end boss and mid-boss alone, the stick held at the hull, the heat
held cool (a scratch flight over `tests/world.ts`). 1.6 reads as sticking to the hull; 2.4 costs a third. At 2.0 a
held ram lands four fifths as often — and the dance, which the bar earns, lands two and a half times what it did
(below), so a fight the ball was solved against in 0609 is about as long as it was. **That is an estimate, not a
measurement of a fight**, and it is owed a play.

### A wall reflects, and what is in the box turns it

*"Doesn't have good physics on the bounce."* 0609 answered *"bounce around the screen more"* by turning the dance
onto the next of six headings at every wall: a ball that changes its mind at a wall, which is what reads as wrong.
A real wall keeps the angle. What 0609 was protecting against — one line through an empty box — is now answered
by what is in the box: every body the dance cannot break turns it as a bumper does, and it bends back at its
target. In a box with nothing in it the dance is a billiard ball, and `tests/dance.test.ts` says so.

### The bend, measured in the case it is applied to

*"Spends most of its time bouncing through the back half of the screen … and barely touches a boss."* Measured on
the five end bosses and nine mid-bosses alone, five or six dances each, the same scratch flight:

| | on the boss's half | landings a dance | a boss a dance |
|---|---|---|---|
| 0609's dance | 51% | 3.6 | 4.1% |
| reflected, no bend | 52% | 4.2 | 2.7% |
| bend 0.045, free 20 | 53% | 4.5 | 3.7% |
| bend 0.08, free 5 | 68% | 7.7 | 7.2% |
| **bend 0.12, free 3** | **81%** | **11.0** | **10.5%** |
| bend 0.15, free 5 | 77% | 11.3 | 10.1% |

Reflection alone made it worse: a dance that came off the boss went back down the lane and had nothing to bring
it back. A head-on landing reflects it straight back, and at 0.08 it took 130 units of looping to come round; at
0.12 it turns on a circle 28 units in radius. The gyre, standing square in its path, is the one the dance spends
least of its time near — half — and the floor in `tests/solid.test.ts` is that.

**Mid-bosses lose a fifth to a third of their bar to one dance** (the lattice 32%, the shoal-mother 26%, the
harrow 20%), where 0609's took a tenth: that is what *"barely touches a boss"* turned into, and it is named here
so a play can say whether it went too far.

### Twenty landings, because the knock spaces them

The same heat-minding pilot 0613 flew lands about two thirds as often on a boss once each landing knocks it
off — 0.9 to 1.9 a second where it was 1.1 to 2.7 — so twenty-four put the serpent's bar at 15.1 s, over the
ask's fifteen. At twenty, seconds a bar:

| | 0613, at 24 | **0615, at 20** |
|---|---|---|
| The Approach, Descent, Coilward, Batteries, Eye | 15.5, 26.4, 12.1, 18.5, 27.3 | **12.0, 18.0, 11.6, 19.2, 10.5** |
| the serpent (the guard's) | 12.6 | **14.0** |
| the other bosses | 7.5 – 13.2, the lattice 21.6 | **11.0 – 16.3**, the lattice 21.7 |
| the hydra | 9.9 | **38**, a pilot's fault |
| the chorus | never reached | never reached, as before |

The hydra's is the pilot's: it backs off down its box through the hydra's necks, landing on them as it goes,
which keeps its heat up, and it never cools — traced step by step. A pilot pressing the hydra lands on it 6.5
times a second, as on any other.

## Guards changed, and why

- `tests/dance.test.ts`: *off on a new heading each time* held 0609's six headings; this decision takes them out on
  purpose, and the guard now holds one heading in an empty box — the angle a wall was met at. Its probe in
  `0609-the-ball-takes-its-knocks.mjs` broke the headings and is gone; this decision's file breaks the reflection.
- `tests/ball.test.ts`: five fixtures pressed the ball into a body that would not die by laying it on the ship
  once. The knock sends the ball off it now, so they hold it there (`pressed`), as a player holding the stick in
  does — what they ask, the heat and its burn, is unchanged.
- `scripts/probes/0613-the-dance-is-earned.mjs`: the bar's two probes anchor on twenty.

## What guards it

`tests/solid.test.ts`: in pixels, the ball never more than a step's flight into a body it cannot break and never
through it, back off it with the stick held, landing again; on through a body it breaks, slowed by nothing; never
inside any end boss. The dance off a body turned away, faster, heard as a bumper; on through a body it breaks;
most of its time on the boss's half across the end bosses and never under half on any. `tests/dance.test.ts`
(one heading in an empty box). Probes in `scripts/probes/0615-the-ball-is-solid.mjs`, all nine seen red.

## Owed

- **A play**, above all of the knock and the dance at a boss: whether two units back is a knock or a stall, and
  whether a dance that takes a third of a mid-boss is the special the ask wanted or too much of it.
- **The ear** on both pinball sounds, which have been rendered and never heard.
- **The fight lengths** with the ball, flown and not estimated: the held ram's four fifths against the dance's
  two and a half.
