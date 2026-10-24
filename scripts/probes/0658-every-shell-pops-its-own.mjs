// The breaks behind docs/decisions/0658-every-shell-pops-its-own.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0658',
    suite: 'tests/shells.test.ts',
    // One pop for every shell again, the game's `shield`.
    broke: 'a shield hit heard in one voice whatever shell took it',
    guard: 'a hit a shield takes plays the worn shell’s pop',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (w.ship.health < healthBefore && w.ship.health > 0) w.onCue(w.shipRow.shield.pop, w.ship.across);',
      replace: "      if (w.ship.health < healthBefore && w.ship.health > 0) w.onCue('shield', w.ship.across);",
    },
  },
  {
    decision: '0658',
    suite: 'tests/shells.test.ts',
    // Two shells sounding the same.
    broke: 'the soap bubble popping as the honeycomb does',
    guard: 'THE ASK: every shell names the sound of it taking a hit',
    edit: {
      path: 'src/content/shells.ts',
      find: "      pop: 'shieldBubble',",
      replace: "      pop: 'shield',",
    },
  },
];
