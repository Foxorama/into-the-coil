// The breaks behind docs/decisions/0557-the-marmot-crackles.md.
//
// ⚠️ The lightning is a picture that changes and lands somewhere new, in the fight and on the pad; a strike
// swept round from the last would read as a wheel spinning. And the storm's shell stands at its own orbit
// in the frame. ⚠️ Not the bake's: a plate is centred in its tile whatever orbit it is curved round, so
// that break only bends the arc half a unit, inside the drawn guard's band — it stayed green, and the
// decision says why it has no probe.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0557',
    suite: 'tests/wheels.test.ts',
    broke: 'a strike swept round from the last crack by the renderer',
    guard: 'strikes a new crack over each wheel every sixteenth of a second',
    edit: {
      path: 'src/app/frame.ts',
      find: '    wheel.prevTurn = struck ? turn : wheelTurn(row, i, was);',
      replace: '    wheel.prevTurn = struck ? wheelTurn(row, i, was) : wheelTurn(row, i, was);',
    },
  },
  {
    decision: '0557',
    suite: 'tests/wheels.test.ts',
    broke: 'the lightning in the fight holding its first crack for good',
    guard: 'strikes a new crack over each wheel every sixteenth of a second',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const frame = row.frames[wheelFrame(row, i, now)]!;',
      replace: '    const frame = row.frames[0 * wheelFrame(row, i, now)]!;',
    },
  },
  {
    decision: '0557',
    suite: 'tests/stand.test.ts',
    broke: 'the lightning on the pad holding its first crack for good',
    guard: 'the Thunderbolt’s lightning crackles on the pad',
    edit: {
      path: 'src/render/port.ts',
      find: '      const sprite = BLUE_WHEELS[wheelFrame(wheel, i, seconds)]!;',
      replace: '      const sprite = BLUE_WHEELS[0 * wheelFrame(wheel, i, seconds)]!;',
    },
  },
  {
    decision: '0557',
    suite: 'tests/shields.test.ts',
    broke: 'the frame standing every shell at the shared orbit whatever its row says',
    guard: 'THE OWN SHELL: every ship flies in its own plates',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const orbit = shellOrbit(w.shipRow.shield);',
      replace: '    const orbit = 5.6 + 0 * shellOrbit(w.shipRow.shield);',
    },
  },
  {
    decision: '0557',
    suite: 'tests/shields.test.ts',
    broke: 'the storm back on the bike at the shared orbit',
    guard: 'the Thunderbolt’s storm stands clear of the bike',
    edit: {
      path: 'src/content/shells.ts',
      find: '      orbit: 7.1,',
      replace: '      orbit: 5.6,',
    },
  },
];
