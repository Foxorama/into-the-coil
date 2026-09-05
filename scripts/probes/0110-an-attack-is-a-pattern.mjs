// The breaks behind docs/decisions/0110-an-attack-is-a-pattern.md.
//
// ⚠️ THE FIRST IS THE SHIPPED GAME, RESTORED — every body in the game firing at the ship, which is
// what `fireEnemies` did from the day enemies could shoot until this decision. Nothing in the
// repository could see it, because nothing had ever asked what an attack IS.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0110',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ THE REPORTED ONE. It was *the turret put back on an aimed shot*, which tipped a roster of
      five shooters back to a majority that points at the player — and 0232 doubled the roster, so
      the turret alone no longer tips it: seven of ten still send a pattern with the turret aimed.
      That is worth knowing about the field. What reaches the guard now is six of the eight
      patterned shooters leaving the roster, which puts the four that remain at two and two — the
      edit a hand makes trimming the kinds list without reading what each kind sends.

      ⚠️ Re-aimed by 0258: with one pilot a level, two of ten shooters aim (the moth and the gaze)
      and eight send a pattern, so the old break — four kinds off the roster — left five patterned
      against one aimed and the guard green.
    */
    broke: 'six of the eight patterned shooters dropped from the roster, so half of what shoots points at the player',
    guard: 'THE REPORTED ONE: most of what shoots is not aimed at the player',
    edit: {
      path: 'src/content/enemies.ts',
      find: "  'lancer',\n  'weaver',\n  'turret',\n  'charger',\n  'warden',\n  'spinner',\n  'sower',\n  'picket',\n  'moth',\n  'raptor',\n  'kite',\n  'moonJelly',\n  'sentry',\n",
      replace: "  'weaver',\n  'charger',\n  'picket',\n  'moth',\n  'raptor',\n  'kite',\n  'moonJelly',\n",
    },
  },
  {
    decision: '0110',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ A SPRAY CENTRED ON THE SHIP, which is the single most plausible mistake in this whole change
      and the hardest to see by reading. It is still a fan, still three shots, still the authored
      spread — and it is *aimed*, because the whole shape follows the player. Every count-shaped
      assertion in the file passes over it.
    */
    broke: 'the fan centred on the ship rather than on the lane, so a pattern is a spread again',
    guard: 'and a pattern is the same pattern wherever the player is, which is what makes it one',
    edit: {
      path: 'src/app/frame.ts',
      find: '        const first = Math.PI - (step * (attack.shots - 1)) / 2;',
      replace:
        '        const first = Math.atan2(ship.across - e.across, ship.along - e.along) - (step * (attack.shots - 1)) / 2;',
    },
  },
  {
    decision: '0110',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ THE HOLE FILLED IN — an off-by-one at the loop's start, which is the most ordinary bug there
      is and turns the one readable attack in the game into a solid line across the lane. It is
      unsurvivable rather than hard, and every other guard says the wall is fine.
    */
    broke: 'the wall closed over its own gap, so there is nowhere to be',
    guard: 'and a wall leaves a hole where the body is, which is the one thing a player can read early',
    edit: {
      path: 'src/app/frame.ts',
      find: '        for (let s = 1; s <= attack.shots; s++) {',
      replace: '        for (let s = 0; s <= attack.shots; s++) {',
    },
  },
  {
    decision: '0110',
    suite: 'tests/pilots.test.ts',
    /*
      ⚠️ THE PHASE ASSIGNED RATHER THAN ADVANCED — one character, and the spiral becomes a fixed fan
      wearing a spiral's name. It still has three shots, still comes out at an angle nobody aimed, and
      still passes the *is it a pattern* guard, because a fixed fan is a perfectly good pattern.
    */
    broke: 'the ring stopped turning, so a spiral is a fan that repeats for ever',
    guard: 'and a turning pattern turns, and two bodies of one wave do not turn together',
    edit: {
      path: 'src/app/frame.ts',
      find: '        e.firePhase += attack.turn;',
      replace: '        e.firePhase = attack.turn;',
    },
  },
  {
    decision: '0110',
    suite: 'tests/spawns.test.ts',
    /*
      ⚠️ THE VOLLEY SIZE FORGOTTEN, which is the shape of the mistake this whole decision creates in
      every guard that used to be able to assume one body, one bullet. `shotsPerVolley` is the single
      description that stops it; a copy of the old assumption inside it puts the count back.
    */
    broke: 'a volley counted as one bullet again, so three shots from one body read as three bodies',
    guard: '0098 — THE REPORTED ONE: a formation opens fire as a figure rather than as one volley',
    edit: {
      path: 'src/content/enemies.ts',
      find: '    case \'spray\':\n      return attack.shots;',
      replace: '    case \'spray\':\n      return 1;',
    },
  },
];
