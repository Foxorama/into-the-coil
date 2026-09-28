# 0410 — The enemies move

**Accepted 2026-09-29.** Every enemy is drawn in three poses, and flies through them. This is the work
[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md) ends on — *"enemies get real baked frames
(1.22 MB for all seventeen)"* — which was started on a branch the same day, drew the drifter, and was
kept on worktree removal without landing
([the review of what never landed](../../reports/the-unlanded-work-2026-09-29.md)).

## The ask

> *"none of them feel alive because while their location changes, the individual enemies don't
> 'move'."*

and then:

> *"do the frames for everything"*

## What changed

**A pose is where each point of an enemy's rest drawing sits in one frame** (`src/render/bake.ts`).
Every point the body is made of goes through it — hull, plates, lit strips, eyes, and the place's
motif, laid on the rest belly and carried with it — so a wing that lifts takes its eyespot with it and
a tail that swings takes its fin. Each pose is weighted by where on the body a point is, so the core
holds and something attached to it moves. **None of them is the body scaled**, which is 0280's own
failure, and the eye is posed with its part or looks about on its own.

What moves is the animal's:

| body | its motion |
|---|---|
| drifter | a ray's wingbeat, and its eye looks about — it holds station, so it swims in place |
| lancer, sower, picket | the back corners or blades beat: in and back, then out and forward |
| weaver | the bar ripples in an S one way, then the other |
| turret | the gun face draws in and bows out; the dome holds |
| charger | the needle's tail flicks |
| warden | the aperture dilates, and the three eyes follow |
| spinner | the arms trail, curled one way and back |
| moth, swift | the wings beat |
| raptor | the horns — its jaws — snap in and throw wide |
| kite | the streamers ripple and the wingtips beat; its sides stay straight |
| minnow | the tail beats and the body bends behind the head |
| sentry | the slot works like a jaw, taking the throat and the plate under it along |
| shard | a prism rolling about its long axis, its ridges and lit facet with it |
| spore | three lumps heave round the sac and travel |
| gaze | it glances, and now and then blinks |
| moon jelly | the bell snaps in and thrusts, the fringe streaming; then relaxes wide — in each of its six glows |

**Each row authors its own cycle** (`EnemyRow.cycle` in `src/content/enemies.ts`): which poses, in what
order, how many steps each holds. That is the animal's character, so the charger flicks at 4 steps a
frame, the warden's iris lingers open and shut at 12, and the gaze holds open for most of its cycle. No
shared default exists, on [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s terms:
a row that did not say how it moves would be a prop again, and nothing would notice. The moon jelly's
glows became cycles, one per glow.

**The entity walks it** (`src/sim/entity.ts`). `animate` hands a body its cycle at spawn, with a phase
seeded from where it spawned, so a wave is not one machine with eight bodies. `stepEntities` picks the
frame each step and lights that frame's own twin on a hit. `spriteBase` stays the body's identity; only
what is drawn changes. Every spawner of an animal calls it: the waves, the summons, the mouth's spit, the
rain and the field behind the title.

### Where the WIP was changed rather than finished

The branch picked a frame by adding `2 × frame` to the base sprite's index, which made the order of
`SPRITE_KINDS` load-bearing and needed a test to hold it. **The row lists its frames instead**, as the
pterodactyl's wings already do: [0016](0016-a-hub-enumerates-kinds.md)'s explicit registry, and a list
may name a frame twice, which is how a beat passes back through rest.

### What the photographs changed

`scripts/shot-sheet.mjs` at zoom 4, all 57 frames. The minnow's first tail wag moved the fork inside its
own notch and nothing else, and read as three frames of one fish; it was widened. The kite was
densified like the others at first, which bent its sides into curves: that spends one of the two
channels [0314](0314-the-shoal-comes-in-while-it-fights.md) separates it from the minnow on, and `tests/volans.test.ts` counted
it. It is posed at its corners only now, with its wings flapping aft of the shoulder so the lit seam on
its leading edge stays on the edge.

## Guards

`tests/cycles.test.ts`:

- **every enemy authors a cycle of more than one drawing, each lit by its own twin** — every row and
  every glow;
- **THE REPORTED ONE** — a real level (The Approach) run for 2400 steps: every body that lives a whole
  cycle is drawn in at least two pictures;
- **and a hit lights the frame the body is on** — driven directly, because the level fixture's ship
  landed one hit in those 2400 steps;
- **in pixels: every enemy's outline moves at least 2 CSS pixels across its cycle on a 1280×720
  screen** — [0027](0027-measure-the-picture-not-the-model.md)'s assertion in the player's units. The
  first three pass over three identical drawings; this one does not. 2 px because 0106 puts the
  smallest mark that is drawn at all at 2.5 px ([0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)), and a part moving less than that is anti-aliasing
  changing its mind. It sent the drifter, lancer, weaver, sower, picket, shard, spore and jelly back
  for bigger motion — the lancer's wings were sliding along their own back edge, which is no motion at
  all.

The containment guards in `tests/accents.test.ts` run over every new frame in every place, because
they iterate `SPRITE_KINDS`: they found a weaver strip and a facet off a bent body and a moth's eyespot
off a lifted wing, and each was fixed in the drawing.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `scripts/probes/0410-the-enemies-move.mjs`: the frame
never advanced; a hit drawn unlit; the wave spawner forgetting to hand a body its cycle; the drifter's
row walking one drawing; the moth's three poses all rest. Four probes elsewhere were re-anchored because
the code they break moved into per-frame functions: 0035's sprite choice, 0228's unpainted charger,
0232's borrowed hull and 0321's curved kite.

## What it costs

105 bitmaps per place atlas — 19 bodies × 2 frames × a twin, and the jelly's 5 other glows × 2 × a
twin — at an enemy's size, where 0280 measured a frame at 6 KB. The frame loop gains one division and
one array read per animated body a step, and allocates nothing (`tests/budget.test.ts`).

## Owed

A play, for whether each animal's motion reads at speed, and whether any is too busy. The holds are
authored per row and are the first thing to turn.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Nothing persisted; a revert puts every
enemy back to one picture.
