// The breaks behind docs/decisions/0664-the-controls-are-bound.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0664',
    suite: 'tests/settings-kept.test.ts',
    // The bindings never written, so every visit opens on the defaults.
    broke: 'the bindings not kept',
    guard: 'THE ASK: *"make sure it saves properly"*',
    edit: { path: 'src/save/settings.ts', find: '    keys: keysFrom(doc.keys, base.keys),', replace: '    keys: base.keys,' },
  },
  {
    decision: '0664',
    suite: 'tests/settings-kept.test.ts',
    // A saved binding taken whatever it says.
    broke: 'a forged binding read as it stands',
    guard: 'a forged or broken binding reads as the defaults, whole',
    edit: {
      path: 'src/save/settings.ts',
      find: "      if (typeof code !== 'string' || !KEY_CODE.test(code) || RESERVED_KEYS.includes(code) || seen.includes(code)) return fallback;",
      replace: "      if (typeof code !== 'string') return fallback;",
    },
  },
  {
    decision: '0664',
    suite: 'tests/settings-kept.test.ts',
    // A key taken from another action and nothing given back.
    broke: 'a binding that leaves an action with no key',
    guard: 'a key taken from another action leaves it what the rebound one had',
    edit: { path: 'src/content/actions.ts', find: '    next[other] = kept.length > 0 ? kept : before;', replace: '    next[other] = kept;' },
  },
  {
    decision: '0664',
    suite: 'tests/controls.test.ts',
    // The keyboard bound once, at attach, and never again.
    broke: 'the keyboard deaf to a rebinding',
    guard: 'THE ASK: the keyboard throws the first trigger on the key it was bound to',
    edit: { path: 'src/app/input.ts', find: '      byCode = indexBindings(next);\n', replace: '' },
  },
  {
    decision: '0664',
    suite: 'tests/controls.test.ts',
    // The pad on its old buttons whatever it is told.
    broke: 'the pad deaf to its bindings',
    guard: 'the pad throws a trigger on the button its binding says',
    edit: { path: 'src/app/pad.ts', find: '          const button = pad.buttons[buttons[i] ?? -1];', replace: '          const button = pad.buttons[PAD_SPECIAL_BUTTONS[i] ?? -1];' },
  },
  {
    decision: '0664',
    suite: 'tests/controls.browser.test.ts',
    // A press on the tab heard by the menu too: the key the tab binds also steps or backs out.
    broke: 'the Controls tab listening, and binding nothing',
    guard: 'THE ASK: a key and a pad button bound on the Controls tab',
    edit: { path: 'src/app/mount.ts', find: "    dispatch({ slice: 'settings', type: 'key', action: row.action, code: e.code });\n", replace: '' },
  },
];
