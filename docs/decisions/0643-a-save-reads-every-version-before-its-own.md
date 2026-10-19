# 0643 — A save reads every version before its own

**Accepted 2026-10-19**, on the recommendation in
[`the-road-to-v1`](../../reports/the-road-to-v1-2026-10-19.md) §4.1 and
[`the-v1-list`](../../reports/the-v1-list-2026-10-15.md) Part 4.1, which asked for this or a written
*a bump resets* before the 1.0 tag. **The player's to veto**: the other answer is one paragraph, and
this one costs nothing until a version moves.

## What was wrong

Each kept key has a version. All three readers — `hangarFrom`, `settingsFrom` and `parseScores` —
read **nothing** from a document at any version but their own, and the next write lays the empty
state over the key. So the first time any of the three shapes moved, every player's key would have
been emptied on their next visit: every ship won, every shard and every ware in the hangar, and the
whole table. `docs/game.md` said *"versioned from v1 with a migration chain"*. There was no chain.

Nothing has been lost. Every key is still at version 1, because a new field goes onto version 1 and is
read per field (0512, 0522, 0592, 0608). That convention is why no bump has happened yet. It is not a
reason none ever will.

## The rule

**A kept document older than the build is lifted, one version at a time, never dropped.**

- `src/save/store.ts` has `lifted(data, current, lifts)`. A document at version `v` runs `lifts[v - 1]`,
  then the next lift, and so on up to `current`. Each lift is a plain function from one shape to the
  next.
- Each key has its list beside its version: `HANGAR_LIFTS`, `SETTINGS_LIFTS` and `SCORES_LIFTS`. **All
  three are empty today**, because nothing has ever been written at any version but 1.
- **A version is bumped together with the lift from the version before it.** A key at version `n` has
  exactly `n − 1` lifts.
- **A newer document still reads as nothing**, as before. That is the rollback case: a build after a
  bump, then a rollback to this one. What it costs is below, and this decision does not answer it.
- **A restore refuses only damage and the future.** `refusal` in `src/save/backup.ts` accepts any whole
  version from 1 up to the build's own, since the reader lifts it. A file made by an older build is
  read rather than called damaged.

## What guards it

`tests/lifts.test.ts`:

- **Every key has a lift from every version it has ever written.** A bump without its lift fails here
  before it ships.
- **An older document is stepped up through every lift, in order**, and keeps what no lift touched.
- **Nothing is placed that cannot be:** no version, a fractional one, a string, zero, a newer one, or a
  chain with a missing lift.

The probes in `scripts/probes/0643-a-save-reads-every-version-before-its-own.mjs` break the first two.

Answering 0192's question — *name a change to the content that would redden this and be correct*: a
bump meant to reset the key. This decision is that such a bump is not correct, so the guard holds an
invariant. A deliberate reset would come back here first and reverse it.

## Not answered here

- **A newer document on an older build.** After a bump and a rollback, the older build reads the key as
  empty and its next write replaces it. The answer is to refuse to write over a document newer than the
  build. That changes every write path and the shell, and nothing needs it until the first bump. It
  belongs with that bump, and the bump's PR carries a rollback note anyway (0001).
- **What a lift is allowed to do.** It is a pure function from one shape to the next. Whether a lift may
  drop data, as opposed to moving it, is the bump's own question.

## Rollback

⚠️ **Touches how the save schema is read** (0001), and **changes nothing stored**. No key, no field and
no version moves. Every document in a player's browser today is read byte for byte as before, because
`lifted` at version 1 with no lifts returns the same document it is given. Reverting this PR restores
the old reader exactly.
