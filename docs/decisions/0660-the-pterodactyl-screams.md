# 0660 — The pterodactyl screams

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 12. Amends
[0625](0625-the-lasers-are-heard.md): every beam charged and zapped in one voice.

## The ask

> *"Pterodactyl lazer noise."*

## The rule

**A boss may name its beam's sound on its own row; the quetzal does.** Two fields, each with 0625's as the default in
shared code:

- **The charge is the phase's `cue`**, which already existed for a phase's attack: the quetzal's three beam phases
  name `pteroCharge` — a reedy saw shrieking up two octaves through an opening filter, wobbling as a throat does,
  over the hum every laser's charge has.
- **The zap is `zap?: CueKind` on `BossRow`**, read where the line ignites (`pinBeams` in `src/app/frame.ts`) as
  `bossRow.zap ?? 'laserZap'`. The quetzal names `pteroZap` — a crack, then a driven saw screaming down from A6 into
  the laser's dive and the burn's hiss.

The hydra and the medusa name neither and keep 0625's machine. That is the 0282 shape: a default, not a constant, so
a beam can sound like what fires it.

## What guards it

`tests/quetzal.test.ts`: 0625's ask, in seconds, runs twice — on the quetzal's row as authored, where its own pair is
heard as the line appears and as it fires, and on the same row with its fields taken off, where 0625's pair is; and
every laser boss is heard charging and zapping in the voice its row names, the quetzal in its own and the other two
in the machine's. The probes in `scripts/probes/0660-the-pterodactyl-screams.mjs` make the frame ignore the row, and
take the row's `zap` off. 0625's, 0250's and 0388's probes are re-anchored.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
