// The breaks behind docs/decisions/0348-the-labyrinth-is-walled.md.
//
// Played: *"The end boss has some walls around it, but otherwise there's no labyrinth that the player is
// actually flying through."* Three of these breaks are this decision's own first drafts, exactly.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0348',
    suite: 'tests/corridor.test.ts',
    // Narrowing the corridor is the obvious way to make it feel tighter, and it puts stone inside the box.
    broke: 'the corridor drawn narrower than the box, so its walls stand where the ship can fly',
    guard: 'THE CLAMP IS THE WALL, IN LANE UNITS',
    edit: {
      path: 'src/content/levels.ts',
      find: '      width: ACROSS_SPAN - PLAYER_MARGIN * 2,',
      replace: '      width: ACROSS_SPAN - PLAYER_MARGIN * 3,',
    },
  },
  {
    decision: '0348',
    suite: 'tests/corridor.test.ts',
    broke: 'the corridor run on to where the fight is, past the room’s open side, so the two overlap',
    guard: 'AND IT RUNS ALL THE WAY TO THE ROOM',
    edit: {
      path: 'src/app/frame.ts',
      find: 'origin + level.bossAt - room.stand - room.mouth;',
      replace: 'origin + level.bossAt - room.stand;',
    },
  },
  {
    decision: '0348',
    suite: 'tests/corridor.test.ts',
    // 0335's own tiling, exactly: the run started from the camera, so the band stood still on screen.
    broke: 'wall tiles counted from the camera again, so a room’s walls stand still while the camera moves',
    guard: 'AND THE ROOM’S WALLS ARE ON THE WORLD’S GRID',
    edit: {
      path: 'src/render/scene.ts',
      find: '  for (let start = from + skip * extent; start < stop; start += extent) {',
      replace: '  for (let start = Math.max(from, cameraAlong - extent); start < stop; start += extent) {',
    },
  },
  {
    decision: '0348',
    suite: 'tests/corridor.test.ts',
    /*
      The first draft, exactly: the whole opening moved on by the drift, so the spawn point was stone.
      (A first version of this probe shrank the drift instead and came back STILL GREEN — which is how
      it was found that the near end was the fix, and the drift's length only the model's honesty.)
    */
    broke: 'a flank’s opening started past where the flanker is put down, so it comes through stone',
    guard: 'THE REPORTED RISK, IN PIXELS',
    edit: {
      path: 'src/app/frame.ts',
      find: '  corridor.passages[slot] = first - radius - PASSAGE_CLEARANCE;',
      replace: '  corridor.passages[slot] = first + drift - radius - PASSAGE_CLEARANCE;',
    },
  },
  {
    decision: '0348',
    /*
      ⚠️ Re-pointed by 0349. Since the stone destroys what meets it, a drifter that fails to turn is
      no longer drawn over the stone — it bursts on it — and `THE REPORTED RISK` went STILL GREEN over
      both of these. The rule the player chose is *turn at the wall*, and that is guarded directly now.
    */
    suite: 'tests/stone.test.ts',
    // What the player chose against: drifters turning outside the lane, over the stone and back.
    broke: 'the corridor’s bound on a drifter taken away, so it turns beyond the lane edge over the stone',
    guard: 'A DRIFTER TURNS AT THE WALL RATHER THAN DYING ON IT',
    edit: {
      path: 'src/app/frame.ts',
      find: '        if (corridor === null) {\n          if (e.across <= ROAM_MIN) e.velAcross = m.roam;',
      replace: '        if (corridor === null || corridor !== null) {\n          if (e.across <= ROAM_MIN) e.velAcross = m.roam;',
    },
  },
  {
    decision: '0348',
    // Re-pointed by 0349, on the same terms as the probe above.
    suite: 'tests/stone.test.ts',
    // The second draft, exactly: turning on where the body is, a step after it has crossed the face.
    broke: 'a drifter turned on where it is rather than where the step takes it, so it enters the stone first',
    guard: 'A DRIFTER TURNS AT THE WALL RATHER THAN DYING ON IT',
    edit: {
      path: 'src/app/frame.ts',
      find: '        const next = e.across + e.velAcross;',
      replace: '        const next = e.across;',
    },
  },
];
