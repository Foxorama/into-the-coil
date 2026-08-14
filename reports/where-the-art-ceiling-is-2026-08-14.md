# Where the art ceiling is — one flat ink, and the `variant` the brief already names

**Written 2026-08-14**, on the standing instruction *"if you're not sure on the music, kick on with
the art styles and boss styling, we can upgrade that and then go back to working on the music when I
get back."*

⚠️ **THIS IS A SURVEY AND NOT A CHANGE.** It exists so the next session starts from a diagnosis rather
than from a fresh read of `src/render/bake.ts` —
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md). Nothing here has been acted on.

## ⚠️ The ceiling is one ink per sprite, and it is structural rather than a matter of taste

`drawKind` in `src/render/bake.ts` sets **one** `fillStyle` from `INK_OF[kind]`, strokes in
`palette.space`, and ends every arm at a single `ctx.fill('evenodd'); ctx.stroke()`. So **every ship,
every enemy and all seven bosses are one flat colour with an outline.** A hull cannot have a cockpit,
a vent, a gun port or a lit core, because there is nowhere for a second colour to come from.

⚠️ **THE SILHOUETTES THEMSELVES ARE NOT THE PROBLEM AND ARE BETTER THAN THEY LOOK IN THE FILE.** Each
of the seven is built around one readable idea — a solid hexagonal hull, three prongs on a spine, a
lattice, a shoal mother, a redoubt with ports, three stacked lobes, a ringed eye — and no two are the
same object in a different colour. `bake.ts` calls them *"still placeholders"*; what is placeholder
about them is the **fill**, not the outline.

## ⚠️ `variant` is in the brief, in this file's own header, and not in the code

`docs/game.md`:

> *"Every ship, enemy, boss and effect is a pure function of `(kind, variant, palette, view)`."*

`src/render/bake.ts:5` repeats it verbatim. The actual signature is
**`drawKind(ctx, kind, palette, size)`** — there is no `variant`, and there never has been.

⚠️ **WHAT STANDS IN FOR IT IS A SEPARATE `SpriteKind` PER VARIANT**: `boss`, `bossHit`, `boss2`,
`boss2Hit`, … fourteen kinds for seven bosses. **That is what caused the bug the file records** — a
boss and its hit sprite share one `case` arm, so the ink was the only thing that differed, and when
five of the hurt silhouettes were authored in their own hull's ink they baked as *the same bitmap
twice*. **Five of the seven bosses had no hit interaction at all** and every guard was green.

⚠️ **SO THE MISSING PARAMETER HAS ALREADY COST ONE SHIPPED DEFECT**, which is the argument for
building it rather than a preference about signatures.

## The cheapest real upgrade, and why it is `space` rather than a new ink

**Interior detail drawn in `palette.space`, baked into the same bitmap.**

| | |
|---|---|
| costs at runtime | **nothing** — it is the same blit, and 0022/0025 count draw calls, not path segments |
| costs in memory | nothing; the atlas already holds these bitmaps |
| accessibility | **none** — space-on-enemy is the exact contrast the outline already has, and `tests/themes.test.ts` already guards it against every backdrop in every palette |
| palette change | none |
| silhouette bounds | unchanged, so nothing about collision or `0101`'s screen-share moves |

⚠️ **AND IT CANNOT COLLIDE SEMANTICALLY, WHICH THE OBVIOUS CHOICES BOTH DO.** `impact` is the hit-flash
ink — a permanently impact-coloured core would muddy the one piece of feedback
[0035](../docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md) exists for. `hazard`
means *this will hurt you*. `space` means nothing, which is exactly what decoration should mean —
[0081](../docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md) is
about what the player must TELL APART, and a vent is not one of those things.

⚠️ **IT IS NOT THE SAME AS AN `evenodd` HOLE.** A hole is transparent and shows the sky through it; a
`space` fill is opaque void. Both are wanted, for different pictures, and only the first exists today.

## What the next session would have to build

1. `drawKind` grows a second pass: fill the hull, then optionally fill an accent path in `space`.
   The tail at `bake.ts:1056` is where the two currently collapse into one.
2. Seven accents, one per boss, each expressing that hull's existing idea rather than a new one.
3. Guards: the accent may not change the sprite's outer bounds; every boss must differ from every
   other by more than its accent (0081's rule pointed at the new axis); and the blit count is
   unchanged, which `tests/frame.test.ts` already counts.
4. Probes, per [0005](../docs/decisions/0005-a-guard-must-be-seen-to-fail.md).

⚠️ **`variant` IS THE LARGER AND LATER ONE.** It is worth doing for the fourteen-kinds-for-seven-bosses
smell and for the defect above, but it touches `SPRITE_KINDS`, the atlas and
[0016](../docs/decisions/0016-a-hub-enumerates-kinds.md)'s hub rules, and it should not be bundled
with a visual change — a verdict on the picture and a refactor of the pipeline in one PR is
unattributable, which is 0109's standing argument.

## ⚠️ What is NOT recommended

**Tinting a boss by its theme.** A theme changes a backdrop, a cloud colour, a mix, a set of voices
and a room ([0146](../docs/decisions/0146-three-more-places-and-two-after-them.md)) and has never been
able to change a sprite. Making the enemy ink vary by level would put an accessibility-guarded ink
under a level's control, which is
[0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md) read backwards.
