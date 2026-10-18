// The break behind docs/decisions/0633-a-beat-that-stands-still-holds-nothing.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0633',
    suite: 'tests/sound.test.ts',
    broke: 'a gridded cue waiting on a beat that stands still, as the finale’s explosions did after a win',
    guard: '0633 — a gridded cue asked for while the world stands still',
    edit: {
      path: 'src/app/sound.ts',
      find: '      if (!still && beat % FIRE_GRID !== 0) return;',
      replace: '      if (beat % FIRE_GRID !== 0) return;',
    },
  },
];
