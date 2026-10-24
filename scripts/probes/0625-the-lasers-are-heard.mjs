// The breaks behind docs/decisions/0625-the-lasers-are-heard.md.
//
// ⚠️ A laser charges as its line is drawn and zaps as it burns, once a volley. Each half is its own line, and a
// warning cue that decayed would pass every other guard in tests/sound.test.ts.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0625',
    suite: 'tests/quetzal.test.ts',
    broke: 'a laser crashing as every other volley does, as before the ask',
    guard: 'THE ASK, IN SECONDS: the charge sounds as the line appears',
    edit: {
      path: 'src/app/boss.ts',
      find: "onCue(cue ?? (attack.kind === 'beam' ? 'laserCharge' : 'bossShot'), boss.across);",
      replace: "onCue(cue ?? 'bossShot', boss.across);",
    },
  },
  {
    decision: '0625',
    suite: 'tests/quetzal.test.ts',
    broke: 'a laser that burns in silence',
    guard: 'THE ASK, IN SECONDS: the charge sounds as the line appears',
    edit: {
      path: 'src/app/frame.ts',
      // Re-anchored by 0660, which reads the row's own zap first.
      find: "  if (!Number.isNaN(ignited)) w.onCue(w.bossRow.zap ?? 'laserZap', ignited);",
      replace: '  void ignited;',
    },
  },
  {
    decision: '0625',
    suite: 'tests/quetzal.test.ts',
    broke: 'the zap heard a step before the beam burns',
    guard: 'THE ASK, IN SECONDS: the charge sounds as the line appears',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (alive && b.lifeFor === b.holdFor && b.holdFor > 0 && Number.isNaN(ignited)) ignited = b.across;',
      replace: '    if (alive && b.lifeFor === b.holdFor + 1 && b.holdFor > 0 && Number.isNaN(ignited)) ignited = b.across;',
    },
  },
  {
    decision: '0625',
    suite: 'tests/sound.test.ts',
    broke: 'the charge decaying through its warning instead of building',
    guard: 'starts and ends at zero',
    edit: {
      path: 'src/content/cues.ts',
      find: "      { wave: 'sine', from: inKey(14), to: inKey(28), seconds: 0.42, gain: 0.5, attack: 0.3, curve: 0.4, release: 0.06, vibrato: 18 },",
      replace: "      { wave: 'sine', from: inKey(14), to: inKey(28), seconds: 0.42, gain: 0.5, attack: 0.005, curve: 6, release: 0.06, vibrato: 18 },",
    },
  },
];
