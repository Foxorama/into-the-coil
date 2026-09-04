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
    // ⚠️ RE-ANCHORED BY 0182: the clamp is gone, so the guard is no longer named after agreeing
    // with it. Its subject — the product is the hand's row TIMES `REBASE` — is what this break
    // removes, and that is unchanged.
    guard: 'and an unstated layer is left alone, times the balance the player chose',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return (THEMES[theme].mix[layer] ?? 1) * (REBASE[theme][layer] ?? 1) * (THEMES[theme].trim ?? 1);',
      replace: '  return THEMES[theme].mix[layer] ?? 1;',
    },
  },
  {
    decision: '0176',
    suite: 'tests/themes.test.ts',
    broke: "the hand's band applied to the product, which clamps the balance away at 2.6",
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return (THEMES[theme].mix[layer] ?? 1) * (REBASE[theme][layer] ?? 1) * (THEMES[theme].trim ?? 1);',
      // ⚠️ THE BAND IS TYPED HERE NOW, BECAUSE 0182 DELETED THE CONSTANTS. The break is what it
      // always was — the balance clamped at the old ceiling — and the point it makes is the one
      // that ended the wall: 2.6 against a re-base running to 12.19 re-buries what 0164 counts.
      replace:
        '  const all = (THEMES[theme].mix[layer] ?? 1) * (REBASE[theme][layer] ?? 1);\n' +
        '  return all < 0.22 ? 0.22 : all > 2.6 ? 2.6 : all;',
    },
  },
  /*
    ── A THIRD PROBE STOOD HERE AND 0226 RETIRED IT ────────────────────────────────────────────────

    ⚠️ "THE SHAPER MODELLED WITHOUT THE BROWSER'S CLAMP" removed the `[-1, 1]` clamp from
    tests/themes.test.ts's peak measure and expected *no theme drives the bus past full scale* to go
    red. It cannot any more: docs/decisions/0226-the-level-holds-one-loudness.md holds every rung to
    its `run`, and the loudest sample reaching the shaper anywhere in the game is now **0.969** —
    Saurian Belt's `surge` — so a clamp that never engages is a clamp whose absence measures as
    nothing. The model still clamps, and the reason it must is still 0176's; what is gone is the
    headroom that let a probe show it. A probe whose break the tree cannot see is what
    docs/decisions/0005-a-guard-must-be-seen-to-fail.md says not to keep.
  */
];
