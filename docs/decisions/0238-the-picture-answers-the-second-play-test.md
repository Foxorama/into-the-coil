# 0238 — The picture answers the second play-test

**Accepted 2026-09-05**, the same day as [0235](0235-a-seeker-hunts-the-nearest-body.md) and
[0237](0237-the-blades-answer-the-first-play-test.md), from
[`the-picture-played`](../../reports/the-picture-played-2026-09-05.md):

> *"need more visual distinction between actual missile types… lightning needs more glow around
> the edges, not specific details but more like the lightning flash… shurikens need to be bigger
> and steel coloured, also with a bit of a glow to them"*

Three items, all of them about the picture and none about the model, and all three answered in the
art. **Amends [0237](0237-the-blades-answer-the-first-play-test.md)**: a blade is bigger than the
ship now, not the size of it.

## The rules

**A seeker wears the ship's ink.** `INK_OF.seeker` is `player`; the straight missile keeps
`bullet`. The seeker is the one shot that behaves like the ship — it turns — so it wears the ship's
colour, and it is drawn a size up (4.4 units against the missile's 3.4) with a soft glow in its
own ink behind it. `THE TWO TUBES` in `tests/seekers.test.ts` holds that the two missiles differ in
ink and are not one bitmap — [0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md)'s
rule read from the other side: shape was the only channel, and at four units it was not enough.

**A bolt has a flash.** `bolt` in `src/render/canvas.ts` strokes four times now: the glow ink at a
sixth of the alpha and fourteen cores wide, first and under everything; then 0236's dark halo, the
glow (four cores, up from three) and the core. It is one path and still no `shadowBlur`, and the
count of `bolt` calls per link — `STROKES_PER_LINK` — is unchanged, so the picture costs what it
said it cost. **A dot is its glow and its core only**: the first photograph of the flash showed
0236's bright points each wearing a wash and a dark halo of their own, and the eye read a beaded
bolt as a string of lights. Nothing holds the widths: they are the picture's, and the guard is an
eye — `shots/` has the three photographs the widths were settled against.

**A blade is steel.** A new ink, `blade` — a role, on the palette's own rule, held to every floor
a meaning ink is held to and in no critical pair, because a star bigger than the ship is its own
channel. Cool light grey in the vivid palette; a step below the two whites in high contrast, so a
blade and a pickup are apart on the one channel that palette exists for. The star is drawn at four
fifths of a 12-unit box (up from 7) with a glow in its ink filling the rest, each blade's trailing
edge in shadow and its leading edge lit, and the hurtbox is 4.8 (up from 3.5) — the sweep grows
with the star, and the balance of that is a hand's. `THE STEEL` in `tests/blades.test.ts` holds
that a blade is not in the pulse's ink and does not change ink as it spins.

**Glow is baked, never drawn.** Both glows are `destination-over` radial fills inside the sprite's
own box, on 0236's bubble terms: more fills in the same bitmap, no second sprite, nothing at draw
time. `tests/accents.test.ts` holds a translucent mark inside the box and every solid mark inside
the hull.

## ⚠️ What was rejected

**A trail on the seeker.** It would say *turning* better than an ink does, and it would cost a
pool and a draw call per missile per frame. The ink says *mine*, which is the distinction asked
for.

**`shadowBlur` for the flash.** A per-draw Gaussian over the path's bounding box, sixty times a
second — the one Canvas2D call this backend must never make. A fourth wide stroke is what a flash
looks like at bolt size.

**A colour name for the ink.** `steel` is what it looks like; `blade` is what it is for. The
high-contrast palette answers *blade* honestly and could not answer *steel*.

## What is owed

- **An eye on all three**, at the shipped camera: whether a cyan seeker reads as the ship's, whether
  the flash reads as lightning over a busy sky, and whether a ring of thirteen steel stars reads as
  steel or as a wall.
- **The balance.** A 4.8-unit sweep is wider than a 3.5-unit one; `BLADE_EDGE`, the ladder and the
  cadence are still starting points.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Art, an ink and a stroke; nothing
persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0238`:

| broken on purpose | went red |
|---|---|
| the blade drawn in the pulse's ink again | `THE STEEL: a blade wears an ink of its own` |
| the blade's other turn given a different ink | `THE STEEL: a blade wears an ink of its own` |
| the seeker drawn in the pulse's ink again | `THE TWO TUBES: a seeker is told from a missile` |
