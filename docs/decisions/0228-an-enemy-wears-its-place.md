# 0228 — An enemy wears its place

**Accepted 2026-09-04.** The second of the art pass, over the pipeline
[0227](0227-a-sprite-is-painted-not-filled.md) laid.

> *"I want detailed sprites for each level… enemies."*

## ⚠️ A skin and not a roster, because every level sends nearly all eight kinds

`src/content/levels.ts` sends drifters, lancers, weavers, turrets and chargers to every one of the
seven places, and wardens, spinners and sowers to most. *"Detailed sprites for each level"* read as a
new enemy per level would be a new **behaviour** per level — a pilot and an attack nobody asked for —
and it would leave the eight kinds the levels actually use looking exactly as they do. What a level
can honestly give its enemies is a **livery**: the silhouette still says what a body does
([0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md)), and the skin says
where it is.

## The rules

**A place has a `foe` skin: a hull, a plate, a lit strip and an eye.** `THEMES[theme].foe` in
`src/content/themes.ts`. An enemy is sealed in the hull colour and painted with the other three; a
boss — fought in one place only — is painted in the same skin at four to six times the size.

**A place has a motif, and it goes on everything the place sends.** Rivets, embers, scales,
circuitry, facets, spores, veins — seven arms over the closed union in `motif`, scattered on a seeded
grid inside a per-kind BELLY and kept only where every corner fits. Clipped by arithmetic and never by
`clip()`, so `tests/accents.test.ts` can measure every mark it keeps.

**The hull colour is held to `enemy`'s own two floors, against the place's own backdrop.**
`tests/foes.test.ts`: the gameplay floor against the backdrop, and the separation floor against
`pickup` and `player` — the two confusions `tests/palette.test.ts` names as costing a life. No two
places skin alike, and no two hulls are within 20° of one hue.

**What shoots back is still the `enemy` ink, everywhere.** A bullet is a mark the player must not
touch; *pink will hurt you* is one rule across the run, and the level-one raiders carry that ink as
their lamps so the rule is taught on the thing that fires them.

**The high-contrast palette gets the flat game.** `foeOf` hands back every part in the `enemy` ink
for any palette whose decoration is the void — read off the palette's own property, not its name —
and an enemy on it is one fill and one outline, as it has always been.

## ⚠️ Every silhouette and every extent is where it was

Nothing in `tests/legibility.test.ts` moved. The drifter is still a diamond and the lancer a
triangle; the weaver's bar and the charger's needle are still told apart by which way they lie.
What the picture adds is a second channel per body — an underside in shadow, a strip in the light, an
eye looking down the lane — and a third per place.

## ⚠️ What the picture said, and the instrument it caught

**The sheet had been baking level one under every backdrop since 0195.** The first shots of the
skins came out identical in all seven places — grey raiders on a green world — because
`rig/sheet-page.ts` called `bakeAtlas` without the chosen place and the baker defaults to
`approach`. The backdrop changed and the bake never had; nothing on the page said so. Every place's
sky tiles were The Approach's there too. [0116](0116-the-rig-plays-the-level.md)'s rule, arriving on
the sheet: the instrument bakes what the game bakes, or its verdicts are about a picture nobody sees.

**A carved interior is paint, not a hole, and the guard cannot see through it.** The sentinel's
rivets landed on its keel and the shoal mother's plate crossed its streaks, both green: 0149's
interiors are painted in `space` after the seal, so the traced hull has no hole where they are. The
bellies are authored either side of a carve now, and the rule is stated here rather than guarded —
a mark over a carve is the same picture as a mark over a hole, and the guard's `inside` reads the
hull pass alone.

**The chorus is holes wherever two lobes meet.** Three overlapping circles under `evenodd` cancel in
every lens, so a plate laid across the lower lobe was over the void at 7.5 px; its paint sits on the
outer halves of the lobes, which are the only solid parts that are not the spine.

**Two of the seven guards ran once and now run seven times.** `tests/accents.test.ts` traced every
body at The Approach; a motif differs per place, so it traces every body in every place.

## What is owed

- **An eye on the game.** A skin is judged on the sheet against the place's void; a play-test says
  whether Rime Shelf's blue enemies read against a blue sky in motion.
- **The enemy bullets are the one thing in a place still in one flat ink**, on purpose.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). The atlas is baked at load.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0228`, and `0149` and `0227` re-aimed where the arms moved:

| broken on purpose | went red |
|---|---|
| a place given another place's skin | `THE REPORTED ONE: every place skins its enemies, and no two places skin them alike` |
| Rime Shelf's enemies painted a blue that vanishes into its sky | `and a skin's hull is legible on its own backdrop` |
| The Toxic Mire's enemies painted the pickup's own pale green | same |
| the high-contrast palette given the place's skin | `and the high-contrast palette gets the flat game, with no skin on anything` |
| a motif kept wherever the grid put it | `THE 0149 ONE: every solid mark on a body is inside its hull` |
| the charger sealed and left flat in every place | `and every enemy and boss is painted in the vivid palette, in every place` |
