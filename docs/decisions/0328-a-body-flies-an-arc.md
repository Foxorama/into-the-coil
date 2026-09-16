# 0328 — A body flies an arc

**Accepted 2026-09-16**, the fourth item of
[`the-first-three-levels-asked`](../../reports/the-first-three-levels-asked-2026-09-14.md):

> *"we need more interesting enemies and more interesting flight paths for the enemy waves for the
> player to engage with, where they can curve back and come onto the screen again."*

**Amends [0073](0073-an-enemy-is-a-pilot.md)**: the motion union gains an arm that turns through the
lane and reads nothing about the ship. **Amends [0232](0232-each-place-has-its-own-enemy.md)'s
count**: a ninth shared kind, the first since the eight, because the arm needs a body and every one
of the eight has an identity [0258](0258-one-pilot-a-level.md) settled. **Leaves [0258](0258-one-pilot-a-level.md)
untouched**: the swift is a pattern.

## What was true

Every motion either held its line, swung about it, chased the ship, orbited it, ran the box's length
or swam for a boss. Nothing turned through the lane. The `loop` comes back along the line it left on,
and the plan's *spend the loop on other kinds* is refused below.

## The rules

**`Motion` gains `arc`: `radius`, `sweep`, `after`.** The camera-frame velocity turned by
`speed / radius` a step ([0327](0327-a-shot-has-a-path.md)'s rotation on a hull, on
[0023](0023-the-long-axis-is-the-scroll-axis.md)'s frame) until it has turned through `sweep`, then
held, so the exit is a straight line at the speed it arrived at. `steerEnemies` in `src/app/frame.ts`.

**The radius is the picture, so it is authored and the turn rate is not.** A tier scales the speed;
a body authored by a turn rate would fly a wider circle on a harder tier, and the lane check would be
true at one tier. `2 × radius` is the reach every guard reads.

**On the screen, `after` units in, and never before.** A lead wave is placed beyond the horizon. The
first drive had the turn begin the step the hull was seen, and the half circle sat against the leading
edge: twenty-five units in, gone in a second and a half — a body that barely enters. `after` is how far
past the edge the hull flies straight first, read off its depth into the view rather than carried; a
flanker is placed mid-screen ([0048](0048-a-threat-may-arrive-from-the-side.md)) and is past it the
moment it has straightened.

**At most a half turn, and the progress is read off the heading.** A body arrives flying down the lane,
so how far it has turned is the angle between its heading and down-lane — nothing on the entity to zero.
Past π that angle folds back, which is why `sweep ≤ π` is held: a body that turns further is coming
round for another pass, and that is the loop's job.

**Which way it turns is `spin`, dealt at the spawn by the lane's geometry.** A flanker turns back toward
the edge it came in by — a U, in and out by one side. A lead body turns toward the lane's centre, so a
vee astride the centre crosses itself in an X. `tests/level.test.ts` reads the same rule to bound the
far end of the sweep against the roam band, one-sided.

**It faces the way it flies**, as the minnow does ([0314](0314-the-shoal-comes-in-while-it-fights.md)):
a chevron leaving up-lane nose-last is the sprite sheet photographed wrong.

**The swift is the body.** A swept chevron, two hits, closing 0.3, one straight spit down the lane on
the picket's old cadence — *"make sure that we still have some straight firing bullets"*: the thing
that curves is the body. Radius 25, a half-lane circle; sweep π; `after` 80, a little under half the
narrowest view, so the U's bottom is a hundred and five units in, thirty-three in front of a ship on its
usual station. Sent by levels one to three: three lancer waves in the Approach are swifts and one vee is
new before the sentinel; the Nebula gets two vees; the Belt, whose idea is *where things come from*,
gets three from the sides.

## The figures

Driven through the real frame, the ship parked and its guns off:

| | lead, lane 30 | side, lane 50 |
|---|---|---|
| on the screen | 4.42 s | 6.33 s |
| across, from … to | 30 → 80 | in to 50, back out to 102 |
| heading, first seen → last | π → 0 | −2.59 → 0 |
| turned before its hull was seen | 0 | — |

At the capped loadout sweeping (`scripts/weigh-presence.mjs`), the Belt's side swifts are on the
screen 3.0 s and fire 1.13 volleys a body with a fifth silent; the Approach's lead swifts die at the
edge like every lead body there ([0326](0326-an-enemy-is-seen-before-it-fires.md) has why). Bullet
time moves by a point in the three levels and every fight budget holds — after the first placement
did not: see below.

**Consider the screen.** A swoop is a fifty-unit half circle in front of the player, flown in about
a second and a half at the gentlest tier, by a body the size of a weaver that fires one straight
bullet; a vee of five from the lead crosses itself in an X across the middle of the lane. That is a
lot of shape at once and it is on three or four waves a level, never adjacent to another swift wave.

## ⚠️ What the guards taught while it was built

**Adding a firing wave anywhere past level one's mid-boss made the fight busier than the stretch
before it** — [0267](0267-a-fight-thins-the-waves-over-it.md)'s guard, on the one-rung walk it uses,
where the sentinel's fight runs most of the way to the serpent. Swifts replace three lancer waves
there rather than joining them: five two-hit bodies where eight stood.

**The seam on the leading edge poked a pixel past the nose**, where a chevron is a tenth wide;
`tests/accents.test.ts` refused it and the seam starts inboard now.

**The guard read depth to the hull's centre where the arm reads its edge**, and was a hull radius
too strict; it says so beside the number.

**And the full proof found 0110's roster probe biting the wrong guard.** It dropped six patterned
shooters to leave the aimed ones level with the patterned; the swift is a seventh patterned shooter
it left standing, so the majority held and other guards reddened instead. It drops seven now, the
swift among them, with the reason in its file.

## ⚠️ What was rejected

**Spending the `loop` on kinds other than the charger**, which the plan proposed. A lancer that loops
in one level and weaves in another is two kinds with one name — 0258's own rejection — and a new kind
that loops is the charger with a gun.

**A turn rate on the row.** Tier-variant, above.

**A sweep past a half turn.** The progress is read off the heading and folds past π; and a body that
comes round again is the loop.

**Putting the arm on an existing shared kind.** The warden on an arc was argued for in the report —
a four-hit body whose wall walks its hole across the lane — and it would change five levels the
report called good.

## What is owed

- **A play.** Whether the U reads as *it came back*; whether an X of five reads as a figure or a
  tangle; whether the swift's size and the chevron read against the drifter and the kite at speed.
- **The swift's name and hull are mine, not the player's.** A shared kind is not a place's body, so
  [0020](0020-the-fiction-transfers-the-code-does-not.md)'s *the fiction arrives from the player* was
  not waited on; if the name is wrong it is one row and one sprite.
- **Items five to seven** spend the arc and the path per level; the two place-only bodies still want
  names.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). An arm, a row, two sprites, rows in
three levels; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0328`:

| broken on purpose | went red |
|---|---|
| the arc's rotation never written back, so a swift flies straight | `THE PICTURE: from the lead edge it flies straight until it is well into the screen` |
| the arc begun beyond the view, so half of it is flown unseen | `THE PICTURE: …` |
| the arc begun at the leading edge, so the U sits against it and the body barely enters | `THE PICTURE: …` |
| the sweep ignored, so a swift keeps turning past its half circle | `THE PICTURE: …` |
| every arc dealt one hand, so a flanker from the far edge turns the wrong way | `and from the side it comes in, turns back toward the edge it came by` |
| the bitmap left facing down-lane while the body flies back up it | `and it faces the way it flies` |
| the swift put on a drift, so the arc is an arm nothing flies | `has no arm nothing flies` |
| a flanking swift authored where its U leaves the roam band | `never puts an enemy where it can leave the ROAM band` |
