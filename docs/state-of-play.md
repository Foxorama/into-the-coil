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

## The first five minutes

⚠️ **Pointers and two commands. Nothing here is a fact you could not get from the files it names** —
[0029](decisions/0029-the-tracked-record-is-the-record.md) — and it exists because the reading order
is correct in `CLAUDE.md` and spread across four separate rules, so every session assembles it again.

**Read, in this order:**

1. `docs/machine.md` — gitignored, and **node is not on PATH without it.** It also has the
   branch-preview URL format and how to tell which build is being looked at.
2. `CLAUDE.md` — the constitution. Rules only; every rule names the decision behind it.
3. `docs/game.md` — **what the game IS.** The easiest thing to skip and the one that makes a
   proposal wrong rather than late.
4. **This file**, and then whatever it links to for the work in hand.

**Run, before proposing anything:**

```bash
gh pr list
```

Open work is deliberately not recorded here — it is the fastest thing in the project to go stale.

```bash
curl -s https://next.intothecoil.vulpecula.games/ | grep -c pointercancel
```

⚠️ **Establish which build a report is about BEFORE debugging it.** A session was once spent on
*"I can't move the ship"*, which was a correct observation about a branch that had not merged;
`docs/machine.md` has the exact check for a branch preview, where a byte count is exact and this
marker is not needed.

⚠️ **AND IF THE REPORT IS ABOUT SOMETHING A DECISION ALREADY ANSWERED, THE QUESTION IS WHAT THE
PREVIOUS FIX LEFT STANDING** — not what number to move. Two of the four items in the 2026-08-09
play-test were defects against the decision that had just answered them:
[0077](decisions/0077-a-pickup-arrives-rather-than-stopping.md) fixed a pickup's impact and left the
wall it hit, and [0084](decisions/0084-the-dial-is-the-level-and-the-guns.md)'s clamp was correct
while the level authored a three-health turret ten units behind the pickup that lifts it.
[0027](decisions/0027-measure-the-picture-not-the-model.md) is the rule; those two are what it looks
like in practice.

⚠️ **`npm test` is not `npm run prove`.** A change to a shared quantity wants the whole proof before
it is pushed — guards stop reaching their subject without ever going red, and only a full run sees it.

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
| ~~a pickup is two things, and the camera says which~~ — **superseded** | [0052](decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md) → [0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md) |
| **a pickup is rare, and says what it is** | [0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md) |
| **two upgrade ladders of four tiers; nine pickups a level, of four kinds** | [0083](decisions/0083-two-ladders-of-four.md) |
| **a difficulty DIAL that moves inside a level and sawtooths across the run** | [0084](decisions/0084-the-dial-is-the-level-and-the-guns.md) |
| **a death costs the upgrades and NOT the bombs; a continue is what resets them** | [0085](decisions/0085-a-death-does-not-cost-the-bombs.md) |
| **level one waits a run-up after the clamp lifts before anything takes two shots** | [0086](decisions/0086-the-teeth-wait-for-the-gun.md) |
| **a pickup never parks: the wait is a journey that ends where the ship flies** | [0087](decisions/0087-a-pickup-never-parks.md) |
| **a cue is layers with filters, not one oscillator** | [0089](decisions/0089-a-cue-has-a-body.md) |
| **the music is four synchronised loops, and intensity is their gains** | [0090](decisions/0090-the-music-is-four-loops.md) |
| **a boss brings two music layers with it, and their gain is how close it is** | [0091](decisions/0091-the-boss-has-an-aura.md) |
| **a mix number is an ear; what is guarded is the arithmetic and the geometry around it** | [0092](decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md) |
| **a beat is a whole number of sim steps, and every cadence is a fraction of one — 150 BPM** | [0093](decisions/0093-the-gun-is-on-the-grid.md) |
| **the sim has a clock; the guns fire on its grid and the music is moved to agree** | [0094](decisions/0094-in-time-is-not-in-phase.md) |
| **the title and the level are two pieces; a layer's loop may be any whole multiple of the shortest** | [0095](decisions/0095-the-level-has-its-own-music.md) |
| **everything that shoots at the player is on a sixteenth grid, phase quantised at spawn** | [0096](decisions/0096-the-enemies-play-along.md) |
| ~~the near sky is pushed back on every cheap axis~~ — **amended: it went out** | [0088](decisions/0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md) → [0097](decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md) |
| **the sky is three layers, the fastest is streaks, and a tube is a side of the hull** | [0097](decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md) |
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
| **a death scatters HALF of what it took, on a short timer** | [0066](decisions/0066-a-death-scatters-what-it-took.md), amended by [0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md) |
| **a new run opens on an empty field** | [0067](decisions/0067-a-new-run-opens-on-an-empty-field.md), [`the-sweep-that-served-two-rules`](../reports/the-sweep-that-served-two-rules-2026-08-07.md) |
| **a run over is a continue, and it keeps the level** | [0068](decisions/0068-a-run-over-is-a-continue.md) |
| **a death is a beat, and the unspent arsenal goes up with the ship** | [0079](decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md) |
| **the box is the screen, and the screen is 16:9** | [0080](decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md) |
| **what must be told apart is told apart by more than ink** | [0081](decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md) |
| **seven levels, seven bosses, one idea each** | [0071](decisions/0071-five-more-levels-and-one-idea-each.md) |
| **a style is a setting, a choice is not an action, and neither may touch the sim** | [0070](decisions/0070-a-style-is-a-setting-and-the-first-one.md) |
| **a cue is baked and played, and it names the picture it is the twin of** | [0072](decisions/0072-a-cue-is-baked-and-played.md) |
| **an enemy is a pilot: motion is a closed union and three of them react to the player** | [0073](decisions/0073-an-enemy-is-a-pilot.md) |
| **the edge of the player's box is drawn, and the clamp and the mark are one number** | [0074](decisions/0074-the-box-is-drawn.md) |
| **a level boundary is a change of script, not a change of scene** | [0076](decisions/0076-a-level-has-an-origin.md) |
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

⚠️ **A PICKUP IS NOW A PREMIUM GAME PIECE, WHICH IS THE LARGEST CHANGE TO WHAT A RUN FEELS LIKE
SINCE THE ENEMIES STARTED SHOOTING** — [0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md).
A level offers **six** where it offered nineteen to twenty-four: three `weapon`, two `shield`, one
`bomb`, and what the level authors is what the player gets, because the cycle is gone. One weapon
pickup raises both cadences and a hardpoint together; past the cap it becomes a bomb charge instead of
unbounded damage, which is *"max speed auto-fire is way too strong"* answered at its cause. **A death
now hands back half of what it took** rather than all of it. **There are no extra lives to find** —
0082 replaced the extra-life pickup with a second shield, and a run's complement now only goes down.

⚠️ **A DEATH IS NOW AN EVENT WITH A LENGTH, AND THE SHIP SHOWS WHAT IT IS CARRYING** —
[0079](decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md) and
[0081](decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md). The ship
comes apart over eight tenths of a second, its unspent bombs go off as a ring at the wreck, the
continue screen waits for all of it, and the hull gains a tier every two upgrades. **The player owns
88% of both axes of a 16:9 screen** rather than 81% of one of them
([0080](decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md)), and **what shoots back is no
longer drawn as what the player fires** — which it had been since enemies could shoot.

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

⚠️ **AND THE ENEMIES NOW FIGHT BACK, which is the largest change to what this game IS since it had a
run in it** — [0073](decisions/0073-an-enemy-is-a-pilot.md). Lancers steer across to your lane while
they close, wardens fly in and orbit you, chargers pass and come back twice before they leave;
drifters and turrets deliberately still do neither. How hard a body tries is a tier's `aggression`
column. Auto-fire is untouched and always will be —
`src/content/actions.ts` says there is no `fire` action and there must never be one.

⚠️ **AND A PLAY-TEST OF THAT BUILD SAYS THEY STILL DO NOT** —
[`the-third-play-test`](../reports/the-third-play-test-2026-08-08.md). Whatever the paragraph above
describes, it is not what the player experienced, and that gap is chunk 7 under *What is next*.

Each level opens on an empty screen so the player can find the controls before anything finds them —
[0043](decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) — and a level BOUNDARY no
longer resets the scene: the camera, the ship and the sky all carry on
([0076](decisions/0076-a-level-has-an-origin.md)). The forward edge of the player's box is drawn
([0074](decisions/0074-the-box-is-drawn.md)), so the wall the ship meets is a wall the player can see.

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

⚠️ **THE FIFTH PLAY-TEST IS THE CURRENT ONE AND IT OUTRANKS EVERYTHING BELOW IT** —
[`the-fifth-play-test`](../reports/the-fifth-play-test-2026-08-10.md), given 2026-08-10 against the
build carrying 0089 to 0096. **Six items, four of them landing as decisions 0097 to 0100**, and the
instruction that came with it was *"full auto and merge PRs"*.

⚠️ **It is the FIRST play-test that has ever mentioned the sound**, and half of it is about nothing
else. The three audio items are all about **coherence** — *two separate tracks*, *a few seconds
repeated for minutes*, *close to on beat but they don't mesh* — which is a third axis this project has
never tuned: it has tuned gains (0092) and it has tuned timing (0093, 0094) and it has never once
tuned harmony.

⚠️ **THREE OF THE SIX ARE DEFECTS AGAINST THE DECISION THAT ALREADY ANSWERED THEM**, which is now the
pattern of two feedback rounds running. The report has the table; read it before answering a repeat
report, and read [0027](decisions/0027-measure-the-picture-not-the-model.md) first.

| item | state |
|---|---|
| the sky lost its layers and crawls; the missiles fire from the centre | ✅ [0097](decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md) |
| the enemies fire in unison and every bullet is the same | |
| the effects do not mesh with the music | |
| the title's metronome, and a level's music that goes nowhere | |

⚠️ **THE THIRD PLAY-TEST IS THE ONE ABOVE THAT AND IT OUTRANKS EVERYTHING BELOW IT** —
[`the-third-play-test`](../reports/the-third-play-test-2026-08-08.md), given 2026-08-08 against the
build carrying 0072, 0073, 0074 and 0076 — the five-changes-unflown batch the previous version of this
file was waiting on. **Read it before proposing any game work.** It is the largest batch of feedback
the project has received and it is about what the game IS, not about what it does wrong; it arrived
with an explicit instruction that it outranks the queued weapon and design work.

⚠️ **Its headline is a thesis rather than a finding, and it re-opens
[0073](decisions/0073-an-enemy-is-a-pilot.md) from the far side.** *"the waves and enemies we have
just 'exist', they aren't actively trying to interact or stop the player"* — said about the build
where the enemies had already been made to react. The report has why that distinction matters.

⚠️ **Two things in it CHANGE DECISIONS rather than tune them**, and both are named in the chunk list
under *What is next*: the player has chosen to **optimise the viewport for desktop** and give mobile
its own (which amends [0023](decisions/0023-the-long-axis-is-the-scroll-axis.md) and takes the
`MIN_ASPECT` trade [0074](decisions/0074-the-box-is-drawn.md) deferred), and the accessibility default
is reported as having gone **too far toward uniformity** for sighted play, which is
[0024](decisions/0024-the-accessibility-floor-is-settings.md) read against itself.

⚠️ **THE MIDDLE TIER WAS PLAYED END TO END THE DAY BEFORE, AND THE HEADLINE WAS ONE WORD** —
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

⚠️ **START HERE. THE LIST IS THE EIGHT CHUNKS BELOW AND IT COMES FROM
[`the-third-play-test`](../reports/the-third-play-test-2026-08-08.md).** That report is where the
words are; this is only the order and the state. **Read the report first** —
[0029](decisions/0029-the-tracked-record-is-the-record.md), a summary is a second copy.

⚠️ **The ORDER is a proposal and the player has not set it**, unlike the previous two lists. It is
sequenced so that nothing is tuned before the thing it is judged through moves: the picture is made
honest first, then legible, then the systems, then the tuning. **If the player gives an order, that
one wins.**

⚠️ **The verdict on all eight is ONE play-test after the last one lands**, for the reason that
governed both previous lists: *"something might feel right by itself in isolation and then completely
fail when you mix something else in."*

| # | chunk | why here | state |
|---|---|---|---|
| 1 | **The bug sweep** — pickups hitting a wall mid-screen, the death scatter firing straight up and down, missile tubes reaching three | Cheapest, and each one is a **false signal in the picture**. [0027](decisions/0027-measure-the-picture-not-the-model.md): tuning against a lying picture tunes the wrong thing. | ✅ [0077](decisions/0077-a-pickup-arrives-rather-than-stopping.md) |
| 2 | **The death beat** — explosion, pause, respawn, and the same before the continue screen | A death is the most-repeated event in a run and it currently has no beat at all. Independent of everything else. | ✅ [0079](decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md), which also carries **the pyre** the player added to it |
| 3 | **The view** — sky +33%, the perspective zoom, the box made a rectangle and extended, desktop-first | **Blocks 6, 7 and 8.** *"enemies fly too fast"* and *"a quarter of the screen is unplayable"* are both statements about the viewport; changing it changes what every one of those numbers means. | ✅ [0078](decisions/0078-the-sky-moves-a-third-faster.md) + [0080](decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md) — **mobile's own viewport is still owed** |
| 4 | **Legibility** — shape and size differentiation, over the palette rather than instead of it | **Blocks the re-play.** A player who cannot tell a pickup from a bullet cannot give a verdict on anything below. | ✅ [0081](decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md) — the two bullets, and the ship's hull. **The pickups are deliberately left to chunk 5** |
| 5 | **The pickup taxonomy** — one weapon pickup, per-level budgets, the 50% death scatter, and the max-speed nerf | The player calls pickups *"the lynchpin of whether this game is actually good"*. Comes before the dial because the dial is keyed to them. | ✅ [0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md), off [`the-pickup-taxonomy-mapped`](../reports/the-pickup-taxonomy-mapped-2026-08-08.md). **Start at row 6.** |
| 6 | **The difficulty dial** — a dial that moves inside a level, keyed to the arsenal, sawtoothing across the run | The mechanism the project **does not have**. Smallest proof first: no multi-hit enemies until the 2nd upgrade has spawned. | ✅ [0084](decisions/0084-the-dial-is-the-level-and-the-guns.md) — the mechanism and its one consumer, **plus [0086](decisions/0086-the-teeth-wait-for-the-gun.md)**, which is the level half the clamp could not do. **Chunks 7 and 8 are what it spends** |
| 7 | **Enemies that fight** — slower, patterned, more of them shooting, slower bullets | The headline. Deliberately after 3 and 6, because *"too fast"* is measured through the viewport and *"actively trying to stop the player"* is what the dial spends. | |
| 8 | **Bosses that are bosses** — tougher, damage that shows, one idea each, and a miniboss below them | Last, on [`medium-played`](../reports/medium-played-2026-08-07.md)'s own reasoning: a boss that dies in under a second is a curve problem before it is a movement problem, and 5 is the curve. | **Not started, on purpose — it is a SEQUENCE of sessions rather than a chunk. See below.** |

⚠️ **Chunks 3 and 4 each change a DECISION and not a number**, so each carries one:
[0023](decisions/0023-the-long-axis-is-the-scroll-axis.md)'s *only lookahead varies by device* and
[0024](decisions/0024-the-accessibility-floor-is-settings.md)'s loud default. Neither is a constant
edit and neither should be landed as one.

### Chunk 8 is a sequence of sessions, and the player has said so

⚠️ **THE ASK, in the player's own words, 2026-08-09:** *"Bosses need much more dynamic movement as
well and they need to have chunks and pieces fly off when they change states."*

⚠️ **AND HOW IT IS TO BE BUILT, which is a process decision rather than a design one:** *"I'll do the
boss pass as its own thing, might even do a separate session for each individual boss to keep them
unique and interesting."* So chunk 8 is **not one PR** and should not be scoped as one. A session
that opens this row and starts writing seven bosses is doing the wrong thing.

⚠️ **The two halves of the ask are not the same size, and the cheap one is shared.**

- **The chunks flying off is `docs/decisions/0036-…` unapplied**, on the most-watched event in a
  level: a phase change is an event the model resolves and **the picture does not mention at all**
  today. It is machinery every boss wants, so it wants landing ONCE, before the per-boss sessions —
  otherwise seven sessions each invent it and the seventh is the only one that gets it right.
- **The movement is per boss and is the reason for the sequence.** What exists is one behaviour with
  seven silhouettes on it: `stepBoss` closes on a station, slides across the lane and reverses at the
  edges, and a phase only scales that slide and adds shots. That is
  [`medium-played`](../reports/medium-played-2026-08-07.md)'s *"they all do the exact same movement
  with different shapes"*, still true, and [0061](decisions/0061-a-boss-keeps-flying.md) is why —
  its subject was *a boss that stopped flying*, so it gave all seven the same drift on purpose and
  named the alternative as content.

⚠️ **ONE QUESTION IS OPEN AND IT DECIDES WHICH FILES A BOSS SESSION TOUCHES**, so ask it before
building rather than after: is a boss's movement **a closed union per boss**, the way
[0073](decisions/0073-an-enemy-is-a-pilot.md) did it for enemies — one named pattern per row — or
does it **change per phase**, so one boss flies differently as it dies? The second is roughly twice
the work and is a different shape of table. It has not been put to the player.

### Where the sessions that took this feedback got to

**Three landed on 2026-08-08, in this order**, and each is linked from its row above:
[0077](decisions/0077-a-pickup-arrives-rather-than-stopping.md) (chunk 1, all three defects),
[0078](decisions/0078-the-sky-moves-a-third-faster.md) (the sky half of chunk 3), and the record
itself. **Chunk 2 was mapped and deliberately not started** —
[`the-death-beat-mapped`](../reports/the-death-beat-mapped-2026-08-08.md) has the whole
investigation, including the eight call sites that have to be gated and the two numbers nobody has
chosen. **It has since landed off that map**:
[0079](decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md), which answers
both halves of the report with one moved call and carries the pyre the player added on top of it.

⚠️ **0079 records what the map got wrong, which is worth as much as what it got right.** The map
listed eight call sites to gate and one of them — `stepShields` — turned out to need no gate at all:
gating it would have frozen an orbiting mark in world coordinates for the length of the beat, which
is the bug it looks like it prevents. The single description
([0050](decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md)'s
`shieldsOf`) already answered correctly.

⚠️ **The two numbers the map left open are now chosen and neither has been flown**, which is exactly
the accumulation the ⚠️ below is about: 48 steps of beat, and the scatter thrown at the END of it.

⚠️ **CHUNK 5 HAS LANDED** — [0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md), off
[`the-pickup-taxonomy-mapped`](../reports/the-pickup-taxonomy-mapped-2026-08-08.md). Six kinds became
three, every level went from 19–24 entries to six, the cycle is gone, the 50% scatter is in and the
unbounded overflow damage behind *"max speed auto-fire is way too strong"* is deleted. **Read the
decision before touching a pickup number**: four of its parts are one decision and three of them
cannot be tuned alone.

⚠️ **It amends more than it adds, and two of those are worth knowing before you read anything older
than it.** `docs/game.md`'s **twenty-second rearm rule is gone** — three weapons a level cannot meet
it, and the 50% scatter is what replaced it — and **there are no extra lives to find any more**, so a
run's complement only goes down. 0082 has both, and the second is the one to look at the day
[0068](decisions/0068-a-run-over-is-a-continue.md)'s free continue stops being free.

⚠️ **THE SIX-DECISION BATCH HAS BEEN FLOWN AND THE VERDICT WAS SHORT** —
[`the-batch-flown`](../reports/the-batch-flown-2026-08-08.md), taken on `into-the-coil.pages.dev`
against a build confirmed byte-exact with `main`. *"Not much feedback… the ship now takes on a new
appearance with upgrades and it looks good."* That closes the four numbers below and is
[0081](decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md)'s first
evidence. Read the report for what silence does and does not settle.

| what was owed | outcome |
|---|---|
| the death beat's 48 steps ([0079](decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md)) | not reported. Stands, with its first evidence |
| the pyre, never seen in a still | not mentioned, which is not the same as seen |
| the box's short shot range at the forward wall ([0080](decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md)) | not reported as the bug 0080 predicted |
| the two bullets ([0081](decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md)) | not mentioned; still never seen in a still |

⚠️ **AND 0082 WAS AMENDED BEFORE IT WAS EVER PLAYED THROUGH** —
[0083](decisions/0083-two-ladders-of-four.md). Missiles are their own kind again, both upgrade ladders
are exactly four tiers, a level offers **nine** pickups rather than six, and the 50% scatter is gone
(*"too punishing"*, played). **Read 0083 before 0082**: it supersedes 0082 on the taxonomy, the density
and the scatter, and 0082 remains the record of why the four kinds became one in the first place.

⚠️ **The one thing 0082 said that 0083 makes obsolete on purpose**: it argued that dropping the cycle
was right because a coin flip on a premium piece reads as the game taking something away. Still true —
and the cycle is coming back one level down, **between weapon TYPES rather than between kinds**, which
is the version that argument always supported.

⚠️ **What the next play-test is FOR, and every one of these is a number nobody has felt.** The first
two are [0085](decisions/0085-a-death-does-not-cost-the-bombs.md) and
[0086](decisions/0086-the-teeth-wait-for-the-gun.md); the rest were already owed:

- **A death that costs no charges, and therefore grants none.** A ship that dies empty now flies again
  empty, where it used to be handed the starting two. That is the half of 0085 nobody asked for, and it
  is the first thing to look at if dying reads as a spiral.
- **The free pyre.** The ring still fires at the wreck, still sized by the charges, and the ship keeps
  them — the one place in the game where the picture shows something spent that is not. 0085 took that
  trade deliberately and `tests/death.test.ts` holds it.
- **Level one's run-up — 730 units of one-health kinds after the second weapon pickup.** Whether it
  reads as a respite the new gun is spent on, or as a flat stretch. `MULTI_HIT_RUNUP` is the floor and
  the band is a content edit either way.
- **A pickup that comes to you.** 0087 makes an untouched pickup arrive at the ship's own `along` as
  its wait ends, so the crossing is now a decision about ONE axis rather than two. Nobody has flown
  it, and *"comes up fast"* is about the approach, which is untouched.
- **The sky, for the third and second time.** The levers left are the alpha, which can go to nothing,
  and the depth, which has a ceiling with an argument behind it. **After those the answer is not a
  number** — 0088 says so rather than leaving a fourth pass to discover it.

**And the five that were already owed:**

1. **Nine pickups a level, and whether the weapon cap lands where it should.** Four weapons cap the
   guns about 48 seconds before the boss; two missiles reach tier 2; then a bomb and a shield. *"Then
   I'll test and we'll cut back or add based on that."*
2. **The bomb pickup's two charges.** One a level on top of 0053's one-per-level-cleared. First thing
   to look at if bombs feel free.
3. **The hull ladder, which has now been re-measured out from under itself twice.**
   `UPGRADES_PER_TIER` is 2 over three hulls; a run can reach eight upgrade tiers, so the last hull
   arrives at four — inside level one again. The hand that validated it was flying a different density.
4. **The four glyphs.** Shield and bomb turned a quarter turn, missiles are a new face. Eyes-on says
   all four read at the key and in play; whether they read *in a fight* is what 0081's rig cannot show.
5. **Whether a capped ladder handing out bombs reads as a reward or as a shrug.** It is what pays for
   the weapon cap existing at all, and no still frame can say.

⚠️ **THE PROOF HARNESS NOW REFUSES A STRANDED PROBE IN A SECOND RATHER THAN IN TWELVE MINUTES** —
[0079](decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md) records why. An
edit to `src/app/frame.ts` orphaned probes belonging to 0041 and 0050, and `npm run prove` said so
after the baseline suites, six tree copies and 384 vitest runs, from CI. `anchorFailures` asks
`planEdit`'s existing question over **every** probe before a tree is copied, and `npm test` asks it of
the real set. **It has already earned itself twice** — it caught 0069's two probes during 0080.

⚠️ **AND A GUARD CAN STOP WORKING BECAUSE A BOUND MOVED, WHICH ONLY A WHOLE-SET `prove` CAN SEE.**
0080 raised `MIN_ASPECT` and two other decisions' guards stopped firing: 0061's drift probe went
STILL GREEN (the bound loosened by 28 units under it) and 0048's boss guard went WRONG TEST (its
margin was 19 units and the bug moved the number by 6). **Run `npm run prove` in full before pushing a
change to a shared constant** — `npm test` cannot see either failure.

⚠️ **Three guards were caught measuring something adjacent to what they named.** 0077's
bob guard stayed green with the bob switched off — it was measuring the band the pickup waits in, and
the ease-in is worth five units of band on its own — and 0078 found `tests/budget.test.ts` restating
the sky array under a comment claiming it did not. Both were found by changing a number and asking
what should have gone red. **`npm run prove` caught the first and would not have caught the second**,
because a probe can only redden a guard that exists; the second was found because the change forced a
look at the copy. That is [0027](decisions/0027-measure-the-picture-not-the-model.md)'s gap and
0019 does not close it.

⚠️ **AND A FOURTH PLAY-TEST FOLLOWED IT, WITH FOUR ITEMS — THREE HAVE LANDED AND THE FOURTH IS THE
NEXT PR.** *"Pickups come up fast, still hit the middle barrier and then float a bit"*, *"the closer
starfield needs to be much further backgrounded, still distracting"*, *"the background needs to move
faster, still feels really slow"*, and *"bosses need much more dynamic movement as well and they need
to have chunks and pieces fly off when they change states."*
[0087](decisions/0087-a-pickup-never-parks.md) and
[0088](decisions/0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md) are the first three.
**The bosses are chunk 8 and are not started.**

⚠️ **AND 0088's TWO SKY ITEMS CAME BACK INVERTED IN THE FIFTH PLAY-TEST** —
[0097](decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md). *"Still distracting"* was
answered so thoroughly that the layer went out, and *"the background needs to move faster"* was then
being said about a sky whose only visible layer is the slow one. **0088 predicted its own successor in
writing** — *"after that the answer is not a number — it is a different sky"* — and 0097 is it: three
layers, and the fastest is drawn as streaks so that speed stops having to be bought back with alpha.

⚠️ **TWO OF THE THREE WERE DEFECTS AGAINST THE DECISION THAT ALREADY ANSWERED THEM**, which is now
the pattern of this whole feedback round rather than an accident:
[0077](decisions/0077-a-pickup-arrives-rather-than-stopping.md) fixed the impact and left the wall,
[0069](decisions/0069-the-sky-is-behind-the-game.md) and
[0078](decisions/0078-the-sky-moves-a-third-faster.md) each moved the right lever and not far enough,
and [0086](decisions/0086-the-teeth-wait-for-the-gun.md) is the same shape one chunk up. **Read
[0027](decisions/0027-measure-the-picture-not-the-model.md) before answering a repeat report**: the
question to ask first is what the previous fix left standing, not what number to move.

⚠️ **0087 IS ALSO THE LARGEST HAUL OF BROKEN GUARDS THE PROOF HAS FOUND IN ONE CHANGE.** Three guards
belonging to 0064 and 0077 were passing for the wrong reason, and all three were leaning on the same
thing 0087 removed — a pickup that stops. One sampled a single phase of a periodic quantity, one had
started measuring collection rather than departure, and one modelled a failure mode that no longer
exists. The decision has each. `npm test` saw none of them.

⚠️ **THE DIAL WAS FLOWN THE SAME NIGHT AND CHUNK 6's OWN DEFECT CAME BACK** —
[0086](decisions/0086-the-teeth-wait-for-the-gun.md). *"They can't start appearing till after the
second weapon pickup"*, said about the build 0084 had just landed in. **0084 was not wrong and its
guards were not asleep**: the clamp lifts when a weapon pickup SPAWNS, and level one authored a
three-health turret **ten world units** behind that pickup. The decision has why the clamp is left
alone and the level moved instead, and it is the second time in three days that a repair landed in the
model while the player watched the same picture —
[0027](decisions/0027-measure-the-picture-not-the-model.md).

⚠️ **AND THE SAME PLAY-TEST FOUND A BOMB BUG THAT WAS A DECISION RATHER THAN A DEFECT** —
[0085](decisions/0085-a-death-does-not-cost-the-bombs.md). *"Bombs should be reset on a continue, but
not on player death."* Read the decision before touching either arm of that reducer: **a death now
costs no charges and grants none either**, the pyre is deliberately free, and three guards that had
been proving nothing are named there — while every death restocked, `continued`'s arsenal line was a
byte-for-byte copy of `lifeLost`'s.

⚠️ **✅ CHUNK 6 HAS LANDED, AND IT IS A MECHANISM WITH ONE CONSUMER** —
[0084](decisions/0084-the-dial-is-the-level-and-the-guns.md). The dial is
`1 + levelIndex + weaponsOffered`, clamped 1–11; it sawtooths, and it reaches **exactly 11 at the last
boss** because seven levels times four weapon pickups says so. What it spends today is the reported
defect it was scoped around: **nothing takes more than one hit until level one has offered two weapon
pickups.** Chunks 7 and 8 are what give it more, and 0084 is honest that a dial with a single reader is
one refactor from being a number in a file.

⚠️ **Two things in 0084 are owed a hand rather than a guard.** The first boss sits at dial **5** where
the ask says *"4 or so"* — one notch, and the whole curve is two constants. And **while the opening
clamp is on, all three tiers are the same game**: a floor on shots-to-kill beats a multiplier, so a
player who picked *Let the Galaxy Burn* gets the same opening thirty seconds as one who picked
*Legendary Pilot*. Both are written down in the decision rather than left to be found.

### The previous list, and what survives of it

**It was [`medium-played`](../reports/medium-played-2026-08-07.md)'s seven findings.** Four had landed
and been flown by the time the third play-test was taken, and the third play-test's verdict on them is
in the report — in two cases it is *that did not work*. Kept below because the three unlanded items
are still real and the eight chunks above swallow them rather than replacing them:

- **the arsenal answering backwards** (item 3 below) — untouched by the new feedback, and its
  precondition is now **chunk 4** rather than a vague taxonomy pass
- **the curve** (item 4 below) — now **chunks 5 and 6**, with a specified shape instead of a direction
- **boss movement** (item 5 below) — now **chunk 8**, with three more complaints attached

**The order below is the one the player set for the PREVIOUS list.** The
order below is the one the player set.** Four of the seven have landed. Everything else here is a
pointer into that report or into the decision that answered it —
[0029](decisions/0029-the-tracked-record-is-the-record.md), so read the report for the words rather
than a summary of them here.

**1 — ✅ DONE. The enemies are enemies.**
[0073](decisions/0073-an-enemy-is-a-pilot.md). Motion became a closed union, lancers hunt, wardens
orbit, chargers double back, and a tier's `aggression` is the *"depending on difficulty"* half. It
also closed the reported defect that an enemy off the LEADING edge could shoot — the `across` axis had
that check since [0059](decisions/0059-the-lane-is-the-players-box.md) and the other never did.

⚠️ **IT HAS NOW BEEN PLAYED AND THE VERDICT IS THAT IT DID NOT LAND** —
[`the-third-play-test`](../reports/the-third-play-test-2026-08-08.md): *"the waves and enemies we have
just 'exist', they aren't actively trying to interact or stop the player"*, said about the build where
0073 was already in. **Chunk 7 is the answer and it is not a re-tune of 0073's numbers** until
somebody has established which of the two readings holds — a reactive tier too timid to read as
reactive, or *actively working to stop the player* meaning something 0073 did not build.

⚠️ **The cues in [0072](decisions/0072-a-cue-is-baked-and-played.md) have still never been mentioned
by a play-test**, in either direction, across two of them.

**2 — The two remaining defects.** Both confirmed in the code before the report was written, both
small, and both are removing a false signal rather than a design change:

- **✅ DONE — the player's box was a wall with nothing drawn on it.**
  [0074](decisions/0074-the-box-is-drawn.md). Ten dashes down the lane in the player's own ink, and
  `PLAYER_LEAD` exported so the clamp and the mark are one number rather than one subtraction written
  twice.

  ⚠️ **PLAYED, AND THE VERDICT IS THAT IT FIXED THE REPORT AND NOT THE PROBLEM** — *"the barrier line
  is just super bad - it solved the problem I was having, but it did not solve the problem the game has
  in that almost a quarter of the screen space is not playable by the player."* 0074 wrote that failure
  mode down about itself (*"the fix is a picture, not a number"*) and the number was the problem.

  ⚠️ **✅ THE NUMBER HAS NOW MOVED** — [0080](decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md),
  which takes the aspect-floor trade 0074 deferred and amends
  [0023](decisions/0023-the-long-axis-is-the-scroll-axis.md)'s clamp. The line is unchanged and sits
  at 94% of a 16:9 screen instead of 81%.
- **✅ DONE — the level boundary reset the camera to zero**, so the sky snapped and the ship was
  repositioned. [0076](decisions/0076-a-level-has-an-origin.md). The camera reset was load-bearing and
  is not deleted: a level now has an ORIGIN and its script is read from it, so a boundary changes the
  script and nothing the player is watching. ⚠️ *Seamless* turned out to mean the camera and the ship
  and **not** the bodies — [0043](decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) says
  a level opens empty, and the existing suite caught a draft that had forgotten it.

**All three defects are now closed, and none of the three has been played.**

**3 — The arsenal answers backwards**, which is the rear-firing upgrade and the omnidirectional
special.

⚠️ **✅ THE PRECONDITION IS PAID.** It carried a pickup taxonomy pass —
*"there's a lot of upgrades now so I think this'll need at bare minimum better icons to distinguish
and also better grouping of upgrades as it'll get complex pretty quickly"* — and
[0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md) is it: six kinds became three, three
silhouettes at three sizes, and the title key is three rows. **The field has room for a fourth kind
now**, which is what this item wanted before it could land.

⚠️ **`loop` has already taken the urgency out of it** — a charger that comes back is a threat the
forward guns can answer, so the rear weapon is an option rather than a requirement (0073).

**4 — The curve, both halves.** Stretch the climb AND let a capped pickup convert into something
spendable, tuned against each other. Four of the report's seven findings are this one system: *hard at
tier 1–2 and easy at 3–4*, *upgrades too frequent*, *only shield refreshes matter at the cap*, *bosses
die in under a second*.

⚠️ **✅ BOTH HALVES HAVE NOW LANDED, AND NEITHER HAS BEEN PLAYED** —
[0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md). The climb is stretched by the density
cut (three weapon pickups a level instead of a stream), and *a capped pickup converts into something
spendable* is exactly what a weapon pickup at the cap now does: it becomes a bomb charge. **That is
this item's own shape, arriving from the other list**, which is worth noticing — the two feedback
rounds asked for the same thing in different words.

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

⚠️ **✅ TAKEN** — [0080](decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md). `MIN_ASPECT`
is the reference aspect, the box is 177.8 units inset by one fraction on both axes, and the ship
reaches 88% of each. **What is still owed is the other half of the same sentence: mobile's own
viewport.** A 20:9 phone gets 217 units of view against a 177.8-unit box, which is the same complaint
at 18% rather than 22% — 0080 says why it is a second decision rather than a clause.

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

*Cycling pickups — **done and then UNDONE**, [0052](decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md)
→ [0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md).* The three pairs were the ones asked
for and the mechanism worked; what stopped being true was its premise. At six pickups a level a coin
flip on a premium piece reads as the game taking something away, and it made the ask's per-level
budgets unauthorable. **A level now authors exactly what the player gets.**

⚠️ **The two questions this section left open are both closed by that**: what a player finds in the
empty opening stretch is a shield, full stop (there is no extra life to alternate with), and the title
key is three rows that each name one thing.

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

  ⚠️ **AND IT IS NOW STANDING IN FOR A SECOND THING** —
  [0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md) took the extra-life pickup off the
  field, so a run has **no way at all to gain a life**. 0039's *"lives that refill at a boundary are
  refused BECAUSE findable ones exist"* now has nothing behind it. The continue is what makes that
  survivable, and it was not built to do that either — so the day it stops being free, two open items
  come due at once rather than one.

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

  ⚠️ **✅ BOTH HALVES HAVE LANDED AND BOTH HAVE NOW BEEN FLOWN** —
  [0089](decisions/0089-a-cue-has-a-body.md) rebuilt the twelve cues and
  [0090](decisions/0090-the-music-is-four-loops.md) is the first music the game has had. Read 0089
  before touching a cue number: *"too tinny, way too Atari 2600"* was a description of the MODEL — one
  oscillator, one envelope, no filter anywhere in the codebase — and the fix is structural rather than
  tuned.

  ⚠️ **`node scripts/hear.mjs` and `node scripts/hear.mjs --music` are the instrument**, and the
  verdict is a hand. Nothing in the suite can hear; what the suite now holds that it never did is a
  **spectrum**, which is what catches *"a tin shed heard from outside"* — a hump in the middle with
  nothing at either end.

  ⚠️ **THE 2026-08-09 PLAY-TEST ARRIVED AND IT IS A SEQUENCE OF FIVE PRs, NOT A TUNING PASS.** The
  verdict on 0089/0090/0091 was given the same night and it is the whole of what the audio work is now
  about. **The order below is the order it lands in, chosen for CI rather than for playability** —
  the player is not flying any of it until the morning.

  | # | what | state |
  |---|---|---|
  | 1 | the mix again, and the boss aura | ✅ [0092](decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md) |
  | 2 | **150 BPM, and the gun on the musical grid** | ✅ [0093](decisions/0093-the-gun-is-on-the-grid.md) |
  | 3 | the music phase-locked to the sim clock | ✅ [0094](decisions/0094-in-time-is-not-in-phase.md) |
  | 4 | **the level's own music** — power ballad × Rez, title keeps the current piece | ✅ [0095](decisions/0095-the-level-has-its-own-music.md) |
  | 5 | enemy fire on the grid | ✅ [0096](decisions/0096-the-enemies-play-along.md) |

  ⚠️ **✅ THE MAP'S BLOCKER IS GONE AND IT WAS AN ARTIFACT OF THE TEMPO IT ASSUMED** —
  [0093](decisions/0093-the-gun-is-on-the-grid.md).
  [`the-gun-on-the-grid-mapped`](../reports/the-gun-on-the-grid-mapped-2026-08-09.md) computed the grid
  at 100 BPM and concluded that putting the gun on it halves the base fire rate. **Read the report for
  its reasoning and its rejected alternatives; do NOT read its ladder or its blocker** — 0093
  supersedes both, and no enemy-health rebalance is owed after all.

  ⚠️ **0093 IS THE LARGEST HAUL OF BROKEN GUARDS SINCE 0087, AND FOUR OF THE FIVE HAVE ONE CAUSE.**
  Turning a constant from an INPUT to a ladder into a CONSTRAINT checked against it is the better
  design and it silently disarms every probe that worked by editing the constant — 0043's, two of
  0051's and 0083's. `MISSILE_FASTEST` is deleted rather than re-anchored, on this project's own *one
  guarantee, one mechanism*. **`npm test` was green for all of it.**

  ⚠️ **AND A GUARD SAMPLED ONE PHASE OF A PERIODIC QUANTITY FOR THE THIRD TIME** —
  [0087](decisions/0087-a-pickup-never-parks.md) had the first and 0090's seam guard the second. 0056's
  missile-clock guard read the clock once after 200 steps; 0093 moved the cadence to 40; 200 is exactly
  five times 40. **A single reading of a periodic quantity measures the phase you happened to pick**,
  and that is now a habit to check for rather than three incidents.

  ⚠️ **✅ AND IN TIME IS NOT IN PHASE, WHICH WAS CHUNK 3** —
  [0094](decisions/0094-in-time-is-not-in-phase.md). Two halves: the sim now has a clock (`w.steps`)
  and every auto-weapon fires on a multiple of its cadence counted from it, and the music's loops are
  moved to agree with that clock when they drift past 50ms. **The thing it exists for is dropped steps,
  not crystal drift** — 0022 discards everything past `MAX_STEPS` rather than spiralling, and each
  discard costs the phase permanently.

  ⚠️ **A `playbackRate` servo was the obvious build and is REJECTED ON ARITHMETIC** — a trim small
  enough to be inaudible absorbs 50ms in twenty-five seconds, and one 150ms hitch throws away four
  steps at once. Read 0094 before proposing it again.

  ⚠️ **AND AN ALIGNMENT TEST THAT STARTS ALIGNED TESTS NOTHING**, which is 0094's own STILL GREEN and
  the same family as 0093's phase-sampling mistake seen from the other side: **a guard whose starting
  condition is the thing it means to detect.** Two of six probes came back wrong first time.

  ⚠️ **✅ AND THE LEVEL HAS ITS OWN MUSIC** — [0095](decisions/0095-the-level-has-its-own-music.md).
  0090 predicted the cost (*"a second set of loops and a crossfade between them"*) and the cheaper
  answer it did not consider is what landed: **more layers on the same loop clock**, `calm` holding the
  title's and the rest holding the level's. No second loop set, no crossfade mechanism. **Read 0095
  before touching a music gain** — the ladder may now CLOSE a layer, and which ones is a named list.

  ⚠️ **THE PULSE CUE IS DELIBERATELY NOT RE-VOICED AS A KICK, AND THE MAP STILL LISTS IT.** *"More of
  a deep bassy beat"* was asked when the gun was the only rhythm in the game; there is a kick on every
  beat now, and a gun in the same band at ten shots a second would mask the thing the request was
  reaching for. 0095 has the argument. **If it still wants weight, the edit is presence and not bass.**

  ⚠️ **✅ AND EVERYTHING THAT SHOOTS AT THE PLAYER IS ON THE GRID** —
  [0096](decisions/0096-the-enemies-play-along.md). A **sixteenth** rather than the ship's exact note
  values, because a ship's cadence is a ladder a hand authored and an enemy's is a tuned number: three
  enemy rows moved by 4%, 0% and 3%. **`fireGapFor` snaps after the multiplier**, which is the one line
  the whole thing turns on — 0.7 of a grid value is not one.

  ⚠️ **AND AN ENEMY RELOADS RELATIVELY WHERE THE SHIP RELOADS ABSOLUTELY, ON PURPOSE.** There is one
  ship and forty enemies: an absolute grid for every body of a kind is a five-bullet volley on the
  beat instead of a pattern. **Nothing can guard that** — the shots would all be on the grid and every
  table untouched — so it is written into 0096 and the eyes-on rig is what would show it.

  ⚠️ **0096 FOUND A DEFECT THAT HAD BEEN THERE SINCE ENEMIES COULD SHOOT, AND THE COMMENTS WERE
  ALREADY RIGHT ABOUT IT.** Both visibility rules in `stepEnemyFire` say *its clock keeps running… it
  simply skipped its turn*, and both were written as a `continue` before the countdown, which freezes
  it. **84 of 88 volleys were off the beat with every content guard green.** Fixing it makes a body
  enter the view mid-count rather than with its whole gap ahead: **a real balance change, and the first
  thing to look at if waves feel sharper.**

  ⚠️ **`tests/spectrum.ts` is new and is shared by the cue and music suites** — the A-weighted band
  measure 0089 wrote for *"a tin shed heard from outside"*. It found a real defect in the new music
  (less sub than the title, every other guard green) and its FIRST version was wrong in a way worth
  knowing: **`spectrum` normalises each mix to its own loudest band, so two profiles cannot be compared
  to each other.** `bandEnergy` is the unnormalised one.

  ⚠️ **The play-test's verdict on each of the four, and 0092 answers two of them:**

  | | |
  |---|---|
  | the twelve cues | 0089. **Not reported in either direction**, which after two play-tests is itself the finding |
  | the mix | *"main sfx need to be lowered a bit, background music needs to be raised a bit"* — the same complaint 0090's measured pass had just answered. [0092](decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md) has why a correct ratio was the wrong quantity |
  | the music | 0090. *"Kinda interesting title background music, but not great level background music"* — chunk 4, and the title keeps it |
  | the aura | 0091. *"Really weak, I didn't even notice it over the fire."* [0092](decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md), and it was the CURVE rather than the gain |

  ⚠️ **0092 IS THE THIRD TIME IN THIS PROJECT THAT A DECISION'S OWN GUARDS STAYED GREEN THROUGH ITS
  OWN DEFECT**, and the cleanest example of it so far: all three of 0091's aura guards are true of a
  curve that had collapsed to 0.004 of its ceiling where a boss fight is actually flown. They are
  written in terms of the constants they guard.
  [0027](decisions/0027-measure-the-picture-not-the-model.md) is the rule and
  [0019](decisions/0019-a-probe-must-be-seen-to-apply.md) explicitly cannot catch it.

  ⚠️ **AND THE COMBINED AUDIO BUS IS UNGUARDED, WHICH 0092 MAKES MORE EXPOSED AND DOES NOT FIX.** The
  music's own peak is guarded and the cues' own peak is guarded; **nothing measures the two together**,
  and they share a destination. 0092 names the limiter as the answer and says why it was not taken in
  a PR nobody was going to hear before morning.

  ⚠️ **The effects have now been heard in play, and were rebuilt before they were** — 0089.
  `node scripts/hear.mjs` and `node scripts/hear.mjs --music` still write every cue and every music
  layer to a `.wav` without launching the game, which is the ears-on half of
  [0027](decisions/0027-measure-the-picture-not-the-model.md) and the only way to iterate on a sound
  without a twenty-minute cycle.

## How to check the things this file cannot know

```bash
gh pr list
```

Open work is not recorded here on purpose — it is the fastest thing in the project to go stale, and
`gh` is the truth. Same for the build under test: `docs/machine.md` has the branch-preview URL format
and the byte-count check.
