# 0441 — A pilot flies their own ship

**Accepted 2026-10-01.** Supersedes [0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)'s weapon
pickup and every gun's ladder; amends [0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md),
[0083](0083-two-ladders-of-four.md), [0084](0084-the-dial-is-the-level-and-the-guns.md),
[0256](0256-a-pickup-keeps-the-count.md), [0372](0372-a-death-keeps-the-ladders.md) and
[0373](0373-a-special-is-the-guns-own.md). The plan and the player's answers are
[`the-roster-planned`](../../reports/the-roster-planned-2026-10-01.md); the ray gun is
[0442](0442-the-ray-gun.md) and the lightning's reach [0443](0443-the-arc-is-zoomed-with-the-view.md).

## The ask

> *"ok time to add some new ships, the same overall space needs to be taken up by them in square
> screen space of size, but within that box they can be any shape … current ship is the default and
> will be piloted by Huang-woo Hook, with the autofire gun … each pilot has their own ship and a weapon
> will be keyed to that ship only … each ship will start with max weapons … weapon pickups will instead
> be bomb pickups. a game starts with two bombs and we'll remove the first weapon pick up from each
> level … the pickup will still cycle, but a player can pick up any type and get a bomb of that type."*

## The rule

| | was | is |
|---|---|---|
| **the roster** | one fighter; every golfer flew it | four ships, one per golfer: Hook the fighter (pulse), Feather the Little Green Caddie (ray), Bo the Firebird (shuriken), Larry the Gilded Estate (arc) |
| **the gun** | a kind the weapon pickup switched, on a ladder of five rungs | the ship's, fixed for the run, at what its ladder's last rung was |
| **the weapon pickup** | cycled the guns; climbed or switched the gun; a full ladder's overflow was a charge | **the bomb pickup**: cycles the gun specials — bomb, storm, whirlpool — and any ship takes one charge of the face it shows |
| **what a level authors** | a weapon near the start (two on level one) and a missile | the missile; level one keeps a bomb before its mid-boss; the mid-boss throws a bomb where it threw a weapon |
| **a run opens with** | two bombs | two charges of its own gun's special |
| **a charge per take** | the row's `charges` — two for the bomb | one, of every kind |
| **the hull** | three tiers per gun, climbed by either ladder | each ship at no tubes, one tube and two, all in one 9.4-unit box |
| **the dial** | levels plus weapon pickups offered, spent only on level one's one-hit opening | gone, with that opening |
| **the level-one fights** | the sentinel 120, the serpent 700 | 211 and 900, measured |
| **the later bosses** | held to forty seconds by arithmetic at the third rung | flown at the cap in every ship; the fish 1400, the frost ship 1800, the hydra 1860, the jellyfish 1890, and the arc at 1.1 on the pterodactyl |
| **level one, 956–1,594** | a quiet one-health run-up for the one-hit clamp | five of its waves fire |
| **the exhaust** | measured from the fighter's centre | from each ship's own nozzles (`tail`) |
| **the arc's and the shuriken's cues** | 0.26 and 0.25 | 0.24, under the outcomes as the pulse is |
| **the pilot card's line** | the golfer's home town | the ship and its gun |

## Why it is built the way it is

**The ladders are deleted, not pinned at the top.** Pinning every run to the last rung would leave
four numbers per field that nothing can reach. Every field on a gun's row is now the old cap's value,
and the history stays in git.

**The ship carries the gun; the golfer carries the ship.** Who flies what is a fact about the pilot,
so a fifth golfer can be given a ship that already exists. The run keeps the ship, not the pilot,
because the reducer and the frame read the ship.

**One box, and the hurtbox is the fighter's for all four.** *"The same overall space"* is read as the
fighter's box at its capped kit, 9.4 units. That is the hull every run used to reach, and every run
now opens on it. A saucer fills more of the box than a car does. Since the hurtbox does not change
with shape, neither is easier to hit or to thread.

**Drawn from above.** The fighter was always drawn from above: its wing is mirrored across its
centreline. The predecessor drew all three new ships from above for its portrait fights, so the
roster joins the view the game already uses.

**Every colour is a role moved.** The saucer is the player's cyan turned toward `acid`. The estate is
`hazard`'s gilt. The Firebird is the void lifted toward the player's ink. Every ship carries the
player's cyan as running lights, so the player can always find themselves, and the high-contrast
palette still answers every ink.

**The missiles still change the picture.** 0081's *every upgrade changes how the ship looks* was
carried by the gun's tiers. With those gone, each ship carries its tubes where it authored them: on
a saucer's rim, on a car's flanks, on a wagon's roof rack.

**Every ship wears its gun.** The pulse's wingtip pods, the ray's dish at the saucer's nose, the
Firebird's hubcaps (the blades leave from its front wheels, which is that ship's `wingtip`), and the
estate's lightning rod on the roof rack.

**The intro flies the pilot's ship.** The golfer runs out to their own ship, not the blue fighter.
The hangar bakes the fight's box at the scale the fighter always had there, and the contrails trail
from each ship's own wingtips.

**The dial went because nothing read it.** Its one consumer was level one's one-hit opening, which
existed because the opening gun was the bottom rung. The player was asked and chose deletion. A
level-only dial with no reader would be a mechanism nobody spends, so it went too. The rising
difficulty is the levels' own scripts.

**Every special can be thrown from every ship.** None of them reads the fitted gun. So a bomb pickup
is a choice of tool, not a choice of gun, which is what *"a bomb of that type"* asks for.

**The level-one fights were measured, not scaled.** The sentinel was re-solved by
`scripts/solve-mid-health.mjs` against `MID_BOSS_SECONDS`: the fighter's pulse at the cap fought it
for 10 s against 17. The serpent was flown in every gun's own ship by `scripts/weigh-boss.mjs`:

| gun | rung 3, health 700 | the cap, 700 | the cap, **900** |
|---|---|---|---|
| pulse | 79 s | 51 s | 68 s |
| arc | 33 s | 24 s | 31 s |
| shuriken | 29 s | 25 s | 33 s |
| ray | — | 41 s | 53 s |

These are the quickest fights from any place, at Savior. At 900 every gun is back over the 28-second
floor `tests/serpent.test.ts` holds. From level two on, every mid-boss was already met at the cap, so
none of their figures moved.

**The later bosses were already under their floor, and the guard could not see it.** 0260 holds every
real boss to forty seconds against the fastest kill, and `tests/level.test.ts` computed that kill by
arithmetic at `UPGRADE_TIERS − 1`. That was 0124's *tier 4* from before the ladder gained its fifth
rung, so it described a weaker gun than anyone flew from level two on. Flown at the cap, on `main` as
well as here, the arc took the pterodactyl in 33 s and the hydra in 36. The guard now flies every boss
in every ship, as the serpent's already did. The player chose the fixes:

| boss | the arc at the cap, before | fix | quickest gun after |
|---|---|---|---|
| fish | 38 s (the ray too) | 1300 → 1400 | 40 s |
| pterodactyl | 30 s | the arc's weight 1.5 → 1.1 on its row | 41 s |
| frost ship | 36 s | 1600 → 1800 | 40 s |
| hydra | 37 s | 1700 → 1860 | 40 s |
| jellyfish | 40 s | 1870 → 1890 | 40 s |

**The pterodactyl is answered with the arc's weight and not its health.** It patrols the lane 150
units out. There, the pulse's fan is wider than its body, and the ray's one ring is off its line much
of the time, so those two took 99 and 80 seconds against the arc's 30. Raising its health would have
made every other ship's fight a third longer to slow one gun down. This is the serpent's own pattern
(0372).

**Level one's run-up had no subject left.** 956 to 1,594 was authored as one-health, non-firing
waves for 0086, which kept the teeth off the field until the second weapon had been taken. With the
clamp gone it was 12.1 seconds without a bullet, against 0259's nine. The player chose shooters: a
picket line, the swifts, two lancer waves and a picket vee, at the places and lanes the quiet waves
had.

**A player ship's hurtbox is held to its core.** `tests/combat.test.ts` holds a hurtbox to between a
quarter and a half of the drawn box. The fighter's 2 against its 7-unit hull was 0.29. But the
capped fighter has always flown a 9.4-unit box with the same hurtbox, at 0.21, unchecked. 0441 puts
every ship in that box and keeps the hurtbox, so the band now reads a ship against its 7-unit core,
and says so in the test.

**The flame burns from each ship's own nozzles.** `THRUST`'s trails were the fighter's, measured from
its centre, so the saucer's and the cars' flames burned under their own hulls. They are now measured
from the nozzles, and each ship row says where its nozzles are.

## What was rejected

- **Keeping the weapon pickup as a gun switch.** The ask keys each weapon to its ship.
- **A level-only dial.** It was offered in that form, but nothing would spend it.
- **Fixed hexes for each ship's livery.** The high-contrast palette could not answer them.

## Owed

- A play of all four ships, and the ear on the ray's cue.
- The second change in the queue: a defensive trigger for the void and the nova ring, and the shield
  pickup cycling shield, void and nova.
