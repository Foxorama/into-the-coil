// The breaks behind docs/decisions/0060-a-trigger-is-a-place-on-the-glass.md.
//
// ⚠️ The reported bug is TWO bugs that produce one symptom, and each of them alone is invisible in a
// screenshot. Half the strip was bound to a slot nobody owns, so it swallowed taps; and nothing drew
// the strip at all, so which half was live could only be found by spending a bomb. Fixing either one
// on its own leaves *"I can do one and then can't fire any more"* mostly intact.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0060',
    suite: 'tests/touch.test.ts',
    /*
      ⚠️ THE REPORTED ONE, restored exactly. `SPECIAL_BINDINGS` is the obvious number — it is what the
      strip was built from, it is derived from the action table rather than written by hand, and it is
      correct for every device that has keys. On glass it makes a quarter of the screen inert.
    */
    broke: 'the strip split by the binding budget again, so half of it fires nothing',
    guard: 'THE REPORTED ONE: with one special owned, every tap in the strip fires it',
    edit: {
      path: 'src/app/touch.ts',
      find: '    const zone = tapZone(target, e, bandCount(bandsOf()));',
      replace: '    const zone = tapZone(target, e, SPECIAL_BINDINGS);',
    },
  },
  {
    decision: '0060',
    suite: 'tests/touch.test.ts',
    // The count captured at attach rather than read per tap. Attach happens before a run exists, so
    // the strip would keep the shape of an empty arsenal for the whole session.
    broke: 'the band count captured when the device was attached rather than read per tap',
    guard: 'asks for the count on every tap, because the arsenal grows during a run',
    edit: {
      path: 'src/app/touch.ts',
      find: '    const zone = tapZone(target, e, bandCount(bandsOf()));',
      replace: '    const zone = tapZone(target, e, bandCount(options.bands ? 1 : SPECIAL_BINDINGS));',
    },
  },
  {
    decision: '0060',
    suite: 'tests/touch.test.ts',
    // The clamp gone. An arsenal longer than the binding budget then indexes past the end of the
    // intent, which is 0030's *owned, saved and unreachable* turning into a silent no-op.
    broke: 'the clamp on the band count removed, so an arsenal can index past the triggers',
    guard: 'clamps to the binding budget',
    edit: {
      path: 'src/app/touch.ts',
      find: '  return Math.max(1, Math.min(SPECIAL_BINDINGS, Math.floor(want)));',
      replace: '  return Math.max(1, Math.floor(want));',
    },
  },
  {
    decision: '0060',
    suite: 'tests/hud.browser.test.ts',
    /*
      ⚠️ THE OTHER HALF OF THE REPORT, and the half no unit test can see. With the strip drawn from
      the binding budget its picture claims a band the canvas is not listening on — the player presses
      what they can see and nothing happens, which is the thing they actually described.
    */
    broke: 'the strip drawn with a band per binding rather than per owned trigger',
    guard: 'draws one band per owned trigger',
    edit: {
      path: 'src/app/mount.ts',
      find: '    const count = Math.min(state.run.arsenal.length, bandCount(state.run.arsenal.length));',
      replace: '    const count = bandCount(SPECIAL_BINDINGS);',
    },
  },
  {
    decision: '0060',
    suite: 'tests/hud.browser.test.ts',
    // The strip made a control. It would then take the tap it exists to advertise, and the file that
    // owns not-stealing-the-drag would never hear it.
    broke: 'the strip given pointer events, so it swallows the tap it advertises',
    guard: 'draws one band per owned trigger',
    edit: { path: 'src/app/chrome.ts', find: '  pointer-events: none;\n  font: 600 clamp(0.7rem', replace: '  font: 600 clamp(0.7rem' },
  },
  {
    decision: '0060',
    suite: 'tests/hud.browser.test.ts',
    // Drawn on every device. A desktop player gets a permanent quarter-screen box advertising a place
    // to put a finger they are not using — and 0024's floor is about not making the one game worse.
    broke: 'the strip drawn on a device with no touch at all',
    guard: 'is not drawn on a device with nothing to tap it with',
    edit: { path: 'src/app/mount.ts', find: '  const touchable = navigator.maxTouchPoints > 0;', replace: '  const touchable = true;' },
  },
];
