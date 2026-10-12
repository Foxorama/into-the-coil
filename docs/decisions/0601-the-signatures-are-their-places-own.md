# 0601 — The signatures are their places' own

**Accepted 2026-10-12.** The first of a pass over the enemy art.

## The ask

> *"We need to add more level specific enemy sprites per each level and make them look better. Go
> slowly and carefully and review each design as if you're a professional game dev/designer and then
> implement."*

## ⚠️ What the review found first

Every enemy in every place was photographed off `rig/sheet` at 4× before anything was drawn. What
stood out was not the shared kinds — [0446](0446-each-place-has-its-own-faces.md) had already given
each place its own creature or machine for each of the eight — but **the one enemy each place owns
was the plainest thing it sent.** The seven signatures of [0232](0232-each-place-has-its-own-enemy.md)
were still the primitives they were chosen as: the Saurian raptor a bent bar beside an ammonite and a
crocodile's skull, the Labyrinth sentry a box with motif dots, the Rime shard a hexagon, the Mire spore
a circle, the Black Heart gaze an octagon. A place's flagship was drawn a generation behind its
rank-and-file. That gap is the first thing a player would notice, so it is the first thing fixed.

## The rule

**Each signature is drawn as a thing native to its place, inside the silhouette class 0232 gave it.**
The class is what says what the body DOES (0232's table, on
[0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md)'s terms), so it is kept;
everything else about the drawing is new.

| place | kind | 0232's class | drawn as |
|---|---|---|---|
| The Approach | picket | a Y, one blade down the lane | a raider gunship: a barrel down the lane, a cockpit pod, swept wings ending in a gun pod each — the two shots of its spread — with lamps in the ink that hurts |
| Ember Nebula | moth | two wide wings on a body | a fire moth: short body, antennae, broad forewings hot at the root and slag at the edge, a ragged flame margin, eyespots, ember-flecked hindwings, a ringed abdomen |
| Saurian Belt | raptor | a crescent, horns down the lane | jaws: four teeth a jaw cut into the outline and painted bone-white, spines down its back, a lit ridge on the upper jaw, the eye on the snout |
| The Labyrinth | sentry | a block with a slot in its face | an armoured bunker: chamfered, a barrel either side of the slot — its two slabs abreast — a comb of heat-sink fins, a red visor at the back of the slot that lights it, and a sensor lamp |
| Rime Shelf | shard | a long hexagon, pointed both ways | a cluster of ice: a faceted bipyramid with a spur aft above and fore below, half a turn apart because it throws a turning spiral, and a cold pink heart lit through it |
| The Toxic Mire | spore | a lumpy sac | a puffball mine: the sac on seven short stalks, each ending in a bulb charged in the place's toxic lit ink — *do not touch* |
| The Black Heart | gaze | a lens with a pupil | an eye torn out of the heart: lids of flesh, a pale veined white, a gold iris, a pupil with a wet highlight, and the optic nerve it trails |

**Nothing but the drawing moves.** No row, sprite index, extent, hurtbox, cycle, bullet or pattern
changed. Each body keeps its three poses ([0410](0410-the-enemies-move.md)) and its hit twin is its own
base under the wash ([0278](0278-the-flash-is-a-wash.md)). The constant names the probes of 0232 and
0410 anchor on (`PICKET_HULL`, `SHARD_HULL`, `MOTH_POSES`) are the same constants.

## ⚠️ What the picture changed

Every body was photographed in its own place, three poses each, after every change.

- **The first spore was seven yellow dots floating round a ball.** Its stalks were drawn 0.075 either
  side, which the hull's own outline swallowed, so the bulbs read as detached — at play size, a ring of
  bullets or pickups round a body, which are the two things a body must never be taken for. The stalks
  are 0.13 now and visibly carry the bulbs.
- **The first two moths were fish.** Their bodies ran the whole length of the drawing, as long as the
  span, and the hindwings read as fins. A moth from above is mostly wing: the body is short now and
  the forewings are the outline.
- **The raptor's snout ran out to a needle** and photographed as a swordfish; the jaw tips are blunter.
- **The picket's first wings were sticks** under their lit strip; they are a delta to each pod now.
- **The gaze's lit lid was a blue cap.** The lid carries a crease in shadow instead, and its nerve
  tapers rather than ending as a plug.
- **A mottle spot beside the spore's eye read as a second eye**, so the mottle is kept aft and low.

## ⚠️ What the guards changed

All of these are existing guards, and every one was answered in the drawing, not in the guard.

- **`tests/cycles.test.ts`'s 2 px of motion** sent the raptor (1.90 px), the sentry (1.76) and the spore
  (1.98) back: the toothed jaws snap wider than the crescent's horns did, the sentry's barrels recoil
  as its slot gapes, and the sac heaves at 0.13 where it heaved at 0.1.
- **`tests/accents.test.ts`'s 2.5 px floor** is about 0.14 of a seven-unit body's radius since the view
  zoomed out ([0364](0364-the-view-zooms-out.md)), wider than several first marks: the picket's lamps,
  the sentry's fin edges, bevel and visor, the moth's abdomen rings. The raptor's teeth went from seven
  a jaw to four, because a painted tooth at seven was two pixels across. Its nostril was dropped: the
  jaw tip is too thin to carry one.
- **The sentry's firing pose squashed its own muzzles.** The slot's opening reached into the barrels,
  and a recoil tapered along the barrel compressed the muzzle mark to a pixel; the opening now stops
  short of the barrels, each barrel slides whole, and the face holds.
- **The containment guard** found a wing shade on the moth and an under-shade on the raptor each a
  fraction of a pixel over a concave edge of the new outline; both were pulled in.

## Owed

- **A play in every place, at speed.** Each body was judged on the sheet at 4× in its own place.
  At play size it was seen in its own level for **the picket and the shard only**; the other five
  were not caught clearly on screen by `scripts/shot-place.mjs` at the points tried, so whether they
  read at speed is unverified. Any of the seven is the player's to veto; each is one hull and one
  paint function in `src/render/bake.ts`.
- **The rest of the pass** — the swift drawn once for three places, and The Approach's eight shared
  bodies still the first primitives — is the next work, in that order.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Art baked at load; nothing persisted.

## The probes it rests on

No new guard, so no new probe and no table of its own: every claim here is held by a guard
0228, 0232, 0410 or 0446 already wrote. The probes that anchor on the code redrawn here were re-run
and each still applies and goes red: `npm run prove 0232` (4 of 4) and `npm run prove 0410` (5 of 5).
