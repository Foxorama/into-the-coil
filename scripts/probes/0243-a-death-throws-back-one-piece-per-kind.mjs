// A death throws back one piece per kind — docs/decisions/0243-a-death-throws-back-one-piece-per-kind.md
//
// Every guard 0243 adds, broken on purpose. `node scripts/prove-guard.mjs 0243`.

export const PROBES = [
  {
    decision: '0243',
    suite: 'tests/stack.test.ts',
    // The count dropped: one piece per kind, worth one rung — a death that keeps most of what it took.
    broke: 'a scattered piece worth one rung whatever the death took',
    guard: 'THE STACK: a death throws one piece per kind',
    edit: {
      path: 'src/app/frame.ts',
      find: '  item.stack = stack;',
      replace: '  item.stack = 1;',
    },
  },
  {
    decision: '0243',
    suite: 'tests/stack.test.ts',
    // The piece cycling again, which is 0233's picture and the one the report could not grab under fire.
    broke: 'a scattered piece turning its faces again while it waits',
    guard: 'a scattered piece holds its face',
    edit: {
      path: 'src/app/frame.ts',
      find: '  item.faceIn = 0;\n',
      replace: '',
    },
  },
  {
    decision: '0243',
    suite: 'tests/stack.test.ts',
    // The reducer hearing the count and giving one rung anyway.
    broke: 'the reducer granting one rung whatever count the pickup carried',
    guard: 'taking it hands back every rung',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '      const count = action.count === undefined || action.count < 1 ? 1 : action.count;',
      replace: '      const count = 1;',
    },
  },
  {
    decision: '0243',
    suite: 'tests/stack.test.ts',
    // The badge never painted: a stacked piece drawn as a plain one, so the count is invisible.
    broke: 'the badge never painted, so a stacked piece looks worth one',
    guard: 'THE BADGE: a stacked piece is drawn with its count',
    edit: {
      path: 'src/app/frame.ts',
      find: '    paintStacks(w.surface, w.view, w.pickups, STACK_BADGES, camera, alpha);',
      replace: '    void STACK_BADGES;',
    },
  },
];
