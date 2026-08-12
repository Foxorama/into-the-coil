// The breaks behind docs/decisions/0126-the-dashboard-is-the-instrument.md.
//
// ⚠️ EVERY ONE OF THESE IS A WAY AN INSTRUMENT COMES APART FROM THE THING IT MEASURES, and this
// repository has shipped two of them: docs/decisions/0104 found the rig missing the bus shaper and
// under-reporting by 4.5 dB, and docs/decisions/0114 found two modes rendering the same music at two
// reference levels — "a massive musical volume difference" reported as a defect in the music and one
// instruction away from being tuned as one. A wrong instrument is worse than none, because it still
// produces a number.
//
// ⚠️ AND docs/decisions/0116 RECORDS WHAT A GUARD OVER A RIG MUST NOT BE. Its first draft asserted
// that a WORD appeared in a file, and `npm run prove` reported STILL GREEN on two of three, because
// deleting a call site leaves the import behind. Each break below removes a VALUE, so a guard that
// only reads the source text cannot catch it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0126',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ THE RIG KEEPING ITS OWN IDEA OF THE LEVEL. `scripts/hear.mjs --music` did exactly this — it
      typed the rung order into the file — and the consequence was that every boundary landed at a
      phrase by construction, so six rounds of "repetitive" and "push and surge sound the same" were
      judged against a file that could not exhibit the defect (0116). A hard-coded rung looks like a
      simplification and is the whole failure.
    */
    broke: 'the rung read from a table the dashboard keeps, rather than asked of the game',
    guard: 'THE RUNG IS THE GAME’S ANSWER, never a table the dashboard keeps',
    edit: {
      path: 'rig/transport.ts',
      find: '  const rung = rungAt(kind, second, fightSeconds);',
      replace: "  const rung = second < 35 ? 'run' : second < 120 ? 'push' : 'boss';",
    },
  },
  {
    decision: '0126',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ THE PLACE DROPPED, WHICH IS THE ONE NO MODE OF THE WAV RIG EVER APPLIED. Until 0116 nothing
      called `mixOf`, so every file this project listened to was level one's mix — including the ones
      used to judge "it doesn't change per level". A dashboard with a level selector that renders all
      seven identically would be that defect with a control on it.
    */
    broke: 'the level’s own place dropped, so all seven render as level one',
    guard: 'THE PLACE IS IN IT: two themes do not produce the same gains',
    /*
      ⚠️ THE FIRST VERSION OF THIS PROBE WENT RED ON THE WRONG TEST, and the reason is worth more
      than the probe. It replaced the theme at the point the TARGET is computed — and the guard below
      it compares each target against `levelWrites(moment.rung, moment.theme, …)`, so a rig lying
      about its theme consistently is a rig that still agrees with itself. What that guard holds is
      that the dashboard's arithmetic is the mixer's; what THIS one holds is that the level selector
      selects something. Two different claims, and 0019's other half — a probe must break the thing
      its guard is about — is what separated them.
    */
    edit: {
      path: 'rig/transport.ts',
      find: '  const theme = level.theme;',
      replace: '  const theme = LEVELS.approach.theme;',
    },
  },
  {
    decision: '0126',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ THE DASHBOARD COMPUTING THE MIX ITSELF. This is the drift in its purest form: the formula
      below is CORRECT for level one, where the theme multiplies nothing, and wrong for the other
      six — so the instrument would agree with the game on the only level anybody had rendered and
      quietly disagree everywhere else. That is 0116's finding restated as code.
    */
    broke: 'the target worked out in the rig rather than asked of the mixer’s own description',
    guard: 'EVERY LAYER’S TARGET IS THE ONE `levelWrites` WOULD SCHEDULE, to the last decimal',
    edit: {
      path: 'rig/transport.ts',
      find: '    const target = targetGain(theme, rung, layer, aura);',
      replace: '    const target = MUSIC_LADDER[rung][layer] * (AURA_LAYERS.includes(layer) ? aura : 1);',
    },
  },
  {
    decision: '0126',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ AN ARRIVAL AND A RISE MERGED INTO ONE WORD. docs/decisions/0125 split the game's four rung
      changes by half and found a perfect division: +70 and +64 arriving notes are heard, +20 and +4
      are not, whatever leaves alongside them. A readout that called both "opening" would hide the
      only quantity that has ever predicted the player's verdict — and it would look tidier.
    */
    broke: 'a layer that merely got louder reported as an arrival',
    guard: 'a layer that was already playing is never reported as OPENING',
    edit: {
      path: 'rig/transport.ts',
      find: '  if (previous <= 0) return \'opening\';',
      replace: '  if (target > previous) return \'opening\';',
    },
  },
  {
    decision: '0126',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ A LOOP LENGTH RESTATED RATHER THAN READ. The whole coverage table is `longest run ÷ this
      layer's own loop`, so a wrong denominator makes every row plausible and every row wrong — and
      the numbers would go on looking reasonable for ever, because nothing else in the repository
      prints them. docs/decisions/0095 is why the lengths differ per layer at all.
    */
    broke: 'every layer measured against one loop length instead of its own',
    guard: 'a span’s bounds are the RUNG MARKS and its length is the content’s',
    edit: {
      path: 'rig/transport.ts',
      find: '    const loopSeconds = LAYER_BARS[layer] * BAR_SECONDS;',
      replace: '    const loopSeconds = 4 * BAR_SECONDS;',
    },
  },
  {
    decision: '0126',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ A TIER THAT CLIMBS ONE LADDER. docs/decisions/0083 made them two of exactly four, and the
      dashboard's tier slider is the control the player asked for by name ("overlay weapons fire and
      weapon tiers over it"). A slider that moved the gun and left the tubes behind would put the
      wrong ship over every mix judged with it.
    */
    broke: 'a tier raised the guns and not the tubes',
    guard: 'A TIER IS BOTH LADDERS, and it is the game’s own resolution of them',
    edit: {
      path: 'rig/transport.ts',
      find: "  for (let i = 0; i < clamped; i++) carried.push('weapon', 'missile');",
      replace: "  for (let i = 0; i < clamped; i++) carried.push('weapon');",
    },
  },
  {
    decision: '0126',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ THE GUN'S CADENCE TYPED IN. It is four numbers up the ladder (src/content/ships.ts) and the
      rig's job is to lay the right one over the bed. A literal is right for exactly one tier, and
      the slider beside it would go on moving.
    */
    broke: 'the pulse laid down at a cadence typed into the rig',
    guard: 'THE GUN’S CADENCE IS THE SHIP’S, never a number typed into the rig',
    edit: {
      path: 'rig/transport.ts',
      find: "    { kind: 'pulse', every: weapon.fireEvery, perSecond: per(weapon.fireEvery), sounds: true },",
      replace: "    { kind: 'pulse', every: 8, perSecond: per(8), sounds: true },",
    },
  },
  {
    decision: '0126',
    suite: 'tests/dash.test.ts',
    /*
      ⚠️ THE SHELL REACHING INTO A LAYER'S GAIN. `gainOf` is added for `rig/` and for nothing else;
      the moment a frame writes one, docs/decisions/0092's single hand on the mix becomes two and
      `levelWrites` stops being the whole story of what a layer is doing. The scan is over the import
      graph rather than over intentions, which is the shape docs/decisions/0070 chose deliberately.
    */
    broke: 'the shell reaching into a music layer’s gain, so the mix is decided in two places',
    guard: 'NOTHING UNDER src/ CALLS `gainOf` — the mix is decided in one place',
    edit: {
      path: 'src/app/sound.ts',
      find: '      music?.duck(amount);',
      replace: '      music?.gainOf(\'drone\');\n      music?.duck(amount);',
    },
  },
];
