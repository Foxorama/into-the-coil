// The fish has four stages — docs/decisions/0380-the-fish-has-four-stages.md
//
// Every guard 0380 adds, broken on purpose. `node scripts/prove-guard.mjs 0380`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0380',
    suite: 'tests/volans.test.ts',
    // THE ASKED-FOR ONE: the order — the summons back where it was, last.
    broke: 'the summons stage put last again, so the play’s stage two is stage four',
    guard: 'THE ASKED-FOR ONE: the two stages the play liked lead',
    edit: {
      path: 'src/content/bosses.ts',
      find: "{ upTo: 0.72, fireEvery: 48, shots: 7, spread: 1.1, patrolScale: 1.8, stance: { kind: 'volley' }, look: ABLAZE, shot: null, attack: { kind: 'summon', enemy: 'kite', count: 3, formation: 'line', from: 'mouth', standing: 6 },",
      replace: "{ upTo: 0.72, fireEvery: 48, shots: 7, spread: 1.1, patrolScale: 1.8, stance: { kind: 'volley' }, look: ABLAZE, shot: null, attack: { kind: 'breaker', span: 96, rise: 1.5, ends: 0.66 },",
    },
  },
  {
    decision: '0380',
    suite: 'tests/volans.test.ts',
    // The last stage wearing the third's look: no fourth temperature, so nothing new after ablaze.
    broke: 'the last stage wearing ABLAZE, so the fourth stage looks like the third',
    guard: 'THE ASKED-FOR ONE: the two stages the play liked lead',
    edit: {
      path: 'src/content/bosses.ts',
      find: "look: BLAZING, shot: 'flame', attack: { kind: 'whip', sweep: 1.3, reach: 0.9 }",
      replace: "look: ABLAZE, shot: 'flame', attack: { kind: 'whip', sweep: 1.3, reach: 0.9 }",
    },
  },
  {
    decision: '0380',
    suite: 'tests/volans.test.ts',
    // The roam switched off: every wave rises under the hull, which is the report.
    broke: 'the breaker centred on the hull again, so the wave rises where the fish is',
    guard: 'and the BREAKER ROAMS',
    edit: {
      path: 'src/content/bosses.ts',
      find: "attack: { kind: 'breaker', span: 60, rise: 1.5, ends: 0.66, roams: true, warning: 30 }",
      replace: "attack: { kind: 'breaker', span: 60, rise: 1.5, ends: 0.66, roams: false, warning: 30 }",
    },
  },
  {
    decision: '0380',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE ROAM'S RANGE UNBOUNDED: the centre drawn out to the widest view, so on a 16:9 screen a
      wave can rise beyond the leading edge — spines the player never sees until they are in the lane.
    */
    broke: 'the wave’s centre drawn against the widest screen, so a narrow one never sees it rise',
    guard: 'and the BREAKER ROAMS',
    edit: {
      path: 'src/app/boss.ts',
      find: '      const narrowest = ACROSS_SPAN * MIN_ASPECT;',
      replace: '      const narrowest = ACROSS_SPAN * MIN_ASPECT * 1.5;',
    },
  },
  {
    decision: '0380',
    suite: 'tests/volans.test.ts',
    // The hold never released: the spines stand for ever, so the wave is a fence and never rises.
    broke: 'the warning never releasing the spines, so the wave stands in the edge and never rises',
    guard: 'and the wave WARNS',
    edit: {
      path: 'src/app/frame.ts',
      find: '      if (shot.holdFor === 0) {\n        shot.velAcross = -shot.firePhase;\n        shot.firePhase = 0;\n      }\n',
      replace: '',
    },
  },
  {
    decision: '0380',
    suite: 'tests/volans.test.ts',
    // The hold ignored in the thrower: the spines rise on the step they are thrown, tell or no tell.
    broke: 'the spines rising on the volley’s own step, so the warning is a number nothing reads',
    guard: 'and the wave WARNS',
    edit: {
      path: 'src/app/boss.ts',
      find: '        shot.velAcross = warning > 0 ? 0 : -rise;',
      replace: '        shot.velAcross = -rise;',
    },
  },
  {
    decision: '0380',
    suite: 'tests/volans.test.ts',
    // The leap's clock never fires: the fish stays on station for the whole last stage.
    broke: 'the leap never fired, so the last stage is the whip alone',
    guard: 'and at the last stage it LEAPS',
    edit: {
      path: 'src/app/frame.ts',
      find: '    w.bossLeapIn--;\n    if (w.bossLeapIn <= 0) {',
      replace: '    w.bossLeapIn--;\n    if (w.bossLeapIn <= 0 && false) {',
    },
  },
  {
    decision: '0380',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE DIVE DROPPED: the entrance replayed from the station without flying to the path's start,
      so the fish is teleported to the edge — a jump the picture never explains, and a leap that
      never went THROUGH the edge from where it was.
    */
    broke: 'the dive to the path’s start dropped, so a leap starts with a jump to the edge',
    guard: 'and at the last stage it LEAPS',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (far > DIVE_PER_STEP) {\n      boss.velAlong',
      replace: '    if (false) {\n      boss.velAlong',
    },
  },
];
