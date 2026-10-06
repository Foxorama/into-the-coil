// The breaks behind docs/decisions/0540-the-hangar-is-the-port.md.
//
// Asked for: *"good Hangin Out screen - spaceport, garage style with background, setting and ships etc."*
// The hangar's tabs stand in the intro's room, the pilot's ship on its pad wearing the fit, a camera per
// tab. Each half broken on its own.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0540',
    suite: 'tests/stand.test.ts',
    // The ship on its pad lit on the intro's beat, which a stand never reaches: no flame under it.
    broke: 'the ship on the pad never lit, so it stands on its beam with its engines cold',
    guard: 'stands every tab in the room with the Viper gone',
    edit: {
      path: 'src/render/port.ts',
      find: '  paintBlue(surface, view, t, STAGE.bluePad, across, 0, Number.POSITIVE_INFINITY, size);',
      replace: '  paintBlue(surface, view, t, STAGE.bluePad, across, BEATS.blueLit, Number.POSITIVE_INFINITY, size);',
    },
  },
  {
    decision: '0540',
    suite: 'tests/stand.test.ts',
    // The camera put where it is asked, wherever that leaves the room's wall.
    broke: 'the camera not held inside the room, so the bar’s camera shows the void past the wall on a wide screen',
    guard: 'keeps the room over every edge of the screen',
    edit: {
      path: 'src/render/port.ts',
      find: '  out.gutterAlong = Math.min(0, Math.max(width - base.alongSpan * scale, along));',
      replace: '  out.gutterAlong = along;',
    },
  },
  {
    decision: '0540',
    suite: 'tests/stand.test.ts',
    // The spinners drawn and never turned.
    broke: 'the spinners on the pad drawn still',
    guard: 'turns a car’s spinners on the pad',
    edit: {
      path: 'src/render/port.ts',
      // ⚠️ Re-pointed by 0556: the turn is read off the rim's row now.
      find: '      put(surface, view, sprite, STAGE.bluePad + at.along * unit, across + at.across * unit, 1, wheelTurn(wheel, i, seconds), swell);',
      replace: '      put(surface, view, sprite, STAGE.bluePad + at.along * unit, across + at.across * unit, 1, 0 * seconds, swell);',
    },
  },
  {
    decision: '0540',
    suite: 'tests/livery.browser.test.ts',
    // The fit changed and the port's ship left as it was baked when the tab opened.
    broke: 'a fitting that never reaches the ship on the pad, so the preview shows the paint it came in',
    guard: 'the Firebird painted blue',
    edit: {
      path: 'src/app/mount.ts',
      find: '        withFit(onPad.ship, fit, () => bakePortShip(into, colours, onPad));',
      replace: '',
    },
  },
  {
    decision: '0540',
    suite: 'tests/stand.browser.test.ts',
    // The clip a barred frame set left standing when the bar goes.
    broke: 'the bar’s clip left standing on the stand, so a black band stands over the room',
    guard: 'draws the port to the top of a desktop’s screen',
    edit: {
      path: 'src/render/canvas.ts',
      find: '      ctx.restore();\n      ctx.fillStyle = this.space;\n      ctx.fillRect(0, 0, this.width, this.height);\n      return;',
      replace: '      ctx.fillStyle = this.space;\n      ctx.fillRect(0, 0, this.width, this.height);\n      return;',
    },
  },
];
