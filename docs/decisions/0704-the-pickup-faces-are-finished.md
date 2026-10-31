# 0704 — The pickup faces are finished

**Accepted 2026-11-01.** Item 19 of
[`the-ships-and-weapons-polished`](../../reports/the-ships-and-weapons-polished-2026-10-31.md) — the report's batch E
and the last of the queue, landed at full auto at the player's asking: the twelve glyphs in their bubbles, and the
readout's bare copies of them. On [0698](0698-the-fighter-is-finished.md)'s terms.

## What the faces were

Each a sealed glyph with one shadow side and, on some, a glint — the bomb, the missile, the seeker, the arc, the
shuriken, the candle, the dance, the water, the smite, the shield, the void and the nova — inside the bubble
[0431](0431-a-pickup-glows-in-what-it-offers.md) lit in the ink of the thing offered. The readout's copy of each is
the same drawing with the bubble refused ([0433](0433-the-readout-is-one-voice.md), `bakeGlyph`), so anything drawn on the
face is on both.

## The rule

**Every face wears the rim light every ship does** — `faceRim`, `rimLight` over the glyph's own outline, in its
own ink brightened, laid **before the bubble** so it lands on the glyph and on nothing behind it (`rimLight` is
`source-atop`, and the bubble is laid `destination-over` after it). Then each face is finished as the thing it is:

| face | what was added over the rim |
|---|---|
| **bomb** | the casing's streak, its belly in shadow, the joins and the fins as contours, the eye's glint — the bomb's own ([0703](0703-the-tubes-and-the-specials-are-finished.md)), since the face is the bomb's drawing |
| **shuriken** | polished steel: a streak down the blade that points up the screen, the hole's lip lit |
| **candle** | the tube a cylinder — a glint down its lit side |
| **shield** | the band's top edge glinting, the boss's rim lit |
| **void** | the dark heart's edge lit, as the ball's is |
| **nova** | the band's inner edge lit |
| **missile, seeker, arc, dance, water, smite** | the rim alone: on the chevron, the reticle, the bolt, the ball, the drop and the cloud it is the lit upper edge each already lacked, and each already carried its shadow side and glint ([0606](0606-the-water-cannon-is-a-drop.md)'s drop most of all) |

**Nothing solid was added**, so `tests/accents.test.ts` holds every mark inside the box.

[0236](0236-the-guns-answer-the-first-play-test.md)'s probe that leaves the shield's bubble off is re-anchored, because
the shield's bubble call now follows its rim light.

## What guards it

0698's guard is a ship's; this adds its twin for the faces in `tests/accents.test.ts`: *every pickup face wears a rim
light inside its edges, wide enough to be drawn* — the same `source-atop` gradient stroke at 2.5 px on 1280×720, on
every `pickup*` kind. It is an invariant on the ships' ground: a face drawn without it is the flat icon the ask was
about, sitting beside eleven finished ones. Probes in `scripts/probes/0704-the-pickup-faces-are-finished.mjs`: the
rim taken out of `faceRim`, so every face is flat at once, and the rim left off one face alone.

## The open calls, from the pictures

- **The rim on a face is in its own ink brightened**, as a ship's is; on the gold faces it is near white and reads as
  an edge of light, on the lavender ones it is faint.

## Not held by any guard

Whether each face reads as finished is the player's.
