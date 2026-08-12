// The break behind docs/decisions/0135-a-place-arrives-when-you-do.md.
//
// ⚠️ THIS IS THE SHIPPED DEFECT, RESTORED, AND IT IS 0128's OWN CHOICE. A place's loops were swapped
// at the next PHRASE — 25.6 seconds — on the argument that anywhere else "restarts a sixteen-bar
// chord progression in the middle of itself". That is true of the piece being left and false of the
// one arriving, and a level opens deliberately empty (0043), so the first level ever to have music of
// its own opened on the previous level's.
//
// The guard is written in SECONDS A PLAYER WAITS rather than in bars, so this break is visible as the
// thing that was reported rather than as a changed constant.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0135',
    suite: 'tests/music.test.ts',
    broke: 'a place waiting for the next phrase, so a level opens on the last one’s music',
    guard: '0135 — A PLACE ARRIVES WITHIN A BAR, and it used to be within a PHRASE',
    edit: {
      path: 'src/app/music.ts',
      find: '  let when = nextBarFrom(anchor, now);\n  while (when < now + minAhead) when += BAR_SECONDS;',
      replace:
        '  const since = now - anchor;\n  let when = anchor + Math.max(0, Math.ceil(since / PHRASE_SECONDS)) * PHRASE_SECONDS;\n  while (when < now + minAhead) when += PHRASE_SECONDS;',
    },
  },
];
