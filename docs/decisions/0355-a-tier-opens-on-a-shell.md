# 0355 — A tier opens on a shell

**Accepted 2026-09-22.** PR 1 of [`the-tiers-planned`](../../reports/the-tiers-planned-2026-09-22.md).
**Amends [0058](0058-a-level-boundary-keeps-the-shell.md)** (a boundary keeps the shell and now also
renews it), **[0050](0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md)'s cap
and its *a life opens with three empty*** (both are the tier's now), **and
[0047](0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md)'s *it does not touch the SCRIPT*
by one sentence**: a tier may withhold a pickup the ship cannot carry, and nothing else. 0050's one
number — a shield is health above the hull — is kept.

## The ask

> *"Core baseline for difficulty is shields: saviour — no change to behaviour; burn — no shields;
> legend — start with 3 shields and you start each level with 3 shields fully renewed."*

And of the two questions the plan put back: *"start with full"* — a Legendary life after a death
opens on three too — and *"remove the shield pickups from burn, no replacement pickups, just remove
them."*

## The rule

**Two counts on the tier's row, both per-row literals:** `shellOpen`, the shields a life opens with,
and `shellCap`, the most it may carry. Legend 3 and 3, Savior 0 and 3, Burn 0 and 0.
`MAX_SHIELDS` stays in `src/content/ships.ts` as the **ceiling** — the shell pool's size and the most
pips the readout grows — and the cap is the row's, which is
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s line between shared code and
a character.

The row is read at four sites, and at every one the picture follows the number because the shell is
a function of `ship.health`:

| site | what it does | on Savior |
|---|---|---|
| `respawn` | a life opens at `hull + shellOpen` — a run's start, a death, a continue | the hull, as before |
| `advanceLevel` | `health = max(health, hull + shellOpen)`, never lower; a wreck is left a wreck | adds nothing |
| `dropPickups` and `spawnPickup` | a pickup whose effect is `shield` is not thrown where `shellCap` is 0; the ring is spaced over what remains | all three thrown |
| `takeShield` and the HUD | a shield stops at `hull + shellCap`; the row grows `MAX_SHIELDS` sockets and shows `shellCap` of them, none on Burn | three sockets |

**Savior's behaviour does not change at all**, by arithmetic rather than by a branch: at an opening
of 0 and a cap of 3 every line above does what the code did before it.

## The baseline had to move first, and the plan put that in the wrong PR

The plan introduced `AUTHORED` — the content multiplied by nothing — in PR 2, for the day Legend's
multipliers leave one. **The shell moves the baseline sooner.** `tests/world.ts`'s `playableWorld`
defaulted every fixture that names no tier to `DIFFICULTY_KINDS[0]`, and the title field in
`src/app/mount.ts` booted on it too; once a Legendary life opens on three shields, both would have
flown a ship that takes four hits under guards written for a hull that takes one. So `AUTHORED`
lands here, as today's Legend exactly with an opening shell of 0, and both defaults stand on it. It
is not in `DIFFICULTY_KINDS` and has no button. A fixture that means a tier names one.

## What the drop rule costs 0047, said plainly

Withholding a piece of the mid-boss's drop is a tier reaching what a level sends, which 0047 forbade.
The player chose removal over the plan's alternative (overflow into a charge), so the amendment is
exactly one sentence and it is checked rather than assumed: nothing a tier CAN use is ever withheld;
`tests/level.test.ts`'s lane, ordering and pacing guards read the wave tables and never the drop;
the dial counts weapons only, so the top of it does not move; and no level authors a shield, so the
authored half of the rule is a belt for a level that one day does.

## Rejected

- **A branch on the tier's name, or on `'shield'` by name.** The predicate reads the pickup row's
  `effect` and the tier row's cap, so a fourth tier with a cap of zero, or a second pickup that
  shields, gets the same with nothing switched on — 0016.
- **Leaving the HUD at three sockets on Burn.** An empty row of sockets on the tier that can never
  fill one is a promise the tier withholds. The row hides past the cap rather than shrinking, because
  the chrome grows pips once and a Legend run followed by a Burn one shares the elements.
- **Topping up on a wrecked ship at a boundary.** A ship in its death beat handed health would be
  un-killed; the line is guarded on `health > 0`.

## The guards, and that each was seen to fail

`tests/tier-shell.test.ts` walks every tier and reads the numbers off the row, except THE ASK, which
holds the player's own words. One assertion is in what the player sees at every site: the orbiting
marks, and in `tests/hud.browser.test.ts` the sockets the stylesheet leaves visible and how many are
lit, pressed on each tier's own button. Eight breaks in `scripts/probes/0355-*.mjs`:

| broken on purpose | went red |
|---|---|
| a level boundary keeping the shell without topping it up | `raises what the ship carries to the tier’s opening shell` |
| respawn opening every life on the hull, whatever the tier | `at the run’s start, after a death and after a continue` |
| the mid-boss throwing a shield to a tier that can carry none | `the mid-boss’s death throws every piece the tier can carry` |
| a tier allowed four shields in a pool of three | `a tier opens on no more than it may carry` |
| a shield capped at MAX_SHIELDS rather than at the tier’s shell | `a shield never raises health past the tier’s full shell` |
| the easiest tier carrying fewer shields than the next | `on every axis at once, and never softer on any of them` |
| the baseline opening a life on a shell | `THE BASELINE` |
| the readout sized by MAX_SHIELDS rather than by the tier | `draws one pip per shield the ship can carry on its tier` |

⚠️ **The withholding guard asserts that some tier withholds something**, because a drop guard that
only compared against a filter would be a copy of 0256's guard on every tier where the filter keeps
all three — green over a rule it never ran.

**Re-anchored:** 0047 (the Legendary row's `toughness` line now follows the two shell counts) and 0050
(the readout's size is the tier's cap rather than `MAX_SHIELDS`). **Changed to keep testing what they
tested:** `tests/hud.browser.test.ts`'s pip-style test presses the first tier whose life opens on
empty sockets, because a Legendary life now opens with nothing spent to compare; and
`tests/shields.test.ts`'s *cannot be handed a fourth shield* takes it through `takeShield`.

## Owed

A play per tier, in the report's order and on its questions — above all whether three shields a life,
renewed at every level, with five lives, leaves anything to feel on Legend. `lives` did not move; the
ask did not name them.

No rollback note: no storage key, save schema, cache prefix or origin is touched — the tier rides the
run slice and there is no save yet.
