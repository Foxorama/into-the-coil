# 0149 — A hull has an interior, and it is drawn in the ink that means nothing

**Accepted 2026-08-14.** [`where-the-art-ceiling-is`](../../reports/where-the-art-ceiling-is-2026-08-14.md)
is the survey; this is the change it names, items 1 to 4 of *What the next session would have to
build*. Standing instruction behind it: *"if you're not sure on the music, kick on with the art styles
and boss styling, we can upgrade that and then go back to working on the music when I get back."*

## The rule

**`drawKind` draws a hull and then, where a kind declares one, an interior on top of it in
`palette.space`, inside the same bitmap.** The declaration is `ACCENT_OF`, a `Record<SpriteKind, Accent
| null>` beside `INK_OF`; an `Accent` is a list of boxes and discs in fractions of the hull radius.
**Seven kinds have one and they are the seven bosses.**

## What it is not

⚠️ **Not `variant`.** The report names it as the larger and later change and says why it must not ride
along:

> *"it touches `SPRITE_KINDS`, the atlas and [0016](0016-a-hub-enumerates-kinds.md)'s hub rules, and
> it should not be bundled with a visual change — a verdict on the picture and a refactor of the
> pipeline in one PR is unattributable."*

Nothing here builds it. `bake.ts` still stands fourteen `SpriteKind`s up for seven bosses and the
smell is unchanged.

⚠️ **Not a tint by theme**, which the report lists under *What is NOT recommended*: it would put an
accessibility-guarded ink under a level's control, which is
[0024](0024-the-accessibility-floor-is-settings.md) read backwards.

⚠️ **Not an `evenodd` hole.** A hole is transparent and shows the sky through it; this is opaque void
painted over the hull. Both are wanted and only the first existed. The accents are deliberately kept
off the holes the hulls already have — `boss3`'s lattice, `boss5`'s ports, `boss7`'s ring — and the
guard is what says so.

⚠️ **Nothing in the music channel is touched.** Not a file, not the ladder, not a tempo, not a place's
notes. The player is holding a verdict on all seven places
([0148](0148-a-place-has-its-own-notes.md)) and asked for their own ear on it.

## Why `space` and not a new ink

| | |
|---|---|
| `impact` | the hit-flash ink. A permanently impact-coloured core muddies the one piece of feedback [0035](0035-damage-is-legible-on-the-body-that-took-it.md) exists for |
| `hazard` | means *this will hurt you* |
| a new role | a palette change, and a contrast pair that is not already on screen |
| **`space`** | **means nothing, which is what decoration should mean** |

[0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md) is about what the
player must TELL APART, and a vent is not one of those things.

⚠️ **AND THE REPORT NAMED THE WRONG GUARD, WHICH IS WORTH A PARAGRAPH BECAUSE THE CONCLUSION SURVIVES
IT.** It credits `tests/themes.test.ts` with holding *space-on-enemy* against every backdrop in every
palette. That file skips `space` in as many words — `if (ink === 'space' || ink === 'sky') continue` —
because its subject is a backdrop and space is what a backdrop is measured against. The guard that
applies is `tests/palette.test.ts`'s *every ink is legible against space*, over every ink in every
palette, and it applies because **an accent is never drawn on the backdrop**: it sits on the hull, so
its pair is `space` against the hull's own ink — the outline's pair, already on screen around every
sprite in the game. **No palette moves and no new contrast is asked for.**

## Why the bosses and nothing else

A boss is 26 to 38 world units — four to six times anything else on screen — which is the licence
`bake.ts` already gives their silhouettes for being complicated. An enemy is five to nine units, and
[`enemy-silhouettes`](../../reports/enemy-silhouettes-2026-08-05.md) measured what survives twenty
pixels: outlines, not detail. The forty-four `null`s in `ACCENT_OF` are the guard, not noise — an
eighth boss cannot be added without someone writing down whether it has an interior, which is
[0016](0016-a-hub-enumerates-kinds.md)'s whole claim.

## ⚠️ THE PART A READING COULD NOT CHECK, AND IT IS MOST OF THE WORK

*Is this mark on the hull* is arithmetic and not a look at the file. The hulls are drawn imperatively
into a canvas context; three are holed with `evenodd`; and `boss6` is **three overlapping circles and
a bar whose overlaps CANCEL**, so half of what looks like its body is a gap. An accent that pokes out
of a silhouette and an accent laid across a hole both read as completely correct source.

⚠️ **`src/render/bake.ts` WAS THE ONE PART OF THE PICTURE NO GUARD COULD READ.** The only way to see
what it drew was to bake a real atlas, which needs a `document`, which means `dist/` and a real
Chromium. So the silhouettes have been held by prose and by eyes since the file was written, and
[`enemy-silhouettes`](../../reports/enemy-silhouettes-2026-08-05.md) records what that cost: a shape
reasoned to be *obviously not a diamond*, which shipped as a diamond.

**So `drawKind` now takes a `Pen`** — fifteen members of `CanvasRenderingContext2D` rather than the
whole of it. A real context satisfies it structurally and `bakeOne` is unchanged; what it buys is that
`tests/paths.ts` can implement one, flatten the arcs and hand back the sub-paths as polygons. It is
the move [0065](0065-the-sky-is-baked-and-blitted.md)'s `skyField` and `bakeSize` already made: state
the quantity a guard needs in something node can hold.

⚠️ **AND THE TRACE IS OF THE REAL DRAWING RATHER THAN A SECOND COPY OF IT** —
[0027](0027-measure-the-picture-not-the-model.md). Nothing in `tests/paths.ts` knows what a boss looks
like. Containment is measured between the hull pass and the accent pass of the same trace, so it holds
for whatever a future edit puts in the `case` arm.

## The guards, and the units they are written in

⚠️ **IN CSS PIXELS OF A 1280×720 SCREEN, WHICH IS THE SCREEN EVERY PLAY-TEST IN `reports/` WAS GIVEN
ON.** 0027: *"at least one assertion is written in units the player experiences … because a guard
measuring a quantity defined in terms of the constant it guards proves only that the code agrees with
itself."* A clearance in fractions of `r` would have been exactly that — `r` is the constant the
accents are authored in. `drawKind`'s coordinates are all fractions of `size`, so tracing at
`SPRITE_EXTENT × view.scale` makes every traced coordinate a pixel somebody looked at.

| the claim | measured |
|---|---|
| every boss is drawn in two inks | two fills, one stroke, one bitmap |
| the interior stays inside the hull, with room to spare | **17.3, 9.1, 5.7, 14.8, 16.2, 5.2, 8.6 px** — floor 2.5 |
| …and never over a hole | the mark's interior is sampled on a grid, not just its outline |
| the interior never moves the silhouette | the accent's bounds are strictly inside the hull's |
| no mark is too thin to be drawn | ≥ 2.5px, which is [0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)'s own floor |
| a hurt boss carries the same interior | the shape stays equal so the flash stays an ink |
| no two boss hulls are the same drawing | compared with the interiors **off** |
| the blit count is unchanged | `tests/budget.test.ts`, since 0022 |

⚠️ **THE FLOOR IS A ROOM-TO-SPARE NUMBER AND NOT A CONTAINMENT ONE.** *Inside the hull* is `> 0`; 2.5
CSS pixels is 0106's own floor read as a gap instead of a mark, because a strip of hull thinner than
the smallest thing this game will draw reads as a bite out of the silhouette rather than as a mark on
it. The tightest of the seven is `boss6` at twice the floor.

⚠️ **AND THE BLIT COUNT IS NOT GUARDED TWICE.** The report said `tests/budget.test.ts` already counts
it and it does — *the worst-case scene costs one blit per entity, and nothing else*. The honest way to
discharge that is to break what it claims to catch rather than to write a second copy, which is
`tests/one-description.test.ts`'s admission rule pointed at a guard instead of a constant. The probe
below blits every entity twice — what an interior built as an overlay sprite would have cost — and
that guard goes red.

## ⚠️ AND THE PICTURE WAS LOOKED AT, WHICH IS THE HALF NO GUARD ABOVE COVERS

[0027](0027-measure-the-picture-not-the-model.md) says an eyes-on rig renders at the camera the game
actually ships, and `scripts/shot.mjs` says a sprite is legible or it is not **at the size and against
the background it ships** — *"not a fixture, not a sprite sheet, not the atlas laid out on a grid."*
So all seven were photographed in the running game at 1280×720, off seven scratch builds with level
one's waves emptied and its `bossAt` moved to 60 so each hull arrives six seconds in. Every one reads
as its hull's own idea, `boss5`'s ports and `boss7`'s ring still show the sky through them, and
nothing hangs off a silhouette.

⚠️ **THE SHOT RIG CANNOT REACH A BOSS ON A SHIPPED BUILD, AND THAT IS A SEPARATE FINDING.**
`node scripts/shot.mjs --at=195000` photographs the **title screen**: the run starts, nobody flies it,
three lives are gone long before 4,270 units of camera, and the run-over offer expires back to the
title. Four shots at 150 s to 195 s came back byte-identical. Nothing about it is caused by this
change and nothing here fixes it — it is written down so the next session does not spend the same
three minutes discovering it.

⚠️ **AND THE BOSS5 COMMENT WAS WRONG UNTIL THE PICTURE SAID SO.** Its bands were described as
*behind* the gun ports, which is true in the sprite's own `+x` coordinates and false on screen: an
enemy hull faces `−x`, so they are forward of them. A number that reads correctly in the file and
wrongly in the picture is exactly 0027's subject, and it was a comment rather than a coordinate only
by luck.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0149`, all eight red on the guard they name:

| broken on purpose | went red |
|---|---|
| one boss handed back its flat fill, so it is the ceiling the report measured again | `THE REPORTED ONE: every boss is drawn in two inks, and the file offered one` |
| an accent grown across the hole the hull cut on purpose, so a ring bakes as a disc | `and the interior stays inside the hull, with room to spare, in CSS pixels of a 1280×720 screen` |
| an accent pushed out to the edge of the hull, so three marks hang off the silhouette | `and the interior stays inside the hull, with room to spare, in CSS pixels of a 1280×720 screen` |
| a hurt boss left without the interior its hull has, so a flash changes the silhouette | `and a hurt boss carries the same interior, so a flash is still one object being hurt` |
| an accent authored too small to draw, so it is absent rather than wrong | `and no mark on one is too thin to be drawn at all` |
| a boss given another boss's hull, so only their interiors tell the two apart | `THE 0081 ONE: no two boss hulls are the same drawing once the interiors are taken off` |
| a default interior for kinds that declared none, so the table stops deciding anything | `and a kind with no interior is drawn exactly as it was` |
| a second blit per entity, which is what an interior drawn as an overlay sprite would cost | `draws exactly one call per live entity, plus one clear` |

⚠️ **`ctx.clip()` WOULD HAVE MADE CONTAINMENT TRUE BY CONSTRUCTION AND IS DELIBERATELY NOT USED.** A
clip to the hull path cannot be broken on purpose, so a guard over it could never be seen to fail, and
[0005](0005-a-guard-must-be-seen-to-fail.md) says that is a guard nobody has the right to trust. The
two probes above are the reason the clip is not there.

## What it costs

| | |
|---|---|
| at runtime | **nothing** — the same bitmap, so the same blit. [0022](0022-frame-rate-is-a-feature.md) and [0025](0025-the-frame-budget-is-counted-not-timed.md) count draw calls and allocations, not path segments |
| at load | one more `fill` per boss, in a file already on `tests/budget.test.ts`'s deliberately-cold list |
| in memory | nothing; the atlas already holds these bitmaps |
| in the palette | nothing; `space` is an existing role and no value moves |
| in the sim | nothing. Silhouette bounds are unchanged, so collision, [0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)'s pairing and [0101](0101-the-sky-is-a-hurry-and-the-boss-holds-back.md)'s screen share are untouched |

## Rollback

**Reversible in one revert, and it touches no irreversible surface** —
[0001](0001-revertability-not-risk-rating.md). No storage key, no save-schema field, no service-worker
cache prefix, no origin, no manifest. The atlas is baked at load and on rotation from source, so a
revert produces the previous picture on the next page load with no migration and nothing stale to
clear: a player mid-run on the old build keeps playing the old build, and a reload gives them
whichever one is deployed. `git revert` of this PR restores `drawKind`'s single fill, deletes
`ACCENT_OF`, `tests/accents.test.ts`, `tests/paths.ts` and the probe file, and returns `drawKind` and
its three siblings to `CanvasRenderingContext2D`.

## Still open

⚠️ **The seven accents are AUTHORED and unflown.** The geometry is guarded; whether a keel, a spine,
four nodes, three streaks, two bands, three eyes and a pupil are the right seven marks is a question
for eyes. Nothing about the picture is settled by a green suite —
[0027](0027-measure-the-picture-not-the-model.md) is the whole of that.

⚠️ **`variant` is still owed**, and so is the fourteen-kinds-for-seven-bosses smell it would end. The
report has the argument; this decision deliberately leaves it standing so that a verdict on the
picture is attributable.

⚠️ **The ships and the enemies are still one flat ink**, on the size argument above. If a play-test
says the bosses now read as a different class of object from everything else, that is the trade being
reported rather than a defect — and the answer is a row in `ACCENT_OF`, not a new mechanism.
