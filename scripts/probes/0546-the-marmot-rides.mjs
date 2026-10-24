// The breaks behind docs/decisions/0546-the-marmot-rides.md.
//
// One per guard tests/marmot.test.ts adds, and one for the Thunderbolt's place in tests/mounts.test.ts.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0546',
    suite: 'tests/marmot.test.ts',
    broke: 'the Marmot in the estate',
    guard: 'THE ASK: he flies the Thunderbolt',
    edit: { path: 'src/content/golfers.ts', find: "    ship: 'thunderbolt',", replace: "    ship: 'estate'," },
  },
  {
    decision: '0546',
    suite: 'tests/marmot.test.ts',
    broke: 'the Marmot open from the first run',
    guard: 'every one of the four flies from the first run, and he does not',
    // Re-anchored by 0592, which made the lock a row of three parts.
    // And by 0666, which added the tiers.
    edit: { path: 'src/content/golfers.ts', find: "    opens: { after: ['feather', 'woo', 'larry', 'bo'], crashes: 0, bought: 0, tiers: [] },", replace: '    opens: { after: [], crashes: 0, bought: 0, tiers: [] },' },
  },
  {
    decision: '0546',
    suite: 'tests/marmot.test.ts',
    broke: 'the Marmot open after any one of the four',
    guard: 'he is shut until the last of the four has won',
    // Re-anchored by 0592: who is left to clear is `lockLeft`'s now.
    edit: {
      path: 'src/content/golfers.ts',
      find: '    after: lock.after.filter((k) => !record.won[GOLFERS[k].ship]),',
      replace: '    after: lock.after.some((k) => record.won[GOLFERS[k].ship]) ? [] : [...lock.after],',
    },
  },
  {
    decision: '0546',
    suite: 'tests/marmot.test.ts',
    broke: 'any four wins opening him, his own ship’s among them',
    guard: 'a win in his own ship counts for nothing toward him',
    edit: {
      path: 'src/content/golfers.ts',
      find: '    after: lock.after.filter((k) => !record.won[GOLFERS[k].ship]),',
      replace: '    after: Object.values(record.won).filter(Boolean).length >= lock.after.length ? [] : [...lock.after],',
    },
  },
  {
    decision: '0546',
    suite: 'tests/marmot.test.ts',
    broke: 'the band naming the four whoever has won',
    guard: 'the band says who still has to clear the game',
    // Re-anchored by 0592: the band reads what `lockLeft` says is left, and this break reads the whole lock.
    edit: { path: 'src/state/screens.ts', find: '  const left = lockLeft(lock, record);', replace: '  const left = lockLeft(lock, { won: {} as typeof record.won, crashes: 0, bought: 0 });' },
  },
  {
    decision: '0546',
    suite: 'tests/marmot.test.ts',
    broke: 'the Marmot kept out of the Viper until he flies',
    guard: 'he is in every other pilot’s rescue pool',
    // Re-anchored by 0666, which leaves out a pilot the story is not told round.
    edit: { path: 'src/content/golfers.ts', find: '  return GOLFER_KINDS.filter((kind) => kind !== chosen && GOLFERS[kind].story);', replace: "  return GOLFER_KINDS.filter((kind) => kind !== chosen && GOLFERS[kind].story && kind !== 'marmot');" },
  },
  {
    decision: '0546',
    suite: 'tests/marmot.test.ts',
    broke: 'one of his lines dropped',
    guard: 'with his own five lines each way',
    edit: { path: 'src/content/golfers.ts', find: "      'Took you long enough. Kidding. Thank you. Really.',\n", replace: '' },
  },
  {
    decision: '0546',
    suite: 'tests/marmot.test.ts',
    broke: 'the Marmot drawn as a golfer in a cap',
    guard: 'runs and leaps on his own figure',
    edit: { path: 'src/render/golfer-art.ts', find: "  if (golfer.figure === 'marmot') {\n    paintMarmotRunner(", replace: "  if (golfer.figure === undefined) {\n    paintMarmotRunner(" },
  },
  {
    decision: '0546',
    suite: 'tests/marmot.test.ts',
    broke: 'Backspin Bo drawn as a marmot',
    guard: 'and nobody else is drawn as a marmot',
    edit: { path: 'src/content/golfers.ts', find: "    cut: 'tousled',", replace: "    cut: 'tousled',\n    figure: 'marmot'," },
  },
  {
    decision: '0546',
    suite: 'tests/mounts.test.ts',
    broke: 'the Thunderbolt firing from ahead of the ball it draws',
    guard: 'THE ROWS ARE THE DRAWING',
    edit: { path: 'src/content/ships.ts', find: '    muzzle: wheelAt(15.2, -3.4, 0, 1),', replace: '    muzzle: wheelAt(17.2, -3.4, 0, 1),' },
  },
];
