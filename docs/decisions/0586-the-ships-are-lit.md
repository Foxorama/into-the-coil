# 0586 — The ships are lit

**Accepted 2026-10-10.** From the play-test of 2026-10-10.

## The ask

> *"Lil caddie needs to have a spinning disc of funky alien UFO lights spinning around on its disc."*
>
> *"The fighter needs lights blinking on the wingtips."*

## The rule

**A ship's row authors its lights (`lamps`): where each stands, the pictures it shows in turn, how long each
holds, and how fast it spins. The frame lays them on the ship every step it flies, and the pad lays them on
it too.** The fighter has a strobe on each wingtip; the caddie has a ring of twelve coloured bulbs round its
disc that spins once in two seconds while its colours step a bulb every fifth of one, so the lights chase.
The three cars have none.

| | |
|---|---|
| **the row** | `lamps` on `ShipRow`, read through `lampFrame` and `lampTurn` — the clock the frame and the pad share, on the rims' terms (0557) |
| **the fight** | `stepWheels` lays them after the turning wheels, in the same pool: no ship has more of the two than the pool holds (`tests/lamps.test.ts` walks every ship on every rim it can wear), and both are a picture laid on the ship to the painter. A light does not take the hull's hurt twin |
| **the pictures** | `navStrobe` and `navDark`, white and added (`LIGHT_KINDS`); `ufoLights0` and `1`, the ring in its two colourings, painted over the disc |
| **the pad** | the strobes laid as the fight lays them, from the game's own pictures at the pad's size. The saucer is seen edge-on there (`paintSaucer`), so its ring is drawn as its bulbs running along the rim's near edge, each brighter as it comes round to the front (`ufoBulb0`…`3`) |

## Why one pool

0022's ceiling is spent to the entity (`tests/budget.test.ts`), and the wheels' two were the only slots laid on
the ship that the lit ships were not using: the fighter and the saucer have no wheels, and the cars have no
lights. Sharing it costs nothing and moves no other pool. A ship that one day wants both turning wheels and
lights past the pool is a decision, and the test says so the day it is written.

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md): what else shares this space. Both lights sit a wing's
length from the ship, where the bullets the player is dodging arrive.

- **The strobes are white, not a navigation light's red and green.** A red point blinking beside the ship is an
  enemy bullet arriving, in the one ink that means it. An aircraft's wingtip strobes are white anyway.
- **The ring's bulbs are the player's cyan, the ray's lavender, the hazard's gold and the pickup's mint** — no
  red and no acid. They are on the disc, inside the ship's own outline.
- **The bulbs are painted, not added.** Added over the saucer's pale green every one burned to the same white,
  and the ask is for colours.

## What guards it

`tests/lamps.test.ts`: the pool shared and never overfilled; the fighter's wingtips flashing at least twice a
second, both together, at the wingtips; the caddie's ring turning forward at least a third of a turn a second,
its colours stepping; no light on a ship without any; every picture reached by its clock. Probes in
`scripts/probes/0586-the-ships-are-lit.mjs`.

## Owed

A look at both in the fight at the shipped camera, on a bright place and a dark one.
