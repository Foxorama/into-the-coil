// The serpent sprays — docs/decisions/0304-the-serpent-sprays.md
//
// Every guard 0304 adds, broken on purpose. `node scripts/prove-guard.mjs 0304`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0304',
    suite: 'tests/serpent.test.ts',
    // The state of `main` before this decision, as far as the count goes: the phase's three.
    broke: 'the arc of five cut back to three, so the opening never fills in',
    guard: 'whole, it throws a forward arc',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0308, which gave the opening phase a cue of its own.
      /*
        ⚠️ **AND BY 0322, ONTO THE SECOND PHASE, WHICH IS WHERE THE FIVE WENT.** The opening is two phases
        now — three globes while whole and five a fifth down — so *the arc of five* is the row below the
        one this used to name. 0322's own probe breaks the other half, the three; between them the pair
        the report asked for is held from both ends.
      */
      find: "      { upTo: 0.78, fireEvery: 72, shots: 5, spread: 0.9, patrolScale: 1.15, stance: { kind: 'volley' }, look: null, shot: null, attack: null, cue: 'bossAcid' },",
      replace: "      { upTo: 0.78, fireEvery: 72, shots: 3, spread: 0.9, patrolScale: 1.15, stance: { kind: 'volley' }, look: null, shot: null, attack: null, cue: 'bossAcid' },",
    },
  },
  {
    decision: '0304',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ AND THE OTHER HALF OF *FORWARD*: the right count, turning a little every volley — the rake
      0261 gave this opening and 0290 kept. Five globes that sweep across the lane are a different
      thing to dodge from five that come straight at the player, and a count alone cannot see it.
    */
    broke: 'the opening arc raking again, so the globes turn rather than coming straight ahead',
    guard: 'whole, it throws a forward arc',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    attack: { kind: 'spray' },\n    uncoil: null,\n    fall: null,\n    chill: null,\n    sprite: SPRITE.boss8,",
      replace: "    attack: { kind: 'rake', turn: 0.45 },\n    uncoil: null,\n    fall: null,\n    chill: null,\n    sprite: SPRITE.boss8,",
    },
  },
  {
    decision: '0304',
    suite: 'tests/serpent.test.ts',
    // The spray thrown on its first step and never continued: one globe, which is a shot and not a spray.
    broke: 'the spray never continued past its first step, so it is one globe',
    guard: 'once hurt, the acid is a SPRAY',
    edit: {
      path: 'src/app/boss.ts',
      find: '  if (boss.sprayLeft > 0) spray(boss, row, shots, tier, scrollPerStep);\n',
      replace: '',
    },
  },
  {
    decision: '0304',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ THE STREAM WITH NO TURN IN IT. Every count the spray guard reads is still met — twenty-one
      globes over a second, from the mouth — and they all go the same way: a hose held still, which
      is a line of bullets and not *arcing around*.
    */
    broke: 'the spray’s aim never turning, so twenty-one globes leave on one heading',
    guard: 'once hurt, the acid is a SPRAY',
    edit: {
      path: 'src/app/boss.ts',
      find: '  boss.sprayLeft--;\n  boss.sprayAngle += boss.sprayTurn;\n',
      replace: '  boss.sprayLeft--;\n',
    },
  },
  {
    decision: '0304',
    suite: 'tests/serpent.test.ts',
    // The jaw shut while the stream is still coming out of it — 0036, at the face.
    broke: 'the jaw no longer held open through the spray',
    guard: 'once hurt, the acid is a SPRAY',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (boss.fireIn <= FACE_GAPE || boss.sprayLeft > 0) {',
      replace: '  if (boss.fireIn <= FACE_GAPE) {',
    },
  },
  /*
    ── THE GATE-THAT-DOES-NOT-WAIT PROBE IS RETIRED — 0311 TOOK ITS CASE AWAY ──────────────────────

    ⚠️ **IT BROKE `if (boss.fireIn < until) boss.fireIn = until;` AND THE SUITE STAYED GREEN.** Its own
    note said the case lived at *"the hardest tier's last third: the cadence is eighteen, a round of
    three is fifty-four, and the next spray starts over the last one"*. 0311 made that round the ball
    and the lightning, so the only spray left is the hurt phase's — and measured at every tier:

    | phase | tier | round | spray |
    |---|---|---|---|
    | hurt | legendary | 120 | 60 |
    | hurt | savior | 96 | 60 |
    | hurt | **burn** | **60** | **60** |

    **No overlap anywhere**, and the equality is safe by construction rather than by luck: `stepBoss`
    throws a spray in progress its next globe BEFORE the gate, so on the step a round comes back round
    the spray's last globe has already left.

    ⚠️ **THE LINE STAYS AND THE PROBE GOES, WHICH IS THE HONEST PAIR.** The mechanism is still right, and
    the next phase carrying a spray longer than its own round re-arms it; what cannot be claimed today is
    that anything proves it. A probe left here reporting STILL GREEN is
    `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`'s own subject wearing a green tick, and one
    that shortened the cadence as well would be proving the cadence rather than the wait.
  */
  /*
    ── ⚠️ AND THE ESCALATION PROBE IS RETIRED — 0322 ───────────────────────────────────────────────

    It cut the spray to three globes so that *the phase after the arc of five throws less* would redden
    `tests/level.test.ts`'s **every phase is reachable, and they only get harder** — a clause that
    compared the biggest volley each phase throws. **That clause is a taste now** (`0322-volley` in
    `tests/authored.ts`): it had been re-fitted twice to keep one table green, and a taste cannot fail a
    suite, so this probe would report STILL GREEN — which is
    `docs/decisions/0019-a-probe-must-be-seen-to-apply.md`'s own subject wearing a green tick.

    **What 0304's claim rests on instead is the two probes above**, which are about the arc the report
    asked for rather than about its rank among the other phases. The decision that demoted the clause has
    the argument; nothing here is weakened to suit it.
  */
];
