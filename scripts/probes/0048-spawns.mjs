// The breaks behind docs/decisions/0048-a-threat-may-arrive-from-the-side.md.
//
// ⚠️ The first one is the SHIPPED BUG, restored. It is the shape this whole decision is about: every
// number in the model was correct, and the player never saw the boss because the shot outlived the
// view. Nothing in the repository could have noticed, because nothing in the repository was looking
// at the view — docs/decisions/0027-measure-the-picture-not-the-model.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0048',
    suite: 'tests/spawns.test.ts',
    // ⚠️ THE REPORTED BUG. "I didn't even see the boss monsters on screen because they died before
    // they even entered the visible play area."
    broke: 'the player’s shots culled with the content again, so they kill things nobody can see',
    guard: 'and the boss is never hit before it can be seen',
    edit: {
      path: 'src/app/frame.ts',
      find: '    stepEntities(w.playerShots, w.cameraAlong, cullPlayerShotAlong(w.cameraAlong, w.view.alongSpan));',
      replace: '    stepEntities(w.playerShots, w.cameraAlong);',
    },
  },
  {
    decision: '0048',
    suite: 'tests/spawns.test.ts',
    // The tempting version: use the widest view any device can have, like every other spawn rule.
    // It is correct for content and wrong for reach — a 16:9 player would still be shooting 70
    // units into the dark to keep a 21:9 player's range honest.
    broke: 'shot range tied to the widest device rather than to the screen in front of the player',
    guard: 'never outlives the view it was fired into, on any device',
    edit: {
      path: 'src/sim/camera.ts',
      find: 'export function cullPlayerShotAlong(cameraAlong: number, alongSpan: number): number {\n  return cameraAlong + alongSpan;',
      replace:
        'export function cullPlayerShotAlong(cameraAlong: number, alongSpan: number): number {\n  void alongSpan;\n  return cameraAlong + MAX_ALONG_SPAN;',
    },
  },
  {
    decision: '0048',
    suite: 'tests/spawns.test.ts',
    // The gap the silhouettes report named, reopened: a body that leaves the lane is gone from the
    // game and holds its pool slot forever, so a wave later in the level silently stops spawning.
    broke: 'the across cull removed, so anything leaving the lane holds a pool slot forever',
    guard: 'retires a body that drifts off either across edge',
    edit: {
      path: 'src/sim/entity.ts',
      find: '    if (e.across < ACROSS_CULL_MIN || e.across > ACROSS_CULL_MAX) pool.releaseAt(i);',
      replace: '    void ACROSS_CULL_MIN;',
    },
  },
  {
    decision: '0048',
    suite: 'tests/spawns.test.ts',
    // The cap read as a fraction of *a* screen rather than of the widest one. It is correct on a
    // 21:9 monitor and puts an ambush beside the player on a laptop.
    broke: 'the entry cap set from a narrower view, so a flanker arrives level with the player',
    guard: 'appears no further back than halfway across the widest view there is',
    edit: {
      path: 'src/sim/camera.ts',
      find: 'export const FLANK_ALONG = MAX_ALONG_SPAN / 2;',
      replace: 'export const FLANK_ALONG = MAX_ALONG_SPAN / 4;',
    },
  },
  {
    decision: '0048',
    suite: 'tests/spawns.test.ts',
    // ⚠️ The one the comment in `steerEnemies` is about. A tolerance band looks more forgiving and
    // is strictly worse: a body crossing at speed steps OVER any band you pick, so it holds at one
    // speed and misses at another — and the wave then flies straight out the far side of the lane.
    broke: 'the turn tested against a tolerance band rather than against the direction of travel',
    guard: 'turns down-lane and stops exactly where the wave was authored',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (e.velAcross > 0 ? e.across >= e.steerAcross : e.velAcross < 0 && e.across <= e.steerAcross) {',
      replace: '    if (e.velAcross !== 0 && Math.abs(e.across - e.steerAcross) < 0.1) {',
    },
  },
  {
    decision: '0048',
    suite: 'tests/spawns.test.ts',
    // A pickup that drifts and never turns round leaves the lane, and the new across cull then
    // quietly deletes it — which turns 0041's twenty-second rearm ceiling into a promise the level
    // cannot keep. Two changes in this decision meeting each other.
    broke: 'a drifting pickup that never turns at the lane edge, so it wanders out and is culled',
    guard: 'but stays inside the lane, so it is never unreachable',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (item.across - item.radius <= 0) item.velAcross = Math.abs(item.velAcross);\n    else if (item.across + item.radius >= ACROSS_SPAN) item.velAcross = -Math.abs(item.velAcross);',
      replace: '    void item;',
    },
  },
];
