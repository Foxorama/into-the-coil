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
      find: "    space: { vivid: '#170d08', 'high-contrast': '#080200' },",
      replace: "    space: { vivid: '#170d08', 'high-contrast': '#6a5030' },",
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
      find: "    space: { vivid: '#0f1408', 'high-contrast': '#020600' },",
      replace: "    space: { vivid: '#3c4a20', 'high-contrast': '#020600' },",
    },
  },
  {
    decision: '0107',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ A THEME THAT CLOSES A LAYER THE LADDER OPENED. Zero is the obvious way to say *this place
      does not use the arp* — and it breaks 0090's *the ladder only ever opens layers* and 0102's
      *every rung adds something* from a table whose subject is colour, which neither of those guards
      reads. A place leans; it does not remove.
    */
    broke: 'a theme silencing a layer outright, so the ladder stops being additive from a colour table',
    guard: 'keeps every multiplier inside the band the mix can pay for',
    edit: {
      path: 'src/content/themes.ts',
      find: '    mix: { arp: 1.4, hook: 1.25, drone: 0.55, engine: 1.1, groove: 0.8 },',
      replace: '    mix: { arp: 0, hook: 1.25, drone: 0.55, engine: 1.1, groove: 0.8 },',
    },
  },
  {
    decision: '0107',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE TABLE FILLED IN AND MEANING NOTHING, which is the failure a new file is most likely to
      have: seven rows, seven names, seven backdrops, and a mix that is empty everywhere. Every other
      assertion here is green over it and the music is byte for byte what the report complained about.
    */
    broke: 'every theme given an empty mix, so the places look different and sound identical',
    guard: 'and every theme actually sounds different from the one that changes nothing',
    edit: {
      path: 'src/content/themes.ts',
      find: '    mix: { drone: 1.4, lead: 1.2, drive: 1.15, engine: 1.1, hook: 1.1 },',
      replace: '    mix: {},',
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
