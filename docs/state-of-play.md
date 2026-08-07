# State of play

**Where the project is and what comes next.** Read it after `CLAUDE.md` and `docs/game.md`, before
proposing work.

⚠️ **This file holds POINTERS AND INTENTIONS, never findings.** Every conclusion below lives in a
decision or a report and is linked, not summarised —
[0029](decisions/0029-the-tracked-record-is-the-record.md) says a document restating another cites
the line, *"because a summary is a second copy, and one drifted here inside a single day."* If you
find yourself explaining a result here rather than linking it, it belongs somewhere else.

**Maintained**, unlike `reports/`. It is rewritten as things land; it is not a log.

---

## What is settled

| | |
|---|---|
| the scaffold, CI, release, staging, a live origin | [0011](decisions/0011-three-environments-and-a-separate-origin-for-staging.md), [0012](decisions/0012-a-release-is-a-tag-and-a-deploy-must-prove-itself.md) — v0.1.0 live |
| the layer ladder, hubs, slices, seeded rng | [0015](decisions/0015-the-layer-ladder.md), [0016](decisions/0016-a-hub-enumerates-kinds.md), [0017](decisions/0017-the-state-is-slices.md), [0021](decisions/0021-one-stream-per-concern.md) |
| the frame budget, and how it is enforced | [0022](decisions/0022-frame-rate-is-a-feature.md), [0025](decisions/0025-the-frame-budget-is-counted-not-timed.md) |
| landscape only, the long axis is the scroll axis | [0023](decisions/0023-the-long-axis-is-the-scroll-axis.md), [0031](decisions/0031-landscape-is-the-shipped-orientation.md) |
| three input devices, input is actions | [0030](decisions/0030-input-is-actions-and-needs-no-new-layer.md), [0032](decisions/0032-touch-is-relative-drag-and-not-a-stick.md) |
| bullets, contact, death | [0034](decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md) |
| damage is legible; a death is drawn | [0035](decisions/0035-damage-is-legible-on-the-body-that-took-it.md), [0036](decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md) |
| flight — all four constants have a hand behind them | [0037](decisions/0037-the-ship-has-mass.md), [`inertia-played`](../reports/inertia-played-2026-08-05.md) |
| **what a run is: three lives, and a death costs the arsenal** | [0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) |
| **a level is a script; a boss is phases keyed to health** | [0040](decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md) |
| **pickups: extra lives, and upgrades a death takes back** | [0041](decisions/0041-a-pickup-is-the-answer-to-what-a-death-costs.md) |
| **a run is a sequence of levels; the order is the list** | [0042](decisions/0042-a-run-is-a-sequence-of-levels.md) |
| a weapon is a budget; a level opens empty | [0043](decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) |
| lives and shield on screen; a key on the title | [0045](decisions/0045-the-player-can-see-what-they-are-carrying.md) |
| **a pad can press a button; a run-over screen expires** | [0046](decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md) |
| **difficulty is a tier, and the easy one is the content** | [0047](decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md) |
| **a threat may arrive from the side; a shot stops at the edge** | [0048](decisions/0048-a-threat-may-arrive-from-the-side.md) |
| **the chrome is authored against the short axis** | [0049](decisions/0049-the-chrome-is-authored-against-the-short-axis.md) |
| **the ship is one hit; a shield is what stands in front of it** | [0050](decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md) |
| **a missile is the second auto-weapon; a launcher is a place on the ship** | [0051](decisions/0051-a-missile-is-the-second-auto-weapon.md) |
| **a pickup is two things, and the camera says which** | [0052](decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md) |
| **the bomb is the first thing the player spends** | [0053](decisions/0053-the-bomb-is-the-first-thing-the-player-spends.md) |
| **the missile is earned; a pickup reaches 6% of the lane** | [0056](decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md) |
| **a death takes the ship, and the level carries on** | [0057](decisions/0057-a-death-does-not-rewind-the-level.md) |
| **a boss dies loudly, and the level ends after it** | [0062](decisions/0062-a-boss-dies-loudly.md) |
| **a trigger is a place on the glass, and it is drawn** | [0060](decisions/0060-a-trigger-is-a-place-on-the-glass.md) |
| **a level boundary keeps the shell; a death and a new run do not** | [0058](decisions/0058-a-level-boundary-keeps-the-shell.md) |
| **a boss's station drifts, so a fight is still flight** | [0061](decisions/0061-a-boss-keeps-flying.md) |
| **a level break is a respite: a screen says whether it stops the world AND whether it hides it** | [0063](decisions/0063-a-level-break-is-a-respite.md) |
| **the sky is baked and blitted, and it is not entities** | [0065](decisions/0065-the-sky-is-baked-and-blitted.md) |
| **nothing the sky draws is as big as a bullet** | [0069](decisions/0069-the-sky-is-behind-the-game.md) |
| **a pickup waits to be taken, and its face turns half a second faster** | [0064](decisions/0064-a-pickup-waits-to-be-taken.md) |
| **a death scatters what it took, non-cycling and on a short timer** | [0066](decisions/0066-a-death-scatters-what-it-took.md) |
| **a new run opens on an empty field** | [0067](decisions/0067-a-new-run-opens-on-an-empty-field.md), [`the-sweep-that-served-two-rules`](../reports/the-sweep-that-served-two-rules-2026-08-07.md) |
| **a run over is a continue, and it keeps the level** | [0068](decisions/0068-a-run-over-is-a-continue.md) |
| **seven levels, seven bosses, one idea each** | [0071](decisions/0071-five-more-levels-and-one-idea-each.md) |
| **a style is a setting, a choice is not an action, and neither may touch the sim** | [0070](decisions/0070-a-style-is-a-setting-and-the-first-one.md) |
| **a cue is baked and played, and it names the picture it is the twin of** | [0072](decisions/0072-a-cue-is-baked-and-played.md) |
| **an enemy is a pilot: motion is a closed union and three of them react to the player** | [0073](decisions/0073-an-enemy-is-a-pilot.md) |
| **the edge of the player's box is drawn, and the clamp and the mark are one number** | [0074](decisions/0074-the-box-is-drawn.md) |
| **a branch starts at `main` AND the next one waits — both halves checked** | [0033](decisions/0033-a-branch-starts-at-main.md), [0075](decisions/0075-the-serialisation-is-checked.md) |
| an intermittent guard is measuring the wrong thing | [0044](decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) |
| **a probe runs on a disposable copy, and copies run in parallel** | [0054](decisions/0054-the-proof-runs-beside-the-work-not-on-it.md) |
| **a press belongs to one screen; a released stick is not an ask** | [0055](decisions/0055-a-press-belongs-to-one-screen.md) |
| the class prefix rule, on the trigger 0017 named | [0017](decisions/0017-the-state-is-slices.md), [0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) |

⚠️ **Flight is closed and content may now be authored against it.** `SHIP_SPEED`, `SCROLL_PER_STEP`,
`FLIGHT_RESPONSE` and `DRAG_GAIN` were each played on real hardware and three of the four were
deliberately left alone — [`drag-feel`](../reports/drag-feel-2026-08-05.md) has the ordering and
[`inertia-played`](../reports/inertia-played-2026-08-05.md) closes it.

⚠️ **How many lives a run starts with is NOT closed, and there are now three answers rather than
one.** `STARTING_LIVES` is gone as a constant — it is a column in `src/content/difficulty.ts` —
and [0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) puts each of the three in
the same category as the flight constants before they were played. None of them has been.

## What the game currently is

**A SEVEN-level run, playable start to finish. Two of the seven have been played.** A title screen that is the difficulty
choice and carries a key to the pickups, six enemy kinds, two authored levels of about three minutes
each, weapon upgrades and extra lives lying about in them, a lives-and-shield readout while playing,
a unique boss at the end of each level, a screen between them, and a victory screen after the second.
Keyboard, touch and gamepad all reach every screen; the run-over screen offers a continue for seven
seconds and then gives up. **It also makes a noise** —
[0072](decisions/0072-a-cue-is-baked-and-played.md): twelve synthesised cues, baked at the first
press and switchable off on the title screen.

⚠️ **A pad alone cannot unlock the audio, and no code in this repository can change that.** Pad input
is not a user gesture to any browser, so a player who touches nothing but a pad has a silent game
until they tap the screen or press a key. 0072 has it written down so it is not rediscovered as a
bug.

Each level opens on an empty screen so the player can find the controls before anything finds them —
[0043](decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md).

⚠️ **A run that runs out of lives can now be continued** —
[0068](decisions/0068-a-run-over-is-a-continue.md). The run-over screen's button says *Continue*, it
resumes the level rather than restarting it, and the seven-second countdown that was already there is
now what the offer costs.

⚠️ **The free continue is DELIBERATE and temporary, and it is currently the closest thing the project
has to a cheat code.** 0068 left *"whether a free continue is the right generosity"* open as its
largest risk; the answer, given the same day: *"perfectly fine now, especially in testing — it's
effectively unlimited lives. Probably will change later."* So a run that cannot be lost is a
**testing affordance being used on purpose**, not an oversight, and the thing to weigh when it
changes is what it was buying — see the cheat-code item under *Still open, and small*.

⚠️ **The ship now opens a run with no missile launcher** —
[0056](decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md) — so the second
auto-weapon is found rather than carried, and a death takes it away with the rest of the upgrades.
A death no longer empties the screen ([0057](decisions/0057-a-death-does-not-rewind-the-level.md)),
and a new run no longer inherits the last one's
([0067](decisions/0067-a-new-run-opens-on-an-empty-field.md) — a regression 0057 introduced and the
suite could not see, post-mortem in
[`the-sweep-that-served-two-rules`](../reports/the-sweep-that-served-two-rules-2026-08-07.md)).

Nothing is *triggered* beyond the bomb: the arsenal — the specials a player spends — is otherwise
still a list with nothing in it. Difficulty was last placed by a hand at *"intro to 50% of the first level"* — which is now the
easiest of three tiers as well as two levels out of date —
[`ship-speed-settled`](../reports/ship-speed-settled-2026-08-05.md), which is now two levels out of
date and is exactly what a play-test is for.

## What the play-test has answered

⚠️ **THE MIDDLE TIER HAS NOW BEEN PLAYED END TO END, AND THE HEADLINE IS ONE WORD** —
[`medium-played`](../reports/medium-played-2026-08-07.md): *"honestly, it was just boring."* Not a
crash, not a wrong number, not a silent event; every guard in the repository was green for all of it.
Read it before proposing game work — it is the current account of what the game is like to play, and
seven findings in it are open.

⚠️ **One of those findings outranks the rest and it quotes this project back at itself.** *"It has
actually become what we tried to avoid, a one-button autopilot stick"* is
[0024](decisions/0024-the-accessibility-floor-is-settings.md)'s own words about the DEFAULT game.
[0073](decisions/0073-an-enemy-is-a-pilot.md) is the answer to it and is the only finding on that list
that has landed.

⚠️ **All eight questions have been played and answered** —
[`the-eight-questions-answered`](../reports/the-eight-questions-answered-2026-08-07.md) has them in
the player's own words, and the seven things still open at the end of them.
[`two-levels-played`](../reports/two-levels-played-2026-08-06.md) is the pass before it.

⚠️ **Two were answered *"can't tell yet"*, and both are blocked on the same thing: a balance pass
against a one-hit hull.** That is now the largest open item in the project, and it is not on the list
below — 0047's two harder tiers were sized against a five-health ship and have never been re-sized.

⚠️ **The chart between levels is now a QUESTION rather than a plan.**
`docs/decisions/0063-a-level-break-is-a-respite.md` carries the report; `docs/game.md` still puts a
branching map there, and the evidence points away from a screen rather than towards one.

## The second play-test list, given 2026-08-06 and added to on 2026-08-07

**Fourteen items, in the player's words** — twelve after playing the build that item 4 below produced,
and two more the morning after. **All fourteen have landed**, and each says where. They are written
out here rather than left in a chat log —
[0029](decisions/0029-the-tracked-record-is-the-record.md).

⚠️ **THEY HAVE NOW BEEN PLAYED, AND THIS SECTION IS CLOSED** —
[`medium-played`](../reports/medium-played-2026-08-07.md). For weeks this said *none of them has been
played, and that is the only thing that matters about this section*; the verdict arrived as one
play-test over all fourteen, which is how the list was asked for. **The findings are in that report
and the live list is under *What is next*, not here.**

⚠️ **THIS LIST HAS DOUBLED ITSELF TWICE, AND NEITHER TIME WAS A MERGE CONFLICT** —
[`the-list-that-doubled-itself-twice`](../reports/the-list-that-doubled-itself-twice-2026-08-07.md),
which has why `git merge` cannot see it and what shape of list would not have done it. Read it before
editing this list from more than one branch. The tell, if it happens again: **a numbered list whose
numbers do not ascend.**

⚠️ **They are asked for as ONE list and cannot be judged apart.** *"Individually they can't be judged
because they all affect the gameplay and game balance… something might feel right by itself in
isolation and then completely fail when you mix something else in."* So each lands as its own change
with its own guards, and **the verdict on all of them is one play-test after the last one lands** —
not a report per item.

**Landed, and now played:**

| | |
|---|---|
| the jerky flick, and the bomb that fires itself on starting a run | [0055](decisions/0055-a-press-belongs-to-one-screen.md) |
| the missile tube the ship should not start with; pickups too small to grab | [0056](decisions/0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md) |
| a death that emptied the screen | [0057](decisions/0057-a-death-does-not-rewind-the-level.md) |
| shields lost at every level boundary | [0058](decisions/0058-a-level-boundary-keeps-the-shell.md) |

**The nine, in the player's own words.** Each is a real design question, not a tidy-up:

1. **✅ DONE — pickups linger, bounce and cycle faster.**
   [0064](decisions/0064-a-pickup-waits-to-be-taken.md). ⚠️ The two halves answer the complaint
   together and neither does alone: the wait turns *catch it as it goes past* into *go and get the one
   you want*, and the faster cycle turns that wait into two and a quarter faces rather than a third of
   one. It also puts a pickup on the field for sixteen seconds rather than nine, which item 2 has to
   count against a pool of eight.
2. **✅ DONE — a death scatters the lost upgrades.**
   [0066](decisions/0066-a-death-scatters-what-it-took.md). It is the half of the dying-is-punishing
   report 0057 deliberately left, and 0056 had made a death cost more in the same session. ⚠️ The
   pickup pool went from eight to twelve, out of the particle share.
3. **✅ DONE — bosses needed a real explosion and an end-of-level beat.**
   [0062](decisions/0062-a-boss-dies-loudly.md). Both halves of that report were the same bug: the
   explosion could not be seen because there was no beat, and there was no beat because the clear
   fired on the step the pool emptied. ⚠️ The beat currently hands over to the screen item 4 is
   about, and the two want playing together.
4. **✅ DONE — the between-levels screen is a respite.**
   [0063](decisions/0063-a-level-break-is-a-respite.md). ⚠️ **It carries a product finding about a
   feature that does not exist yet**: the same report says the branching chart's player choice *"will
   probably get scrapped, because a flowing continuation with a brief respite will feel better than
   the hard pause interruption."* 0063 records it and does not act on it —
   [0042](decisions/0042-a-run-is-a-sequence-of-levels.md) is where the chart lives, and item 5 below
   is what it now has to argue with.
5. **✅ DONE — enemies were stuck in a narrow tunnel.**
   [0059](decisions/0059-the-lane-is-the-players-box.md). ⚠️ It also moved the weaver's amplitude,
   added a rule that something off screen does not shoot, and lifted the constraint that a flanking
   wave may not use a weaving enemy. Every rate in it is unplayed.
6. **✅ DONE — a boss killed the sense of flight.**
   [0061](decisions/0061-a-boss-keeps-flying.md), which took the second of the two options given. The
   first — a wall-type boss holding the far edge with its own style — is **content** rather than a
   repair, and `docs/game.md`'s *every boss is unique* is where it belongs.
7. **✅ DONE — a background.**
   [0065](decisions/0065-the-sky-is-baked-and-blitted.md). Two baked tiles at different parallax
   rates, a handful of blits a frame, and no entities: `CAPACITY` is still exactly 0022's worst case.
   ⚠️ **Nothing about it has been looked at**, which is the one class of change 0027 says can have
   every guard green while the picture is wrong.
8. **✅ DONE — a bomb could not be fired twice on a phone.**
   [0060](decisions/0060-a-trigger-is-a-place-on-the-glass.md). Two bugs, one symptom: half the strip
   was bound to a slot nobody owns, and nothing drew any of it.
9. **✅ DONE — shields did not carry between levels.**
   [0058](decisions/0058-a-level-boundary-keeps-the-shell.md).

## What is next

**The list is [`medium-played`](../reports/medium-played-2026-08-07.md)'s seven findings, and the
order below is the one the player set.** One of the seven has landed. Everything else here is a
pointer into that report or into the decision that answered it —
[0029](decisions/0029-the-tracked-record-is-the-record.md), so read the report for the words rather
than a summary of them here.

**1 — ✅ DONE. The enemies are enemies.**
[0073](decisions/0073-an-enemy-is-a-pilot.md). Motion became a closed union, lancers hunt, wardens
orbit, chargers double back, and a tier's `aggression` is the *"depending on difficulty"* half. It
also closed the reported defect that an enemy off the LEADING edge could shoot — the `across` axis had
that check since [0059](decisions/0059-the-lane-is-the-players-box.md) and the other never did.

⚠️ **Every number in it is unplayed**, and so is every cue in
[0072](decisions/0072-a-cue-is-baked-and-played.md).

**2 — The two remaining defects.** Both confirmed in the code before the report was written, both
small, and both are removing a false signal rather than a design change:

- **✅ DONE — the player's box was a wall with nothing drawn on it.**
  [0074](decisions/0074-the-box-is-drawn.md). Ten dashes down the lane in the player's own ink, and
  `PLAYER_LEAD` exported so the clamp and the mark are one number rather than one subtraction written
  twice. ⚠️ **The forward room asked for alongside it is worth six units** at the current device
  support; 0074 names the aspect-floor trade that would buy ~28 more and does not take it.
- **The level boundary resets the camera to zero**, so the sky snaps and the ship is repositioned.
  Not deletable — `resetScene` records that distance travelled is a level's only clock — so seamless
  means **giving a level an origin** rather than assuming it starts at zero. **This is the next thing
  to build.**

**3 — The arsenal answers backwards**, which is the rear-firing upgrade and the omnidirectional
special.

⚠️ **IT CARRIES A PICKUP TAXONOMY PASS AND THAT IS A PRECONDITION, NOT A FOLLOW-UP.** In the player's
words: *"there's a lot of upgrades now so I think this'll need at bare minimum better icons to
distinguish and also better grouping of upgrades as it'll get complex pretty quickly."*
[0052](decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md) already records that two of
the six faces risk reading alike, and the title key lists six things when three of them alternate.
Landing two more kinds first and tidying afterwards is how the field becomes unreadable.

⚠️ **`loop` has already taken the urgency out of it** — a charger that comes back is a threat the
forward guns can answer, so the rear weapon is an option rather than a requirement (0073).

**4 — The curve, both halves, and it is now the largest open item.** Stretch the climb AND let a
capped pickup convert into something spendable, tuned against each other. Four of the report's seven
findings are this one system: *hard at tier 1–2 and easy at 3–4*, *upgrades too frequent*, *only
shield refreshes matter at the cap*, *bosses die in under a second*.

⚠️ **It moved UP in importance because of 0073, not down.** A field that fights back changes what
every number in it is worth, so this wants measuring against the current build rather than the one the
report was played on.

⚠️ **The deferral that got us here was a decision rather than a backlog**, in the player's own words:
*"I've been leaving balancing passes because it's been playing well and pre-balancing means
re-balancing later."* It has now been paid for and the evidence has arrived.

**5 — Boss movement.** *"They all do the exact same movement with different shapes."*
[0061](decisions/0061-a-boss-keeps-flying.md) gave all seven the same drifting station because its
subject was *a boss that stopped flying*; it named the wall-type alternative and called it content.
Last, because a boss that dies in under a second is a curve problem before it is a movement problem.

**6 — The free continue.** A run cannot currently be lost, on purpose and as a testing affordance —
see *What the game currently is*. It is what has been standing in for a difficulty, so it is
reconsidered once item 4 has a hand behind it.

⚠️ **And the forward room the player asked for is worth SIX UNITS at the current device support.**
`MIN_ASPECT` guarantees every device shows at least 150 along-units and the box already reaches 144;
raising that floor to 16:9 would buy a ~172-unit box and cost letterboxing on 16:10 laptops and 3:2
tablets, which are gutter-free today. **That trade is deferred rather than refused** — the value of
forward room against something that hunts is a different question from its value against a wall.

## What was next before that list, and why in this order

**The order below is the player's, given earlier on 2026-08-06.** It is not the order the
dependencies would have picked, and that is fine. **Three of the six have landed**; what is left is
marked, and item 4 is the large one.

**1 — ✅ DONE. A gamepad can press a button; the run-over screen expires.**

[0046](decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md). The bug was architectural
rather than a binding, and 0030's claim survived with one distinction added: a menu is not the game,
so its confirm button is not `special1`.

**2 — ✅ DONE. Difficulty tiers, chosen before a run.**

[0047](decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md). Three tiers on the
title screen, the easiest one multiplying nothing, and a tier that lives on the run rather than on
the assist ladder — which could not have held it.

⚠️ **The two harder tiers are guesses against a stated target and have never been played.** *"Level
four with challenge"* and *"maybe the end boss of level two"* are the numbers to measure the next
play-test against, and there are only two levels to do it in.

**3 — ✅ MOSTLY DONE. Where things come from, and where a shot stops.**

[0048](decisions/0048-a-threat-may-arrive-from-the-side.md) landed five of the six: entry from the
`across` edges and its cap, the `across` cull, the drifting pickups, the flanker's turn — the first
motion in the game that is not a function of `along` — and the reported shot-range bug.

**What remains is the density pass, and it is deliberately last.**

*"Increasing enemy waves"* is a tuning question, and the thing that answers it is a hand rather than a
guard. Two reasons to do it after item 4 rather than before:

- **The middle tier is waiting on it.** 0047's *"level four with challenge"* was sized against a ship
  with five health. Item 4 makes the ship one hit, which moves the answer more than any wave table
  will.
- **Density is a property of the VIEW, not of the gap between waves** —
  [0043](decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md), which also records that its
  own density guard has been a sieve twice. Read that before touching a number.

⚠️ **Pool headroom is the constraint, not the authoring.** The pools total exactly
[0022](decisions/0022-frame-rate-is-a-feature.md)'s 500-entity worst case — see `CAPACITY` in
`src/app/mount.ts`, and `tests/budget.test.ts` now refuses a total above it. Item 4 has since spent
35 of those slots on the shell, the missiles and the bomb, all out of the particle share. More
enemies on screen at once is a budget question that has to be settled against what is left.

⚠️ **`tests/level.test.ts`'s density floor holds ≥ 8 in one lookahead and both levels sit not far
above it.** It is a floor, not a target, and raising it to match whatever the tuning pass settles on
would make it a copy of the content rather than a guard over it.

**4 — ✅ DONE. The ship is one hit, and it carries shields, missiles and bombs.**

⚠️ **Asked for as one list on 2026-08-06, and it is four changes that only make sense together** —
the ship becoming fragile is what the other three exist to answer. Written out here in the player's
own terms so a later session does not have to reconstruct the ask; every number in it is a starting
point, not a decision.

**ALL FOUR HAVE LANDED** —
[0050](decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md),
[0051](decisions/0051-a-missile-is-the-second-auto-weapon.md) and
[0052](decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md). The hull is one hit, a
shield is a pickup capped at three, the HUD's pips are the shell, and the ship wears a ring per
shield; missiles fire themselves from one to three launchers; and every pickup on the field is two
things, flipping together with the camera. The special that was called `shield` is now `mines`, which
is what 0045 said would happen.

The bomb is the fourth: the first triggered special, the first consumer of the input half 0030
landed, and the first thing to put a number in 0039's arsenal —
[0053](decisions/0053-the-bomb-is-the-first-thing-the-player-spends.md).

⚠️ **What 0050 leaves owed is the tiers.** 0047's two harder ones were sized against a five-health
ship and neither has been played since, and `resilience: hardy` is now a rung that does nothing.

*Cycling pickups — **done**, [0052](decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md).*
The three pairs are the ones asked for, the phase is a distance rather than a duration, and a level
authors the pair with the camera picking the face.

⚠️ **It amends 0050's line about the opening shield**: what a player finds in the empty opening
stretch is now a shield *or* an extra life. Both answer the question a one-hit hull asks, and
`src/content/levels.ts` says so where the pickup is authored.

⚠️ **The title screen's key lists all six faces and does not say that a pickup alternates.**
`docs/game.md` puts hints *where play proves they are needed, never pre-emptively*, so whether that
reads as *six pickups* rather than *three that change* is a play-test question.

*Bombs — **done**, [0053](decisions/0053-the-bomb-is-the-first-thing-the-player-spends.md).* Two
charges to start, one more per level cleared, thrown forward and detonating 80 world units ahead — the
ask's fraction of the screen, authored against the reference view because 0023 refuses screen space.
Six pulses of damage inside a third of the lane, landing once, on everything in it **including the
ship**.

⚠️ **What it left behind is a play-test question and a bug that is already fixed.** The question:
whether a blast that is dangerous only on the step it appears reads as fair, when the ring it leaves
stays on screen for a fifth of a second afterwards. The bug: the readout only refreshed when the
SCREEN changed, which nothing had noticed because lives and shields both moved at screen boundaries —
0053 has it, and `tests/hud.browser.test.ts` now drives a spent charge.

⚠️ **Pool headroom was the binding constraint and it held.** `CAPACITY` in `src/app/mount.ts` still
totals exactly [0022](decisions/0022-frame-rate-is-a-feature.md)'s 500-entity worst case:
`tests/budget.test.ts` refuses a total above it, and the shell (3), the missiles (24) and the bomb
with its blast (8) all came out of the particle share, which is the only share 0022 names as
sheddable.

**5 — The chart, and more levels behind it.**

A level is a row in `LEVELS` and the sequence is that list —
[0042](decisions/0042-a-run-is-a-sequence-of-levels.md). What does *not* exist is the branching map
`docs/game.md` puts between levels, and 0042 says why a straight line came first: a chart is a
screen, a graph and a set of rules about what may follow what, and all three want deciding against
levels somebody has played.

⚠️ **Somebody has now played them, and the answer is not obviously *build the chart*.**
[0063](decisions/0063-a-level-break-is-a-respite.md) carries the report: the player choice between
levels *"will probably get scrapped, because a flowing continuation with a brief respite will feel
better than the hard pause interruption."* That is exactly the evidence 0042 said it was waiting for,
and it argues against a screen rather than for one. Not settled; the next session gets to argue with
it rather than rediscover it.

**6 — `save/`, and the first `itc_*` key.**

Requires the run slice, which now exists. Lands with `PRIVACY.md`'s storage-key table and a guard
cross-checking `src/` in both directions, which `docs/scaffold-plan.md` has been holding open since
the scaffold *"until the first one is real"*. Carries a rollback note —
[0001](decisions/0001-revertability-not-risk-rating.md). The schema it persists is decided:
[0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) says current lives, current
arsenal, and the level to resume at.

## The settings, now that there is a place to put them

**The first one landed on 2026-08-07** — [0070](decisions/0070-a-style-is-a-setting-and-the-first-one.md).
A screen row can now carry a **choice**, which is a named setting with a list of options, and the
title screen carries one: *Look — Retro / Modern*.

⚠️ **Retro and modern currently differ by a starfield and a typeface.** The sprites are the same
placeholder shapes in both, and `bakeAtlas` does not take a style yet. Adding a drawing per style is
where the rest of the ask goes: *"and then start updating the graphics across the board."*

⚠️ **Nothing persists.** A reload is back to the default, and 0070 names that as the reason to do
`save/`: a setting is the one piece of state a save should hold **without a run attached**, which
`docs/game.md`'s interruption-hedge framing does not currently cover.

**The second landed the same day** — [0072](decisions/0072-a-cue-is-baked-and-played.md). *Sound —
On / Off*, beside *Look*, and it cost one row plus one line in the shell: 0070's claim that the queue
was *"already the same shape"* is now tested rather than predicted.

**The queue behind it is already the same shape** — the palette (`PALETTES` has two and nothing
switches them), reduced motion, and flash intensity. Each is a row in `choices` plus a field on the
settings slice; none of them needs a new mechanism.

⚠️ **BUT THE TITLE SCREEN IS FULL, AND THE NEXT SETTING CARRIES THE SETTINGS SCREEN.** 0072 has the
measurement at 480×320: the second row cost the last of the horizontal space, and a third will not
fit. 0070 rejected a settings screen on the grounds that inventing one *"to hold a single two-option
row"* put the one thing a player wants before their first run behind a door — that reasoning does not
survive a fourth setting, and the layout guard is what says so. Whichever screen lands first also
carries the back-intent switch [0017](decisions/0017-the-state-is-slices.md) defers.

## Deliberately not next

**The character roster**, beyond what a wave table needs. `src/content/ships.ts` has one row and it is
deliberately not one of `docs/game.md`'s four golfers; authoring characters is expensive to redo and
it is downstream of everything above.

**Theming the levels to biomes.** `docs/game.md` themes levels on the fourteen *Far Carry* biomes and
names none of them, so picking one means going to the predecessor for material — which `CLAUDE.md`
allows only for a named file and a named reason. It is a one-line table edit whenever that reason
exists.

**Anything about flight.** It is settled. The keyboard's eight directions are inherent to binary keys
and are **not** a defect to be tuned away — [0037](decisions/0037-the-ship-has-mass.md) records why a
ramp cannot fix it, so a later session need not rediscover that.

**A pause screen and a settings screen.** Both are real and neither is urgent. They are also what
[0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) names as the trigger for the
back-intent switch [0017](decisions/0017-the-state-is-slices.md) still defers, so whichever lands
first carries it.

## Still open, and small

- **A cheat code, for testing the levels nobody can reach.** Asked for alongside the tiers: *"5, 6, 7
  I'd need to put in a code for invulnerability or something (doesn't currently exist)."* Half of it
  already does — `src/sim/assist.ts`'s `resilience: 'proof'` is exactly no damage taken, and nothing
  switches it on. ⚠️ It is an ASSIST, so
  [0024](decisions/0024-the-accessibility-floor-is-settings.md) already permits it and
  [0047](decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md) keeps it off the
  tier axis; what is missing is a way to reach it and a decision about whether a run flown that way
  may finish.

  ⚠️ **[0068](decisions/0068-a-run-over-is-a-continue.md)'s free continue is standing in for it**, and
  it was not built to: *"effectively unlimited lives."* It gets a tester past a level they cannot
  beat, which is what the ask wanted, and it does it by handing back the ship rather than by making
  the ship immortal — so the tester still flies every fight. **This item stays open**, because the
  continue is a product decision that will be tuned and an assist is one that will not, and the day
  the continue stops being free is the day the levels behind it become unreachable again.

- **itch**: `BUTLER_API_KEY`, the *played in the browser* flag, and the channel. `docs/scaffold-plan.md`
  has the list; none of it is code.
- **A hand measurement on a physical 2021-class Android**, once, to calibrate the frame budget's
  counts against milliseconds — owed by [0022](decisions/0022-frame-rate-is-a-feature.md) and
  restated by [0025](decisions/0025-the-frame-budget-is-counted-not-timed.md).
- **Music.** [0072](decisions/0072-a-cue-is-baked-and-played.md) landed the effects and deliberately
  did not touch this; `docs/game.md` still has it under *Open*. Procedural synthesis keeps the
  single-file build and a baked track does not, which is the whole of what is decided.

  ⚠️ **The twelve effects have never been heard in play.** `node scripts/hear.mjs` writes every one of
  them to a `.wav` without launching the game — that is the ears-on half of
  [0027](decisions/0027-measure-the-picture-not-the-model.md) — but the verdict is a hand on the
  controls, and it wants to be the same play-test that covers the fourteen above.

## How to check the things this file cannot know

```bash
gh pr list
```

Open work is not recorded here on purpose — it is the fastest thing in the project to go stale, and
`gh` is the truth. Same for the build under test: `docs/machine.md` has the branch-preview URL format
and the byte-count check.
