// The attacks are heard — docs/decisions/0308-the-attacks-are-heard.md
//
// Every guard 0308 adds, broken on purpose. `node scripts/prove-guard.mjs 0308`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0308',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE STATE OF `main`: one sound for three attacks. The acid head and the void head naming the
      same cue is exactly what the fight did before this decision, and it is the thing the report was
      about — *"sounds for ALL the attacks"*.
    */
    broke: 'the void head sounding like the acid head, so two of the three attacks are one noise',
    guard: 'THE REPORTED ONE: the acid, the void and the lightning are three different sounds',
    edit: {
      path: 'src/content/bosses.ts',
      find: "            { shot: 'void', attack: { kind: 'spray' }, cue: 'bossVoid' },\n" +
        '            /*\n',
      replace: "            { shot: 'void', attack: { kind: 'spray' }, cue: 'bossAcid' },\n" +
        '            /*\n',
    },
  },
  {
    decision: '0308',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ AND THE OTHER DIRECTION: a head that names nothing falls back to the crash every boss shares,
      which is the default `src/app/boss.ts` holds. That is correct for thirteen bosses and is the
      defect on this one, and only a guard that reads the rows can tell the two apart.
    */
    broke: 'the lightning head naming no cue, so it falls back to the crash every boss shares',
    guard: 'THE REPORTED ONE: the acid, the void and the lightning are three different sounds',
    edit: {
      path: 'src/content/bosses.ts',
      find: "            { shot: 'void', attack: { kind: 'rain', warning: 45, halfWidth: 4 }, cue: 'bossBolt' },",
      replace: "            { shot: 'void', attack: { kind: 'rain', warning: 45, halfWidth: 4 } },",
    },
  },
  {
    decision: '0308',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE SMEAR 0114 NAMED, REBUILT. The cue back at the fire gate AS WELL as inside the throw: two
      cues on one step for one volley, which spends half the per-step voice budget (0104) on saying one
      thing twice. It is the shape the move to `throwAttack` had to be measured against, because *one
      per volley* stopped being true by construction the moment `heads` could recurse into a second one.
    */
    broke: 'the crash put back at the fire gate as well, so a volley sounds twice',
    guard: 'and a VOLLEY still makes exactly one sound, however many bullets are in it',
    edit: {
      path: 'src/app/boss.ts',
      find: '  boss.fireIn = fireGapFor(phase.fireEvery, tier);\n',
      replace: "  onCue('bossShot', boss.across);\n  boss.fireIn = fireGapFor(phase.fireEvery, tier);\n",
    },
  },
  {
    decision: '0308',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ AND A CUE PER GLOBE, WHICH IS THE ONE ATTACK THAT CAN DO IT. A sweep throws twenty-one globes
      over a second from `stepBoss`; a cue beside each is twenty-one crashes for one attack.
    */
    broke: 'a cue on every globe of the sweep, so one attack sounds twenty-one times',
    guard: 'and the SPRAY it leaves behind does not sound again, because it is one attack',
    edit: {
      path: 'src/app/boss.ts',
      find: '  if (boss.sprayLeft > 0) spray(boss, row, shots, tier, scrollPerStep);',
      replace: "  if (boss.sprayLeft > 0) {\n    onCue('bossAcid', boss.across);\n    spray(boss, row, shots, tier, scrollPerStep);\n  }",
    },
  },
  {
    decision: '0308',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE DUCK RULE'S NEW AXIS, FROM THE SIDE IT WAS WIDENED FOR. A boss's attack ducking the bed is
      what the old rule demanded of any cue over a beat — and the serpent's last phase fires every 0.6 s
      against a duck that takes 0.445 s to recover, so the bed never comes back. `fired` is what the
      guard reads, and without it this edit is the state the rule used to insist on.
    */
    broke: 'the acid ducking the music, which holds the bed down for the whole last phase',
    guard: '0104 — and the gun never ducks, whatever it is doing',
    edit: {
      path: 'src/content/cues.ts',
      find: "  bossAcid: {\n    twin: 'threat-appears',\n    air: 0.3,",
      replace: "  bossAcid: {\n    twin: 'threat-appears',\n    duck: 0.3,\n    air: 0.3,",
    },
  },
  {
    decision: '0308',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ AND THE SCAN THAT COULD NOT SEE A CUE CHOSEN BY A ROW. The old pattern matched a literal name
      or `cueOfFlight(…)` and nothing else, so `onCue(cue ?? 'bossShot', boss.across)` was neither an
      offender nor checked. Taking the place off it has to go red now; against the pattern this replaces
      it went green.
    */
    broke: 'the boss’s volley firing its cue with no place, which the old pattern could not see',
    guard: 'EVERY CUE THE GAME FIRES SAYS WHERE IT HAPPENED, and the one that cannot is named',
    edit: {
      path: 'src/app/boss.ts',
      find: "  if (attack.kind !== 'heads') onCue(cue ?? 'bossShot', boss.across);",
      replace: "  if (attack.kind !== 'heads') onCue(cue ?? 'bossShot');",
    },
  },
  {
    decision: '0308',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ AND THE DECAY, ON THE WUMMS. Three bass pulses a quarter-second apart are the one figure in the
      table that could be LOUDER at its end than at its start — the guard compares the mean of the last
      quarter against the first — and the thing that keeps it falling is that each wumm is quieter than
      the one before. Levelling the third with the first is a machine running rather than an animal
      doing something, and it is what a hand reaching for *make the wumms bigger* would try.
    */
    broke: 'the third wumm as loud as the first, so the figure does not fall away',
    guard: 'starts and ends at zero, because a buffer that stops mid-waveform clicks',
    edit: {
      path: 'src/content/cues.ts',
      find:
        "      { wave: 'sine', from: inKey(2), to: inKey(-7), at: 0.5, seconds: 0.46, gain: 0.75, attack: 0.012, curve: 2.9, drive: 0.5, lowFrom: 620, lowTo: 80, q: 2.7 },",
      replace:
        "      { wave: 'sine', from: inKey(2), to: inKey(-7), at: 0.5, seconds: 0.46, gain: 1.35, attack: 0.012, curve: 1.2, drive: 0.5, lowFrom: 620, lowTo: 80, q: 2.7 },",
    },
  },
];
