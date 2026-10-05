// The breaks behind docs/decisions/0521-the-hangar-opens.md.
//
// ⚠️ The hangar's one irreplaceable thing is the unlock — a win is a whole run — so the breaks that
// matter are a finished run that wins nothing, a dash fitted that was never won (by the band, or by a
// save), a fitting the next visit forgets, a run that does not wear what was fitted, and a press in
// the hangar that flies instead of looking.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0521',
    suite: 'tests/hangar.test.ts',
    broke: 'the run finished going to the finale without winning its ship',
    guard: 'a run finished wins its ship, at the finale',
    edit: {
      path: 'src/state/root.ts',
      find: '    return { ...state, screen: reduceScreen(state.screen, SHOW_FINALE), hangar };',
      replace: '    return { ...state, screen: reduceScreen(state.screen, SHOW_FINALE) };',
    },
  },
  {
    decision: '0521',
    suite: 'tests/hangar.test.ts',
    broke: 'every dash open to every ship, won or not',
    guard: 'is shut until both ships have been won in',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  return plate === ship || (state.won[ship] && state.won[plate]);',
      replace: '  return plate === ship || true;',
    },
  },
  {
    decision: '0521',
    suite: 'tests/hangar.test.ts',
    broke: 'a saved fitting trusted without asking whether its wins open it',
    guard: 'a document fitting a dash its own wins do not open',
    edit: {
      path: 'src/save/hangar.ts',
      find: '    if (fitted !== null && plateOpen(opened, kind, fitted)) plate[kind] = fitted;',
      replace: '    if (fitted !== null) plate[kind] = fitted;',
    },
  },
  {
    decision: '0521',
    suite: 'tests/hangar.browser.test.ts',
    broke: 'a fitting changed in the hangar and never written to the key',
    guard: 'shuts what is not won, fits what is, keeps it, and flies in it',
    edit: {
      path: 'src/app/mount.ts',
      find: '      writeHangar(keptStore, state.hangar);\n',
      replace: '',
    },
  },
  {
    decision: '0521',
    suite: 'tests/hangar.browser.test.ts',
    broke: 'the run flown in its own ship’s dash, whatever the hangar fitted',
    guard: 'shuts what is not won, fits what is, keeps it, and flies in it',
    edit: {
      path: 'src/app/mount.ts',
      find: 'chrome.setShip(world.shipRow, SHIPS[state.hangar.plate[state.run.ship]], {',
      replace: 'chrome.setShip(world.shipRow, world.shipRow, {',
    },
  },
  {
    decision: '0521',
    suite: 'tests/hangar.browser.test.ts',
    broke: 'a press on the highlighted pilot in the hangar flying them, as it does on the title',
    guard: 'shuts what is not won, fits what is, keeps it, and flies in it',
    edit: {
      path: 'src/app/mount.ts',
      find: '      if (takes && kind === state.settings.pilot && (!pointer || pilotArmed)) {',
      replace: '      if (kind === state.settings.pilot && (!pointer || pilotArmed)) {',
    },
  },
  {
    decision: '0521',
    suite: 'tests/style.test.ts',
    broke: 'the pilot band offered on a third screen, Settings',
    guard: 'every setting is offered on exactly one screen',
    edit: {
      path: 'src/state/screens.ts',
      find: "      {\n        name: 'steer',\n        label: 'Steering',",
      replace:
        "      { name: 'pilot', label: 'Pilot', options: pilotOptions, faces: 'portraits', on: 'all', press: 'steps' },\n      {\n        name: 'steer',\n        label: 'Steering',",
    },
  },
];
