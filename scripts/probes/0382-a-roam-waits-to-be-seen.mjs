// A roam waits to be seen — docs/decisions/0382-a-roam-waits-to-be-seen.md
//
// Every guard 0382 adds, broken on purpose. `node scripts/prove-guard.mjs 0382`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0382',
    suite: 'tests/roam.test.ts',
    /*
      ⚠️ THE UNSEEN TURN REMOVED: a roam beyond the leading edge turns at 0059's band, twenty units
      outside the screen, which is the shipped defect — a drifter first seen fifty-seven units from
      the lane its author gave it, with its hull already off the screen.
    */
    broke: 'the roam turning outside the screen before it is seen, so it is first seen off it',
    guard: 'THE ASKED-FOR ONE: a drifting body is first seen ON THE SCREEN',
    edit: {
      path: 'src/app/frame.ts',
      find: '            if (e.across <= e.radius + ROAM_UNSEEN_MARGIN) e.velAcross = m.roam;\n            else if (e.across >= ACROSS_SPAN - e.radius - ROAM_UNSEEN_MARGIN) e.velAcross = -m.roam;\n',
      replace: '',
    },
  },
  {
    decision: '0382',
    suite: 'tests/roam.test.ts',
    // The inward rule dropped: a body seen in the outer quarter keeps the way it was going, and half
    // of those are heading out.
    broke: 'the first leg on the screen never turned inward, so a body seen near an edge sets off through it',
    guard: 'and its first leg on the screen heads INWARD from the outer quarter',
    edit: {
      path: 'src/app/frame.ts',
      find: '          const inward = e.across < ACROSS_SPAN * ROAM_INWARD ? 1 : e.across > ACROSS_SPAN * (1 - ROAM_INWARD) ? -1 : 0;',
      replace: '          const inward = 0;',
    },
  },
  {
    decision: '0382',
    suite: 'tests/roam.test.ts',
    /*
      ⚠️ THE PARITY GONE: every member of a rank dealt the same way at the spawn, so a formation no
      longer fans apart — the half of 0073 this decision keeps, and the reason the deal stays a parity
      rather than a rule about the edge alone.
    */
    broke: 'every member of a rank dealt the same way, so a formation no longer fans',
    guard: 'and its first leg on the screen heads INWARD from the outer quarter',
    edit: {
      path: 'src/app/frame.ts',
      find: "      if (row.motion.kind === 'drift') e.spin = (index + i) % 2 === 0 ? 1 : -1;",
      replace: "      if (row.motion.kind === 'drift') e.spin = 1;",
    },
  },
  {
    decision: '0382',
    suite: 'tests/roam.test.ts',
    // The content-wide claim, broken the same way as the first: the unseen turn removed reddens the
    // whole-level guard on every level that authors a drifting kind.
    broke: 'the roam turning outside the screen before it is seen, measured over every level',
    guard: 'and over every level the game has, no lead body is first seen off the screen',
    edit: {
      path: 'src/app/frame.ts',
      find: '            if (e.across <= e.radius + ROAM_UNSEEN_MARGIN) e.velAcross = m.roam;\n            else if (e.across >= ACROSS_SPAN - e.radius - ROAM_UNSEEN_MARGIN) e.velAcross = -m.roam;\n',
      replace: '',
    },
  },
];
