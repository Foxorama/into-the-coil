# Into the Coil — constitution

Rules only. **Reasoning lives in `docs/decisions/`, never here.** That delegation is the whole
structural guard: the predecessor's constitution reached 2,140 lines and was pruned three times in
six weeks, every prune reversed — not because nobody wanted it short, but because the reasoning had
nowhere else to go. Every rule below names the decision behind it. The reverse does not hold: a
decision needs no rule.

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
alongside what worked; a retrospective that only lists wins transfers nothing. Start from
`docs/milestones/NEXT-TIME.md`.
