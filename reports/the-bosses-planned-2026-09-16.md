# The bosses, planned — 2026-09-16

A plan for the next session to carry on with, written to be picked up cold. It holds the fish
feedback of 2026-09-16 verbatim, what each item is against the code and the measurements, a queue in
the order recommended, and the open items on every other boss with the decision that owns each. It
originates nothing about the game that a decision or a report does not already say; where it proposes,
it says so and costs the choice. Under the standing instruction of 2026-09-10 — *"when it comes to
bullets and enemies, stop assuming, present a plan"* — this is the plan, and nothing in it is built.

## Before anything

Read, in this order: `docs/machine.md` (node is not on PATH), `CLAUDE.md`, `docs/game.md`,
`docs/state-of-play.md`. Every change lands through `/ship` (`.claude/skills/ship/SKILL.md`): one PR at
a time, a branch off a fresh `main`, a decision record, probes under `scripts/probes/` that break each
new guard on purpose, `npm run check` then `npm run prove`, the exit codes read and never the output.

**The standing answers from the player, which no PR below may reverse:**

- *"patterns only"* — nothing a boss or an enemy throws homes; one pilot a level (0258), and among the end
  bosses only the fish stalks.
- *"make sure that we still have some straight firing bullets — if everything curves or weaves we've
  over corrected"* (0327 holds it as a majority).
- the flank cap stays where 0048 put it.
- difficulty is managed by one question — *"is this unfair, or is this a learnable strategy?"* — a hard
  mechanism stays when it is the second and is softened only when it is the first (`docs/game.md`).
- *"Don't make the serpent boss a hard rule, the pattern is what we want, the style is what makes the
  different bosses unique"* ([`the-fish-asked`](the-fish-asked-2026-09-12.md)).

**The instruments, and what each answers.** Every number in this file came from one of them; every
PR below re-runs the one it moves.

| instrument | answers | note |
|---|---|---|
| `scripts/weigh-boss.mjs <boss>` | seconds to kill, per gun, from fifteen held places | ship unhittable, missiles silenced — how fast a boss can *die* |
| `scripts/weigh-threat.mjs <boss>` | hits a second on a parked ship; adds called against arrived | how hard it is to *stand there* |
| `scripts/weigh-fight.mjs`, `solve-mid-health.mjs` | the mid-boss fights, and the healths derived from their seconds (0269) | re-run after anything that changes what the guns land |
| `scripts/weigh-presence.mjs`, `weigh-bullets.mjs` | what a body does while visible; bullet on screen per level | `--tier=` on both since 0326 |
| `scripts/threat-sheet.mjs`, `shot-sheet.mjs` | the picture, off the sheet, at true relative size | needs the dev server (`bench` on 5199 in `.claude/launch.json`) |
| `scripts/hear.mjs`, `npm run dash` | the cues and the mix | nothing in a suite can hear — 0027 |

All run as `node --experimental-transform-types --import ./scripts/ts.mjs scripts/<name>.mjs`. Every
one drives the real frame at the tier it names in its header; a verdict about the picture is still a
play on a deployed URL, read off the check run of the PR (`docs/machine.md`).

## What was said, 2026-09-16

> *"fish boss feedback — the second stage attack that fires upward covers the right side of the screen
> and completely misses the player, it should 'spawn' at random places along the bottom of the screen
> and fire upward so that the player has to actively move forward/backward to dodge it.*
>
> *the adds that get summoned are pretty meaningless still.*
>
> *the fish dies in about 10secs to shuriken.*
>
> *the hitbox has the same issue the serpent had with a hit flash — you can't see the fish as it's
> constantly registering hits."*

This is the first play of the fish since its brief landed in nine decisions (0312–0321), and it
answers four of the nine rows `docs/state-of-play.md` listed as *what to look at*.

## What is there today

The fish is `volans` in `src/content/bosses.ts`: health 1520 (0260), station 129, the one end boss
that stalks (0258), five phases keyed to health —

| phase | from | throws | with |
|---|---|---|---|
| 1 | 100% | spines, a fan of five that rakes | — |
| 2 | 75% | the **breaker**: a wave of spines up off the near edge, `span` 96 centred on the hull (0315) | two minnows every 150 steps from the lead, feeding the fish 14 health each when they reach it (0314, 0317) |
| 3 | 50% | flame on a whip; it kindles (0320) | — |
| 4 | 33% | fan of seven | three kites every 150 steps from the sides |
| 5 | 16% | a summons of kites | minnows again |

Measured on 2026-09-13 ([`the-fish-flown`](the-fish-flown-2026-09-13.md)) on `savior` at the cap:
**16 s on the shuriken, 42 on the pulse, 60 on the arc** against 0260's forty; a parked ship takes
0.17 hits a second over the fight (0317); the shoal arrives 22 of 49 called. The player reports ten
seconds, which is the same finding at whatever tier and tubes they played.

The hit flash is [0278](../docs/decisions/0278-the-flash-is-a-wash.md)'s: a hurt twin is the base art
under one translucent wash of the flash ink at `FLASH_WASH` 0.55, shown for `IMPACT_FLASH_STEPS` 4 after
each hit. A weapon landing more often than every fifteenth of a second holds the twin on continuously;
0278 said so and chose the wash over the cutout. The shuriken lands more often than that on anything it
orbits, so on the fish the wash is on for the whole fight, and 0.55 of the flash ink over the fish's own
art is a fish nobody sees.

## The fish's four items, and what each is

### 1. The flash — a hit is an event, and an event has a gap after it

**Diagnosis.** 0278 fixed the *strength* of the flash and left its *duty*: the twin is re-armed by every
hit, so under a fast gun it never goes off. The serpent's report and this one are the same defect at two
weights of wash. Lowering `FLASH_WASH` again buys a hit that stops registering — 0278's own note says a
quarter is where that happens.

**Proposal.** A flash cannot be re-armed while it is on or for a refractory gap after it: four steps on,
then a gap in which further hits change the health and not the twin — eight steps, so the animal is
seen two thirds of the time under any gun and every burst of hits still reads as one hit. One field on
the entity beside `flashFor` (or the same counter run negative through the gap), set in `strike` in
`src/sim/collide.ts`; the constant beside `IMPACT_FLASH_STEPS` in `src/app/frame.ts`. Cross-boss: it
fixes the serpent's residual too, and every enemy under a shuriken. **Consider** whether a boss row
should own its duty (0282: a mechanism whose output is identical for every kind is the tell) — a default
in shared code with the row able to say otherwise is the shape, and no row needs to say otherwise yet.

**Guard.** Driven: a body under a gun that lands every step is drawn as its base for at least half of
the steps; and a single hit still flashes for its four. Player units: a share of the fight.
`tests/accents.test.ts` holds the wash itself and does not move.

**First, because it blocks every other verdict on this boss**: the art of 0318–0320 has never been seen
in a fight for exactly this reason.

### 2. The breaker — at random places along the near edge, with a tell

**Diagnosis.** `case 'breaker'` in `src/app/boss.ts` places the wave over `span` **centred on the hull's
along**, and the fish stalks the player's lane from a station 129 units up it — so the wave rises where
the fish is, which is the right half of the screen, and never where the ship is. 0315's *"the answer is to
be somewhere along the lane the fish is not"* is satisfied by standing still. The attack is the one in the
game answered by moving along the lane, and it never asks.

**Proposal.** The wave's centre is drawn per volley from the fish's own stream — a named stream, never the
shared one (0021) — anywhere the view can show it, with the span narrowed so there is always lane left to
stand on: `span` 60 against a narrowest view of 178, so a wave covers a third of the screen and the player
crosses to the other two thirds. **And a tell**, because a wave that rises from a random place with no
warning is *unfair* and not *learnable*: a mark on the near edge over the span for a beat before the wave
leaves — the breach cue already sounds at that edge (0313), and the rain's `warning` (0248) is the
pattern for a warned attack. `BossAttack` gains `warning` on the breaker arm; the row says how long.

**Consider the screen.** With the shoal arriving under this phase (0314), a wave over a third of the lane
plus a tell plus minnows is what phase two puts up at once; the tell is what keeps it readable.

**Guard.** Driven over twenty volleys: the centres are not all one place and every one is inside the
view; no wave leaves inside its warning; the player's units are units of lane covered and seconds of tell.
`tests/volans.test.ts` holds the breaker today — extend it rather than add a file. Probe: the centre
pinned to the hull again; the warning zeroed.

### 3. The fight — sixteen seconds on the shuriken, and the guard that cannot see it

**Diagnosis.** [`the-fish-flown`](the-fish-flown-2026-09-13.md) has the table and the cause of the
guard's blindness: `dpsAt` in `tests/level.test.ts` models the pulse and the missiles only, and the
shuriken is a weapon kind (0233). The shuriken is 2.6 times the pulse on the fish and near parity on the
others because the fish stalks INTO the player's lane and sits inside the blades' orbit — *the one that
comes to you dies faster*. The report refused that as a chosen answer on 2026-09-16.

**Proposal, in two halves.** First, teach `dpsAt` the weapon kinds so the guard reddens for the fish
today — that is the report's own second way out, and it makes the fix a fix rather than a number. Then
pick the lever from a flown table, not from here:

| lever | what it costs | how to read it |
|---|---|---|
| the fish stands off — `station` further up the lane, out of the blades' orbit at the cap | the stalk still finds the lane; the pulse gets longer to travel | `weigh-boss volans --health=1520` at 129, 150, 170 |
| armour against blades, on 0307's pattern | a per-boss share of what a blade's arrival is worth; the mechanism exists for the serpent's body and would want a row field | the same run |
| health up and the phase bands re-solved | the pulse goes past a minute; 0260 has a floor and no ceiling, and a pulse fight over sixty seconds is the next report | the same run |

The first is the honest one if the numbers bear it: a boss that stalks to a distance is still a stalker,
and the blades' reach is the player's choice of gun rather than the boss's. **Whatever lands, re-run
`solve-mid-health.mjs`** — nothing here touches a mid-boss, but 0269's rule is to re-run it after anything
that changes what the guns land.

### 4. The adds — meaningful means seen, and dying where the guns are not

**Diagnosis.** Two adds, two different meaninglessnesses. The **minnows** feed the fish 14 health each
and 22 of 49 arrive, which is some three hundred of 1520 — a real number nobody can see, because
nothing on the screen says how much boss is left (open since
[0040](../docs/decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md), named again by 0061 and
0111). A burst and a cue mark the eating (`feedBoss` in `src/app/frame.ts`); the consequence is
invisible. The **kites** are one-hit hunters from the sides at agility 0.9; at the capped loadout a
body that closes on the player's lane dies at the edge of the fan
([0326](../docs/decisions/0326-an-enemy-is-seen-before-it-fires.md) measured that for every closer), so a
dive that never arrives is a body that never mattered.

**Proposal, three pieces, and the first is cross-boss.**

- **The picture mentions how much boss is left.** A mark in the chrome — authored against the short
  axis (0049), beside the lives and the shield (0045) — that moves when the fish is hit and moves back
  when it eats. Its own decision: the oldest open question in the boss vocabulary, and the one that
  makes a feed, a phase boundary and a bared window all legible at once. Every boss gets it.
- **Kites on the arc.** 0328's `arc` on the kite's row in place of `hunt`: from the sides, in to the
  ship's lane, through a half circle and back out — a body the fan does not meet at the edge, on the
  screen for the whole sweep. The kite is the fish's to call and no level's (0249), so 0258's one pilot
  a level does not read it either way. Measure with `weigh-threat volans` — its *called / arrived*
  column is the number.
- **A feed the player pays for.** Beyond health: a fed fish could throw its next volley sooner (the
  reload shortened by a step per feed, back to the row's at the phase boundary) so *what is worth my
  fire* has an answer the player feels inside the fight and not only on a bar. Costs a field on the
  escort arm; the play owns whether it is a tax.

**Consider the screen.** Phase four has kites arriving under a fan of seven; kites on a fifty-unit U
across the lane are more shape than the same three diving straight. Three at a time, standing six, as
today.

## The rest of the bosses — open items, each with its owner

None of the other five real bosses has been played since 0264 drew them, and every one of their
decisions owes *an eye at the shipped camera*. The measurements that exist say where to look first.

| boss | landed | open, and who owns it |
|---|---|---|
| jormungandr, the serpent | 0248, 0261, 0277, 0286–0292, 0298–0311, 0322–0325 | a play of the third and fourth briefs: mirror or roll at the bottom of the coil (0306), the aura's density, whether the last third reads as *shoot the thing, then dodge the bolt* (0322), `burn` at the opening loadout (0322, its own report), a hand on `hear.mjs` and `npm run dash` (0323, 0325) |
| quetzal, the pterodactyl | 0250, 0251 | an eye on the beam and the wings' beams; the wings firing on the wing; the belch's density (0250, 0251) |
| gyre | 0252, 0260 | an eye on the slant, forty-nine bullets corner to corner; the far-wall reach for the turned walls (0252) |
| hoarfrost, the frost ship | 0253, 0263, 0270 | **1.11 hits a second on a parked ship — eleven times the fish** ([`the-fish-flown`](the-fish-flown-2026-09-13.md)); a cue for the freeze; the hurt hull; the cascade's fuses (0253, 0263) |
| hydra | 0254, 0263 | whether five kinds in four seconds read as one creature; the laser ink; the frost head's opening volleys (0254, 0263) |
| medusa, the jellyfish | 0255 | **nearly immune to the shuriken — 429 s median, never on its worst lane**; the heart's beat; whether the beams read as tendrils (0255) |
| all seven | 0264 | eyes on all seven in a fight; **the arc reads *never* on the worst lane of five of the seven** — 0257 is the likely cause and nothing has looked |

Two cross-boss items sit above any single fight:

- **The undulation fork** — `docs/state-of-play.md`, *a fork that has to be picked before it is built*:
  the serpent does not undulate and its collision is a disc; 0277 costs the two ways and says the chain
  answers both, and it buys a change to `tests/budget.test.ts`'s one-blit-per-entity rule. A decision,
  not a pass.
- **The six other hulls ride the lifted kit and none has been redrawn on it** — 0276 lifted it, 0277
  drew the serpent, 0318 the fish. [`the-vocabulary-is-the-ceiling`](the-vocabulary-is-the-ceiling-2026-09-08.md)
  is the read-first for any pass, and the target arrives as a reference or a sketch from the player
  (agreed 2026-09-08), never from a description.

## The order, and why

1. **The flash** (fish item 1). Cheapest, cross-boss, and every other verdict on any boss's art waits
   on it.
2. **The breaker** (fish item 2). One attack, one arm, a tell; the guard is an extension of one that
   exists.
3. **The fight length** (fish item 3): the guard first, then the flown table, then one lever.
4. **Boss health on the screen** (fish item 4, first piece). A decision the whole roster has owed
   since the first play-test; the feed becomes legible by it.
5. **The adds** (fish item 4, the rest): kites on the arc, then the feed's price if the play asks.
6. **A play of the fish**, and the nine rows in `docs/state-of-play.md`'s *what to look at* answered.
7. **The frost ship's pressure and the medusa's immunity** — the two numbers in the flown table that are
   off the scale in opposite directions — each its own measurement before any change.
8. **The remaining owed eyes**, boss by boss, in run order, as plays on the deployed preview; the
   undulation fork picked before the serpent's next art pass; the six hulls on the lifted kit only
   against a sketch.

**Each of 1–5 is one PR**, with a decision that quotes the line of this report it answers, a probe per
guard, and the instrument re-run and its numbers in the decision. **A play report after 6** is a
committed file in `reports/` on [0029](../docs/decisions/0029-the-tracked-record-is-the-record.md)'s
terms, and `docs/state-of-play.md` is rewritten as each lands — pointers and intentions, never findings.

## What this plan deliberately does not propose

- **Lowering the wash again.** 0278 measured the floor; the defect is the duty, not the weight.
- **A homing breaker, or one aimed at the ship.** *"Random places along the bottom"* is a pattern with
  a tell; a wave that follows the ship is an aimed shot that arrives from underneath.
- **A health ceiling in 0260.** A pulse fight past a minute is a report to wait for, not a number to
  pre-empt.
- **Redrawing any boss from a description.** The kit's ceiling report says what that cost the serpent.
