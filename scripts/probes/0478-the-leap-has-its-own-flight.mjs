// The leap has its own flight — docs/decisions/0478-the-leap-has-its-own-flight.md
//
// Every guard 0478 adds or moves, broken on purpose. `node scripts/prove-guard.mjs 0478`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0478',
    suite: 'tests/volans.test.ts',
    // The old ending: laid down where the arrival puts a boss, not where the fish left from.
    broke: 'a leap that lands where the arrival does rather than where it left',
    guard: 'and at the last stage it LEAPS',
    edit: {
      path: 'src/app/frame.ts',
      find: '    settleOnStation(w, boss, w.leapFromAlong, w.leapFromAcross);\n    w.bossOffset = boss.along - w.cameraAlong;',
      replace: '    settleOnStation(w, boss, w.bossEntryAt, ACROSS_SPAN / 2);\n    w.bossOffset = boss.along - w.cameraAlong;',
    },
  },
  {
    decision: '0478',
    suite: 'tests/volans.test.ts',
    // Run under the edge deep enough to be off the lane, which is the old leap's second and a half gone.
    broke: 'a leap that runs under the edge out of sight',
    guard: 'and at the last stage it LEAPS',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'span: 36, speed: 1.2, depth: 8, back: 54 }',
      replace: 'span: 36, speed: 1.2, depth: 30, back: 54 }',
    },
  },
  {
    decision: '0478',
    suite: 'tests/volans.test.ts',
    // A curve back that crawls, the old arrival's three seconds again.
    broke: 'a leap whose way back crawls',
    guard: 'and at the last stage it LEAPS',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'span: 36, speed: 1.2, depth: 8, back: 54 }',
      replace: 'span: 36, speed: 1.2, depth: 8, back: 200 }',
    },
  },
  {
    decision: '0478',
    suite: 'tests/volans.test.ts',
    // The edge goes through silently: 0036's event the picture never mentions.
    broke: 'the edge going unbroken where the fish goes through it',
    guard: 'and at the last stage it LEAPS',
    edit: {
      path: 'src/app/frame.ts',
      find: "    burst(w, w.cameraAlong + along, surface, BURST.breach);\n    w.onCue('bossBreach', surface);",
      replace: '    void along;',
    },
  },
  {
    decision: '0478',
    suite: 'tests/volans.test.ts',
    // The face frozen through the leap, as it was.
    broke: 'the face left as it was when the leap began',
    guard: 'and at the last stage it LEAPS',
    edit: {
      path: 'src/app/frame.ts',
      find: '      driveLeap(w, boss);\n      wearFace(w, boss);',
      replace: '      driveLeap(w, boss);',
    },
  },
  {
    decision: '0478',
    suite: 'tests/volans.test.ts',
    // The report: the fish's face back to every face's band and no rest between snaps.
    broke: 'the fish’s jaw snapping at every crossing again',
    guard: 'THE REPORTED ONE: with the ship weaving across the fish’s lane',
    edit: {
      path: 'src/content/bosses.ts',
      find: '  shutHit: SPRITE.boss9ShutHit,\n  // A stalker crosses its own centreline constantly: a wider band and a rest between snaps — 0478.\n  look: 12,\n  biteRest: 45,',
      replace: '  shutHit: SPRITE.boss9ShutHit,',
    },
  },
];
