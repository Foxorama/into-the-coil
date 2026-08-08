# 0082 — A pickup is rare, and says what it is

**Accepted 2026-08-08.** Chunk 5 of
[`the-third-play-test`](../../reports/the-third-play-test-2026-08-08.md), which the player calls
*"the lynchpin of whether this game is actually good or not"*. Mapped first, in
[`the-pickup-taxonomy-mapped`](../../reports/the-pickup-taxonomy-mapped-2026-08-08.md); the map is
where the counts and the constraints were established and this is where they were spent.

**Supersedes [0052](0052-a-pickup-is-two-things-and-the-camera-says-which.md)**, amends
[0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md),
[0041](0041-a-pickup-is-the-answer-to-what-a-death-costs.md),
[0066](0066-a-death-scatters-what-it-took.md) and two rules in `docs/game.md`.

## The rule

**A level offers six pickups of three kinds, each one is what the level says it is, and every one of
them changes the outcome — including the ones taken after the weapon is full.**

| | | per level |
|---|---|---|
| **`weapon`** | every repeat raises tier and rate together; at the cap it becomes a bomb charge | 3 |
| **`shield`** | one hit that never reaches the hull | 2 |
| **`bomb`** | charges for the arsenal | 1 |

## What was asked for

> *"power ups are too common still and these are premium game pieces that are the lynchpin of whether
> this game is actually good or not"*

> *"too many varieties and it's overwhelming and weak, too few and the player doesn't feel powerful
> enough"*

> *"these are a key driver of the players feeling of power growth and they're currently a steady
> stream of non-earned upgrades that make the game trivial"*

> *"shields/lives should be kept to 1-2 per level. Shields in particular are so much more stronger
> than I had anticipated."*

> *"missile upgrades need to be 2-3 per level"*

> *"rapid fire/rapid missiles rapid whatever else we add need to be combined into one power up - which
> is the weapon change power up… picking up a second of the same weapon needs to increase it's tier
> and rate of fire together. There's just too many power ups for these to be separate things."*

> *"when a player dies let's change it to 50% chance of each power up they have collected spawning
> from their death, current implementation means there's not really a cost to dying at all"*

> *"max speed auto-fire is way too strong for the current game - when you get max speed nothing is a
> challenge, bosses die in less a second and they are supposed to be tough."*

And, on the cycle and the extra life, given during this session:

> *"a shield is an extra life anyway and it's far more game impactful and meaningful"*

## The measurement the map made, and it is the whole argument

| level | entries before | shield/life | after |
|---|---|---|---|
| approach | **24** | 9 | **6** |
| descent | **22** | 8 | **6** |
| coilward · shoal · batteries · gauntlet | **19** each | 9 each | **6** each |
| eye | **20** | 9 | **6** |

⚠️ **Against the stated budgets the levels carried roughly four times the pickups they should, and
the survival pair was over by a factor of five.** *"Too common"* was an understatement of what the
table said.

## Six kinds became three, and the third one is new

⚠️ **`rapid`, `spread`, `missileRate` and `missileSpread` are one `weapon` kind.** The ask's own
words, and the four faces were the *"too many varieties"* complaint in the table rather than in the
art.

⚠️ **`bomb` is a pickup, and it closes three things left open in three different places.**
`docs/game.md` wants *"more specials, found during the run"*; `src/state/slices/run.ts` has carried a
`took` action since 0039 **with nothing that dispatches it** — a shape `src/content/specials.ts`
argues for and admits is untested; and
[0053](0053-the-bomb-is-the-first-thing-the-player-spends.md) left *how a player gets more bombs* to
level clears alone. One row answers all three.

⚠️ **`extraLife` is gone, and this is the loudest thing in the decision.** The reasoning is the
player's: a shield **stops the death happening**, so it also keeps the arsenal that 0039 says a death
costs, where an extra life hands back a ship with nothing on it. A shield is strictly the better
version of the same promise.

**What it costs is that a run's complement of lives can now only go down.** 0039 refused lives that
refill at a level boundary *"because a game over nothing can reach is a screen that is never
designed"*, and named findable lives as the replacement — and there are none. The `gainedLife` action
is deleted rather than left dispatchable, because an action nothing sends is a rule nobody can test.

⚠️ **What makes that survivable today is [0068](0068-a-run-over-is-a-continue.md)'s free continue,
which is deliberate and temporary.** `docs/state-of-play.md` records it as *"effectively unlimited
lives"* and *"probably will change later"*. **The day it stops being free is the day this needs an
answer** — a boss reward, a chart node, or lives back on the field — and that is written here so it
is not rediscovered as *the game has no extra lives in it*.

## Three kinds is an ODD number, which used to be impossible

⚠️ **[0052](0052-a-pickup-is-two-things-and-the-camera-says-which.md)'s `CYCLE` is a proved
involution** — every kind maps to exactly one *other* kind, its own inverse, no fixed points — so the
table could only ever have an even number of kinds in it. Three was not available.

**The cycle is dropped.** Not because the involution was inconvenient, but because its premise
stopped being true:

- **0052's reasoning was density-dependent.** *"Which one a player gets is a matter of when they reach
  it"* was written for a field with a pickup every 250 units, where a player passes dozens and takes
  whatever is beside them. A level now offers six.
- **At six a level, a coin flip on a premium piece reads as the game taking something away**, not as
  the field changing its mind. The player crossed the lane for it.
- **And it makes the stated budgets unauthorable.** *"2-3 weapon upgrades per level"* under a cycle
  needs 4-6 authored entries to land on average — which puts the density most of the way back to
  where the complaint started. The ask and the mechanism could not both be satisfied.

⚠️ **The map named this as a play-test question and the play-test did not answer it**, so it was put
to the player directly rather than assumed either way. What went with the cycle: `CYCLE`,
`CYCLE_UNITS`, `faceOf`, `cyclePickups`, `pickupCycle` and `pickupFlipped` on the world,
`tests/cycling.test.ts`, and `scripts/probes/0052-cycling.mjs`.

⚠️ **What the game gets back for it is an equality it never had**: what the level authors is what the
player is handed. `tests/pickups.test.ts` asserts it for every kind — the version before this could
only claim *something inside the pair*.

## The ladder: what "tier and rate of fire together" means

Every `weapon` pickup advances **both cadences and one hardpoint**:

| rung | pulse | missiles | hardpoint |
|---|---|---|---|
| 1 | ×0.78 | ×0.85 | **launcher** — the missile weapon arriving |
| 2 | ×0.78 | ×0.85 | barrel |
| 3 | ×0.78 (hits the floor) | ×0.85 | barrel |
| 4 | — | ×0.85 | launcher (cap) |
| 5 | — | ×0.85 (hits the floor) | barrel (cap) |
| 6+ | — | — | — → **a bomb charge** |

⚠️ **The first rung is the launcher, and that is [0056](0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md)
surviving the merge.** The base ship has no tube, so a merge that handed the missile out at rung three
would quietly un-earn the second weapon.

⚠️ **The hardpoint goes to whichever side is proportionally further from its own cap**, so the two
fill together rather than one filling first. Written as a cross-multiplication to stay in integers.

⚠️ **The two cadence factors stay different — 0.78 and 0.85.** A missile is worth three pulses, so the
same factor on both would put three times the damage on the same curve and the pulse would stop
mattering by the third rung. A merge that collapsed them into one constant is the plausible tidy-up
and `tests/missiles.test.ts` refuses it.

⚠️ **Three weapons a level is also the difficulty dial's own number**, which is worth knowing before
chunk 6 moves it: *"dial starts at 1, increases to 2 when the player gets their first weapon power up,
increases again when they get their next, until they get to the boss which should be difficulty 4."*
Three notches from 1 is 4. The two are the same decision seen from opposite ends.

## The max-speed nerf is a deleted `let`, and a rule kept somewhere else

⚠️ **The cause, named exactly.** `weaponFor` spent every upgrade past every cap on `damage` and
`missileDamage`, **with no ceiling anywhere** — so the twelfth pickup was worth exactly as much as the
fifth and the curve never flattened. Both are `const` now.

⚠️ **That unbounded climb was not a bug; it was `docs/game.md` being obeyed.** *"An upgrade that
cannot change the outcome is worse than none"* is a stated rule, and overflow damage was the only
answer available to it. So a cap alone would have traded a reported defect for a broken rule.

**What the cap is paid for with**: a weapon pickup taken by a ship whose weapon can no longer grow
becomes a **bomb charge**. The upgrade still changes the outcome, in a currency the player *spends*
rather than one that fires itself — which is the whole difference the report is about, and it is
`docs/state-of-play.md`'s already-requested *"let a capped pickup convert into something spendable"*
arriving early.

⚠️ **It lives in `src/content/pickups.ts` as `effectOf`, and it lived in `src/app/mount.ts` first.**
As a branch in the shell it was a content rule in the one layer no unit test reaches without a DOM —
so the thing paying for the deleted `damage++` had nothing holding it, which is
[0005](0005-a-guard-must-be-seen-to-fail.md)'s shape exactly. The shell keeps what is genuinely its
own: which action a given effect dispatches.

## The 50% scatter, and the order it has to happen in

⚠️ **One filter, and it runs BEFORE the ring is built.** [0077](0077-a-pickup-arrives-rather-than-stopping.md)
spaces the pieces `i / n` of a circle apart, so `n` has to be *how many are actually thrown*. Tossing
the coin inside the placing loop is the obvious way to write it and produces the same COUNT — the
survivors just sit on the headings the full set would have used, so a third of the ring is empty and
the player reads it as pieces having failed to appear.

⚠️ **Nothing asserted that evenness until now, which is why the probe for it came with a new guard.**
`tests/pickups.test.ts` holds that the widest angular gap is under twice the narrowest; the existing
minimum-separation assertion could not see a missing piece at all.

⚠️ **Per upgrade and not per death.** A coin on the whole loadout averages the same and is a
completely different rule: the player would experience a free death or a total one.

## The twenty-second rule is amended, and this is the bill

⚠️ **`docs/game.md` said *"a level may never leave the player more than twenty seconds without
something to rearm from"*, and at three weapons a level the worst gap is fifty.** No arrangement of
three pickups over 6,350 units makes twenty. The rule and the ask are in direct conflict and the ask
wins.

**What replaces it is a different mechanism rather than a looser standard.** The answer to *what is a
player who just died flying with* used to be *another upgrade within twenty seconds*; it is now *half
of your own loadout, on the spot*. **The density and `SCATTER_KEPT` are one decision** — raising
either without the other is how a level stops being playable after a death.

⚠️ **`tests/pickups.test.ts`'s ceiling moved from 20s to 55s and it says so in the file.** Moving a
ceiling to fit the content is normally the thing this repository refuses, so the exception is argued
where it lives rather than assumed. The guard is weaker than it was: it is a drift detector now, and
the number to tune if dying reads as brutal is `SCATTER_KEPT`, with this following it.

## Three pickups, three sizes — and this is chunk 4's other half

[0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md) answered *"they're all
the same colour and essentially the same size"* for the two bullets and the ship's hull, and
**deliberately left the pickups to this chunk** on the grounds that merging them first changes what
there is to tell apart.

| | silhouette | extent | was |
|---|---|---|---|
| `weapon` | **a chevron**, pointing the way the ship flies, notched at the tail | 6 | four faces at 4.6 |
| `shield` | the heraldic shield, unchanged | 5 | 4.6 |
| `bomb` | **the bomb's own notched disc**, in the pickup ink | 4.4 | — |

⚠️ **The order is what the player should cross the lane for.** The weapon is the one the report calls
the lynchpin, so it reads from furthest away.

⚠️ **The weapon at 6 is bigger than the drifter and the weaver, which `src/content/sprites.ts` used to
say a pickup must never be.** That intent is kept and paid differently: what stops a pickup reading as
a threat is the ink and the silhouette, and *being small* was exactly the complaint.

⚠️ **Each extent is twice its row's `radius`**, because
[0035](0035-damage-is-legible-on-the-body-that-took-it.md) makes the picture the hurtbox. Growing one
without growing the other draws a target the player can touch and not collect.

⚠️ **The chevron is a new shape rather than one of the four it replaces**, and that is worth the
drawing: every one of those four belonged to a pair-with-inverted-fill scheme that no longer has a
partner to invert. It is also the only pickup that is asymmetric along the scroll axis, so it is told
apart by orientation as well as by outline at the size where outlines start to fail.

⚠️ **The bomb pickup shares its path with the thrown bomb and differs by ink and extent** — the only
shared silhouette outside the pyre's rungs, and deliberate: a player learns the notched disc from the
trigger strip long before they find one lying about, so *the thing on the ground is the thing on the
button* costs no teaching at all.

⚠️ **The title-screen key shrank from six rows to three for free**, because `src/app/chrome.ts` walks
`PICKUP_KINDS`. That is most of *"too many varieties and it's overwhelming"* answered by the table
rather than by a layout change — and it buys back the vertical room
[0072](0072-a-cue-is-baked-and-played.md) measured as gone, which is worth knowing when the next
setting arrives.

## What this deliberately does not do

**It does not make a pickup EARNED.** *"The power ups need to spawn after beating a tougher enemy or a
mid-round boss, not an end boss, to get the sense of worth"* is a spawn keyed to an event, which is the
same machinery the difficulty dial needs — **chunk 6**. Rarity alone does not make a pickup earned and
the report says so; rarity is what this chunk can deliver, and it is worth playing before the second
half is built.

**It does not re-tune the bomb's two charges.** `SPECIALS.bomb.charges` is 2, so a bomb pickup is
worth a level clear twice over. That is a play-test number and it is the first thing to look at if
bombs feel free.

**It does not redraw the bomb.** See the eyes-on pass below: it is the weakest of the three at key
size and the strongest argument for leaving it alone is that a player learns it from the trigger
strip. If a play-test says the pickups still muddle, that is the one to look at first.

**It does not touch `UPGRADES_PER_TIER`.** [0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md)'s
hull ladder is one tier per two upgrades, and it was just validated by a hand
([`the-batch-flown`](../../reports/the-batch-flown-2026-08-08.md)) **against the old density**. At
three weapons a level the last hull now arrives in level two rather than inside level one. That is a
real change to a number with evidence behind it, and the next play-test is what says whether it
survives.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0082-taxonomy.mjs`.

| broken on purpose | went red |
|---|---|
| a level quietly given more weapons than the ask allows | `offers the budget the ask named, in every level` |
| the overflow damage written back, so a capped weapon keeps getting stronger forever | `THE NERF: a weapon past its caps stops growing` |
| a capped weapon pickup still filed as an upgrade, so it buys nothing | `a weapon pickup taken at the cap becomes a bomb charge` |
| the 50% filter removed, so a death hands the whole loadout straight back | `THE 50% RULE: gives back about half of a large loadout` |
| the ring spaced over the whole loadout rather than over the pieces that survived the coin | `leaves in every direction, and no two pieces travel together` |

⚠️ **Nine probes belonging to five other decisions were stranded by this change and every one was
re-aimed or deleted deliberately.** `anchorFailures` reported all nine in a second, which is the
mechanism [0079](0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md) added earning itself
a third time. Two of 0066's — the ones that broke the cycle reaching a scattered piece — were
**deleted rather than repointed**, because a probe with nothing to break is 0019's STILL GREEN.

⚠️ **0052 joins `WITHOUT_PROBES`, and it is the first entry there that is a reversal rather than a
gap.** Its confirmation table is still a true account of what was measured; there is simply no longer
any code to break.

### What `npm run prove` found that nothing else could

**Six probes did not do what their decision says they do**, and the first pass over the whole set is
the only thing that could have said so — `npm test` was green through all of it. Four of the six are
guards belonging to OTHER decisions that this change quietly disarmed, which is the class
`docs/state-of-play.md` warns about after 0080 and the reason a shared-constant change runs the full
proof before it is pushed.

| went | what it turned out to be |
|---|---|
| 0045 STILL GREEN | its break filtered `spread` out of the title key, and `spread` no longer exists — so the filter removed nothing |
| 0056 STILL GREEN | the reach corridor was measured on whichever pickup came to hand, and the three new SIZES made that the biggest one. `COLLECT_REACH` back to the hull and the guard said nothing |
| 0081 STILL GREEN | *the hull keyed to barrels* stopped being a defect the guard could see, because it varied the upgrade KIND and there is one kind now |
| 0064 WRONG TEST | its guard was renamed with the cycle it was measured against |
| 0051 STILL GREEN | **the probe, and it took three attempts** — see below |
| 0082 STILL GREEN | **the probe, not the guard** — see below |

⚠️ **0056 and 0081 are the same failure and it is MINE.** Both guards were written correctly against
the world as it stood; this change moved a quantity underneath each of them — a pickup's radius, and
the number of upgrade kinds — and both went on passing while measuring nothing. Neither is repaired by
adjusting a number: 0056's corridor now measures the SMALLEST pickup, which is the worst case and what
it should always have been, and 0081's now varies the rung rather than the kind, because at four
upgrades a ship has three barrels and two launchers and the two candidate rules disagree there.

⚠️ **0051 took three attempts and the first two diagnoses were wrong, which is worth more than the
fix.** The break removed `launchers < MAX_LAUNCHERS` from the hardpoint line and nothing changed. Read
once, that looks like *the cap is redundant*; read twice, like *the cap needs restructuring to be
load-bearing* — and the ladder was restructured on that reading, adding a term that turned out never
to fire. Both were wrong.

**What is actually true**: `MAX_LAUNCHERS` appears twice, in `grows` (should the loop still run) and
in the hardpoint line (which side does this rung buy), and **neither is redundant** — they answer
different questions. At the current constants `grows` stops the loop first, so breaking either
occurrence *alone* is invisible while both remain correct. The restructure was reverted; the code is
what it was.

⚠️ **The lesson is about the PROBE, not the code: a constant with two uses has to be broken at the
constant.** `MAX_LAUNCHERS = 3` is also the more faithful break, because three is not a hypothetical —
it is what shipped, and it is what the player reported as *"3 missile tubes instead of being capped at
two."*

⚠️ **And `npm run prove` cannot be run while the tree is being edited.** A pass reported *worker 4's
tree did not come back to what it was copied as: `docs/state-of-play.md` — not restored*, which is
the restore check catching a file that moved under it rather than a probe failing. Not a defect, and
worth knowing before somebody re-runs a proof to chase it.

⚠️ **0081's repair needed the same correction, one guess later.** The first replacement assertion
compared the tier against `floor(shots / 2)` — one rival formula out of many — and the probe uses
`shots - 1`, so it went STILL GREEN a second time. Naming the rival is guessing; the guard now states
the property instead: **the tier is not a function of the barrel count**, because rung four buys a
launcher, so three upgrades and four upgrades share three barrels and must not share a hull.

⚠️ **0082's own STILL GREEN was a lying diagnostic, and it is worth writing down.** The break was
`damage++` past the cap — literally the deleted code — and `damage` is `const` now, so the edit does
not compile: `vite build` failed inside vitest's global setup, the suite never ran, and the harness
reported **STILL GREEN**. That reads as *your guard is weak* and means *your probe does not build*.
The probe is re-expressed as the same defect at the resolve, where it is runtime-valid. **The harness
should tell those two apart** — a crash is not a green suite — and that is a repair to
`scripts/prove-guard.mjs` rather than to this decision.

## And it was looked at, with two things it could not show

`node scripts/shot.mjs` at 1280×720, across a real run of level one, per
[0027](0027-measure-the-picture-not-the-model.md).

**The title key is three rows and each one names one thing** — a chevron, a shield, a disc, all in the
pickup ink, against the tier buttons. Where it was six rows of which three alternated silently, it is
now a list a player can read in one pass.

**The weapon pickup reads at 40px and the shield at 36px**, both unmistakable against the pink
diamonds of a drifter wave and the 13px orange discs of the ship's own fire. The three-way separation
the report asked for is there in the picture and not only in the extents table.

⚠️ **AND THE CLOSEST PAIR IN THE GAME IS NOW THE WEAPON PICKUP AND THE PLAYER'S SHIP.** Both are
forward-pointing wedges. What separates them is ink (pickup green against player cyan), size, the
pickup's much deeper tail notch, and the fact that one of them is under the player's hand — which is
four channels and is very probably enough. **It is written down because no guard covers it**:
`tests/pickups.test.ts` measures a pickup's extent against the ENEMIES, and 0081's silhouette rule is
over `SHOT_KINDS`. Nothing in the repository compares a pickup to the ship, and this is the first
change that made that a question.

⚠️ **The bomb was NOT caught in play, and the reason is the one 0081 recorded — third time.**
`shot.mjs` walks a run **with nobody flying**, so the ship dies early and the run has expired by the
time the camera reaches the bomb at 3,600 units (99 seconds in): the shot at 100s photographed the
title screen. Every pickup this rig can reach is in a level's first minute.

⚠️ **What can be said about the bomb is therefore the key and the arithmetic**, and at key size it is
the weakest of the three: a featureless disc, carried by the word beside it. In play it is 4.4 units
against the player's 1.8-unit bullet, in a different ink, and nothing else on the field is round — so
the argument is good and it is **not the same as having looked**.

⚠️ **The field is visibly emptier, which is the change and not a defect.** Six pickups a level is what
was asked for; whether it reads as *premium* or as *sparse* is the one question no still frame can
answer, and it is the first thing the next play-test is for.
