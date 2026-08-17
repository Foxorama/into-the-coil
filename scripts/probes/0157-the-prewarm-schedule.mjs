// The breaks behind docs/decisions/0157-the-prewarm-was-scheduled-one-note-at-a-time.md.
//
// ⚠️ BOTH OF THESE ARE THE SHIPPED GAME, RESTORED. Neither is a hypothetical mistake: the first is
// the schedule the prewarm had for its whole life, and the second is the gesture path reading a flag
// that is only set by the last job. Together they froze the main thread for 4,556 ms on a press six
// seconds after load, and every guard in the repository was green.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0157',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE SCHEDULE AS IT SHIPPED — one job, then yield. It reads as the more careful version of
      the two, which is exactly why it lasted: a smaller slice looks like a smaller hitch. What it
      actually buys is a 4 ms clamp between every pair of notes, so ~3,000 jobs spend four times
      their own cost waiting, and the window in which a press is expensive is four times as long.
    */
    broke: 'the prewarm back to one note per timeout, so the gaps cost four times the synthesis',
    guard: '0157 — a SLICE does many notes, because a browser clamps the gap between them',
    edit: {
      path: 'src/app/sound.ts',
      find: '    const until = performance.now() + PREWARM_SLICE_MS;\n    while (pending !== null && pending.at < pending.jobs.length) {\n      pending.jobs[pending.at++]!();\n      if (performance.now() >= until) break;\n    }',
      replace: '    if (pending !== null && pending.at < pending.jobs.length) {\n      pending.jobs[pending.at++]!();\n    }',
    },
  },
  {
    decision: '0157',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE GESTURE THROWING THE PARTIAL WORK AWAY, which is the half a player feels. `drainPrewarm`
      becoming a no-op is precisely the shipped behaviour: `prewarmed` stays null until the last job,
      so a press with nine tenths of the set already synthesised re-synthesises all of it.

      ⚠️ AND THE LENGTHS WOULD STILL MATCH, which is why the guard compares SAMPLES. A re-bake
      produces buffers of exactly the right size holding exactly the right sound — the defect is that
      it does the work twice, and only a guard that reaches for the completed set can see it.
    */
    broke: 'a press stops finishing the prewarm, so nine tenths of the work is thrown away again',
    guard: '0157 — AND A PRESS FINISHES THE PREWARM RATHER THAN STARTING AGAIN',
    edit: {
      path: 'src/app/sound.ts',
      find: 'export function drainPrewarm(): void {\n  if (pending === null) return;',
      replace: 'export function drainPrewarm(): void {\n  if (pending !== null) return;\n  if (pending === null) return;',
    },
  },
];
