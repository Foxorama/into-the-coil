# 0514 — The fish sheds off its flanks

**Accepted 2026-10-04.** A report on [0480](0480-damage-sheds.md), the day it landed:

> *"something messed up the fish boss, the adds it spits out of it's mouth are now weirdly tiny and no
> longer fire bullets. they were really good before and now they're just bleargh."*

## What it was

Nothing had changed in the adds. The kite and minnow rows, the fish's phases and `summonAdds` were the
same as before the boss-look pass, and `scripts/weigh-threat.mjs volans --sweep=6` on main and on the
0.4.0 build counted the same fight: 116–154 adds called, 8–95 shots fired by them depending on the gun,
lives of 0.3–0.7 s, both builds.

What had changed is 0480. A hit sheds a fragment **from the rim that faces the ship, flying out towards
it**, five a second under any gun. The fish is the one end boss that stalks the player's lane
([0258](0258-one-pilot-a-level.md)), face-on, so its rim facing the ship is its **mouth**, and
[0373](0373-the-fish-spits-its-adds.md) made the mouth the door its adds come out of. Under sustained
fire the jaw put out an ember every twelve steps at the player: small, dark-orange, and harmless. On the
bench (`rig/bench.html`, the ship moved back to its usual place), the mouth on main showed a steady
spray of `shedEmber` against two or three real kites. That spray is what the report calls the adds.

This is [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)'s shape the other way
round: the picture showed something the model treats as debris, and it was reported as a fault in the
adds, which were fine.

## The rule

**Where a fragment leaves is the row's.** `BossRow.shed` becomes `{ sprite, from: ShedFrom } | null`;
`ShedFrom` is `'facing'` (0480's throw, unchanged, which every other lord keeps) or `'flank'`: off a
side, a quarter to three-eighths of a turn round from the ship, flying further round and never back
towards it. [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md): shared code holds
both throws, and each row says which is its own. The fish's is `flank`, so its embers come off its fins
and back, the fins look like they are burning, and the mouth is left to the adds.

The facing throw draws exactly what it drew before, on the same `shedRng` stream
([0021](0021-one-stream-per-concern.md)), so the six other lords shed as they did.

## Considering the screen

[0295](0295-a-ranking-guard-is-a-content-limiter.md) asks what shares the space. On the fish, the
space in front of its face holds the spine rake, the kites and the minnows, all leaving the mouth at
the player. A fourth stream there of a body with no reach was the confusion. Off the flanks, the
embers share the space with the aura's flames, which are decoration too, and fly away from the ship.

## The guard

`tests/shed.test.ts`: for a `flank` row, no fragment starts on the ship's half of the hull or flies at
the ship. Measured as a direction against the line from the hull to the ship, which is how the player
reads *it came out of its face at me*. Probe `scripts/probes/0514-the-fish-sheds-off-its-flanks.mjs`
throws the flank straight at the ship and sees it go red: 25 of 25.

## What this does not do

It does not answer whether the fish's adds are good enough. They are what they were, and 0373's numbers
still stand. If the play still finds them weak once the embers are out of the mouth, that is a separate
report.
