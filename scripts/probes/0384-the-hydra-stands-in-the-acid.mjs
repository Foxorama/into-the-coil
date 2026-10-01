// The breaks behind docs/decisions/0384-the-hydra-stands-in-the-acid.md.
//
// Asked for: *"It needs to be a hydra that has its lower body in the acid pools, the top half of its
// body and tail sitting above the acid pools and it starts with a single head… it actually grows a new
// head… neck needs to be coloured for the new head."*

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0384',
    suite: 'tests/hydra.test.ts',
    // One neck for the whole fight: the phase table says five heads and the picture shows one.
    broke: 'no neck grown past the first, so the heads the phases name are never on the screen',
    guard: 'THE ASK: a neck grows with every phase',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const shown = Math.min(necks.necks.length, w.bossRow.phases.indexOf(phase) + 1, w.necksBorn.length);',
      replace: '  const shown = Math.min(1, necks.necks.length, w.bossRow.phases.indexOf(phase) + 1, w.necksBorn.length);',
    },
  },
  {
    decision: '0384',
    suite: 'tests/hydra.test.ts',
    // Every neck carrying the serpent's head: five necks, one head drawn five times.
    broke: 'every neck carrying the first head, so the fish, the pterodactyl, the ice and the clockwork never appear',
    guard: 'THE ASK: a neck grows with every phase',
    edit: {
      path: 'src/app/frame.ts',
      find: '    head.sprite = head.flashFor > 0 ? row.headHit : row.head;',
      replace: '    head.sprite = head.flashFor > 0 ? row.headHit : necks.necks[0]!.head;',
    },
  },
  {
    decision: '0384',
    suite: 'tests/hydra.test.ts',
    // A head that appears in its place: *"grows a new head"* told by a switch.
    broke: 'a new neck standing in its place the step it is born, so no head ever rises out of the acid',
    guard: 'AND A NEW HEAD RISES OUT OF THE ACID',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const eased = 1 - (1 - risen) * (1 - risen);',
      replace: '    const eased = 1 + 0 * risen;',
    },
  },
  {
    decision: '0384',
    suite: 'tests/hydra.test.ts',
    // The round not naming its mouth: every head's attack out of the serpent's.
    broke: 'the round not pointing the volley at its own head, so every attack leaves the first mouth',
    guard: 'EVERY HEAD’S ATTACK LEAVES ITS OWN MOUTH',
    edit: {
      path: 'src/app/boss.ts',
      find: '      if (mouths.length > 0) boss.muzzleAt = at;\n',
      replace: '',
    },
  },
  {
    decision: '0384',
    suite: 'tests/hydra.test.ts',
    // The laser rooted where every beam was: in the hull, behind the pterodactyl's neck.
    broke: 'a laser pinned to the hull’s centre, so it reaches back past the head that fired it',
    guard: 'EVERY HEAD’S ATTACK LEAVES ITS OWN MOUTH',
    edit: {
      path: 'src/app/frame.ts',
      // Re-anchored by 0403, whose tentacles root a beam at their tips, and 0452, whose roots ride the bolt.
      find: '      b.fromAlong = muzzleAlongOf(boss, w.bossRow, w.mouths) + b.rootAlong - b.along;',
      replace: '      b.fromAlong = boss.along + b.rootAlong - b.along;',
    },
  },
  {
    decision: '0384',
    suite: 'tests/hydra.test.ts',
    // The heads as scenery: shot, flashing, and taking nothing off the hydra.
    broke: 'a hit on a head spent on nothing, so the heads the player shoots are pictures',
    guard: 'A SHOT ON A HEAD HURTS THE HYDRA',
    edit: {
      path: 'src/app/frame.ts',
      // Re-anchored by 0403, whose tentacles pass their hits on the same way.
      find: '  const hurt = chain !== null ? chain.hurt : (w.bossRow.necks?.hurt ?? w.bossRow.tendrils?.hurt);',
      replace: '  const hurt = chain !== null ? chain.hurt : (undefined ?? w.bossRow.tendrils?.hurt);',
    },
  },
  {
    decision: '0384',
    suite: 'tests/hydra.test.ts',
    // No floor under it: the hydra stands on the lane's edge whatever the bank is doing.
    broke: 'the shore never read, so the hydra stands on the lane’s edge and the rolling bank passes through it',
    guard: 'IT STANDS IN THE ACID',
    edit: {
      path: 'src/app/boss.ts',
      find: '      const face = corridor === null ? Number.POSITIVE_INFINITY : faceAt(corridor, boss.along, 1);',
      replace: '      const face = corridor === null || true ? Number.POSITIVE_INFINITY : faceAt(corridor, boss.along, 1);',
    },
  },
  {
    decision: '0384',
    suite: 'tests/hydra.test.ts',
    // The acid it stands in never laid: the body goes down behind a bank of mud.
    broke: 'the pool never laid, so the hydra stands behind a bank of mud rather than in acid',
    guard: 'IT STANDS IN THE ACID',
    edit: {
      path: 'src/app/frame.ts',
      find: '  corridor.poolTo = hull.along + move.pool;',
      replace: '  corridor.poolTo = -1;',
    },
  },
  {
    decision: '0384',
    suite: 'tests/hydra.test.ts',
    // The aura made a property of every head: five burning heads, from the first phase.
    broke: 'every head burning with the clockwork’s aura, from the first phase on',
    // Re-anchored by 0389, which set the whole animal alight once the clockwork has risen: what burns is
    // `burns`'s to say now, and the break is every flame saying yes from the start.
    guard: 'AND THE CLOCKWORK HEAD BURNS FIRST',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (necks.necks[k]!.aura !== undefined) return true;',
      replace: '  if (necks.necks[k]!.aura !== undefined || k >= 0) return true;',
    },
  },
];
