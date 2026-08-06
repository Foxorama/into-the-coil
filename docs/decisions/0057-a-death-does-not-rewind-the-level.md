# 0057 — A death does not rewind the level

**Accepted 2026-08-06.** Amends what `respawn` does. Does not touch
[0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md), which owns what a death costs — that
half is unchanged, and this is only about the field.

## The rule

**A death takes the ship and what belonged to it. The level carries on.** The enemies and their shots
stay exactly where they were; the dead ship's shots, missiles, bombs, blasts and shield marks go with
it. Because the field survives, a respawned ship gets a longer invulnerability than one that was
merely hit.

## What was reported

> *"When a player dies the entire screen resets, the level shouldn't reset, just the player's power
> ups."*

## The interesting part: nothing was actually rewinding

`nextWave` and `cameraAlong` both survived a death before this change. The level's clock never moved.
What did not survive was **everything the player could see** — `respawn` cleared the enemy pool, so
the screen emptied, went quiet, and the next wave arrived out of nowhere.

⚠️ **A rewind and an empty screen are indistinguishable from the cockpit.** That is
[0027](0027-measure-the-picture-not-the-model.md)'s rule arriving from the other direction: not a
guard measuring a model quantity instead of a picture, but a **report** describing the picture
correctly while naming the wrong mechanism. Taking the words at face value would have produced a fix
for a bug that did not exist, and left the one that did.

⚠️ **So there is a probe for the bug the report sounded like**, not only for the one it was — a death
that rewinds the wave table has to go red too. Otherwise the next reader of this file has no way to
tell that the obvious reading was considered and refused.

## Why the field was being swept, and why that stops

Clearing the enemies is a mercy: it hands the player an empty lane to come back into. It is also the
single loudest thing on screen, and losing it costs more than it buys — the level the player had
fought through is gone, and 0039's arsenal cost lands on top of a stretch that now looks like a
restart. Reported in the same breath as *"dying is currently incredibly penalising"*.

⚠️ **The mercy still has to exist, it just moves.** Keeping the field means the replacement ship
arrives in a lane still carrying everything that just killed the player, and `INVULN_STEPS` is 0.75s
— sized for *a hit landed mid-flight*, where the player is already where they chose to be with their
hand on the ship. A respawn is not that. So `RESPAWN_INVULN_STEPS` is its own number at two seconds,
and the two probes below pull in opposite directions on purpose: sweep the field and a death reads as
a restart; keep the field on a hit's invulnerability and a death reads as two deaths.

⚠️ **It is not on the assist ladder**, for the reason `src/content/ships.ts` already gives for
`INVULN_STEPS`: part of the one game, at the same value for everybody —
[0024](0024-the-accessibility-floor-is-settings.md).

## Confirmed, not assumed

Probes in `scripts/probes/0057-death.mjs`. **5 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the field swept on a death again, so the level reads as having restarted | `leaves the enemies where they were, so the screen does not empty` |
| a respawn given a hit's invulnerability, in a lane that is no longer swept | `comes back harder to kill than a ship that was merely hit` |
| the respawn window cut below what it takes to cross the lane and find a gap | `is invulnerable long enough to fly clear across the lane` |
| the wave table rewound on a death, which is the bug the report sounded like | `does not rewind the wave table or the camera either` |
| the dead ship's own shots and missiles left flying | `takes away what belonged to the ship that died` |

⚠️ **The window's guard is the distance the ship covers, never the step count.**
`invulnFor × SHIP_SPEED` against `ACROSS_SPAN` — what the window has to buy is the ability to leave
wherever the ship was put down and find a gap, and the only honest measure of that is how much of the
lane it crosses at the speed the ship actually flies. Asserting on 120 would prove the code agrees
with itself, which [0019](0019-a-probe-must-be-seen-to-apply.md) says no probe can catch.

⚠️ **The first probe is the tidiest-looking line in `respawn`.** Every other pool on that list is
cleared, so the enemies *not* being cleared reads as an oversight somebody would helpfully fix.

## What this leaves owed

**Two seconds has not been played**, and it is the number most likely to be wrong: too long and a
player can fly through a wave untouchable, too short and the change is a punishment. It is a starting
point on [0037](0037-the-ship-has-mass.md)'s terms.

**Coming back invulnerable but ARMED WITH NOTHING is still the hard part**, and this does not address
it — 0039 empties the upgrade list, and [0056](0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md)
has just made that cost the missiles as well. The other half of the same report — *"when a player
dies, their power ups should explode from where they were and bounce around the screen"* — is not in
this decision and is the thing that would actually answer it.

**A ship can respawn on top of an enemy.** It arrives at `SHIP_START_ALONG`, which is the back of the
view and the least likely place for one to be, and the two-second window covers the rest. Named
rather than guarded, because the only honest guard is a hand.
