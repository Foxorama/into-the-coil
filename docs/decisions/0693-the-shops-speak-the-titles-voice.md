# 0693 — The shops speak the title's voice, and Cosmo's wares are the picture

**Accepted 2026-10-27.** From the play of 2026-10-27. Extends [0440](0440-every-screen-speaks-with-the-titles-voice.md) into the
three plates of the dock, and amends [0572](0572-the-dock-is-dressed.md)'s tile.

## The ask

> *"the Main menu, settings and music menus all look pretty slick now, but the menus inside the three shops in
> hanging out are still fairly basic and don't quite match the overall look"*

> *"the items for sale in Cosmo's shop, the graphic display is still kinda overwhelmed by the menus and names
> and things. Not sure what, if anything we can do there."*

## What was there

0440 gave every control the studio's banner — a glass of the void under a rim run violet into cyan — and 0539
put the three plates in the title's frame. Inside the frame nothing had changed: a card in Hangin' Out, Paint &
Parts or Cosmo's was a 2px outline of one colour on nothing, a group heading one colour over one line, the
pilot's card a grey wash, and a caption a grey wash with a bar of the ink down its left. The plate matched the
title; what stood in it did not.

A tile at Cosmo's was its name in the card's own type, its price under, and the thing for sale in a box three
lines high between them. The dangles and the flames are set in em, so the box's height did not even size them.

## The rule

**Inside a shop's plate, a card wears what an action wears.** A hollow card is the glass under the rim; the
fitted card keeps 0572's lit rim of the ink and its glow; the card under the cursor keeps its gold wash, over
the same glass. A group heading is the wordmark's run of the two inks with the banner's diamond-tipped rule
under it, the pilot's card is a plate in small, and a caption stands on a bar of the run over a wash of the
violet that thins to the right. **The three shops only**, by prefix — the title's and the settings' bands have
0440's dress and keep it. The rules sit after the desktop's query, so they win on source order over the card
rules there, and they touch only paint, so no size's layout moves. A face, a swatch, a shut option and a tab
are not cards and keep their own dress.

**A tile at Cosmo's is the picture.** Its box is half again as high, a dangle and a flame are scaled to it,
and the name and the price are its caption, a size down.

## What guards it

Nothing new: these are paint. [0070](0070-a-style-is-a-setting-and-the-first-one.md)'s guard still tells a fitted card
from a hollow one by `background-color`, which is why the glass is a background *image* and a hollow card's
colour stays transparent — the same reason 0440 gives. `tests/chrome.test.ts` reads the sheet for a dotted
token, which is why the diamond's namespace is escaped here as it is there.

## Photographs

The three plates at 1920x1080 and 1280x720 and Cosmo's five shelves at 1920x1080, off the built page with
`scripts/shot-menus.mjs`'s seeds, before and after.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
