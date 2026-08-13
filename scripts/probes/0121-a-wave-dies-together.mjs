// The breaks behind docs/decisions/0121-a-wave-dies-together.md.
//
// ⚠️ THE GAP IS SQUEEZED FROM BOTH SIDES AND THESE ARE THE TWO SIDES. Above it, the volley: a wave
// wider than the fan dies one member at a time, which is the report. Below it, the widest hurtbox:
// neighbours that touch are docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md
// being spent. 8 was the first answer and the lower guard refused it, which is why both exist.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0121',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE REPORTED STATE, PUT BACK. At 11 a line of three spans 22 against a volley 19.75 wide at
      the distance a wave is engaged — so a trigger pull reaches two, and the drum
      `docs/decisions/0109-a-death-is-a-drum.md` fires is struck twice instead of five times. *"When
      they're spread far apart the music beats have less impact"* is a description of this number.
    */
    broke: 'the wave spread back to where a volley reaches two of it',
    guard: 'THE REPORTED ONE: a volley reaches three abreast, where it used to reach two',
    edit: {
      path: 'src/content/formations.ts',
      // Re-pointed by 0143: the constant became a function of the wave's own body, and the widest
      // enemy still resolves to 9 — so this puts the SPREAD back without restoring a constant.
      find: '  return radius * 2 + CLEAR_AIR;',
      replace: '  return 11;',
    },
  },
  {
    decision: '0121',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE OTHER END, AND IT CAUGHT THE FIRST ANSWER TO THIS DECISION. 8 puts the widest bodies —
      radius 4 — exactly edge to edge, and the comment the change replaced still said the widest
      hurtbox was 3.7. Driven off `ENEMIES` rather than a typed number, so the bound moves when a body
      does instead of quietly ceasing to be true.
    */
    broke: 'the gap tightened to where the widest bodies touch, which is legibility spent for density',
    guard: 'and they still do not overlap, which is what stops it going tighter',
    edit: {
      path: 'src/content/formations.ts',
      // Re-pointed by 0143. Taking the clear air out is what makes the widest bodies touch, and it
      // is now the same edit for every wave rather than one number for all of them.
      find: '  return radius * 2 + CLEAR_AIR;',
      replace: '  return radius * 2;',
    },
  },
  {
    decision: '0121',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE ALONG AXIS, WHICH IS THE SAME REPORT FROM THE OTHER DIRECTION. A column that takes longer
      than two bars to pass is five separate drum hits spread across the music rather than a fill
      inside it — so a `column` and a `vee` would go on answering the report the way they always did
      while a `line` improved.
    */
    /*
      ⚠️ THE PROBE THAT FOUND THE CHANGE WAS WRONG. Its first version stretched the column to 26 and
      reported STILL GREEN against a guard asking whether five passed inside two bars — true at 26,
      true at the 10 this decision briefly used, true at everything. A bound nothing is near.

      ⚠️ WHAT REPLACED IT IS THE BEAT, and it fires in BOTH directions: 10 is 0.69 beats and 20 is
      1.39, and a column's kills have to land on the grid every other cadence in the game is on.
    */
    broke: 'the column tightened off the beat, so consecutive kills land nowhere the music is counting',
    guard: 'THE ONE THAT SAID THE ALONG AXIS WAS ALREADY RIGHT: a column arrives a beat at a time',
    edit: {
      path: 'src/content/formations.ts',
      find: 'const ALONG_GAP = 14;',
      replace: 'const ALONG_GAP = 10;',
    },
  },
];
