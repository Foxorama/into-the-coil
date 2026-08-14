// The breaks behind docs/decisions/0149-a-hull-has-an-interior.md.
//
// ⚠️ THE FIRST TWO ARE THE ONES A HAND CANNOT CHECK, and they are why this change is guarded by a
// trace rather than by a reading. The hulls are drawn imperatively, three of them are holed with
// `evenodd`, and `boss6` is three overlapping circles and a bar whose overlaps CANCEL — so an accent
// that pokes out of a silhouette and an accent laid across a hole both look completely correct on the
// page. `reports/where-the-art-ceiling-is-2026-08-14.md` names the second as a distinct effect:
// *"a hole is transparent and shows the sky through it; a `space` fill is opaque void."*
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
      ⚠️ THE FIRST OF THE TWO THE REPORT ASKED FOR: an accent that leaves its hull. `boss6` is the
      tightest of the seven at 5.2 CSS pixels of clearance, and pushing its eyes out to the lobes'
      own radius is the edit a hand makes when it wants the marks *further forward* — the numbers stay
      plausible, every other guard stays green, and the silhouette the player reads grows three bites
      out of its leading edge.
    */
    broke: 'an accent pushed out to the edge of the hull, so three marks hang off the silhouette',
    guard: 'and the interior stays inside the hull, with room to spare, in CSS pixels of a 1280×720 screen',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const BOSS6_EYES: Accent = [dot(-0.46, -0.62, 0.095), dot(-0.46, 0, 0.095), dot(-0.46, 0.62, 0.095)];',
      replace: 'const BOSS6_EYES: Accent = [dot(-0.62, -0.62, 0.095), dot(-0.62, 0, 0.095), dot(-0.62, 0.62, 0.095)];',
    },
  },
  {
    decision: '0149',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ THE SECOND, AND IT IS A DIFFERENT FAILURE WEARING THE SAME NUMBERS. `boss7` is a ringed eye:
      solid to 0.30, a hole from 0.30 to 0.66, solid again to the rim. A pupil grown to 0.55 is still
      well inside the hull's bounds, still nowhere near the outline, and still entirely inside the
      sprite — and it fills in the hole with opaque void, which turns the one round hull in the game
      from a ring into a disc. Bounds alone cannot see it; only a grid over the mark can.
    */
    broke: 'an accent grown across the hole the hull cut on purpose, so a ring bakes as a disc',
    guard: 'and the interior stays inside the hull, with room to spare, in CSS pixels of a 1280×720 screen',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const BOSS7_EYE: Accent = [\n  dot(0, 0, 0.16),',
      replace: 'const BOSS7_EYE: Accent = [\n  dot(0, 0, 0.55),',
    },
  },
  {
    decision: '0149',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ THE SHIPPED GAME, RESTORED FOR ONE BOSS — which is the state every hull was in before this
      change and the state a new one would be authored into by copying a neighbouring row. One flat
      ink and an outline is what `reports/where-the-art-ceiling-is-2026-08-14.md` is about.
    */
    broke: 'one boss handed back its flat fill, so it is the ceiling the report measured again',
    guard: 'THE REPORTED ONE: every boss is drawn in two inks, and the file offered one',
    edit: { path: 'src/render/bake.ts', find: '  boss3: BOSS3_NODES,', replace: '  boss3: null,' },
  },
  {
    decision: '0149',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ THE HURT SILHOUETTE LEFT BEHIND, which is EXACTLY the shape of the defect this file's own
      table was written next to: `boss3Hit` through `boss7Hit` were authored beside their hulls rather
      than with the other hurt sprites, five bosses shipped with no hit interaction at all, and every
      guard was green. A hull and its hurt sprite share a `case` arm, so an accent on one and not the
      other puts the SHAPE back in play and a flash stops reading as one object being hurt.
    */
    broke: 'a hurt boss left without the interior its hull has, so a flash changes the silhouette',
    guard: 'and a hurt boss carries the same interior, so a flash is still one object being hurt',
    edit: { path: 'src/render/bake.ts', find: '  boss3Hit: BOSS3_NODES,', replace: '  boss3Hit: null,' },
  },
  {
    decision: '0149',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ AN ACCENT AUTHORED BELOW A PIXEL, which is `docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md`
      arriving on a new axis. Decoration announces nothing when it fails: the marks would simply not
      be there and the boss would be flat again, with no error and no report — the sky reached exactly
      this state and it took a play-test to find it.
    */
    broke: 'an accent authored too small to draw, so it is absent rather than wrong',
    guard: 'and no mark on one is too thin to be drawn at all',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const BOSS3_NODES: Accent = [\n  dot(0.38, -0.32, 0.09),',
      replace: 'const BOSS3_NODES: Accent = [\n  dot(0.38, -0.32, 0.004),',
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
    guard: 'THE 0081 ONE: no two boss hulls are the same drawing once the interiors are taken off',
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
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ THE SECOND PASS MADE UNCONDITIONAL, by the most reasonable-looking edit available: a default
      for the kinds that have not asked for one. Every enemy in the game is five to nine world units,
      so what it actually produces is a mark under a pixel on every body on screen — and the table
      stops being the description of which kinds have an interior, which is the whole of what
      `docs/decisions/0016-a-hub-enumerates-kinds.md` buys.
    */
    broke: 'a default interior for kinds that declared none, so the table stops deciding anything',
    guard: 'and a kind with no interior is drawn exactly as it was',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const accent = ACCENT_OF[kind];',
      replace: '  const accent = ACCENT_OF[kind] ?? BOSS_KEEL;',
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
