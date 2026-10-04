// The gyre throws its own — docs/decisions/0494-the-gyre-throws-its-own.md
//
// Every guard 0494 adds, broken on purpose. `node scripts/prove-guard.mjs 0494`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0494',
    suite: 'tests/gyre.test.ts',
    // The gyre back on the raiders' slab: the clockwork lord throwing what every turret throws.
    broke: 'the gyre throwing the raiders’ slab again',
    guard: 'THE LORD’S OWN SHOT: its fire is the tooth, no raider throws it, and it is sealed in the lord’s light',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    // Its own, since 0494: it threw the raiders' slab.\n    shot: 'tooth',",
      replace: "    // Its own, since 0494: it threw the raiders' slab.\n    shot: 'flak',",
    },
  },
  {
    decision: '0494',
    suite: 'tests/gyre.test.ts',
    // The tooth in the raiders' skin: the lord's shot in the uniform of the things it sends.
    broke: 'the tooth painted in the place’s raider skin rather than its lord’s',
    guard: 'THE LORD’S OWN SHOT: its fire is the tooth, no raider throws it, and it is sealed in the lord’s light',
    edit: {
      path: 'src/render/bake.ts',
      find: "      const own = lordOf(theme, palette);\n      // The wheel in the lord's light",
      replace: "      const own = foeOf(theme, palette);\n      // The wheel in the lord's light",
    },
  },
  {
    decision: '0494',
    suite: 'tests/gyre.test.ts',
    // One slot turned off the diagonal: a tooth with a heading, which a blit flies every way but one.
    broke: 'one of the tooth’s four slots turned off its diagonal',
    guard: 'NO HEADING: the tooth turned a quarter is the same outline, because a blit cannot turn',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const slot = Math.PI / 4 + (k * Math.PI) / 2;\n  const opens',
      replace: '  const slot = Math.PI / 4 + (k * Math.PI) / 2 + (k === 0 ? 0.3 : 0);\n  const opens',
    },
  },
];
