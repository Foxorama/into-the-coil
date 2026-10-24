// The breaks behind docs/decisions/0667-play-asks-of-venoma.md.
//
// One per guard tests/venoma.test.ts adds under 0667.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0667',
    suite: 'tests/venoma.test.ts',
    broke: 'the Viper back on the standard flame',
    guard: 'the Viper burns the violet the intro sees her leave the port on',
    edit: { path: 'src/content/ships.ts', find: "    flame: 'wyrmFlame',", replace: "    flame: 'standard'," },
  },
  {
    decision: '0667',
    suite: 'tests/venoma.test.ts',
    broke: 'the spray falling short at half the screen, as 0666 had it',
    guard: 'reaches three quarters of the screen',
    edit: { path: 'src/content/weapons.ts', find: '    range: 0.75,', replace: '    range: 0.5,' },
  },
  {
    decision: '0667',
    suite: 'tests/venoma.test.ts',
    broke: 'a spit that lands and leaves no burn',
    guard: 'a spit splats where it lands, as the marker’s paint does, and is heard hissing',
    edit: { path: 'src/content/weapons.ts', find: "    bursts: 'acidSplat',", replace: '    bursts: null,' },
  },
  {
    decision: '0667',
    suite: 'tests/venoma.test.ts',
    broke: 'the burn heard as the marker’s paint, with no hiss',
    guard: 'a spit splats where it lands, as the marker’s paint does, and is heard hissing',
    edit: { path: 'src/content/weapons.ts', find: "      lands: 'acidHiss',", replace: "      lands: 'splat'," },
  },
  {
    decision: '0667',
    suite: 'tests/venoma.test.ts',
    broke: 'the spray louder than the pulse it fires as often as',
    guard: 'the spray is heard as its own, quieter than the pulse it fires as often as',
    edit: { path: 'src/content/cues.ts', find: '    gain: 0.17,\n    glue: 0.22,', replace: '    gain: 0.3,\n    glue: 0.22,' },
  },
  {
    decision: '0667',
    suite: 'tests/venoma.test.ts',
    broke: 'Cosmo’s toggle back to Show owned with its line under it',
    guard: 'Cosmo’s toggle is just Owned, with no line under it to run into',
    edit: { path: 'src/state/screens.ts', find: "      { label: 'Owned', hint: '' },", replace: "      { label: 'Show owned', hint: 'Put what you own back on the shelves' }," },
  },
];
