// The serpent has menace — docs/decisions/0277-the-serpent-has-menace.md
//
// Every guard 0277 adds, broken on purpose. `node scripts/prove-guard.mjs 0277`.
//
// ⚠️ **TWO OF THE FOUR WERE RE-AIMED BY 0283 AND ONE WAS RETIRED**, because that decision replaced
// the drawing they broke: the whole animal was one baked bitmap, and the body is a chain of entities
// now. What 0277 CLAIMED is unchanged and is still broken here — the shots leave the face, and the
// aura stays inside its own tile — but the lines that state those things are different lines.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0277',
    suite: 'tests/serpent.test.ts',
    /*
      ⚠️ **RE-AIMED BY 0283.** The break used to be *the muzzle offset dropped*, which put the shot at
      the middle of a fifty-six-unit sprite. The hull is the SKULL now and its centre IS the mouth, so
      that edit changes nothing at all — the equivalent mistake is laying the body the wrong way round,
      which puts the animal in front of its own face and its shots out of its tail. A sign.
    */
    broke: 'the body laid down-lane of the head, so the animal’s shots leave its tail',
    guard: 'THE MOUTH: the acid and the void leave the serpent’s SKULL, and not the middle of its body',
    edit: {
      path: 'src/app/frame.ts',
      find: '    node.along = head.along + offset;',
      replace: '    node.along = head.along - offset;',
    },
  },
  {
    decision: '0277',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ **RE-AIMED BY 0283.** The aura was a set of blown-out copies of the whole animal's outline;
      it is a set of rings round one node now. The break is the same break — a halo let off its leash,
      running out of its own bitmap and into the next one in the atlas.
    */
    broke: 'the serpent’s aura swelling past its own tile, so a halo runs into the next bitmap in the atlas',
    guard: 'and a translucent mark — a plume, a halo — stays inside the sprite’s own box',
    edit: {
      path: 'src/render/bake.ts',
      find: '    [1.44, 0.06],',
      replace: '    [2.6, 0.06],',
    },
  },
  /*
    ⚠️ **AND ONE PROBE IS RETIRED RATHER THAN RE-AIMED: *the row no longer naming a mouth*.** 0277's
    rule — *a boss row says where its shots leave the hull* — still stands and `BossRow.muzzle` is
    still there, but 0283 makes the serpent's hull its skull and **every row in the game now says
    `null`**, because no hull left has its face away from its own centre. There is no row to empty.

    The field is kept rather than deleted because the next creature redrawn on the chain — a hydra's
    necks, a fish's snout — is exactly the shape that needs one, and `docs/decisions/0283` says so.
    What holds the claim meanwhile is the probe above, which breaks where the face IS.
  */
];
