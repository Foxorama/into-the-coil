// The breaks behind docs/decisions/0223-a-place-has-a-palette.md.
//
// ⚠️ THE REPORT WAS A DESCRIPTION OF THE CODE. *"The backgrounds are looking good, but they're still a
// solo colour. saurian is green, nebula is purple. give me vibrant living levels, not static basic
// backdrops."* Every cloud, crest, rim and wall face in a place came out of `THEMES[theme].nebula` — a
// single hex — so a place could be thicker or thinner, busier or emptier, and never VARIED. 0220, 0221
// and 0222 each added structure to places that were monochrome by construction.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0223',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE REPORT ITSELF, AND IT IS THE EASIEST MISTAKE TO MAKE. A lighter version of the body colour
      looks like a sensible accent in a table and draws as *the same place, brighter* — which is what
      every place already was, since a cloud at 0.2 alpha and one at 0.4 are one hue at two weights.
      The claim is about HUE, so the break is a tint.
    */
    broke: 'a place’s accent made a tint of its own body, which is the solo colour that was reported',
    guard: 'a place’s accent is a different HUE',
    edit: {
      path: 'src/content/themes.ts',
      find: "    glow: { vivid: '#c25a2a', 'high-contrast': '#5c2a12' },",
      replace: "    glow: { vivid: '#a85a88', 'high-contrast': '#5c2a12' },",
    },
  },
  {
    decision: '0223',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ 0195's CLAIM ONE TABLE ALONG. *"A level specific backdrop instead of the same starry canvas and
      a slight hue change on each level"* was answered for the star fields and for the structure; a
      second colour that two places shared puts the same light on both, and the accent is now the single
      loudest thing on a place's screen.
    */
    broke: 'two places lit with the same accent, so the light stops saying which place it is',
    guard: 'no two places share an accent',
    edit: {
      path: 'src/content/themes.ts',
      find: "    glow: { vivid: '#3d8f78', 'high-contrast': '#2a5a4a' },",
      replace: "    glow: { vivid: '#4ad85a', 'high-contrast': '#2a5a4a' },",
    },
  },
  {
    decision: '0223',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ TWO COLOURS IN A TABLE ARE NOT TWO COLOURS ON A SCREEN, AND A ROLL IS HOW THAT HAPPENS. The
      first version of this was `rng.range(0, 1) < 0.34` and **Saurian Belt came out with none at all**
      — it carries five clouds, and a third of five is a coin that can miss five times. Nothing about
      the table changes; the place simply never draws its second colour.
    */
    broke: 'the accent rolled per cloud rather than walked, so a small field can come up with none',
    guard: 'the clouds actually MIX',
    edit: {
      path: 'src/render/bake.ts',
      find: '      glow: i % 3 === 1,',
      replace: '      glow: rng.range(0, 1) < 0.34,',
    },
  },
  {
    decision: '0223',
    suite: 'tests/sky.test.ts',
    /*
      ⚠️ THE FLOOR MEASURED AGAINST THE CHEAPER HALF OF THE SKY. A place has two gas colours now and
      every LIT mark in it is drawn in the accent — which is the brighter one by design. Blending the
      backdrop against the body alone is 0222's own finding about `cloudCover` arriving one field
      later: **a measurement that understates is invisible to everything built on it.**
    */
    /*
      ⚠️ AND IT HAS TO BREAK THE PLACE WITH THE LEAST ROOM, WHICH THE FIRST VERSION DID NOT. It
      brightened The Black Heart's accent to near-white and came back **STILL GREEN** — that place has
      1.61× the floor and carries only 0.24 cover, so it can afford almost any colour. Rime Shelf sits
      at 1.10× and is the one an accent can actually overspend, which is also why it is the one this
      pass kept having to pull back.
    */
    broke: 'the floor measured against a place’s body colour rather than whichever is louder',
    guard: 'every ink clears the floor against the backdrop WITH EVERYTHING THE SKY DRAWS ON IT',
    edit: {
      path: 'src/content/themes.ts',
      find: "    glow: { vivid: '#3d8f78', 'high-contrast': '#2a5a4a' },",
      replace: "    glow: { vivid: '#cfeee0', 'high-contrast': '#2a5a4a' },",
    },
  },
];
