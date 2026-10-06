# 0550 — Every tab has a keeper

**Accepted 2026-10-06.** A play of the hangar after [0548](0548-the-hangar-holds-still.md) merged.

## The ask

> *"Hangin Out, Paints & Parts and Cosmo's Cosmetics all show Cosmo and we've lost the space background
> behind the spacestation hanger — can we fit in a starry background to emphasise the space station nature
> of it? and we need to have someone for the mechanic for Hanging out and the paints and Parts"*

> *"Let's do an aussie trader mechanic for Hangin Out named Unity - I bring it all together for the quote -
> androgynous based on a Least Weasel — and for paints and parts a space duck named MMXXVI - we'll make it
> look good."*

## What was measured first

Off `scripts/shot-menus.mjs` at 1280x720 and 844x390 on `main`: Cosmo's stall and bust stood beside the pad
on all three tabs, since 0548 gave them one camera and drew the stall on every one. The bay to space is at
180 units along, and that camera's stand ends at about 111: the bay was behind the plate on every tab, and
the only stars on the screen were a sliver past the plate's right edge.

## The rule

| | |
|---|---|
| **the keepers** | a closed table, `KEEPERS` in `src/content/keepers.ts` (it was `cosmo.ts`): Cosmo, Unity, MMXXVI. Each row names its bust and its counter in the port's atlas, the two lines on the counter's front, its greeting, and its shop lines — `null` for a keeper with nothing to sell |
| **a tab's keeper** | the `keeper` on its stand row, a kind and no longer a row: Unity on Hangin' Out, MMXXVI on Paint & Parts, Cosmo on Cosmo's. Its bust and counter are drawn beside the pad and nobody else's is; its card heads the plate with its face and its line |
| **the faces** | each keeper's own painter, `KEEPER_FACES` in `src/render/keeper-art.ts`, one drawing for the card and the port — on 0542's terms for Cosmo |
| **the viewport** | a hole two wall tiles wide and one high in the back wall (`STAGE.viewport`), with no tile drawn over it, so the first level's sky the room is painted over shows through; a riveted frame with two struts and a faint sheen goes over it. In the room, so the intro has it too |
| **the card** | one look on all three tabs, a step smaller than Cosmo's was: the face a size down, the line beside the name. Every class is still its screen's own (`prefixFor`), the three selectors listed together |
| **on a phone** | a keeper with no shop — who only greets — has no card on the plate. Their bust and sign are in the stand beside it; Cosmo's card stays, because it says the shop's state and nothing else does |

## Who they are

**Unity** is a least weasel: the weasel's own two colours, a warm brown back and a cream front meeting in a
clean line down the cheek and the long throat, small round ears, bead eyes and whiskers. Aussie and a trader:
a bush hat with its crown pinched, and a tradie's hi-vis shirt, orange over navy with a silver tape. Nothing
says which way they go — no lashes, no paint. Their counter is a steel trade bench under corrugated iron,
with a spanner hung off a post, a red toolbox and an oil can, and *UNITY'S — TRADE & REPAIR* on the front.
Their line is the one given, *I bring it all together.* The Aussie is in the picture, not added to the line.

**MMXXVI** is a space duck: a round yellow head and a broad orange bill under a glass bubble helmet with a
light on its antenna, a painter's smock splashed in the shop's inks, a dab of paint on one cheek. Their booth
has an awning striped in paint that drips off its edge, colour chips along its foot, two tins, a spray can
and a rim on top, and *MMXXVI — PAINT & PARTS* on the front. Their line: *We'll make it look good.*

## What it costs

**The counter changes when the tab does.** The camera holds one counter whole beside the pad (0548), so the
three keepers share that spot and stepping a tab swaps who is at it. Three counters side by side would need
the stand twice as wide or the ship off its pad. If it reads wrong on play, the other answer is a camera per
tab, which 0548 leaves room for, at the cost 0548 was written to remove.

**Cosmo's card is smaller.** At Cosmo's old size, the card on Hangin' Out put Back under the plate's foot,
and its plate grew past the other two tabs' plates, which 0548 holds against. One look on all three is the
smaller one.

**On a phone, Unity and MMXXVI say nothing on the plate.** Paint's three bands fill the plate's height on a
phone, and the card put Back eight pixels past the plate at 667x375 and sixteen under the fold at 480x320.
Their line is the same whatever the player does, and their counter is in the picture beside it.

**The viewport is cut on a phone.** At 844x390 the shard counter is over its top left corner. More than half
the pane is on the screen at every size the layout guard runs at, which is what is held.

## What guards it

`tests/stand.test.ts`: each tab draws its own keeper's bust and counter and no other keeper's, no two tabs
name one keeper, and every tab's keeper, counter and ship are in the stand at the six sizes; the viewport is
drawn once, its pane in the stand's part of the screen with at least half its height on the screen, no wall
tile over it, and the sky drawn before the wall. `tests/intro.test.ts`: every baked piece is drawn by the
intro or by the stand for some keeper. `tests/layout.browser.test.ts`'s 0547 guard and
`tests/still.browser.test.ts` hold the card on the plates, and the layout guard at 480x320 holds the greeting off a phone's. Probes in `scripts/probes/0550-every-tab-has-a-keeper.mjs`.

## Owed

- A play on the branch preview: the two keepers, the swap on a tab step, and the viewport.
- Vetoes: the counter swapping in place rather than three counters; the card a step smaller on Cosmo's.
