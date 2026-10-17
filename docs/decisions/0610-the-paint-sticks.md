# 0610 — The paint sticks

**Accepted 2026-10-17.** **Amends [0595](0595-the-aqua-duck-paints.md)** in two places: what a splat leaves
behind, and what the Water Cannon looks like and how far it reaches. The marker's scatter, its colours and the
hopper's places ([0598](0598-the-secret-pilots-reviewed.md)) are untouched, and so is the jet's sweep and clock.

## The ask

From play, on the Aqua Duck:

> *"for the aqua duck - it's great - but the paint ball splats need to 'paint' the bosses and mini bosses, and
> hit walls and obstructions and fade away after 2-3 secs. the watergun special looks kind of like a laser
> instead of a water spray and needs to be a little bit longer as well."*

## The rule

**A paintball that lands leaves paint, in its own colour, for two and a half seconds: whole for a second and a
half, then fading out over the last one. Paint that landed on a boss — a mid-boss or the end boss, its hull or
any node of its body — is on it, and rides it as it moves and turns. A paintball that reaches the stone of a
corridor, a wall or an island, splats on it: its blast goes off at the face on the open side, and its paint is
on the wall and holds station with it. Anywhere else the paint holds station where it landed. The paint is
drawn over every body and under every shot.**

**The Water Cannon is a spray, ninety units long: strands of translucent water fanning from 2.8 across at the
nozzle to 8 across at its tip, churning, with drops flung off both edges and mist where it breaks up. It lands
as wide as it is drawn the whole way.**

| | was (0595) | is |
|---|---|---|
| **a splat's picture** | the blast itself, standing 40 steps in the blast pool — the bottom layer, so under the boss it landed on | the blast is unseen and a step long (`splatAt`); the picture is a pool of its own, `paint` (`leavePaint`, `stepPaint`), drawn by `paintScene` at the enemy shots' layer, before the jet |
| **how long** | 40 steps (0.67 s), holding station | `SPLAT_STEPS` 150 (2.5 s); wet for 10, then dried; faded over the last `PAINT_FADE_STEPS` 60 by the blit's alpha |
| **on a boss** | holding station in the world, under the hull | on the body the ball touched — `onBody` 0 for the hull, `k + 1` for node `k` — at an offset in the body's own frame, pulled to within `SPLAT_ON` (0.75) of its radius; carried each step by `ridePaint`, prev place from the body's prev place |
| **on the stone** | broke with a spark, as every shot does (0349) | `paintStone`, before `breakInStone`: the blast half a unit out from the face, the paint `SPLAT_INTO_STONE` (1.5) in |
| **the jet's picture** | one held column in a beam's stack (`BOLT_BEAM`): light added to the frame round a white core | five strands in `BOLT_SPRAY` (`SPRAY_LAYERS`: a body laid `source-over`, a sheen, a foam line, nothing wider); eight `sprayDrop` and three `sprayMist` blits |
| **the jet's numbers** | `length` 72, `width` 2.2 | `length` 90, `width` 1.4 at the muzzle, `tipWidth` 4 at the end, landed by `tetherInto`'s new `reachEnd` |
| **pools** | — | `CAPACITY.paint` 28; `WORST_CASE` 888 → 916 |

## Why

**The splat could not paint a boss from where it was drawn.** The blast pool is the first layer, under the
pickups and the boss, so 0595's splat on a boss was drawn behind the animal it landed on and the player saw
nothing; and it held station, so the boss flew off it. Moving the blast pool up the layers would have put every
bomb's blast over the boss too, which 0229's order refuses. So the picture left the blast.

**The picture is its own pool because of the bombs.** At 2.5 s a string of paint — one ball every six steps,
on every rung — would hold twenty-five blasts in a pool of thirteen, and a bomb thrown into the string would
land nothing. The blast keeps its job and its terms (lands once, on what it can see, on the step it lands) and
lasts that step; the paint is in no pairing. Twenty-eight is twenty-five with the shots' tenth of headroom, and
the ceiling moved for it on 0286's line, as the nova's and the storm's did: blits of a baked bitmap on a desktop
target (0153), while the marker is the gun. `tests/duck.test.ts` flies a six-second string and finds the paint
pool under capacity and the blast pool at two.

**2.5 s, faded over the last second.** The ask is two to three; the middle of it. Whole for 1.5 s is long enough
to see the paint ride a boss that is moving, and a fade rather than a cut is what *"fade away"* says. The fade is
the blit's `alpha` (0401's argument: still one draw of one bitmap), read off the paint's own clock by the painter,
as the jet's fade is read off `holdFor`.

**On the body it touched, found by where it landed.** The landing log keeps a place and a kind and no body, and
a second log naming bodies would be a second description of one landing (0595's own argument for the kind
column). A ball that landed on the hull is within the hull's radius and its own of the hull's centre, so the
nearest body to touching is the one. The paint is pulled in to three quarters of the radius, because a ball lands
at its own centre, outside the hurtbox, and a splat there is half off the animal.

**An index into the boss's pools, and not into the enemies'.** The hull is the boss pool's only slot and the body
pool is released from its end, so an index is the body for as long as it is under the pool's size; paint whose
body has gone goes with it, and `spawnBoss` lets go of anything on the slot before a new animal takes it. The
enemies' pool swaps a dead body's slot for the last one, so an index into it would hand paint to a stranger. **So
paint on an ordinary enemy holds station where the ball met it, and slides off a survivor at the scroll's speed**
— not asked for, and named here rather than hidden: riding an ordinary enemy needs an identity a pool slot does
not have.

**The stone is a wall the paint is on.** A ball breaking with a spark is 0349's rule for every shot; a paintball
breaks as paint instead. Its blast goes off at the face on the corridor's side, on the bomb's terms, so the splat
lands on what is beside the wall and never through it (stone stops a blast). The paint is a unit and a half into
the stone, most of its eight units on the wall. It is drawn after the Mire's bank (0383), so paint on the acid is
seen. A room's walls (0335) are not in this: no shot meets them.

**0295's question, raised: the paint shares the screen with everything.** At 2.5 s and ten balls a second there
can be twenty-five marks eight units across standing on a boss — a quarter of a big hull's face in paint. It is the
player's own, in the four paint colours each kept out of the places whose bullets wear its hue (0598), it is flat
and drying and fading, and it is drawn under every hostile shot, so it can hide no bullet. What it can do is hide
the boss's art and its hit flash under it; a hit is still told by the flash on the body round the paint and by the
cue, and a string held on one spot is the player choosing that. Owed to a play, not ruled.

**The jet read as a laser because it was drawn as one.** One straight stroke in `BEAM_LAYERS` is a wash, a dark
rim and glows *added* to the frame round a white core — 0470's column of light, which is a boss's laser. Water is a
translucent body, so its stack is laid over the frame, with a pale sheen and a thin line of foam and nothing wider
than the body: no rim, because five strands are laid across each other and a rim would cut a dark seam through each
one it crossed. Where the strands overlap, at the nozzle, the water is deep; where they part toward the tip it thins
and breaks, which is a spray. Each strand churns on `jag`'s hash, a new page every other step, so it boils; the edge
strands churn only inward, so the picture is never wider than the landing; the middle ones break off up to an
eighth short. The drops and the mist are known shapes and are baked and blitted (0022); only the strands are the
bolt's verb (0233), five strokes where the column was five with its dots. Every place on the spray is a function of
the link and the step it was laid, so nothing draws from a stream (0021).

**The landing follows the picture (0250).** A spray that opened in the picture and landed as the column would be
water the player watched pass over a body and do nothing. `tetherInto` takes `reachEnd` and lands within the reach
straight between the two; the tether leaves it out. The drops and mist past the edge land on nothing — they are the
spray's spatter, as the tether's sparks are.

**Ninety units, a quarter longer.** *"A little bit longer"*: at the end of its swing the tip is 47 units off the nose
where it was 38, so it sweeps 78% of the 120-unit lane where it swept 63%. With the cone that is about half again the
area the column landed on, on the same clock: a body takes it no more often, it is in it longer. Every one a play
number; the weigh against the bosses is owed.

**A drop is under a unit across** — half the smallest bullet's 1.8 — so nothing off the jet is a bullet's size beside
one, and it is in the water ink no place's bullet wears (0598).

## Rejected

- **The blast pool moved up the layers.** It would draw every bomb's blast over the boss as well, which 0229 put under
  it so the player can see what is inside it.
- **The splat's blast left standing for 2.5 s.** Thirteen slots for twenty-five splats; bombs would land nothing.
- **Paint riding an ordinary enemy by pool index.** Swap-release hands it to the next body in the slot.
- **The spray landed as the column under a wider picture.** 0250's lie the other way round, about the player's own fire.

## Rollback

Nothing irreversible: no key, no save field, no cache prefix.

## What guards it

`tests/duck.test.ts`: *0610 — the paint sticks* (on a boss and riding it, turning with it, drawn over it and under every
shot, whole over a second and gone between two and three, on the stone and holding station with it, the blast pool left
to the bombs, a life lost and a boss gone), and in the Water Cannon's block *lands as wide as it is drawn*, *lands only
where it is drawn* (now against the cone) and *is painted as a spray as wide as it lands* (in pixels). `tests/budget.test.ts`
holds the new ceiling; `tests/accents.test.ts` names the spray's two bitmaps as having no hull. Probes in
`scripts/probes/0610-the-paint-sticks.mjs`; 0595's colour probe re-anchored onto the paint and its picture probe renamed.

## Owed

- **The proof** of this decision's probes (`npm run prove 0610`), which was not run in the session that built it.
- **A play**: the paint on every boss and mid-boss, on the corridor's walls and islands and on the Mire's bank; how much
  of a boss twenty-five marks hide (0295); the spray's look and its ninety units; the jet against the bosses at its new
  area (`scripts/weigh-boss.mjs`, not re-run).
- **A photograph at the shipped camera** of the spray mid-sweep and of paint on a boss.
