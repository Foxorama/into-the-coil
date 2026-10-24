// The breaks behind docs/decisions/0662-the-fighter-hangs-its-arms.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0662',
    suite: 'tests/weapons-sit.test.ts',
    // The tubes' layer left where the mount built it, over every ship.
    broke: 'the fighter’s tubes drawn over its hull again',
    guard: '0662 — THE ASK: lies under the hull of a ship that hangs its tubes',
    edit: {
      path: 'src/app/frame.ts',
      find: 'function stepLoaded(w: World): void {\n  hangTubes(w);\n',
      replace: 'function stepLoaded(w: World): void {\n',
    },
  },
  {
    decision: '0662',
    suite: 'tests/gun-layer.test.ts',
    // The bake ignoring the row: every mount laid on last.
    broke: 'the fighter’s gun painted over its nose again',
    guard: 'with the mount on the side of the hull its row hangs it',
    edit: {
      path: 'src/render/bake.ts',
      find: "  const under = SHIPS[ship].hang === 'under';\n  if (mounted && under) paintMount(ctx, f, palette, gun, ship);",
      replace: "  const under = false;\n  if (mounted && under) paintMount(ctx, f, palette, gun, ship);",
    },
  },
];
