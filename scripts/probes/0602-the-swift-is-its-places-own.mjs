// The breaks behind docs/decisions/0602-the-swift-is-its-places-own.md.
//
// ⚠️ NOTHING HERE BREAKS HOW A DRACO LOOKS — docs/decisions/0192-a-guard-holds-an-invariant.md.
// Whether its wings read as skin over ribs is judged on `scripts/shot-sheet.mjs`. What these break is
// the claim the guard makes: every place whose level sends the swift draws its own outline of it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0602',
    suite: 'tests/faces.test.ts',
    /*
      ⚠️ THE REPORT PUT BACK: every place bakes The Approach's chevron, in its own colours — the one
      drawing 0446 left owed in all three places that send it.
    */
    broke: 'every place given The Approach’s swift',
    guard: 'and every place whose level sends the swift draws its own',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const swiftOf = (theme: ThemeKind): SwiftBody => SWIFT_OF[theme] ?? APPROACH_SWIFT;',
      replace: 'const swiftOf = (theme: ThemeKind): SwiftBody => APPROACH_SWIFT ?? SWIFT_OF[theme];',
    },
  },
  {
    decision: '0602',
    suite: 'tests/faces.test.ts',
    /*
      ⚠️ ONE PLACE BORROWING ANOTHER'S: Saurian Belt flies Ember Nebula's ember swift. Neither is The
      Approach's, so a guard that only asked "is this the default" would stay green over it.
    */
    broke: 'Saurian Belt given Ember Nebula’s swift',
    guard: 'and every place whose level sends the swift draws its own',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const swiftOf = (theme: ThemeKind): SwiftBody => SWIFT_OF[theme] ?? APPROACH_SWIFT;',
      replace: "const swiftOf = (theme: ThemeKind): SwiftBody => SWIFT_OF[theme === 'saurian' ? 'nebula' : theme] ?? APPROACH_SWIFT;",
    },
  },
];
