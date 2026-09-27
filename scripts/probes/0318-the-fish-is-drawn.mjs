// The fish is drawn — docs/decisions/0318-the-fish-is-drawn.md
//
// Every guard 0318 adds, broken on purpose. `node scripts/prove-guard.mjs 0318`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  /*
    ⚠️ THE TRAILS' PROBE MOVED TO 0395 WITH THE TRAILS. The wings' filaments were taken out of the body
    by docs/decisions/0395-the-fish-wears-its-fire.md and the fire's ribbons answer the same ask; the
    guard reads the fire now, so its break is the fire's — scripts/probes/0395-the-fish-wears-its-fire.mjs.
  */
  {
    decision: '0318',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE HALO STACKED THE OTHER WAY ROUND, WHICH IS THE DEFECT 0277 SHIPPED ONCE AND HAD TO FIX.
      `destination-over` puts each new fill further BACK than the last, so the rings have to be laid
      brightest first. Dimmest first, the bright inner ring goes behind the dim outer one and is
      hidden by it: what bakes is two flat slabs with a hard edge, and every ring is still present,
      still the right width and still the right alpha.
    */
    broke: 'the halo laid dimmest ring first, so the bright one goes behind the dim one and the falloff steps',
    guard: 'the astral light is BEHIND the animal, brightest ring first',
    edit: {
      path: 'src/render/bake.ts',
      // ⚠️ Re-anchored by 0320, which turned the swells into GAPS so the outer ring could be capped in
      // absolute terms once a second body reached further aft. The break is the same break.
      find: '    [0.02, 0.2],\n    [0.06, 0.11],\n    [0.12, 0.05],\n',
      replace: '    [0.12, 0.05],\n    [0.06, 0.11],\n    [0.02, 0.2],\n',
    },
  },
  {
    decision: '0318',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ AND THE HALO PAINTED ON TOP OF THE ANIMAL INSTEAD OF BEHIND IT. One word, and it is the word
      `tests/paths.ts` could not see until this decision recorded a fill's composite mode — the same
      extension 0276 made for a stroke, and for the same reason. Drawn `source-over` after the seal, a
      swelled copy of the hull lands OVER the fish rather than around it, which is not a light at all.
    */
    broke: 'the halo composited over the hull rather than behind it, so it is a slab on the animal',
    guard: 'the astral light is BEHIND the animal, brightest ring first',
    edit: {
      path: 'src/render/bake.ts',
      // ⚠️ Re-anchored by 0320, on the same line the loop header moved. The break is the same word.
      find: "  ctx.globalCompositeOperation = 'destination-over';\n  for (const [gap, alpha] of [\n    [0.02, 0.2],",
      replace: "  ctx.globalCompositeOperation = 'source-over';\n  for (const [gap, alpha] of [\n    [0.02, 0.2],",
    },
  },
];
