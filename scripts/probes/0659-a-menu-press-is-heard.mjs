// The break behind docs/decisions/0659-a-menu-press-is-heard.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0659',
    suite: 'tests/sound.browser.test.ts',
    // The menus silent again.
    broke: 'a press on a menu button that makes no sound',
    guard: '0659 — THE ASK: a press on a menu’s button is heard',
    edit: {
      path: 'src/app/mount.ts',
      find: "    if (screen !== 'splash' && audioOut.ready()) speaker.play('confirm');\n",
      replace: '',
    },
  },
];
