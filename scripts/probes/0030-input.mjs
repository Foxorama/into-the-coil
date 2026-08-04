// The breaks behind docs/decisions/0030-input-is-actions-and-needs-no-new-layer.md.
//
// The two that matter are the ones a reviewer waves through, because the obvious implementation of
// each is the wrong one and it looks fine until the frame rate drops or a player leans on a key.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    // THE one. A boolean is the obvious model for "was the special pressed", it passes every casual
    // test, and it loses the second press only between two slow frames — when the player can least
    // afford it and is least able to tell what happened.
    decision: '0030',
    suite: 'tests/input.test.ts',
    broke: 'presses reported as a flag rather than a count, so a double-tap between steps fires once',
    guard: 'COUNTS two presses between steps, rather than reporting that at least one happened',
    edit: {
      path: 'src/app/input.ts',
      find: "    if (ACTIONS[action].kind === 'edge') pressed[action]++;",
      replace: "    if (ACTIONS[action].kind === 'edge') pressed[action] = 1;",
    },
  },
  {
    // The other half of the same fact: `keydown` repeats while a key is held, so counting every one
    // empties the arsenal at the OS's repeat rate. The two breaks pull in opposite directions, which
    // is why neither alone proves the code is right.
    decision: '0030',
    suite: 'tests/input.test.ts',
    broke: 'the key-repeat filter removed, so leaning on the special key fires it dozens of times',
    guard: 'fires a HELD special once, however many times the OS repeats the keydown',
    edit: {
      path: 'src/app/input.ts',
      find: '    if (held[action]) return;',
      replace: '    if (false) return;',
    },
  },
  {
    decision: '0030',
    suite: 'tests/input.test.ts',
    broke: 'presses left undrained, so one tap fires on every subsequent step forever',
    guard: 'drains, so a press is consumed exactly once',
    edit: {
      path: 'src/app/input.ts',
      find: '        pressed[action] = 0;',
      replace: '        pressed[action] += 0;',
    },
  },
  {
    // The seam 0030 exists for. A binding past the arsenal's budget must be dropped, not written
    // somewhere. The obvious `slot < length` omission corrupts the array instead of crashing.
    decision: '0030',
    suite: 'tests/input.test.ts',
    broke: 'the budget check dropped, so a binding past the arsenal writes past the intent',
    guard: 'THE SEAM: a binding past the budget is dropped, and the reachable ones are undisturbed',
    edit: {
      path: 'src/app/input.ts',
      find: '        if (slot !== null && slot < intent.specials.length) {',
      replace: '        if (slot !== null) {',
    },
  },
  {
    decision: '0030',
    suite: 'tests/input.test.ts',
    broke: 'blur no longer releasing held keys, so alt-tabbing leaves the ship flying by itself',
    guard: 'releases everything on blur, so alt-tab does not fly the ship into a wall',
    edit: {
      path: 'src/app/input.ts',
      find: '    for (const action of ACTION_NAMES) held[action] = false;\n  };',
      replace: '    return;\n  };',
    },
  },
  {
    decision: '0030',
    suite: 'tests/input.test.ts',
    broke: 'opposed directions resolved to a winner rather than to nothing',
    guard: 'reads both directions at once as nothing, not as a winner',
    edit: {
      path: 'src/app/input.ts',
      find: '  return (held[row.plus] ? 1 : 0) - (held[row.minus] ? 1 : 0);',
      replace: '  return held[row.plus] ? 1 : held[row.minus] ? -1 : 0;',
    },
  },
  {
    // The count that must never be written twice. A literal beside the table is the second
    // description that drifts the moment a third trigger is added.
    decision: '0030',
    suite: 'tests/input.test.ts',
    broke: 'the binding budget hand-written beside the table it describes',
    guard: 'SPECIAL_BINDINGS is derived from the table, never a literal beside it',
    edit: {
      path: 'src/content/actions.ts',
      find: "export const SPECIAL_BINDINGS: number = ACTION_NAMES.filter((a) => ACTIONS[a].kind === 'edge').length;",
      replace: 'export const SPECIAL_BINDINGS: number = 3;',
    },
  },
  {
    decision: '0030',
    suite: 'tests/input.test.ts',
    broke: 'a fire action admitted, which is the first step back toward a game about holding a button',
    guard: 'there is no fire action, and auto-fire is why',
    edit: {
      path: 'src/content/actions.ts',
      find: "  special1: { kind: 'edge', sign: null, slot: 0, label: 'Special 1' },",
      replace:
        "  fire: { kind: 'edge', sign: null, slot: 0, label: 'Fire' },\n" +
        "  special1: { kind: 'edge', sign: null, slot: 0, label: 'Special 1' },",
    },
  },
  {
    decision: '0030',
    suite: 'tests/input.test.ts',
    broke: 'bindings written as key VALUES, which move under a player on a non-QWERTY layout',
    guard: 'binds physical positions, not printed letters, so a non-QWERTY layout keeps the shape',
    edit: {
      path: 'src/content/actions.ts',
      find: "  alongPlus: ['KeyD', 'ArrowRight'],",
      replace: "  alongPlus: ['d', 'ArrowRight'],",
    },
  },
];
