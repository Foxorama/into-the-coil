# Reports

One-off findings, investigations and post-mortems. `reports/<topic>-YYYY-MM-DD.md`, committed.

**Why files and not chat.** Chat evaporates between sessions. A finding that exists only in a
conversation has not been recorded, however carefully it was written.
— [0029](../docs/decisions/0029-the-tracked-record-is-the-record.md)

**Admission.** A report earns its place by being a thing worth finding again — a measurement, an
investigation with a result, a post-mortem. Not a status update, and not a summary of a session that
went normally.

**Retirement: never.** A report is dated and left alone. It records what was true when it was
written, and a reader gets the date to judge it by.

## How this differs from its neighbours

| | holds | maintained after writing |
|---|---|---|
| `CLAUDE.md` | the rules that constrain new work | yes — living, not append-only |
| `docs/decisions/` | why a rule exists, and what was rejected | no — superseded by a new file, never edited |
| `docs/game.md` | what the game is | yes |
| **`reports/`** | **a finding, dated** | **no** |
| `docs/milestones/` | what a milestone cost — gitignored, and **duplicates only** | no |

⚠️ **A report is not a place to originate a rule.** If a finding changes how work is done, the rule
goes to `CLAUDE.md` and the reasoning to a decision; the report keeps the evidence.
