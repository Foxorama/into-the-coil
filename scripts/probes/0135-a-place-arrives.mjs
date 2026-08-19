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
    /*
      ⚠️ RE-AIMED BY 0177, AND THE BREAK WAS NEVER APPLIED AS WRITTEN. It named `PHRASE_SECONDS`,
      which `src/content/music.ts` exports and `src/app/music.ts` does not import — so the module
      threw `ReferenceError: PHRASE_SECONDS is not defined` and the test died on that, **without the
      guard ever asserting**. `red` was reported, and `red` was all that was recorded.

      ⚠️ THE ANCHOR RESOLVED THE WHOLE TIME, WHICH IS WHY NOTHING CAUGHT IT. 0019's pre-flight asks
      whether the `find` still appears; it cannot ask whether what replaces it can run in the file it
      lands in. That is the gap this probe sat in.

      ⚠️ SO THE PHRASE IS DERIVED FROM WHAT THE FILE HAS. `PHRASE_SECONDS` is `BAR_SECONDS` times the
      longest layer, and `MUSIC_LAYERS` and `secondsOfLayer` are both already imported here. It comes
      to 25.6 seconds, equal to the exported constant — checked, not assumed.
    */
    broke: 'a place waiting for the next phrase, so a level opens on the last one’s music',
    guard: '0135 — A PLACE ARRIVES WITHIN A BAR, and it used to be within a PHRASE',
    edit: {
      path: 'src/app/music.ts',
      find: '  let when = nextBarFrom(anchor, now);\n  while (when < now + minAhead) when += BAR_SECONDS;',
      replace:
        '  const phrase = Math.max(...MUSIC_LAYERS.map(secondsOfLayer));\n  const since = now - anchor;\n  let when = anchor + Math.max(0, Math.ceil(since / phrase)) * phrase;\n  while (when < now + minAhead) when += phrase;',
    },
  },
];
