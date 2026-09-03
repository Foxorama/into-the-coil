// The breaks behind docs/decisions/0107-a-level-is-a-place.md.
//
// ⚠️ THE FIRST IS THE SHIPPED GAME, RESTORED — seven levels in one room, which is the report:
// *"the same music and boss music repeats level after level after level."* Every guard in the
// repository was green on it, because until this decision nothing anywhere asked whether two levels
// were distinguishable at all.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0107',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE REPORTED ONE. Two levels handed the same place, which is the state the whole run was in
      and is the edit a hand makes when adding an eighth level in a hurry. Nothing else in the
      repository can see it: the theme is valid, its backdrop clears every contrast floor, its mix is
      inside the band, and the run plays one room twice.
    */
    broke: 'two levels given the same place, which is the run the report is about',
    guard: 'THE REPORTED ONE: every level names a theme, and the run does not repeat one',
    edit: {
      path: 'src/content/levels.ts',
      // ⚠️ Re-anchored by 0203, which put Ember Nebula's landmarks between the boss and the theme.
      find: "    theme: 'nebula',",
      replace: "    theme: 'approach',",
    },
  },
  {
    decision: '0107',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ A THEME THAT OVERRIDES AN ACCESSIBILITY CHOICE, which is the one thing a cosmetic must never
      do — `docs/decisions/0024-the-accessibility-floor-is-settings.md`. High contrast is a SETTING a
      player chose; a backdrop authored without checking it is a level quietly taking that back, and
      it is the most plausible mistake in this whole table because the vivid one looks fine.
    */
    broke: 'a backdrop authored against the vivid palette only, so high contrast loses its floor',
    guard: 'and every backdrop keeps every ink legible, in every palette',
    edit: {
      path: 'src/content/themes.ts',
      // ⚠️ RE-ANCHORED BY 0221: The Toxic Mire is a planet now and its backdrop is the air between a
      // canopy and a pool rather than a void. The break is unchanged — high contrast handed a colour
      // authored for the vivid palette, which is a place overriding a choice the player made.
      find: "    space: { vivid: '#111a08', 'high-contrast': '#040701' },",
      replace: "    space: { vivid: '#111a08', 'high-contrast': '#6a7a40' },",
    },
  },
  {
    decision: '0107',
    suite: 'tests/themes.test.ts',
    // ⚠️ A BACKDROP THAT CLEARS THE CONTRAST FLOOR AND IS STILL WRONG: bright enough that the
    // starfield vanishes into it. 0065 draws the sky to sit just above the void rather than to be
    // legible on anything, so *dark* is a property a theme has to keep and luminance alone cannot say.
    broke: 'a backdrop brightened until the sky has nothing to sit above',
    guard: 'and a backdrop is a dark, because the void is what everything is found against',
    edit: {
      path: 'src/content/themes.ts',
      /*
        ⚠️ RE-ANCHORED BY 0221, AND THE BREAK HAD TO GET BRIGHTER. Saurian Belt's backdrop is a blue
        sky now rather than a near-black — measured at `enemy` 4.07:1 against a floor of 3, which is
        the bluest a place can afford. `#3c4a20` was a brightening when the baseline was `#121006` and
        is a DARKENING now, so the old replacement would have left the guard green while looking like
        the same probe. **Re-pointing an anchor without re-reading the break is how a probe survives
        `tests/prove-guard.test.ts` and stops proving anything** — 0220's own worked example.
      */
      find: "    space: { vivid: '#16305a', 'high-contrast': '#050b16' },",
      replace: "    space: { vivid: '#7f9fd8', 'high-contrast': '#050b16' },",
    },
  },
  /*
    ── A THEME THAT CLOSES A LAYER OUTRIGHT IS RETIRED, BECAUSE IT IS NOW A LEGAL SENTENCE ─────────

    ⚠️ docs/decisions/0182-a-mix-number-has-no-band.md. This break wrote `beat: 0` into a place's mix
    and fired `keeps every multiplier inside the band the mix can pay for`. Both are gone. The claim
    it made — *a place leans; it does not remove* — stopped being true at
    docs/decisions/0162-a-place-has-its-own-ladder.md, which made closing a layer a thing a place
    states outright; the mix floor was guarding a second spelling of it and nothing else.

    ⚠️ RETIRED RATHER THAN RE-AIMED, ON 0161's PRECEDENT. That decision retired 0102's density probe
    with its guard, for the same reason: the break describes an authoring choice now, and a probe
    pointed at a legal choice is theatre. The other four breaks in this file are untouched.
  */

  {
    decision: '0107',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE MIX TABLE STOPPED BEING READ, WHICH IS THE WHOLE MECHANISM FAILING SILENTLY. `mixOf`
      hands back 1 for everything: every backdrop still differs, every place still states its own
      material, and all seven play one balance — which is precisely the state
      docs/decisions/0147-a-place-is-a-balance.md was written about, reachable in one line.

      ⚠️ ANCHORED ON CODE AND NOT ON THE TABLE, WHICH IS THE THIRD ANCHOR THIS PROBE HAS HAD. It
      emptied `core`'s mix (orphaned by 0146's tuning), then wrote a mix onto the neutral row
      (orphaned by 0147 giving level one a balance of its own). A probe whose subject is *the table is
      honoured* belongs on the function that honours it.
    */
    broke: 'the mix table stopped being read, so seven places play one balance',
    guard: 'and every theme actually sounds different from the one that changes nothing',
    edit: {
      path: 'src/content/themes.ts',
      // ⚠️ RE-AIMED BY 0176: `mixOf` is the hand's tint TIMES the solved balance now, so blanking the
      // row alone left `REBASE` still telling the seven places apart and the guard correctly silent.
      // *The mix table stopped being read* has to mean the product.
      //
      // ⚠️ AND RE-ANCHORED BY 0182, WHICH TOOK THE CLAMP OUT FROM BETWEEN THE TWO FACTORS. The line is
      // the same product with no `tint` local in front of it; the break is unchanged.
      find: '  return (THEMES[theme].mix[layer] ?? 1) * (REBASE[theme][layer] ?? 1) * (THEMES[theme].trim ?? 1);',
      replace: '  return 1;',
    },
  },
  {
    decision: '0107',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE BUILD THAT NEVER STARTS, which is the state the aura shipped in: it existed only while a
      boss was on the field. *"The aura music for the boss needs to start about 15-30secs into the
      start of a level and then amp up until you beat the boss."*
    */
    broke: 'the level-long build switched off, so the aura is a proximity cue again',
    guard: '0107 — and the build is a level-long climb that starts after the opening',
    edit: {
      path: 'src/app/music.ts',
      find: '  const through = (cameraAlong - from) / (bossAt - from);',
      replace: '  const through = 0;',
    },
  },
  {
    decision: '0107',
    suite: 'tests/music.test.ts',
    // ⚠️ THE ONSET DROPPED, so a level opens with the boss already audible — which takes away the
    // twenty seconds 0043 gives the player to find the controls before anything finds them.
    broke: 'the onset removed, so a level opens with the boss already audible',
    guard: '0107 — and the build is a level-long climb that starts after the opening',
    edit: {
      path: 'src/content/music.ts',
      find: 'export const AURA_ONSET_UNITS = 720;',
      replace: 'export const AURA_ONSET_UNITS = 0;',
    },
  },
  {
    decision: '0107',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE TWO CLAIMS ON THE AURA ADDED RATHER THAN MAXED, which is the arithmetic every reasonable
      person writes first — and it puts the aura past its ceiling the moment a player closes on a boss
      at the end of a long level, which is every boss fight in the game.
    */
    broke: 'the build and the proximity summed, so the aura exceeds the ceiling it is measured against',
    guard: '0107 — and the two claims on the aura are combined by a MAXIMUM, never a sum',
    edit: {
      path: 'src/app/music.ts',
      find: '  return build > nearness ? build : nearness;',
      replace: '  return build + nearness;',
    },
  },
];
