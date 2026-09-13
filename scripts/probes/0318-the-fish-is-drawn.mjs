// The fish is drawn — docs/decisions/0318-the-fish-is-drawn.md
//
// Every guard 0318 adds, broken on purpose. `node scripts/prove-guard.mjs 0318`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0318',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE TRAILS PULLED BACK INSIDE THE FIN, WHICH IS THE DRAWING THE ASK WAS MADE AGAINST. Five
      marks a side, same inks, same alphas, same count — and every one of them a STRIPE on the wing
      rather than something coming off it. *"Extend the wings to have longer finny trails coming off
      them"* is a claim about what leaves the outline, and nothing else in the file can see it: the
      containment guards are all happy, because a mark that stays in is the one thing they ask for.
    */
    broke: 'the streamers pulled back inside the fin, so the wings are striped rather than trailing',
    guard: 'THE ASKED-FOR ONE: the wings TRAIL',
    edit: {
      path: 'src/render/bake.ts',
      find:
        '      [0.03, 0.96, 0.5, 1.02, 1.08, 0.99, 0.48, 0.94, 0.05, 0.9],\n' +
        '      [0.08, 0.845, 0.45, 0.88, 0.95, 0.85, 0.44, 0.81, 0.1, 0.79],\n' +
        '      [0.13, 0.73, 0.4, 0.75, 0.8, 0.71, 0.38, 0.67, 0.15, 0.66],\n' +
        '      [0.47, 0.41, 0.64, 0.5, 0.84, 0.57, 0.62, 0.45, 0.49, 0.365],\n' +
        '      [0.99, 0.52, 1.06, 0.58, 1.13, 0.63, 1.03, 0.53, 0.975, 0.485],\n',
      replace:
        '      [-0.1, 0.86, -0.04, 0.88, 0.02, 0.86, -0.04, 0.83, -0.1, 0.82],\n' +
        '      [-0.16, 0.72, -0.1, 0.74, -0.04, 0.72, -0.1, 0.69, -0.16, 0.68],\n' +
        '      [-0.22, 0.6, -0.16, 0.62, -0.1, 0.6, -0.16, 0.57, -0.22, 0.56],\n' +
        '      [-0.28, 0.48, -0.22, 0.5, -0.16, 0.48, -0.22, 0.45, -0.28, 0.44],\n' +
        '      [-0.34, 0.36, -0.28, 0.38, -0.22, 0.36, -0.28, 0.33, -0.34, 0.32],\n',
    },
  },
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
      find: '    [1.02, 0.2],\n    [1.06, 0.11],\n    [1.12, 0.05],\n',
      replace: '    [1.12, 0.05],\n    [1.06, 0.11],\n    [1.02, 0.2],\n',
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
      find: "  ctx.globalCompositeOperation = 'destination-over';\n  for (const [swell, alpha] of [\n    [1.02, 0.2],",
      replace: "  ctx.globalCompositeOperation = 'source-over';\n  for (const [swell, alpha] of [\n    [1.02, 0.2],",
    },
  },
];
