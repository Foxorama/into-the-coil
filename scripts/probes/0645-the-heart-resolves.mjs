// The breaks behind docs/decisions/0645-the-heart-resolves.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0645',
    suite: 'tests/title-menu.test.ts',
    // The coda's bar forgotten: the ending comes in at the next bar, on top of the chord being struck.
    broke: 'an ending that starts on the coda rather than under its held chord',
    guard: 'waits for the coda',
    edit: {
      path: 'src/app/music.ts',
      find: '        const when = Math.max(placeArrivesAt(anchorAudio, now, SCHEDULE_AHEAD), titleNotBefore);',
      replace: '        const when = placeArrivesAt(anchorAudio, now, SCHEDULE_AHEAD);',
    },
  },
  {
    decision: '0645',
    suite: 'tests/title-menu.test.ts',
    // The hand-over written as the menu's: the Black Heart's bed raised again under the ending, to be faded out.
    broke: 'the bed the coda let go brought back up when the ending starts',
    guard: 'waits for the coda',
    edit: {
      path: 'src/app/music.ts',
      find: '        if (!runMuted) {',
      replace: '        if (runMuted || !runMuted) {',
    },
  },
  {
    decision: '0645',
    suite: 'tests/title-menu.test.ts',
    // No title ever after the coda — the sound off under the ending — and the next run starts in silence.
    broke: 'a run after a coda with no title, starting without its music',
    guard: 'and with no title after it',
    edit: {
      path: 'src/app/music.ts',
      find: '          if (!runMuted) return;',
      replace: '          return;',
    },
  },
  {
    decision: '0645',
    suite: 'tests/title-menu.test.ts',
    // The ending opened on the floor, as the menu does: a drone waking up after the last boss.
    broke: 'an ending that opens without the theme',
    guard: 'THE ASK: the ending enters on the theme',
    edit: {
      path: 'src/content/title-track.ts',
      find: '  { bars: 16, rise: 2, parts: { drone: 0.32, pad: 0.45, bass: 1, heart: 1, arp: 0.8, lead: 1 } },',
      replace: '  { bars: 16, rise: 2, parts: { drone: 0.32, pad: 0.45, bass: 1, heart: 1, arp: 0.8 } },',
    },
  },
];
