// The vessels beat with the music — docs/decisions/0401-the-vessels-beat-with-the-music.md
//
// Every guard 0401 adds, broken on purpose. `node scripts/prove-guard.mjs 0401`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0401',
    suite: 'tests/heart.test.ts',
    // The heart read a step late: the picture flares a sixteenth before the voice strikes.
    broke: 'the heart’s last beat looked for from the step after the one sounding',
    guard: 'every rise is a struck step of the heard voice',
    edit: {
      path: 'src/content/veins.ts',
      find: '    const now = Math.floor(into / step);',
      replace: '    const now = Math.floor(into / step) + 1;',
    },
  },
  {
    decision: '0401',
    suite: 'tests/heart.test.ts',
    // The opening's heart as strong as the fight's, which is a picture that does not climb.
    broke: 'the opening’s heart drawn at the fight’s strength',
    guard: 'and it is subtle at first and a noticeable heartbeat at the end',
    edit: {
      path: 'src/content/veins.ts',
      find: "      { layer: 'ownC', voice: 0, strength: { run: 0.45 } },",
      replace: "      { layer: 'ownC', voice: 0, strength: { run: 1 } },",
    },
  },
  {
    decision: '0401',
    suite: 'tests/heart.test.ts',
    // The lit vessels laid over the weather opaque, whatever the heart is doing.
    broke: 'the lit vessels blitted at full strength on any beat',
    guard: 'IN PIXELS: the lit vessels are laid over the weather at the heart',
    edit: {
      path: 'src/render/scene.ts',
      // Re-anchored by 0416, which offset every sky sprite for the intro's atlas.
      find: '          surface.blit(base + SPRITE.skyVeins, screenX(view, inView, across), screenY(view, inView, across), view.scale, 0, Math.min(1, beat));',
      replace: '          surface.blit(base + SPRITE.skyVeins, screenX(view, inView, across), screenY(view, inView, across), view.scale, 0);',
    },
  },
];
