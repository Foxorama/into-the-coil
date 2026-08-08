# 0079 — A death is a beat, and the arsenal goes up with the ship

**Accepted 2026-08-08.** Chunk 2 of [`the-third-play-test`](../../reports/the-third-play-test-2026-08-08.md),
plus one thing the player added on top of it while the chunk was being started.

## The rule

**A death is an event with a length: the ship comes apart, the field carries on, and the life is not
spent until the explosion has finished. What the ship never spent goes off with it, and how much
there was is the size of the ring.**

## What was asked for

> *"when a player dies, they instantly respawn, there needs to be the player ship explosion, a pause,
> then a respawn. This also needs to happen before the 'continue' screen shows up as well."*

And, added when the chunk was picked up:

> *"the player's ship (and only the player's ship) exploding on death should fire all unspent bombs at
> the player ship's location with an expanding ring based on number of bombs - 0 bombs = half current
> bomb explosion size, 1 bomb = bomb explosion, 2 bombs = increased explosion size, 3 increased
> further. This is effectively a way to give the player some breathing space for when they respawn."*

⚠️ **The investigation was done first and separately** —
[`the-death-beat-mapped`](../../reports/the-death-beat-mapped-2026-08-08.md) has the whole map,
including the eight call sites that had to be gated and the two numbers nobody had chosen. This
decision is what it turned into; the report is not restated here
([0029](0029-the-tracked-record-is-the-record.md)).

## Both halves of the report were one cause

`GameFrame.step` ended with a burst, a cue and `w.onDeath()`, and the shell answered `onDeath` with a
scatter, a `lifeLost` dispatch and a `respawn` — **all on one step**. So:

- the player never saw the death, because the replacement ship was already there on the next frame
  drawn; and
- [`src/state/root.ts`](../../src/state/root.ts) raises the run-over screen off that same `lifeLost`
  dispatch, so on the last life the overlay went up before the burst had drawn a single frame.

**Moving one call fixes both**, which is why this is one decision and not two.

## What it is now

`onDeath` was split in two, and the two are `DEATH_STEPS` apart:

| | fires | the shell answers with |
|---|---|---|
| `onWreck` | the step the hull reaches zero | the pyre |
| `onDeath` | the end of the beat | the scatter, `lifeLost`, and `respawn` |

In between, `stepShipDeath` pulses fragments at the place the ship died — the mechanism
[0062](0062-a-boss-dies-loudly.md) built for the boss, copied rather than reinvented, at half the
length and a smaller pulse.

## The ship stops existing, and that is the load-bearing part

⚠️ **The ship is released from `shipPool` for the length of the beat.** A stationary hull sitting in
the lane for a second reads as the game having frozen; an absence reads as a death.

⚠️ **`shipPool.size` is the gate, never a flag.** *There is no ship* is a fact the pool already holds,
and a boolean beside it is the shape of drift [`src/sim/entity.ts`](../../src/sim/entity.ts) argues
against three separate times. The step reads it once, into `flying`.

**Eight call sites had to answer for it**, and one of them turned out not to need to:

| | what breaks without a gate |
|---|---|
| `flyShip` | the player flies a ship that is not drawn |
| `askSpecials` → `launchSpecial` | a bomb thrown from a dead ship's muzzle, out of a charge the death is about to take |
| `fireShip`, `fireMissiles` | a wreck keeps shooting |
| the four `collideIntoOne(…, w.ship, …)` | **the worst one** — see below |
| `collectInto(w.pickups, w.ship, …)` | a wreck collects the scatter it is about to throw |
| the `w.ship.health <= 0` check | as below |
| `stepShields` | **nothing** — see below |

⚠️ **The collision one is not subtle and it is invisible.** A wreck left in its pairings goes on
taking hits, so `health` walks further negative and `health <= 0` fires again on every step of the
beat: repeated explosions, repeated beats, and a life lost per step until the run is empty. Nothing
about the picture would look wrong for the first tenth of a second.

⚠️ **`stepShields` needed no gate, and the version of this change that gave it one was worse.**
`shieldsOf(row, health)` is the single description of how many marks a ship has
([0050](0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md)) and a wrecked
ship's health is at or below zero — so the existing code releases the shell, bursts each mark where it
was, and returns before it places anything. Gating it would have frozen an orbiting mark in world
coordinates for the length of the beat, which is the bug it looks like it prevents.

## The place is a camera offset, not a world position

⚠️ **The mistake [0062](0062-a-boss-dies-loudly.md) documents having made, avoided here and then
nearly reintroduced one function over.** The camera covers about 27 world units during the beat, so a
world position drifts a quarter of the lane out from under the place the player was looking.

`deathOffset` and `deathAcross` are what the pulses are placed against — **and what
`scatterUpgrades` is placed against too.** That function read `w.ship.along`, which was exactly right
for as long as the scatter happened on the step the hull reached zero; it now happens at the end of
the beat, and the ship object has been sitting still in world coordinates the whole time.

## The two numbers nobody had chosen

Both are starting points on [0037](0037-the-ship-has-mass.md)'s terms and nothing asserts on either:

- **How long the beat is: 48 steps, eight tenths of a second.** Half a boss's, and the halving is the
  argument rather than the arithmetic — a boss coming apart is watched once at the end of a level, and
  a death is something the player is *waiting through*, several times a run. It is not derived from
  `BOSS_DEATH_STEPS`, because the two answer different questions.
- **Whether the scatter throws at the start of the beat or at the end: the end.** The map called this
  *"the first is the better picture and the second is the safer code"*, and the beat changed the
  first half of that: the wreck pulses for eight tenths of a second and then throws its pieces clear,
  which reads as coming apart rather than as a firework that happens to be a pickup. Throwing at the
  start would also have put six pickups inside the pyre on the frame it appears.

## The pyre

**One ring at the wreck, at one of four sizes, chosen by how many charges the arsenal had left.**

| unspent | ring | against a bomb's blast |
|---|---|---|
| 0 | `blastHalf` | × 0.5 |
| 1 | `blast` — the bomb's own | × 1 |
| 2 | `blastWide` | × 1.5 |
| 3 or more | `blastWidest` | × 2 |

⚠️ **The second rung is the bomb's own blast rather than a fourth row saying 34 again**, because the
ask names it as a thing that already exists: *"1 bomb = bomb explosion."*

⚠️ **It is a SIZE ladder and not a damage one.** Every rung takes exactly what a bomb takes. What the
player is being given is room, and a rung that also hit harder would make dying with a full arsenal
the most efficient way to kill a boss.

⚠️ **It is counted over the whole arsenal rather than over bombs**, on the same terms `levelCleared`
grants a charge to every special: what goes up with the ship is what the ship was carrying, and a
second special inherits that without anybody remembering to.

⚠️ **It is clamped, and the run goes past the clamp inside four levels.** A bomb starts at two charges
and every level cleared adds one, so the ask's four rungs are exhausted early. The widest ring already
covers a 100-unit lane; letting the ladder keep growing would make the last levels' deaths clear the
screen several times over. Unclamped, the index is also `undefined` past the end — which falls back to
the *smallest* ring, so the player carrying the most would get the least.

### Why it fires at the start of the beat and not at the end

⚠️ **Because the reducer that empties the arsenal is the same dispatch that raises the continue
screen.** The frame cannot see the run ([0015](0015-the-layer-ladder.md),
[0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md)), so the shell has to be told — and a
shell told only at the *end* of the beat would be told after the charges were gone. `onWreck` is that
report, and it is also the more literal reading of *"exploding on death should fire."*

### Why it cannot hurt the ship it hands back

⚠️ **It falls out of the beat rather than being checked for, which is exactly why it has a guard.** A
blast lands on the step *after* it appears — the frame zeroes blast damage at the end of the step it
landed on — and on that step there is no ship in `shipPool`. By the time one is back, `BLAST_STEPS`
has expired four times over. Shorten the beat below the ring's own life and the player would respawn
into their own explosion, which is what `tests/death.test.ts` is watching for.

## What it cost, which is atlas memory

⚠️ **Three more baked bitmaps, and the widest is 136 world units square.** `src/render/surface.ts`
blits at the extent the atlas recorded, so *the same ring, bigger* is not something a caller can ask
for — and it must not become one. A per-entity draw scale would let any body in the game be drawn at a
size unrelated to its art, which would make
[0035](0035-damage-is-legible-on-the-body-that-took-it.md)'s *the picture is the hurtbox* unenforceable
everywhere instead of just here.

⚠️ **What makes it affordable is that `bakeSize`'s ceiling is a RESOLUTION rather than a pixel
count** — [0065](0065-the-sky-is-baked-and-blitted.md) restated it as what it always meant, and the
consequence lands here: the widest ring bakes at about 980px on a phone's pixel density rather than at
its desktop 1360. A ring is also 99% empty, so if the atlas ever does bite, the cheaper picture is
available and is a render change rather than a content one. Noted, not ruled on.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0079-death-beat.mjs`. **18 red, and every tree back to what it was copied
as.**

| broken on purpose | went red |
|---|---|
| the beat removed, so the life is spent on the step the hull reaches zero | `is off the screen for most of a second` |
| the beat stretched to something the player waits through | `is off the screen for most of a second` |
| the wreck left in its pool, so the beat shows a stationary hull rather than an absence | `is off the screen for most of a second` |
| the collision gate removed, so a wreck keeps taking hits and the run pays for each one | `costs exactly one life however hard the field keeps hitting it` |
| the weapon gate removed, so a wreck goes on firing through its own explosion | `fires nothing and throws nothing while it is coming apart` |
| the collection gate removed, so a wreck picks up what it flies over | `collects nothing, including the scatter it is about to throw` |
| the scatter thrown from the ship object, which has not moved with the camera | `throws the upgrades out of the wreck and not a beat behind it` |
| the explosion left in world coordinates, so the scroll walks away from it | `keeps exploding where the player watched it die` |
| the respawn left without a pool slot, so the ship never comes back | `hands the same ship back, because there is only ever one` |
| the beat left counting into a new run, which then opens with a ship that is still dying | `does not open a new run mid-beat` |
| the pyre never lit, so a death leaves the field exactly as full as it found it | `goes off where the ship died, at the size the arsenal was carrying` |
| the pyre ladder collapsed to one rung, so the arsenal stops being legible in the ring | `is the ladder the ask names` |
| the pyre's top rung unclamped, so a full arsenal falls off the end of the ladder | `is the ladder the ask names` |
| a pyre rung drawn at a size other than the one it damages at | `draws every rung at exactly the radius it damages at` |
| the death beat's rate raised past what the debris pool can hold beside a boss | `leaves room for a boss and a player dying in the same second` |
| the anchor pre-flight made to report nothing, so a stranded probe runs and proves nothing | `names the probe whose anchor the code moved out from under` |
| the pre-flight's missing-file arm dropped, so a probe whose file moved reads as healthy | `names a probe whose file has gone` |
| a real probe's anchor pointed at code that is not there, exactly as an unrelated edit does | `every probe in the repository can still be applied to the tree as it stands` |

## What proving it cost, and it is a new failure mode for this project

⚠️ **The first probe run did not go red or green. It HUNG, for twenty-five minutes, and printed
nothing.** The collision-gate break makes a wreck re-report its own death every step, which re-arms
the beat's counter — and `tests/death.test.ts` was looping `while (world.dyingIn > 0) frame.step()`,
which is exactly right against the shipping code and is an infinite loop against that break.

⚠️ **A synchronous spin blocks the event loop, so vitest's own test timeout cannot fire.** The suite
does not fail; it stops existing. `scripts/prove-guard.mjs` then waits on it for ever, with its
`console.log` output still sitting in a pipe buffer — so the harness looked identical to a slow run.

**The rule this leaves behind: a test may not loop on a condition the code under test owns.** Every
loop in `tests/death.test.ts` is now bounded by a step ceiling and throws a named error if it reaches
it. [0019](0019-a-probe-must-be-seen-to-apply.md) is about a probe that proves nothing;
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) is about a guard that fires on the
wrong quantity. This is the neighbour of both: **a guard that cannot report at all.** It is written
here rather than as a constitution rule because one occurrence is a fixture bug, not a class — if it
happens twice, it is a rule.

### And it stranded two other decisions' probes, which cost a CI cycle

⚠️ **Two lines moved in `src/app/frame.ts` and orphaned probes belonging to
[0041](0041-a-pickup-is-the-answer-to-what-a-death-costs.md) and
[0050](0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md)** — the `collectInto`
call gained an `if (flying)`, and `respawn`'s `shieldOrbs.clear()` stopped being adjacent to the
`reset` under it. Neither file was one this session had any reason to open.

⚠️ **`npm run prove` said so, correctly and by name — after twelve minutes, from CI.** It applies
probes inside worker trees, so the answer arrives behind the baseline suites, six tree copies and up
to 384 vitest runs. On the machine that moved the line, the working tree looked perfect.

**The repair is the same question asked earlier, not a second answer to it.** `anchorFailures` in
`scripts/prove-guard.mjs` calls `planEdit` — the existing check — over **every** probe, before a tree
is copied, even on a filtered run. `tests/prove-guard.test.ts` asks it about the real probe set, so
`npm test` now reports a stranded probe in a second.

⚠️ **It is deliberately not a new mechanism, because one would be refused.**
`src/app/mount.ts` learned *one guarantee, one mechanism* over the orientation gate: a redundant
safety net does not make a system safer, it makes the original untestable. *Does this anchor resolve*
still has exactly one description; what changed is when it is asked, and over what.

## And it was looked at

`node scripts/shot.mjs` at 1280×720, per [0027](0027-measure-the-picture-not-the-model.md), walking
a real run of level one until the ship died.

**The beat reads.** The frame a second after the hull went is **a screen with no ship on it** and a
cloud of white shards across the left third, with the HUD still showing the life the player has not
yet lost and no overlay anywhere. That is the report's own three beats — explosion, pause, respawn —
and the thing it replaces was a frame in which nothing had visibly happened at all.

⚠️ **What the picture also said, unprompted: the cloud is WIDE.** Fragments carry up to 1.15 units a
step for up to 34 steps, so a beat's worth of pulses spreads about 560px across a 1280px screen. It
reads as coming apart rather than as an explosion, which is arguably the right word for it — but it
is a bigger event on screen than the numbers suggested, and it is the thing to look at first if the
death starts reading as messy.

⚠️ **The pyre itself was NOT caught in a still, and that is a limitation of the rig rather than a
finding.** The ring lives `BLAST_STEPS` — a fifth of a second — and `scripts/shot.mjs` walks a real
run in real time, so the moment a ship happens to die moves by hundreds of milliseconds between runs.
Six attempts at a 200ms grid did not land on it. What is known about it is therefore the model's:
`tests/death.test.ts` drives its place, its size, its ladder and the fact that it cannot hurt the
replacement ship. **Its picture is a bomb's blast at a larger extent**, which
[0053](0053-the-bomb-is-the-first-thing-the-player-spends.md) already had eyes on — that is a real
argument and it is not the same as having looked.

## What this does not settle

**Whether eight tenths of a second is right.** It is a hand's number against a report that asked for
*a pause* without saying how long, and the only thing that can answer it is the same play-test the
rest of the chunks are waiting on.

**Whether the free continue survives contact with it.** [0068](0068-a-run-over-is-a-continue.md)'s
continue is still free, so a run still cannot be lost — the beat now costs a second of it, which is
the first time dying has cost anything at all. `docs/state-of-play.md` has that as an open item.
