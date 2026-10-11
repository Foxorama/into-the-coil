// The breaks behind docs/decisions/0594-every-ship-dances.md.
//
// One per guard tests/dance.test.ts adds.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0594',
    suite: 'tests/dance.test.ts',
    broke: 'the War Dance waiting on nobody',
    guard: 'waits on Unity, and on nobody else',
    edit: { path: 'src/content/specials.ts', find: "    opensWith: 'unity',", replace: '    opensWith: null,' },
  },
  {
    decision: '0594',
    suite: 'tests/dance.test.ts',
    broke: 'no face ever shut, whoever is open',
    guard: 'is shut on the bomb pickup before Unity is open, and only it — and open after',
    edit: { path: 'src/content/pickups.ts', find: '    return pilot !== null && !pilotOpen(pilot, record);', replace: '    return false;' },
  },
  {
    decision: '0594',
    suite: 'tests/dance.test.ts',
    broke: 'a draw that counts a shut face as open',
    guard: 'a draw never lands on a shut face, and lands on every open one',
    edit: {
      path: 'src/content/pickups.ts',
      find: '  for (let face = 0; face < row.faces.length; face++) if (shut[face] !== true) open++;',
      replace: '  for (let face = 0; face < row.faces.length; face++) open++;',
    },
  },
  {
    decision: '0594',
    suite: 'tests/dance.test.ts',
    broke: 'a run drawing its pickups over every face, shut or not',
    guard: 'a run puts no bomb pickup on the War Dance while it is shut, through the real frame',
    edit: { path: 'src/app/frame.ts', find: '  const face = drawFace(row, rng, shut);', replace: '  const face = drawFace(row, rng);' },
  },
  {
    decision: '0594',
    suite: 'tests/dance.test.ts',
    broke: 'every pose drawn as the ship standing still',
    guard: 'each pose is drawn, and is not the still ship again',
    edit: {
      path: 'src/render/bake.ts',
      find: '      drawPlayerShip(ctx, f, palette, ship, stage, gunNow(ship), fit.rim, fit.art, fit.livery, pose);',
      replace: '      drawPlayerShip(ctx, f, palette, ship, stage, gunNow(ship), fit.rim, fit.art, fit.livery, 0);',
    },
  },
  {
    decision: '0594',
    suite: 'tests/dance.test.ts',
    broke: 'a dance that never puts the ship in its poses',
    guard: 'a ship that throws the War Dance cycles through its poses, and stands still again after',
    edit: { path: 'src/app/frame.ts', find: '  if (w.danceFor > 0 && w.ramBrokenFor === 0) {', replace: '  if (false) {' },
  },
  {
    decision: '0594',
    suite: 'tests/dance.test.ts',
    broke: 'a ship left dancing after its dance is over',
    guard: 'a ship that throws the War Dance cycles through its poses, and stands still again after',
    edit: { path: 'src/app/frame.ts', find: '    // 0594: and stands still again.\n    wearHull(w);\n', replace: '' },
  },
  {
    decision: '0594',
    suite: 'tests/dance.test.ts',
    broke: 'every ship dancing in its bare-hull poses, whatever tubes it carries',
    guard: 'dances at the stage its tubes say, and a tube taken mid-dance dances on with it',
    edit: {
      path: 'src/app/frame.ts',
      find: '    const cycle = w.shipRow.dance[w.weapon.launchers >= 2 ? 2 : w.weapon.launchers === 1 ? 1 : 0];',
      replace: '    const cycle = w.shipRow.dance[0];',
    },
  },
  {
    decision: '0594',
    suite: 'tests/dance.test.ts',
    broke: "the ball's heat drawn under every dancing ship",
    guard: 'the ram rides every dancing ship unseen, and the ball shows its heat under it as ever',
    edit: { path: 'src/app/frame.ts', find: '  const picture = ram !== null ? RAM_HEAT[stage] : UNSEEN;', replace: '  const picture = RAM_HEAT[stage];' },
  },
  {
    decision: '0594',
    suite: 'tests/dance.test.ts',
    broke: 'the painter blitting a body with no picture',
    guard: 'and the painter passes over what has no picture, rather than blitting nothing at a canvas',
    edit: { path: 'src/render/scene.ts', find: '      if (e.sprite === UNSEEN) continue;\n', replace: '' },
  },
  {
    decision: '0594',
    suite: 'tests/key-opens.browser.test.ts',
    broke: 'a shut face left showing in How to play’s key',
    guard: 'keeps the War Dance out of a first-time player’s key',
    edit: { path: 'src/app/chrome.ts', find: '          face.button.hidden = hidden;\n', replace: '' },
  },
  {
    decision: '0594',
    suite: 'tests/key-opens.browser.test.ts',
    broke: 'the key never told what is shut',
    guard: 'keeps the War Dance out of a first-time player’s key',
    edit: { path: 'src/app/mount.ts', find: '    chrome.setPickupsShut(world.pickupShut);\n', replace: '' },
  },
  {
    decision: '0594',
    suite: 'tests/key-opens.browser.test.ts',
    broke: 'the cursor walked onto a face that is hidden',
    guard: 'keeps the War Dance out of a first-time player’s key',
    edit: { path: 'src/app/chrome.ts', find: '    const shown = key.filter((face) => !face.hidden);', replace: '    const shown = [...key];' },
  },
];
