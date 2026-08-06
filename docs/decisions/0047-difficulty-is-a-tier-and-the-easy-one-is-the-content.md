# 0047 — Difficulty is a tier, and the easy one is the content

**Accepted 2026-08-06.** Asked for in play, with the targets stated: three tiers; *"keep the current
flow as Easy"*; the middle one hard enough that an average player reaches level four and no further;
the hardest one ending most runs at level two's boss.

## The rule

| | |
|---|---|
| **the tiers** | `src/content/difficulty.ts` — *Legendary Pilot · Savior of the Galaxy · Let the Galaxy Burn*, easiest first |
| **the easiest** | **multiplies nothing.** Every knob is exactly 1 |
| **what a tier scales** | enemy and boss health, the gap between their shots, how fast they close, how fast their shots fly, and lives |
| **what it never scales** | anything of the player's, and the level script |
| **where it lives** | on the **run**, chosen before it starts, fixed for its length |
| **where it may never live** | `Assists` |
| **the choice** | the title screen's controls, walked from the table |

## Why a tier cannot be an assist

[0024](0024-the-accessibility-floor-is-settings.md) closes the assist ladder with **no assist may
ever make the game harder**, and `src/sim/assist.ts` is built so that the entire product of settings
— 144 states — can be proved monotone against that promise. That makes *"harder than the default"*
literally unrepresentable there, and it is right that it is: a player who turns the flashing down
must not thereby be playing a harder game.

So there are two axes and both have to exist.

| | direction | chosen | scope |
|---|---|---|---|
| **assists** | never harder | any time, for comfort | the device and the player |
| **tiers** | deliberately harder | once, before a run | the run |

`tests/difficulty.test.ts` proves the tiers monotone in the *other* direction — never easier than the
tier before — which is the mirror of `tests/assist.test.ts`'s proof. It also scans `src/sim/assist.ts`
and fails if the word "difficult" or a tier's name ever appears in it, because the tempting mistake
is to add a fourth `pace`-like knob that runs the other way and quietly invalidate the monotonicity
proof for everything already on the ladder.

## Why the easiest tier multiplies nothing

Asked for exactly: *"keep the current flow as Easy."* It is worth having as a **rule** rather than as
a coincidence, because of what it does to every other document in the project.

`src/content/levels.ts`, every play-test report, and every number a hand has ever placed are read
against one baseline: **the content as authored.** The two harder tiers are stated as departures from
it. If the baseline were the middle tier, *"the level is too thin"* would be a sentence with three
possible meanings and no way to tell them apart — and the level author would be tuning a script they
could not see the raw form of.

`tests/difficulty.test.ts` holds the identity twice: once on the table, and once through the whole
spawner driving the real frame, so a helper that quietly added a constant fails even with the table
untouched.

## What a tier scales, and what it must not

**It scales what the level sends**: how much killing something takes, how often it shoots, how fast it
arrives, how fast its bullets travel, and how many lives the player brought.

⚠️ **It touches nothing of the player's.** `SHIP_SPEED`, the flight response, the drag and the
auto-fire are the same on every tier. [0037](0037-the-ship-has-mass.md) settled all four by playing,
and a tier that also moved them would mean that hand had settled one third of a game.

⚠️ **It does not touch the SCRIPT.** A tier that added waves would make `src/content/levels.ts` three
levels wearing one name, and `tests/level.test.ts`'s lane, ordering and pacing guards would then be
checking one of the three. Density is authored; toughness is a tier.

⚠️ **`toughness` rounds UP and floors at one, and the rounding is where it would break silently.** At
1.2, a one-health drifter rounds down to 1 and a four-health warden to 4 — nothing changes. At 1.6 the
drifter still rounds down to 1 while the warden goes to 6, so the commonest enemy in the game is
unchanged on a tier that doubled the rarest. Rounding up makes *never fewer shots than the tier below*
true by construction rather than by luck.

⚠️ **`fireGap` is a GAP and is therefore inverted**, and is named for that. `src/sim/assist.ts` makes
the same argument for `playerDamage` over `playerToughness`: a field whose direction has to be
remembered is a field the next guard gets backwards.

## The bug the boss found

A phase is a fraction of **remaining** health ([0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md)),
and `phaseFor` divided by `row.health`. Scale a boss to 2.2× and it spawns reading as *2.2 of its own
health*, which matches no threshold at all — so the lookup falls through to its default, and the boss
sits in its **opening** phase for the whole of the health the tier added, then escalates normally
through the last 150.

⚠️ **Nothing about that looks like a bug.** It looks like a slow boss. `full` is now an argument, and
the frame records what the boss actually started with.

⚠️ **The first guard over it did not catch it, and `npm run prove` is what said so.** It asserted the
boss *opens in phase one* — which the broken version also does, for the wrong reason. The guard now
walks every threshold in the table on every tier, which is where the fight actually goes wrong.
[0005](0005-a-guard-must-be-seen-to-fail.md) exists for precisely this: a guard written to catch what
its author imagined the break would look like.

The rounding guard failed the same way in the same run — *never fewer hits* is satisfied by
`Math.floor`, under which half the enemies in the game are unchanged on the middle tier. It now
asserts **strictly more**, which has teeth.

## Why the title screen is the choice, and *Again* goes back to it

A run cannot begin without a tier, so the screen that starts one has to ask. Putting it on the title
rather than on a screen of its own costs nothing — [0046](0046-a-pad-is-a-first-class-way-to-press-a-button.md)
had just made a screen's controls a list, for exactly this — and it puts the choice beside the pickup
key [0045](0045-the-player-can-see-what-they-are-carrying.md) already put there. The buttons are built
by walking `DIFFICULTY_KINDS`, so a tier added to the table appears on the screen without anybody
remembering to add it.

⚠️ **The ORDER is asserted, not just the membership.** The names do not sort themselves: *Let the
Galaxy Burn* is the most attractive of the three and the hardest of the three, and a player who picks
it for the name has been misled by the screen rather than by themselves. Easiest first, and each
carries one terse line saying which it is — which is disambiguation rather than the over-explaining
`docs/game.md`'s voice rule bans.

⚠️ **`Again` on the run-over and victory screens now returns to the title** rather than restarting.
A button that silently reused the last tier would be the game deciding for a player who has just
watched a run end. `cleared` is unchanged: it carries a run forward and does not begin one.

## Numbers

Every value in the table is a **play-test number**, on the same terms as `SHIP_SPEED`,
`STARTING_LIVES` and the boss health — placed by a hand against a stated target, settled by playing.
Nothing asserts on any of them.

`STARTING_LIVES` is gone as a constant; it is now a column, and 0039's note about it being unsettled
applies three times over.

## Confirmed, not assumed

`npm run prove 0047` — every guard broken on purpose and seen to fail.

| broken | what went red |
|---|---|
| the tier never reached the spawn, so all three buttons started the same run | `spawns tougher, faster bodies that throw faster shots on a harder tier` |
| a boss read its phase against its row rather than against what the tier gave it | `reaches every phase at the same fraction of the fight on every tier` |
| toughness rounded down, so a one-health body is unchanged on every tier | `makes everything that can be shot take strictly more hits on a tougher tier` |
| the easiest tier given a multiplier, so the authored content is no tier at all | `multiplies nothing at all` |
| the title screen listing the tiers in the wrong order | `offers every tier, in the table order, easiest first` |
| a level boundary dropping the run's tier | `travels with a run and survives everything that happens during one` |

## What this does not do

- **No per-level difficulty.** A tier is a property of the run, and a level that was easier on one
  tier and harder on another would make the chart unauthorable.
- **No mid-run change.** The save stores the tier because a run resumed at another one is a different
  run, and `docs/game.md` is emphatic that the save is an interruption hedge rather than a second
  chance.
- **No cheat code and no invulnerability.** Asked for in the same list, for testing the later levels,
  and it is its own decision — an assist at the `proof` end of `resilience` already exists in
  `src/sim/assist.ts` with nothing to switch it on.
- **No retuning of the levels.** The script is untouched, which is the point: the middle tier is a
  first guess at *"hard for me"* and the thing that settles it is a hand.
