// The serpent is shorter — docs/decisions/0365-the-serpent-is-shorter.md
//
// Every guard 0365 adds, broken on purpose. `node scripts/prove-guard.mjs 0365`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0365',
    suite: 'tests/serpent.test.ts',
    // The state of `main` before this decision: the last phase's round is a ball and a strike to the end.
    broke: 'the serpent’s last round authored without `grow`, so the ball never comes round more often',
    guard: 'every tenth under that adds one more ball',
    edit: {
      path: 'src/content/bosses.ts',
      find: '          grow: { every: 0.1, head: 0 },\n',
      replace: '',
    },
  },
  {
    decision: '0365',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **AND THE MECHANISM, WITH THE ROW LEFT AS AUTHORED.** A round that reads `grow` and never widens
      is the half the content break cannot see — the row would say *more balls* and the fight would not.
    */
    broke: 'the round’s extra slots never counted, so `grow` is read and does nothing',
    guard: 'every tenth under that adds one more ball',
    edit: {
      path: 'src/app/boss.ts',
      find: '      const n = attack.heads.length + extra;',
      replace: '      const n = attack.heads.length;',
    },
  },
];
