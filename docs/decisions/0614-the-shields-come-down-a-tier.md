# 0614 — The shields come down a tier

**Accepted 2026-10-17.** Amends [0355](0355-a-tier-opens-on-a-shell.md): Savior's and Burn's counts, and a
third count on every tier — the shell a LEVEL opens on, split from the one a life after a death opens on.
Leaves [0447](0447-the-ward-is-a-third-trigger.md)'s ward as the default for a shell of zero, which no tier
has now.

## The ask

> *"I want to change the shielding around as the game is quite hard. Leave Legend difficulty as is; change
> Saviour difficulty to start each level with 1 shield; change Burn to start with 0 shields, but have the
> capacity for each ship to gain up to 3 shields (the behaviour that saviour has now)."*

and, on the first build of it:

> *"Don't give saviour a shield on death — keep it to once per start of level. And do add shields back into
> the random item drop pool for burn, not just for boss drops."*

## The rule

| tier | `shellLevel` — a level opens on | `shellOpen` — a life after a death or a continue | `shellCap` | was (0355) |
|---|---|---|---|---|
| Legendary Pilot | 3 | 3 | 3 | 3 / 3 — unchanged |
| Savior of the Galaxy | **1** | 0 | 3 | 0 / 3 |
| Let the Galaxy Burn | 0 | 0 | **3** | 0 / 0 |

- **`shellLevel`** is new. A run's start is level one's start, so `resetScene` raises the ship to it after
  `respawn`; `advanceLevel` raises a ship carrying less to it at every boundary and never lowers one carrying
  more (0058's carry-forward, 0355's *never lower*). The readout before a run shows it.
- **`shellOpen`** is now a death's and a continue's only — `respawn`.
- **`shellCap`** on Burn is three, so `offeredAs` in `src/app/frame.ts` offers the shield as itself again, in
  **both** places a pickup is drawn: the mid-boss's drop and the level's random pickups (`spawnPickup`, which
  draws every authored pickup's kind since [0575](0575-a-pickup-is-what-it-shows.md)). The second answer of
  the ask needed no code of its own; it needed the cap, and a guard that says so.
- A ship row that says its own count still wins on all three (`shellLevelFor` beside `shellOpenFor` and
  `shellCapFor`, [0609](0609-the-ball-takes-its-knocks.md)): the Hamster Ball opens every level and every
  life on three.

## Why a third count rather than a branch

0355 made one count serve a run's start, a death and a boundary, because every tier then gave the same answer
to all three. Savior now gives two answers, so there are two numbers — on the row, not a `savior` test in
the frame (0016). Legend says three for both and plays exactly as before.

## What happens to the ward

0447's ward pickup — the void or the nova, thrown on Burn in the shield's place — is now thrown by no tier.
The rule that throws it is kept, because it is the default for any shell of zero, a tier's or a ship's. The
ward's two charges are still reached the way 0447 also built: a shield taken at a full shell. Kept rather than
deleted is the cheaper call and the reversible one; if the ward pickup should go, that is its own change.

Burn's opening void (0447) is unchanged — it was asked separately and is not the shield's replacement.

## What guards it

- `tests/tier-shell.test.ts` **THE ASK** names the counts the player gave.
- *At the run's start, after a death and after a continue* now expects the level's shell at the start and the
  life's after the other two, in every ship on every tier; the boundary guard expects the level's.
- **New:** *the random pickups draw a shield on every tier that can carry one, and the ward only where none
  can* — thirty authored pickups through the real frame, on every tier and on `SHELLESS`.
- With no tier at zero, the mid-boss drop guard, the cap guard and the new one also drive `SHELLESS` — Burn's
  numbers at 0355's old cap — so the withholding is still run and 0355's probes of it still go red.
- `tests/difficulty.test.ts` holds that a harder tier opens a level on no more than an easier one, beside the
  other two counts.
- All of it probed in `scripts/probes/0614-the-shields-come-down-a-tier.mjs`.
- **One 0355 probe is retired**: the readout sized by `MAX_SHIELDS` rather than by the tier. No tier or ship
  has another cap, so a browser cannot tell the two apart; the guard stays and the probe file says why.

**Owed: a play of Savior and of Burn.**
