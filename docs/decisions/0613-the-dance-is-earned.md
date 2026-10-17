# 0613 — The dance is earned

**Accepted 2026-10-17.** From a play of [0593](0593-the-hamster-ball-rolls.md)'s Hamster Ball after
[0609](0609-the-ball-takes-its-knocks.md). **Amends 0593**: the ball's War Dance is no longer stocked.

## The ask

> *"hamster ball needs some haptic feedback or something for when you hit a ship or an enemy, but it can't be
> overwhelming because it's a lot and I think we need to change it's special to be a charge bar, when you kill x
> amount of enemies or do x amount of damage (so that bosses count) you refill your special to do the war dance.
> it currently has no aoe so feels like it needs something a bit more interactive there. I'm not sure on what the
> cap should be for a war dance refill, maybe 10-15 enemies/hits or damage or something. it should allow you to
> war dance every 10-15 secs or so I think"*

## The rule

**The Hamster Ball's War Dance is a bar its ram fills: every landing is one, on a body or a boss alike, and
twenty-four fill it. A full bar holds until it is thrown, is thrown before anything on the gun trigger's stack,
and is heard, felt and seen; nothing fills it while the ship dances, and a life opens on it empty. Every landing
the ball makes is felt in the hands — lightly, at most one pulse a tenth of a second — and seen as a punch of
the ball. Every wall and every body a dancing ship meets sends out a shockwave that lands once on everything
its edge crosses.**

| | |
|---|---|
| **the bar** | `charge` on every ship row (`Charge`, `src/content/ships.ts`): `{ fill: 24 }` on the ball, `null` on the rest, which stock their special as they did. `chargeRam` in `settleRam` fills it by the step's landings; `chargeFull`, `spendCharge`, `chargedSpecial` and `throwEarned` are what the shell asks |
| **the opening** | `startingArsenal`: a ship whose row earns its special opens on none of it — the empty bar is its stock — and reads its own special whatever a document says is fitted |
| **the press** | `onSpecial` asks `throwEarned` first: a full bar on that trigger is thrown and emptied; a full bar inside a dance is refused and costs nothing (`canThrow`); a bar not full is no charge, so the press falls to the stack, and over an empty stack it is today's silence |
| **the readout** | a frame and a fill beside the gun trigger's count (`setCharge`, on the boss bar's terms), lit and glowing when full; and at the foot of the gun trigger's disc on a touch screen. A full bar is one more on the count, and its face is the War Dance's (`stacksOf`). `onCharge` fires on a change of a twentieth (`CHARGE_BAR_STEPS`) |
| **full** | `danceReady` (a struck fifth over the flare's breath), its twin `charge-fills`: the readout lights and the dance's flare licks once round the ship (`readyFor`, `stepAuras`); and the `ready` feel |
| **the hangar** | `specialOpen` fits the ball with no other ship's special, and `specialWhy` and `optionWhy` say *"The Hamster Ball earns its War Dance by ramming"*. Every other ship still borrows the ball's War Dance and stocks it |
| **the pyre** | a full bar is one more charge the wreck throws up (`onWreck`, 0079) |
| **the feel** | `onFeel` on the world, named by the step: `knock` a landing, `smash` a kill or a landing on a boss, `ready` the bar full, `burn` the heat burning a shield. `src/content/feels.ts` is the table; `attachRumble` in `src/app/pad.ts` plays it on every pad with a `vibrationActuator` (`dual-rumble`), or on a phone's motor (`navigator.vibrate`) on a screen a finger lands on |
| **the knob** | *Rumble*, On and Off, on Settings beside the sound (`src/content/rumble.ts`, `rumble` on the settings slice, kept in `itc_settings`). Turned on, it taps once so the player feels what it is |
| **the punch** | the ship and the heat under it drawn a tenth bigger the step the ram lands, settling back over six steps (`punchShip`, `swell`) |
| **the shockwave** | `wave` on the dance's row (`Wave`), `SHOTS.danceWave`: radius 14, damage 3; its edge grows from the dance's reach (3) to 14 over 9 steps and fades for 6; one at most every 12 steps (`waveIn`). `sendWave` at `bounceDance` and at every step the dancing ram lands; `stepWaves` lands its edge |
| **the pools** | the blasts fifteen from thirteen, the enemy shots 193 from 195 — the pools total 500 (`tests/budget.test.ts`) |

## Why it is built the way it is

### The bar counts landings, before any boss's weight, and a kill is worth no more

*"Kill x amount of enemies or do x amount of damage (so that bosses count)."* Three coins were open: kills,
damage after the boss's weight and window, and landings. Kills leave bosses out, which the ask rules out. Damage
after the weight is the boss's own arithmetic: the ram's `bossWeight` was solved (0609) so that a held ram
finishes a fight in forty-eight to sixty-two seconds, which makes a boss's health a hundred times an enemy's and
every number about it a statement about that one fight. **A landing is the ram's own unit** — the thing its
heat, its sound and its clock already count — and it is the same thing on a drifter and on a hull.

**And the heat is what makes a level and a boss charge at the same rate.** A landing heats the ball 0.15 and a
full gauge burns a shield, so a ball that keeps ramming without burning itself out is limited by its gauge, not
by what is in front of it. Measured (below), the heat-minding pilot lands 0.9 to 1.9 times a second in a level,
1.7 to 2.3 against a mid-boss and 2.1 to 2.8 against an end boss: the same order everywhere, because the same
gauge sets it. Counted after the boss's weight, the boss would charge at 1.6 times that and a window several
times more.

**A kill on top was measured and refused.** In a level the pilot kills 0.4 to 1.2 bodies a second and against
a boss almost none, so a kill bonus of one landing would have charged a level up to three quarters again as fast
as the boss it ends with — widening the gap the heat closes. A kill is the landing that made it; *"10-15 enemies/hits"*
is the same coin either way.

### Twenty-four, measured in every case it runs in

A scratch flight over `tests/world.ts`'s `playableWorld`: the ball unhittable, its tubes silenced, flown by two
pilots — **pressing**, which chases the nearest body (the hull when a boss is up) and never lets go, and
**heat-minding**, which chases until the gauge is at 0.85 and then backs off down its box until it is cool. The
fixture makes the ship unhittable, so a pressing ball's gauge holds at full and never burns; flown with the heat
burning and nothing else hurting, the pressing pilot burns **6 to 39 shields a minute in a level and 40 to 95
against a boss** — no ball survives that, so pressing is a ceiling and not a way to play. The heat-minding pilot
is the slowest way to ram, so its seconds are the most a bar takes. Landings a second, Savior (Legendary and
Burn within a tenth either way, and Burn's slower fights no slower per second):

| | heat-minding | pressing | a bar at 24, heat-minding |
|---|---|---|---|
| The Approach, between bosses | 1.44 | 3.67 | 16.7 s |
| The Descent | 0.92 | 1.57 | 26.1 s |
| Coilward | 1.94 | 4.96 | 12.4 s |
| The Batteries | 1.74 | 1.67 | 13.8 s |
| The Eye | 1.53 | 4.41 | 15.7 s |
| the mid-bosses (five measured) | 1.74 – 2.29 | 5.1 – 8.4 | 10.5 – 13.8 s |
| the serpent, alone | 2.12 | 9.2 | 11.3 s |
| quetzal, gyre, hoarfrost, hydra, medusa, alone | 2.06 – 2.81 | 9.4 – 9.9 | 8.5 – 11.6 s |
| **Volans, alone** | **8.55** (its adds) | 9.5 | **2.8 s** |

The Shoal and the Gauntlet are left out of the heat-minding column: the pilot backs into their stone, which
scrapes the gauge hot (0593), and it never cools — a pilot's fault, not the bar's. Pressing, they are 3.36 and
3.93. A pressing ball in a level fills the bar in five to fifteen seconds; held on a hull, in two and a half,
while burning a shield every second.

**With the three-second dance on top, a heat-minding ball dances every eleven and a half to seventeen seconds in
a fight**, the ask's window, and every fifteen to twenty in four levels of five — twenty-nine in the Descent —
where most of the wait is for the next wave and a player who presses a little is faster. Thirty put the fights
at fourteen to twenty, over the ask; twenty put them at ten to fourteen and a pressing level at four. Every
number in this section is a play number.

**Volans is the exception and it is named, not hidden.** Its escorts are bodies the ball rams for one landing
each, so its fight fills the bar in under three seconds. A fight that throws things at a ram is a ram's fight;
whether that is the right answer, or its adds should count for less, is a play's to say.

### A full bar holds, is thrown first, and is gone with the life

**It holds rather than stacking** because a stack of dances could be banked for a boss: three seconds untouchable
each, thrown back to back, is a fight with no danger in it. Holding keeps it at one dance per bar.

**It is thrown before the stack**, as the ship's own pair is thrown before the tier's ward under it
(`startingArsenal`): it is the ball's own special, the thing the bar is for. A bomb taken off a pickup waits
under it, and the twelve seconds the bar takes to refill are the bomb's.

**A life opens on it empty**, as a life opens on its shell (0355): the bar is what this life has rammed. A level
boundary carries it, as it carries the arsenal (0039) — the frame is the same frame across a clear, so nothing is
reset there, and nothing is saved, because a run is not.

### The War Dance face on the bomb pickup is a charge, as on every ship

0441: a take is one charge of its face, on every ship. A War Dance taken by the ball goes on its gun stack under
the bar, and is thrown once the bar is spent. The other answers — filling the bar, or no dance face for the ball
— are each a second rule for one ship about a pickup every ship takes, and the bar already makes the ball the
one ship that is never without its dance for long.

### The ball is fitted with no other special

The bar is solved for the War Dance: twenty-four landings is a dance every twelve to fifteen seconds. A bomb or a
whirlpool on the same bar would be a special every twelve seconds that no row was solved for — 0280's *a quantity
that rejects an option is checked in the case it is applied to*, applied the other way — and a ball fitted with
another special and still earning the dance would make the fit the better choice every time. So the hangar fits
it no other, on the ram's own terms (*"No weapon change for hamster ball"*, 0593), and says why.

### The feel is light, coalesced, and the player's to turn off

*"It can't be overwhelming because it's a lot."* A ball pressed into a wave lands a dozen times a second. So:

- **a landing is the faintest pulse the motors make** — the light motor at a fifth, 35 ms, the heavy one still;
  a kill or a boss a little more; the bar full two motors briefly; and the burn the one strong pulse, because it
  is the one thing about the ram the player must not miss.
- **at most one pulse a tenth of a second**, and inside that only a stronger one (`FEEL_GAP_MS`, the order of
  `FEEL_KINDS`), so a burst of landings is one tap and a burn is still felt through it.
- **the knob is a comfort setting** (0024): the frame names the feel and cannot see the setting, which is read
  where the feel is played, on `onCue`'s terms. On by default, because there is one game and it is the loud one.
- **a phone buzzes only where a finger can land** — a desktop browser has `navigator.vibrate` and answers it
  with a console warning, so it is handed no motor.

### No screen shake

A shake is the obvious feel for a hit, and it would be the overwhelming part: on a gun that lands a dozen times a
second it is the whole screen moving for as long as the ball is in a wave, every bullet with it. 0024's floor is
that nothing may make the game harder to read, and a shaking field is the game harder to read. The punch moves
the ball and nothing else, a tenth for a tenth of a second.

### The landing is seen where it is felt (0036)

The ram already sparks where it lands (0593, the hits log). What it lacked was the ball reacting: the punch is
the ball knocked by what it hit, the picture of the feel.

### The shockwave grows, and lands on its edge

*"It currently has no aoe."* **An expanding ring that lands as it grows**, the nova's way (`crossed`, 0447): a
body takes the wave on the step its edge reaches it, so the ring drawn is the reach on every step and nothing
has to remember what a wave has hit. A blast that landed its whole radius on its first step and drew a ring
growing to it would have killed a body under a ring that had not reached it yet (0027, 0036). It is an entity
in the blast pool with no damage of its own, so the blast pairings pass over it.

- **Fourteen units, a little over a tenth of the lane either side** (`ACROSS_SPAN` is 120). The ram reaches
  three, a ray's burst five, a bomb thirty-four. A wave reaches the body beside the one the ship hit and the rank
  behind it, and not the far side of a formation: the dance is still what does the work.
- **Three, the ram's own**, so a wave kills what a landing would — every enemy of three health or under at
  once, a four in two.
- **Nine steps to grow and six to fade**, so the edge travels about seventy units a second, quick enough to read
  as a shock and slow enough to be seen leaving the ship.
- **One every twelve steps at most.** A dance meets six walls (0609) and, in a wave of bodies, lands every few
  steps; a ring a step would be a strobe. A three-second dance held on bodies sends fifteen, the most it can.
- **A boss once a wave, at the window**, flat — a special's terms (the review of 0595, 0598), and no share of
  the boss's health: the AoE is for the crowd, and the dance's own landings are already a special's on a boss.
- **Through the stone**, as the nova goes: a ring off the dancing ship, and the dance cannot be hurt by the
  stone it bounces off.
- **Under every hostile shot**, in the blasts' layer, the lowest the field has (0373, 0295), and drawn added
  (`LIGHT_KINDS`) — a thin ring of the flare's flame and nothing inside it, because a filled disc every fifth of
  a second would be a general flash (0024).
- **On every ship that dances** (0594), since the shockwave is the special's.

## Guards changed, and why

- `tests/run.test.ts`: *a run begins … on `OPENING_CHARGES` of that ship's own gun special* held every row to the
  pair; this decision replaces the pair on the ball's row on purpose, so the guard reads each row's own (0282).
- `tests/settings.test.ts`: *offers the sound, the crossing, the hand and the steering* said in its own comment
  that a fifth band was a decision about the touch layout and would be red first. This is that band, and it is
  last: on a touch screen the four keep their two columns of two, and the rumble is a strip under both — on a
  phone one line, its name beside On and Off, with no hint (`src/app/chrome.ts`). A third column was tried
  first and CI's fonts drew the crossing, the hand and the steering past their tracks at 480x320; a third row
  of whole bands scrolled 27 px at 667x375. Both were measured under `font-family: Verdana`, which fails
  neither on `main`'s four bands and reproduced CI's fault here.
- `tests/settings-kept.test.ts`, `tests/accents.test.ts`: the rumble in `moved()`, and the wave's two frames
  hull-less, as the flare's are.

## Rollback

⚠️ **One field on an irreversible surface** — [0001](0001-revertability-not-risk-rating.md). `itc_settings` gains
`rumble` on version 1. A document written before it reads as On, on 0512's per-field terms; an older build reads
its known fields one by one and never sees this one, so rolling back loses only the choice of rumble, and writes
the document without it the next time a setting moves. No version bump, no other key, no save field for the
bar.

## What guards it

`tests/charge.test.ts`: the opening, the press, the coin, the hold, full heard and felt and seen, the dance that
fills nothing, the life, the trigger, the hangar; the ask's window flown in seconds in the first level and
against its boss (15.4 s and 12.3 s a bar as it stands, held to 6–20 and 6–15); the feel, its rate, its ranks, no pad, the setting the frame cannot see, the punch; the wave
off every ship's wall and drawn at its edge, landing once and not past its reach, its gap, and the boss.
`tests/settings-kept.test.ts` (the rumble kept). Probes in `scripts/probes/0613-the-dance-is-earned.mjs`.

## Owed

- **A play** — of the bar at twenty-four above all: whether a dance every twelve to fifteen seconds is right in a
  fight, and fifteen to twenty in a level. And Volans, whose adds fill it in three.
- **A pad in the hand**: the rumble has been driven against a stub actuator and never felt. The magnitudes are a
  guess at *"not overwhelming"*, and on a real pad the faintest pulse may be too faint or too much.
- **The ear** on `danceReady`.
- **The wave and the punch at the shipped camera**, photographed on the bench once: whether the ring reads as a
  shock off the ship against each place's backdrop and under its bullets, and whether a tenth is a knock.
- **`scripts/weigh-flashes.mjs` over a dance into a wave**, which this did not run: the ring is thin, as the
  firework's sparks are, and the script is what says whether it stays under 0024's cap.
