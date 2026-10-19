// The breaks behind docs/decisions/0642-a-load-can-be-undone.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0642',
    suite: 'tests/backup.test.ts',
    // The copy written and its answer ignored: a full store loads the new save with nothing to undo it to.
    broke: 'a load that goes ahead when the save it replaces could not be put aside',
    guard: 'refuses the load when the save it replaces cannot be put aside',
    edit: {
      path: 'src/save/backup.ts',
      find: '  if (replaced !== null && !keepUndo(store, replaced, at)) return false;',
      replace: '  if (replaced !== null) keepUndo(store, replaced, at);',
    },
  },
  {
    decision: '0642',
    suite: 'tests/backup.test.ts',
    // The comparison turned round: the warning names what a load gains, and says nothing over a loss.
    broke: 'a warning that counts what a load gains as what it loses',
    guard: 'says what a load would lose, and nothing for one that loses nothing',
    edit: {
      path: 'src/save/backup.ts',
      find: '    if (get < have) out.push(',
      replace: '    if (get > have) out.push(',
    },
  },
  {
    decision: '0642',
    suite: 'tests/save.browser.test.ts',
    // The shell loading without handing over what it replaces: the format can keep an undo, and is never asked to.
    broke: 'a page that loads a save without putting the one it replaces aside',
    guard: 'saves the page as a file, and loads a file, a code and a link in its place',
    edit: {
      path: 'src/app/mount.ts',
      find: '      if (writeKept(keptStore, read.kept, here, Date.now())) location.reload();',
      replace: '      if (writeKept(keptStore, read.kept)) location.reload();',
    },
  },
];
