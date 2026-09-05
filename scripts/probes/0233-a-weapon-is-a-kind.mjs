// The breaks behind docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md.
//
// ⚠️ Three mechanisms landed together and each is broken on its own: the AXIS (a kind's ladders,
// faces and hulls, and the switch that starts a ladder again), the CYCLE (a pickup turning between
// the kinds of its ladder and handing over the face it showed), and the ARC (a chain resolved on the
// step it fires, and the picture stroked between its links). Every break is the tidy refactor a
// later reader would reach for, which is what a probe is for.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // A rung buying nothing. ⚠️ Re-aimed by 0236: the arc's reach became a ladder, so every one of
    // its rungs now buys reach whatever else is flattened; the pulse's third rung buys only its
    // fourth barrel, and the barrel held is the rung that changes nothing.
    broke: 'the pulse’s third rung authored so it changes nothing about the gun',
    guard: 'every rung changes the ship',
    edit: {
      path: 'src/content/weapons.ts',
      find: '    barrels: [1, 2, 3, 4, 4],',
      replace: '    barrels: [1, 2, 3, 3, 4],',
    },
  },
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // The other gun offered under the pulse's own glyph, so the cycle turns between two of one face.
    broke: 'the arc’s pickup face given the pulse’s chevron',
    guard: 'THE FACES: the weapon pickup offers every gun',
    edit: {
      path: 'src/content/weapons.ts',
      find: '    pickup: SPRITE.pickupArc,',
      replace: '    pickup: SPRITE.pickupWeapon,',
    },
  },
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // The arc's bare hull pointed at the pulse's bitmap — the ship stops saying which gun it carries.
    broke: 'the arc’s first hull made the pulse’s, so switching guns is invisible on a bare ship',
    guard: 'THE HULLS: every gun has its own',
    edit: {
      path: 'src/content/ships.ts',
      find: '    { base: SPRITE.shipArc, hit: SPRITE.shipArcHit },',
      replace: '    { base: SPRITE.ship, hit: SPRITE.shipHit },',
    },
  },
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // The face never consulted, so a full pulse refuses the arc as it refuses a fifth pulse.
    broke: 'the switch removed from `effectOf`, so the fitted gun’s cap refuses every other gun',
    guard: 'THE SWITCH: another gun is an upgrade',
    edit: {
      path: 'src/content/pickups.ts',
      find: "  if (kind === 'weapon' && weaponFaceOf(face) !== loadout.weapon) return 'upgrade';\n",
      replace: '',
    },
  },
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // ⚠️ INVERTED BY 0256. This broke *a switch keeping the old gun's rungs*, which is the rule
    // now: a switch keeps the count. What 0233 still owns is that a switch SWITCHES — the kind
    // on the run follows the pickup's face — and that is the break here.
    broke: 'a switch not switching, so the run keeps the fitted gun whatever face was taken',
    guard: 'THE SWITCH: another gun is an upgrade',
    edit: {
      path: 'src/state/slices/run.ts',
      find: "        weapon: action.upgrade === 'weapon' ? action.kind : state.weapon,",
      replace: '        weapon: state.weapon,',
    },
  },
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // The face advances and the picture does not: drawn as one gun, handed over as another — 0052's
    // hardest case, made trivially wrong.
    broke: 'the cycle turning the face without turning the sprite',
    guard: 'THE CYCLE, in the real frame',
    edit: {
      path: 'src/app/frame.ts',
      find: '      item.spriteBase = faces[item.face]!;\n      item.spriteHit = item.spriteBase;\n      item.faceIn = PICKUP_CYCLE_STEPS;',
      replace: '      item.faceIn = PICKUP_CYCLE_STEPS;',
    },
  },
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // The wait typed short and without the faces. ⚠️ The floor alone cannot show it today: 0064's
    // ten seconds already covers two turns of two faces, so a wait that ignored the faces would go
    // on being long enough until a third gun landed — which is the day this guard is for.
    broke: 'the wait typed short and without the faces, so a cycling pickup leaves before every gun has been seen twice',
    guard: 'PICKUP_REPEATS full turns',
    edit: {
      path: 'src/app/frame.ts',
      find: '  return cycles > PICKUP_LINGER_STEPS ? cycles : PICKUP_LINGER_STEPS;',
      replace: '  return 200 + 0 * cycles;',
    },
  },
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // The back wall removed: the pickup heads down the view and out of the box, where the ship cannot go.
    broke: 'the back wall of the box removed, so a waiting pickup wanders out of reach',
    guard: 'wanders the whole box',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (inView <= PLAYER_ALONG_MARGIN + PICKUP_TURN_ROOM) item.spin = 1;\n    else if (inView >= PLAYER_LEAD - PICKUP_TURN_ROOM) item.spin = -1;',
      replace: '    if (inView >= PLAYER_LEAD - PICKUP_TURN_ROOM) item.spin = -1;',
    },
  },
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // Every link from the nose: three bolts to three bodies is a fan, not a chain.
    broke: 'every link fired from the nose, so the chain is a fan',
    guard: 'THE CHAIN: a volley lands',
    edit: {
      path: 'src/app/frame.ts',
      find: '    fromAlong = toAlong;\n    fromAcross = toAcross;\n  }\n}',
      replace: '  }\n}',
    },
  },
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // Reach ignored on the search: a gun that cannot miss and cannot be out-ranged.
    broke: 'the reach ignored, so a bolt finds a body anywhere on the field',
    guard: 'beyond its reach it fires dry',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0257, which bounds the search by the screen's edge as well.
      find: '    const enemy = onBoss ? -1 : nearestFrom(w.enemies, fromAlong, fromAcross, w.weapon.reach, true, edge);',
      replace: '    const enemy = onBoss ? -1 : nearestFrom(w.enemies, fromAlong, fromAcross, 1e9, true, edge);',
    },
  },
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // The strike cue dropped: a bolt lands silently, and the ask's second sound is gone.
    broke: 'the strike cue removed, so a bolt that lands sounds only its discharge',
    guard: 'THE CHAIN: a volley lands',
    edit: {
      path: 'src/app/frame.ts',
      find: "      w.onCue('zap', toAcross);\n",
      replace: '',
    },
  },
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // Every further link on the same point of the boss: a chain that does not jump around it.
    broke: 'a bolt on the boss landing every link on one point',
    guard: 'ON A BOSS ALONE, every link',
    edit: {
      path: 'src/app/frame.ts',
      find: '        const depth = w.arcRng.range(0.25, 0.85) * target.radius;',
      replace: '        const depth = 0 * w.arcRng.range(0.25, 0.85) * target.radius;',
    },
  },
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // The ends jagged like the middle: the stroke no longer arrives on the body it struck.
    broke: 'the bolt’s ends jagged with the rest, so the stroke misses the body it struck',
    guard: 'THE PICTURE, in pixels',
    edit: {
      path: 'src/render/scene.ts',
      find: '      const off = v === 0 || v === last ? 0 : jag(seed, v, page) * amp;',
      replace: '      const off = jag(seed, v, page) * amp;',
    },
  },
  {
    decision: '0233',
    suite: 'tests/weapons.test.ts',
    // A pool too small for two volleys overlapping: the last links of the cap are dropped from the picture.
    // ⚠️ Re-aimed by 0241: at four links a cap two volleys deep was eight bolts and a pool of four
    // starved it; at three links it is six, and four no longer does — so the cut is to two.
    broke: 'the bolt pool cut below one overlapping volley',
    guard: 'the bolt pool never fills',
    edit: {
      path: 'src/app/mount.ts',
      find: '  bolts: 12,',
      replace: '  bolts: 2,',
    },
  },
];
