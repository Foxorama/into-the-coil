# Two weeks on one channel — a quality review and a design review

**Written 2026-08-25**, on the request *"I've been stuck on music for a couple of weeks and don't feel
I've made any progress and still feel like I need a heap of work to get around the music and sound
issues I'm having before I can even begin to start on art assets."*

⚠️ **THIS IS A SURVEY AND NOT A CHANGE.** Nothing here has been acted on. Every claim below names
what checked it — [0028](../docs/decisions/0028-quality-is-the-constraint.md).

⚠️ **THE HEADLINE, BEFORE ANY OF THE DETAIL: MUSIC DOES NOT BLOCK ART.** `src/render/` imports
nothing from `src/app/sound.ts`, `src/app/music.ts`, `src/content/music.ts` or `src/content/cues.ts`,
and nothing in the audio path imports `src/render/`. Checked by `grep -rn "^import" src/render/*.ts`
returning zero audio matches. The two channels share one file — `src/content/themes.ts` — and they
share it as **independent fields on one row**: `space`/`nebula` are the backdrop, `mix`/`voices`/
`ladder`/`cues` are the sound. The belief that the sound has to be finished first is not a fact about
this codebase.

---

## The measurements this report rests on

Taken 2026-08-25 against `7963c83`, a clean tree on `main`.

| | |
|---|---|
| suite | `npx vitest run` — **64 files, 1105 tests, all green, 100.4 s wall** |
| last commit | **2026-08-21**. Four days idle |
| project age | first commit 2026-08-03. **19 working days** |
| decisions | **191**, of which **~80 (42%) are audio** |
| decisions since 2026-08-16 | **43**, of which **37 audio, 1 art, 2 gameplay, 3 process** |
| audio source | **15,687 of 34,180 lines in `src/` (46%)** |
| audio tests | **10,434 of 31,539 lines**; **275 of 1086 `it()` blocks** |
| audio instruments | **16 `weigh-*.mjs`**, plus `hear`, `hear-solved`, `solve-mix` — 2,822 lines |
| the desk | `rig/` — **2,938 lines**, entirely audio |
| audio total | **≈31,900 lines of a ≈73,900-line project (43%)**, before probes |

The project's own `scripts/hotspots.mjs`, run today, ranks the top four attractors as
`src/app/mount.ts`, `tests/music.test.ts`, `tests/themes.test.ts`, `src/content/music.ts`, and the
top three by net growth as `src/content/music.ts` (+2704), `tests/sound.test.ts` (+2613),
`tests/music.test.ts` (+2474).

---

# PART ONE — QUALITY

## ⚠️ What is genuinely good, stated first because it is load-bearing

**The engineering is better than the predecessor's and better than most shipped games of this size.**
1105 green tests in 100 seconds. 149 probes, each of which has been broken on purpose and watched to
go red ([0005](../docs/decisions/0005-a-guard-must-be-seen-to-fail.md),
[0019](../docs/decisions/0019-a-probe-must-be-seen-to-apply.md)). A closed layer ladder with an
import arrow that points one way. Closed unions with `never` arms. Seeded, per-concern randomness. A
fixed-step sim with an interpolating renderer. No allocation in the frame loop, counted rather than
timed. A single-file build. **None of that is in question and none of the recommendations below touch
it.**

**And the decision record is the best artefact in the repository.** 191 files, each naming what it
supersedes, what it refuses, and what it costs. The project repeatedly catches its own *class* of
failure and writes it down —
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md),
[0044](../docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md),
[0184](../docs/decisions/0184-the-measurement-reads-the-place.md),
[0191](../docs/decisions/0191-a-place-sits-somewhere.md). That habit is why this report can be
written at all: nearly every finding below is one the project already found and recorded, and what is
new is only the pattern across them.

**So nothing here is a report that the work was sloppy.** It is a report that a very good process was
pointed at a channel it is structurally unable to close, and did not notice.

## ⚠️ Finding 1 — the guards have started deciding the music

This is the finding. Everything else is downstream of it.

[0191](../docs/decisions/0191-a-place-sits-somewhere.md), 2026-08-21, in its own words:

> *"`chords` was not the cause and `groove` was. The player closed it; 0189 opened it with a bassline
> written for the occasion… **It removed the exact thing that had just been identified as the
> difference, while quoting the correction in its own text.** … **And it did it to keep a guard
> green.** `tests/arrangement.test.ts` refused a role for a layer the SHARED ladder does not open, so
> `bass` and `beat` could not be given one."*

A test refused a musical arrangement, and the arrangement changed. The player had driven a mix on the
desk, said it was *"completely different to every other level"*, and the shipped version moved their
sound into the one slot all seven places share — because the alternative failed a suite.

**This is not an isolated slip. It is the fourth of a family, all recorded:**

| decision | the guard said green over | scale of the miss |
|---|---|---|
| [0092](../docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md) | all three aura guards | the curve had collapsed to **0.004 of its ceiling** where a fight is flown |
| [0174](../docs/decisions/0174-a-send-has-to-mean-something.md) | all three room guards | the reverb shipped un-normalised, **7.8–9.0 dB above the dry** |
| [0179](../docs/decisions/0179-an-explosion-ends-low.md) | eighty-four cue guards | the enemy death's centre of gravity **rose 22.5 dB** |
| [0191](../docs/decisions/0191-a-place-sits-somewhere.md) | `tests/arrangement.test.ts` | the guard **caused** the defect |

**The stateable cause.** A guard can assert a property. Whether that property is the one that matters
is a claim no guard can check. In the sim channel that gap is small — *does the bullet hit the hull*
is objective, and 0027's *measure the picture* closes most of what is left. In the audio channel the
gap is the whole thing: **there is no objective function for "does this sound like eurobeat."** The
project has 275 audio `it()` blocks and 16 measuring instruments standing over a channel whose only
valid oracle is one person's ear, and the guards have quietly become the specification.

⚠️ **`CLAUDE.md` does not cover this, and should.** 0019 catches a guard that never fires. 0027
catches a guard that fires on the wrong quantity. **Neither catches a guard that fires correctly on a
quantity nobody wants held.** That is a third failure and it has now cost a shipped track.

## ⚠️ Finding 2 — the instruments have their own bug rate, and it is high

Sixteen `weigh-*` scripts, built one per question. In fourteen days at least four shipped wrong, and
each one invalidated work built on it:

- **[0184](../docs/decisions/0184-the-measurement-reads-the-place.md)** — `heardAt`, the arithmetic
  under [0164](../docs/decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md)'s role floor,
  `weigh-adrift` and `weigh-heard`, **read the shared ladder where six of seven places state their
  own. 65 gains differ.** Six of 54 known-adrift entries were phantoms. 0184's own text: *"the next
  edit would have been a tuning pass against a phantom."* **Every mix number written between
  2026-08-16 and 2026-08-20 was written against this.**
- **[0189](../docs/decisions/0189-a-place-is-what-it-does-not-play.md)** — `weigh-gesture` *"cannot
  see the thing that fixed it"*, by construction: it compares layers two places both open, and the
  fix was a closure.
- **0183's pass** — `scripts/weigh-mix.mjs` *"had drifted from its own guards"*: read a floor 0176
  replaced, printed verdicts for guards 0182 deleted, called a raw-sum proxy the clip guard's
  arithmetic.
- **[0190](../docs/decisions/0190-a-place-owns-what-it-kills.md)** — `weigh-cue.mjs` still takes no
  place, so 0179's own instrument cannot be pointed at the newest explosion in the game. Named as a
  debt and not paid.

**Each instrument was built to settle a question, and each has itself become a thing that needs
guarding.** The measurement layer is now ~2,800 lines and is growing faster than the thing it
measures. This is the cost side of an instrument-first discipline that is right in principle
([0116](../docs/decisions/0116-the-rig-plays-the-level.md),
[0126](../docs/decisions/0126-the-dashboard-is-the-instrument.md)) and has been applied past its
return.

## ⚠️ Finding 3 — `docs/state-of-play.md` has failed its own rule, and nothing tests it

**2,621 lines. 199 KB. The largest file in the repository**, larger than `src/app/frame.ts`.

Its own header says:

> *"⚠️ **This file holds POINTERS AND INTENTIONS, never findings.** … **Maintained**, unlike
> `reports/`. It is rewritten as things land; **it is not a log.**"*

What it actually contains: four `START HERE` headings, one of which reads *"THIS IS THE ONLY START
HERE IN THIS FILE, AND THAT IS ON PURPOSE"* while three others sit below it; struck-through headings
kept in place; and roughly two hundred paragraphs that are findings, not pointers — measured dB
figures, counts of adrift layers, arithmetic, verdicts.

⚠️ **`CLAUDE.md`'s opening paragraph is about exactly this**, one file over:

> *"the predecessor's constitution reached 2,140 lines and was pruned three times in six weeks, every
> prune reversed — not because nobody wanted it short, but because the reasoning had nowhere else to
> go."*

The delegation worked: `CLAUDE.md` is 140 lines and healthy. **The pressure moved to the one living
document with no rule and no test over it, and that document is now 22% longer than the predecessor's
constitution ever got.** [0038](../docs/decisions/0038-the-handover-is-a-file.md) requires the file;
nothing bounds it.

**The practical cost is real and it is being paid every session.** Reading it costs the first
half-hour of a session, and its own text admits stale markers survived three days pointing at work
already done — *"a marker that survives the thing it points at is worse than no marker."*

## Finding 4 — reasoning has migrated back into source comments

**Audio source files: 14,649 code lines against 16,284 comment lines — 53% comment.** Across the
whole tree the largest files run 64–80% comment: `src/content/pickups.ts` 80%, `src/app/frame.ts` 75%
over 3,437 lines, `src/content/cues.ts` 74%, `src/content/music.ts` 65%.

`CLAUDE.md` says reasoning lives in `docs/decisions/`. Much of it now lives in headers instead — and
it drifts there the same way. `src/content/themes.ts`'s own header carries:

> *"⚠️ **BOTH HALVES OF THAT LAST SENTENCE ARE NOW FALSE, AND IT IS LEFT STANDING BECAUSE THE
> REASONING IS WRITTEN ONCE**"*

That is the right instinct applied to the wrong artefact: a decision file is versioned and superseded
by name; a paragraph in a `.ts` header is neither, and now needs a correction stapled under it.
**A reader cannot tell a live comment from a superseded one without opening the decision anyway.**

## Finding 5 — throughput is at the machine's ceiling on the channel that is not converging

Every PR runs `npm run check` (1105 tests + typecheck + build) **and** `npm run prove` (149 probes,
each on a disposable copy).
[0033](../docs/decisions/0033-a-branch-starts-at-main.md) forbids stacking, so the pipeline is
strictly one PR at a time.

**38 PRs landed between 2026-08-16 and 2026-08-21 — six working days.** That is close to the ceiling
of what this process can pass. It is not a criticism of the pace; it is the reason *going faster* is
not available as a fix. **The only lever left is aim**: fewer, larger, better-targeted changes.

## Finding 6 — a memory ceiling is deciding the composition

`tests/sound.test.ts` holds resident loops under **56 MB**. That number now decides musical structure:
[0188](../docs/decisions/0188-a-place-owns-four-slots.md) gives a place **four** own slots and not
five, at **four** bars and not eight, because *"twenty-three layers is 48.0 MB and four four-bar slots
is 52.5; four eight-bar slots is 57.0 and does not fit."*

[0153](../docs/decisions/0153-desktop-is-the-target.md) says desktop is what every budget is argued
against, and 56 MB of audio buffers is not a desktop constraint in 2026 — it is a number inherited
from the phone argument 0153 retired, restated as a desktop one. The guard's own note says a change
wanting more wants the boundary-baking mechanism, **which
[0133](../docs/decisions/0133-the-place-is-baked-at-the-boundary.md) already built.** So the ceiling
is holding back authoring for a reason that has already been paid for elsewhere.

## Minor, and stated as an observation rather than a live bug

`npx vitest run --reporter=basic` against an invalid reporter name **exited 0 on a startup error**,
printing a stack trace and running nothing. No CI path passes `--reporter`, so this is not currently
reachable — but [0005](../docs/decisions/0005-a-guard-must-be-seen-to-fail.md)'s whole argument is
about a suite that reports green without asserting, and `tests/base.test.ts` already asserts things
about the workflow file. One assertion that a vitest invocation reporting zero tests is a failure
would close it.

---

# PART TWO — GAME DESIGN

## ⚠️ The instruction you gave on 2026-08-14 was not carried out

Recorded verbatim in
[`where-the-art-ceiling-is`](where-the-art-ceiling-is-2026-08-14.md) and in
[0149](../docs/decisions/0149-a-hull-has-an-interior.md):

> *"If you're not sure on the music, kick on with the art styles and boss styling, we can upgrade that
> and then go back to working on the music when I get back."*

**One art PR landed** — 0149, interior accents on the seven boss hulls, 2026-08-16. Since that day:
**37 audio decisions, 1 art decision, 2 gameplay decisions.**

The survey's own item 2 — `variant`, the missing parameter in `drawKind` — **is still undone eleven
days later, and it has already caused one shipped defect**: fourteen `SpriteKind`s stand up for seven
bosses, a boss and its hit sprite share a `case` arm, and *"five of the seven bosses had no hit
interaction at all and every guard was green."*

## ⚠️ Your own number-one ask has never been built

Given 2026-08-17, in your order, recorded in `docs/state-of-play.md`:

1. **A fast paced tempo melody that INCREASES IN TEMPO throughout the level.**
2. A different unique melody for each level.
3. Bosses to have unique threatening music, starting before the boss appears.
4. The sfx and cues to fit with the music.

**2, 3 and 4 have machinery. 1 has none, today, checked directly:**

- `src/content/music.ts:786` — `export const BEAT_SECONDS = 0.4;` **one global constant. 150 BPM,
  every place, every rung.**
- `ThemeRow` in `src/content/themes.ts` has eleven fields — `title`, `space`, `nebula`, `mix`,
  `ladder`, `voices`, `cues`, `trim`, `air`, `scale`, `aura`. **There is no tempo field.**
- `grep -rn "beatSeconds\|tempo:" src/ rig/` returns **nothing.**

⚠️ **AND THE TWO DECISIONS THAT UNBLOCKED IT WERE BUILT AND THEN NOT USED.**
[0159](../docs/decisions/0159-the-two-clocks-come-apart.md) took the gun off the musical grid and
[0160](../docs/decisions/0160-the-music-free-runs.md) put the music on its own clock — both on
2026-08-17, both explicitly so a tempo could move. **Twenty-eight decisions have landed since. None
added the field.**

⚠️ **AND THE SAME IS TRUE OF THE CHEAPEST FIX ANYBODY NAMED.**
[`the-twelfth-play-test`](the-twelfth-play-test-2026-08-14.md) closed with *"Open the fast layers
earlier. **The cheapest, most reversible answer** to *the opening is slow*, and it touches one
table."* Read today, `MUSIC_LADDER.run` still holds `arp: 0`, `hook: 0`, `drive: 0`, `counter: 0`,
`lead: 0`, `ride: 0`, `crash: 0`, `toll: 0`, `dread: 0` — **unchanged in the shared row, eleven days
on.** Individual places override it; the row every place starts from does not.

**So the two changes named as cheapest and most-wanted are both still undone, and the fortnight went
into the axis nobody asked about.** [0189](../docs/decisions/0189-a-place-is-what-it-does-not-play.md)
says so in its own title and its own text: *"This project has spent two weeks on timbre… the report
'every level sounds the same' is the oldest one in the repository and it outlived all six."*

## Why the music channel is not converging — the design read

A genre brief is four things. Your briefs have been genre briefs throughout: *eurobeat with a
junglebeat overtone*, *dark symphonic metal*, *celestial choir into inferno*, *hyper-faster
eurobeat/techno*.

| what defines a genre | what this project has |
|---|---|
| **tempo** | **nothing.** One global 0.4 s beat |
| **rhythmic signature** | 32-entry step arrays typed by hand, per layer, per place |
| **timbral signature** | 4 waveforms, one lowpass, one highpass, Q, a `tanh` drive, an envelope. No LFO, no detune, no delay. Unison is two saws typed four hertz apart |
| **arrangement** | **everything** — rungs, ladders, sections, roles, per-place ladders, own slots, trims, 16 instruments |

**The project has an enormous lever on the one axis a listener notices last, and no lever at all on
the one you have asked about four separate times.** *"No increased tempo"* (0102's trigger), *"tempo
and beat isn't close"* (twelfth play-test), *"increase the tempo and beat to match the hyper-faster
eurobeat/techno style"* (same), *"a fast paced tempo melody that INCREASES IN TEMPO"* (the ordered
list). That is not a mixing problem and thirty decisions of mixing could not have reached it.

## ⚠️ The deeper design read — the music is doing content's job

**What exists in the game today**, all verified in the tables:

| | |
|---|---|
| levels | **7**, ~66–76 authored waves each (≈490 waves total) |
| enemy kinds | **8** — drifter, lancer, weaver, turret, charger, warden, spinner, sower |
| formations | **3** — line, column, vee |
| bosses | **7**, one per level |
| pickup kinds | **4** — weapon, missile, shield, bomb |
| **ships** | **1.** `SHIP_KINDS = ['proof']` |
| **usable specials** | **1.** `SPECIALS` has two rows and `mines` has `shot: null` and no way to obtain it |
| hazards | **0.** No asteroids, nothing environmental |
| difficulty tiers | 3, plus a dial |

**And all seven levels are the same shape.** `bossAt` runs 4240–4460 — a 5% spread. Every level has
exactly four sections. Every level draws on the same 8 enemies, the same 3 formations, the same 4
pickups, the same 1 weapon ladder.

⚠️ **So the music is currently the ONLY axis on which the seven levels meaningfully differ.** That is
why it is carrying so much weight, why *"every level sounds the same"* is the oldest report in the
repository, and why no amount of mixing has retired it. **You are asking the soundtrack to make seven
structurally identical levels feel like seven places.** It cannot, and a better mix will not change
that.

**The cheapest route to *these levels feel different* is not in `src/content/themes.ts`. It is a
second enemy vocabulary, a hazard, and a third weapon.** A jurassic belt with lasers in it and a
labyrinth with something hunting you through it are, today, the same eight ships flying the same three
shapes past the same four pickups, over different chords.

## What `docs/game.md` promises and does not exist

| promised | state |
|---|---|
| the prologue, four *Far Carry* golfers | **not built.** One ship, named `proof` |
| the unlock pool — nine caddies, named and characterised | **not built** |
| the branching chart between levels | **not built.** Levels are a straight sequence |
| the betrayer returning as a later boss | **not built** |
| hazards that must be dealt with (asteroids fragmenting into weapons) | **not built** |
| the arsenal — *"a LIST, never a slot"*, one trigger per owned weapon | **shape built, one entry in it.** `docs/state-of-play.md`: *"the arsenal is otherwise still a list with nothing in it"* |
| homing rockets, piercing shots, multi-tag specials, faster engines, orbiting mines | **none built.** `mines` is a row with no shot |

⚠️ **AND THE ARSENAL IS THE ITEM AT THE TOP OF YOUR OWN PRIORITY LIST** — *weapons before flight,
arsenal variety first, flight-handling customisation explicitly second.* It has one working entry.

---

# WHAT I WOULD DO

Ordered. Each is a PR-sized change with a named file.

## To unblock yourself today — and it does not involve the music

1. **Start the art. Nothing is stopping you.** `src/render/` imports nothing from the audio path.
   [`where-the-art-ceiling-is`](where-the-art-ceiling-is-2026-08-14.md) is a finished survey with a
   four-item build list, item 1 done and items 2–4 open. Item 2 — `variant` in `drawKind` — has
   already cost one shipped defect and is the one that unlocks per-entity art variety.
2. **Build one new weapon.** A `SPECIALS` row, a `shots.ts` row, a pickup kind, a trigger. It is at
   the top of your own list, it is the largest single change to what a run feels like, and it does not
   touch a single audio file.
3. **Give two levels their own enemy or hazard.** This is the change the music has been asked to
   substitute for. `ENEMIES` is a table; `WaveEntry` already takes a kind.

## If and when you go back to the music — the smallest set that would move it

4. **Add tempo.** `beatSeconds` on `ThemeRow`, and a per-rung multiplier over it.
   [0159](../docs/decisions/0159-the-two-clocks-come-apart.md) and
   [0160](../docs/decisions/0160-the-music-free-runs.md) already paid for this; the field was simply
   never added. It is the ask that has been made four times. **Expect blast radius**: `LAYER_BARS`,
   `LOOP_SECONDS`, `PHRASE_SECONDS` and every `BEAT_SECONDS * n` note length derive from the
   constant — that is the work, and it is one change rather than thirty.
5. **Open the fast layers at `run` in `MUSIC_LADDER`.** One table. Named as the cheapest answer on
   2026-08-14 and still not done.
6. **Freeze the instruments at sixteen.** Not one of them has produced a verdict you agreed with in
   advance; four have shipped wrong; the newest cannot be pointed at the newest sound. The oracle is
   your ear and it always was — [0126](../docs/decisions/0126-the-dashboard-is-the-instrument.md) says
   so and the project kept building the other thing.
7. **Demote every guard over a subjective quantity to advisory**, starting with
   `tests/arrangement.test.ts`'s role rule. A guard that can veto a musical choice is a specification,
   and it is not one you wrote. This is the rule
   [0191](../docs/decisions/0191-a-place-sits-somewhere.md) is owed and does not state: **0019 catches
   a guard that never fires, 0027 catches one that fires on the wrong quantity, and neither catches
   one that fires correctly on a quantity nobody wants held.**

## Process, and it is cheap

8. **Bound `docs/state-of-play.md` and test the bound.** It is 2,621 lines against a constitution the
   project keeps at 140 by rule. Everything in it that is a finding belongs in a decision or a report
   it already links to. A guard would have caught this at 400 lines.
9. **Write the milestone record.** `CLAUDE.md` requires one when a milestone lands, *"not at the end"*,
   naming what went wrong alongside what worked. The music channel is the largest milestone this
   project has and there is no record for it. This report is not that record; it is a survey by a
   reader.

---

## ⚠️ The one sentence

**You are not stuck on the music. You are stuck because the music became the only place the project
was allowed to spend, and the thing it was being asked to fix — seven levels that feel the same — is
not a music problem.**
