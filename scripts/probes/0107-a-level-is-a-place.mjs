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
      find: "    boss: 'harrow',\n    theme: 'nebula',",
      replace: "    boss: 'harrow',\n    theme: 'approach',",
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
      find: "    space: { vivid: '#0b1206', 'high-contrast': '#010500' },",
      replace: "    space: { vivid: '#0b1206', 'high-contrast': '#6a7a40' },",
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
      find: "    space: { vivid: '#121006', 'high-contrast': '#040300' },",
      replace: "    space: { vivid: '#3c4a20', 'high-contrast': '#040300' },",
    },
  },
  {
    decision: '0107',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ A THEME THAT CLOSES A LAYER OUTRIGHT. Zero is the obvious way to say *this place does not use
      that layer* — and it breaks 0102's *every rung adds something* from a table whose subject is
      colour, which that guard never reads. A place leans; it does not remove.

      ⚠️ ANCHORED ON A CONSTANT'S NAME AND NOT ON A NUMBER, WHICH IS THIS PROBE'S SECOND RE-ANCHORING
      — docs/decisions/0147-a-place-is-a-balance.md. It was pinned to `arp: 1.24` and went orphaned on
      the very next tuning pass, exactly as 0146 had just written down about two other probes and then
      re-pinned this one to a number anyway. `voices: SAURIAN_VOICES` is a symbol; a mix value is a
      thing a hand is expected to move.
    */
    broke: 'a theme silencing a layer outright, so the ladder stops being additive from a colour table',
    guard: 'keeps every multiplier inside the band the mix can pay for',
    edit: {
      path: 'src/content/themes.ts',
      find: '    },\n    voices: SAURIAN_VOICES,',
      replace: '      beat: 0,\n    },\n    voices: SAURIAN_VOICES,',
    },
  },
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
      find: '  const want = THEMES[theme].mix[layer] ?? 1;',
      replace: '  const want = 1;',
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
