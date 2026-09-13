// The pressure comes forward — docs/decisions/0317-the-pressure-comes-forward.md
//
// Every guard 0317 adds, broken on purpose. `node scripts/prove-guard.mjs 0317`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0317',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE BREAKER PUT BACK WHERE 0315 LEFT IT — at a third of the bar, which a shuriken never
      reaches: sixteen seconds, and the wave was never thrown once. The attack that covers a PLACE is
      the one the player has to move for, so where it sits IS the pressure.
    */
    broke: 'the breaker back at the last third, where a shuriken ends the fight before it is thrown',
    guard: 'THE ASKED-FOR ONE: the breaker opens in the first half of the bar',
    edit: {
      path: 'src/content/bosses.ts',
      find: "attack: { kind: 'breaker', span: 96, rise: 1.5, ends: 0.66 }, cue: 'bossBreach', escort:",
      replace: "attack: { kind: 'whip', sweep: 1.3, reach: 0.9 }, shot: 'flame', escort:",
    },
  },
  {
    decision: '0317',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ AND THE FIELD NEVER EMPTYING AGAIN — an escort on the phase between the two hordes, so
      something is in the way from the first call to the last step. *"A phase that … starts early and
      goes till end of the fight ends up being boring."* Every claim about what the adds DO stays green
      over this: there are more of them, for longer.
    */
    broke: 'a horde on every phase from the first, so the field never empties and the shoal is wallpaper',
    guard: 'the field EMPTIES between the two hordes',
    edit: {
      path: 'src/content/bosses.ts',
      find: "shot: 'flame', attack: { kind: 'whip', sweep: 1.3, reach: 0.9 } },",
      replace: "shot: 'flame', attack: { kind: 'whip', sweep: 1.3, reach: 0.9 }, escort: { enemy: 'kite', count: 3, formation: 'vee', from: 'sides', standing: 6, every: 150 } },",
    },
  },
  {
    decision: '0317',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE ARC DROPPED, WHICH IS THE DEFECT THIS DECISION WAS WRITTEN FROM. `firePhase` accumulates
      without limit, so the rake's centre walks a whole circle every thirteen volleys and the fan is
      aimed at the wall for most of the fight. It is invisible to every other guard in the file —
      the fan still rakes, still holds its spread, still points a different way each volley.
    */
    broke: 'the rake unbounded again, so the fan walks round the circle and points down the lane once in thirteen',
    guard: 'THE ONE THAT EXPLAINS THE REST: its fan sweeps ACROSS THE LANE',
    edit: {
      /*
        ⚠️ **BROKEN IN THE CODE AND NOT ON THE ROW, SO THE DRIVEN HALF IS THE HALF THAT FIRES.** Taking
        `arc` off the row reddens the guard on its first line — *the row has no arc* — and never gets as
        far as flying thirty volleys and measuring where they went. This leaves the row saying 1.4 and
        makes the arm ignore it, which is the defect as it actually was.
      */
      path: 'src/app/boss.ts',
      find: '(attack.arc / 2) * Math.sin(boss.firePhase)',
      replace: 'boss.firePhase * 1',
    },
  },
];
