// The mouth is alive — docs/decisions/0285-the-mouth-is-alive.md
//
// Every guard 0285 adds, broken on purpose. `node scripts/prove-guard.mjs 0285`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0285',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **THE STATE OF `main` BEFORE THIS DECISION, IN ONE LINE: A MOUTH THAT ONLY MOVES WHEN THE
      BOSS FIRES.** The head wore four faces and every one of them was chosen by the fight's own
      clock, so the animal did the same thing at the same moment for every player — *"it still feels
      like a non-interactive wall object rather than a living space serpent trying to battle the
      player."*

      ⚠️ **AND A FREE-RUNNING CLOCK IS WHAT THIS BREAKS IT BACK TO, NOT A DELETED SNAP.** The first
      version of this probe stopped the jaw entirely and duly went red — on the wrong half, the one
      that says the mouth moves at all. A jaw worked every forty steps satisfies that half and fails
      the half that is actually the report: the pilot who holds a lane is snapped at too, so every
      player watches the same animal. That is the sameness 0282 is about, and it is what this has to
      be seen to catch.
    */
    broke: 'the snap on a free-running clock instead of on the player, so every pilot watches the same jaw',
    guard: 'THE REPORTED ONE: the head snaps at a ship that crosses it',
    edit: {
      path: 'src/app/frame.ts',
      find: '  if (w.bossBite > 0) w.bossBite -= 1;',
      replace: '  if (w.bossBite > 0) w.bossBite -= 1;\n  else w.bossBite = BITE_STEPS + 33;',
    },
  },
  {
    decision: '0285',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ **THE SNAP AND THE STRIKE AS TWO DEGREES OF THE SAME THING**, which is the cheap version of
      this change and the one a later pass would drift into: give the snap a smaller gape rather than
      a closing jaw and the head still animates, but the tell that says *a volley is coming* now also
      means *a ship went past*, and a tell that fires on nothing is a tell the player stops reading.
    */
    broke: 'the snap opening the jaw a little instead of closing it, so it reads as a half-hearted tell',
    guard: 'THE JAW: the snap and the strike throw it opposite ways from rest',
    edit: {
      path: 'src/render/bake.ts',
      find: "const JAWS = { rest: 0, gape: -0.34, shut: 0.42 } as const;",
      replace: "const JAWS = { rest: 0, gape: -0.34, shut: -0.12 } as const;",
    },
  },
];
