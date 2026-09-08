# 0281 — A boss guards its own back

**Accepted 2026-09-08**, from the second play of the redrawn serpent —
[`the-serpent-played`](../../reports/the-serpent-played-2026-09-08.md):

> *"like all bosses, you can fly behind it with the lightning canon and just basically sit their
> nuking it because it doesn't go backwards at all."*

**The first of six answers to that report**, taken first because it is the cheapest change with the
widest reach: it is one rule over all fourteen fights and depends on nothing else. The serpent's own
five items follow.

## The rule

**A boss lays a lash behind itself, on its own clock.** Seven slow shots out of the hull's back,
fanned 137° about straight up-lane and swung a little each time, every 54 steps, in whatever ink the
boss is throwing. It is not an attack arm and no row authors it: a hull that is fighting has a wake.

**A lash never shatters, is never laid closer to the player's wall than the warning it owes, lives
exactly as long as its own corridor, and stands aside when the pool is already carrying a fight.**
Each of those four is a defect that was measured and is written up below.

## ⚠️ The report names the movement and the cause is the aim, which is why the fix is not the one asked for

Measured, and the report has the table: `PLAYER_LEAD` is **167.1** units from the camera's trailing
edge; every boss's `station + drift + radius` is **149 to 155**. So there is a corridor 12 to 18
units deep up-lane of every hull that the ship can reach — and `spray`, `rake`, `wall`, `whip` and
`beam` are all centred on `π`, which is **down-lane**. **Five of the nine arms of `BossAttack` cannot
reach the ground behind their own boss at any spread**, a sixth (`rake`) sweeps past it about twice a
minute, and **four of the seven real bosses throw neither of the two that can.**

⚠️ **AND THE CORRIDOR IS NOT A LINE, IT IS A BAND AS WIDE AS THE LANE.** The arc's reach at its cap
is **98 units** (`src/content/weapons.ts`), so *behind the boss* — for a player holding the weapon
the report names — includes the far corner of the lane. This is the measurement that killed the first
two drafts, and it is written down because it is not obvious from the word *behind*.

## ⚠️ What this does NOT do, said plainly because [0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md) is about exactly this

**It does not make a boss turn round, and *"it doesn't go backwards"* is what was asked.**

- **A hull that faced the player needs a heading.** `src/render/scene.ts`: *"`blit` cannot rotate"*,
  and `src/sim/entity.ts` carries no rotation. Every hull in the game is baked facing down-lane.
- **A hull that reversed into the corridor needs a station past 160.** `tests/level.test.ts` holds
  `station + drift + radius` at or under 160 and the number is 0061's: it is what keeps the whole
  hull on the narrowest view. The largest station in the game is 142 and the tightest headroom is
  five units. A boss backing up twenty would leave the screen.

**Both are the segment chain's** — [0277](0277-the-serpent-has-menace.md)'s fork, still owed. What
this buys is that **the ground behind a boss is not free**; it does not buy a boss that turns to face
you, and the next play report may well still say so.

## ⚠️ Five drafts, and every one was killed by a measurement rather than by an opinion

**This is written out because the first three all looked right**, and the shape of the error was the
same twice: an angle covering a distance.

| draft | what it was | what measured it dead |
|---|---|---|
| **a mirrored share of the volley** | a third of each fan thrown backwards instead of forwards, on `spray`/`rake`/`wall`/`whip` | `ring` was exempted as *already covering its own back*. Flown: the jellyfish **never once** touched a ship parked at 15 or 85 across in twenty seconds. A ring's rays are as sparse as any fan's forty units out |
| **three fixed bearings** | −60°, 0, +60° out of the tail, unmoving | the hydra never touched a ship at 15 or 85 either — it was standing at **52°**, squarely between two rays. *A fixed safe bearing behind a boss is the reported defect again, one bearing narrower* |
| **seven bearings on the volley's clock** | the fan widened to ±69° and swept | coverage came right — worst first hit **5.5 s**, from 15.8 — and the pool went to **150 of 150 on eleven of the fourteen fights**, against a baseline where one phase of one fight passed a hundred |
| **its own clock, one flat fuse** | the wake cut loose from `fireIn`, every lash living 210 steps | the jellyfish stands 44 units from the wall and a hull at the far end of its drift stands 18; one fuse for both spends two and a half times what the second needs, and the frost ship's last phase went to **140** |
| **a fuse solved per lash** | each lash living exactly its own corridor | still 140 on that one fight, and **no cadence reaches it** — 54, 72, 80 and 90 steps measured 140, 135, 133, 133. The peak is a burst coinciding with the shatter, not an accumulation |

**What survived is a wake that yields**, and the shape the whole thing settled into: the lash is not
part of a volley, it is laid at a standoff, its fuse is its own corridor, and it stands aside.

## ⚠️ Why the lash has its own clock, which is the whole of the third failure

`fireIn` is the phase's cadence **scaled by the tier** (`fireGapFor`), so a wake hung off it arrives
roughly twice as often at `burn` — precisely where the hostile pool is already tightest.
`src/sim/pool.ts` does not grow and does not throw: it drops the next volley, silently, and the
shatter of an add with it.

⚠️ **SO `tailIn` IS A SECOND CLOCK, AND `tailAt` A THIRD COUNTER.** `src/sim/entity.ts` already
carries the argument, twice: `firePhase` is a rake's ANGLE, `headAt` is a round's COUNT, and 0261
records the TypeError that came of one field meaning both on a boss that is both. *"A third number is
cheaper than an invariant two call sites have to remember"* is that file's own conclusion.

⚠️ **AND HANGING IT IN `stepBoss` CLOSED THREE HOLES THE ARM-BY-ARM VERSION COULD NOT.** A `beam`
phase and a `summon` phase throw no bullets, and a `rain` phase's lightning never leaves the hull —
so under the old shape those three carried no wake at all. All of them lay one now, because all of
them are a hull standing in front of a player who can fly behind it.

⚠️ **BELOW THE BARE RETURN, DELIBERATELY.** [0150](0150-the-uncoil-and-the-eye.md)'s eye is *the phase
that stops shooting*; a wake through the window would soften the one moment the fight hands over.

## ⚠️ And the fuse is a pool budget and a picture at the same time

Without one, a lash lives **470 steps** and only the first 200 of them can touch anything: the
leading cull is sized for the widest device, about 240 units out, and the deepest corridor in the
game is the 44 units behind the jellyfish. Everything past that is a bullet climbing away from
somewhere the ship may not go, holding a pool slot.

⚠️ **A TIGHTER CULL WOULD HAVE BEEN THE OBVIOUS FIX AND IS THE WRONG ONE.** Culling hostile shots at
`PLAYER_LEAD` pops a bullet out of existence in the middle of an ultrawide screen —
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) exactly. A fuse ending in **the
melt** — 0263's own picture, *"a bullet that simply vanishes is the failure 0036 is named for"* — is
a wake that thins and disperses behind the animal, which is what the thing is.

`stepEntities` already retires an entity whose `lifeFor` runs out, so the fuse is one field at the
muzzle; the melt is one line in `fissionShots`, on the `lifeFor === 1` idiom `stepMissiles` already
uses for a seeker's last spark.

⚠️ **AND THE FUSE IS SOLVED, NOT AUTHORED.** It is the climb from where the lash was laid to
`PLAYER_LEAD`, plus half a second of lingering there. A flat one sized for the jellyfish's 44 units
spends two and a half times what a hull at the far end of its drift needs, on every lash of every
fight.

## ⚠️ And three more things the wake turned out to owe, each found by a guard rather than by thought

**A lash never shatters.** Seven frost shards out of the tail is two bolts and twelve flakes apiece —
eighty-four bullets nothing had budgeted for, and `tests/crowd.test.ts` at a full **150 of 150**;
even a single shard left it at **136**. The lash spends its fission stage at the muzzle, which is
`fissionShots`'s own mechanism rather than a flag beside it: **a wake is a haze the animal leaves,
not a payload.**

**A lash is never laid closer to the wall than the warning it owes.** The serpent's tail is the
longest reach in the game — 0277 puts its skull 24 units in front of its centre — and at the far end
of its drift that leaves a parked ship about ten units away, half of it hurtboxes. Measured: **36
steps**, against 45. And **no speed fixes it**, which is why this is a standoff: one speed slow
enough to give three quarters of a second across ten units needs 440 steps to cross the jellyfish's
forty-four, and seven of those alive at once is the hostile pool twice over. The two ends of the
range cannot be served by one speed and can be served by one standoff.

**A wake yields.** The frost ship's last phase at `burn` stands at **111 of the 126** that guard
allows before this decision touches anything, on its own shards alone. It is the one fight in the
game that cannot afford a wake, no cadence reaches it, and the honest rule is a priority rather than
a number per boss: **a volley exists to be dodged and a wake exists to make a corner expensive**, so
where the pool is carrying a fight the wake stands aside. It binds on that one phase and changes
nothing anywhere else.

## ⚠️ A wake in the hostile pool is a new kind of thing, and four existing guards were reading it as a volley

**`enemyShots` used to hold exactly one kind of thing: what a boss or an enemy had just thrown.** It
now also holds a wake, and three guards counted the pool as *what this volley put in the air* and one
read it as *the first thing to appear*. Each is repaired the same way — **a lash is the only thing in
that pool carrying a fuse**, so `lifeFor > 0` tells the two apart — and each is a real change to what
that guard measures, so it is listed rather than folded in:

| guard | what it saw | what it now excludes |
|---|---|---|
| 0254, `tests/hydra.test.ts` | a frost head's volley came back as *acid and frost*, so the heads looked like they threw together | the wake, which carries the ROW's shot and is not a head |
| 0263, `tests/frost.test.ts` | `enemyShots.size` counted the shards **and** the wake, so a shard looked like it had opened early | the wake, held with `tailIn` beside the `fireIn` the fixture already holds |
| 0270, `tests/crowd.test.ts` | nothing — the wake is a real hostile shot and belongs in that count | nothing. It is the guard that priced this decision |
| 0111, `tests/level.test.ts` | **the guard went vacuous** — see below | the wake |

⚠️ **AND THE FOURTH IS THE ONE WORTH THE SPACE, BECAUSE IT WENT GREEN RATHER THAN RED.** 0111's
*a pattern is the same pattern wherever the player is* steps a fight until **any** hostile shot
exists and then compares headings between two ship lanes. The wake is laid before the volley gate, so
that loop filled with lashes and returned **before the boss had thrown a single volley** — and a
lash does not depend on where the ship is, so the two lanes matched and the assertion passed
*without ever reaching the thing it is about.*

⚠️ **NOTHING IN THE SUITE WOULD HAVE SAID SO. `scripts/probes/0111` DID.** Its sixth probe centres
the fan on the ship — the defect that guard exists for — and with the wake in the way the tree stayed
green on the named test. `npm run prove` refused it. This is
[0019](0019-a-probe-must-be-seen-to-apply.md) paying for itself on a decision that has nothing to do
with 0281: **a change can make somebody else's guard stop asking its question, and the only thing in
the repository that notices is the probe.**

## ⚠️ A defect found in another decision's guard, and repaired rather than reported

**`tests/crowd.test.ts`'s pilot has never flown.** It set `world.intent.across` every step and
carried a paragraph saying *"the pilot flies, and without that this guard measures the fixture"* —
and `src/app/frame.ts` calls `w.input.contribute(w.intent)` at the top of every step, whose whole job
is to **zero the intent** before the real devices add to it. Every intent a fixture wrote between two
steps was overwritten before `flyShip` read it.

⚠️ **IT WAS NOT VACUOUS, WHICH IS WHY NOTHING CAUGHT IT.** A parked ship is a *stricter* subject than
a flying one — reachability is computed from where the ship is — so 0270's assertions were true, and
were true of something other than what they said. That is [0027](0027-measure-the-picture-not-the-model.md)'s
own failure mode: a guard firing on the wrong quantity.

**`tests/world.ts` hands a fixture the stick the real devices write to**, and `crowd.test.ts` uses
it. Every assertion in 0270 was re-run against a genuinely flying pilot and holds unchanged — which
is what made this repairable here rather than a finding to hand on.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0281`:

| broken on purpose | went red |
|---|---|
| the lash gone, so a boss lays nothing behind itself — which is what was played | `THE REPORTED ONE: a ship parked against the up-lane wall` |
| the fixture zeroing the intent again, so no test can fly a ship anywhere | `THE REPORTED ONE: a ship parked against the up-lane wall` |
| the lash flying on for ever, past anywhere the ship is allowed to be | `and the pool always has room for the volley after this one` |
| the wake laid whatever else is on the field, so the densest fight loses its next volley | `and the pool always has room for the volley after this one` |
| the sweep frozen, so the lash throws the same seven bearings for ever | `THE REPORTED ONE: a ship parked against the up-lane wall` |
| the standoff gone, so the longest body in the game lays its wake inside the player's own box | `and the lash that finds it there never arrives quicker than the fair warning` |

⚠️ **BOTH ASSERTIONS ARE IN THE PLAYER'S UNITS AND THEY PULL AGAINST EACH OTHER** — 0027. One flies a
real ship to the far wall of its box, at three places across the lane, and asks whether it ever loses
health standing there. The other asks how many SECONDS it had. A lash certain to arrive is one that
arrives too fast to dodge; a lash slow enough to be fair is one that might never arrive. Neither is
satisfiable by the code agreeing with itself, and the pair is not satisfiable by accident.

⚠️ **THE FIRST DRAFT OF THE FIRST ASSERTION MEASURED DISTANCE AND WAS WRONG.** A shot that reaches
the ship is released by the collision **inside the same step**, so a fixture reading positions after
`frame.step()` can never see one arrive: it reported *the nearest anything came was 0.0 units* for
all forty phases, which reads exactly like a near miss and was a hit.

⚠️ **AND THE SECOND ASSERTION WAS VACUOUS FOR THE SAME REASON, WHICH IS THE PART WORTH KEEPING.** It
looked for a lash whose gap had gone to zero — a state that cannot be observed — recorded nothing on
any boss, phase or tier, skipped on `Number.isFinite`, and **passed while holding nothing at all**.
It stayed green over a probe that stood a boss on top of the parked ship. It now counts what it found
and asserts the count before the quantity, which is 0005 turned on the guard itself.

⚠️ **AND ITS SELECTOR WAS KEYED TO THE CONSTANT UNDER TEST.** A lash was identified by travelling at
exactly `TAIL_SPEED`, so a probe that changed `TAIL_SPEED` left the guard unable to find one — it
went red on a *different* test, which `prove-guard` correctly refused. A lash is identified by its
fuse now: nothing else in `enemyShots` carries one.

⚠️ **AND THE FIXTURE COUNTED THE SHIP FLYING PAST THE HULL ON ITS WAY TO THE WALL.** It starts at
`SHIP_START_ALONG` and flies up-lane *through* the boss, so the first second of every run has it
within a unit of the hull; ungated, that reported a fair-warning failure of **three steps** on a boss
whose corridor is thirty-eight units deep. Nothing is counted until the ship has arrived.

⚠️ **THAT GATE IS ALSO WHAT CAUGHT A CLAIM IN THIS FILE'S OWN FIRST DRAFT.** It said the frost ship
*reaches a ship parked at the wall in half a second with a lash of seven, of one, and of none alike*,
and that number came from the ungated fixture: with no lash the frost ship **never** touched a parked
ship at all. The sentence was true of a ship flying past and false of the one the decision is about.

## What is owed

**A play.** Every number here is a model quantity until the fight is flown —
[0027](0027-measure-the-picture-not-the-model.md). Two things specifically.

⚠️ **THE FAR CORNER IS THE WEAK CASE AND IT IS A GEOMETRY FACT, NOT A TUNING ONE.** A lash is a fan
out of ONE POINT, and what the player stands in is a lane a hundred units wide at a range that is
sometimes twenty. Directly behind a boss the wait is one to three seconds; parked at the opposite
edge of the lane from a hull that patrols a narrow band it reached **13.7 s** at the settled sweep —
and 16.6 s and 36 s at the two either side of it, because the worst case is a **beat** between the
sweep, the patrol and the drift rather than a coverage hole. Nothing thrown from the hull covers a
wide shallow rectangle; only a wider *source* would, and a curtain laid across the whole lane would
not read as coming from the animal. **If the play says the corner is still free parking, that is the
next thing, and it is a source problem.**

**And the wake is not drawn as anything but the boss's own bullet.** It is the row's shot in the
row's ink, slowed and fused. That is legible and it is not *a wake*. Whether it wants a picture of
its own is a question for the play, not for this decision.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Two entity fields, seven constants,
a step in `stepBoss` and one line in `fissionShots`; nothing persisted, no storage key, no save
schema, no cache prefix, no origin.
