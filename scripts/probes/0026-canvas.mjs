// The breaks behind docs/decisions/0026-the-first-frame-the-page-draws.md.
//
// Two of these run the browser suite and are slow. They are here anyway: the DPR cap and the
// accessible name are both claims about what the SHIPPED page does, and a unit test cannot make
// either of them.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0026',
    suite: 'tests/canvas.test.ts',
    broke: 'the DPR cap removed, so a 3x phone renders 2.6M pixels a frame instead of 1.15M',
    guard: 'caps the device pixel ratio at 2',
    edit: {
      path: 'src/render/canvas.ts',
      find: '  return Math.min(devicePixelRatio, MAX_DPR);',
      replace: '  return devicePixelRatio;',
    },
  },
  {
    // ⚠️ The same break, seen from the shipped page. The unit test above proves the arithmetic; this
    // proves the arithmetic is actually reaching a canvas, which is a different claim.
    decision: '0026',
    suite: 'tests/frame.browser.test.ts',
    broke: 'the same cap removed, measured on the real canvas rather than on the function',
    guard: 'caps the backing store at 2x however high the device pixel ratio goes',
    edit: {
      path: 'src/render/canvas.ts',
      find: '  return Math.min(devicePixelRatio, MAX_DPR);',
      replace: '  return devicePixelRatio;',
    },
  },
  {
    decision: '0026',
    suite: 'tests/canvas.test.ts',
    broke: 'the atlas kept across a rotation, so every sprite points ninety degrees wrong',
    guard: 'rebakes when the orientation changes',
    edit: {
      path: 'src/render/bake.ts',
      find: '  if (atlas.view !== view) return true;',
      replace: '  if (atlas.view !== view) return false;',
    },
  },
  {
    decision: '0026',
    suite: 'tests/canvas.test.ts',
    broke: 'a rebake on every resize event, which stutters for the length of a window drag',
    guard: 'does not rebake for a resize that changes nothing anyone can see',
    edit: {
      path: 'src/render/bake.ts',
      find: '  return Math.abs(pixelsPerUnit - atlas.pixelsPerUnit) > atlas.pixelsPerUnit * 0.25;',
      replace: '  return pixelsPerUnit !== atlas.pixelsPerUnit;',
    },
  },
  {
    decision: '0026',
    suite: 'tests/palette.test.ts',
    broke: 'a bullet moved next to the pickup in lightness — the confusion that costs a life',
    guard: 'keeps every critical pair apart on the channel colour blindness does not take away',
    edit: {
      path: 'src/content/palette.ts',
      find: "    bullet: '#ff8000',",
      replace: "    bullet: '#f0f0f0',",
    },
  },
  {
    decision: '0026',
    suite: 'tests/palette.test.ts',
    broke: 'an ink dropped below WCAG AA against space, so it is not reliably visible at all',
    guard: 'clears WCAG AA against the background',
    edit: {
      path: 'src/content/palette.ts',
      // ⚠️ Re-anchored by 0222, which brightened `enemy` to buy the background its detail. The break
      // is unchanged: an ink taken below AA against the void is one the player cannot reliably find.
      find: "    enemy: '#ff7286',",
      replace: "    enemy: '#241016',",
    },
  },
  {
    decision: '0026',
    suite: 'tests/budget.test.ts',
    broke: 'the frame given the baker at runtime, so art can be redrawn during play',
    guard: 'the frame cannot reach the baker',
    edit: {
      path: 'src/app/frame.ts',
      // The import line gained the sky's type when 0065 landed and the box's when 0074 did; the
      // break is the same one it has always been.
      // ⚠️ Re-anchored by 0203, which added `Landmarks` to this import. The break is the same one it
      // has always been; only the line it hangs on moved.
      // ⚠️ Re-anchored by 0233, which added the bolt painter and its lifetime to this import.
      find: "import { BOLT_STEPS, paintBolts, paintScene, type Bound, type Landmarks, type Sky } from '../render/scene.ts';",
      replace:
        "import { BOLT_STEPS, paintBolts, paintScene, type Bound, type Landmarks, type Sky } from '../render/scene.ts';\n" +
        "import { bakeAtlas } from '../render/bake.ts';",
    },
  },
  {
    decision: '0026',
    suite: 'tests/boot.browser.test.ts',
    broke: 'the canvas mounted with no accessible name, which is also how brand.ts stops shipping',
    guard: 'renders the title and version from brand.ts',
    edit: {
      path: 'src/main.ts',
      find: "    mounted.canvas.setAttribute('aria-label', `${GAME_TITLE} ${APP_VERSION} (${BUILD_ID})`);",
      replace: "    mounted.canvas.removeAttribute('aria-label');",
    },
  },
];
