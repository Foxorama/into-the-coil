// The breaks behind docs/decisions/0447-the-ward-is-a-third-trigger.md.
//
// One per guard in tests/ward.test.ts, each the defect the guard is for: the ward without its keys,
// a shield face that is armour whatever it shows, Burn's void given to the caddie, a nova that strikes
// a body every step it overlaps, a nova that never pops a shot, and one drawn off the radius it lands at.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0447',
    suite: 'tests/ward.test.ts',
    broke: 'the ward’s trigger bound to nothing',
    guard: 'THE ASK: the void and the nova are the ward’s',
    edit: {
      path: 'src/content/actions.ts',
      find: "  special3: ['KeyE', 'KeyX'],",
      replace: '  special3: [],',
    },
  },
  {
    decision: '0447',
    suite: 'tests/ward.test.ts',
    broke: 'every face of the shield pickup a shield, so the void and the nova are armour',
    guard: 'the shield pickup turns through the shield, the void and the nova',
    edit: {
      path: 'src/content/pickups.ts',
      find: "  if (effect === 'shield') return face > 0 ? 'special' : 'shield';",
      replace: "  if (effect === 'shield') return 'shield';",
    },
  },
  {
    decision: '0447',
    suite: 'tests/ward.test.ts',
    broke: 'the caddie on Burn given a void on top of its novas',
    guard: 'a Burn run opens with one void beside its own pair',
    edit: {
      path: 'src/state/slices/run.ts',
      find: "  if (side !== 'ward') for (const kind of DIFFICULTIES[difficulty].opensWith) ward.push(kind);",
      replace: '  for (const kind of DIFFICULTIES[difficulty].opensWith) ward.push(kind);',
    },
  },
  {
    decision: '0447',
    suite: 'tests/ward.test.ts',
    broke: 'a nova striking a body every step its radius is past it, rather than once as it crosses',
    guard: 'strikes a body it crosses ONCE',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return d <= now && (first || d > was);',
      replace: '  return d <= now;',
    },
  },
  {
    decision: '0447',
    suite: 'tests/ward.test.ts',
    broke: 'a nova that passes every shot by',
    guard: 'pops every hostile shot its edge reaches',
    edit: {
      path: 'src/app/frame.ts',
      find: '|| crossed(d, was, now, first)) w.enemyShots.releaseAt(i);',
      replace: '|| crossed(d, was, now, first)) continue;',
    },
  },
  {
    decision: '0447',
    suite: 'tests/ward.test.ts',
    broke: 'the ring drawn a step behind the radius that lands',
    guard: 'is drawn at the radius it lands at',
    edit: {
      path: 'src/app/frame.ts',
      find: '    reset(piece, along, across, NOVA_PIECE);',
      replace: '    reset(piece, centreAlong + cos * was, w.novaAcross + sin * was, NOVA_PIECE);',
    },
  },
];
