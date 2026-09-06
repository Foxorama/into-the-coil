// The breaks behind docs/decisions/0266-a-death-throws-the-ladders-back.md.
//
// ⚠️ THIS DECISION IS THREE PROBES OF 0256's, INVERTED. That decision made a death cost one rung and
// throw nothing; every probe below breaks the code back into it, which is the honest shape for a
// rule that was reversed rather than extended — the thing to guard against is the version that
// shipped, and the version that shipped is the one the report is about.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0266',
    suite: 'tests/run.test.ts',
    /*
      ⚠️ 0256's RUNG PUT BACK, and it is the half of that decision the play named: *"in addition to
      reducing the power up total it also stopped the power ups spawning from a death."* A ship that
      keeps all but one rung through a death still reaches the scatter below — so this alone leaves
      the field looking almost right, and only the count on the ladder says otherwise. That is the
      whole reason it is a probe and not an eyes-on note.
    */
    broke: 'a death costing one rung and keeping the rest, which is what 0256 shipped',
    guard: 'a death takes both ladders and the kinds, and leaves the arsenal exactly where it was',
    edit: {
      path: 'src/state/slices/run.ts',
      // The twelve-space indent is what makes this the death's line and not `begin`'s or `continued`'s.
      find: '            upgrades: [],\n            // The base kinds come back',
      replace: '            upgrades: state.upgrades.slice(0, -1),\n            // The base kinds come back',
    },
  },
  {
    decision: '0266',
    suite: 'tests/run.test.ts',
    /*
      ⚠️ THE FLOOR PUT BACK — *"to a minimum of 1"*. A death that leaves the last rung on the ship
      leaves the scatter one piece short of what it took, and nothing in the picture says so: the
      badge on a ×3 piece reads the same whether the ladder it came off was three or four.
    */
    broke: 'the floor put back, so a ladder of one keeps its rung and the scatter is short',
    guard: 'and a ladder of one goes too, because the scatter is what hands it back',
    edit: {
      path: 'src/state/slices/run.ts',
      find: '            upgrades: [],\n            // The base kinds come back',
      replace: '            upgrades: state.upgrades.slice(0, 1),\n            // The base kinds come back',
    },
  },
  {
    decision: '0266',
    suite: 'tests/death.test.ts',
    /*
      ⚠️ THE SCATTER TAKEN OUT OF THE THROW, which is 0256's deletion in one line and the defect the
      report is actually about: the ladders still go, and nothing arrives where the ship died. Every
      other guard about a death is green over it — the life is spent, the beat runs, the burst draws,
      the run state is exactly right — which is what made it shippable in the first place.
    */
    broke: 'the scatter throwing nothing, so a death takes the ladders and hands back none of them',
    guard: 'throws the upgrades out of the wreck at the end of the beat',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (weapons > 0) scatterPiece(w, \'weapon\', weapons, index++, pieces);',
      replace: '  if (weapons > 0 && pieces < 0) scatterPiece(w, \'weapon\', weapons, index++, pieces);',
    },
  },
  {
    decision: '0266',
    suite: 'tests/stack.test.ts',
    /*
      ⚠️ THE COUNT DROPPED FROM THE THROW, so every piece is worth one rung — which is a death that
      costs three quarters of a full ladder and looks identical on the field. 0243's badge is the
      only thing that ever said otherwise, and it reads a field nothing would be writing.
    */
    broke: 'the stack dropped from a thrown piece, so a full ladder comes back as one rung',
    guard: 'THE STACK: a death throws one piece per kind',
    edit: {
      path: 'src/app/frame.ts',
      find: '  item.stack = stack;',
      replace: '  item.stack = 1;',
    },
  },
  {
    decision: '0266',
    suite: 'tests/pickups.test.ts',
    /*
      ⚠️ THE TWO STREAMS MADE ONE AGAIN — 0021. The scatter and the mid-boss's drop draw from one
      generator, so a level whose mid-boss died deals a different scatter from a level whose did not.
      Nothing about either throw is wrong on its own; what breaks is that one is now a function of
      the other, which is the coupling that decision exists to refuse and the reason a seeded run
      stops being reproducible from its own inputs.
    */
    broke: 'the scatter drawing on the drop’s stream, so a fight’s throw deals a death’s',
    guard: 'a death’s scatter is dealt from its own stream',
    edit: {
      path: 'src/app/frame.ts',
      find: '  throwArc(w, item, row, index, pieces, w.scatterRng);',
      replace: '  throwArc(w, item, row, index, pieces, w.dropRng);',
    },
  },
];
