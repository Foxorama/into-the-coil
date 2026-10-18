// The breaks behind docs/decisions/0621-the-tubes-ride-over-the-lights.md.
//
// ⚠️ On the pad the saucer's side-on tubes are laid after its lights. Laid with the ship again, the bulbs run
// across them, which is the report.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0621',
    suite: 'tests/intro.test.ts',
    broke: 'the pad laying the saucer’s tubes with the ship, under its lights, as before the ask',
    guard: 'lays the saucer’s side-on tubes over its ring of lights on the pad',
    edit: {
      path: 'src/render/port.ts',
      find: '  paintBlue(surface, view, t, pad, across, 0, Number.POSITIVE_INFINITY, size, 0, false);',
      replace: '  paintBlue(surface, view, t, pad, across, 0, Number.POSITIVE_INFINITY, size, 0, true);',
    },
  },
  {
    decision: '0621',
    suite: 'tests/intro.test.ts',
    broke: 'the intro’s hangar laying the saucer bare of its tubes',
    guard: 'lays the saucer’s side-on tubes over its ring of lights on the pad',
    edit: {
      path: 'src/render/port.ts',
      find: '  if (tubes) put(surface, view, PORT_SPRITE.blueTubes, along, across, 1, 0, size);',
      replace: '  if (tubes && false) put(surface, view, PORT_SPRITE.blueTubes, along, across, 1, 0, size);',
    },
  },
];
