// The break behind docs/decisions/0218-push-is-an-entrance-not-the-climb.md.
//
// ⚠️ THE SAME SIX SECONDS, REPORTED TWICE. 0215 measured the one-bar RATE and halved it, correctly and
// irrelevantly: "it's background music up till that point and then at around that point it loudly
// increases to foreground music volume" is a statement about where the music SITS.
//
// ⚠️ MEASURED THROUGH THE SHAPER, The Approach's `push` carried 3.6 dB of a 4.1 dB climb — 88% of
// everything the level ever gains, in one boundary, at forty-one seconds, then flat for two minutes.
// The layers that continue past `push` now arrive at 70% of their `surge` value, so a part enters and
// then grows.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0218',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE ROW AS IT SHIPPED, PUT BACK. Nothing about it looks wrong — `push` at 0.58/0.64/0.70
      against `surge` at 0.68/0.74/0.78 reads as a sensible small rise between two rungs. What it is,
      summed through the shaper over a place's own material, is one boundary doing the whole level.
    */
    broke: 'push arriving at its surge value again, so one boundary carries the whole climb',
    // 0226 replaced the boundary guard with the hold: the same break now moves `push` off its run.
    guard: 'every rung of a place holds its run loudness',
    edit: {
      path: 'src/content/music.ts',
      find: 'arp: 0.64, ride: 0.48, call: 0.68, hook: 0.52,',
      replace: 'arp: 0.64, ride: 0.58, call: 0.68, hook: 0.64,',
    },
  },
];
