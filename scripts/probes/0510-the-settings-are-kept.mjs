// The breaks behind docs/decisions/0510-the-settings-are-kept.md.
//
// ⚠️ The settings are the second thing the game keeps, so the breaks that matter are the ones that
// ship a wrong document to a player: one that keeps the pilot asked to be picked each visit, one that
// trusts a value the game no longer has, one that reads another version's shape as its own, and one
// that throws when the browser refuses a write.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0510',
    suite: 'tests/settings-kept.test.ts',
    broke: 'the pilot written to the key, against "pick each visit"',
    guard: 'the pilot is not kept',
    edit: {
      path: 'src/save/settings.ts',
      find: '    credits: settings.credits,\n  };',
      replace: '    credits: settings.credits,\n    pilot: settings.pilot,\n  };',
    },
  },
  {
    decision: '0510',
    suite: 'tests/settings-kept.test.ts',
    broke: 'a look the game no longer has, trusted and handed to the shell',
    guard: 'one setting the game no longer has costs that setting',
    edit: {
      path: 'src/save/settings.ts',
      find: '  return kinds.find((k) => k === raw) ?? fallback;',
      replace: '  return (typeof raw === "string" ? raw : fallback) as K;',
    },
  },
  {
    decision: '0510',
    suite: 'tests/settings-kept.test.ts',
    broke: 'another version’s document read as this one’s shape',
    guard: 'a document it cannot trust is the defaults',
    edit: {
      path: 'src/save/settings.ts',
      find: '  if (doc.v !== SETTINGS_VERSION) return base;',
      replace: '',
    },
  },
  {
    decision: '0510',
    suite: 'tests/settings-kept.test.ts',
    broke: 'a refused write thrown up into the press that made it',
    guard: 'a store that refuses the write',
    edit: {
      path: 'src/save/settings.ts',
      find: '    store.setItem(SETTINGS_KEY, serialiseSettings(settings));\n  } catch {',
      replace: '    store.setItem(SETTINGS_KEY, serialiseSettings(settings));\n  } finally {',
    },
  },
  {
    // 0570: the browser test's reload line had never been seen red on purpose, only by accident.
    decision: '0510',
    suite: 'tests/settings-kept.browser.test.ts',
    broke: 'the page booting on every kept setting but the crossing',
    guard: 'a band pressed is written for the next visit',
    edit: {
      path: 'src/app/mount.ts',
      find: '    settings: readSettings(keptStore, initialState.settings),',
      replace: '    settings: { ...readSettings(keptStore, initialState.settings), travel: initialState.settings.travel },',
    },
  },
];
