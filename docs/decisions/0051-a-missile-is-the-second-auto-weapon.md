# 0051 — A missile is the second auto-weapon, and a launcher is a place on the ship

**Accepted 2026-08-06.** The second item on the list asked for after the two-level play-test:
*"missiles — a second auto-weapon. Slower than the pulse, 3× its damage, fired from launchers on the
ship. The base ship has one, at the middle; the first upgrade adds one on the `across`-minus side and
the second on the `across`-plus side, and those two pop out before they straighten."*

## The rule

| | |
|---|---|
| **what it is** | `SHOTS.missile` — three times the pulse's damage, slower than it, bigger than it |
| **who owns it** | the **ship row**: `missile` and `missileEvery`, beside `shot` and `fireEvery` |
| **what fires it** | nothing. It is auto, on its own clock |
| **a launcher** | a position: **centre**, then `across`-minus, then `across`-plus. Capped at 3 |
| **the side tubes** | pop out to `LAUNCHER_POP` and then straighten — the flanker's mechanism |
| **the upgrades** | `missileRate` and `missileSpread`, two more pickups, two more rows |
| **the pool** | its own, 24 slots, out of the particle share |

## Why it is a base weapon and not an arsenal entry

⚠️ **`docs/game.md` splits the two on whether the player pulls a trigger**, and a missile does not:
it fires itself, it needs no input, and `src/content/actions.ts`'s *there is no `fire` action and
there must never be one* is about **every** auto-weapon rather than about the pulse in particular. So
it goes on the ship row beside the pulse, and a second ship carrying a different missile — or none —
is a table edit. The arsenal is still empty, and the bomb is still the thing that will fill it.

## Why its own pool, when it meets exactly the same two pools the pulse does

⚠️ **Because of exhaustion, not collision.** Sharing `playerShots` would cost one pairing fewer and
would let a full volley of pulses starve the missiles — which is precisely the failure
`src/content/pickups.ts` records reaching play as *"two streams of bullets are continuous and the
other streams slow down and it's a bit weird."* A weapon with its own budget cannot be crowded out by
the other one.

The arithmetic is the same one `MAX_BARRELS` answers, and it is now written down for both weapons:
`launchers × flight ÷ missileEvery` — three tubes, ~130 steps in flight on the widest view the aspect
clamp allows, a floor of 20 steps between volleys — which is **21 in the air at once against a pool of
24**. `tests/pickups.test.ts` drives the strongest loadout there is and fails if either pool fills.

⚠️ **And it measures at the WIDEST view now.** A shot is culled at the edge of the screen in front of
the player ([0048](0048-a-threat-may-arrive-from-the-side.md)), so a 21:9 monitor keeps one in flight
half as long again as the 16:9 fixture the guard used to run at. Measured there it reported a peak the
widest device never sees — a guard passing while the thing it guards is broken for a third of the
players.

The 24 slots come out of the **particle share**, on the same terms and for the same reason as the
shell's three ([0050](0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md)): a
second weapon is not a cosmetic, and 0022 names particles as the one share that may shed.

## The launchers are positions, and that is what makes the upgrade visible

⚠️ **Centre, then minus, then plus** — the ask's own order, and it matters because it is how a player
sees what they picked up. One tube is a ship that fires down its own centreline; two is visibly
lopsided; three is symmetric. An upgrade that added a missile *somewhere* would be an upgrade the
player has to take on trust, and `docs/game.md` says every upgrade changes how the ship looks.

⚠️ **The pop is the flanker's mechanism, not a second one.** A side missile leaves with an `across`
velocity and a `steerAcross` target, and straightens when it has passed it — the same *have I passed
it* test `steerEnemies` uses, for the same reason: a body crossing at half a unit a step steps over
any tolerance band you pick.

⚠️ **Both halves of the pop are load-bearing and each has its own probe.** A missile that never
straightens is a **spread weapon** — it keeps crossing the lane, so position stops mattering and the
fan the pulse owns is duplicated. One that never pops is three missiles in a line, and the launcher
upgrade becomes invisible. Both look deliberate in motion.

## The two new pickups, and the fill that pairs them

`missileRate` and `missileSpread` are ordinary pickups: rows in the table, entries in
`UPGRADE_KINDS`, cleared by a death like every other upgrade.

⚠️ **Each is drawn as its partner's silhouette with the fill inverted** — a holed square is *shoot
faster* and a solid one is *missiles fire faster*; a solid hexagon is *another barrel* and a holed one
is *another launcher*. The family says which weapon a pickup is about and the fill says which of the
two it is. That is a shape cue rather than a colour one, which
[0024](0024-the-accessibility-floor-is-settings.md) requires — and it is chosen with the next change
in view: `docs/state-of-play.md`'s cycling pickups make a pickup on the field alternate between the
two faces, and a pair that reads as one object in two states is what that needs.

⚠️ **They are authored later in each level than the pulse upgrades.** A player meets the pulse and its
two upgrades in the opening minute; the second weapon fires itself from the first frame, so what is
left to learn is that a different pickup family changes it. Handing both families out at once makes
the first four pickups a lottery.

## What `npm run prove` caught

⚠️ **A guard that tested the caps *between them* rather than *each* cap.** *"An upgrade that has
nowhere left to go spends itself on damage"* stacked twelve of every upgrade at once and asserted the
damage fields had moved — and they had, because the rate upgrades overflow into the same field the
launcher ones do. Deleting the launcher's overflow entirely left the suite green. It runs one kind at
a time now, twenty of it, and asserts that the twentieth still bought something.
[0005](0005-a-guard-must-be-seen-to-fail.md).

## What was rejected

**A `spread`-style fan of missiles.** The pulse already owns the fan, and two weapons doing the same
thing at different damages is one weapon with an extra number. The launchers spread the *origins* and
then the missiles fly parallel, which is a different shape on screen and a different thing to aim.

**Missiles as an arsenal special.** They would need a trigger, and `docs/game.md` is explicit that
auto-fire is the base weapon **and every upgrade to it**. A missile the player has to fire is a
different game, and it is the one thing the product definition says this is not.

**Tuning the missile's speed as a fraction of the pulse's.** `src/content/shots.ts` bans ratios
against `SHIP_SPEED` because the dodge margin must not be invariant under it — and while a missile is
the player's own weapon rather than a threat, its speed is still what decides whether a player can
outrun their own shot. It is absolute. The **damage** is the ratio, because *three times the pulse* is
exactly what was asked for and it is a relationship between two of the player's own weapons.

## Confirmed, not assumed

`npm run prove 0051` — every guard broken on purpose and seen to fail.

| broken | what went red |
|---|---|
| the missile's damage written as a number rather than as three pulses | `carries three times the pulse's damage` |
| the missile cadence dropped to the pulse's, so the two weapons stop being different | `fires less often than the pulse does` |
| the missiles put on the pulse's clock | `keeps its own clock` |
| every launcher firing from the centreline, so a launcher upgrade is invisible | `puts the second tube on one side and the third on the other` |
| the side tubes never straightening, so the missiles fan across the lane | `pops the side tubes out clear of the hull, then straightens them` |
| the side tubes firing straight, so nothing pops clear of the hull | `pops the side tubes out clear of the hull, then straightens them` |
| a missile upgrade wired to the pulse's barrels | `a missile upgrade never moves the pulse` |
| a launcher past the cap spending itself on nothing | `spends an upgrade that has nowhere left to go on damage instead` |
| the missile fire floor dropped below what the pool can hold | `a volley is never truncated` |
| missiles culled with the content, so they outlive the screen they were fired into | `is culled at the edge of the view` |

The picture was looked at as well as measured: `scripts/shot.mjs` at 1280×720 and at 640×360 for the
two streams leaving the ship together, and the title screen's key — which draws the real sprites — for
the six pickup silhouettes. The missile went from 2.8 world units to 3.4 on the strength of the second
one.
