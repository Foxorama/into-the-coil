# 0452 — A boss fires from its guns

**Accepted 2026-10-02.** Amends [0250](0250-the-quetzal-screams.md)'s beam roots,
[0277](0277-the-serpent-has-menace.md)'s and [0283](0283-the-serpent-is-a-chain.md)'s `null` on the
serpent, [0373](0373-the-fish-spits-its-adds.md)'s second description of a mouth and
[0403](0403-the-tentacles-pull-out-of-the-heart.md)'s `beamRootOf`; turns the redoubt round.

## The ask

> *"the pteradactyl boss fires it lasers from the wrong spot, they don't fire from the end of the
> cannons or from it's mouth. I thikn it's pretty similar across a lot of bosses so do a full pass and
> make sure that bullets and attacks fire from the right place"*

## What the pass found

Every boss was photographed firing on the bench, and every painter was read for where it draws a gun.

| boss | was | is |
|---|---|---|
| **pterodactyl** | every beam rooted level with the hull's centre: 7.4 behind the barrels' ends, 10 behind the throat cannon | each root is a point: the barrels' ends, the throat |
| **serpent** | its centre, *"its centre is the mouth"* (0283); photographed, the acid left the cheek under the eye | the opening between its lips at `gape`, turned with the head when it rears |
| **fish** | its spines and its whip left the belly, 19 behind the gape; its adds left the mouth (0373) | one mouth, the row's, for both |
| **hydra** | the lance head went on turning after the ship while its beam was held fixed across the lane: the root ended up to 30 px beside the jaw | the firing head holds its turn while its beam is on |
| **sentinel**, **harrow**, **shoal mother**, **chorus** | their centres; the fans were drawn crossing the hull | the prow's tip, the middle prong's tip, the nose, the middle eye |
| **redoubt** | its stepped face and three gun ports were drawn at +x, up the lane, away from the ship | mirrored: the face and ports look down the lane |
| **lattice, axis, gyre, frost ship, jellyfish** | the centre | unchanged: a frame with a hole, an eye looking back, an axle, a heart, a bell (its lasers already left its tips) |

## Why it is built the way it is

**A beam's root is a point.** `from` was an across offset alone, so where a root was ALONG the lane
could not be said. It is `[along, across]` from the muzzle now, as a spray's `from` already was
(0398). The re-pin in `pinBeams` needs the root's along every step, so it rides the bolt
(`rootAlong`). That made `beamRootOf` a second way of saying the same thing for the jellyfish, and it
is gone: its five roots say their reach themselves.

**The muzzle turns with the hull.** The row's comment said a boss has no heading. It has had one
since 0306: the serpent rears, an entrance banks, the fish swims up the lane. A sprite is blitted
turned, so a point in its frame is turned with it; `muzzleAlongOf` does that. The fish's
`MOUTH_REACH` already turned, so the two descriptions are now one.

**Each row authors its muzzle, held to the drawing.** 0282: a default is not a constant, so `null`
stays an answer and each row says which. The bake exports `BOSS_MUZZLES`, a `Record` over every boss
so a new one must say where its gun is or that it has none. `tests/muzzles.test.ts` holds each row to
it within 2 px and each opening volley to it within 12 px on the 1280×720 screen. The serpent's
point is built from the wedge its mouth is drawn with (`serpentMouth`), so those two cannot part.

**The redoubt was drawn back to front.** Its own comment says the ports are *"so the thing that
shoots has somewhere it shoots from"*, and they faced away from the ship. Mirrored, its ring still
bursts from its centre: a ring is radial, and leaving from the ports would carry half of it back
across the fortress.

## What was rejected

- **Each wall from a drawn gun.** A wall is a curtain level with the hull, with nothing in its middle,
  and no drawing has a gun at ±15 across. The shoal mother's is laid at its nose; the lattice's and
  the frost ship's stay at their centres.
- **The harrow's fan split over its three prongs.** A spray with `from` deals its shots out
  `ceil(count / places)` each, which turns seven shots into nine. The middle prong fires the
  fight it always had.
- **A beam that tilts to follow a turning head.** Collision measures a beam across the lane only
  (`src/sim/jag.ts`), so a tilted picture would burn somewhere else. The head holds still instead,
  as the hull already does.

## Confirmed, not assumed

| claim | checked by |
|---|---|
| every row's muzzle is its drawn gun, or both say none | `tests/muzzles.test.ts`, *THE ROWS ARE THE DRAWING* |
| each boss's opening volley leaves the gun, not the middle | *THE VOLLEY LEAVES IT, IN PIXELS* |
| a turned head turns the muzzle with it | *THE MUZZLE TURNS WITH THE HEAD* |
| the lance stays in the jaw while the ship crosses the lane | *THE LANCE STAYS IN THE JAW* |
| the cannons' and throat's roots are where they are drawn, and the frame holds them there | `tests/quetzal.test.ts`, *THE SHOULDER CANNONS*, *THE WINGS AND THE MOUTH, DRIVEN* |
| the picture | the bench, before and after: barrels, throat, the serpent's jaw, the fish's snout, the harrow's prong, the redoubt's face |
| the lance in the picture | the scene drawn into a recorder: 4–6 px from the drawn jaw at three ship positions |

`node scripts/prove-guard.mjs 0452`: six probes, all red. Six probes elsewhere were re-anchored
(0250, 0255, 0384, 0388, 0403) and proven red again. **One guard was fixed rather than moved:**
0388's zigzag fixture chose its beam at the throw, with three units to spare, and the zigzag at the
ship drifts four over a warning as the root is re-pinned. Moving the throat's root picked a marginal
beam and the guard went green under its own probe. It now measures when the beam starts burning.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Nothing persisted moves.

## Owed

- **A play of each boss**, mid and end. The sentinel's, harrow's and shoal mother's volleys now leave
  11 to 13 units further down the lane, so they reach the ship that much sooner. The fish's spines
  and whip leave 19 sooner. That is a small tightening nobody has felt yet.
- **The redoubt turned round**, looked at in its own place.
