// The hydra grows heads — docs/decisions/0254-the-hydra-grows-heads.md
//
// Every guard 0254 adds, broken on purpose. `node scripts/prove-guard.mjs 0254`.

export const PROBES = [
  {
    decision: '0254',
    suite: 'tests/hydra.test.ts',
    // The turn never advanced: the first head throws every volley and the others are a table.
    broke: 'the turn never advanced, so the first head throws every volley',
    guard: 'THE HEADS TAKE TURNS, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      // ⚠️ Re-anchored by 0261, which moved the round's count off `firePhase` — that field is an
      // angle for a rake, and the serpent is the first boss to rake AND grow heads. And by 0308, which
      // put a comment between the two lines: the increment alone is unique and is the thing dropped.
      find: '      boss.headAt++;\n',
      replace: '',
    },
  },
  {
    decision: '0254',
    suite: 'tests/hydra.test.ts',
    // A head's shot ignored: every head throws the row's acid.
    broke: 'a head’s shot ignored, so every head throws the row’s acid',
    guard: 'THE HEADS TAKE TURNS, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      /*
        ⚠️ Re-anchored by 0263, which put a shot's kind on the shot — and again by 0277, which threads
        the row through for `row.muzzle`, and again by 0308, which threads the head's own cue. What it
        breaks is unchanged: a head throwing the ROW's shot. And by 0365, which threads the bar's
        fraction for a round that grows.
      */
      // And by 0380, which threads the breaker's own stream, and by 0384, which threads the mouths.
      find:
        '      throwAttack(head.attack, SHOTS[head.shot], SHOT_INDEX[head.shot], boss, row, phase, fraction, tier, ship, shots, cameraAlong, scrollPerStep, bolts, rainRng, breakerRng, onCue, head.cue, mouths);',
      replace:
        '      throwAttack(head.attack, bullet, kind, boss, row, phase, fraction, tier, ship, shots, cameraAlong, scrollPerStep, bolts, rainRng, breakerRng, onCue, head.cue, mouths);',
    },
  },
  {
    decision: '0254',
    suite: 'tests/hydra.test.ts',
    // The round not going round: the sixth volley has no head.
    broke: 'the round not going round, so the sixth volley has no head to throw',
    guard: 'THE HEADS TAKE TURNS, DRIVEN',
    edit: {
      path: 'src/app/boss.ts',
      // Re-anchored by 0365, which counts a slot before it picks a head, so a round can grow.
      find: '      const slot = ((boss.headAt % n) + n) % n;',
      replace: '      const slot = Math.min(boss.headAt, n - 1);',
    },
  },
  {
    decision: '0254',
    suite: 'tests/hydra.test.ts',
    // The second phase authored with one head: the flame is never grown.
    broke: 'the 80% phase authored with the first head only, so the flame is never grown',
    guard: 'THE FIVE HEADS: a head a fifth',
    edit: {
      path: 'src/content/bosses.ts',
      find: "        attack: { kind: 'heads', heads: [{ shot: 'acid', attack: { kind: 'spray' } }, { shot: 'flame', attack: { kind: 'spray' } }] },",
      replace: "        attack: { kind: 'heads', heads: [{ shot: 'acid', attack: { kind: 'spray' } }] },",
    },
  },
  /*
    ── *THE LASER HEAD'S BEAM AUTHORED FROM THE MIDDLE OF THE HULL* STOOD HERE, AND 0384 RETIRED IT ──

    It broke `from: [-9]`, the offset that put 0254's laser on the side of a hull whose heads were all
    inside its outline. The heads are drawn on their own necks now and every head's attack leaves its
    own mouth, so the laser's root is the pterodactyl's mouth and `from` is nought. The claim that
    replaced *THE LASER HEAD* is 0384's — *every head's attack leaves its own mouth* — with its own probe.
  */
];
