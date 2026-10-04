// The heart has a chamber — docs/decisions/0489-the-heart-has-a-chamber.md
//
// Every guard 0489 adds, broken on purpose. `node scripts/prove-guard.mjs 0489`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0489',
    suite: 'tests/medusa.test.ts',
    // The report, put back: the bell on a heart smaller than it, in an open room, set in nothing.
    broke: 'the chamber never laid',
    guard: 'THE ASK, IN PIXELS: the heart is set in its chamber on the screen',
    edit: {
      path: 'src/render/scene.ts',
      find: '    surface.blit(veins.chamber, screenX(view, inView, heart[1]!), screenY(view, inView, heart[1]!), view.scale);',
      replace: '    void inView;',
    },
  },
  {
    decision: '0489',
    suite: 'tests/medusa.test.ts',
    // A chamber laid where the heart was a moment ago, or would be at rest: a housing with nothing in it.
    broke: 'the chamber laid off the heart',
    guard: 'THE ASK, IN PIXELS: the heart is set in its chamber on the screen',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const inView = heart[0]! - cameraAlong;\n    surface.blit(veins.chamber,',
      replace: '    const inView = heart[0]! - cameraAlong + 8;\n    surface.blit(veins.chamber,',
    },
  },
];
