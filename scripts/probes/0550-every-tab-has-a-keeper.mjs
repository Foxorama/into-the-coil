// The breaks behind docs/decisions/0550-every-tab-has-a-keeper.md.
//
// A keeper on every tab, each tab's own and nobody else's, and a viewport in the back wall with the sky
// through it. Each put back as it was, or broken the way it would be broken.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0550',
    suite: 'tests/stand.test.ts',
    // 0571: every shop is in the room, so the break is the tab's own shop dimmed with the rest.
    broke: 'the open tab’s shop dimmed like the others',
    guard: 'lights each tab’s own keeper’s shop',
    edit: {
      path: 'src/render/port.ts',
      find: '    if (keeper !== null && kind !== keeper) put(surface, view, PORT_SPRITE.veil,',
      replace: '    if (keeper !== null) put(surface, view, PORT_SPRITE.veil,',
    },
  },
  {
    decision: '0550',
    suite: 'tests/stand.test.ts',
    // Two tabs naming one keeper.
    broke: 'Paint & Parts kept by Unity',
    guard: 'lights each tab’s own keeper’s shop',
    edit: {
      path: 'src/state/screens.ts',
      find: "      // 0550: MMXXVI, who paints it.\n      keeper: 'mmxxvi',",
      replace: "      // 0550: MMXXVI, who paints it.\n      keeper: 'unity',",
    },
  },
  /*
    The viewport's two probes went with its guard in 0568: the stars are the open bay's now, in the stand,
    and that is guarded by tests/stand.test.ts's 0568 test and broken by 0568's own probes. The viewport is
    still drawn, where the camera sees it, and is no longer something the camera must keep in view.
  */
  /*
    ⚠️ **THE GREETING CARD'S PROBE IS GONE — 0572.** It put a keeper who only greets back on a phone's
    plate. Since 0572 no keeper is on the plate, their words are a bubble in the stand, and the rule it
    deleted hid nothing: the probe stayed green on CI (0019), and the rule went with it.
  */
];
