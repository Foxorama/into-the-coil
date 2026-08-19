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

⚠️ **AND IF THE WORK IS SOUND, OPEN THE DASHBOARD BEFORE READING A NUMBER** —
[0126](decisions/0126-the-dashboard-is-the-instrument.md), [0129](decisions/0129-the-desk-holds-a-value-not-a-multiplier.md).

```bash
npm run dash
```

It serves `/rig/`: the game's own mixer on a scrub bar, every layer's live gain read off its
`GainNode` beside the target, absolute faders so a layer the rung has CLOSED can be dragged up and
heard, per-layer pan, the gun and the tubes at a tier slider, every cue on a button, **every music
layer on a button too — one click and it plays alone**
([0130](decisions/0130-a-layer-can-be-heard-on-its-own.md)), **which now works with the transport
STOPPED and leaves the level clock where it is**
([0137](decisions/0137-the-desk-sounds-while-the-level-stands-still.md)), **the three section
boundaries on draggable handles over the game's own arithmetic**
([0138](decisions/0138-a-section-boundary-is-a-distance-you-can-drag.md)), and a **copy this moment**
button that prints the lot as markdown — including the boundaries, as the constants they would be
pasted back into `src/content/music.ts` as. **A music question is opened here now, not in a `.wav`.**
`docs/machine.md` has the double-clickable launcher and the one thing about node's path on
this machine that will otherwise cost an hour.

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

⚠️ **AND `prove` IS THE LARGEST PART OF WHAT CI COSTS.**
[0115](decisions/0115-a-probe-runs-its-own-guard.md) is where that got to, and it takes an option
[0054](decisions/0054-the-proof-runs-beside-the-work-not-on-it.md) measured and refused five days
earlier. **Read 0115 before proposing another CI change**: it names the next lever (sharding across
runner jobs, which costs a branch-protection change) and the two savings that are refused rather than
un-thought-of. **The measured before-and-after is on
[PR #150](https://github.com/Foxorama/into-the-coil/pull/150#issuecomment-5252326846)**, and the
current number is whatever `gh run list` says — not whatever this file last said.

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
| **a wave plays a FIGURE — each member on its own slot — and there are three enemy bullets** | [0098](decisions/0098-a-wave-plays-a-figure.md) |
| **every pitched cue glides between two notes of the key, and the key lives in `cues.ts`** | [0099](decisions/0099-the-cues-are-in-the-key.md) |
| **an authored place is a LEVEL coordinate and every spawner adds the origin; a scatter stays in the box** | [0100](decisions/0100-a-level-places-its-pickups-too.md) |
| **a mark's depth ceiling is how much of a bullet it looks like; a boss leaves the player half the screen** | [0101](decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md) |
| **a drum step is a VELOCITY; a level's music climbs four times; the bake happens before the press** | [0102](decisions/0102-the-music-goes-somewhere.md) |
| **a sky layer's depth says which SIDE of the game it is on, and only the streak layer may be in front** | [0103](decisions/0103-the-fast-layer-is-in-front.md) |
| **an auto-weapon's cue fits inside its own cadence; a cue plays a figure by where in the BEAT it lands; the bus is mastered** | [0104](decisions/0104-the-gun-plays-a-figure.md) |
| **an enemy's `closing` is a statement about how long it is on screen, and the window is guarded in SECONDS** | [0105](decisions/0105-a-body-is-on-screen-long-enough-to-answer.md) |
| **a sky mark is at least 2.5 CSS PIXELS across, which is the one bound stated in the player's own units** | [0106](decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md) |
| **a level is a PLACE: a theme carries a backdrop and a mix, and the aura builds across the whole level** | [0107](decisions/0107-a-level-is-a-place.md) |
| **a pitched note has a weight; a guard about a layer is written over the property, never the name; the bus's ceiling is the gain and not the drive** | [0108](decisions/0108-the-bed-is-felt-and-the-boss-arrives.md) |
| **nothing the level schedules by the hundred may duck the music, and it is shorter than the beat it lands on** | [0109](decisions/0109-a-death-is-a-drum.md) |
| **how a body SHOOTS is a closed union, and a pattern is the same pattern wherever the player is** | [0110](decisions/0110-an-attack-is-a-pattern.md) |
| **a boss’s movement and attack are each a closed union; a phase change is an event the picture mentions** | [0111](decisions/0111-a-boss-has-one-idea.md) |
| **the sky may draw something bigger than a bullet only if it has NO EDGE, and then it is huge, faint and furthest** | [0112](decisions/0112-the-sky-has-weather.md) |
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
| **a strike is an INCREMENT, and a guard's validity can expire when material moves** | [0156](decisions/0156-a-strike-is-an-increment.md) |
| **A LEVEL SAYS WHERE ITS SECTIONS OPEN — order, count and timing are the level's, and the three shared distances are gone** | [0158](decisions/0158-a-level-says-where-its-sections-open.md) |
| **A CADENCE IS SIM STEPS AND A BEAT IS SECONDS — 0093's divisor rule is gone and a weapon may fire at any rate** | [0159](decisions/0159-the-two-clocks-come-apart.md) |
| **THE MUSIC FREE-RUNS ON THE AUDIO CLOCK — the sim no longer reaches it anywhere, and a tempo may move** | [0160](decisions/0160-the-music-free-runs.md) |
| **THE SHAPE OF A LEVEL'S MUSIC IS NOT GUARDED — floors stay, shape does not get asserted** | [0161](decisions/0161-the-shape-of-a-level-is-not-guarded.md) |
| **A PLACE HAS ITS OWN LADDER — it may open a layer the shared row closes, which `mix` could never do** | [0162](decisions/0162-a-place-has-its-own-ladder.md) |
| **THE SCRIPT IS EDITED IN THE DASHBOARD — rename, move, add, remove, per level** | [0163](decisions/0163-the-script-is-edited-here.md) |
| **A ROLE IS A PROMISE THE MIX HAS TO KEEP — the threshold 0152 refused, settable now that 0154 states the intent; 91 known offenders named and held** | [0164](decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md), [`what-a-role-does-not-buy`](../reports/what-a-role-does-not-buy-2026-08-18.md) |
| **THE DESK SOUNDS WHAT YOU RAISE — stopped means the LEVEL is not playing, so one drag is audible; 0137 amended** | [0165](decisions/0165-the-desk-sounds-what-you-raise.md) |
| **THE LEVEL IS SOLVED AS ONE TRAJECTORY — the boundary lurch, measured; 0.40 is the edge of free and the rest is a slider** | [0166](decisions/0166-the-level-is-solved-as-one-trajectory.md), [`what-continuity-costs`](../reports/what-continuity-costs-2026-08-18.md) |
| **A BUILD DOES NOT DUCK — a section change adds and never rebalances; the shipped ladder always did, the solve breaks it 56 times** | [0167](decisions/0167-a-build-does-not-duck.md), [`a-build-does-not-duck`](../reports/a-build-does-not-duck-2026-08-18.md) |
| **THE PACE IS ON THE DESK — notes/bar per rung, live; every place drops 17–28% at `approach` and the arc says so while you edit it** | [0168](decisions/0168-the-pace-is-on-the-desk.md) |
| **A BROWSER BUDGET IS MEASURED — 10 s for a 4.2 s transition was a coin toss; the press pays for the prewarm** | [0169](decisions/0169-a-browser-budget-is-measured.md) |
| **a probe runs on a disposable copy, and copies run in parallel** | [0054](decisions/0054-the-proof-runs-beside-the-work-not-on-it.md) |
| **a probe runs the test it NAMES, and a suite bakes the music once** | [0115](decisions/0115-a-probe-runs-its-own-guard.md) — amends 0054's *whole suite* clause |
| **a probe's `red` is a VERDICT — a timeout or a crash reports the same failed title, and every probe's line now carries what its guard said** | [0177](decisions/0177-a-red-is-a-verdict.md) |
| **the rig plays a LEVEL, and the instrument is guarded like the game** | [0116](decisions/0116-the-rig-plays-the-level.md) |
| **a section change lands on a DOWNBEAT, and not one ever had** | [0117](decisions/0117-a-section-change-lands-on-the-beat.md) |
| **the mix has a WIDTH, and the low end does not use it** | [0118](decisions/0118-the-mix-has-a-width.md) |
| **off stops the loops; an intermittent guard was a real race** | [0119](decisions/0119-off-stops-the-loops.md) |
| **a rung may CLOSE a layer — 0090's additive rule is gone** | [0120](decisions/0120-a-rung-may-close-a-layer.md) |
| **a wave sits inside one volley, and only the across axis moved** | [0121](decisions/0121-a-wave-dies-together.md) |
| **the kick is UNDER the music; the gain was the wrong lever** | [0122](decisions/0122-the-kick-goes-under-the-music.md) |
| **a rung CHANGES the notes; loudness does not predict a section** | [0123](decisions/0123-a-rung-changes-the-notes.md) |
| **a boss lasts long enough to be one; the design loadout is TIER TWO** | [0124](decisions/0124-the-boss-is-a-boss.md) |
| **the build starts 7.3s sooner; an ARRIVAL is what a listener hears** | [0125](decisions/0125-the-build-starts-sooner.md) |
| **the sound is DRIVEN rather than rendered: `npm run dash`, the game's own mixer on a slider** | [0126](decisions/0126-the-dashboard-is-the-instrument.md) |
| **a cue sounds from where it happened; the low end turned out not to need centring** | [0127](decisions/0127-a-cue-has-a-place.md) |
| **a place plays its own material and shares the rest — level two is the first, and the GAME does not play it yet** | [0128](decisions/0128-a-place-plays-its-own-material.md) |
| **the desk holds an ABSOLUTE value, so a layer the rung has closed can be heard; a place is a fader too** | [0129](decisions/0129-the-desk-holds-a-value-not-a-multiplier.md) |
| **every layer is a button: one click plays it alone, at the loudest the place ever takes it** | [0130](decisions/0130-a-layer-can-be-heard-on-its-own.md) |
| **`surge` is crossed 14.3s sooner, on the bar it is crossed on; `push` pays for it** | [0131](decisions/0131-the-surge-comes-sooner.md) |
| **a place may be ANOTHER PIECE: Ember Nebula is a choir, an organ and an inferno, 21 of 23 layers** | [0132](decisions/0132-a-place-may-be-another-piece-entirely.md) |
| **and the game plays it: the incoming place is baked across the break screen and REPLACES rather than caches** | [0133](decisions/0133-the-place-is-baked-at-the-boundary.md) |
| **a place may be another piece and may NOT be a slower one — pace and bottom held against the base** | [0134](decisions/0134-the-place-keeps-the-games-pace.md) |
| **a place arrives on the next BAR and not the next phrase — 1.6s where it was 25.6** | [0135](decisions/0135-a-place-arrives-when-you-do.md) |
| **the synthesiser has a ROOM, and a place has an arc: up, up, up, drop, sharp down into the fight** | [0136](decisions/0136-the-place-has-a-room-and-an-arc.md) |
| **the desk sounds while the level stands still — a listen no longer starts the walk** | [0137](decisions/0137-the-desk-sounds-while-the-level-stands-still.md) |
| **a section boundary is a DISTANCE YOU CAN DRAG, and the mixer follows the handle** | [0138](decisions/0138-a-section-boundary-is-a-distance-you-can-drag.md) |
| **a deadline checked between unbounded awaits is not a deadline** | [0139](decisions/0139-a-deadline-between-unbounded-awaits.md) |
| **a GAIN IS NOT A LOUDNESS — no layer a rung opens is inaudible, and too loud beats inaudible** | [0140](decisions/0140-no-layer-is-inaudible.md) |
| **ALL SEVEN LEVELS ARE THEIR OWN COMPOSITION; three theme kinds renamed and one moved a level** | [0146](decisions/0146-three-more-places-and-two-after-them.md), [`five-places-measured`](../reports/five-places-measured-2026-08-13.md) |
| **A PLACE IS A BALANCE, not a ±3 dB tint over one shared arrangement; no two places may be within 3 dB** | [0147](decisions/0147-a-place-is-a-balance.md) |
| **a hull has an INTERIOR in `space`, baked into the same bitmap; and the art can be traced without a browser** | [0149](decisions/0149-a-hull-has-an-interior.md) |
| ~~a phase can EMPTY the boss in one unavoidable curtain~~ — **the curtain half is superseded** | [0150](decisions/0150-the-uncoil-and-the-eye.md) → [0151](decisions/0151-the-gap-you-have-to-reach.md) |
| **a boss stands OPEN at the end; and its curtain has one hole IN A FIXED PLACE, thrown every 10% below half** | [0150](decisions/0150-the-uncoil-and-the-eye.md), [0151](decisions/0151-the-gap-you-have-to-reach.md) |
| **DIFFICULTY IS MANAGED BY *is this unfair* OR *is this a learnable strategy*** — the player's own rule, and it outranks the item it arrived with | [`the-uncoil-needed-a-gap`](../reports/the-uncoil-needed-a-gap-2026-08-16.md) |
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

⚠️ **THE MUSIC IS THE LIVE CHANNEL AND [0114](decisions/0114-the-fight-is-a-different-piece.md) IS
WHERE IT GOT TO.** Read it before touching a rung: 0090's additive ladder is superseded, the fight is
a different piece with its own two rungs, and the level runs 42s / 92s / 10.6s-before-the-boss.

⚠️ **AND THE FIRST ANSWER TO `surge` THAT IS NOT A GAIN HAS LANDED, UNFLOWN** —
[0117](decisions/0117-a-section-change-lands-on-the-beat.md). It changes no gain, no rung and no
distance; what moves is when a change is heard. **Whether it is enough is the open question**, and
0114's warning still governs the attempt after it.

⚠️ **AND `surge` IS NOW CROSSED 14.3 SECONDS SOONER, ASKED FOR BY NAME** —
[0131](decisions/0131-the-surge-comes-sooner.md). It is the second answer that is not a gain and the
first that moves a distance: the section is 30.4s where it was 16.1, which is the first time it has
been longer than the sixteen-bar `counter` it opens. **It does NOT discharge
[0125](decisions/0125-the-build-starts-sooner.md)'s ask** — that is still ~60 notes a bar of arriving
material, and 0131 says why the two are different.

⚠️ **AND THE INSTRUMENT FOR IT EXISTS NOW** — [0116](decisions/0116-the-rig-plays-the-level.md).
`node scripts/hear.mjs --level=<kind>` writes a whole level at its own rungs, ramps and theme.
**Read 0116 before opening a music number**: it has what the rig could not show before and why every
file this project has listened to was level one's mix.

⚠️ **TWO THINGS ARE OPEN AND BOTH ARE IN 0114's OWN WORDS.** `surge` still does not read as an event
and **the next attempt must not be another gain** — the only mechanism that has ever read as a
section boundary here is something STOPPING. And a reported *"massive musical volume difference"*
turned out to be `scripts/hear.mjs` rendering its two modes at different reference levels; the fight
is already the loudest rung. **It was one instruction away from being tuned as a defect in the
music.**

⚠️ **THE ELEVENTH PLAY-TEST IS THE CURRENT ONE AND IT OUTRANKS EVERYTHING BELOW IT** —
[`the-eleventh-play-test`](../reports/the-eleventh-play-test-2026-08-11.md), three rounds in one
session, all on the sound, against renders and then the `level-music-depth` preview.

⚠️ **IT IS THE FIRST ROUND IN SIX WHERE THE SOUND MOVED** — *"it's a lot better"* — and the report has
what was still wrong in the same breath.

⚠️ **THE METRONOME IS `chords` AND IT WAS GUESSED AT TWICE BEFORE.** 0102 answered it in `beat`, 0108
in `engine`; the solo rig is what finally let the player name it. Read the report before touching a
music layer on a description.

⚠️ **TWO OF THE THREE ROUNDS CORRECTED SOMETHING THIS PROJECT HAD JUST DONE TO ITSELF** — a boss made
peaceful by answering a bed guard with a trim, and a body-density measurement read as *more waves
cannot be the lever* when the missing quantity was the KILL rate. Both are in the report.

⚠️ **AND A PROBE THAT REFUSED TO FIRE IS WHAT FOUND THE MISSING GUARD.** 0113's central claim — a
level has a tune in it — had nothing holding it at all;
[0019](decisions/0019-a-probe-must-be-seen-to-apply.md) doing the more valuable half of its job.

⚠️ **THE TENTH PLAY-TEST IS THE ONE ABOVE THAT** —
[`the-tenth-play-test`](../reports/the-tenth-play-test-2026-08-11.md), given 2026-08-11 against the
build carrying 0108 to 0112.

⚠️ **FOUR OF THE FIVE CHANNELS ARE SIGNED OFF ON FIRST FLIGHT, WHICH HAS NOT HAPPENED BEFORE.** The
report has the words. The fifth is the sound, for the fifth round running, and all of it is one item.

⚠️ **AND THE ARCHITECTURE IS THE ANSWER RATHER THAN A NUMBER** —
[0113](decisions/0113-there-is-one-composition-and-seven-levels.md). Do not open a music number
before reading it: `MUSIC` is **one composition** and a theme is a **gain multiplier over it**, so the
seven levels are the same notes at different volumes. Seven decisions have tuned that one piece.

⚠️ **THE PLAYER SAID THEY MUST BE DESCRIBING IT WRONG. THEY WERE NOT, AND THAT IS THE FINDING TO
CARRY.** 0113 has the class failure and the ordering mistake behind it — three rounds of *"the
metronome"* were answered by guessing which layer it was, while
[0027](decisions/0027-measure-the-picture-not-the-model.md) had already said not to.
`node scripts/hear.mjs --solo` is the nine lines that end the guessing.

⚠️ **THE NINTH PLAY-TEST IS THE ONE ABOVE THAT** —
[`the-ninth-play-test`](../reports/the-ninth-play-test-2026-08-10.md), given 2026-08-10 against the
build carrying 0106 and 0107.

⚠️ **THE HEADLINE IS *STILL NOT A LOT OF VARIETY*, AND IT IS ONE WORD ABOUT FIVE CHANNELS.** The
report has the eight items and which of the six changes answers each; do not re-derive them here.

⚠️ **TWO INSTRUCTIONS CAME WITH IT AND BOTH ARE STANDING RULES RATHER THAN NOTES ABOUT THIS BUILD.**

1. **Desktop is the prestige experience and mobile is the fallback** — *"if we can make it work on
   mobile later great, but desktop is the prestige experience here."* A number held back because a
   phone could not pay for it may now be spent. 0022's budget is a FLOOR and is untouched.
2. **The style brief is advisory** — *"don't be limited by personal 'style' requests… What I ask for
   may not be 'what's right' so if I put too many strictures on things, we can go around them or
   ignore them if needed."* *"A mix of a power ballad style music and the game Rez"* is quoted four
   times in `src/content/music.ts` as the reason a layer is what it is;
   [0108](decisions/0108-the-bed-is-felt-and-the-boss-arrives.md) records what that changes and what
   it does not.

⚠️ **AND THE PICKUPS ARE CLOSED BY THE PLAYER** — *"pretty good, happy with that for now"*. The first
channel in nine rounds to be signed off.

| item | state |
|---|---|
| **the bass, the percussion, the metronome, the pace floor, the boss's own rung** | ✅ [0108](decisions/0108-the-bed-is-felt-and-the-boss-arrives.md) |
| **an enemy death is on its own sound band instead of punctuating the music** | ✅ [0109](decisions/0109-a-death-is-a-drum.md) |
| **enemies: more variety, and attacks that are patterns rather than aimed** | ✅ [0110](decisions/0110-an-attack-is-a-pattern.md) |
| **bosses: six of the seven are one boss with a different bullet** | ✅ [0111](decisions/0111-a-boss-has-one-idea.md) |
| **the sky: a bit faster, and an actual skyscape rather than marks and a hue** | ✅ [0112](decisions/0112-the-sky-has-weather.md) |

⚠️ **EVERY ITEM OF THE NINTH REPORT HAS LANDED AND NONE OF IT HAS BEEN FLOWN.** Five decisions —
0108 to 0112 — at the player’s standing instruction: *"partial implementation and adjusting is going
to be worse than adjusting with everything in."* **The next thing that happens is one play-test over
all of it.**

⚠️ **THREE THINGS ARE MEASURED, NAMED AND DELIBERATELY NOT ACTED ON**, so that a verdict can be
attributed. Each is in the decision that found it:

1. **The player’s weapons own the bottom octave.** The pulse falls to 27.5 Hz and sits at 1.84× the
   music’s own sub level while it plays, which at max fire is 96% of the time —
   [0109](decisions/0109-a-death-is-a-drum.md). The same play-test signed the weapons off, so changing
   two channels at once would make the next verdict unreadable.
2. **A level’s total bullet output is bounded by nothing.** A spinner puts three where a turret put
   one; what one BODY may send while it is visible is guarded, and what a level sends is not —
   [0110](decisions/0110-an-attack-is-a-pattern.md). If the next report says *harder*, look here first.
3. **Fill rate is the one budget this project counts nothing about**, and the nebula tile is four
   times a star tile’s pixels — [0112](decisions/0112-the-sky-has-weather.md). The blit COUNT is
   held; the pixels are not.

⚠️ **THE EIGHTH IS THE ONE ABOVE THAT AND ALL FOUR OF ITS ITEMS LANDED** —
[`the-eighth-play-test`](../reports/the-eighth-play-test-2026-08-10.md), answered by
[0106](decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md) and
[0107](decisions/0107-a-level-is-a-place.md). **It was never written into this file, which is the
gap the ninth report closes** — its three closing questions were each answered by the ninth round,
two of them by omission, and the report records which.

⚠️ **THE SEVENTH PLAY-TEST IS THE ONE ABOVE THAT** —
[`the-seventh-play-test`](../reports/the-seventh-play-test-2026-08-10.md), given 2026-08-10 against
the build carrying the whole 0097–0102 batch, flown in one pass as asked.

⚠️ **THE HEADLINE IS THE SOUND, FOR THE THIRD ROUND RUNNING, AND THIS TIME IT CAME WITH A QUESTION
ABOUT WHETHER TO CONTINUE AT ALL** — *"if we can't actually do a really good rhythm game with the
sound we're using let me know and I can drop this line of gameplay."*

⚠️ **IT WAS ANSWERED THE SAME SESSION AND THE ANSWER IS RECORDED IN THE REPORT.** The sound engine is
not the constraint — the hard parts are built. What does not exist is a rhythmic PLAYER INPUT:
`src/content/actions.ts` bans a fire action, so everything on the grid is the machine keeping time and
the player only steers.

⚠️ **AND THE PLAYER CLOSED THE QUESTION**: *"rhythm game is definitely not what I want for this game,
but I want the sound to be rhythmic and immersive and it's currently not close to that experience."*
**Do not re-open it.** No rhythmic input is to be built; the whole ask is the sound.

| item | state |
|---|---|
| **bosses 3+ show no hit interaction; the second missile tube is a pickup late; the sky, for the fifth time** | ✅ [0103](decisions/0103-the-fast-layer-is-in-front.md) |
| **the sound: the gun never stopped sounding, the explosions were off the grid, the bus was never mastered** | ✅ [0104](decisions/0104-the-gun-plays-a-figure.md) |
| **enemies fly and shoot too fast; levels 2 and 3 want level 4's density** | ✅ [0105](decisions/0105-a-body-is-on-screen-long-enough-to-answer.md) |

⚠️ **0105 CONTAINS A MEASUREMENT THAT CONTRADICTS ITS OWN INSTRUCTION, AND THAT IS THE PART TO READ.**
*"Raise 2 and 3 to level 4's density"* was asked for, and **density does not separate those levels**:
bodies per minute is within 13% of each other, the share that reacts to the player was HIGHER in level
two than in level four, and level four is the most repetitive of the three. A guard fitted to the
share was written and then deleted. **The next report about levels two and three should not be
answered with more content** — 0105 names the lever the evidence points at and records that the player
has declined it for a stated reason.

⚠️ **AND THE SESSION'S FIRST READING OF *"enemies fly too fast"* WAS WRONG.** It was sequenced after
the sky on the assumption that it was a perceptual comparison; the player corrected it — *"it has to
do with their time onscreen and the player's time to interaction with them."* **Nothing in this
repository measured a dwell time before 0105.** A body appears **eleven units** from the front of the
player's box, and the charger had 1.38 seconds on screen at the hardest tier.

⚠️ **0104 IS THE FIRST AUDIO PASS WITH AN INSTRUMENT BEHIND IT, AND THAT IS ITS LARGEST CLAIM.**
`scripts/hear.mjs --play` renders the cues OVER the music at the mixer's own gains and prints the
ratio; three previous mix passes had no way to hear the thing the reports were about. **The bed went
from 2–5 dB under the effects to 1.6–4.6 dB over them.**

⚠️ **AND `npm run prove` REPORTED STILL GREEN ON 0104's OWN HEADLINE MECHANISM.** Removing the
mastering entirely left every music guard green, because **every one of them was a ceiling** — nothing
in the repository asserted a lower bound on loudness at all. Read 0104's *What the proof found* before
touching a mix number.

⚠️ **THE SIXTH PLAY-TEST IS THE ONE ABOVE THAT** —
[`the-sixth-play-test`](../reports/the-sixth-play-test-2026-08-10.md), given 2026-08-10 against the
build carrying 0097, 0098 and 0099.

⚠️ **IT CONTAINS THE MOST SERIOUS DEFECT THIS PROJECT HAS SHIPPED, AND IT IS FIXED** —
[0100](decisions/0100-a-level-places-its-pickups-too.md). **Levels two through seven have had no
pickups in them at all** since [0076](decisions/0076-a-level-has-an-origin.md): `spawnPickup` never
added the level origin, so every authored pickup was placed about fifteen hundred units behind the
camera and culled on the step it spawned. **And the difficulty dial counted them anyway**, because
`weaponsOffered` increments at the placement — so the game raised its own difficulty on schedule for
weapons the player was never shown.

⚠️ **SO LEVELS TWO TO SEVEN HAVE NEVER BEEN PLAYED AS AUTHORED.** Every impression anyone has of their
pacing or difficulty is an impression of a different game. The next play-test is the first observation
of the real one.

⚠️ **AND THE REPORT ASKED THE RIGHT QUESTION ABOUT THE GUARDS** — *"our tests and guards seem to not
be doing a great job"* — which is the more valuable half. They were all green, and 0100 has the three
reasons: every pickup guard runs level one where the origin is zero; the boundary is driven by the
shell so a `GameFrame` fixture never crosses one; and the guards that exist are about the TABLE rather
than about where the content is put.

| item | state |
|---|---|
| **no power-ups after level one; a scatter the player cannot reach** | ✅ [0100](decisions/0100-a-level-places-its-pickups-too.md) |
| **the sky is faster and still not fast enough; the bosses hold half the screen** | ✅ [0101](decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md) |
| **the music is still flat — no depth, no pace, no tempo; the guns are too thin** | ✅ [0102](decisions/0102-the-music-goes-somewhere.md) |

⚠️ **EVERY ITEM OF BOTH LISTS HAS LANDED, AND NONE OF IT HAS BEEN FLOWN.** Six decisions — 0097 to
0102 — against two play-tests, at the player's explicit instruction: *"crank the whole list through
and then we'll change it… partial implementation and adjusting is going to be worse than adjusting
with everything in, and I'm expecting a lot of adjusting."* **The next thing that happens is one
play-test over all of it.**

⚠️ **THE BUILD IT PRODUCES IS THE FIRST TIME THE AUTHORED GAME HAS EXISTED.** 0100 found that levels
two through seven have never had a pickup in them and that the difficulty dial counted them anyway, so
any verdict on those levels before this one is about a different game.

⚠️ **AND THE ONE THING THAT WAS ASKED FOR AND NOT BUILT IS NAMED IN 0102**: the music's tempo does not
rise, because [0093](decisions/0093-the-gun-is-on-the-grid.md) fixes a beat at 24 sim steps and the
gun, the enemies and the phase-lock all ride it. What rises is the rate of events — 52 notes a bar to
over 90. **If that does not read as *faster* to an ear, the next conversation is whether the grid is
worth what it costs, not another pass at the music.**

⚠️ **IT HAS NOW BEEN FLOWN AND THE VERDICT IS *"way too calm and repetitive"*** —
[`the-seventh-play-test`](../reports/the-seventh-play-test-2026-08-10.md). **The grid is NOT the thing
to reach for**, because the same report names four causes that have nothing to do with tempo and are
each measured in that report: the event cues are not on the grid at all, the music bus has never been
mastered, nothing ducks, and `run` opens thinner than the title screen does. Read those before
re-opening 0093.

⚠️ **THE FIFTH PLAY-TEST IS THE ONE ABOVE THAT** —
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
| the enemies fire in unison and every bullet is the same | ✅ [0098](decisions/0098-a-wave-plays-a-figure.md) |
| the effects do not mesh with the music | ✅ [0099](decisions/0099-the-cues-are-in-the-key.md) |
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

### ⚠️ START HERE. THIS IS THE ONLY *START HERE* IN THIS FILE, AND THAT IS ON PURPOSE

⚠️ **THERE WERE FIVE OF THEM AND TWO WERE STALE**, one still saying *ask for the feedback* three days
after it was given and acted on across eleven decisions. A marker that survives the thing it points at
is worse than no marker, because it reads exactly like a live one — the same failure
[0029](decisions/0029-the-tracked-record-is-the-record.md) names for a summary that drifts. **Retire
this heading when it stops being true rather than adding another one below it.**

**The work is: a driving session, then authoring, then tempo.** Everything that had to be built
before a level's music could be authored by ear is in —
[0158](decisions/0158-a-level-says-where-its-sections-open.md) the script,
[0159](decisions/0159-the-two-clocks-come-apart.md) and
[0160](decisions/0160-the-music-free-runs.md) the grid,
[0161](decisions/0161-the-shape-of-a-level-is-not-guarded.md) the guards that forbade variety,
[0162](decisions/0162-a-place-has-its-own-ladder.md) a place's own layers, and
[0163](decisions/0163-the-script-is-edited-here.md) the editor. **Nothing is authored yet, and that is
the next thing that happens.** Everything under here is why.

⚠️ **AND THE MIX IS NOW MEASURED AGAINST THE ARRANGEMENT RATHER THAN AGAINST AN EAR** —
[0164](decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md). `node scripts/weigh-adrift.mjs`
names every layer the mix does not deliver on its role's promise; there are **91**, in all seven
places, and they are held in `tests/themes.test.ts` so the list can only shrink.
[`what-a-role-does-not-buy`](../reports/what-a-role-does-not-buy-2026-08-18.md) ranks them, and
[`the-arrangement-holds-the-wrong-thing`](../reports/the-arrangement-holds-the-wrong-thing-2026-08-17.md)
is the blocker on fixing them in one pass. **Read both before proposing a mix number.**

⚠️ **AND THE BLOCKER IS ANSWERED** — [0166](decisions/0166-the-level-is-solved-as-one-trajectory.md).
The solve is a trajectory now and `node scripts/weigh-trajectory.mjs` prints what continuity costs;
the worst in-level boundary move is 11.2 dB against the per-rung solve's 16.7, at no cost in
audibility. **It still does not ship** — the desk has a `steady` slider and the next decision is
whether the ladder is replaced. That wants an ear on the weight first.

⚠️ **AND A SECOND BLOCKER WAS FOUND BY EAR THE SAME DAY** —
[0167](decisions/0167-a-build-does-not-duck.md). The solved mix DUCKS the layers already sounding to pay
for the ones a section opens, 56 times across the seven places, where the shipped ladder has never
done it once. `node scripts/weigh-boundary.mjs --solved` shows it. Three fixes are priced and refused
in [`a-build-does-not-duck`](../reports/a-build-does-not-duck-2026-08-18.md); the live question is
whether the arriving layers need LOUDER MATERIAL rather than more gain — measured, and REFUTED: material loudness cancels out of a balance.

⚠️ **AND THE FIRST AUTHORING CHANGE SINCE ALL OF THAT HAS LANDED** —
[0170](decisions/0170-a-place-is-audible-in-its-own-fight.md), answering *"the black heart should be a
dark symphonic metal track so I don't think we have good level sound differentiation yet."* The howl
and the tremolo the place is named for sat **17 and 19 dB down in its own boss fight**, and no
multiplier could reach them. **It makes the place vivid and moves it CLOSER to its neighbours** —
`weigh-apart` has core-to-saurian at 3.1 dB against 4.0 — which is the clearest statement yet that
differentiation is not a mix pass.

⚠️ **AND THE BOUNDARY IS A BUILD NOW** — [0171](decisions/0171-a-boundary-is-a-build.md), answering
*"the push > run primarily but the other transitions for each individual level doesn't actually
transition at the moment, it just jumps."* `run → push` opened **four layers on one downbeat** in all
seven places and every guard over it was green, because 0164, 0166 and 0167 are all about level and
none of them has a time axis. `node scripts/weigh-build.mjs` is the one that does. **The order is
per-place for free** — what lands last at a boundary is what that place follows there.

⚠️ **AND SEVEN PLACES OPEN ON SEVEN DIFFERENT THINGS** —
[0172](decisions/0172-a-place-opens-with-its-own-four.md), the authoring pass
[0162](decisions/0162-a-place-has-its-own-ladder.md) built the mechanism for and left empty. **Five of
the seven opened on literally the same four layers**, which is the sentence `weigh-apart` has printed
since 2026-08-13. `node scripts/weigh-apart.mjs --rung=run` is the instrument — the old one averages
the opening with the boss and moved 0.1 dB while every opening changed. Closest pair at `run` **2.4 →
3.5 dB**; `surge` is where the places still converge and is where the next pass goes.

⚠️ **AND 0172 OPENED A HOLE IN 0164, WHICH IS THE FIRST THING TO LOOK AT.** `ARRANGEMENT` is
GLOBAL — one role per layer per rung, for all seven places — and a place may now open a layer its rung
does not name. **Seven layer-rungs currently sound with no role at all**: `nebula/run/arp`,
`saurian/run/ride`, `labyrinth/run/ride`, `rime/run/arp`, `mire/run/arp`, `core/run/drive` and
`core/push/drive`. `roleOf` returns `null`, so `adriftAt` skips them and
[0164](decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md)'s promise does not cover them —
**nothing checks whether any of those seven can be heard.** The fix is a design question and not a
number: either the arrangement goes per-place, or it gains *name it if the rung opens it* semantics.
`node -e` over `roleOf` reproduces the list; it is not guarded, because a guard would have to pick
the answer.

⚠️ **THE MIX QUESTION IS ANSWERED AND THE ANSWER SHIPPED** —
[0176](decisions/0176-the-re-based-mix-is-the-mix.md). Driven on the desk: *"re-based now sounds and
blends incredibly well, let's make that the released version of the sound."* The whole third mix turned
out to be **161 numbers** — `rebasedLevel`'s rung cancels — so it folds into `THEMES`' own `mix` and
reproduces the solver to **8.9e-16**. **88 layers under 0164's floor became 54**, boundaries are
additive by construction, and the desk is one mode with no `steady` slider. 0166's two solver guards,
0175's `gains` parameter and the three-way toggle are all retired with their reasons.

⚠️ **AND FOUR GUARDS NOW CARRY NAMED EXCEPTIONS RATHER THAN A LOWERED BAR** — `mire` on the whisper
floor, `rime/push` on the bottom floor, `saurian/push→surge` and `rime/approach→boss` on the climb.
**Each is deleted when its place is worked on.** That is the per-level pass the player asked for:
*"there's still a few elements that are incredibly quiet or inaudible… we can start working on them
separately per level now."* **The Coil Labyrinth holds 19 of the 54.**

⚠️ **AND THE CUES ARE THE NEXT REPORT, UNTOUCHED SO FAR**: *"player gun-fire could be a bit more
throatier with a bit more impact… missile explosions don't really sound like explosions now either and
similar with enemy death explosions and probably the player bomb."* That is `pulse`, `missile`, `kill`
and `bomb`/`blast` in `src/content/cues.ts`, and it is MATERIAL rather than mix —
[0173](decisions/0173-a-cue-happens-somewhere.md) deliberately changed no layer, gain, filter or
envelope.

⚠️ **AND `npm run prove` DISAGREED WITH ITSELF BETWEEN CI AND THIS MACHINE, WHICH IS ANSWERED AS FAR
AS IT CAN BE** — [0177](decisions/0177-a-red-is-a-verdict.md). 0134's first probe was reported **red**
by CI at 05c4e16 and **wrong test** here on a byte-identical tree. **The reason was unrecoverable by
construction**: `red` meant *some failure with the right title*, and every path to which one it had
been was discarded unread. 0177 has the three places it was dropped, the four failure shapes measured
off vitest's own reporter, and the rule that was nearly shipped instead.

⚠️ **IT DOES NOT EXPLAIN 05c4e16 AND SAYS SO.** That evidence was never written down. What changed is
that the next disagreement is a diff — every probe's line now carries what its guard said — and that a
timeout can no longer answer for an assertion. **The one inference to un-learn:** *no timeout appears
in the CI log* was true and meant nothing, because a timeout's message never reaches the log at all.

⚠️ **AND THE FIRST RUN OF IT CAUGHT ONE, WHICH MAKES THE CANDIDATE CONCRETE.** 0031's mid-run rotation
probe had been reporting `red` on a **vitest timeout** since it was written; the cause was
`page.waitForFunction(fn, arg, options)` taking its options THIRD, so three waits in
`tests/orientation.browser.test.ts` stated a 5-second deadline that was never once enforced. **A `red`
that is a timeout is no longer a hypothesis about this harness.**

⚠️ **AND THREE PROBES REDDEN ON A `ReferenceError` FROM `src/`, WHICH IS THE NEXT THING TO WORK** —
0090, 0126 and 0135. Each break leaves the module throwing, so the guard never asserts; that passes,
because our code deciding is not the runner giving up, and it proves less than the decision's table
claims. They print the sentence on every run now. [0177](decisions/0177-a-red-is-a-verdict.md) has
the reasoning.

⚠️ **THE PROBE ITSELF WAS RE-AIMED SEPARATELY AND THAT WAS ALWAYS A DIFFERENT THING.** It points at
`arp`, which [0172](decisions/0172-a-place-opens-with-its-own-four.md) opened at Ember Nebula's `run`
and which now carries the pace there; the break lands the place at **83.7%** against the floor.

⚠️ **AND THE FIRST LISTEN FOUND TWO THINGS, BOTH OF THEM MINE, BOTH NOW FIXED.**
[0174](decisions/0174-a-send-has-to-mean-something.md): 0173's cue room shipped **un-normalised**, so
the wet was **7.8 to 9.0 dB of energy ABOVE the dry** on every explosion — *"the enemy death sounds
like it's happening inside a tin can."* All three of 0173's guards were green, because all three
measured the tail's length, width and decay and none of them measured its LEVEL.
[0175](decisions/0175-an-experiment-arrives-the-way-the-game-does.md): the desk's non-`shipped` modes
wrote their targets onto the gain nodes **after** `setLevel`, at `time 0` over 30 ms — so 0117's
downbeat and 0171's build were discarded together and **every boundary in every mode but `shipped`
has been a cut since 0154's toggle was built.** ⚠️ **THAT PARTLY RE-OPENS
[0167](decisions/0167-a-build-does-not-duck.md)**: its 56 ducked layers are real and its report was
taken in a mode whose every boundary was a 30 ms cut whatever the gains said, so how much of the
reported *jump* was the duck is now an open question a listen can answer.

⚠️ **AND THE CUES HAVE A ROOM AT LAST** — [0173](decisions/0173-a-cue-happens-somewhere.md),
answering *"they're still the old mono sounds and haven't been reworked as stereo sounds with deep
bass, reverb and actually decent sound."* Every cue in the game played into an anechoic chamber; the
music has had a room since 0136. **The width is the TAIL and not the dry signal** — 0127's position is
a fact the player dodges on. Four cues stay dry because they ride the weapon cadence. ⚠️ **The *deep
bass* half is measured and REFRAMED**: whole-buffer averages say every cue is under 4% below 120 Hz,
and the best-window measure says `death`, `bossDown` and `blast` reach 10–16% — **at the end of a
sweep**. The open question is whether it arrives early enough to be felt, and that wants an ear.
⚠️ **And `air` is typed rather than dragged**, which is the state the ladder was in this morning.

### ⚠️ START A DRIVING SESSION — `npm run dash`, AND THE PLAYER'S EAR IS THE INSTRUMENT

⚠️ **EVERY MECHANISM IS BUILT AND NOTHING HAS BEEN CHOSEN.** All six decisions above landed
provably neutral on purpose: not one changes a sound. What is missing is the musical judgement, and
[0126](decisions/0126-the-dashboard-is-the-instrument.md) says where that happens.

⚠️ **WHAT THE PANEL CAN NOW DO**: rename any section including the first (so a level opens at its
loudest), move one, add one, remove one — per level, with **copy this moment** printing a pasteable
`sections:` array. **AND A PLACE'S LADDER IS EDITABLE THERE TOO** — every layer row has a `ladder`
field for the rung the transport is parked at, so *which layers a section opens* (0162) is driven
rather than typed, and **copy this moment** prints it as a `ladder:` block for
`src/content/themes.ts`. **Nothing about the music is typed-only any more.**

⚠️ **AND WHAT THE PLAYER LIKES IS A GUIDELINE, NOT A TARGET** — music starts, changes, intensifies,
shifts to boss music that separates the fight; *"the nebula is a good example… don't lock that into a
rule."* **Explicitly NOT a 2:30–3:00 track escalating every few seconds.**

### THE SCORE IS BEING REWORKED, AND THE ORDER OF THE WHOLE PROJECT IS NAMED

⚠️ **THE PLAYER HAS OPENED THE WHOLE SCORE, INCLUDING THE PARTS NO ROUND HAS TOUCHED**, 2026-08-17:
*"I'm honestly happy to rework the entire musical score, including boss aura's and boss music and
melody."*

⚠️ **AND THE ACCUMULATED RULES ARE NAMED AS THE PROBLEM, WITH THE CAUSE.** *"Essentially all the
restrictions and setup and session changes happened because I didn't know what to ask for and it all
piled on top of itself."* This is the second time that has been said — the first produced
[0152](decisions/0152-a-layer-is-heard-in-the-sum.md) and the refactor — and it is now explicit that a
music rule is **demotable rather than inherited**. A rule that only exists because an earlier round
could not hear something is not evidence about this round.

**The four asks, in the player's own words and in their order:**

1. **A fast paced tempo melody that INCREASES IN TEMPO throughout the level.**
2. **A different unique melody for each level** — *"we can smooth out the overall tone afterwards so
   they fit the core game still."*
3. **Bosses to have unique threatening music**, so the player feels they are entering a boss area,
   **and the boss music starts before the boss appears.**
4. **The sfx and cues to fit in with the music** — *"that's secondary and also needs to be worked
   on."*

⚠️ **THREE OF THE FOUR ALREADY HAVE MACHINERY AND ONE DOES NOT, WHICH IS THE WHOLE SEQUENCING
QUESTION.** 2 is [0146](decisions/0146-three-more-places-and-two-after-them.md) and
[0148](decisions/0148-a-place-has-its-own-notes.md); 3's *before it appears* is `approach`, which
opens **17.9 s** ahead of the fight and already places `toll` there on purpose
([0107](decisions/0107-a-level-is-a-place.md)); 4 is [0099](decisions/0099-the-cues-are-in-the-key.md)
and [0104](decisions/0104-the-gun-plays-a-figure.md). **Ask 1 has none, and it is blocked by
[0093](decisions/0093-the-gun-is-on-the-grid.md)** — see below.

⚠️ **AND THE PLAYER HAS NOT COMMENTED ON AURAS OR CUES YET, WHICH IS NOT THE SAME AS BEING HAPPY WITH
THEM.** *"I haven't commented on boss aura's or game sfx/cues yet because we've been spending a lot
of time just on the music."* Do not read the silence as a sign-off.

### ⚠️ AND THE FIRST PIECE OF IT IS BUILT — [0158](decisions/0158-a-level-says-where-its-sections-open.md)

⚠️ **A LEVEL SAYS WHERE ITS SECTIONS OPEN, AND NOTHING A LISTENER CAN HEAR MOVED.** `sections` is a
list on `LevelRow`; `PUSH_UNITS`, `SURGE_UNITS` and `BOSS_APPROACH_UNITS` are gone. **Order, count and
timing are free** — a level may open at `surge`.

⚠️ **THE SEED IS PROVABLY NEUTRAL, MEASURED RATHER THAN CLAIMED.** Every rung crossing of every level,
crossed and heard, is byte-identical to the tree before it — 42 boundaries — and the new lookup was
proved equivalent to the old one over 30,287 camera positions before a line of it was written. 0158
has both.

⚠️ **THE NEXT STEP IS THE DASHBOARD'S SCRIPT EDITOR, AND IT COMES BEFORE ANY AUTHORING.** Dragging
cannot express the ask: *"some levels kick right into a surge"* is a change of **which section is
first**, not of where a boundary sits. The panel needs to change an entry's section, add one and
remove one. **Then a driving session, then the authored differences with their own play-test** — 0158
says why that order and not another.

⚠️ **AND A DRIVE FOUND A BUG THE WHOLE SUITE WAS GREEN OVER** — a keyboard nudge that moved one bar
however many times it was pressed, because the handler read a value captured before the redraw.
[0027](decisions/0027-measure-the-picture-not-the-model.md)'s third catch of this project's own.

### ⚠️ AND A PLACE HAS ITS OWN LADDER NOW — [0162](decisions/0162-a-place-has-its-own-ladder.md)

⚠️ **THIS IS THE MECHANISM BEHIND *"the run feels almost exactly the same"*, AND THREE DECISIONS OF
PER-PLACE WRITING COULD NOT REACH IT.** `MUSIC_LADDER`'s `run` row closes `arp`, `ride`, `hook`,
`drive`, `counter` and `lead`; `mix` is a MULTIPLIER and any multiple of zero is zero. **So every place
opened a level with the same six fast layers shut**, whatever it said in `mix` and whatever it
re-voiced. A place may now state its own value for any layer at any rung.

⚠️ **IT LANDS EMPTY AND IT IS MEASURED** — 147 rows of mixer gains byte-identical to before, every
place at every rung at three aura distances. **Authoring the overrides is the next change and it wants
an ear.**

⚠️ **AND `mix`'s OWN STATED REASON FOR BEING A MULTIPLIER HAD EXPIRED**: it protected 0090's additive
rule and 0102's escalation rule, retired by [0120](decisions/0120-a-rung-may-close-a-layer.md) and
[0161](decisions/0161-the-shape-of-a-level-is-not-guarded.md). **A constraint outliving both of its
reasons is the pattern of this whole week.**

⚠️ **A GUARD WRITTEN THE SAME HOUR WAS VACUOUS AND A PROBE CAUGHT IT.** With every `ladder` absent,
`rungOf` reading a FIXED place is indistinguishable from reading the right one — so the value-level
check stayed green. It is a source scan for now, and **the debt is owed by the first authoring change**:
when a place states a ladder, replace the scan with a value comparison.

### ⚠️ AND THE SHAPE OF A LEVEL'S MUSIC IS NOT GUARDED ANY MORE — [0161](decisions/0161-the-shape-of-a-level-is-not-guarded.md)

⚠️ **READ THIS BEFORE WRITING A GUARD ABOUT THE MUSIC.** Said 2026-08-17: *"don't lock that into a
rule, it's a guideline if anything and if we lock it into a rule (which we have done already) then
every level ends up sounding similar."* Four assertions removed, nothing put in their place: the last
section's length, every section's length, no rung thinner than the opening, and the boss's density
floor. **Each one made a musical opinion from one round true of all seven levels for ever.**

⚠️ **TWO OF THE FOUR WERE ADDED THE SAME DAY, IN 0158 — the PR whose headline is *order, count and
timing are free*.** The guard took back what the decision granted, in one diff, and nothing caught it.

⚠️ **THE TRANSFERABLE PART IS ALREADY IN `CLAUDE.md` AND IS ABOUT CODE**: *"No counting guard… every
one flagged its healthy file as loudly as its sick one."* That reasoning was worked out for line and
`case` ceilings and **never transferred to music**, where every one of the four was a counting guard
with a musical name.

⚠️ **THE SORTING PRINCIPLE, WHICH IS DELIBERATELY NOT A RULE.** A **floor** is about whether sound
works — nothing clips, no opened layer is inaudible, a loop is a whole number of samples, a section
outlasts its own ramp. A **shape** is a musical opinion — how long, how busy, in what order. Floors
stay; shape does not get asserted. 0161 says why writing that into `CLAUDE.md` would be the same
mistake wearing a hat.

⚠️ **WHAT THE PLAYER LIKES IS A GUIDELINE AND IS WORTH KNOWING**: music starts, changes, intensifies,
then shifts to boss music that separates the fight from the level — *"the nebula is a good example,
starts out with a chorus, escalates to organ music and loud pumping beats, shifts to a dante's inferno
style boss fight."* **And explicitly NOT a 2:30–3:00 track that escalates every few seconds.**

### ⚠️ AND THE GRID IS COMING APART — [0159](decisions/0159-the-two-clocks-come-apart.md) IS HALF OF IT

⚠️ **THE PLAYER DROPPED BOTH RULES BY NAME, 2026-08-17**: *"let's go ahead and drop the whole sim step
rule and the gun fire ladder… the sim-step and gun ladder rules make no sense anyway when the plan has
always been to add additional weapons in so we'd be struggling all over the place if we don't change
our approach to that now."*

⚠️ **0159 IS THE LADDER HALF AND IT HAS LANDED.** A cadence is sim steps, a beat is seconds, and
neither knows the other's number. **266 resolved cadences identical to `main`** — the landing is
silent and measured. `src/content/cadence.ts` is where the gameplay lattice lives now.

⚠️ **AND THE CLOCK HALF HAS LANDED TOO** — [0160](decisions/0160-the-music-free-runs.md). `phaseTo`,
`rephaseIn` and `REPHASE_SECONDS` are gone and the music free-runs on the audio clock, which is the
one it is played against and the one that does not drop steps. **The sim no longer reaches the music
anywhere.**

⚠️ **`stepsToGrid` IS KEPT, AND THE REASON IS THE INTERESTING PART.** Its stated justification was
musical and is now false; what it actually buys is a gun whose phase does not move across upgrades or
deaths, which a player can learn. **A mechanism can outlive the reason it was built for; the claim
must not.** Three of 0094's six probes survive on exactly that basis.

⚠️ **THE GRID IS NOW FULLY APART AND A TEMPO MAY MOVE.** Nothing between here and `bpm` per section
is blocked.

⚠️ **AND 0159 UN-DOES THE MUSICAL HALF OF 0096, 0098 AND 0104 ON A DELAY.** The enemies and the guns
keep their rhythm and stop being locked to the tune — not today, because the two lattices still
coincide, but the moment a level authors a tempo. **Re-weaving them is the player's own sequencing**:
*"let's do music first and then afterwards we'll weave the weapon sounds either into or over it."*
**Either** is the word to keep.

### ⚠️ TEMPO RIDES THE SAME TABLE

⚠️ **THE SECTION SCRIPT ITSELF IS BUILT** — [0158](decisions/0158-a-level-says-where-its-sections-open.md)
has the shape, the seed, the two measurements that prove it neutral, and the five probes it
re-anchored. **The design that used to sit here is in that decision and in
`src/content/levels.ts`**; it is not repeated —
[0029](decisions/0029-the-tracked-record-is-the-record.md).

⚠️ **AND THE THING TO DO BEFORE AUTHORING ANY DIFFERENCE IS THE DASHBOARD'S SCRIPT EDITOR**, which
0158 deliberately left out so that the landing diff stayed provable. Dragging moves a boundary; the
ask is about **which section is first**.

⚠️ **TEMPO IS THE SECOND STEP, NOT THE FIRST.** A `bpm` per section is what
makes *"a fast paced tempo melody that increases in tempo throughout the level"* a thing a level says
— and the count of DISTINCT tempi in a level is the count of bakes it costs, which is why it belongs
at the authoring site. **Read [0157](decisions/0157-the-prewarm-was-scheduled-one-note-at-a-time.md)
first**: a bake is ~3.6 s of synthesis and the schedule that spends it is now `sliceOf`.

### ⚠️ AND THE RUN-START FREEZE IS FOUND AND FIXED — [0157](decisions/0157-the-prewarm-was-scheduled-one-note-at-a-time.md)

⚠️ **PRESSING START COST 4.6 SECONDS OF FROZEN MAIN THREAD AND IT WAS NOT THE MUSIC.** The prewarm
scheduled **one note per `setTimeout`**, which a browser clamps to ~4 ms, so 3.6 s of synthesis took
12–20 s of wall clock — and `prewarmed` is set by the *last* job, so a press inside that window read
the set as *not started* and re-synthesised all of it. **A player who reads the title for six seconds
now waits 277 ms where they waited 4564.**

⚠️ **FOUR HYPOTHESES WERE MEASURED AND KILLED FIRST, AND 0157 LISTS THEM.** Read it before touching
anything on the gesture path — three of the four were looking at the screen change, and `begin` is
synchronous.

⚠️ **A LOADING SCREEN IS STILL WANTED AND IS NOW HONEST.** Pressing instantly still costs 4.3 s
because the audio cannot play before it is synthesised, and the player has already asked for one.

### ⚠️ THE ORDER OF EVERYTHING AFTER THIS IS THE PLAYER'S, GIVEN 2026-08-17

**music → enemy spawn rates, gaps and bugs → sfx → boss uniqueness → boss auras → minibosses →
updating the art throughout the entire game → additional player weapons.**

⚠️ **It is a standing sequencing instruction, not a wish list**, and it outranks the queue any report
below leaves behind. **Minibosses and an art pass are both new** and appear nowhere else in this
repository. **Additional player weapons are LAST** — the arsenal is
[0043](decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md)'s and is still a list with
nothing in it, and it stays that way until everything above it has landed.

### ~~⚠️ AND ASK 1 RE-OPENS 0093~~ — ASKED, ANSWERED AND HALF BUILT, 2026-08-17

⚠️ **THE CONVERSATION DEFERRED FOUR TIMES HAS BEEN HAD AND THE PLAYER TOOK THE WIDER OPTION** — both
rules dropped, not one. [0159](decisions/0159-the-two-clocks-come-apart.md) is the ladder half.
**The arithmetic below is kept because it is why**, and because the divisor table is the clearest
statement of what the old rule cost.

### ~~THE ARITHMETIC THAT MADE IT NECESSARY~~

⚠️ **THE ARITHMETIC IS EXACT AND IT IS NOT A MATTER OF TASTE.** A cadence is authored as notes per
beat and spent as `STEPS_PER_BEAT / perBeat`, so **every tempo the game can hold is one where that
division is a whole number** for all of `firePerBeat: [3, 3, 4, 4, 6]` and
`missilePerBeat: [3, 3, 3, 4, 6]`, plus `FIRE_GRID = STEPS_PER_BEAT / 4`:

| steps/beat | BPM | |
|---|---|---|
| 48 | 75.0 | holds |
| 36 | 100.0 | holds |
| **24** | **150.0** | **holds — what ships** |
| 18 | 200.0 | **breaks** `perBeat 4` |
| 16 | 225.0 | **breaks** `perBeat 3` and `perBeat 6` |
| 12 | 300.0 | holds |

⚠️ **SO THERE IS NOTHING BETWEEN 150 AND 300, AND *INCREASES IN TEMPO* CANNOT BE BUILT ON THIS GRID.**
Either the gun's ladder is re-authored per rung — which moves fire rates and is
[0084](decisions/0084-the-dial-is-the-level-and-the-guns.md)'s currency — or the whole-sim-step rule
itself goes. **This is the conversation
[0102](decisions/0102-the-music-goes-somewhere.md) said was next and it has been deferred four times.**

⚠️ **AND A RE-BAKE IS THE HIDDEN COST OF ANY ANSWER.** Loops are baked at `BEAT_SECONDS` and played
against `anchorAudio`; `playbackRate` would transpose them. A tempo that moves means baking again,
and the bake is now **3.6 s** for the full set —
[`the-prewarm-got-a-third-heavier`](../reports/the-prewarm-got-a-third-heavier-2026-08-17.md).

### ⚠️ THE TARGET IS DESKTOP NOW — [0153](decisions/0153-desktop-is-the-target.md)

⚠️ **The phone is a port that has not started, and may not be cited as a reason to make anything
smaller, shorter or fewer.** Said 2026-08-16: *"the scope has changed to be desktop first… once we're
in a good desktop place, we can then revisit what needs to happen to make it phone portable."*

⚠️ **NO NUMBER MOVED, AND 0153 HAS WHY** — the phone had already stopped binding the music and nobody
had noticed. What was corrected is **reasoning that would have bound the next change**.
`tests/budget.test.ts` and `src/sim/collide.ts` are still phone-sized on purpose: those are gameplay
capacities, they are blocking nothing, and a phone-sized floor under a desktop game is the safe
direction to be wrong in.

### ALL SEVEN MATERIAL PASSES ARE IN, AND NOTHING HAS BEEN HEARD SINCE

⚠️ **THE BLOCKER IS GONE AND THE GUARD IS BETTER THAN IT WAS** —
[0156](decisions/0156-a-strike-is-an-increment.md). 0108's pitched-weight guard measured the *peak* of
a 40 ms window; the material pass lengthened `hook`'s ring past its own sixteenth, so that window
contained the previous note's tail and the accent was invisible in it. It now measures **what each
onset ADDED, meaned over the whole loop**, and asserts it against the table's own number.

⚠️ **THE HANDOVER'S PROPOSED FIX WAS NOT SUFFICIENT ON ITS OWN, AND 0156 HAS WHY.** *Measure the
increment at the onset* one sixteenth at a time still reads 0.59 against 0.73 — both under the old
threshold — because two notes of the same pitch **interfere** rather than add. Averaging over 256
sixteenths is the half that makes the estimate a measurement.

⚠️ **`node scripts/prove-guard.mjs 0108` IS 7 OF 7 RED**, including the one that did not fire.

⚠️ **SO THE SEVEN MATERIAL PASSES ARE COMPLETE** — six places in #198, the base composition in #199.
Worst multiplier in the game **16.67× → 3.46×**; solved gains past the desk ceiling **9 → 0**.

⚠️ **AND THE NEXT THING IS AN EAR, NOT A NUMBER.** Every level sounds different now, which is the
condition the player set: *"once all levels have all sounds properly audible then I'll need to go
through and relisten to all the levels."* **No mix number should be argued before that listen.**

⚠️ **THE MATERIAL PASSES COST 32% OF THE BOOT-TIME BAKE AND IT IS OPEN** —
[`the-prewarm-got-a-third-heavier`](../reports/the-prewarm-got-a-third-heavier-2026-08-17.md). A
browser guard is what found it, and what it owes is named there rather than here.

### THE PASS THAT LANDED, AND WHAT IT FOUND

⚠️ **THE ORDER MATTERS AND IT IS NOT THE OBVIOUS ONE. Do not tune a mix until this is done.** Said
2026-08-16: *"we have to go through and fix this up for all levels, and once all levels have all
sounds properly audible then I'll need to go through and relisten to all the levels because they're
going to sound completely different."*

⚠️ **THE FINDING: nine of ~600 solved gains ask for more than the desk can express**, and every one is
a layer whose MATERIAL is 15–36 dB under its own place's loudest. Ember Nebula's `arp` wants **6.2×**;
Rime Shelf's wants **16.7×**, three times the whole fader range. **A gain is not a loudness** —
[0140](decisions/0140-no-layer-is-inaudible.md) — so no multiplier rescues material that thin, and
amplifying it that hard amplifies its noise floor. It is `ride`'s defect
([0152](decisions/0152-a-layer-is-heard-in-the-sum.md)) repeated across twenty-seven layer-places.

⚠️ **THE FIX IS THE MATERIAL, ONE FILE PER PLACE** — voice `gain`, and the ENVELOPE where a note is
too short to put energy out. The envelope is `exp(-curve × u)` across `seconds`, so a note's real
length is about `seconds / curve`: 0152 found a *"25 ms"* ride that was really **2.8 ms** and had been
"fixed" twice by raising its gain instead. **Check the envelope before reaching for the gain.**

⚠️ **RMS LIBELS A TRANSIENT** — 0140 again. `ride`, `crash`, `perc` and `stomp` read far lower on RMS
than an ear hears. Judge them on `peak` and `margin` from `scripts/weigh-heard.mjs`, not on RMS.

**The measurement, per place** (`node scripts/weigh-solve.mjs <place>` after any change; the target is
no layer wanting more than about **3.0×**, and `scripts/weigh-mix.mjs` must stay green throughout):

| place | layers whose material cannot carry their role |
|---|---|
| ~~base (`approach`, in `src/content/music.ts`)~~ — **done, #199** | `call` 9.7× · `hook` 7.9× · `counter` 5.9× · `frenzy` 4.4× · `dread` 4.3× · `arp` 3.1× |
| nebula | `arp` 6.2× · `wraith` 4.3× · `frenzy` 4.2× · `call` 4.0× · `counter` 3.2× |
| saurian | `frenzy` 6.3× · `ride` 4.0× · `wraith` 4.0× |
| labyrinth | `crash` 4.5× · `perc` 4.3× · `call` 3.1× · `hook` 3.1× |
| rime | **`arp` 16.7×** · `frenzy` 7.6× · `wraith` 4.4× · `hook` 3.4× |
| mire | `arp` 4.9× · `groove` 4.2× · `dread` 3.1× |
| core | `arp` 6.6× · `hook` 6.0× · `ride` 3.8× |

⚠️ **THE BASE COMPOSITION WAS LAST AND WAS THE DANGEROUS ONE.** `src/content/music.ts` holds the
layers the six places INHERIT where they do not re-voice — **and it turned out to be only `bass` and
`beat`**: the places re-voice 21 of 23. #199 has the measurement.

⚠️ **AND THEN THE WHOLE THING IS RE-HEARD.** Every level sounds different now, so the tuning passes
that come after this start from scratch — which is why no mix number should be argued before that
listen happens.

### THE REFACTOR IS BUILT, MEASURED, AND STILL NOT WIRED IN

⚠️ **[0154](decisions/0154-the-mix-is-authored-as-intent.md) IS THE MECHANISM AND IT IS NOT WIRED IN.**
`MUSIC_LADDER` and `mixOf` still decide every gain the player hears. The arrangement solves every
layer onto its role's target across all seven places and every rung — worst error 0.00 dB — and it
**collapsed the seven places to 0.9–2.5 dB apart** where
[0147](decisions/0147-a-place-is-a-balance.md) required 3.
[`the-arrangement-solves-and-the-places-collapse`](../reports/the-arrangement-solves-and-the-places-collapse-2026-08-16.md)
has the table and the three candidates.

⚠️ **THAT BLOCKER IS ANSWERED — [0155](decisions/0155-a-place-follows-its-own-instrument.md).** 0147's
`apart` guard is **retired on the condition it wrote for itself**, and what replaces it is `LEADS`:
each place names **what it follows** at each rung, which is the axis a listener uses. Every place now
follows a different instrument, and the fights — five of seven were all following `dread` — differ
too.

⚠️ **AND THE BLOCKER ON WIRING IT IN IS NAMED AND MEASURED** —
[`the-arrangement-holds-the-wrong-thing`](../reports/the-arrangement-holds-the-wrong-thing-2026-08-17.md).
Reported of the dashboard's solved mix: *"the transitions between sections are now terrible."* The
solve is doing exactly what it was told; **what is wrong is what it was told.** Three wrong answers
are measured out of the way in there — read it before proposing a continuity fix, and note that the
shipped game does not have this problem.

⚠️ **THE FIRST MOVE IS STILL AN EAR.** `node scripts/hear.mjs --level=<kind> --solved` writes a whole
level at the solved balance, level-matched against the shipped one;
`node scripts/hear-solved.mjs <place> --rung=<rung>` does a single rung. **`core --rung=surge` is the
one to distrust** — its movements are the largest anywhere.

### ⚠️ AND THE RULES IT REPLACES — THE PLAYER ASKED FOR THIS

⚠️ **DO NOT TUNE A MIX NUMBER BEFORE READING THIS.** Said 2026-08-16, after
[0152](decisions/0152-a-layer-is-heard-in-the-sum.md) landed: *"there's a whole bunch of rules and
guardrails around the music that's causing a whole heap of boundaries and guidelines that keep
causing problems… we'll need to refactor the whole music rules and definitions in the repo because
it's messy, complicated and causing rework and restrictions that I don't want."*

⚠️ **AND THE CAUSE IS NAMED, WHICH IS WHY THE REFACTOR IS NOT A TIDY-UP.** Same session: *"the reason
music has taken so long is because of this problem, I keep asking for different things that already
exist, but aren't hearable."* [0152](decisions/0152-a-layer-is-heard-in-the-sum.md) is what made that
measurable; [`what-the-mix-buries`](../reports/what-the-mix-buries-2026-08-16.md) is the audit over
all seven places and names the three layers that are on top of everything else.

**Done, and needing no revisiting:** `ride`'s envelope in all six places that re-voice it, and the
rig's `--solo`, which could only ever render level one and did it at the ladder's gain with no
`mixOf`. Both are in 0152.

**Deliberately left undone**, because every available lever is a number inside the rule set being
refactored: `arp`, `hook`, and the bed that buries them.

### ~~START HERE NEXT SESSION: ASK FOR THE FEEDBACK~~ — ANSWERED 2026-08-14, AND ACTED ON SINCE

⚠️ **THE ASK WAS MADE AND THE FEEDBACK CAME.** Everything from
[0147](decisions/0147-a-place-is-a-balance.md) to
[0157](decisions/0157-the-prewarm-was-scheduled-one-note-at-a-time.md) is downstream of it. The
section below is kept for the two queued passes it names, which are still the player's own words —
**it is no longer where a session starts.**

⚠️ **THE PLAYER HAS PLAYED ALL SEVEN AGAINST [0147](decisions/0147-a-place-is-a-balance.md) AND THE
VERDICT IS THE FIRST UNRESERVEDLY POSITIVE ONE THIS CHANNEL HAS HAD**, 2026-08-14: *"I've played
through them and can give feedback, it's sounding a lot better, but let's pick it up in a new
session."*

⚠️ **SO THE FEEDBACK IS HELD BY THE PLAYER AND NOT BY THIS FILE. ASKING FOR IT IS THE FIRST MOVE**,
before anything below is picked up — the two queued passes are both large, both touch shared tables,
and either could be the wrong thing to do next depending on what the report says.

⚠️ **AND THE TWO QUEUED PASSES ARE ALREADY ASKED FOR, IN THE PLAYER'S OWN WORDS.** Neither is a
proposal; both are instructions given during the session that produced 0147:

1. **THE DYNAMIC-RANGE PASS, AND IT IS THE ONE WITH A NUMBER BEHIND IT.** *"If the budget is
   unrealistic and being a blocker let's clear/update/make it proper so that we can get a broad
   musical range from the highest highs to the lowest slows, the fastest speeds and the slowest
   slows."* **Measured: a whole level spans 3.4–3.8 dB from `run` to `boss`** — the entire dynamic
   range of a three-minute build. `MUSIC_LADDER` opens `run` at about 60% of the clipping ceiling, so
   the fight has nowhere to go. **The lever is `MUSIC_GAIN` down and `MUSIC_DRIVE` up**, which is what
   [0104](decisions/0104-the-gun-plays-a-figure.md) established: the bus shaper buys loudness at the
   same peak. Dropping the quiet rungs instead is the obvious move and it argues with *"level 7's
   start wasn't great, quiet"*.
2. **THE FOCUSED PASS ON LEVELS 1, 2 AND 3** — *"after merging in this changes, then run the same pass
   on levels 1, 2 and 3."* ⚠️ **SEQUENCE IT AFTER THE RANGE PASS**: the range change moves the ground
   those three would be tuned against, and doing it first makes the tuning immediately stale.

⚠️ **AND WHAT 0147 DELIBERATELY DID NOT TOUCH IS THE MATERIAL.** *"I'm not getting saurian or robot or
techno or eurobeat vibes at all"* was answered by moving that place's floor, hat, arp and hoover from
17 dB under to the top of its mix — **a balance fix, not a notes fix.** If the new report still says
level three does not sound like the genre, **the answer is its notes**, and that is the third pass.

⚠️ **ONE GUARD IS INTERMITTENT ON CI AND IT IS NOT MUSIC.**
`tests/offline.browser.test.ts` → *retires its own stale cache* failed once on the 0147 branch and
passed on a re-run. It passes **3/3 locally**, and the same test has failed-then-passed on **four**
other branches. Its own comment forbids widening `SWEEP_MS`, and the failure readout says **no new
worker appeared at all in 35 s** — which points at the `sw.js` update fetch rather than at the sweep.
[0044](decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) says a rerun is not
evidence; this is recorded as **open and unexplained** rather than closed.

### THE VERDICT THAT PRODUCED 0147, AND THE INSTRUMENT THAT FOUND ITS CAUSE

⚠️ **REPORTED 2026-08-14, HAVING PLAYED ALL FIVE**: *"level 3 sounds incredibly similar to level 2,
I'm not getting saurian or robot or techno or eurobeat vibes at all. Definitely no lasers and roar at
the boss. Level 4, 5, 6 were pretty bland and very similar to the other levels, it didn't feel like
I'd travelled somewhere else in the galaxy. Level 7's start wasn't great, quiet, similar to previous
levels, but the rest of the level was really nice."*

⚠️ **THE CAUSE WAS MEASURED AND IT WAS NOT THE NOTES** —
[0147](decisions/0147-a-place-is-a-balance.md). Seven places sat **1.9–6.0 dB apart**; `sub` was the
loudest layer in all seven; and every layer carrying a brief — the lasers, the roar, the music box,
the twin lead, the hydra — was in the bottom third of its own mix at −15 to −30 dB. **The three
closest pairs in the table were levels 4, 5 and 6**, which is exactly the set the report names.

⚠️ **`node scripts/weigh-apart.mjs` IS THE INSTRUMENT AND IT PREDICTED THE REPORT.** Every measurement
this project had was one place against the BASE; nothing compared two places to each other, and seven
identical arrangements pass all of them.

⚠️ **AND `node scripts/weigh-mix.mjs` IS THE ONE TO RUN BEFORE TOUCHING A MIX NUMBER.** A mix has six
bounds on it and `expect` stops at the first; six rounds of whack-a-mole were spent before that script
existed and none after it.

⚠️ **THE SECOND LISTEN HAPPENED AND 0147's OWN PREDICTION WAS RIGHT** — reported 2026-08-14:
*"level 3 currently reads as a copy of level 2 with some slight variation. It should be completely
different thematically as a euro-beat technical trance melody… the level melodies are copies of the
earlier ones and aren't their own unique themes and styles."* The answer was its notes, and
[0148](decisions/0148-a-place-has-its-own-notes.md) is that work.

### ⚠️ THE QUEUE — TAKE THE TOP UNDONE ITEM AND DO ONLY THAT ONE

⚠️ **THIS SECTION EXISTS SO A FRESH SESSION NEEDS NO PROMPT BEYOND *"read the handover and do the next
item"***. Everything below it is findings; this is the ORDER. **Do one item, land it, stop.** The next
session takes the next one — [0033](decisions/0033-a-branch-starts-at-main.md), one PR at a time.

⚠️ **CHECK `gh pr list` FIRST. If a PR is open, the queue is BLOCKED** — help it land, or stop and say
so. A second branch started now is the failure 0033 is written about.

⚠️ **TICK AN ITEM OFF IN THIS FILE AS PART OF ITS OWN PR.** An item that landed and still reads as
`TODO` is how two sessions build the same thing — which is exactly what happened on 2026-08-14, when
three cloud routines could not push and the third rebuilt the second's work from scratch.

| # | item | brief | state |
|---|---|---|---|
| 1 | ~~**`overwhelm` + the bared-vulnerability window**~~ | [0150](decisions/0150-the-uncoil-and-the-eye.md) — **UNFLOWN**, and the three questions it cannot answer are in it | ✅ **DONE** |
| 1b | **THE IMPACT FLASH IS SATURATED: a boss's hull is lit on 65% of the steps of a fight at the design loadout.** Measured, not guessed. It makes the bared window invisible, makes [0035](decisions/0035-damage-is-legible-on-the-body-that-took-it.md) meaningless above the base weapon, and it is **every body in the game**, not just a boss. | [`the-uncoil-needed-a-gap`](../reports/the-uncoil-needed-a-gap-2026-08-16.md) item 2 | **TODO — DO THIS BEFORE 2** |
| 2 | **`lance`** — the telegraphed lock-on, the first attack the player is warned about. Needs a new drawing primitive, so [0036](decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md) governs it. | same report, ordering item 2 | **TODO** |
| 3 | **`sweep` and `mine`** — a curtain that walks, and a second-order shot that detonates into a ring. Cheapest of the four. | same report, ordering item 3 | **TODO** |
| — | the links guard that went red once inside `prove` and green everywhere since | [0044](decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) — **owed a diagnosis, not a rerun** | **OPEN** |
| — | **AND IT IS NOW FIVE GUARDS, ALL WALL-CLOCK, AND THE CAUSE IS MEASURED**: the suite oversubscribes its own worker pool. `npx vitest run` failed 2–4 of them on three runs; **`--maxWorkers=4` on the identical tree is 64/64 files and 1063/1063 tests green.** `main` failed the same set and MORE, so it is not a tree. ⚠️ **`npm run prove` CANNOT BE CAPPED FROM OUTSIDE** — `runSuite` passes no worker flag and `VITEST_MAX_THREADS` is ignored by vitest 4, so **the full local gate is unavailable on a loaded machine.** | [`the-uncoil-needed-a-gap`](../reports/the-uncoil-needed-a-gap-2026-08-16.md) | **OPEN — owed a decision about whether the cap lives in `vitest.config.ts` or in `runSuite`** |
| — | ⚠️ **AND TWO OF THE FIVE ARE DSP TIMEOUTS RATHER THAN BROWSER WALL-CLOCK, WHICH IS NEW.** *a level has more SUB than the title* carries an explicit `DSP_MS = 20_000`, and *prewarmed and cold bakes are the same samples* records in its own comment having timed out **once before** under full-suite load — [0044](decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) cited there by name. **Neither is a wrong quantity; both are budgets.** Measured 2026-08-17 while landing [0158](decisions/0158-a-level-says-where-its-sections-open.md): `npm run prove` baseline went RED on five, `main` under the *same harness* went RED on one of the same set, and both trees are green capped. ⚠️ **The bake got 32% heavier in [0157](decisions/0157-the-prewarm-was-scheduled-one-note-at-a-time.md)'s report and nothing re-sized these budgets after it** — that is the first thing to check when the cap decision is taken. | [`the-prewarm-got-a-third-heavier`](../reports/the-prewarm-got-a-third-heavier-2026-08-17.md) | **OPEN — and it is the same decision as the row above** |

⚠️ **THE MUSIC IS NOT IN THE QUEUE AND THAT IS DELIBERATE.** *"We can go back to working on the music
when I get back"* — the `run` arrangement and the tempo question both want the player's ear, and the
tempo half is a gameplay rebalance wearing a music change. **Do not touch the ladder, the tempo, a
place's notes or `MUSIC_*` from this queue.**

⚠️ **EVERY ITEM ABOVE CARRIES THE SAME NON-NEGOTIABLES**, because they are `CLAUDE.md`'s and not the
queue's: guards over the thing the item is about, probes seen to go RED via
`node scripts/prove-guard.mjs <n>`, a decision in `docs/decisions/`, a rollback note on the PR, and
`npm run prove` before pushing. **An item is not done because it works.**

### ~~START HERE NEXT SESSION~~ — THE RUN IS A PAD AND A FLUTE, AND THE TEMPO QUESTION IS NOW OPEN

⚠️ **THE TEMPO QUESTION THIS SECTION SAID WAS DUE HAS BEEN ASKED AND ANSWERED BY THE PLAYER** — see
*ASK 1 RE-OPENS 0093* above, which has the arithmetic. **This is no longer where a session starts**;
what is still live in it is what `run` closes, which the score rework has to decide about.

⚠️ **THE TWELFTH PLAY-TEST OUTRANKS EVERYTHING BELOW IT** —
[`the-twelfth-play-test`](../reports/the-twelfth-play-test-2026-08-14.md), given 2026-08-14 against
0148. **Read it before touching a music number.**

⚠️ **`run` CLOSES EVERY FAST LAYER IN THE GAME** — `arp`, `hook`, `drive`, `counter`, `lead`, `ride`
are all zero in `MUSIC_LADDER`'s `run` row, and what is open is two pads, a bass, a kit and one slow
melody. *"Still slow and melodic… more appropriate for a cthulhu-ian investigative game"* is a literal
description of that row, it is the SHARED ladder, and **no amount of per-place writing can reach it.**

⚠️ **AND BOTH OF 0148's SUPERSAWS LIVE IN LAYERS THAT DO NOT OPEN UNTIL `push`**, so *"the run feels
almost exactly the same"* was predictable from the table. 0148 answered a question about MATERIAL; this
is a question about the RUNG.

⚠️ **THE TEMPO ASK IS [0102](decisions/0102-the-music-goes-somewhere.md)'s OWN DEFERRED CONVERSATION,
ARRIVING** — *"if that does not read as faster to an ear, the next conversation is whether the grid is
worth what it costs, not another pass at the music."* It does not, and that is now said twice.
**`STEPS_PER_BEAT = 24` is already 150 BPM, which IS eurobeat's tempo**, so the number is not the
defect; the report has the divisor table for what a real change costs and why 20 is the only near
candidate. ⚠️ **It is a GAMEPLAY rebalance wearing a music change** — the gun, the enemies and the
phase-lock all ride that grid (0093, 0096) — and *"levels 3-7"* implies a per-level tempo the grid
cannot express at all.

⚠️ **DELIBERATELY NOT ACTED ON.** The player left for a day with *"if you're not sure on the music,
kick on with the art styles and boss styling… we can go back to working on the music when I get
back."* The arrangement half is safe and cheap and is the first thing to do on their return.

### ⚠️ AND IT HAS BEEN FLOWN — [`the-uncoil-needed-a-gap`](../reports/the-uncoil-needed-a-gap-2026-08-16.md), 2026-08-16

⚠️ **THE UNCOIL WAS GOOD AND WANTED A GAP AND A REPEAT** — *"it was good, but needed a way to dodge it
and also needed to happen more than once per boss… fire off at every 10% damage reduction below 50%."*
Answered by [0151](decisions/0151-the-gap-you-have-to-reach.md), which moved the mechanism off the
phase stance and onto the boss row.

⚠️ **AND THE HOLE IS STATIC, BECAUSE THE FIRST ANSWER WAS WRONG AND WAS CAUGHT BEFORE IT SHIPPED** —
*"a static hole in the wall is a pattern the player needs to learn, a variable hole that spawns close
to the ship negates the entire difficulty of the obstacle."* The measurement behind that draft was
right and the conclusion was not: it compared the curtain's flight against crossing the WHOLE lane,
and a fixed hole is never a whole lane away. What the number bounds is **where a hole may sit**.

⚠️ **AND THAT ROUND CARRIED THE PROJECT'S FIRST STATED RULE FOR DIFFICULTY, WHICH OUTRANKS THE ITEM IT
ARRIVED WITH** — *"the game is supposed to be hard and gets harder with each level. It's a short game
so the replayability comes from the difficulty. Management of difficulty is **'is this unfair' OR 'is
this a learnable strategy'**?"* **Put a difficulty proposal to that test from now on.**

⚠️ **AND THE UNCOIL HAS NO WARNING IN FRONT OF IT, WHICH THE SAME REPORT ASSUMES IT DOES** — *"an
audible phase change cue and then a static wall"*. It fires at fixed health fractions rather than on a
phase change, and nothing on screen says how much boss is left. **If the next play-test says it
arrives unannounced, the answer is queue item 2's telegraph and not a number** —
[0151](decisions/0151-the-gap-you-have-to-reach.md) says so.

⚠️ **THE MORE VALUABLE HALF OF THAT REPORT IS ITEM 1b IN THE QUEUE ABOVE, AND IT IS NOT ABOUT
BOSSES.** *"The boss sitting there basically white all the time"* measured out at **65% of the steps
of a fight** with the hull lit, at the design loadout. It is why the bared window has no picture, and
it is every body in the game.

⚠️ **AND THE PLAYER DEFERRED THE ×3 WINDOW BY NAME AND SKETCHED ITS REPLACEMENT** — three windows at
75/50/25 of *"2secs of free shooting"*. **That is a DURATION**, which is the first thing asked of this
project that [0040](decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md)'s health-keyed
phase model cannot express. The report has why, and why that argument wants having once rather than
mid-pass.

⚠️ **AND WHAT THE SHIELD IS FOR IS OPEN AGAIN.** A dodgeable curtain is a movement demand, not a
resource one, so the boss-vocabulary report's *"neither the shield nor the bomb has a moment it is
FOR"* is unanswered. 0151 says so rather than pretending.

### THE FIRST OF THE FOUR HAS LANDED — [0150](decisions/0150-the-uncoil-and-the-eye.md)

⚠️ **`overwhelm` AND THE WINDOW WERE BUILT ON THE CHORUS AND THE AXIS.** Read 0150 before picking up
queue item 2: it records three things the report asked for that it does differently, each for a
measured reason. ⚠️ **Its `overwhelm` stance is SUPERSEDED by
[0151](decisions/0151-the-gap-you-have-to-reach.md)**; the bared window stands.

⚠️ **THE ONE TO CARRY FORWARD IS WHAT THE PROBE FOUND.** The bare rows were first authored with a
zeroed fan, and the probe that removes `stepBoss`'s early return left the suite GREEN — the boss was
silent because the row said zero, not because the stance said stop. Two descriptions of one fact, and
the zeros came out. [0019](decisions/0019-a-probe-must-be-seen-to-apply.md) doing the more valuable
half of its job, again.

⚠️ **AND [0124](decisions/0124-the-boss-is-a-boss.md)'s PHASE-LENGTH GUARD WAS MEASURING THE WRONG
QUANTITY** on a phase with a damage multiplier on it — 5.3 seconds reported against 1.8 in the
player's hands. That is [0027](decisions/0027-measure-the-picture-not-the-model.md) and it is the
second one this project has found in its own guards rather than the predecessor's.

### AND THE BOSSES ARE ONE FAN, FOUR WAYS — [`the-boss-vocabulary-is-one-fan`](../reports/the-boss-vocabulary-is-one-fan-2026-08-14.md)

⚠️ **REPORTED 2026-08-14**: *"the bosses need to be more interactive with more varied attacks, a
baseline is the jormungdar boss battle from Golf-Stars. We currently have one unique boss in
into-the-coil which is level 3, all the other boss attacks are almost exactly identical."*

⚠️ **IT IS LITERALLY TRUE AND THE UNION'S OWN COMMENT SAYS SO.** Four of the five `BOSS_ATTACK_KINDS`
are one mechanism — a fan of *n* bullets across a spread — differing only in where it points and
whether it rotates. **`wall` is the only second idea in the game and it is level 3's**, which is
exactly and only the boss the player calls unique. Seven fights are three movements × two mechanisms.

⚠️ **THE PREDECESSOR'S FIGHT IS FIVE MECHANISMS AND FOUR OF THEM HAVE NO VOCABULARY HERE AT ALL** — a
persistent hazard, a **telegraphed** lock-on, a **second-order** projectile that detonates into a ring,
an undodgeable barrage the SHIELD is for, and a **bared-vulnerability window** to finish on. Read at
`C:\Golf-Stars\src\app\storyFinaleScreens.ts` for the named reason CLAUDE.md requires.

⚠️ **THE WORD IS *INTERACTIVE* AND THAT IS THE FINISHER, NOT THE ATTACKS.** 0050's shield and 0053's
bomb exist and **neither has a moment it is FOR**. An `overwhelm` phase is the first thing in this game
a shield would be for, and it costs no new resource — only a reason. The report has the ordering and
what must not be bundled with what.

### AND THE ART CHANNEL IS STARTED — [`where-the-art-ceiling-is`](../reports/where-the-art-ceiling-is-2026-08-14.md), and [0149](decisions/0149-a-hull-has-an-interior.md) is its first half

⚠️ **THE CEILING WAS ONE FLAT INK PER SPRITE AND THE FILL HALF IS DONE.**
[0149](decisions/0149-a-hull-has-an-interior.md) gives `drawKind` a second pass and the seven bosses an
interior in `palette.space`, declared in `ACCENT_OF` beside `INK_OF`. The report's items 1 to 4, and
nothing else in it.

⚠️ **THE SEVEN ACCENTS ARE AUTHORED AND UNFLOWN.** The geometry is guarded and the seven were
photographed off scratch builds; whether they are the right seven marks is a question for eyes, which
[0027](decisions/0027-measure-the-picture-not-the-model.md) says a green suite cannot answer.

⚠️ **`variant` IS STILL IN THE BRIEF AND NOT IN THE CODE, DELIBERATELY.** `docs/game.md` and
`src/render/bake.ts` both say art is a function of `(kind, variant, palette, view)`; the signature is
`drawKind(ctx, kind, palette, size)`. Fourteen `SpriteKind`s stand in for seven bosses and their hit
frames, **and that is what caused the shipped defect where five bosses had no hit interaction at all.**
0149 leaves it standing on the report's own argument: a verdict on the picture and a refactor of the
pipeline in one PR is unattributable.

⚠️ **AND THE SHIPS AND ENEMIES ARE STILL ONE FLAT INK**, on a size argument 0149 states and
[`enemy-silhouettes`](../reports/enemy-silhouettes-2026-08-05.md) measured. If a play-test says the
bosses now read as a different class of object, the answer is a row in `ACCENT_OF`.

⚠️ **`src/render/bake.ts` CAN BE MEASURED NOW, WHICH IT COULD NOT BE BEFORE.** `drawKind` takes a
`Pen` and `tests/paths.ts` traces it, so *where did the ink go* is arithmetic in node rather than a
bake, a `document` and a real Chromium. Any future claim about a silhouette can be held the same way.

⚠️ **AND THE BRASS IS MEASURED BUT UNATTRIBUTED.** 0147 took `sub` down 3.4 dB in every place and put
`call`, `hook`, `arp` and `counter` up 4.6–6.2 dB in every place; all four hold 42–54% of their energy
in the 130–800 Hz trombone register, and **`call` is open at `run`**. `npm run dash` solos it in one
click and that is the cheapest thing anybody can do next.

### LEVEL 3 HAS ITS OWN MODE — [0148](decisions/0148-a-place-has-its-own-notes.md)

⚠️ **THE MELODIES WERE NOT COPIES, AND THAT IS 0148's FINDING** — `node scripts/weigh-notes.mjs`,
written for it: **two distinct pitch-class sets across seven places**, six of them sounding exactly
`A B C D E F G` at 0.0% chromatic, and the only place with any colour in it was the base composition,
which nobody wrote as a place. **A third set of notes would have produced the same report a fourth
time.**

⚠️ **THE GUARD THAT DID IT WAS WIDER THAN ITS OWN REASON AND THE SHIPPED DESIGN ALREADY BROKE IT.**
Read 0148 before touching a place's material: `src/content/music.ts` has sounded a G# over these same
cues ninety-three times since before the guard existed, and the exemption was a `for` loop rather than
a judgement.

⚠️ **A PLACE STATES ITS OWN MODE NOW AND KEEPS THE GAME'S ROOT.** 0099 is untouched; what moved is the
distinction between a mode and a key.

⚠️ **AND THE SUPERSAW WAS ALWAYS REACHABLE — `octave` IS A FLOAT.** Two files said this synthesiser
had no detune. `cents()` in `src/content/saurian.ts` is the whole of it, and it costs no engine
change; the next place should reach for it rather than for two voices an octave apart.

⚠️ **LEVELS 4, 5, 6 AND 7 ARE DELIBERATELY UNTOUCHED, AT THE PLAYER'S OWN CHOICE** — level 3 first,
then the rest once it has been heard. **If level three reads as eurobeat, the technique is proven and
the other four are a day's work. If it does not, the answer is not four more of the same.**

⚠️ **THE CLIPPING GUARD'S BUDGET WAS FOR TWO COMPOSITIONS AND THE GAME HAS SEVEN.** It sat at 88% of
its 60 s on main and 0148's six extra voices tipped it; the four places still owed a mode would each
have done the same. 0148 has the measurement — **27.0 s of it is baking and 3.7 s is walking** — and
why the clock moved and the assertion did not.

⚠️ **AND `apartBy` IS A PROXY.** If two places at 4 dB still sound alike, **the threshold is not the
thing to move** — the proxy is wrong and needs replacing. That is written into 0147 so it cannot be
worked around quietly.

### ALL SEVEN LEVELS HAVE THEIR OWN MUSIC

⚠️ **THE FIVE MISSING PLACES ARE WRITTEN** —
[0146](decisions/0146-three-more-places-and-two-after-them.md), asked for by name, 2026-08-13:
*"crank out music for level 3 and level 4… if you get those two levels done, move onto 5, 6 and 7."*
Saurian Belt, The Labyrinth, Rime Shelf, The Toxic Mire and The Black Heart — twenty-one layers each,
their own progressions and their own tunes. **Three theme kinds were renamed and one moved a level**,
because the brief contradicted what the table said they were.

⚠️ **THE ONLY THING THAT MATTERS NEXT IS A LISTEN, AND IT IS FIVE LISTENS RATHER THAN ONE.**
`npm run dash`, one place at a time. Every number in
[`five-places-measured`](../reports/five-places-measured-2026-08-13.md) is a model quantity —
[0027](decisions/0027-measure-the-picture-not-the-model.md) — and *space laser dinosaur* is a claim
about a picture.

⚠️ **AND THE TUNING PASS ON LEVELS ONE AND TWO IS STILL OWED, WITH ITS THREE QUESTIONS STILL
UNANSWERED.** It was deferred, not dropped, and the player gave the reason: *"refining each level is
probably going to be a detailed process so getting some baseline tracks in now is probably a good time
to get some more levels in so that tuning the tracks can also be done individually, but tonally for
the game overall as well."* **Nothing in levels one or two was touched by 0146**, deliberately — the
reference cannot move in the same session as the things being read against it.

⚠️ **AND THE PLAYER HAS NAMED TWO STANDING FAULTS IN THEM WITHOUT DETAILING EITHER**, 2026-08-13:
*"there are still some gain and some overlap issues for level 1 and 2 to sort out, so don't
necessarily blindly repeat them, but they're good bases to start from."* **What *gain* and *overlap*
mean concretely is the first question to ask**, and `scripts/weigh-audition.mjs` is where the answer
gets measured — [0140](decisions/0140-no-layer-is-inaudible.md) built it for exactly this.

⚠️ **THE FIVE NEW PLACES WERE MIXED WITH THAT WARNING IN HAND** and their spreads are in the report;
the one to expect a report about is **`core`'s `sub`, 9.5 dB over its next loudest layer**, which is
the widest in the game and is written down rather than pre-emptively tuned.

⚠️ **THE TWEAKS THEMSELVES ARE STILL NOT NAMED**, and asking for them is the first move. What is known
is that the last three rounds of this channel each turned a vague description into a measured quantity
before anything was changed — [0134](decisions/0134-the-place-keeps-the-games-pace.md),
[0136](decisions/0136-the-place-has-a-room-and-an-arc.md) — and every one of those measurements found
the report was exactly right. **Reach for `scripts/weigh-rung.mjs` before reaching for a number.**

⚠️ **THREE QUESTIONS WERE PUT TO THE PLAYER AND NONE HAS BEEN ANSWERED YET.** They are the cheapest
thing to ask first:

1. does the room read as a *building*, or as a wash over the tune?
2. do the opening, push and surge read as three different things — or as three volumes?
3. does the boss land as a drop? It falls an octave **and** loses almost all its reverb at once, and
   that combination is the least certain to translate.

⚠️ **AND ONE STRUCTURAL CALL IS WAITING ON THE PLAYER, WITH ITS NUMBERS ALREADY TAKEN** —
[0134](decisions/0134-the-place-keeps-the-games-pace.md). *"The surge from level one should be the
default music speed for the next levels at the start"* is 172 notes a bar across FOURTEEN open layers;
a level's `run` opens nine and the ladder decides which. **Levels 2+ opening at `push` delivers it to
within 7%** and costs one section boundary a level — which is the *fewer bigger sections* option
[0125](decisions/0125-the-build-starts-sooner.md) records the player refusing in another form. It is
not a call to make inside a tuning pass.

⚠️ **AND THE INSTRUMENT GOT TWO THINGS FOR THAT TUNING PASS BEFORE IT STARTED**, asked for by name on
the same day:

1. **A layer can be auditioned with the transport STOPPED** —
   [0137](decisions/0137-the-desk-sounds-while-the-level-stands-still.md). *"Pause the music and then
   play a particular sound… without affecting the current run of the melody itself."* The level clock
   does not move, so the rung you are listening to cannot walk on underneath you.
2. **The `push`, `surge` and `approach` boundaries are on draggable handles** —
   [0138](decisions/0138-a-section-boundary-is-a-distance-you-can-drag.md), over the game's own
   `musicLevelFor`. ⚠️ **NOTHING IS TUNED THERE — not one distance moves in that change**, and 0138
   says why the instrument comes first. **It is the tool for question 2 above**, which is about
   whether three sections read as three things.

⚠️ **AND 0134's STRUCTURAL CALL CAN NOW BE HEARD BEFORE IT IS MADE.** *Levels 2+ opening at `push`* is
one of the two shapes the handles reach: dragging `push` out to the whole level is that proposal, and
it costs a drag rather than a PR.

⚠️ **AND THE TUNING PASS HAS AN ORDERING RULE NOW, GIVEN BY THE PLAYER** —
[0140](decisions/0140-no-layer-is-inaudible.md): *"cacophony is probably a better result than having
half of the sounds completely inaudible and then we can tone down the cacophony."* **Which error to
make is settled: too loud.** A layer that is too loud gets reported after one listen; a layer that is
inaudible produces no report at all, which is how Ember Nebula's `ride` sat 38 dB under its own mix
for the whole life of the place.

⚠️ **THE FIRST THING THAT ORDERING BOUGHT IS `node scripts/weigh-audition.mjs`** — 0140, and it is the first
measurement here of **what a mix number actually produces** rather than what it says. The faders a
hand sets span ~7 dB across a place; what comes out of them spans 38. **Three ride gains moved and
nothing else did** — the before-and-after is in 0140, so a listener can say it went the wrong way.

⚠️ **THE DASHBOARD LIES AFTER A CODE EDIT UNLESS THE PAGE RELOADS, AND IT NOW RELOADS ITSELF** —
0136. A vite hot update left every baked buffer where it was, so the page printed the new layer list
and played the old audio. Fixed; but **the fix only applies from the load after you have it**, so hard
reload once after a pull.

### The music is a rewrite in four phases, and two of them have landed

⚠️ **THE PLAYER HAS SET THE DIRECTION AND IT IS A DECISION ABOUT WHICH RULE GOES**, 2026-08-11:
*"the moving breathing sound is what I want… even if we have to scrap the current music implementation
and redo it because it's a convoluted mess, I'd rather go the extra effort than accept a standard
implementation instead of a good one. The primary rule of the project is Quality first and that
applies to music and sound as well as everything else."*

⚠️ **[0072](decisions/0072-a-cue-is-baked-and-played.md) STANDS. WHAT GOES IS
[0090](decisions/0090-the-music-is-four-loops.md)'s *intensity is nothing but their gains*** — which
[0114](decisions/0114-the-fight-is-a-different-piece.md) already began dismantling and stopped
halfway. **A scheduler was considered and is not needed**: what the ask requires is BUFFER scheduling
at a bar line, which is one `start(when)` per bar and not a note-level allocation, so 0072's objection
does not reach it.

| phase | what | state |
|---|---|---|
| 0 | **the rig renders a LEVEL** — rungs, ramps, theme, and where every boundary lands in the bar | ✅ [0116](decisions/0116-the-rig-plays-the-level.md), and **played live** ✅ [0126](decisions/0126-the-dashboard-is-the-instrument.md) |
| 1 | **bar-line quantisation**, per-note duration, per-layer panning | quantisation ✅ [0117](decisions/0117-a-section-change-lands-on-the-beat.md), panning ✅ [0118](decisions/0118-the-mix-has-a-width.md); **per-note duration is owed** |
| 2 | **the transport** — sections on bar lines, one-shot fills at seams, variant slots, selection from game state | not started. This is where *moves and breathes* lives |
| 3 | **per-theme composition**, baked at the level boundary | ✅ **done, and one place is written** — the storage model [0128](decisions/0128-a-place-plays-its-own-material.md), a whole place [0132](decisions/0132-a-place-may-be-another-piece-entirely.md), the boundary bake [0133](decisions/0133-the-place-is-baked-at-the-boundary.md), its arrival [0135](decisions/0135-a-place-arrives-when-you-do.md), its pace [0134](decisions/0134-the-place-keeps-the-games-pace.md) and its room [0136](decisions/0136-the-place-has-a-room-and-an-arc.md). **Six of the seven places still state no material of their own — and they WAIT**, see the row above |

⚠️ **START HERE ON THE MUSIC, AND START BY OPENING THE DASHBOARD** —
[0126](decisions/0126-the-dashboard-is-the-instrument.md) and
[0129](decisions/0129-the-desk-holds-a-value-not-a-multiplier.md). `npm run dash` serves `/rig/`: the
game's own mixer on a scrub bar, live gains read off the `GainNode`s, **absolute faders and per-layer
pan**, the gun and the tubes at a tier slider, every cue on a button, **every music layer on a button
beside them** ([0130](decisions/0130-a-layer-can-be-heard-on-its-own.md)), and a copy-out. **It is the
answer to *"whole sections of sound that have been produced that I've apparently never heard in
game"*** and it is where a music number is opened from now on, because it is the only instrument here
that answers a question asked at a moment rather than about a file.

⚠️ **AND *WHAT DOES THIS ONE SOUND LIKE* IS NOW ONE CLICK** —
[0130](decisions/0130-a-layer-can-be-heard-on-its-own.md). It was three gestures, because a solo
leaves the survivor at whatever the rung says and most of the table is closed at any given rung.

⚠️ **THE FADERS BEING ABSOLUTE IS THE PART THAT MATTERS FOR AUTHORING** — 0129. `open everything`
sounds all twenty-three at once *including what the rung has closed*, so *what would `frenzy` do
during `run`* is a question the desk can answer. What it finds pastes straight back into
`MUSIC_LADDER` or a theme's `mix`.

⚠️ **AND IT TOOK A MEASUREMENT NOTHING HERE HAD TAKEN: how long a layer is open against how long its
OWN loop is.** `surge` lasts 16.0 s and `counter` — the tune it opens — takes 25.6 s to say itself,
so it reaches **0.63 of a loop**; `approach` is 0.70. Those are exactly the two rungs 0125 records as
unnoticed. **It does not replace 0125's ask and it is not the same finding**: 0125 says those rungs
need arriving material, this says the window they arrive in cannot hold a phrase. The table is in
0126 and the dashboard prints it live.

⚠️ **AND THE EFFECTS ARE IN THE FIELD NOW, WHICH THEY WERE NOT WHEN 0118 GAVE THE MUSIC ONE** —
[0127](decisions/0127-a-cue-has-a-place.md). A cue sounds from the `across` it happened at; `hit` is
the one that cannot and the decision says why. **Nobody has heard it**, and the question to put to the
dashboard is whether a kill at the edge reads as *over there* or as the mix wobbling.

⚠️ **`scripts/hear.mjs --play` IS STILL MONO and it is the mode for judging cues against music.**
Only `--level` writes stereo. The WAV rig now shows a narrower picture than the game; the dashboard
supersedes it for that question.

⚠️ **AND LEVEL TWO IS A DIFFERENT PIECE OF MUSIC NOW — IN THE DASHBOARD AND NOT IN THE GAME** —
[0132](decisions/0132-a-place-may-be-another-piece-entirely.md), which supersedes
[0128](decisions/0128-a-place-plays-its-own-material.md)'s two-layer version. Ember Nebula states
**twenty-one of the twenty-three layers**, its own sixteen-bar progression and its own tune: a choir
at `run`, an organ at `push`, a symphonic counter-line at `surge`, a cathedral bell at `approach` and
a discordant inferno at the boss. `src/content/nebula.ts` is the composition.

⚠️ **AND THE GAME PLAYS IT NOW, WHICH IT HAS NEVER DONE FOR ANY PLACE** —
[0133](decisions/0133-the-place-is-baked-at-the-boundary.md). The material for the place the run is
heading for is synthesised across frames from the moment the boss dies — so the bake gets the whole
break screen — and handed to 0128's `setLoops`, which swaps at the next phrase.

⚠️ **IT REPLACES AND DOES NOT CACHE, AND THAT IS A MEASUREMENT** —
[`what-a-whole-place-costs`](../reports/what-a-whole-place-costs-2026-08-12.md). A place this size is
**46.85 MB** of its own audio. Held alongside the base it is 94.8 MB against a 56 MB ceiling; replacing
the layers it states it is 48.0, unchanged, because a place's arrays are the same length as the ones
they replace. `rig/dash.ts` caches per place and may; the game may not, and a guard holds the identity.

⚠️ **AND IT HAS BEEN HEARD ONCE AND WAS HALF THE SPEED OF THE GAME** —
[0134](decisions/0134-the-place-keeps-the-games-pace.md). *"Pretty cool, but it doesn't fit the high
paced gameplay… very high on the treble with no deep bassy times."* Measured: **61 notes a bar against
level one's 118**, and eight points of bottom missing at `surge`. The piece now runs at 94–113% of the
base's pace and 93–109% of its bottom at every rung, and `tests/themes.test.ts` refuses either below
90%. **`scripts/weigh-rung.mjs` is the instrument** and it prints both against the base.

⚠️ **THE ONE CLAUSE OF THAT REPORT NOT DELIVERED IS A QUESTION FOR THE PLAYER.** *"The surge from level
one should be the default music speed for the next levels at the start"* is 172 notes a bar across
FOURTEEN open layers; a level's `run` opens nine and the ladder decides which. Levels 2+ opening at
`push` would deliver it to within 7% and costs one section boundary a level — which is the *fewer
bigger sections* option [0125](decisions/0125-the-build-starts-sooner.md) records the player refusing.
0134 has the numbers.

⚠️ **WHAT IS OWED IS A LISTEN AND NOT A BUILD.** Nobody has heard a level boundary change the music in
the game. Whether a place arriving at the next phrase reads as *the music changed* or as *the music
glitched* is the first thing to listen for on the next play — 0133 says so rather than claiming it.

⚠️ **TWO GUARDS WERE MISSING AND A PLACE IS WHAT FOUND THEM.** The band rule and the longest-note rule
both baked `MUSIC` and only `MUSIC`, so neither had ever seen a theme's own material — and the first
cathedral bell was 49% of its energy under 130 Hz on a layer panned to −0.5, with every guard green.
`scripts/weigh-place.mjs` is the instrument that printed it.

⚠️ **AND THE FINDING THE NEXT FIVE PLACES NEED: a theme cannot change its HARMONY without re-voicing
every pitched layer.** Two sizes of place, and they cost differently — two or three layers over a
shared progression, or the whole thing. 0128 has the argument and
[0132](decisions/0132-a-place-may-be-another-piece-entirely.md) is what the large one costs: **21
layers, 3.7 s of synthesis, 46.85 MB.**

⚠️ **THE KEY IS STILL A LIMIT AND THE REASON HAS MOVED.** 0128 said a re-voiced tune stays in A
natural minor because the progression under it is shared; Ember Nebula re-voices the progression too,
and stays anyway — **the cues are in the key**
([0099](decisions/0099-the-cues-are-in-the-key.md)), so a place in another key puts the player's own
gun out of tune with the level. 0132 records that it cost nothing: the tritone and both minor seconds
the inferno is built from are already in A minor.

⚠️ **NO DEAD LAYER AND NO DEAD CUE WAS FOUND**, which was the first hypothesis and is worth not
re-testing. All fourteen cues have a call site; `bass` and `beat` are title-only by 0095's design.
What the player has genuinely never heard is **six of the seven themes**, because a run has to reach
those levels — and the dashboard's level selector is the whole of that answer.

⚠️ **`surge` AND `approach` NEED NEW MATERIAL, AND THE PLAYER HAS CHOSEN IT.**
[0125](decisions/0125-the-build-starts-sooner.md) has the measurement and the reasoning; the
short version is that **an ARRIVAL is what a listener hears and a departure is not**, so
[0123](decisions/0123-a-rung-changes-the-notes.md)'s churn guard is **measuring a quantity now known
not to predict the report** and its 25% bound must not be trusted. Each of those two rungs needs
roughly **+60 notes a bar of material that is not already playing**, and the level has none spare.

⚠️ **THE CHEAPER OPTION WAS OFFERED AND REFUSED**: *"fewer bigger sections sounds like it's going to
flatten things out and probably not in a good way."* Do not reach for it.

⚠️ **AND THE WEAPON LADDER'S 6.9× SPREAD IS AN OPEN LEVER WITH A PREFERRED SHAPE.** The player is
open to compressing it and would rather not touch the rate of fire, which *"feels good"* — so the
suggestion on the table is **raising the BASE weapon's damage** (7.5 dps, the state a player is in
right after a death) rather than flattening the top. [0124](decisions/0124-the-boss-is-a-boss.md)
records why it is the root cause and why boss health was moved instead.

⚠️ **PHASE 1's REMAINING TWO ARE NAMED CEILINGS, NOT POLISH.** Every note in a voice is **the same
length and the same timbre** — `MusicVoice.note` is one `CueLayer` per voice, so a melody where every
note is 0.2s is a limit no mix escapes. And the output is **mono**: 23 layers stacked at one point with
no depth cue. ⚠️ **Panning costs NO extra memory** — the layers stay mono buffers and take a
`StereoPannerNode` each — which is not what a first reading suggests, and the 56 MB ceiling is not in
the way.

⚠️ **THE BAR CLOCK 0117 BUILT IS THE PRIMITIVE PHASE 2 NEEDS.** `nextBarFrom(anchorAudio, now)` is
already the answer to *when does a section change land*, so the transport is closer than it was.

⚠️ **AND 0114 HAS ALREADY NAMED THE FIRST THING PHASE 2 SHOULD DO**: *"a rung that closes a layer as it
opens two is a change of arrangement rather than a thicker one, and it is the only mechanism here that
has ever read as a section boundary."* That is 0090's additive rule being the thing in the way, in
0114's own words.

⚠️ **NOTHING FROM 0116 OR 0117 HAS BEEN HEARD BY THE PLAYER YET.** Three renders were handed over —
level one before, level one after, and level seven — and **the verdict on whether the bar line was the
whole of `surge` is what decides whether phase 2 starts or phase 1 finishes.** Do not stack another
change on the channel before that answer; six rounds were spent doing exactly that.

---

⚠️ **START HERE FOR EVERYTHING ELSE. THE LIST IS THE EIGHT CHUNKS BELOW AND IT COMES FROM
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

**NAMING the biomes.** ✅ Theming itself has landed —
[0107](decisions/0107-a-level-is-a-place.md) gives every level its own place, backdrop and mix. What
is still open is the FICTION: the seven places are this project's own inventions, and `docs/game.md`
themes the levels on the predecessor's fourteen. Picking those means going to the predecessor for
material, which `CLAUDE.md` allows only for a named file and a named reason — and 0107 records that
the reason now plausibly exists. **It wants asking rather than assuming.**

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
