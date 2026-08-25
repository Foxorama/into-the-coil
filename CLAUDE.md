# Into the Coil — constitution

Rules only. **Reasoning lives in `docs/decisions/`, never here.** That delegation is the whole
structural guard: the predecessor's constitution reached 2,140 lines and was pruned three times in
six weeks, every prune reversed — not because nobody wanted it short, but because the reasoning had
nowhere else to go. Every rule below names the decision behind it. The reverse does not hold: a
decision needs no rule.

## Quality

- **The bar is set before the work, not inspected after it.** Scope, schedule and the feature list
  are negotiable; the bar is not, and there is no tier below it for work to land in. **Before
  building**, pressure-test the idea — say so plainly when it is sound, push back with the wrong
  premise named when it is not, and an idea's author is not evidence about it. **While building**,
  implement properly or stop: *"this cannot be done cleanly because X, here is what I would do
  instead"* is a result, and longer or not-doable beats a shortcut. **After a miss**, repair the
  class — the fix names the guard, the rule, or the reason neither is worth it. **Throughout**, an
  assumption is discharged or owed and never merely labelled: a verified claim names what checked it,
  an unverified one names what would — and one that makes the work wrong if it is wrong gets checked
  or the work stops. The predecessor is the floor, not the target.
  — [0028](docs/decisions/0028-quality-is-the-constraint.md)

## Process

- **A PR that touches an irreversible surface carries a rollback note.** Storage keys (`itc_*`),
  the save schema, the SW cache prefix, the origin, anything already shipped. Nothing else does,
  and quality does not vary with the answer.
  — [0001](docs/decisions/0001-revertability-not-risk-rating.md)
- **An admin-UI setting is not done until it has been read back.** A ✅ in a document is a claim;
  `gh api repos/Foxorama/into-the-coil` is evidence.
  — [0004](docs/decisions/0004-admin-settings-must-be-read-back.md)
- **A guard that has only ever been green is not known to work.** Break the thing on purpose and
  watch the test go red before trusting it — with a probe in `scripts/probes/`, never by hand.
  `npm run prove` refuses to run the suite until it has read the file back and seen it change.
  — [0005](docs/decisions/0005-a-guard-must-be-seen-to-fail.md),
  [0019](docs/decisions/0019-a-probe-must-be-seen-to-apply.md)
- **A guard holds an invariant, a budget says what it costs, and a taste is advisory.** Before
  writing one, answer: *name a change to the content that would redden this and be CORRECT.* No such
  change — invariant, fails hard. One that costs a measured resource — a budget: fails hard, and the
  message names who owns the number. One that costs only an opinion — a taste: it goes in
  `tests/authored.ts`, is printed every run, and can never fail a suite. **A red guard is never
  answered by changing the work to suit it** — fix the defect, change the guard and say why, or
  delete it. **Demoting a guard takes one edit and a reason; promoting one takes a decision**, because
  the opposite asymmetry is why they pile up.
  — [0192](docs/decisions/0192-a-guard-holds-an-invariant.md)
- **An intermittent guard has found something, and "flaky" is not what it found.** A rerun is not
  evidence. Establish which it is — a real intermittency in the code, or a wrong quantity in the
  guard — then delete it, fix it, or leave it red. The one this rule is named for was reading wall
  clock where it meant frames, and only failed under the load of `npm run prove` itself.
  — [0044](docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)
- **Where the work has got to lives in `docs/state-of-play.md`** — what is settled, what is next, and
  why in that order. Read it before proposing work; rewrite it when the answer changes. It holds
  **pointers and intentions, never findings**: a status document is a summary generator, and the only
  version that survives is the one that cannot state a conclusion. Every relative link in the
  repository resolves, because a citation rots as silently as a summary drifts.
  — [0038](docs/decisions/0038-the-handover-is-a-file.md)
- **The tracked record is the record.** A report is a committed file in `reports/`, because chat
  evaporates between sessions. A milestone **duplicates and never originates** — a lesson living only
  in `docs/milestones/` has not landed. A document restating another **cites the line rather than
  summarising it**; a summary is a second copy, and one drifted here inside a single day.
  — [0029](docs/decisions/0029-the-tracked-record-is-the-record.md)
- **A branch starts at `main`, and the next one waits.** A PR's base is `main`; never another
  branch. Squash plus `delete_branch_on_merge` orphan a stacked branch's history and then close its
  PR, so stacking is not *harder* after the base lands — it is broken. Refused by CI before
  `npm ci`. Not a limit on PR size: the largest PR of the session that produced this rule merged
  first try, and the smallest cost the most hours.
  — [0033](docs/decisions/0033-a-branch-starts-at-main.md)

## Product

- **What the game is lives in `docs/game.md`.** Read it before proposing game work. It is the product
  definition — tracked, unlike the working material, because a clone needs to know what this is.
  — [0020](docs/decisions/0020-the-fiction-transfers-the-code-does-not.md)
- **No user-facing name or version literal outside `src/brand.ts`.** Surfaces that cannot import it
  — `index.html`, the boot watchdog, the service worker — are held by a test, not a constant.
  — [0002](docs/decisions/0002-brand-identity-contract.md)
- **The build emits one self-contained page.** An external module script cannot load off a file
  path. Beside it ship only the files that cannot be inlined — the manifest, the service worker,
  `_headers` — and that list is closed by a test.
  — [0003](docs/decisions/0003-single-file-build.md),
  [0008](docs/decisions/0008-the-shell-sidecars.md)

## Code

- **`src/` is a closed set of layers and the import arrow points one way.** `brand` → `sim` →
  `content` → `state` → {`save`, `render`} → `app`. Below the shell, time and randomness are
  arguments; only `save/` may touch storage; only `render/` and `app/` may touch the DOM. A new
  directory under `src/` is a decision, and fails a test until it is written as one.
  — [0015](docs/decisions/0015-the-layer-ladder.md)
- **A hub enumerates kinds, never instances.** Content is rows in a `Record<Kind, Row>` over a
  closed union, in `src/content/`; behaviour rides the row; a registry is an explicit list of
  imports. The table is the guard, so the five ways of defeating it — auto-discovery,
  `Record<string, …>`, `any`, `@ts-ignore`, a `switch` with no `never` arm — are held by a test.
  — [0016](docs/decisions/0016-a-hub-enumerates-kinds.md)
- **The state is slices, and a slice does not import a sibling.** The root composes
  `Record<SliceName, …>` and routes; it holds no `case` arms. State is plain data — no `Map`, `Set`
  or `Symbol` where a save serialises or a seeded test compares.
  — [0017](docs/decisions/0017-the-state-is-slices.md)

- **Randomness is a seeded `Rng` threaded as an argument, and every concern takes its own named
  stream.** One shared generator couples every draw to every draw before it, so a cosmetic roll added
  anywhere rebuilds every level. The save stores resolved state — the drafted pool, the loadout, the
  level reached — never a seed to re-derive them from.
  — [0021](docs/decisions/0021-one-stream-per-concern.md)

- **The long axis of the screen is the scroll axis, and nothing is authored in screen space.** One
  level, in `along` × `across` world units; `across` is a fixed 100 and is the difficulty axis, so
  only lookahead varies by device and it is clamped at both ends. Spawns are placed against the
  widest view any device can have, never the current one. The camera does not follow the player.
  **Every speed is in the camera's frame**, which is the one the ship already flies in — a shot aimed
  in world coordinates arrives where the ship *was*, and does it only off the lane, so it hides.
  — [0023](docs/decisions/0023-the-long-axis-is-the-scroll-axis.md),
  [0034](docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)

- **The sim steps at a fixed 60Hz and the renderer interpolates; art is baked to bitmaps and blitted;
  nothing allocates in the frame loop.** A sim stepped by wall-clock delta teleports bullets through
  the player on a dropped frame. Per-frame entity pools are mutable and are **not** reducer state —
  0017 still holds over screens, run and settings. **Desktop is what every budget, ceiling and
  capacity is argued against; the phone is a port that has not started and may not be cited as a
  reason to make anything smaller.** The guard counts draw calls and allocations rather than
  wall-clock, and that is *not* a phone rule — CI is not the target machine either. The frame loop is
  a **closed list of hot files** where allocating syntax fails a test; a line that genuinely runs once
  carries `// @setup: <why>` above it. This is the one code convention landed so far.
  — [0022](docs/decisions/0022-frame-rate-is-a-feature.md),
  [0025](docs/decisions/0025-the-frame-budget-is-counted-not-timed.md),
  [0153](docs/decisions/0153-desktop-is-the-target.md)

- **When a report survives a fix that measured green, go and measure the picture.** Everything this
  repository counts is a *model* quantity — draw calls, allocations, steps, world units — and the
  predecessor spent eight passes improving a model that was already right while the thing the player
  watched did not move. An eyes-on rig renders at the camera the game actually ships; when a fix
  removes a bug, ask what that bug was also doing; a play-test verdict is data about the picture, not
  a bug report about the model. The frame-tracing instrument is owed **before the first tuning pass
  on anything the player watches move**, not after the seventh report. **At least one assertion is
  written in units the player experiences** — pixels, seconds, a fraction of the lane — because a
  guard measuring a quantity defined in terms of the constant it guards proves only that the code
  agrees with itself, and a probe cannot see that: a break and its guard share an author and a
  vocabulary. 0019 catches a guard that does not fire; this catches one that fires on the wrong
  quantity. Two of this project's own bugs, not the predecessor's. **An event the model resolves and
  the picture never mentions gets reported as a different bug, every time** — three running, each one
  filed as a collision fault that did not exist.
  — [0027](docs/decisions/0027-measure-the-picture-not-the-model.md),
  [0019](docs/decisions/0019-a-probe-must-be-seen-to-apply.md),
  [0036](docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md)

- **There is one game and it is the loud one; accessibility is knobs over that default.** An item
  joins the floor only if it is a property of the architecture or a knob over it — one that would
  constrain what a level may contain is refused, and that refusal is why the authored assist path is
  gone. No assist may ever make the game harder, and no comfort setting may touch the sim.
  — [0024](docs/decisions/0024-the-accessibility-floor-is-settings.md)

⚠️ **No counting guard.** Line ceilings, `case` ceilings and slice ceilings were each proposed and
each measured against the predecessor before being set; every one flagged its healthy file as loudly
as its sick one. What separates them is the shape of the dependencies, which is what the three rules
above hold.

## The conventions still deliberately absent

File naming, function size and comment style. They wait for code to be written about, on the same
reasoning that kept the three above open until now.

## The predecessor

`C:\Golf-Stars` (The Far Carry). **Its patterns and its fiction transfer; its code does not** — it is
a golf game, and its simulation layer is fused to that domain at the type level. The fiction crosses
as raw material and not as scripture: rename it, reshape it, improve it. Read named files for a named
reason. Never browse it for inspiration.
  — [0020](docs/decisions/0020-the-fiction-transfers-the-code-does-not.md)

## Working material, not documentation

`docs/scaffold-plan.md` is gitignored — the scaffold's commit sequencing, on this machine only.
Read it before proposing scaffold work. It is not maintained past RELEASE: as each decision in it
moves to `docs/decisions/`, **delete the section rather than summarise it.**

`docs/machine.md` is gitignored — **read it first on a fresh session.** node is not on PATH here, and
it maps every setting that lives outside git and how to read each one back.

`docs/milestones/` is gitignored — what each milestone cost and what would make the next project
faster. **A record is written when a milestone lands, not at the end**, and it names what went wrong
alongside what worked; a retrospective that only lists wins transfers nothing. It is a select list to
read at the end of the project, **never a reference for the current one**: it duplicates the tracked
record and originates nothing, which is what makes ignoring it cost nothing —
[0029](docs/decisions/0029-the-tracked-record-is-the-record.md). Start from
`docs/milestones/NEXT-TIME.md`.
