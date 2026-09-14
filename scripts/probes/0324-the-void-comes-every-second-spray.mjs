// The void comes every second spray — docs/decisions/0324-the-void-comes-every-second-spray.md
//
// Every guard 0324 adds, broken on purpose. `node scripts/prove-guard.mjs 0324`.
//
// ⚠️ ONE EDIT AGAINST TWO GUARDS, WHICH IS THE POINT OF HAVING BOTH — 0323 has the same pair and the
// same argument. The table says the hurt phase grows a third head; the fight says the round the frame
// plays is spray, void, spray. A head written into the row and never reached would pass the first and
// fail the second, which is docs/decisions/0027-measure-the-picture-not-the-model.md in one line.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0324',
    suite: 'tests/serpent.test.ts',
    broke: 'the third head dropped, so the void is back behind every single spray',
    guard: 'THE REPORTED ONE: once hurt, the void lands on every SECOND spray',
    edit: {
      path: 'src/content/bosses.ts',
      // The two acid heads are the same line, so the list's own closing bracket is what makes this unique.
      find:
        "            { shot: 'acid', attack: { kind: 'sweep', from: Math.PI / 3, to: (11 * Math.PI) / 6, globes: 21, every: 3 }, cue: 'bossAcid', gap: 24 },\n" +
        '          ],',
      replace: '          ],',
    },
  },
  {
    decision: '0324',
    suite: 'tests/serpent.test.ts',
    broke: 'the same head dropped, read off the TABLE rather than out of the fight',
    guard: 'THE THREE WEAPONS: five globes of acid',
    edit: {
      path: 'src/content/bosses.ts',
      find:
        "            { shot: 'acid', attack: { kind: 'sweep', from: Math.PI / 3, to: (11 * Math.PI) / 6, globes: 21, every: 3 }, cue: 'bossAcid', gap: 24 },\n" +
        '          ],',
      replace: '          ],',
    },
  },
  {
    decision: '0324',
    suite: 'tests/serpent.test.ts',
    // The third head made a VOID instead of a spray: the void on two rounds in three rather than one in two.
    broke: 'the third head throwing void as well, so the wave is more of what was asked to be thinned',
    guard: 'THE REPORTED ONE: once hurt, the void lands on every SECOND spray',
    edit: {
      path: 'src/content/bosses.ts',
      find:
        "            { shot: 'acid', attack: { kind: 'sweep', from: Math.PI / 3, to: (11 * Math.PI) / 6, globes: 21, every: 3 }, cue: 'bossAcid', gap: 24 },\n" +
        '          ],',
      replace: "            { shot: 'void', attack: { kind: 'spray' }, cue: 'bossVoid' },\n          ],",
    },
  },
];
