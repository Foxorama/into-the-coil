// The breaks behind docs/decisions/0612-the-riders-get-off.md.
//
// ⚠️ The vehicles are drawn bare and the pilot aboard is drawn on them, so the breaks that matter are a rider
// left on a vehicle nobody is aboard — on the bike, in the ball, on the pad, in the intro before the leap
// lands — and a pilot whose ship shows them with nobody drawn to show.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0612',
    suite: 'tests/riders.test.ts',
    broke: 'the Marmot with no drawing astride the Thunderbolt',
    guard: 'every pilot whose ship shows them has a drawing aboard it',
    edit: { path: 'src/render/bake.ts', find: '  marmot: MARMOT_ASTRIDE,', replace: '  marmot: null,' },
  },
  {
    decision: '0612',
    suite: 'tests/riders.test.ts',
    broke: 'the Marmot drawn on the Thunderbolt whoever is aboard, nobody included',
    guard: 'the Thunderbolt with nobody aboard shows no rider',
    edit: {
      path: 'src/render/bake.ts',
      find: '  const astride = rider === null ? null : astrideAs(rider);',
      replace: "  const astride = astrideAs(rider ?? 'marmot');",
    },
  },
  {
    decision: '0612',
    suite: 'tests/riders.test.ts',
    broke: 'Unity drawn in the ball whoever is aboard, nobody included',
    guard: 'the Hamster Ball with nobody aboard is empty in the middle',
    edit: {
      path: 'src/render/bake.ts',
      find: '  if (rider !== null) insideAs(rider)(ctx, f, palette, 1, pose);',
      replace: "  insideAs(rider ?? 'weasel')(ctx, f, palette, 1, pose);",
    },
  },
  {
    decision: '0612',
    suite: 'tests/riders.test.ts',
    broke: 'the pad laying the rider on its ship',
    guard: 'the pad shows every ship with nobody aboard',
    edit: {
      path: 'src/render/port.ts',
      // 0621: re-anchored; the pad lays the tubes itself.
      // Re-anchored by 0676, which lights the ship from its cradle in the same call.
      find: '  paintBlue(surface, view, t, pad, across, 0, Number.POSITIVE_INFINITY, size, 0, false, 1);',
      replace: '  paintBlue(surface, view, t, pad, across, 0, Number.POSITIVE_INFINITY, size, 1, false, 1);',
    },
  },
  {
    decision: '0612',
    suite: 'tests/riders.test.ts',
    broke: 'the intro’s ship ridden before its pilot has run to it',
    guard: 'the intro’s pilot runs to an empty ship that shows them',
    edit: {
      path: 'src/render/port.ts',
      find: '  const aboard = seated ? ease(t, BEATS.pilotLeap + LANDS * (BEATS.pilotIn - BEATS.pilotLeap), BEATS.pilotIn) : 0;',
      replace: '  const aboard = seated ? 1 : 0;',
    },
  },
];
