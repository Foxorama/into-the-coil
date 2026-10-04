# 0499 — The wave fires in turn

**Accepted 2026-10-04.** **Amends [0259](0259-the-bullets-stay-on-the-screen.md)**: the deal at the
entry is the wave's turns, not three slots by index. **Keeps [0326](0326-an-enemy-is-seen-before-it-fires.md)**:
the first of a wave to arrive still fires half a second after it is seen, and nothing fires sooner.
**Keeps [0096](0096-the-enemies-play-along.md)**: every turn is rounded to the grid.

## The ask

> *"in the toxic mire there's some real clusters of enemies and bullets - in the other levels as
> well, everything that fires multiple bullets needs to space out the fire for the group a bit as
> they all kind of create an undodgeable wall at the moment."*

Offered three ways to space it, the player chose: **spread a wave's members across about half of
their reload, in order along the line, so fire rolls down the line as a readable sweep and the other
half of the reload stays quiet as the gap to move through.** 0326's seen window stays.

## What was true

**The deal was three slots by index.** `e.entrySlot = i % ENTRY_SLOTS` at the spawn, `ENTRY_SLOTS` 3,
and on the step a hull crossed an edge its first volley was put `entrySlot` grid slots behind the
seen window. A reload is relative, so whatever a wave opened with it kept for life.

⚠️ **AND THE PREMISE THIS WAS ASKED ON WAS ONLY HALF TRUE, WHICH THE MEASUREMENT FOUND.** The brief
read the deal as *a rank fires within a fifth of a second*, and a single rank does. But the Mire's
lead lines are five and six bodies, which `abreastCap` folds into two ranks, and the back rank
reaches the edge about a third of a second behind the front — so a line of six wardens at Savior
already opened over **half a second of a 1.1-second reload**, one body at a time, before this
decision: 0, 6, 12, 18, 24, 30 steps, then 36 quiet. **That is the option the player chose, and it is
what the Mire's lead lines already did.** Three-by-index could put two bodies on one step only where
more than three crossed an edge on one step, and in shipped content that barely happens: a flanking
stream reaches the view one member at a time down its length, and no boss calls more than three
firing adds at once (the guard this decision deletes held exactly that). A first draft of these
figures showed flanking pairs on one step on `main`; they were silent reloads beyond the leading edge,
counted by a scratch instrument that did not apply the frame's along gate, and they are not in the
table below.

## The rule

**A wave's members take turns at their first volley, a turn apart, where a turn is half the member's
own reload over the wave's size.** The first of a wave to arrive fires at the seen window as before;
each member after it fires no sooner than the member before it plus a turn, rounded to the grid.
`turnWait` in `src/app/frame.ts`; `SWEEP_SHARE` and `turnGapFor` in `src/content/cadence.ts`; three
numbers on the entity — `turnOf` (which wave), `turnGap`, `turnAt` (when it went).

**Taken at the entry, from what has arrived, and never estimated at the spawn.** On the step a hull
crosses an edge, it scans the pool for its wave: members crossing on the same step go in the order
`entrySlot` gives, and members who already went set the earliest it may go. A column, whose members
arrive a beat apart, is already past its turns and fires as it did; a rank arriving together sweeps;
a back rank arriving while the front is still taking its turns waits for them.

**The order is rank by rank, then across the lane, one way per wave.** `turnInWave` counts it from
the formation at the spawn — a flanking stream's order is its index, down the stream — and the
direction alternates by the wave's parity, the idiom `spawnWave` already uses for which way a drifter
leans. It is the spawn's order and not the pool's, because the pool swaps on every release.

**A boss's call is a wave of its own**, labelled by the step it was made on. Adds spat from a mouth
cross no edge, so their turns are dealt where they are spat, from the same order and gap.

`THE WAVE TAKES TURNS` in `tests/bullets.test.ts` holds it in seconds at Savior and Legendary: every
opening volley on a step of its own, the opening at least as wide as its turns take less a slot, and
the quiet half of the reload unbroken less a slot. Its share is the literal one half the player
chose, not `SWEEP_SHARE`, on 0027's terms.

## The figures

**One wave, alone, the guns off** — the step each body's first volley left on, and the quiet from the
last of them to the wave's next volley:

| wave | before | after |
|---|---|---|
| 3 wardens abreast, Savior | 0, 6, 12 — quiet 60 | **0, 12, 24** — quiet 54 |
| 6 wardens in a line, Savior (the Mire's) | 0, 6, 12, 18, 24, 30 — quiet 36 | **unchanged** |
| 5 turrets in a line, Savior | 0, 6, 12, 24, 30 — quiet 24 | **unchanged** |
| 6 wardens in a line, Legendary | 0 … 30 in sixes — quiet 60 | **0, 6, 18, 24, 36, 42** — quiet 48 |
| 6 wardens flanking, Savior | 0, 6, 42, 66, 114, 126 | 0, 6, 36, 66, 108, 114 |
| 4 turrets flanking, Savior | 0, 126, 150, 162 | 0, 120, 150, 156 |

A flanking stream is spread over two seconds by its own length either way; the turns move it by a
slot here and there.

**The Mire at Savior, through the real level** — `scripts/weigh-fight.mjs gauntlet --difficulty=savior`,
the busiest two seconds of live bullets on the screen:

| | before | after |
|---|---|---|
| busiest 2 s, waves | 35.7 at camera 2497 | 36.0 at 2496 |
| busiest 2 s, in the mid-boss fight | 34.6 | 33.5 |
| worst step, before / during / after the mid-boss | 34 / 41 / 51 | 34 / 40 / 51 |
| `--carried`: busiest 2 s (in the fight) | 34.6 | 34.7 |

And a census of wave volleys on the same walk (a scratch script, not tracked): steps on which two
bodies fired at once, 23 → 22; three at once, 2 → 1; the busiest quarter second, 5 volleys → 5.

## ⚠️ What it does not do

**It does not move the Mire's busiest moments, and the measurement says why.** The busiest two
seconds of the level are overlapping waves — a flanking warden stream, a flanking turret line and
the lancers either side of them — whose survivors keep firing for several reloads; thirty-odd bullets
on the screen there are the waves' count and their staying power, not their members going off
together. The Mire's lead lines already opened over half their reload before this. So the report
— *clusters*, an *undodgeable wall* — is owed a play on this build, and if it stands, its subject is
how many waves are on the screen at once and how long they live, not the turns.

**The sweep across the lane does not survive the roam.** The order is the formation's, at the entry;
a warden roams across the lane during its half second of being seen, so by the time it fires a line
that arrived left to right is scattered (fired from 95, 39, 89, 24, 86, 18 across, in the six-warden
fixture). One at a time holds; *in order across the lane* holds only for kinds that hold station.

## What it changes that was not asked for

- **A single rank opens twice as wide**, a fifth of a second to two fifths, and later members of
  anything that crossed together wait longer for their first shot — at most half a reload. 0326's
  presence cost runs this way: a body that waits longer is a body the capped sweep kills first.
  `THE REPORTED ONE` and `COVERED_FLOOR` stay green.
- **At Burn a big wave's neighbours share a slot** — half a reload of 48 over six is four steps, under
  a grid slot. A pair, in order, rather than a rank.
- **The entry edge test is one function, `entersNow`**, because a member asks it of the others.

## Rejected

- **Spreading across the whole reload.** Offered, and not taken: a trickle with no rest in it is a
  wall spread thin. `0499`'s first probe is exactly that.
- **Staggering the shots within one body's volley.** Offered, and not taken: it smears one body's
  pattern — a turret's spray, a warden's wall — into something that is not the pattern the row
  authors, and leaves the group going off together.
- **Dealing the turns at the spawn, with an estimate of when each member arrives.** Built first. It
  was right for a lead line and wrong for a flanker, which reaches the screen by two edges — the head
  of its stream crosses into the lane on one step while its tail is still closing on the view — and
  it put the head's first two on one step. At the entry there is nothing to estimate.
- **Ordering across the lane alone, ignoring ranks.** Worked through: a two-rank line then turns
  front-left, back-left, front-middle, and the back rank's half of the sweep lands in the quiet half.
- **A share on every enemy row.** [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)
  asks whether a constant is a character. The share is how a group takes turns, and the turn's length
  is the row's own reload, so every kind already sweeps at its own speed; no row asked for its own
  share. A row field is the day one does.

## Guards moved

- **`THE ENTRY VOLLEY` lost its `ENTRY_SLOTS` half** — the widest rank and the widest call held
  against three slots. There is no slot count now: any width is dealt one turn a member. What the
  turns can still do is put two neighbours on a step at the hardest tier, and a change that made that
  so would be correct, so it is not an invariant ([0192](0192-a-guard-holds-an-invariant.md)). Its
  first half — a formation does not open on one step — is unchanged and green.
- **Probes re-anchored, with the reason in each file:** 0098's *the entry deal flattened* now takes a
  wave's label away; 0259's two and 0326's two anchor on the entry's new spelling and on `entersNow`.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Three entity fields, one constant,
the entry and the spawn; nothing persisted.

## Confirmed, not assumed

`npm run prove 0499`, and `0098`, `0259` and `0326`, whose probes were re-anchored, all prove clean.
`tests/bullets.test.ts`, `tests/spawns.test.ts`, `tests/budget.test.ts`, `tests/frost.test.ts`,
`tests/difficulty.test.ts` and `tests/pilots.test.ts` pass (132 tests), `THE REPORTED ONE` and
`COVERED_FLOOR` among them.

| broken on purpose | went red |
|---|---|
| the turns spread across the whole reload, so the wave never rests | `THE WAVE TAKES TURNS: a wave opens fire one body at a time` |
| the turns cut to one grid slot apart, so a rank opens over a fifth of a second | `THE WAVE TAKES TURNS: a wave opens fire one body at a time` |
| the members crossing with a body not counted, so a rank fires on one step | `THE WAVE TAKES TURNS: a wave opens fire one body at a time` |
| the members who already went not counted, so a back rank lands on the front’s turns | `THE WAVE TAKES TURNS: a wave opens fire one body at a time` |

**The guard is red on `main`, on the two fixtures this decision changes**: three wardens abreast
opened over 0.2 s against the 0.27 s their turns ask, and six at Legendary over 0.5 s against 0.53 s.
The two Savior lines pass on `main` too, which is the finding above, held.

## What is owed

- **A play of the Mire**, and the question above put to the player: whether the wall was the turns,
  or the waves on the screen at once.
- **The sweep against the roam** — whether *in order across the lane* is wanted badly enough to order
  the turns by where the bodies are when they fire rather than where they arrived.
