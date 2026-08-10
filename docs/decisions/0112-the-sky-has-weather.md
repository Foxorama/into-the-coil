# 0112 — The sky has weather, and a thing with no edge may be bigger than a bullet

**Accepted 2026-08-11.** The sky item of
[the-ninth-play-test](../../reports/the-ninth-play-test-2026-08-10.md).

**It amends [0069](0069-the-sky-is-behind-the-game.md)**, which is the first time that ceiling has
moved in the project's life.

## The rules

**The sky may draw something bigger than a bullet only if it has no edge** — and then it must be far
larger than a bullet, fainter than the faintest field of marks, and slower than all of them.

**A sky guard finds its layer by SPRITE, never by position.** Draw order is what decides depth, so a
layer added at the back moves every index in the file.

## What was asked for

> *"almost there. needs to be a bit faster. also needs to be more than streaks and some weird
> colouration per level. needs an actual space skyscape with nebulous clouds and such like."*

⚠️ **THE SEVENTH REPORT ABOUT THE SKY'S SPEED AND THE FIRST ABOUT ITS CONTENT.** *A bit faster* is the
smallest speed ask any of the seven has carried, which is itself the finding: 0106 moved it and the
movement registered.

## Only one layer could pay for *a bit faster*

⚠️ **[0103](0103-the-fast-layer-is-in-front.md) MEASURED THE ROOM AND THERE IS ALMOST NONE.**
`tests/budget.test.ts` derives a per-layer ceiling from how much of a bullet each mark looks like; the
near dot layer sits at **0.825 against 0.845**. The far layer has room to 0.671 and cannot use it
alone — moving it would close the 2.5 between them, which is the parallax and is the only thing that
reads as depth at all.

**So the streak layer takes it: 2.2 → 2.7.** That is *a bit*, against the doublings the previous six
asked for.

## And the other half is what actually makes a sky look fast

⚠️ **WHAT THE EYE READS AS SPEED IS THE SPREAD OF RATES ON SCREEN, NOT THE LARGEST OF THEM.** Six
passes moved the top of the range. A nebula at **0.09** moves the bottom for the first time:

| | slowest | fastest | spread |
|---|---|---|---|
| as shipped | 0.33 | 2.2 | **6.7×** |
| here | 0.09 | 2.7 | **30×** |

The game sits at 1 inside it.

## A cloud cannot exist under 0069 as written

⚠️ **0069's RULE IS *NOTHING THE SKY DRAWS IS AS BIG AS A BULLET*, and it is enforced as a clearance
from the world's own rate scaled by how much of a bullet a mark looks like** — `|depth − 1| > share ×
0.5`. A cloud is enormous. Under the rule as written it can never be drawn.

⚠️ **WHAT MAKES A MARK CONFUSABLE WITH A THREAT IS A HARD EDGE AT A BULLET'S SCALE, NOT AREA.** A disc
two units across with a boundary is a bullet; a gradient forty units across that never resolves to a
boundary is a place. 0069's measure was *thickness* because everything the sky drew was a dot or a
line, and thickness was the whole of what those could be wrong about. **The word *mark* was doing work
nobody had noticed, because there had never been anything else.**

⚠️ **THE AMENDMENT IS BOUNDED FROM THE OTHER SIDE, WHICH IS WHAT KEEPS IT A RULE.** A cloud must be

- **far LARGER than a bullet** — ten times the smallest threat's radius, measured off `nebulaField`;
- **fainter than the faintest field of marks** — under `SKY_ALPHA.skyNear`, measured off `skyField`;
- **the slowest and first-drawn layer there is.**

**A cloud that shrank towards a bullet's size fails its own guard**, which is exactly what an
exemption would not do. Three of the four probes break one of those three bounds.

⚠️ **AND THE EXEMPTION WAS ALREADY BEING GRANTED SILENTLY, WHICH IS THE PART TO READ.** Run through
the clearance arithmetic unchanged, a nebula reports a thickness of `-Infinity` — `Math.max` over an
empty star field — and **passes**. A guard that passes for the wrong reason is worse than one that
fails, so the mark layers are now named as the mark layers and the cloud is held to its own
assertion.

## Per level, and it costs one bitmap

⚠️ **A theme carries a `nebula` colour per palette**, on exactly `space`'s terms — [0024](0024-the-accessibility-floor-is-settings.md)
makes the palette a setting, so a theme that hung a purple cloud in a high-contrast void would be
overriding a choice the player made.

⚠️ **SEVEN ATLASES IS 0107's OWN REFUSAL ARRIVING IN THE OTHER CHANNEL.** That decision refused seven
transposed pieces of music at 72 MB; seven baked atlases is seven copies of every sprite in the game
for one tile's worth of difference. **A tint at blit time is a canvas state change inside the frame
loop**, which [0025](0025-the-frame-budget-is-counted-not-timed.md) counts.

⚠️ **So `bakeNebula` re-bakes one bitmap at a level boundary and writes it into the atlas in place.** A
boundary is a screen ([0063](0063-a-level-break-is-a-respite.md)) and this is one canvas the size of
two lanes — the same cost class as the rotation re-bake `onResize` already does, spent where the game
is not running. It is the only sprite in the atlas whose ink is not final, and `INK_OF` says so.

⚠️ **The tile is TWICE the lane and every other sky tile is square to it.** A cloud the size of the
screen comes round every few seconds at any depth that reads as motion, and a repeat the player can
see is worse than no cloud at all. At two hundred units it repeats once in about eleven seconds.

⚠️ **A cloud may hang off the tile's edge, which is the opposite of every other sky field's rule.** A
mark cut by a seam is a hard edge arriving on a schedule; a gradient cut by one is already down at a
fraction of its own alpha out there, and the tile repeats — so what the player sees is the same cloud
continuing.

## What the proof found

⚠️ **Four probes, and one reported STILL GREEN on the first attempt — in the PROBE rather than in the
guard.** The alpha break widened `NEBULA_ALPHA`'s ceiling to 0.4 and left its floor alone; the guard
measures the boldest cloud `nebulaField` actually draws, which is seven samples out of the range and
never its ceiling, so the sampled maximum stayed at 0.2. **A break written against the constant
instead of against the picture** — [0027](0027-measure-the-picture-not-the-model.md) in the one place
this project had not yet found it.

⚠️ **AND THE FOURTH LAYER BROKE TWO GUARDS BY MOVING AN INDEX.** `tests/budget.test.ts` read `SKY[0]`
and `SKY[1]` positionally; the nebula is drawn first, so the first thing that reported was *the far
starfield has slowed down by a factor of four*. They find their layers by sprite now, which is what
they were always about.

## Rollback

**None owed.** No storage key, no save field, no service-worker cache prefix and no origin. One sprite
kind, one theme field and one depth: reverting the commit restores the previous sky exactly.

## What this does not settle

⚠️ **Whether the clouds read as *nebulous* or as smudges.** Seven overlapping gradients at two alphas
is the cheapest thing that is not a disc, and `scripts/shot.mjs` is how it gets looked at rather than
argued about — 0027 for the channel that does have something to look at.

⚠️ **`SCROLL_PER_STEP` is still untouched after seven reports about speed.** 0103 predicted it would be
the next lever and 0106 proved that wrong; this decision does not test it either, because it moves the
bottom of the range rather than the top. If an eighth report says *slow*, the sky is genuinely out of
road and the world's own rate is what is left.

⚠️ **Nothing measures how much the weather costs on the phone [0022](0022-frame-rate-is-a-feature.md)
sizes for.** The blit count is held — it is three or four per layer and does not vary with the camera
— but a 200-unit tile is four times the pixels of a star tile, and fill rate is the one budget this
project counts nothing about. It is named because the ninth play-test also said *desktop is the
prestige experience*, which is the licence this spends.
