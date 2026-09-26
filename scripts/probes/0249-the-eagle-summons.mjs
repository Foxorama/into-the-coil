// The eagle summons — docs/decisions/0249-the-eagle-summons.md
//
// Every guard 0249 adds, broken on purpose. `node scripts/prove-guard.mjs 0249`.

export const PROBES = [
  {
    decision: '0249',
    suite: 'tests/volans.test.ts',
    // The lash's reach authored to nothing: every flame at one speed, which is a fan.
    broke: 'the whip’s tip no faster than its root, so the lash is a fan',
    guard: 'THE WHIP: one volley is a lash',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0317, which moved the whip to the third phase and widened its arc.
      find: "shot: 'flame', attack: { kind: 'whip', sweep: 1.3, reach: 0.9 } },",
      replace: "shot: 'flame', attack: { kind: 'whip', sweep: 1.3, reach: 0 } },",
    },
  },
  {
    decision: '0249',
    suite: 'tests/volans.test.ts',
    // The flame inked as the player's own bullet.
    broke: 'the flame drawn in the player’s own bullet ink',
    guard: 'THE WHIP: one volley is a lash',
    edit: {
      path: 'src/render/bake.ts',
      find: "  flame: 'fire',",
      replace: "  flame: 'bullet',",
    },
  },
  {
    decision: '0249',
    suite: 'tests/volans.test.ts',
    // The summons asked for and never answered: the frame's half removed.
    broke: 'the summons never answered, so a volley calls nobody',
    guard: 'THE SUMMONS: a volley at the last sixth',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0262, which added where a summons comes from and which side, and again by
      // 0270, which put a ceiling on the horde and so gave the call a `room` to spend.
      find: '      summonAdds(w, calling.enemy, Math.min(boss.turnsLeft, room), calling.formation, calling.from, boss.spin);\n',
      replace: '',
    },
  },
  {
    decision: '0249',
    suite: 'tests/volans.test.ts',
    // The adds put behind the camera, where a wave never arrives.
    // ⚠️ Re-aimed by 0262 onto the flank placement, and by 0373 onto the mouth's: the fish's calls
    // come out of its mouth now, so the break is the spat body placed at the camera — behind the
    // ship — rather than at the snout. `npm run prove` reported the flank version STILL GREEN, because
    // no call of the fish's reaches that line any more.
    broke: 'the adds placed at the camera rather than ahead of the ship',
    guard: 'THE SUMMONS: a volley at the last sixth',
    edit: {
      path: 'src/app/frame.ts',
      find: '      reset(e, mouthAlongOf(w, lord), mouthAcrossOf(w, lord), row, kind);',
      replace: '      reset(e, w.cameraAlong, mouthAcrossOf(w, lord), row, kind);',
    },
  },
  /*
    ⚠️ A PROBE WENT HERE WITH THE RULE IT BROKE — docs/decisions/0373-the-fish-spits-its-adds.md. *The
    kite given a gun, so the horde is a wall of bullets* held 0249's *a horde that shoots is a wall*;
    the ask reversed it — *"adds should be firing"* — and the kite has a gun now. 0373's probe takes
    it away instead.
  */
];
