// The breaks behind docs/decisions/0235-a-seeker-hunts-the-nearest-body.md.
//
// ⚠️ A homing missile is a straight one with a turn, so every break here is the turn quietly
// coming out: a seeker that cannot turn, one that hunts only ahead, one that slows as it turns, and
// one worth as much as the missile it was meant to be cheaper than.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0235',
    suite: 'tests/seekers.test.ts',
    // The turn rate zeroed on the row: a seeker that is a slower, weaker straight missile.
    broke: 'the seeker’s turn authored to zero, so it flies straight',
    guard: 'THE HUNT: a seeker turns',
    edit: {
      path: 'src/content/missiles.ts',
      find: '    seek: 0.09,',
      replace: '    seek: 0,',
    },
  },
  {
    decision: '0235',
    suite: 'tests/seekers.test.ts',
    // The hunt limited to what is ahead, which is the obvious "optimisation".
    broke: 'the hunt refusing any body behind the missile',
    guard: 'a body BEHIND the ship is reached',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const ownAlong = m.velAlong - w.scrollPerStep;\n  const ownAcross = m.velAcross;',
      replace: '  if (target.along < m.along) return;\n  const ownAlong = m.velAlong - w.scrollPerStep;\n  const ownAcross = m.velAcross;',
    },
  },
  {
    decision: '0235',
    suite: 'tests/seekers.test.ts',
    // The heading turned and the speed let slip with it.
    broke: 'the turn costing speed, so a seeker that comes about arrives slow',
    guard: 'turns without slowing',
    edit: {
      path: 'src/app/frame.ts',
      find: '  m.velAlong = Math.cos(turned) * speed + w.scrollPerStep;\n  m.velAcross = Math.sin(turned) * speed;',
      replace: '  m.velAlong = Math.cos(turned) * speed * 0.9 + w.scrollPerStep;\n  m.velAcross = Math.sin(turned) * speed * 0.9;',
    },
  },
  {
    decision: '0235',
    suite: 'tests/seekers.test.ts',
    // The seeker made worth the straight missile: guidance for free.
    broke: 'the seeker worth as much as the straight missile',
    guard: 'is worth less than the straight missile',
    edit: {
      path: 'src/content/shots.ts',
      find: '  seeker: { sprite: SPRITE.seeker, spriteHit: SPRITE.seeker, radius: 1.2, health: 1, damage: 2, speed: 1.4 },',
      replace: '  seeker: { sprite: SPRITE.seeker, spriteHit: SPRITE.seeker, radius: 1.2, health: 1, damage: 3, speed: 1.4 },',
    },
  },
  {
    decision: '0235',
    suite: 'tests/weapons.test.ts',
    // The seekers offered under the straight missile's face — 0233's guard over every tube sees it.
    broke: 'the seekers’ pickup face given the straight missile’s chevron',
    guard: 'THE FACES: the weapon pickup offers every gun',
    edit: {
      path: 'src/content/missiles.ts',
      find: '    pickup: SPRITE.pickupSeeker,',
      replace: '    pickup: SPRITE.pickupMissile,',
    },
  },
];
