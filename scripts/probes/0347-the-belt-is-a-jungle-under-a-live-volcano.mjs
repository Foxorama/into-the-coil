// The breaks behind docs/decisions/0347-the-belt-is-a-jungle-under-a-live-volcano.md.
//
// Played: *"The volcano is one pulsing graphic that doesn't touch the sky and isn't actually firing any
// rocks or anything, the closer layers and sky layers are a monotone blue with no detail to them."*
// Each clause is a thing that can be quietly put back, and so is each cost the answer spent.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0347',
    suite: 'tests/jungle.test.ts',
    /*
      What shipped, exactly: the smoke running to the bitmap's edge and the edge on the screen, so the
      column ends on a ruled line. Standing the mountain lower is also the obvious answer to a crater
      hidden behind the range. (The first break here shortened the plume, and stayed green: a plume
      this wide overruns its bitmap however far it climbs, so the edge is the claim.)
    */
    broke: 'the first volcano stood lower, so its bitmap’s top edge — and the cut smoke — is on the screen',
    guard: 'THE REPORTED ONE, IN LANE UNITS: every volcano’s smoke leaves the top of the screen',
    edit: {
      path: 'src/content/levels.ts',
      find: '      { at: 1249, lane: 46,',
      replace: '      { at: 1249, lane: 60,',
    },
  },
  {
    decision: '0347',
    suite: 'tests/jungle.test.ts',
    // Lowering a mountain is the obvious answer to a plume clipped at the top, and it buries the crater.
    broke: 'the last volcano stood lower, so its crater sinks behind the far range',
    guard: 'and its crater is on the screen, above all the land in front of it',
    edit: {
      path: 'src/content/levels.ts',
      find: '      { at: 3627, lane: 45,',
      replace: '      { at: 3627, lane: 70,',
    },
  },
  {
    decision: '0347',
    suite: 'tests/jungle.test.ts',
    // Rock that sits at the crater and is blitted every frame — present in the count, going nowhere.
    // Re-anchored by 0363, which made a flight only the climb.
    broke: 'the rock pinned to the crater, so the volcano glows and throws nothing',
    guard: 'THE REPORTED ONE, IN PIXELS: rock climbs out of the crater and off the top of the screen, and none comes down',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const lane = crater - high * (2 * u * t - u * u * t * t);',
      replace: '    const lane = crater;',
    },
  },
  {
    decision: '0347',
    suite: 'tests/jungle.test.ts',
    // The camera is the clock everything else in the sky rides, so it is the one a rock would get.
    broke: 'the rock placed without the sim’s clock, so it hangs in the air while the camera is stopped',
    guard: 'THE CAMERA STOPS FOR A FIGHT AND A VOLCANO DOES NOT',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const flights = time / period + k / count;',
      replace: '    const flights = k / count;',
    },
  },
  {
    decision: '0347',
    suite: 'tests/jungle.test.ts',
    // Bigger is the obvious answer to *"I can hardly see the rocks"*, and past a shot it is a shot.
    broke: 'a thrown rock’s head grown past the smallest shot in the game',
    guard: 'and a rock in the sky is smaller than anything that can kill the player',
    edit: {
      path: 'src/content/sprites.ts',
      find: 'export const EMBER_HEAD = 0.34;',
      replace: 'export const EMBER_HEAD = 0.6;',
    },
  },
  {
    decision: '0347',
    suite: 'tests/jungle.test.ts',
    broke: 'the place’s vent taken away while its volcanoes still state eruptions',
    guard: 'an eruption is stated only where the place has a crater to throw it from',
    edit: {
      path: 'src/content/volcano.ts',
      find: '  saurian: (seed) => ({ x: 0.5, y: coneOf(seed).peak }),',
      replace: '  saurian: null,',
    },
  },
  {
    decision: '0347',
    suite: 'tests/jungle.test.ts',
    // A daylight green — which is what *"jungle"* suggests first, and what the floor cannot carry.
    broke: 'the sunlit canopy made a daylight green, where the fight is read over it',
    guard: 'THE FLOOR: every colour a planet’s land is lit in keeps every gameplay ink findable',
    edit: {
      path: 'src/content/themes.ts',
      find: "lit: '#26521e' },",
      replace: "lit: '#4f8a3a' },",
    },
  },
  {
    decision: '0347',
    suite: 'tests/jungle.test.ts',
    // The haze has a painter of its own, outside the clouds', which is exactly how a measurement forgets it.
    broke: 'the horizon haze left out of the sky’s cover, so the floor reads the place as clearer',
    guard: 'and the haze at the horizon is counted, because it is light',
    edit: {
      path: 'src/render/bake.ts',
      // Re-anchored by 0354, which reads gas-lit marks apart and so gave the line a condition.
      find: "    let cover = which === 'glow' ? 1 - (1 - hazeAt(theme, y, size)) * (1 - cloudsAt(clouds, x, y)) : 0;",
      replace: "    let cover = which === 'glow' ? cloudsAt(clouds, x, y) : 0;",
    },
  },
  {
    decision: '0347',
    suite: 'tests/jungle.test.ts',
    // What shipped: tiles that meet on a fractional pixel, with the sky showing through each join.
    broke: 'opaque tiles laid edge to edge again, so every join shows the sky through the land',
    guard: 'SEAMS, IN PIXELS: an opaque tile overlaps its neighbour, and a translucent one only meets it',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const bleed = layer.opaque === true ? 1 + SEAM_BLEED_PX / (span * view.scale) : 1;',
      replace: '    const bleed = 1;',
    },
  },
  {
    decision: '0347',
    suite: 'tests/jungle.test.ts',
    // The first draft of the fix, exactly: every layer overlapped, and the weather drew a dark line.
    broke: 'every sky layer overlapped, so a translucent one draws its join twice',
    guard: 'SEAMS, IN PIXELS: an opaque tile overlaps its neighbour, and a translucent one only meets it',
    edit: {
      path: 'src/render/scene.ts',
      find: '    const bleed = layer.opaque === true ? 1 + SEAM_BLEED_PX / (span * view.scale) : 1;',
      replace: '    const bleed = 1 + SEAM_BLEED_PX / (span * view.scale);',
    },
  },
  {
    decision: '0347',
    suite: 'tests/jungle.test.ts',
    broke: 'the last volcano throwing forty rocks at once, a pool grown by the back door',
    guard: 'a landmark is one blit and a rock is one more',
    edit: {
      path: 'src/content/levels.ts',
      // Re-anchored by 0363, which kept each volcano's throws a second over a shorter flight.
      find: 'count: 4, period: 52,',
      replace: 'count: 40, period: 52,',
    },
  },
];
