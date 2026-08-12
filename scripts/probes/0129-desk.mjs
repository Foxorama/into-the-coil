// The break behind docs/decisions/0129-the-desk-holds-a-value-not-a-multiplier.md.
//
// ⚠️ ONE PROBE, AND THE DECISION SAYS WHY THERE IS ONLY ONE. The desk's own behaviour lives in
// `rig/dash.ts`, which needs an AudioContext and a DOM; everything about it that could be lifted into
// `rig/transport.ts` already was by docs/decisions/0126, and what is left is fader-to-AudioParam.
// That half is verified by driving it, and the decision records what was driven rather than implying
// a guard exists over it.
//
// What CAN be held is the import graph, which is a fact rather than an intention — the shape
// docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md chose deliberately.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0129',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ THE SHELL REACHING INTO A LAYER'S PLACE, which is a worse version of the defect 0126's own
      `gainOf` probe covers. A pan is set once from `LAYER_PAN` at construction and the game never
      moves one, so a call site under `src/` would not be a second opinion about the field — it would
      be the ONLY one, and tests/music.test.ts's guard that a low-heavy layer is centred would be
      measuring a table nobody obeys.
    */
    broke: 'the shell reaching into a music layer’s place, so LAYER_PAN stops being the field',
    guard: 'NOTHING UNDER src/ CALLS `gainOf` OR `panOf` — the mix and the field are decided in one place',
    edit: {
      path: 'src/app/sound.ts',
      find: '      music?.duck(amount);',
      replace: "      music?.panOf('drone');\n      music?.duck(amount);",
    },
  },
];
