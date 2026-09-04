// The breaks behind docs/decisions/0149-a-hull-has-an-interior.md.
//
// ⚠️ THE FIRST TWO ARE THE ONES A HAND CANNOT CHECK, and they are why this change is guarded by a
// trace rather than by a reading. The hulls are drawn imperatively, three of them are holed with
// `evenodd`, and `boss6` is three overlapping circles and a bar whose overlaps CANCEL — so an accent
// that pokes out of a silhouette and an accent laid across a hole both look completely correct on the
// page. `reports/where-the-art-ceiling-is-2026-08-14.md` names the second as a distinct effect:
// *"a hole is transparent and shows the sky through it; a `space` fill is opaque void."*
//
// ⚠️ RE-AIMED BY docs/decisions/0227-a-sprite-is-painted-not-filled.md, which took the table these
// used to break away and left the marks as drawings. Every break here is the same break — the same
// number moved the same way — landing in the arm that now paints it; and the guard that catches it
// is the same claim, measured off the trace rather than off `ACCENT_OF`. One probe went with the
// table: *a default interior for kinds that declared none* has no rule left to offend, because any
// kind may be painted now.
//
// ⚠️ THE LAST ONE DOES NOT REDDEN THIS CHANGE'S OWN SUITE, ON PURPOSE. What holds the blit count is
// `tests/budget.test.ts`, which has counted it since 0022; the report said so, and the honest way to
// discharge that is to break the thing it claims to catch rather than to write a second copy of it —
// `tests/one-description.test.ts`'s admission rule, pointed at a guard instead of a constant.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0149',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ AN EYE MOVED OUT THROUGH THE LOBE. `boss6` is three overlapping circles and a bar whose
      overlaps cancel, so the outer lobes are thinner than they look, and −0.62 was chosen against a
      measurement (5.2 CSS pixels of clearance, the tightest of the seven). Two tenths further out and
      the eye is over the edge — and on the page, where a hand would check it, it looks like an eye
      near the edge of a lobe.
    */
    broke: 'a boss’s eye moved out through its lobe, so the interior pokes out of the silhouette',
    guard: 'THE 0149 ONE: every solid mark on a body is inside its hull',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const BOSS6_EYES: readonly Mark[] = [dot(-0.46, -0.62, 0.095), dot(-0.46, 0, 0.095), dot(-0.46, 0.62, 0.095)];',
      replace: 'const BOSS6_EYES: readonly Mark[] = [dot(-0.46, -0.82, 0.095), dot(-0.46, 0, 0.095), dot(-0.46, 0.82, 0.095)];',
    },
  },
  {
    decision: '0149',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ A MARK LAID ACROSS A HOLE. `boss7` is three rings and the gap between the outer two is sky;
      a pupil at 0.48 sits squarely in it. Its outline is inside the hull's outer edge on every side,
      so a bounds check would pass it — only sampling the interior of the mark against the hull's own
      fill rule can see that it is painting opaque void over a gap the sky was showing through.
    */
    broke: 'a boss’s mark laid across one of its holes, so a gap becomes opaque void',
    guard: 'THE 0149 ONE: every solid mark on a body is inside its hull',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const BOSS7_EYE: readonly Mark[] = [\n  dot(0, 0, 0.16),',
      replace: 'const BOSS7_EYE: readonly Mark[] = [\n  dot(0.48, 0, 0.16),',
    },
  },
  {
    decision: '0149',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ THE REPORT'S OWN FINDING, PUT BACK: one boss with no paint on it. On the sheet it is a hull in
      one flat ink — exactly what every hull was before 0149, and exactly what a reader would not
      notice was missing.
    */
    broke: 'a boss painted with nothing, so it is one flat ink again',
    guard: 'and every boss is painted, and no two wear the same paint',
    edit: {
      path: 'src/render/bake.ts',
      find: '      seal(ctx);\n      carve(ctx, f, palette.space, BOSS3_NODES);\n      return;',
      replace: '      seal(ctx);\n      return;',
    },
  },
  {
    decision: '0149',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ THE HURT TWIN GIVEN PAINT OF ITS OWN. A boss and its hit sprite share a `case` arm so that a
      flash reads as *that thing being hurt* rather than as a second object; a mark in a colour on the
      twin is a second object appearing at the worst possible moment. `tests/legibility.test.ts` holds
      the ink; this holds what is painted over it.
    */
    broke: 'a hurt boss painted differently from its own hull, so a flash changes the picture',
    guard: 'and a hurt twin is the hull flat in its flash ink',
    edit: {
      path: 'src/render/bake.ts',
      find: '      seal(ctx);\n      carve(ctx, f, palette.space, BOSS5_BANDS);\n      return;',
      replace:
        '      seal(ctx);\n      carve(ctx, f, palette.space, BOSS5_BANDS);\n' +
        '      if (hurt) disc(ctx, f, palette.glass, 0, 0, 0.2);\n      return;',
    },
  },
  {
    decision: '0149',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ A NODE THINNED BELOW A PIXEL. Every number in the table is a fraction of the hull radius, so a
      mark that looks fine on a 400px trace can be nothing at all on a 1280×720 screen — which is the
      exact failure docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md records the sky
      having. The guard measures at the size the game bakes at, and only there.
    */
    broke: 'a boss’s node made too small to bake, so the interior is there in the table and not on the screen',
    guard: 'and no solid mark on a body is too thin to be drawn at all',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const BOSS3_NODES: readonly Mark[] = [\n  dot(0.38, -0.32, 0.09),',
      replace: 'const BOSS3_NODES: readonly Mark[] = [\n  dot(0.38, -0.32, 0.01),',
    },
  },
  {
    decision: '0149',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ TWO BOSSES GIVEN ONE HULL AND TWO INTERIORS, which is the failure a second channel makes
      possible and the one `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md`
      is pointed at here. It is the edit a hand makes writing an eighth hull by analogy with a
      seventh, and with an accent on top the two would still LOOK different in a sprite dump — which
      is precisely why the guard compares the hull pass and not the finished bitmap.
    */
    broke: 'a boss given another boss’s hull, so only their interiors tell the two apart',
    guard: 'THE 0081 ONE: no two boss hulls are the same drawing once the paint is taken off',
    edit: {
      path: 'src/render/bake.ts',
      find:
        '      // A SHOAL MOTHER: a blunt teardrop trailing four fins. Level four is about speed, and this is\n' +
        '      // the only hull in the game that reads as moving while it is standing still.\n' +
        '      ctx.moveTo(half - r, half);\n' +
        '      ctx.lineTo(half - r * 0.3, half - r * 0.62);\n' +
        '      ctx.lineTo(half + r * 0.55, half - r * 0.5);\n' +
        '      ctx.lineTo(half + r * 0.95, half - r * 0.86);\n' +
        '      ctx.lineTo(half + r * 0.8, half - r * 0.22);\n' +
        '      ctx.lineTo(half + r, half);\n' +
        '      ctx.lineTo(half + r * 0.8, half + r * 0.22);\n' +
        '      ctx.lineTo(half + r * 0.95, half + r * 0.86);\n' +
        '      ctx.lineTo(half + r * 0.55, half + r * 0.5);\n' +
        '      ctx.lineTo(half - r * 0.3, half + r * 0.62);\n' +
        '      ctx.closePath();\n',
      replace:
        '      ctx.moveTo(half - r, half);\n' +
        '      ctx.lineTo(half, half - r * 0.85);\n' +
        '      ctx.lineTo(half + r, half);\n' +
        '      ctx.lineTo(half, half + r * 0.85);\n' +
        '      ctx.closePath();\n' +
        '      ctx.moveTo(half - r * 0.42, half);\n' +
        '      ctx.lineTo(half, half - r * 0.36);\n' +
        '      ctx.lineTo(half + r * 0.42, half);\n' +
        '      ctx.lineTo(half, half + r * 0.36);\n' +
        '      ctx.closePath();\n',
    },
  },
  {
    decision: '0149',
    suite: 'tests/budget.test.ts',
    /*
      ⚠️ THE INTERIOR IMPLEMENTED AS AN OVERLAY SPRITE, which is the other way to have built this and
      the one that costs. A second bitmap blitted over the hull would look identical on screen and
      double the draw calls of every body in the game — `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`
      counts draw calls precisely because CI is not the 2021 Android the budget is written for.
      Baked into the same bitmap it is one fill at load and nothing at all per frame.
    */
    broke: 'a second blit per entity, which is what an interior drawn as an overlay sprite would cost',
    guard: 'draws exactly one call per live entity, plus one clear',
    edit: {
      path: 'src/render/scene.ts',
      find:
        '      surface.blit(e.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale);\n' +
        '    }\n' +
        '  }\n' +
        '}',
      replace:
        '      surface.blit(e.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale);\n' +
        '      surface.blit(e.sprite, screenX(view, inView, across), screenY(view, inView, across), view.scale);\n' +
        '    }\n' +
        '  }\n' +
        '}',
    },
  },
];
