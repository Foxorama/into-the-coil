# 0648 — The ball runs hot: half again on a boss, a dance banked, the heat on the ball, and a wheel for a dash

**Accepted 2026-10-24.** From a handwritten page of Hamster Ball feedback. Amends
[0646](0646-the-ball-hits-the-boss-harder.md)'s 3.04, [0613](0613-the-dance-is-earned.md)'s full bar that holds and
[0615](0615-the-ball-is-solid.md)'s twenty, [0639](0639-a-boss-heats-the-ball-less.md)'s and
[0593](0593-the-hamster-ball-rolls.md)'s heats, [0638](0638-the-ball-says-its-heat.md)'s gauge colours, and the
ball's dash, which was the saucer's orbit. **Amended by [0654](0654-the-dance-charges-slower.md)**: the bar fills in
twenty-two landings, not eighteen.

## The ask

The page, line by line:

> *"+50% boss damage"*
>
> *"war dance +10% charge meter"*
>
> *"war dance adds a spesh + starts charging again"*
>
> *"ball goes yellow, amber, red based on heat"*
>
> *"heat gauge +10% slower to fill"*
>
> *"same kind of interior console for the weasel to pilot with → needs to look super cool"*

And with it: *"Auto merge it all, just make sure the interior console and 'heat' glows look hella cool."*

## The rule

| | |
|---|---|
| **boss damage** | the ram's `bossWeight` 3.04 → **4.56**; the serpent's own entry 2.4 → 3.6 and the jellyfish's 3.84 → 5.76, the same half. **The seven mid-bosses keep `ram: 1.9`** on their own rows |
| **the bar** | `charge.fill` 20 → **18**: twenty over 1.1, to the nearest landing — a tenth quicker to fill |
| **a full bar** | no longer holds. It **banks one War Dance on the gun trigger's stack** (`onEarned` → the run's `took`, as a pickup's charge goes on) and starts again from empty, a landing past full carried. Thrown, it is the top of the stack, as any charge. Still heard, felt and flared round the ship as it fills; still nothing fills while the ball dances; a life still opens on an empty bar |
| **the heat** | every way the gauge fills divided by 1.1: a landing 0.15 → **0.136**, a boss's 0.11 → **0.1**, a scrape 0.01 → **0.009**. Cooling untouched |
| **the heat on the ball** | `ramGlow1`–`4`, laid OVER the ball by the frame as its lights are (`heatGlow`, in `stepWheels`): from the gauge's first quarter the rim and a wash rising to it go **yellow** (`hazard`), from half **amber** (`bullet`), from three quarters **red** (`fire`) with heat-haze ripples, a white-hot crescent and sparks, throbbing between two frames at 2.5 a second. Nothing while cool, while dancing or coming apart. The glow under the ball (`drawRamHeat`) stays, stronger |
| **the readout's heat** | the gauge is yellow, amber from half, red and pulsing from three quarters — the ball's three at the ball's quarters. The plate's glow goes the same colour (`data-heat` on the readout), red breathing |
| **the dash** | the ball's own, **`wheel`**, still called *Hamster wheel*: the wheel Unity runs in, face-on — hub, six spokes, two rims, the rungs — spinning round the ship's face, and its rungs running under the counts as a treadmill. It goes the heat's colour with the ball and spins faster as it heats (2.4 s a turn cool, 0.7 s red). Hung on the ship's group, not the plate, so it stays round the ship's face when the cockpit monitor wraps the plate in three rows. Still under `prefers-reduced-motion` |

## Why it is built the way it is

### *"+50% boss damage"* is the end bosses' number

0646's ask said *"don't change miniboss damage"* and put the end bosses' and the mid-bosses' numbers on different
rows to keep it. This ask says *boss*, on a page that has the word *miniboss* in its vocabulary; nothing in it brings
the mid-bosses back in, so they stay at 1.9. If the play meant both, it is seven numbers on seven rows.

### *"+10% charge meter"* is read as a tenth quicker

Every other line on the page is a help to the ball — more damage, a dance banked, a slower gauge — and the heat line
says *slower to fill* where it means slower. A bar a tenth bigger would be the one line making it worse, unasked.
Eighteen is 11% quicker than twenty, the nearest landing.

### A full bar banks rather than holds

*"Adds a spesh + starts charging again"*: a dance is a charge the ball carries, the same thing every other ship's
special is (0373's stack), and the bar is how it is earned. So the bar's full state is gone rather than kept beside
a stack — a bar that holds and a stack that also holds would be two answers to *how many dances do I have*. What the
bar's hold used to do is done by the stack: the readout's count is the stack's (0613 added a full bar to it), the
pyre counts it (0079), the press throws its top. `throwEarned`, `chargeFull` and `spendCharge` are deleted.

**No cap.** The stack has none for any ship (the pickups' charges are not capped either), and a ball that keeps
ramming without throwing has earned what it carries. If banking makes the dance too common, the bar's `fill` is the
lever, and the play is the instrument.

### The heat is drawn ON the ball, because under it the rim stayed blue

The glow under the ball was already hazard, bullet and fire in its last three stages. What the player saw was a
blue ball: the glow sits under the plastic, Unity and the rim, and the rim — *what says ball* — is the plastic's
own ink at 0.85. A heat that changes what the ball looks like has to be laid over it. The ship's lights already are
(0586), in the wheels' pool, which the ball had empty; the heat is the last picture in it, swelled with the ball's
punch (0613). Inside the ball's outline, as the glow under it is, so it covers no bullet the ball does not.

The rim's alpha was looked at, not solved: at 0.55 over the plastic's cyan the yellow read green in the bench, at
0.82 it reads yellow. `npm run dev` → `/rig/bench.html?ship=ball&proof` and `__bench.heat(0.6)` in the console holds
the gauge there to look again.

### A dash of its own

*"Same kind of interior console"* is the dash the other ships wear (0451, and the hot rod's own in 0545); the ball
borrowed the saucer's orbit. A hamster ball's console is a hamster wheel, and the ball's face in the readout sits in
it. The heat on it is the line that makes it the ball's and not a theme: the console heats as the ball does.

## What guards it

- **`tests/charge.test.ts`** — a part-full bar banks nothing; a full bar banks one War Dance and starts again, and
  a second bar a second; the readout climbs and empties with the bar it banked; nothing landed while dancing fills
  the next. The window guards (seconds a bar, 0613) count every landing across a bank.
- **`tests/ball.test.ts`, *0648*** — the ball wears no glow cool and yellow, amber and red at the gauge's quarters,
  on the ball; red-hot it throbs between one and three times a second.
- **`tests/lamps.test.ts`** — the wheels' pool holds the heat on top of a ship's wheels and lights.
- Probes in `scripts/probes/0613-the-dance-is-earned.mjs`, re-anchored on banking: a bar that banks early, a full
  bar that banks nothing, one that holds full, a dance that fills it. The 0476, 0526 and 0595 probes are re-anchored
  on the new boss rows.

## Not held by any guard

- **Whether half again is right**, or a tenth on the bar and the gauge. The play decides.
- **The dash's look**, and the heat's. Looked at in the bench and the hangar (1280×720 and a phone's 844×390), not
  played.
- **A ball that banks many dances.** No cap, on purpose; owed a look in a long fight.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): no storage key or schema moves. A banked War Dance is a
`SpecialKind` on the run's stack, which the save already stores for every other ship.
