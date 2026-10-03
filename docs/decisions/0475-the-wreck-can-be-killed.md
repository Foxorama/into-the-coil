# 0475 — The wreck can be killed

**Accepted 2026-10-04.** Item 1 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md)
(its 4.3), from the play of the same day:

> *"when it dies there's a health bar still visible -> I want this to be killable as a first in game
> achievement -> it should take 1 bomb, 1 missile upgrade and full autofire to completely kill it. We
> don't have achievements yet so just make the dead boss killable and I'll add the achievement later."*

## What it was

**The bar and the ask were the same code.** When the gyre dies, `layWreck` puts the hull back in the
boss's pool ([0337](0337-the-gyre-falls-out-of-the-wall.md)) with `reset(…, bossRow)`, which wrote the
row's raw 1500 health. The pool was no longer empty, so the bar came back — at 1500 over the tier's full
health: 100 % on Legend, 62.5 % on Savior, 39 % on Burn — and stayed through the fall, the settle and
the room opening. And the wreck could not be hit: 0337 gated every damage path on `!bossBeaten`, because
a shot wreck vanished mid-fall and soft-locked the room. `tests/boss-bar.test.ts` drives only the
serpent, which has no wreck.

## The rule

**The wreck is a body with its own health, and killing it is a kill.**

- **`Wreck.health`** is a share of the boss's full health at the tier — `0.22` on the gyre — and
  `layWreck` writes it (`wreckHealth` in `src/content/bosses.ts`).
- **`bossTargetable`** in `src/app/frame.ts` is the one answer every damage path reads — the shots, the
  missiles, the whirlpool, the blast, the rift, the storm, the nova, the arc's and the seekers' choice of
  target: not during an entrance ([0306](0306-the-serpent-coils-in.md)), and not a beaten boss unless what
  is left of it is a wreck still standing. It was `bossEntering < 0 && !bossBeaten` written out six times.
- **A wreck stands in no phase**, so it is open by one.
- **The ship's contact is unchanged**: the wreck still does nothing back.
- **Killed, it bursts where it died**, `bossDown` is heard, `wreckBeaten` latches — the fact the
  achievement will read — and **the room opens at once**: the settle is skipped, so the kill is also the
  quick way out. A wreck carried off the trailing edge as the camera moves on was not killed, and is told
  apart by the death log, which only a kill writes.
- **The bar is the wreck's**: hidden the step the boss dies, then the wreck's own health over its own
  full, with no phase notches (`setBoss` takes `null` for a bar with no phases), then gone when it dies.
- **It shows the hits it takes** ([0035](0035-damage-is-legible-on-the-body-that-took-it.md)): the
  falling hull wears its last phase's hurt twin, and the wreckage gets one, `boss11WreckHit`.

0337's soft-lock does not come back: `stepWreck` already opened the room on an empty pool, and that
guard — *the room opens even if the wreck is gone* — never depended on the gate.

## Sized to the ask, then measured

`scripts/weigh-wreck.mjs` (new) flies the gyre to its death in its shut room, then each loadout at the
wreck from the death until it is killed or carried off. The pilot holds where a bomb lands on the wreck,
throws on the step it lands, then backs to the rear of the box to keep it in front of the guns.

**The plan's 0.22 is the number**, at Savior, the tuned tier ([0356](0356-the-tuned-tier-is-savior.md)).
The window is 8.7 s. Seconds to the kill, or `—` for a wreck that left alive:

| share | one bomb, one tube, autofire | one tube, autofire | one bomb, autofire | autofire alone |
|---|---|---|---|---|
| 0.16 | 5.6 | 7.2 | 5.9 | 7.7 |
| 0.18 | 6.2 | — | 6.5 | — |
| 0.20 | 6.8 | — | 7.3 | — |
| **0.22** | **7.6** | **—** | **—** | **—** |
| 0.24 | — | — | — | — |

At 0.22 the player's three together kill it with 1.1 s to spare, and nothing short of them does.

**Two first drafts of the instrument measured the wrong window**, and both are in its header: one killed
the gyre before its room had shut, so the camera carried every wreck away; one held the ship still, and
the room opening carried the wreck past it a third of the way through.

### ⚠️ The line moves with the tier, and that is the player's call

The gun and the tubes do not scale with a tier and a bomb does
([0372](0372-a-death-keeps-the-ladders.md): a share of the full health). So no one share draws the line
on all three tiers. At 0.22:

| tier | one bomb, one tube, autofire | one tube, autofire | one bomb, autofire | autofire alone |
|---|---|---|---|---|
| Legend | 5.5 | 6.4 | 5.8 | 6.8 |
| Savior | 7.6 | — | — | — |
| Burn | — | — | — | — |

Sizing it on the row's authored health instead was tried: 0.35 drew the line at Savior and left it
**unkillable on Legend**, the easiest tier, because Legend's bomb is the smallest. The tier rule —
*everything that can be shot* scales by `toughness` — is kept, and the guard is at Savior.

## What it found: the gyre was eight and a half seconds short of 0260's floor

`flyFight` in `scripts/weigh-boss.mjs` ended a fight when the boss's pool emptied. For six bosses that is
the death. For the gyre it is the wreck leaving, 8.6 s later — so every gun's gyre fight was read 8.6 s
long, and [0260](0260-a-boss-is-fought-to-the-end.md)'s forty-second floor in `tests/level.test.ts`
passed the arc at 41.1 s on a kill at 32.5. It surfaced here because a killable wreck shrank the
padding: the arc read 39.7. The guard sat green on an artifact. The fight now ends at the death.

Quickest held place, Savior, at the death:

| gun | before | after |
|---|---|---|
| pulse | 40.2 | 40.2 |
| arc | **32.5** | 40.6 |
| shuriken | 40.2 | 40.2 |
| ray | **35.8** | 40.7 |

**The remedy is the one the player chose for the pterodactyl**
([0441](0441-a-pilot-flies-their-own-ship.md)): the gun's weight on this boss, so the other two ships'
fights do not lengthen. `gunWeights: { arc: 1.2, ray: 0.82 }` on the gyre.


## Guards

`tests/gyre.test.ts`:

- **THE ASK**: a shot parked on the wreck is spent on it and lights it; its health is its own, not the
  boss's; killing it latches `wreckBeaten`, is heard, empties the pool, and the room opens within a step.
- **THE BAR**: hidden the step the gyre dies, up full of the wreck's own health after, falling as it is
  hurt, and hidden when it is killed — read off what the shell is handed, at Savior.
- **THE PLAYER'S LINE, at Savior**: one bomb, one tube and full autofire kill it inside its window; one
  tube and autofire, and autofire alone, do not. Seconds and a loadout, the player's own units
  ([0027](0027-measure-the-picture-not-the-model.md)).

**Retired: 0337's *"and nothing may shoot a wreck"*** — the player has asked for the opposite. Its probe
goes with it. What it protected is held by *the room opens even if the wreck is gone*.

**Re-anchored**: 0306's probe on `bossTargetable`; 0360's on the bar's new denominator.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0475`:

| broken on purpose | went red |
|---|---|
| the wreck refused by every damage path, as 0337 had it | `THE ASK` |
| the wreck laid with the boss's whole health | `THE ASK` |
| the wreck's bar read over the boss's full health | `THE BAR` |
| a wreck at a tenth, which the gun alone kills | `THE PLAYER'S LINE` |
| a wreck at three tenths, which the whole loadout cannot kill | `THE PLAYER'S LINE` |
| the gyre without its weights on the arc and the ray | `0260 — … the arc` |

## What it costs

One sprite baked per place change. In the frame: one function call where six conditions were.

## Owed

- **A play of the gyre**: the bar after the death, the wreck flashing, the kill, the room opening at
  once — and the arc and ray fights, which are 8 s longer than they played.
- **The player's word on the tiers**: on Legend the gun alone kills the wreck, and on Burn nothing named
  does. Per-tier shares, or a share of something that does not scale, are each one field.
- **The achievement**, which reads `wreckBeaten`.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Sim, content and a baked sprite;
nothing persisted.
