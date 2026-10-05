// The breaks behind docs/decisions/0539-the-marmot-rides.md.
//
// One per guard tests/marmot.test.ts adds, and one for the Thunderbolt's place in tests/mounts.test.ts.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0539',
    suite: 'tests/marmot.test.ts',
    broke: 'the Marmot in the estate',
    guard: 'THE ASK: he flies the Thunderbolt',
    edit: { path: 'src/content/golfers.ts', find: "    ship: 'thunderbolt',", replace: "    ship: 'estate'," },
  },
  {
    decision: '0539',
    suite: 'tests/marmot.test.ts',
    broke: 'the Marmot open from the first run',
    guard: 'every one of the four flies from the first run, and he does not',
    edit: { path: 'src/content/golfers.ts', find: "    opensAfter: ['feather', 'woo', 'larry', 'bo'],", replace: '    opensAfter: [],' },
  },
  {
    decision: '0539',
    suite: 'tests/marmot.test.ts',
    broke: 'the Marmot open after any one of the four',
    guard: 'he is shut until the last of the four has won',
    edit: { path: 'src/content/golfers.ts', find: '  return GOLFERS[golfer].opensAfter.every((k) => won[GOLFERS[k].ship]);', replace: '  return GOLFERS[golfer].opensAfter.length === 0 || GOLFERS[golfer].opensAfter.some((k) => won[GOLFERS[k].ship]);' },
  },
  {
    decision: '0539',
    suite: 'tests/marmot.test.ts',
    broke: 'any four wins opening him, his own ship’s among them',
    guard: 'a win in his own ship counts for nothing toward him',
    edit: {
      path: 'src/content/golfers.ts',
      find: '  return GOLFERS[golfer].opensAfter.every((k) => won[GOLFERS[k].ship]);',
      replace: '  return Object.values(won).filter(Boolean).length >= GOLFERS[golfer].opensAfter.length;',
    },
  },
  {
    decision: '0539',
    suite: 'tests/marmot.test.ts',
    broke: 'the band naming the four whoever has won',
    guard: 'the band says who still has to clear the game',
    edit: { path: 'src/state/screens.ts', find: '    const left = GOLFERS[kind].opensAfter.filter((k) => !won[GOLFERS[k].ship]);', replace: '    const left = GOLFERS[kind].opensAfter;' },
  },
  {
    decision: '0539',
    suite: 'tests/marmot.test.ts',
    broke: 'the Marmot kept out of the Viper until he flies',
    guard: 'he is in every other pilot’s rescue pool',
    edit: { path: 'src/content/golfers.ts', find: '  return GOLFER_KINDS.filter((kind) => kind !== chosen);', replace: "  return GOLFER_KINDS.filter((kind) => kind !== chosen && kind !== 'marmot');" },
  },
  {
    decision: '0539',
    suite: 'tests/marmot.test.ts',
    broke: 'one of his lines dropped',
    guard: 'with his own five lines each way',
    edit: { path: 'src/content/golfers.ts', find: "      'Took you long enough. Kidding. Thank you. Really.',\n", replace: '' },
  },
  {
    decision: '0539',
    suite: 'tests/marmot.test.ts',
    broke: 'the Marmot drawn as a golfer in a cap',
    guard: 'runs and leaps on his own figure',
    edit: { path: 'src/render/golfer-art.ts', find: "  if (golfer.figure === 'marmot') {\n    paintMarmotRunner(", replace: "  if (golfer.figure === undefined) {\n    paintMarmotRunner(" },
  },
  {
    decision: '0539',
    suite: 'tests/marmot.test.ts',
    broke: 'Backspin Bo drawn as a marmot',
    guard: 'and nobody else is drawn as a marmot',
    edit: { path: 'src/content/golfers.ts', find: "    cut: 'tousled',", replace: "    cut: 'tousled',\n    figure: 'marmot'," },
  },
  {
    decision: '0539',
    suite: 'tests/mounts.test.ts',
    broke: 'the Thunderbolt firing from ahead of the ball it draws',
    guard: 'THE ROWS ARE THE DRAWING',
    edit: { path: 'src/content/ships.ts', find: '    muzzle: wheelAt(15.2, -3.4, 0, 1),', replace: '    muzzle: wheelAt(17.2, -3.4, 0, 1),' },
  },
];
