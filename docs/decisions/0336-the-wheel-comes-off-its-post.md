# 0336 — The wheel comes off its post

**Accepted 2026-09-18.** **Amends [0332](0332-the-gyre-is-set-into-the-wall.md)** — the gyre's phases
move to the shares the ask names, and the spike stops being a tell for one second in three.
**Amends [0335](0335-the-fight-happens-in-a-room.md)** — *a boss has an aura or a seat and never
both* was true when it was written and is not now. **Builds on
[0333](0333-a-wall-arrives-whole.md)** — the owed-wall queue turns out to be what makes this safe.

## The ask

> *"At 75%, 50%, 25% health the cog pops out and spins in a circle like the fireworks on fence posts
> spraying fire in a pinwheel style over 360° for a second or two"* — and the pop is *"the cog coming
> out of the screen towards the actual player as a turret popping up, spraying, sitting back down
> again."* With it: *"we also need updated damage graphics for it as it gets hurt and set on fire."*

## The rules

**A phase may open with a pinwheel.** `BossPhase.wheel`: it rises out of its seat, sprays a turning
spoke of fire, and sinks back. **The gyre's phases are 0.75, 0.5 and 0.25 now**, because three health
shares and three phase rungs are one ladder or they are two that drift — so **a wheel IS a phase
turning over**, and what comes back after the spray is a body more broken and more alight. The old
0.7 and 0.4 were never argued for beyond *three phases*.

**The pop is a scale, and the scale is also the hurtbox.** There is no axis out of the screen, so
`swell` is how a top-down game says *toward you* — and a body drawn a quarter larger than it collides
is [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)'s own defect, so the radius
moves with it and back. It costs no lane room: a lunge down the lane would have spent every unit
[0101](0101-the-sky-is-a-hurry-and-the-boss-holds-back.md) holds.

**The spray is a spoke that turns, not a ring that expands.** A ring is `BossAttack`'s own arm and the
jellyfish throws one; a Catherine wheel emits from a point that is going round, so the shots lie on a
spiral and the gaps between the arms are the way through.

**No wall leaves while the hull is spinning, and the wall is owed rather than lost.** 0332's spike
names the edge the next wall comes in over; through a wheel it names nothing, so a wall thrown into
one would arrive over an edge nobody was told about. 0333's queue is already the answer — and **the
hull has to be back ON its point, not near it**, so what the player sees is the cog clicking round to
its next tooth and then throwing.

**A hull may burn, and how much is the escalation.** `BossRow.burn`: two flames when the first phase
turns over and seven when the bar is empty, in the layer behind the hull — which on a disc fifty-two
units across is exactly its rim. **The seat keeps the first slot**, so the mounting is under the
flames and the flames under the cog.

## The figures

| | |
|---|---|
| the wheel | 0.3 s up, **1.1 / 1.4 / 1.7 s of spray**, 0.3 s down |
| the pop | ×1.25 → ×1.35, drawn and collided; `station − radius` 105 against 0101's floor of 98 |
| the spin | 0.16 → 0.2 a step: two and a half turns while it is up |
| the spray | 2–3 spokes, 1.5–2 turns, a shot every 4–5 steps — 34 to 60 shots |
| the fire | from 0.75, two flames to seven, at 22 units — the cog's own tooth circle |
| the bodies | four: whole, chipped, broken, burnt — one box, `boss11Burnt` new |

## ⚠️ What the measurement changed

**The first wheels were two and a half seconds each and they ate the fight.** No wall may leave while
one is up, so every step of a wheel is a step the walls do not get — and three of them filled **eight
of the nine seconds** a shuriken at four rungs takes to kill the gyre. It threw **one wall in its
entire fight**. `scripts/weigh-walls.mjs` is where that is read; at the lengths above it throws four,
and every other gun-and-tier cell is between four and eighteen with **nothing arriving short**.

⚠️ **AND A NINE-SECOND FIGHT STILL CANNOT HOLD BOTH**, which is stated rather than hidden: a player
at the cap gets a fight of pinwheels and a player below it gets the walls as well. That is
[0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md)'s own trade — a heavier loadout shortens
the fight — and whether it is the right one here is a play question.

**And the fourth phase's FAN broke the fairness floor, which taking the wheel apart is the only way
to know.** A fourth phase wanted a fourth rung of fan, so it first carried 48 steps, seven shots and
a spread of 1.6 — and `tests/crowd.test.ts` found **a step at `savior` with nowhere on the lane both
safe and reachable** (0270's floor, which is not a taste and not a tier's business). The spokes were
thinned from three to two first and it stayed broken; the fan put back to the third phase's 54/7/1.4
cleared it with three spokes intact. **What escalates over the three wheels is the spray's length,
the spin and how far it comes out of the wall** — the fan had run out of room two phases ago and
nobody had measured it.

**Two guards had to move with it.** 0333's wall guards drove the shuriken at four rungs because it
was the fastest kill; with the wheels in, that fight throws one wall and the fixture measured almost
nothing. They drive the pulse at four rungs, which owes seventeen walls and throws nine over thirty
seconds — the queue carrying a backlog the whole way, which is what those guards are about.

## ⚠️ And a probe found a claim nobody was making

*No wall leaves while the hull is spinning* was aimed at 0332's `and the wall comes from the edge the
spike is aimed at`, and **it stayed GREEN with the gate broken**. That guard collects the first eight
walls off a steady bleed; whether any of them happens to land inside a hundred-step wheel is luck.
The claim has a guard of its own now, driven as an invariant over a whole fight from full to empty.
[0005](0005-a-guard-must-be-seen-to-fail.md) is the only reason it was found.

## ⚠️ And the fire pointed the wrong way

Every flame is one bitmap of leaning tongues, and a ring of them drawn unturned all leaned the same
way — a comb round the hull rather than a fire in it. Each is turned to point away from the hull
now, which [0306](0306-the-serpent-coils-in.md) makes a one-line change. The sheet said so; no guard
could.

## What is owed

- **The fight flown.** Three pinwheels and a burning cog in a stopped room is a different fight from
  the one measured, and no guard here measures how it feels —
  [0027](0027-measure-the-picture-not-the-model.md).
- **Whether the wheels should crowd out the walls at the cap.** Named above; it is a play verdict.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Two fields on content types, one on
the world, six sprites; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0336` — seven probes, seven red.
