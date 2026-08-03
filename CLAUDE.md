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
  watch the test go red before trusting it.
  — [0005](docs/decisions/0005-a-guard-must-be-seen-to-fail.md)

## Product

- **No user-facing name or version literal outside `src/brand.ts`.** Surfaces that cannot import it
  — `index.html`, the boot watchdog, the service worker — are held by a test, not a constant.
  — [0002](docs/decisions/0002-brand-identity-contract.md)
- **The build emits one self-contained page.** An external module script cannot load off a file
  path. Beside it ship only the files that cannot be inlined — the manifest, the service worker,
  `_headers` — and that list is closed by a test.
  — [0003](docs/decisions/0003-single-file-build.md),
  [0008](docs/decisions/0008-the-shell-sidecars.md)

## Code conventions are deliberately absent

They wait on a design decision that has not landed; writing them first means writing them twice.
That deferral covers module layout, registries and state shape — **not** process, which is why the
rules above exist now.

## The predecessor

`C:\Golf-Stars` (The Far Carry). **Its patterns transfer; its content does not** — it is a golf
game, and its simulation layer is fused to that domain at the type level. Read named files for a
named reason. Never browse it for inspiration.

## Working material, not documentation

`docs/scaffold-plan.md` is gitignored — the scaffold's commit sequencing, on this machine only.
Read it before proposing scaffold work. It is not maintained past RELEASE: as each decision in it
moves to `docs/decisions/`, **delete the section rather than summarise it.**

`docs/milestones/` is gitignored — what each milestone cost and what would make the next project
faster. **A record is written when a milestone lands, not at the end**, and it names what went wrong
alongside what worked; a retrospective that only lists wins transfers nothing. Start from
`docs/milestones/NEXT-TIME.md`.
