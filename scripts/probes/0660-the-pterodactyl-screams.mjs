// The breaks behind docs/decisions/0660-the-pterodactyl-screams.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0660',
    suite: 'tests/quetzal.test.ts',
    // Every beam's zap again, whatever its row says.
    broke: 'a pterodactyl laser burning in every beam’s voice',
    guard: 'THE ASK, IN SECONDS: the charge sounds as the line appears',
    edit: {
      path: 'src/app/frame.ts',
      find: "  if (!Number.isNaN(ignited)) w.onCue(w.bossRow.zap ?? 'laserZap', ignited);",
      replace: "  if (!Number.isNaN(ignited)) w.onCue('laserZap', ignited);",
    },
  },
  {
    decision: '0660',
    suite: 'tests/quetzal.test.ts',
    // Its row's zap taken off: the machine's voice again.
    broke: 'the pterodactyl with no voice of its own',
    guard: '0625, 0660 — every laser charges and zaps',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    zap: 'pteroZap',\n",
      replace: '',
    },
  },
];
