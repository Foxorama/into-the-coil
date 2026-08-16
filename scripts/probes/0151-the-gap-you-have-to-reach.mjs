// The breaks behind docs/decisions/0151-the-gap-you-have-to-reach.md.
//
// ⚠️ THE THREE THAT MATTER ARE THE THREE WAYS THIS ATTACK STOPS BEING A CHALLENGE, and each of them
// leaves the table looking completely correct: a hole too narrow to fly through, a hole nobody can
// reach from the far wall, and — the one this decision exists for — A HOLE THAT FOLLOWS THE SHIP.
// That last was built, and refused from play: *"a variable hole that spawns close to the ship negates
// the entire difficulty of the obstacle… there's not really a point in that wall challenge at all."*
// It passes every other assertion in the suite, which is what makes it worth a probe.
//
// ⚠️ THE PLAYER'S OWN LINE IS THE ONE THESE ARE WRITTEN AGAINST: *"is this unfair OR is this a
// learnable strategy"*. A static hole is learnable; a static hole nobody can get to is not, and a
// hole that comes to you is neither because there is nothing to learn.
//
// ⚠️ AND THE REST ARE THE MECHANISM NOT REACHING THE FIELD. Everything about an uncoil is arithmetic
// over a row until `throwCurtain` is called, and 0150's own probe set found exactly this shape of gap
// one layer down — a guard that was satisfied by the table rather than by the code.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0151',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE HOLE TOO NARROW TO FLY THROUGH. A ship needs 5.8 units of clear air and this leaves it 4 —
      which is a curtain that LOOKS like it has a way out, and is 0150's undodgeable one with a
      decoration on it. The number moved is exactly the kind a hand picks for tidiness.
    */
    broke: 'the hole narrowed to less than the ship, so the way out is not one',
    guard: 'THE REPORTED ONE: an uncoil has exactly one hole, and the ship fits through it',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'uncoil: { from: 0.5, every: 0.1, gap: 4.5, at: 26, hole: 14 },',
      replace: 'uncoil: { from: 0.5, every: 0.1, gap: 4.5, at: 26, hole: 4 },',
    },
  },
  {
    decision: '0151',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE ONE THE DECISION IS NAMED FOR. The hole is there, it is wide enough, it is in a fixed
      place — and from the far wall the ship cannot get to it before the curtain closes. That is the
      play report *"needed a way to dodge it"* arriving again about a build that answered it, and it
      is the difference between the player's two categories: a pattern nobody can execute is not a
      learnable strategy, it is the unfair one. Nothing in the table looks wrong.
    */
    broke: 'the hole authored past what the ship can cross from the far wall while the curtain closes',
    guard: 'and it can be REACHED from the far wall, which is where a static hole may sit',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'uncoil: { from: 0.5, every: 0.1, gap: 4, at: 58, hole: 12 },',
      replace: 'uncoil: { from: 0.5, every: 0.1, gap: 4, at: 84, hole: 12 },',
    },
  },
  {
    decision: '0151',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE REJECTED DESIGN, RESTORED — and it is the probe this decision exists for. A hole that
      opens near the ship passes every other assertion in the file: the row still names a position,
      the curtain still leaves exactly one opening, it is still wide enough and still reachable. What
      it stops being is a CHALLENGE — *"a variable hole that spawns close to the ship negates the
      entire difficulty of the obstacle… there's not really a point in that wall challenge at all."*
      This is what a guard about the picture looks like when the model is indifferent.
    */
    broke: 'the hole made to follow the ship, which is the draft the play-test refused',
    guard: 'AND THE OTHER REPORTED ONE: the wall does not move, so it is a pattern to learn',
    edit: {
      path: 'src/app/boss.ts',
      find: '    if (across > uncoil.at - clear && across < uncoil.at + clear) continue;',
      replace: '    if (across > boss.across - clear && across < boss.across + clear) continue;',
    },
  },
  {
    decision: '0151',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE CURTAIN LOOSENED UNTIL IT IS FULL OF HOLES NOBODY AUTHORED. At this spacing a `forgiving`
      hurtbox slips between any two shots, so the authored hole stops meaning anything for exactly the
      players least able to find it — and every other assertion about the attack stays green.
    */
    broke: 'the curtain spaced wide enough for a forgiving ship to slip between its shots',
    guard: 'THE REPORTED ONE: an uncoil has exactly one hole, and the ship fits through it',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'uncoil: { from: 0.5, every: 0.1, gap: 4.5, at: 26, hole: 14 },',
      replace: 'uncoil: { from: 0.5, every: 0.1, gap: 5.5, at: 26, hole: 14 },',
    },
  },
  {
    decision: '0151',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE CURTAIN NEVER THROWN. `uncoilsBy` still counts, `holeAt` still places, the table still
      says the boss has one — and nothing arrives. This is the shape 0150's probe set found one layer
      down, where a guard was satisfied by the table rather than by the code.
    */
    broke: 'the uncoil stopped reaching the field, so the whole mechanism is a row nobody throws',
    guard: 'AND DRIVEN: a real fight throws real curtains, each with one hole in it',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (notch > w.bossUncoilAt && stance.kind !== \'bare\') {',
      replace: '    if (notch > w.bossUncoilAt && stance.kind !== \'bare\' && false) {',
    },
  },
  {
    decision: '0151',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE HOLE THAT IS NOT CUT. The row authors one and the loop fills it in — so the attack is
      0150's undodgeable curtain again while every table guard about the hole stays green, because
      they are all statements about numbers rather than about bullets.
    */
    broke: 'the hole stopped being cut out of the curtain, so the row authors one and the lane has none',
    guard: 'AND DRIVEN: a real fight throws real curtains, each with one hole in it',
    edit: {
      path: 'src/app/boss.ts',
      find: '    if (across > uncoil.at - clear && across < uncoil.at + clear) continue;\n',
      replace: '',
    },
  },
  {
    decision: '0151',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THROWN ONCE A FIGHT, WHICH IS 0150 RESTORED. *"It needed to happen more than once per boss"* —
      an `every` this wide reaches one notch before the window swallows the rest, and the difference
      between that and four is invisible in every other guard here.
    */
    broke: 'the uncoil spaced so wide it fires once a fight, which is what the play-test rejected',
    guard: 'and it is thrown again and again, which is the half a phase could not say',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'uncoil: { from: 0.5, every: 0.1, gap: 4.5, at: 26, hole: 14 },',
      replace: 'uncoil: { from: 0.5, every: 0.9, gap: 4.5, at: 26, hole: 14 },',
    },
  },
  {
    decision: '0151',
    suite: 'tests/level.test.ts',
    /*
      ⚠️ THE HOLE HALF OFF THE EDGE OF THE WORLD, which is a narrower hole than the row says and is
      the shape a hand reaches for when it wants the pattern hard over to one side. The chorus's is
      already at 26, so this is one step further along a direction somebody was deliberately going.

      ⚠️ A CLAMP USED TO STAND BETWEEN THIS AND THE PLAYER AND IT WAS DELETED. The first form of this
      probe removed the clamp inside `holeAt` and the suite stayed GREEN — the placement rule already
      bounded the answer, so the clamp was a second description of one fact that no break could
      distinguish from the first. `holeAt` is gone entirely now, and what stands here is the table
      assertion; it is the same conclusion 0150's probes reached one layer down.
    */
    broke: 'the hole authored half off the edge of the lane, so it is narrower than the row says',
    guard: 'and the whole hole is inside the lane',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'uncoil: { from: 0.5, every: 0.1, gap: 4.5, at: 26, hole: 14 },',
      replace: 'uncoil: { from: 0.5, every: 0.1, gap: 4.5, at: 4, hole: 14 },',
    },
  },
];
