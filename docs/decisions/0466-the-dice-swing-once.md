# 0466 — The dice swing once

**Accepted 2026-10-03.** Item 2 of
[the chrome and the ships, reviewed](../../reports/the-chrome-and-the-ships-reviewed-2026-10-03.md),
a play report on [0461](0461-the-ships-are-jazzed.md)'s fuzzy dice:

> *"the dice on the hud need to look a bit cooler, and they should start to sway on a forward burst or
> hard break, but it should trigger an uninterruptable sway, at the moment they jerk around all over
> the place because the player is constantly going back and forth."*

And, asked which: *"dice — yes; dice colour — classic red fur."*

## The rule

| | was | is |
|---|---|---|
| **a lurch** | the ship's speed along the lane changing by 0.2 in a step, in a new direction | the speed **crossing** a mark: up past 0.6 of `SHIP_SPEED` (a burst) or, after one, down past 0.2 of it (a brake) — `DICE` in `src/content/ships.ts` |
| **a lurch inside a swing** | restarted the swing from nought | **refused**: the frame holds for the swing's length, 1.8 s, and the chrome's animation is that same number |
| **the die** | a flat square of the light ink, dark pips, a hairline strand | a **cube** seen from a corner — a lit top face, a shaded side — in the classic **red fur**, with a bloom of its own colour round it and light pips shadowed; the strand a touch thicker |

## Why it jerked

Two causes, and the second is the one that showed:

- **The frame fired on a reversal.** A change of 0.2 in a step in a new direction is 0461's lurch; a
  full reversal changes the speed by 0.68, so a player going back and forth across the lane fired
  back, fore, back, fore, as fast as the stick turned. 0461's own note said a stop on the heels of a
  push swings at once.
- **The chrome restarted the swing from zero.** `swayDice` swaps the swing's class, and a new class
  starts the animation at its first keyframe, `transform: none`. Dice at thirty degrees snapped to
  straight and swung out again. That snap is the jerk.

## Why it is built the way it is

**A lurch is a crossing, not a change, because the ask names a burst and a brake.** `flyShip` closes a
fifth of the gap to the ask each step, so a full push from rest crosses 0.6 of top speed on its fifth
step and a full stop crosses 0.2 on its eighth; half a stick each way reaches 0.85 of 1.7 and crosses
neither, so a player working the ship about the lane never swings the dice. The burst mark arms the
brake and the brake disarms it, so a brake needs a burst before it — a stop from a dawdle is not a
brake. The burn between two places is still a burst, as 0461 made it.

**The hold is the frame's, in steps, and the animation's length is the same number.** The frame
counts `joltHold` down once a step and fires nothing while it is above nought — so the swing is
uninterruptable in the sim's own clock, which `tests/dice.test.ts` can drive without a browser, and
a hidden tab or a dropped frame cannot shorten it. The arming is read on every step whether or not
the hold is on, so a burst inside a swing still sets up the brake that follows it; only the firing
waits. `DICE.swingSeconds` is written once, read by the frame for the hold and interpolated into the
stylesheet for the four swings, because two copies of 1.8 would be the next thing to drift.

**The direction is the ship's.** A burst forward swings them back and a brake from forward swings
them forward, as before; a burst into reverse swings them forward and a brake out of reverse swings
them back, which 0461 could not say because it read a change and not a speed.

**The fur is a colour no palette role carries.** The chrome's inks are roles, so the classic red is
the enemy's ink warmed toward the shot's orange and deepened, mixed by the shell from the
palette as the readout's own inks are ([0451](0451-the-readout-wears-the-ship.md)), and the
high-contrast palette answers it as it answers both. It is set on the dice themselves: the first draft
mixed it in the stylesheet from the score's two reds, which are set on the screens' root, and the
readout plate is not under that root — photographed, the dice were two strands and no dice, because a
`color-mix` over an unset variable takes the whole background with it. The cube's top is that red
lit toward the light ink, its side shaded toward the void; a `drop-shadow` filter blooms the whole
cube in its own colour, which is what *fuzzy* reads as at twenty pixels, where a dotted edge is
noise. The pips are the light ink over a darker pip offset a hair down and right, so each is embossed
rather than printed.

**A hairline of the light ink round every face, and a halo of the void under the bloom.** Asked
for while this was built: *"the red dice need to be visible on ember nebula and the dark heart
against those reddish backdrops."* Red on a rose sky is found by its edge, as the counts are by their
void halo; photographed on the bench in Ember Nebula over its orange columns and in the Black Heart
over its arteries, the pair reads in both.

## What guards it

[`tests/dice.test.ts`](../../tests/dice.test.ts), driven through the real frame with a hand on the
stick, 0461's two kept and three added:

- **THE ASK: a second lurch inside a swing moves nothing**, and the next after it settles swings
  again;
- **a stick wagged about the middle moves nothing** — half a stick each way, twenty turns;
- **a full reversal at speed is one brake**, and the burst back out is inside its swing.

Each was seen red by [its probe](../../scripts/probes/0466-the-dice-swing-once.mjs):

| broken on purpose | went red |
|---|---|
| the hold taken off the swing | `THE ASK: a second lurch inside a swing moves nothing` |
| the burst mark lowered to where half a stick reaches | `a stick wagged about the middle moves nothing` |
| a burst raised on every step at speed once the swing settles | `THE ASK: a hard push swings them back once, and a hard stop forward once` |

0461's two probes are re-anchored on the rewritten `stepJolt` and go red through it.

## What it does not do, and what the player may veto

- **The marks are a taste.** 0.6 and 0.2 of top speed, 1.8 s; each is one number in `DICE`.
- **The cube and the fur are a taste**, as 0461's dressing was.
- **A climb or a dive is still not a lurch.** The ask was a burst and a brake along the lane.

## Rollback

Nothing irreversible: no storage key, no save shape, no cache name.
