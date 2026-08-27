// The breaks behind docs/decisions/0196-the-backdrop-is-rounded-out.md.
//
// ⚠️ THE FIRST TWO ARE THE ACCESSIBILITY HOLE THIS DECISION CLOSES, AND THEY ARE THE ONES THAT MATTER.
// Everything else in this file is a picture; those two are
// docs/decisions/0024-the-accessibility-floor-is-settings.md — a level silently spending a choice the
// player made.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0196',
    suite: 'tests/sky.test.ts',
    /*
      ⚠️ THE CLOUDS TURNED UP UNTIL THEY EAT AN INK, WHICH IS THE MOVE THIS DECISION EXISTS TO MAKE
      SAFE. *Richer clouds* is the obvious way to round out a backdrop and it is the one that costs
      contrast — before this guard, tests/themes.test.ts checked every ink against the BARE backdrop
      and a nebula could be turned up to anything without a single test moving.
    */
    broke: 'the clouds turned up until a place eats an ink the player has to find',
    guard: 'THE HOLE: every ink clears WCAG AA against the backdrop WITH THE CLOUDS ON IT',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const NEBULA_ALPHA = { from: 0.1, to: 0.22 };',
      replace: 'const NEBULA_ALPHA = { from: 0.3, to: 0.55 };',
    },
  },
  {
    decision: '0196',
    suite: 'tests/sky.test.ts',
    /*
      ⚠️ THE OVERLAP UNCOUNTED, WHICH IS THE HALF NOBODY WOULD HAVE THOUGHT TO CHECK. Clouds pile up:
      the accumulated alpha reaches 0.41 at Ember Nebula where the per-cloud ceiling is 0.22. A cover
      that took the loudest single cloud instead of the accumulation reads 0.22, passes, and is wrong
      by the exact margin that matters.
    */
    broke: 'the cover taking the loudest single cloud rather than the pile, so overlap goes uncounted',
    guard: 'and the cover COUNTS THE PILE, because a guard cannot see its own measurement understating',
    edit: {
      path: 'src/render/bake.ts',
      // ⚠️ RE-ANCHORED when `cloudCover` grew a centre pass. The break is unchanged: the pile
      // replaced by the loudest cloud in it.
      find: '      if (d < cloud.r) cover = 1 - (1 - cover) * (1 - cloud.alpha * (1 - d / cloud.r));',
      replace: '      if (d < cloud.r) cover = Math.max(cover, cloud.alpha * (1 - d / cloud.r));',
    },
  },
  {
    decision: '0196',
    suite: 'tests/sky.test.ts',
    /*
      ⚠️ A THIRD COLOUR STOP, WHICH MAKES THE COVER ARITHMETIC WRONG IN THE DANGEROUS DIRECTION AND
      LEAVES THE CONTRAST GUARD GREEN. `cloudCover` models a cloud's falloff as linear in distance
      because that is what a canvas interpolates between a stop at 0 and a stop at 1. A stop in the
      middle holds the cloud at full strength further out than the model says — so the real backdrop is
      louder than the measured one, and the guard above goes on passing.
    */
    broke: 'a third colour stop, so the modelled falloff no longer matches the drawn one',
    guard: 'and the gradient is still two stops',
    edit: {
      path: 'src/render/bake.ts',
      find: "    fill.addColorStop(0, colour);\n    fill.addColorStop(1, 'transparent');",
      replace: "    fill.addColorStop(0, colour);\n    fill.addColorStop(0.7, colour);\n    fill.addColorStop(1, 'transparent');",
    },
  },
  {
    decision: '0196',
    /*
      ⚠️ AND IT IS THE SKY SUITE AFTER ALL, WHICH TOOK TWO GOES AND IS THE POINT. This probe was aimed
      at tests/budget.test.ts first: the ceiling a brightened mark breaks is a screen-share number, and
      that is where they live. It stayed GREEN twice — first because no budget helper could see
      per-mark alpha, then because every one of them is a COMPARISON and a lift moves both sides of it.
      An absolute ceiling needs an absolute assertion.
    */
    suite: 'tests/sky.test.ts',
    /*
      ⚠️ A MARK LIFTED ABOVE ITS LAYER'S ALPHA. `dim` is a REDUCTION, which is the whole reason it is
      free: the layer alpha stays the ceiling every screen-share and legibility guard in
      tests/budget.test.ts is written against. Turning it into a lift spends a budget nobody re-measured
      — and the sky ink is deliberately held below every colour that means something, so a brightened
      star is a star the player checks.
    */
    broke: 'a mark lifted above its layer’s alpha, so the sky brightens past the ceiling it is measured at',
    guard: 'THE CEILING: a mark may be dimmer than its layer and never brighter',
    edit: {
      path: 'src/render/bake.ts',
      find: '      dim: 1 - rng.range(0, Math.max(0, Math.min(1, style.dim))),',
      replace: '      dim: 1 + rng.range(0, Math.max(0, Math.min(1, style.dim))) * 3,',
    },
  },
];
