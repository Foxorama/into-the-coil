# The places are painted — a queue of eight

**2026-09-21.** A plan, and it is a queue: one PR each, in this order, each judged in a photograph and
then by the player on its own preview URL. [0342](../docs/decisions/0342-the-hulks-come-out.md) is
item 0 and has landed with this file.

## The report

> *"The backgrounds for each level are kind of basic and crappy. Can we remove the 'asteroid' layer
> … and then improve each level."*

Followed by one paragraph per place, quoted under each item below.

## What the photographs say, before anything is argued

Every place was shot at three camera points with `scripts/shot-place.mjs` before a line was changed.
**The report is accurate in every particular**, and the seven pictures have one cause between them:

**Every mark in every backdrop is a flat fill or a hairline stroke in one of three hexes.** `Pen`
(`src/render/bake.ts`) carries both `createLinearGradient` and `createRadialGradient`, and in the sky
they are called in exactly three places — the clouds, the Pillars and the heart (counted with `grep`).
The Toxic Mire's ground still carries a comment explaining that it is drawn in bands *because `Pen`
has no linear gradient*, which is no longer true of `Pen`. A ridge is one polygon
in one colour. A canopy is one polygon in one colour. A star is a disc in the one `sky` ink. Seven
passes — 0195, 0196, 0211, 0220, 0221, 0222, 0223 — each added *shapes* or *a hex*, and the vocabulary
those shapes are drawn in never changed.
[`the-vocabulary-is-the-ceiling`](the-vocabulary-is-the-ceiling-2026-09-08.md) found the same thing
about the bosses and the answer was the same: it is not more marks, it is what a mark is allowed to be.

**And nothing in a backdrop moves except by scrolling.** A sky is static tiles at four parallax rates
(`skyFor`, `src/app/mount.ts`) plus landmarks, and a landmark's only motion is a swell of its own
scale — which is what *"one pulsing graphic"* is a literal description of. Three of the seven asks
below are for things that move.

## Two mechanisms the queue needs, and where each is built

Neither is built ahead of the place that needs it — a mechanism designed against no picture is how the
hulks happened.

**1 — A painted tile.** Gradient fills, several hues per surface, lit and shaded faces, texture. No
new machinery: it is `Pen`'s existing verbs used in the ground, structure and star painters, at bake
time, which `tests/budget.test.ts` already lists as cold. Arrives with item 1 and grows with each
place. **Cost that is owed a measurement, per place:** lit area is what `skyCover` counts against the
gameplay contrast floor ([0198](../docs/decisions/0198-the-accessibility-pass-comes-after-the-game.md)
deferred WCAG and did not defer that), and `scripts/weigh-sky.mjs` is the instrument. Ember Nebula and
The Toxic Mire have the least headroom and are the two asked to become the most vivid; if the floor
and the ask collide the answer is a decision about the floor or the foe ink, stated in that PR, never
a quietly dimmer picture.

**2 — A backdrop that moves.** Small baked sprites — a lava bomb, a bubble, a bead of light — blitted
at positions that are a pure function of the step count and an index: no pool, no allocation, no
randomness drawn in the frame, nothing the sim can see
([0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md): a comfort setting may switch
it off and the game is unchanged). Each place **authors its own** sprite, path and cadence on its own
row ([0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md));
shared code holds only the blit loop and the draw-call ceiling
([0025](../docs/decisions/0025-the-frame-budget-is-counted-not-timed.md)). Arrives with item 3,
because Saurian Belt is the first place that needs it. **Unverified:** what the ceiling should be —
0335's room costs about forty blits against five hundred, which says there is room, and the number is
owed a count in that PR rather than this sentence.

## The queue

**How the first three were built, what bit, and starting notes for each place that is left:**
[`how-the-places-get-painted`](how-the-places-get-painted-2026-09-21.md). Read it before item 3.

⚠️ **AN ITEM IS THE WHOLE PLACE, NOT THE PARTS OF IT THAT WERE NAMED.** Added 2026-09-21, after item 1
was handed over with The Approach's grey limb left alone because *the ask was the stars*:

> *"Fix the grey up the bottom as well … same for the other levels, if there's an aspect that's not
> going to be good quality that I haven't mentioned, make sure it's picked up and updated to be good
> quality or removed if it doesn't fit."*

So every item below starts from the photographs of its place and accounts for **everything in them**:
each thing on screen is made good, or removed, or left with a reason written in that item's decision.
*Removed* is a real answer — 0343 removed the limb rather than polish something a tile cannot draw.

**A candidate, not owed:** a world to leave behind in The Approach, as a **landmark**. It needs a
decision about draw order first — 0343 says why.

Each item leads with **what the player will see differently, in a sentence, with no number in it** —
[state-of-play](../docs/state-of-play.md)'s own rule after 0196 — and that sentence is what the
photograph is checked against afterwards.

### 0 — The hulks come out ✅

[0342](../docs/decisions/0342-the-hulks-come-out.md).

### 1 — The Approach: a star field drawn for a desktop ✅

[0343](../docs/decisions/0343-the-stars-are-drawn-for-a-desk.md) — and the two collisions this item
predicted below did not happen; the decision says why, and what was unguarded instead.

> *"I want a starfield optimised for desktop, it looks passable on mobile, but drawn out, big, chunky
> and just monocoloured on desktop."*

**Will see:** a deep field of pin-sharp stars in several colours and brightnesses, a few bright enough
to carry a soft halo, with a faint band of far light behind them — where there are now evenly grey
discs.

**Why it is chunky — by arithmetic from the constants, not yet by a pixel count:** a star's radius is
authored in world units (`SKY_MAX_STAR_UNITS`, up to 0.6) and the bake is up to ten pixels a unit, so
the biggest star is a twelve-pixel disc on a 1080p screen; and every star is filled in the palette's
one `sky` ink. A smaller screen bakes at fewer pixels a unit, which is the likely reason it passes on
a phone — likely, because no phone has been photographed for this.
[0153](../docs/decisions/0153-desktop-is-the-target.md) says which of those two screens the sky is
authored for. `fieldOf` draws every radius from the top half of that range, so there is no small star
in the field at all: `tests/budget.test.ts` records the far layer at 8.5 CSS pixels on a 1280×720
screen and the near one at 4.0.

⚠️ **Two budget guards bear on this and neither has been run against a new field yet.**
[0106](../docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md) holds a layer's **thickest**
mark above 2.5 CSS pixels — written for the speed streaks, and read as written it permits a field of
pinpoints with a few bright stars in it, which is the picture being asked for. The `ink` band beside
it holds a floor on a layer's total drawn area, and a field of pinpoints may fall under that; if it
does, the floor's reason is argued in that PR against the photograph
([0192](../docs/decisions/0192-a-guard-holds-an-invariant.md)), not met by fattening the stars again.
The star colours are new inks and `tests/sky.test.ts`'s cover arithmetic has to count them.
**To look at in the same pass:** the `skyRush` streaks read as horizontal scratches in a still
photograph. They are a speed cue and may be fine in motion — that is a question for the preview, not
for this file.

### 2 — Ember Nebula: the same nebula, in colour ✅

[0345](../docs/decisions/0345-ember-nebula-is-in-colour.md) — which also found the dust was slabs and
zigzags, smoothed the Pillars, and spent 0.24 of the place's contrast room on purpose.

> *"The nebula background is decent now, but it needs to be a more vibrant beautiful backdrop."*

**Will see:** gas in several saturated hues at once — magenta, ember, violet, a cold thread — with
bright cores, stars showing through the thin parts and the dark dust still in front of all of it.

Keep the composition (lanes, filaments, globules, Pillars); change what the gas is painted in. **The
collision named above is sharpest here**: this is the place 0196 measured at a third of the others'
headroom, and every structure mark in it is dark for that reason. Measure first.

### 3 — Saurian Belt: a jungle under a live volcano ✅

[0347](../docs/decisions/0347-the-belt-is-a-jungle-under-a-live-volcano.md) — mechanism 2 built
(rock on the sim's clock, per entry); the land is lit rather than made brighter than the sky, so
0221's guard stood and a floor on the lit colours joined it; and a tile seam on every planet was found
and fixed on the way.

> *"The volcano is one pulsing graphic that doesn't touch the sky and isn't actually firing any rocks
> or anything, the closer layers and sky layers are a monotone blue with no detail to them, it doesn't
> scream jungle world at all."*

**Will see:** a sky that grades from haze at the horizon to deep blue overhead; misted far mountains,
a green canopy ridge with actual tree shapes, near foliage sliding past fastest; and a volcano whose
smoke column climbs out of the top of the screen while it throws glowing rock in arcs.

First use of mechanism 2. The scale-swell on the volcano goes — a mountain does not breathe. **Touches
[0221](../docs/decisions/0221-a-planet-is-not-a-space.md)'s guard** that land is darker than the sky
over it: a green canopy in daylight may not be, and that guard's reason (the bottom of the screen
stays the darkest thing on it) has to be re-argued against the picture rather than worked around.

### 4 — The Labyrinth: walls the whole way ✅

[0348](../docs/decisions/0348-the-labyrinth-is-walled.md) — every flank answered with a gap it opens
as it arrives; drifters turn at the wall (the player's answer mid-build); the backdrop became the maze
going on below, and the room's stone was rebuilt as masonry.

> *"The end boss has some walls around it, but otherwise there's no labyrinth that the player is
> actually flying through."*

**Will see:** masonry along the top and bottom of the flying space for the whole level, in the same
stone as the boss's room, with side passages, pillars and junctions going past — so the room at the
end is where the corridor arrives rather than the first wall in the level.

[0335](../docs/decisions/0335-the-fight-happens-in-a-room.md) already stands walls at the edge of the
player's box, in world positions, and that is the language to extend: **the clamp that has been in the
game since 0074 is the wall, so nothing new collides.** ⚠️ **The riskiest item, and the reason is
known:** flanking waves enter across the lane's edge (`flankAlongFor`, `src/sim/camera.ts`), which in
a walled corridor is *through the masonry*. Either the walls open where a flank arrives, or this
level's flanks move — the second is a level-design change and is the player's call, so this item
starts with that question and a picture of each answer, not with geometry.

**Answered, 2026-09-21:** *"For the flankers have the walls open with gaps, and/or move the flankers
so they come down the corridor."* Both are allowed, so the choice is per wave and is made against the
picture: a gap where a flank reads well coming out of a side passage, down the corridor where it does
not.

### 4b — The Labyrinth: the corridor turns, and it forks

> *"Next phase of the labyrinth is to have the background move up/down with branching paths so it
> feels like a labyrinth as well anyway — the straight corridor to the boss is not a labyrinth, it's a
> boring corridor."*

**Will see:** the corridor climbing and dropping across the screen as it goes, splitting around
islands of stone into an upper and a lower way that rejoin further on.

⚠️ **This is a game change and not a backdrop, and it is its own item for that reason.** 4 works
because its walls stand where the ship's clamp already is, so nothing new collides. A corridor that
moves is walls that are **inside** the lane, and three things the sim has never had to answer come
with that — each is owed an answer in 4b's own decision, before geometry:

| the question | why it cannot be skipped |
|---|---|
| what a wall does to the ship | the clamp would have to follow the corridor along the level — a wall that pushes, which is 0074's rule moving; or a wall that hurts, which is a new way to lose a life |
| what a wall does to a shot | if a wall stops bullets, a fork is cover and the level is a different level; if it does not, shots cross solid stone on screen and [0036](../docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md) says that gets reported as a collision bug |
| where waves may be placed | every spawn in the level is authored across the full hundred of `across` ([0023](../docs/decisions/0023-the-long-axis-is-the-scroll-axis.md)), and a wave has to arrive inside the way the player can be in — at a fork, inside *both* |

4 lands first and is built so 4b can move it: the walls are authored as a centreline and a gap along
the level, which for 4 is a constant and for 4b is a curve.

### 5 — Rime Shelf: far more ice

> *"Needs to be far far more icy — different whites and blues and aquas and teals etc."*

**Will see:** ice in a dozen colours — white crests, aqua faces, teal shadow, deep blue crevasses with
light in them — as faceted cliffs and bergs rather than two flat dark terraces, under a paler, colder
sky with something moving in it.

0221 made this place *austere* on a report that asked for it; this report asks for the opposite, and
the newer one wins. Rime Shelf has the most contrast headroom of the seven, which is what pays.

*Landed as [0351](../docs/decisions/0351-rime-shelf-is-ice.md).* ⚠️ **The sentence above was wrong**:
measured, Rime Shelf had the *least* room of the seven (1.09×), and the floor puts a ceiling on the
ice's palest colour far below white — 0351 has the numbers and what they leave to the player.

### 6 — The Toxic Mire: a ceiling, a swamp and acid

> *"Overgrowth ceiling needs to be raised and to be an actual ceiling, the background needs to be
> swampy trees and murk and the ground needs to be vibrant glowing acid pools spitting bubbles."*

**Will see:** a thick tangled roof across the top of the screen with growth hanging from it; drowned
trees standing in layered murk behind the fight; and along the bottom, pools of acid bright enough to
light what is near them, with bubbles rising and bursting.

The canopy's edge is authored at tile 0.4, which is lane 30 — a third of the way down the flying
space, confirmed in the photograph. **`tests/places.test.ts` holds *the corridor is tight* as 0221's
ask in lane units**; this ask reverses it, so that guard changes in this PR and says why. Second use
of mechanism 2, with its own sprite and its own motion — a bubble rises and pops, it does not arc.

*The ceiling, the swamp and the pools landed as [0352](../docs/decisions/0352-the-mire-is-a-swamp.md);
the bubbles did not, and are the next piece of work — mechanism 2 has to come off the landmark first.*

### 7 — The Black Heart: veins, and stars behind them

> *"Needs veins pulsing throughout the level and a beautiful starry backdrop."*

**Will see:** a dense, coloured star field like nowhere else in the run, and across it dark branching
vessels running the length of the level with light travelling along them in the heart's own
two-thumps-and-a-rest.

The star painter from item 1 with **this place's own row** — count, colour and depth authored here,
not inherited. The pulse is mechanism 2's third use: beads of light following the vein paths, timed to
the beat `tests/places.test.ts` already holds for the landmark. 0211 made this place *nearly empty* on
purpose; the player has now seen that and asked for the opposite.

## What is not in the queue

**The boss arenas**, except where a place's own item changes what is behind them. **The high-contrast
palette's version of each place** is authored in the same PR as the vivid one, because `space`,
`nebula`, `glow` and `ground` are per palette and a place cannot be half-painted.

## What is owed across all of it

**An eye, per place, on a deployed URL** — the music room walks every sky in the run's order
([0212](../docs/decisions/0212-the-room-walks-the-level.md)), so no place needs six boss fights to be
looked at. Every sentence under *will see* is a claim to be checked against that, and a place is not
finished because its PR merged.
