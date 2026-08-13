// The break behind docs/decisions/0137-the-desk-sounds-while-the-level-stands-still.md.
//
// ⚠️ THE BREAK IS THE OBVIOUS IMPLEMENTATION, WHICH IS WHAT MAKES IT WORTH PLANTING. "Let the desk
// put the loops back on the air" reads as "is anything held above zero?", and that is the version
// anybody writes first — it is one line, it passes every hand-check somebody would do (click a layer,
// hear it), and it is wrong in exactly the case the report was written about.
//
// ⚠️ A LAYER WITH NO HOLD FOLLOWS THE MIXER. So under the broken version, dragging one fader up with
// the transport stopped starts the entire piece playing underneath it — "play sounds without
// affecting the current run of the melody itself", answered with the melody.
//
// ⚠️ AND NOTHING ELSE IN THE SUITE CAN SEE IT. The audition guard is green either way, because an
// audition holds all twenty-three and both versions call that audible; the difference only shows on
// a desk that is holding SOME of the table, which is the state the guard below is written over.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0137',
    suite: 'tests/dash.test.ts',
    broke: 'the loops going back on the air for any held fader, so one drag restarts the whole piece',
    guard: 'AND ONE FADER ON ITS OWN DOES NOT, because everything else would follow the mixer',
    edit: {
      path: 'rig/transport.ts',
      find:
        '  let audible = false;\n' +
        '  for (const layer of MUSIC_LAYERS) {\n' +
        '    const gain = held.get(layer)?.gain ?? null;\n' +
        '    if (gain === null) return false;\n' +
        '    if (gain > 0) audible = true;\n' +
        '  }\n' +
        '  return audible;',
      replace: '  return MUSIC_LAYERS.some((layer) => (held.get(layer)?.gain ?? 0) > 0);',
    },
  },
];
