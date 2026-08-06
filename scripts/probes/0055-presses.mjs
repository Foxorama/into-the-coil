// The breaks behind docs/decisions/0055-a-press-belongs-to-one-screen.md.
//
// ⚠️ Two reported bugs, and the first one's guard is the only one that reaches the actual defect.
// The seam is `src/app/mount.ts`: both readers can be individually correct about their own snapshots
// and the bomb still fires. So the last probe here is a BROWSER probe, and what it reddens is the
// number on the HUD rather than a count of edges inside a reader.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0055',
    suite: 'tests/pad.test.ts',
    /*
      ⚠️ THE REPORTED ONE, at the reader. A snapshot device cannot tell "held since before the run
      started" from "just pressed" — it only ever says down-now — so removing the one flag that
      carries that distinction restores the bomb that throws itself.
    */
    broke: 'the spend flag ignored, so a button held through a screen change is a fresh press',
    guard: 'THE BOMB: a button held through a screen change is not a fresh press',
    edit: {
      path: 'src/app/pad.ts',
      find: '          if (down && !wasDown[i] && !spending && i < intent.specials.length) {',
      replace: '          if (down && !wasDown[i] && i < intent.specials.length) {',
    },
  },
  {
    decision: '0055',
    suite: 'tests/pad.test.ts',
    // The fix wearing the bug's clothes: a latch that never lifts. The player's bomb works once at
    // the start of a run and never again, which is worse than the defect being fixed.
    broke: 'the spend flag never cleared, so every press after the screen change is swallowed too',
    guard: 'spends only the step it was asked for',
    edit: { path: 'src/app/pad.ts', find: '      spending = false;\n', replace: '' },
  },
  {
    decision: '0055',
    suite: 'tests/input.test.ts',
    // The half nobody reported, because `Space` both activates a focused <button> and fires
    // `special1`. A fix that only covered the pad would have left this exactly as it was.
    broke: 'the keyboard’s counted presses left undrained across a screen change',
    guard: 'THE BOMB: a press counted before a screen change is not delivered after it',
    edit: {
      path: 'src/app/input.ts',
      find: '      for (const action of ACTION_NAMES) pressed[action] = 0;',
      replace: '      void ACTION_NAMES;',
    },
  },
  {
    decision: '0055',
    suite: 'tests/devices.test.ts',
    // Which source is "first" is the order mount.ts happened to attach them in, which is the exact
    // property `combineDevices` exists to make irrelevant.
    broke: 'the combiner spending only its first source',
    guard: 'spends every source, not just the first',
    edit: {
      path: 'src/app/devices.ts',
      find: '      for (let i = 0; i < attached.length; i++) attached[i]?.spend();',
      replace: '      attached[0]?.spend();',
    },
  },
  {
    decision: '0055',
    suite: 'tests/menu.test.ts',
    /*
      ⚠️ The jerky flick. Dropping the reversal threshold to the deadzone is exactly the old rule —
      any direction that differs from the one held — and it reads as a simplification, because at a
      glance `PAD_DEADZONE` is already "the threshold this file uses".
    */
    broke: 'the reversal threshold dropped to the deadzone, so a spring past centre is a reversal',
    guard: 'moves the focus exactly once for one flick of the stick',
    edit: { path: 'src/app/menu.ts', find: 'export const MENU_REVERSE = 0.6;', replace: 'export const MENU_REVERSE = PAD_DEADZONE;' },
  },
  {
    decision: '0055',
    suite: 'tests/menu.browser.test.ts',
    /*
      ⚠️ THE ONE THAT REACHES THE DEFECT. Everything above proves a reader behaves; this proves the
      two readers are joined up. Removing the call leaves both unit halves green and puts the
      reported bug straight back on the screen — which is why the guard is the HUD's own number.
    */
    broke: 'the screen change no longer spending what the readers are holding',
    guard: 'starts a run without also throwing the bomb that button is bound to',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (moved) {\n      world.input.spend();\n      menuPad.spend();\n    }',
      replace: '    void menuPad;',
    },
  },
];
