# 0073 — An enemy is a pilot

**Accepted 2026-08-07.** Turns `src/content/enemies.ts`'s three motion fields into a closed union,
gives three of the six enemies a reason to care where the player is, adds an `aggression` column to
the tier table, and closes a defect in `fireEnemies` that has been in the game since enemies could
shoot.

From [`medium-played`](../../reports/medium-played-2026-08-07.md).

## The rule

**An enemy's motion is one arm of a closed union, and an arm may read where the ship is.**

## What was asked for, and why it outranks everything else on the list

> *"We need to make the enemies actually enemies, currently basically every wave is just a wall that
> you pass by. They need to circle, double back etc and be actively dog-fighting with the player, it
> can be straightforward dog-fighting depending on difficulty, but currently, especially with
> auto-fire mode (which I think we should still keep) the game is just not a game, it has actually
> become **what we tried to avoid, a one-button autopilot stick where you just move around a bit**."*

⚠️ **That last clause is [0024](0024-the-accessibility-floor-is-settings.md)'s own words, about the
default game.** 0024 dropped the authored horizontal assist path partly because *"a ship following an
authored path with auto-fire on is a game playing itself"*, and argued that what makes this genre hard
is *"continuous, accurate, fast movement under time pressure."* **A body on rails applies no time
pressure.** So the shipped default had drifted into the thing that decision refused to build as an
opt-in assist — which is a more serious finding than any single number on the play-test list, and is
why this landed before the balance pass.

⚠️ **0024 had also already cleared the way, by name.** It dropped the law that *"anything demanding
cross-axis evasion is scripted, not reactive"* because *"the law bans the genre… rules out aimed
shots, homing shots and anything that responds to where the player is."* Reactive enemies are
permitted by the decision that looked hardest at whether they should be.

⚠️ **Auto-fire stays.** `src/content/actions.ts`'s *there is no `fire` action and there must never be
one* is untouched, and the ask is explicit about keeping it. What the player spends is the arsenal;
what they solve is the field.

## The union arrived on its own trigger

`src/content/enemies.ts` argued **against** a motion union in as many words — *"a straight line is a
weave of amplitude zero. A union would enumerate two members that are one member with a parameter"* —
and then wrote down exactly what would change its mind:

> *"The union earns its place the moment a motion arrives that is **not** a parameterisation of this
> one — something that turns towards the player, or stops. That is a real trigger rather than a
> someday, and it is named here so the next person does not have to re-derive it."*

Three have arrived at once. The trigger is met on its own terms and nobody had to re-derive it, which
is the whole return on writing a rejected alternative down.

| motion | what it is | who flies it |
|---|---|---|
| `drift` | holds its lane, or wanders and turns round outside it | drifter, turret |
| `weave` | a swing that is a function of `along` | weaver |
| `hunt` | steers across towards the ship while it closes | lancer |
| `circle` | flies in, then orbits | warden |
| `loop` | chases the ship's position along the lane, turning each time it overshoots | charger |

## Two of the six deliberately did not change

⚠️ **A field where everything converges reads as one threat rather than six.** 0034's *a threat is
absolute* is what keeps the kinds distinguishable, and something the player is safe to ignore is what
makes the things they cannot ignore mean anything.

The **drifter** stays inert because it is the harmless one the player learns the lane against. The
**turret** stays inert for a different reason: an emplacement that chased would not be an
emplacement, and it is the one enemy a formation can be authored around — `closing: 0` means it is on
screen for a known length of time. `tests/pilots.test.ts` asserts that more than one row is still
non-reactive, so this cannot erode a row at a time.

## What was given up, stated plainly

⚠️ **A reactive path is not a function of `along`, so it cannot be authored as a picture.** A designer
can no longer read a wave table and know where its members will be. That is the cost of this change
and it is the point of it — the thing the play-test called a wall was precisely a field whose every
position was predictable from the map.

⚠️ **What was NOT given up is reproducibility, and the difference is worth asserting.** The step is
fixed ([0022](0022-frame-rate-is-a-feature.md)), the ship is a function of the player's input, and no
arm draws from a generator — so a seeded replay is identical to the unit.
`tests/pilots.test.ts` runs the same scenario twice and compares positions to six decimal places.

⚠️ **`tests/spawns.test.ts` lost a guard and the reason replaced it.** *No row both weaves and roams*
was true and load-bearing, and only expressible because a row carried both fields and could set both.
A discriminated union cannot describe two motions, so the affordance is gone rather than policed —
top of `docs/scaffold-plan.md`'s instruction ladder, and the same move
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) made when it deleted a sprite
guard rather than keep it green.

## A tier changes how hard something tries

`aggression` multiplies the reactive arms only, and the play-test asked for it by name: *"it can be
straightforward dog-fighting **depending on difficulty**."* 1, 1.3, 1.7.

⚠️ **It reaches the three reactive motions and not the other two.** Multiplying a weave or a roam
would change a picture the level is authored against; this changes how hard a body is trying, which is
the distinction between it and `closing`. It is raised further than `closing` on the hardest tier on
purpose — a faster body is less time to decide, a body that *stays on you* is a different problem.

## The defect this also fixed, which nothing had ever guarded

`fireEnemies` refused to fire from off screen and checked **`across` only**.
[0059](0059-the-lane-is-the-players-box.md) added that test when the roam made the side edges
reachable; the leading edge never got one.

| | |
|---|---|
| a wave is placed at | ≈ camera + 246 |
| a 16:9 device sees to | camera + 178 |
| so every approach carried | **≈ 2 seconds of fire from a body with no picture** |

⚠️ **It is worse on a narrower screen**, which is the tell that it was never considered: 0023 fixes
the spawn distance against the widest view so content is authored once, and the visible span is not
fixed. This is exactly the *hit with no cause on the picture* that
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) records being reported three
separate times as a collision fault that did not exist — and it was reported a fourth time, as
*"most of the difficulty is enemies that fly past and shoot, or shoot from off-screen."*

⚠️ **The check is against `w.view.alongSpan`, not `MAX_ALONG_SPAN`, and this is the one place that
difference is allowed to matter.** The question is *can the player see it*, which is a fact about the
device in front of them. Using the widest view would leave a phone being shot at by things it cannot
see, which is the bug.

## Three things the code decides that are easy to get backwards

**Every reactive speed is in the CAMERA's frame.** `CLAUDE.md` says so and this project has already
paid for it once: an orbit computed in world coordinates orbits where the ship *was*, drifting a full
scroll rate up-lane every step. `scrollPerStep` is added in both the circle and the loop arms.

**`loop` authors no speed of its own.** A body that came back at a rate written on the row would be
two numbers describing one speed — its `closing` inbound and an `agility` outbound — and they would
disagree the first time either moved. It returns at exactly the speed it arrived at, which also means
the velocity the arm computes while it is still approaching is the one the spawner already gave it, to
the unit. No engagement range is needed and there is no step where it changes gear.

**`spin` cannot be derived from position.** Which side of the ship a body is on flips halfway round
every orbit, so an orbit computed from it reverses at the top and the bottom and the body swings on
an arc. It is set at spawn by the same index parity the roam's direction uses, for the same reason: a
level is authored, and a wave that rolled its own handedness could not be tuned by a hand.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0073-pilots.mjs`. **8 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the hunt steering nothing, so a lancer is a wall on a fixed lane again | `REACHES the ship’s lane before it passes them, from the far side and the real spawn distance` |
| the hunt steering by the whole gap, so it vibrates on the player instead of arriving | `and settles ON the player rather than vibrating across them` |
| the tier’s aggression dropped, so every difficulty dog-fights exactly the same | `and a harder tier closes faster, which is what the aggression column is` |
| the looper given no turns, so a charger flies past once and is gone | `crosses the ship more than once, which a wall does not` |
| the orbit direction derived from the body’s side, so it swings on an arc instead of circling | `gets all the way round the ship — a whole lap, not a swing` |
| the turn never spent, so every charger dog-fights for ever and the pool fills | `and gives up after its own number of turns rather than orbiting for ever` |
| the orbit allowed behind the camera, so a warden fights from where it cannot be seen | `THE ONE THAT WOULD BE FREE: it stays on screen when the player hides at the very back` |
| the leading-edge check removed, so a wave shoots for two seconds before it can be seen | `THE REPORTED DEFECT: a body beyond the view fires nothing` |

## What the guards changed, which is most of what is worth reading here

**Four separate times a test or a number was wrong and the harness said so.** None of them would have
been found by reading.

**1. The hunt's rate was a third of what it needed to be, and it sounded like restraint.** `agility`
was first set at 0.18, described as *leaning towards the player rather than latching onto them* — and
a guard written in seconds rather than in the constant failed immediately. **A lancer is only in
front of the player for about three seconds before the trailing cull retires it**, so 0.18 buys thirty
units of steering against a hundred-unit lane: it crossed a third of the gap and left. That is the
wall the play-test was complaining about, wearing a chase. At 0.35 it reaches the ship's lane before
it passes them, and the guard asserts *that* rather than the number.

**2. The fixture placed bodies by hand, so the spawner was never exercised.** Two probes — one
deleting the looper's turns at the spawn site, one changing where a circler's handedness comes from —
both came back **STILL GREEN**, because the fixture was supplying by hand exactly the values the break
removed. It now replaces the level with a one-wave script and lets the game spawn it.

**3. The orbit guard was satisfied by a pendulum.** It asked whether the body had been seen ahead of,
behind and beside the ship; an arc swinging back and forth visits all three. The probe that reverses
the orbit direction was **STILL GREEN**. It now sums the unwrapped angle and requires a full lap,
which is the thing an arc cannot fake.

**4. The circle's floor was defending against the wrong harm.** The guard claimed a body orbiting a
ship at the back edge would be *culled*, and the probe removing the floor came back **STILL GREEN**:
`cullAlong` sits an `EDGE_MARGIN` — forty units — further back, so it survives inside the margin. That
is worse, not better. An enemy that cannot be seen or shot while it orbits a cornered ship is the same
silent-picture failure 0036 is named for, and the guard now asserts the thing the player has: **it
never goes behind the trailing edge.**

**5. And it silently disarmed a guard in a decision it does not touch — which is the one worth
reading twice.** 0034's probe for *an enemy aiming in WORLD coordinates* came back **STILL GREEN**,
against a test written a fortnight ago and green on every run since. Two separate reasons, both
created by this change:

- The fixture's off-lane lancer now **hunts**, so it rams the ship. `stepsUntilHit` reads *was the
  ship hurt*, which was an exact question for as long as the only thing that could reach the ship
  from over there was the bullet. The lancer's contact damage is zeroed in that fixture now.
- The window was the whole run, and a hunting lancer has **closed the offset by its second shot** —
  so the guard was measuring the in-lane case that 0034's own comment says *"still connected, which
  is why it hid."* The window is one shot's flight now.

⚠️ **Nothing about 0034 was wrong, and nothing about it changed.** A behaviour change three files away
turned one of its guards into a tautology, and the only thing that could have noticed is a harness
that re-breaks every decision's assumptions on every run. This is the case
[0019](0019-a-probe-must-be-seen-to-apply.md) makes for running the whole suite of probes rather than
the ones belonging to the change in hand.

## What this leaves owed

**Every number in it.** Five agilities, a radius, two turns and three aggression multipliers, none of
them played. They are play-test numbers on [0037](0037-the-ship-has-mass.md)'s terms and nothing
asserts a value; what is asserted is a relationship — it arrives, it laps, it comes back, it leaves.

**The rest of the list.** `reports/medium-played-2026-08-07.md` has six more findings, and this
answers one and a half of them. The movement box is still an undrawn wall, the level boundary still
resets the camera, the arsenal still fires one way, and the upgrade curve is still a step — and the
last of those is now the largest thing left, because a field that fights back changes what every
number in it is worth.

**A play-test, and it is the point.** Nothing here has been flown.
