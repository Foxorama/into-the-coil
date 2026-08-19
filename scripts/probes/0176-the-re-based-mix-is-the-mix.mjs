// The breaks behind docs/decisions/0176-the-re-based-mix-is-the-mix.md.
//
// ⚠️ THE FIRST ONE IS THE MIX THE GAME PLAYED FOR ITS WHOLE LIFE. With `REBASE` ignored, `mixOf` is
// the hand's tint again and the balance a player chose by ear is gone — while every table still
// reads as though it were there, which is what makes it worth a break rather than a comment.
//
// ⚠️ THE SECOND IS THE ONE THAT WOULD HAVE SHIPPED SILENTLY. `MIX_CEILING` clamps at 2.6 and the
// re-base runs to 12.19, so applying the band to the PRODUCT rather than to the tint quietly deletes
// most of the balance — and leaves every number in the table looking authored. It lands on 0164's
// floor rather than on the clip guard, which is the right place: what a clamped balance costs is the
// layers it re-buries. 0164's own header records `arp` being driven into that wall twice while the
// wall said nothing.
//
// ⚠️ AND THE THIRD IS THE SHAPER MODELLED AS THE GAME DOES NOT HAVE IT. A `WaveShaperNode`'s curve is
// defined over [-1, 1] and the browser clamps anything outside it, so a guard calling `saturate`
// unclamped is measuring a shaper with no clamp — which reports 1.0062 of full scale where the
// speaker produces 1.0000.
//
// ⚠️ AND ONE BREAK IS DELIBERATELY ABSENT, WHICH 0019 ASKS TO BE WRITTEN DOWN. Routing the clip guard
// through `rungOf` — the fifth ladder-blind reader — is a correction with no probe, because putting
// the blindness back leaves the suite GREEN: no place's own ladder currently drives its bus nearer
// the clamp than the shared one does. The fix is right and it is not load-bearing today, and a probe
// pointed at it would be theatre.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0176',
    suite: 'tests/themes.test.ts',
    broke: 'the solved balance dropped, so the game plays the mix the player did not choose',
    guard: 'and the clamp agrees with the guard, so a bad row cannot merely be quietly fixed',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return tint * (REBASE[theme][layer] ?? 1);',
      replace: '  return tint;',
    },
  },
  {
    decision: '0176',
    suite: 'tests/themes.test.ts',
    broke: "the hand's band applied to the product, which clamps the balance away at 2.6",
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return tint * (REBASE[theme][layer] ?? 1);',
      replace:
        '  const all = tint * (REBASE[theme][layer] ?? 1);\n' +
        '  return all < MIX_FLOOR ? MIX_FLOOR : all > MIX_CEILING ? MIX_CEILING : all;',
    },
  },
  {
    decision: '0176',
    suite: 'tests/themes.test.ts',
    broke: 'the shaper modelled without the browser’s clamp, which is a shaper the game does not have',
    guard: 'and no theme at any rung drives the bus past full scale',
    edit: {
      path: 'tests/themes.test.ts',
      find: '          const shaped = Math.abs(saturate(driven < -1 ? -1 : driven > 1 ? 1 : driven, MUSIC_DRIVE));',
      replace: '          const shaped = Math.abs(saturate(driven, MUSIC_DRIVE));',
    },
  },
];
