// The breaks behind docs/decisions/0058-a-level-boundary-keeps-the-shell.md.
//
// ── ALL FOUR WERE RE-ANCHORED BY 0076, AND TWO OF THEM STOPPED EXISTING ─────────────────────────
//
// ⚠️ 0058's RULE is unchanged and still guarded: *the shell crosses a level boundary because the ship
// does, and it does not cross a run.* What changed is that it is no longer true by ARITHMETIC.
//
// The mechanism 0058 built was `const shields = keepShell ? shieldsOf(...) : 0` around a
// `resetScene` that respawns the ship — read the count out, put a bare hull back, add the count on.
// `docs/decisions/0076-a-level-has-an-origin.md` stopped the boundary respawning anything at all, so
// there is no hull to put back and nothing to carry: the shell survives because the ship never
// leaves.
//
// Two of the original four probes were about that arithmetic — *"carried as a flag rather than as a
// count, so one shield arrives as three"* and *"the carry allowed past what the ship can wear"* — and
// there is no longer a line to break. They are gone rather than reworded, which is the same call
// `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md` made when it deleted a
// sprite guard: a probe standing over an expression that does not exist is the appearance of proof,
// and `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` exists to refuse exactly that.
//
// Their two GUARDS stay in `tests/shields.test.ts`, because what they assert is still a fact about
// the boundary — a partial shell arrives partial, and a full one does not overflow. They are now
// facts nothing has to compute, which is the ladder working.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0058',
    suite: 'tests/shields.test.ts',
    /*
      ⚠️ THE REPORTED ONE — *"shields don't carry forward between levels"* — restored by the shortest
      route there is now: put the respawn back. It is the same break 0076's first probe makes, and it
      reddens both decisions' guards, which is the honest signal that they have become one mechanism.
    */
    broke: 'the level boundary putting a bare hull back, so the shell is lost between levels',
    guard: 'carries every shield into the next level',
    edit: {
      path: 'src/app/frame.ts',
      // Re-anchored when the shared reset was extracted; the break is still *the boundary respawns*.
      find: '  w.levelOrigin = w.cameraAlong;\n  beginScript(w);',
      replace: '  w.levelOrigin = w.cameraAlong;\n  beginScript(w);\n  respawn(w);',
    },
  },
  {
    decision: '0058',
    suite: 'tests/shields.test.ts',
    /*
      ⚠️ THE HALF THAT COULD LEAK, and the one 0058 records a STILL GREEN against when it was an
      ordering rather than a stated difference. A run beginning must not open wearing the last run's
      shell — so the break is the two paths collapsing back into one, with `begin` given the seamless
      one.
    */
    broke: 'the two paths collapsed into one, so a new run opens wearing the last run’s shell',
    guard: 'cannot carry one into a NEW run',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ The two functions merged, which is the tidy-up somebody would actually reach for once
      // they look similar. `startLevel` is the one that must sweep; giving it the seamless body
      // hands a new run the last one's armour.
      find: '  w.level = level;\n  w.bossRow = BOSSES[level.boss];\n  resetScene(w);\n}',
      replace: '  advanceLevel(w, level);\n}',
    },
  },
];
