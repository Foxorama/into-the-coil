// The breaks behind docs/decisions/0592-the-crashes-are-counted.md.
//
// One per guard tests/crashes.test.ts adds.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0592',
    suite: 'tests/crashes.test.ts',
    broke: 'every hit read as fire, whatever landed',
    guard: 'a life lost to flying into an enemy is a body',
    edit: { path: 'src/app/frame.ts', find: "w.killedBy = afterFire < healthBefore ? 'fire' : 'body';", replace: "w.killedBy = 'fire';" },
  },
  {
    decision: '0592',
    suite: 'tests/crashes.test.ts',
    broke: 'every hit read as a body, whatever landed',
    guard: 'a life lost to an enemy shot is fire',
    edit: { path: 'src/app/frame.ts', find: "w.killedBy = afterFire < healthBefore ? 'fire' : 'body';", replace: "w.killedBy = 'body';" },
  },
  {
    decision: '0592',
    suite: 'tests/crashes.test.ts',
    broke: 'the stone left out of the bodies, as if the wall were fire',
    guard: 'and a life lost to the stone is a body too',
    edit: {
      path: 'src/app/frame.ts',
      find: "w.killedBy = afterFire < healthBefore ? 'fire' : 'body';",
      replace: "w.killedBy = afterFire < healthBefore || w.corridor !== null ? 'fire' : 'body';",
    },
  },
  {
    decision: '0592',
    suite: 'tests/crashes.test.ts',
    broke: 'the death reported without what did it',
    guard: 'a life lost to flying into an enemy is a body',
    edit: { path: 'src/app/frame.ts', find: '  if (w.dyingIn === 0) w.onDeath(w.killedBy);', replace: "  if (w.dyingIn === 0) w.onDeath('fire');" },
  },
  {
    decision: '0592',
    suite: 'tests/crashes.test.ts',
    broke: 'a life lost to fire counted as a crash',
    guard: 'a life lost to a body is one crash, and one lost to fire is none',
    edit: { path: 'src/state/root.ts', find: "action.type === 'lifeLost' && action.cause === 'body' ?", replace: "action.type === 'lifeLost' ?" },
  },
  {
    decision: '0592',
    suite: 'tests/crashes.test.ts',
    broke: 'a report at nought lives counted, though the run spent nothing',
    guard: 'only a life the run spent is a crash',
    edit: {
      path: 'src/state/root.ts',
      find: '  if (run === state.run) return agree(state);',
      replace: "  if (run === state.run && action.type !== 'lifeLost') return agree(state);",
    },
  },
  {
    decision: '0592',
    suite: 'tests/crashes.test.ts',
    broke: 'the crashes left out of what the key writes',
    guard: 'is kept between visits, and a document written before it reads as none',
    edit: {
      path: 'src/save/hangar.ts',
      find: '  return JSON.stringify({ v: HANGAR_VERSION, won, plate, shards, owned, hung, special, gun, rim, art, livery, flame, rack, shell, crashes });',
      replace: '  return JSON.stringify({ v: HANGAR_VERSION, won, plate, shards, owned, hung, special, gun, rim, art, livery, flame, rack, shell });',
    },
  },
  {
    decision: '0592',
    suite: 'tests/crashes.test.ts',
    broke: 'any number read as a count of crashes',
    guard: 'is kept between visits, and a document written before it reads as none',
    edit: {
      path: 'src/save/hangar.ts',
      find: '  const crashes = Number.isSafeInteger(doc.crashes) && (doc.crashes as number) >= 0 ? (doc.crashes as number) : base.crashes;',
      replace: "  const crashes = typeof doc.crashes === 'number' ? doc.crashes : base.crashes;",
    },
  },
  {
    decision: '0592',
    suite: 'tests/crashes.test.ts',
    broke: 'what came free counted as bought',
    guard: 'nothing is bought on a first visit, whatever is free',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  return OWNABLE_KINDS.filter((kind) => OWNABLES[kind].price !== null && state.owned[kind]).length;',
      replace: '  return OWNABLE_KINDS.filter((kind) => state.owned[kind]).length;',
    },
  },
  {
    decision: '0592',
    suite: 'tests/crashes.test.ts',
    broke: 'a lock that never asks how many crashes',
    guard: 'is shut until every part is met, and open the moment the last one is',
    edit: { path: 'src/content/golfers.ts', find: '    crashes: Math.max(0, lock.crashes - record.crashes),', replace: '    crashes: 0,' },
  },
  {
    decision: '0592',
    suite: 'tests/crashes.test.ts',
    broke: 'the hint saying nothing of what is left to buy',
    guard: 'the hint counts down what is left, and is gone once the lock is met',
    edit: {
      path: 'src/state/screens.ts',
      find: "  if (left.bought > 0) owed.push('buy ' + left.bought + ' more ' + (left.bought === 1 ? 'thing' : 'things') + ' at Cosmo’s');\n",
      replace: '',
    },
  },
];
