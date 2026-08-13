// The breaks behind docs/decisions/0138-a-section-boundary-is-a-distance-you-can-drag.md.
//
// ⚠️ THE TWO WAYS A DRIVEABLE INPUT COMES APART FROM THE THING IT DRIVES, and each of them leaves a
// page that still moves, still redraws, and still looks like it is working:
//
//   1. the handle moves and the LADDER does not — the strip redraws, the seconds change, and the
//      mixer goes on being told the shipped rung. That is docs/decisions/0116's drift with a slider
//      on it, and it is the shape a hand reaches for when threading an argument gets tedious.
//   2. the handle moves past its neighbour and a SECTION SILENTLY DISAPPEARS. `musicLevelFor` tests
//      the three in order, so `surge` dragged past `approach` is never returned at all — and the one
//      thing this tool exists to answer, "what does moving this boundary sound like", would be
//      answered about a section that no longer happens.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0138',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ THE DRAG REACHING THE READOUT AND NOT THE RUNG. The strip is drawn from `marksOf`, which is
      threaded; this breaks the answer the MIXER is handed, sixty times a second, in `frame`. So the
      section boundaries visibly move and nothing about the music does — an instrument disagreeing
      with the thing it measures, which is the failure docs/decisions/0126 opens by naming.
    */
    broke: 'the dragged boundary reaching the drawing and not the ladder, so the mixer hears the shipped one',
    guard: 'A DRAGGED BOUNDARY IS WHERE THE LADDER TURNS OVER, to the second the camera crosses it',
    edit: {
      path: 'rig/transport.ts',
      find: '  at: SectionUnits = SECTION_UNITS,\n): Moment {\n  const level = LEVELS[kind];',
      replace: '  at: SectionUnits = SECTION_UNITS,\n): Moment {\n  at = SECTION_UNITS;\n  const level = LEVELS[kind];',
    },
  },
  {
    decision: '0138',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ A CLAMP AGAINST A RANGE RATHER THAN AGAINST ITS NEIGHBOURS, which is what a first pass
      writes: keep it positive, keep it inside the level, done. The three are an ORDERING, so that
      version lets `push` be dragged under `surge` — and `musicLevelFor` then returns `push` for
      everything `surge` used to cover, with the strip still drawing a `surge` segment because the
      rig's own marks come from the same broken set.
    */
    broke: 'a boundary clamped only against the level, so one can be dragged past another and delete a section',
    guard: 'NO DRAG CAN PUT THE THREE OUT OF ORDER, or make one shorter than the bar its ramp lands on',
    edit: {
      path: 'rig/transport.ts',
      find: "  if (which === 'approach') return { ...at, approach: clamp(floor, at.surge - floor) };\n" +
        "  if (which === 'surge') return { ...at, surge: clamp(at.approach + floor, at.push - floor) };\n" +
        '  return { ...at, push: clamp(at.surge + floor, bossAt - floor) };',
      replace: '  return { ...at, [which]: clamp(floor, bossAt - floor) };',
    },
  },
];
