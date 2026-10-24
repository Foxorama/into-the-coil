// The breaks behind docs/decisions/0666-venoma-flies-the-viper.md.
//
// One per guard tests/venoma.test.ts adds, and the intro the built page skips for her.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0666',
    suite: 'tests/venoma.test.ts',
    broke: 'Venoma open from the first run, with no tier finished',
    guard: 'she opens once every tier is finished, in any ship, and not one tier before',
    edit: { path: 'src/content/golfers.ts', find: '    opens: { after: [], crashes: 0, bought: 0, tiers: [...DIFFICULTY_KINDS] },', replace: '    opens: { after: [], crashes: 0, bought: 0, tiers: [] },' },
  },
  {
    decision: '0666',
    suite: 'tests/venoma.test.ts',
    broke: 'Venoma found in her own cockpit at the finale',
    guard: 'is never the golfer found in the Viper, whoever flies',
    edit: { path: 'src/content/golfers.ts', find: '  return GOLFER_KINDS.filter((kind) => kind !== chosen && GOLFERS[kind].story);', replace: '  return GOLFER_KINDS.filter((kind) => kind !== chosen);' },
  },
  {
    decision: '0666',
    suite: 'tests/venoma.test.ts',
    broke: 'her run finished goes to the finale, which finds someone in her cockpit',
    guard: 'her run finished goes to the victory screen',
    edit: { path: 'src/state/root.ts', find: 'GOLFERS[pilotOf(state.run.ship)].story ? SHOW_FINALE : SHOW_VICTORY', replace: 'SHOW_FINALE' },
  },
  {
    decision: '0666',
    suite: 'tests/venoma.browser.test.ts',
    broke: 'Fly plays her the intro, in which a pilot chases her out of the port',
    guard: 'flies her straight into the run',
    edit: { path: 'src/app/mount.ts', find: '    if (!GOLFERS[state.settings.pilot].story) {\n      startRun();\n      return;\n    }\n', replace: '' },
  },
  {
    decision: '0666',
    suite: 'tests/venoma.test.ts',
    broke: 'the spray runs to the edge of the screen, as the marker’s paint does',
    guard: 'a spray — a fan of four, twice as wide as the pulse’s, that reaches three quarters of the screen',
    // Re-anchored by 0667: the acid is a paint gun, and its range a share of the screen.
    edit: { path: 'src/app/frame.ts', find: '    if (life > 0) shot.lifeFor = life;\n', replace: '' },
  },
  {
    decision: '0666',
    suite: 'tests/venoma.test.ts',
    broke: 'the spray fanned at the pulse’s width',
    guard: 'a spray — a fan of four, twice as wide as the pulse’s, that reaches three quarters of the screen',
    edit: { path: 'src/content/pickups.ts', find: '    spread: (gunRow.fan ?? SPREAD_STEP) * (shots - 1),', replace: '    spread: SPREAD_STEP * (shots - 1),' },
  },
  {
    decision: '0666',
    suite: 'tests/venoma.test.ts',
    broke: 'the Viper’s tubes fire missiles',
    guard: 'throw the serpent’s void, and fly as the fitted kind says',
    edit: { path: 'src/app/frame.ts', find: '    const look = w.shipRow.tubeFire === undefined ? row : SHOTS[w.shipRow.tubeFire];', replace: '    const look = row;' },
  },
  {
    decision: '0666',
    suite: 'tests/venoma.test.ts',
    broke: 'the lightning thrown from the ship, as the storm’s bolts are, and not called down from the sky',
    guard: 'called down from the top of the lane onto the body nearest the ship, a bolt at a time',
    edit: { path: 'src/app/frame.ts', find: '  spawnLink(w, SHOTS.arc, toAlong, 0, toAlong, toAcross, SMITE_BOLT_KIND);', replace: '  spawnLink(w, SHOTS.arc, w.ship.along, w.ship.across, toAlong, toAcross, SMITE_BOLT_KIND);' },
  },
  {
    decision: '0666',
    suite: 'tests/venoma.test.ts',
    broke: 'one bolt on the press and no more',
    guard: 'called down from the top of the lane onto the body nearest the ship, a bolt at a time',
    edit: { path: 'src/app/frame.ts', find: '    stepSmite(w);\n', replace: '' },
  },
  {
    decision: '0666',
    suite: 'tests/venoma.test.ts',
    broke: 'another special thrown while the lightning still falls',
    guard: 'called down from the top of the lane onto the body nearest the ship, a bolt at a time',
    edit: { path: 'src/app/frame.ts', find: '    w.throwIn = (row.smite.strikes - 1) * row.smite.every + THROW_GAP_STEPS;\n', replace: '' },
  },
  {
    decision: '0666',
    suite: 'tests/layout.browser.test.ts',
    // Seven pilots' width: the eighth pushes the loadout's Right tube band off a 667x375.
    broke: 'eight pilots’ faces on Hangin’ Out at seven pilots’ width on a phone',
    guard: 'draws every control and word on each tab’s plate whole and inside it',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-hangar-option-face > canvas, .itc-parts-option-face > canvas { width: clamp(1.55rem, min(9cqh, 3.8cqw), 2.6rem); height: clamp(1.55rem, min(9cqh, 3.8cqw), 2.6rem); }',
      replace: '.itc-hangar-option-face > canvas, .itc-parts-option-face > canvas { width: clamp(1.7rem, min(9cqh, 4.2cqw), 2.6rem); height: clamp(1.7rem, min(9cqh, 4.2cqw), 2.6rem); }',
    },
  },
  {
    decision: '0666',
    suite: 'tests/layout.browser.test.ts',
    // Cosmo's at the other plates' width: its shelf tabs take the room and push their arrow off a 667x375.
    broke: 'Cosmo’s faces as wide as Hangin’ Out’s on a phone',
    guard: 'draws every control and word on each tab’s plate whole and inside it',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-shop-option-face > canvas { width: clamp(1.4rem, min(9cqh, 3.4cqw), 2.6rem); height: clamp(1.4rem, min(9cqh, 3.4cqw), 2.6rem); }',
      replace: '.itc-shop-option-face > canvas { width: clamp(1.55rem, min(9cqh, 3.8cqw), 2.6rem); height: clamp(1.55rem, min(9cqh, 3.8cqw), 2.6rem); }',
    },
  },
];
