// The breaks behind docs/decisions/0165-the-desk-sounds-what-you-raise.md.
//
// ⚠️ BOTH PROBES PUT 0137 BACK, one half each, because 0165 is an amendment rather than a new claim.
// The two halves are a single rule and each is uselessly weak alone: the air condition may only be
// *something is held above zero* if nothing follows a stopped level, and silencing the followers buys
// nothing if the loops never go on the air to hear them. A version of this feature with either half
// missing is a version that ships the reported bug, so there is a probe per half.
//
// ⚠️ AND NEITHER IS THE READOUT, WHICH IS NOT GUARDED AND SAYS SO. The `live` column reading zero off
// the air is a DOM read of a Web Audio node; the only headless version is a source scan, which is the
// failure `tests/dash.test.ts`'s own header records — "a spellcheck standing in for a property, and
// it looked exactly like a guard." The decision has the argument and the driven evidence.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0165',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ 0137's REFUSAL, RESTORED: a layer with no hold goes on following the ladder while the
      transport is stopped. This is the half that makes the other half safe — without it, one dragged
      fader really would start the whole piece, which is what 0137 correctly refused to allow.
    */
    broke: 'an unheld layer following the level while the transport is stopped, which is 0137’s refusal restored',
    guard: '0165 — NOTHING FOLLOWS THE LEVEL WHILE THE LEVEL STANDS STILL, which is what makes the above safe',
    edit: {
      path: 'rig/transport.ts',
      find: '  if (hold.gain !== null) return hold.gain;\n  return walking ? target : 0;',
      replace: '  if (hold.gain !== null) return hold.gain;\n  return target;',
    },
  },
  {
    decision: '0165',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ 0137's CONDITION, RESTORED: the loops go on the air only when every layer is held. It is the
      exact code that shipped, and under it a fader dragged up on a stopped transport writes into
      sources that are not running — the reported defect, which measured as a `GainNode` at 1.55 and
      total silence.
    */
    broke: 'the air condition back to *every layer held*, so one dragged fader is silent again',
    guard: '0165 — AND SO IS ONE FADER ON ITS OWN, which is the assertion this guard used to make backwards',
    edit: {
      path: 'rig/transport.ts',
      find:
        'export function deskSounds(held: ReadonlyMap<MusicLayer, Held>): boolean {\n' +
        '  for (const layer of MUSIC_LAYERS) {\n' +
        '    const gain = held.get(layer)?.gain;\n' +
        '    if (gain !== undefined && gain !== null && gain > 0) return true;\n' +
        '  }\n' +
        '  return false;\n' +
        '}',
      replace:
        'export function deskSounds(held: ReadonlyMap<MusicLayer, Held>): boolean {\n' +
        '  let audible = false;\n' +
        '  for (const layer of MUSIC_LAYERS) {\n' +
        '    const gain = held.get(layer)?.gain ?? null;\n' +
        '    if (gain === null) return false;\n' +
        '    if (gain > 0) audible = true;\n' +
        '  }\n' +
        '  return audible;\n' +
        '}',
    },
  },
];
