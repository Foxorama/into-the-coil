# 0250 — The quetzal screams

**Accepted 2026-09-05**, the same night as [0248](0248-the-serpent-strikes.md) and
[0249](0249-the-eagle-summons.md), the third of the real bosses' own decisions, from
[`the-bosses-asked`](../../reports/the-bosses-asked-2026-09-05.md):

> *"Saurian Belt is going to be a flying pteradactyl with lazers mounted on it's wings and it opens
> it's mouth to fire a huge laser blast."*

**Amends [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**: the quetzal's row is the fight
the brief described, less its backdrop. **Extends [0248](0248-the-serpent-strikes.md)**: a second
thing in the bolts pool that is not the arc's, and the first that is held.

## The rules

**A laser is a beam, not a bullet, and it is held.** The `beam` attack fires one bolt per entry of
`from` — an across offset from the hull's centre, in world units — each running from the hull down
the lane to the trailing edge of the screen, riding the camera as every bolt does. It is drawn as a
warning line for `warning` steps and is then a straight hostile stroke for `hold` steps, and on
**any** step it is held a ship within `halfWidth` of it across the lane is hurt as any shot hurts it,
through `wound`, with the same invulnerable window every other threat opens — which is what makes a
held beam one hit and not thirty. The serpent's lightning lands once; a laser is a wall for as long
as it is on, and `THE WARNING AND THE HOLD` in `tests/quetzal.test.ts` drives a ship into a beam a
third of the way through its hold and holds that it is hurt on the step it crosses in.

**The wings' beams leave the wings and the mouth's leaves the mouth.** The roots are authored
against the hull as it is *drawn*: eighteen units either side is where `paintBoss10` puts the
wingtips on a 44-unit extent, and the guard refuses a root outside the drawing's half-extent — a
laser from empty space beside a body is 0036's bug in the other direction. The mouth's beam is
twelve units wide, four times a wing's, and takes a twelfth of the lane: *"a huge laser blast"* is a
thing the player reads as a slice of the screen and not as a line.

**The hull braces to fire, and the flight between beams is on top of the beam.** A beam is fixed
across the lane where it was fired; a hull that went on patrolling would slide away from its own
lasers. So the boss's `holdFor` — a field nothing else reads on a boss, on `turnsLeft`'s terms from
0249 — is the steps it has left to stand still across, counted down after the move has said what the
hull would do, because a brace is a thing the hull does on top of how it flies rather than a fourth
way of flying. The station is still tracked along the lane and `pinBeams` in `src/app/frame.ts`
re-pins each beam's root to the hull every step. And the beam's own steps are added to `fireIn` at
the gate, so the phase's `fireEvery` is the flight between one volley's end and the next: without
that, a phase whose beam outlasts its cadence is a hull that never moves again, and a phase table
cannot say that honestly. `THE BRACE` holds both halves in the player's units — still across for the
beam, then at least half a second of flight.

**The picture is as wide as the hurt.** The canvas strokes a bolt's glow at four times its width, so
a beam is stroked at half its half-width and the glow's edge is exactly where it stops hurting; a
beam drawn narrower than it hurts would be a lie about where the player may be. No jag, no points,
no twig — a beam that jagged would be lightning — full until its last `BOLT_STEPS`, on which it fades.
`THE PICTURE` reads the strokes back: dim then bright, straight on the screen, hostile, and no
narrower than the beam's own width at the view's scale.

**Four phases, and from the second it stops to fire.** Flying fast and spraying lances while whole;
the wings at two thirds; the mouth at a third; all three at the last sixth, each five units wide,
narrower than the mouth alone because three of them are what cover the lane.

## The figures

| phase | at | attack | flight between |
|---|---|---|---|
| whole | 100% | a spray of three lances | 72 steps |
| the wings | 66% | two beams at ±18, 3 units wide, 0.3 s warning, 0.4 s held | 60 |
| the mouth | 33% | one beam at 0, 12 units wide, 0.5 s warning, 0.5 s held | 54 |
| everything | 16% | three beams at −18, 0, 18, 5 units wide, on the mouth's timing | 48 |

## ⚠️ What was rejected

**A `laser` bullet.** The legibility rules order every hostile bullet by size against speed with a
five-pixel gap between neighbours, and the flame already sits at the floor the sky's far stars set:
a bullet quicker than the flame would have to be drawn smaller than the smallest thing that may
kill the player. A beam is not in that ordering because it is not a body, which is 0248's argument
for the rain, and it is also what the brief drew: a line, not a stream.

**Beams that follow the hull across the lane while it flies.** The root's offset would have to
ride the bolt, and the only fields it could ride are named for other things (`spin` is the jag's
seed, `firePhase` a spinner's turn). A brace is honest, it is what a creature firing something huge
does, and the moment the hull stops is itself the telegraph.

**The beam's duration inside `fireEvery`.** The mouth's beam is sixty steps of warning and hold
against a cadence of fifty-four; folded into the cadence, the hull is braced from a third of its
health to its death, and the escalation guards — which read `fireEvery` — would have called the
fight faster while it stood still.

**The strike hurting on one step, as the rain does.** That is lightning with a longer picture; the
guard that drives a ship into a held beam is the one this decision exists to leave red for it.

## What is owed

- **The volcanoes.** *"Volcanoes in the background that belch big chunks of volcanic rock that rain
  down and the player has to dodge"* — a hazard on the row beside `uncoil`, a rock in a new ink, and
  the Saurian Belt's backdrop painting the belch. Its own decision, next in the brief's order.
- **An eye on the beam at the shipped camera**: whether a twelve-unit beam reads as *huge*, and
  whether the wings' three-unit ones read at all against the belt's backdrop.
- **The wings while flying.** A first iteration braces for every beam; the wings may want to fire
  on the wing, which needs the root offset to ride the bolt.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content, one attack arm, one bolt
kind and one field's second meaning; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0250`:

| broken on purpose | went red |
|---|---|
| the roots ignored, so every beam leaves the middle of the hull | `THE WINGS AND THE MOUTH, DRIVEN` |
| the mouth's warning authored to nothing | `THE WARNING AND THE HOLD` |
| the beam hurting only on the step it lights, as the rain does | `THE WARNING AND THE HOLD` |
| the beam's half-width ignored, so a ship anywhere across is inside it | `and a ship beside the beam` |
| the brace removed, so the hull flies away from its own beams | `THE BRACE` |
| the flight not added to the cadence, so the hull braces for ever | `THE BRACE` |
| the beam drawn at the arc's own width, narrower than it hurts | `THE PICTURE` |
| the beam given the lightning's jag | `THE PICTURE` |

0248's picture probe re-anchored on the line the beam now shares with the rain.
