// The breaks behind docs/decisions/0599-the-water-and-the-paint-are-heard.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0599',
    suite: 'tests/duck.test.ts',
    broke: 'the jet silent after the cannon’s own cue, as 0595 left it',
    guard: 'is heard from the press to its last step, with no gap in it',
    edit: {
      path: 'src/app/frame.ts',
      // Re-anchored by 0616, which strikes it from the end of the stream.
      find: "  if (clock > 0 && clock < jet.steps && clock % SPRAY_EVERY === 0) w.onCue('spray', rootAcross + streamAcross(clock, oldest, jet.sweep, jet.period, speed));\n",
      replace: '',
    },
  },
  {
    decision: '0599',
    suite: 'tests/duck.test.ts',
    broke: 'the jet’s landings unheard',
    guard: 'every body it lands on is heard, on every ship, and as the water rather than as the gun’s hit',
    edit: {
      path: 'src/app/frame.ts',
      find: "  if (w.hits.count > landedBefore) w.onCue('douse', w.hits.across[landedBefore]!);\n",
      replace: '',
    },
  },
  {
    decision: '0599',
    suite: 'tests/duck.test.ts',
    broke: 'the jet’s landings heard as the gun’s hit on a ship whose gun logs blades',
    guard: 'every body it lands on is heard, on every ship, and as the water rather than as the gun’s hit',
    edit: {
      path: 'src/app/frame.ts',
      find: '    let bites = bladeHits === null ? 0 : w.hits.count - rammed - doused;',
      replace: '    let bites = bladeHits === null ? 0 : w.hits.count - rammed;',
    },
  },
  {
    decision: '0599',
    suite: 'tests/duck.test.ts',
    broke: 'a splat unheard',
    guard: 'a paintball that lands is heard splatting, where it lands',
    edit: {
      path: 'src/app/frame.ts',
      find: "  if (landed.count > 0) w.onCue('splat', landed.across[0]!);\n",
      replace: '',
    },
  },
];
