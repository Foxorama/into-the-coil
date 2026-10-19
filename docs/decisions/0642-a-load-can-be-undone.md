# 0642 — A load can be undone

**Accepted 2026-10-19.** Amends [0641](0641-the-save-travels.md).

## The ask

> *"does it have a confirmation in case you load the wrong file or accidentally load a file before backing up/saving
> etc? qr code is great because people can share saves easily, but makes it easy to accidentally lose your progress
> if you scan the wrong one"*

0641 already asked before every load, with what the incoming save holds beside what is here. But a confirmation only
protects someone who reads it. A save shared as a code gets pressed through out of habit, and the two summary lines
look the same whichever save is bigger. Two answers were put back: keep the replaced save with an undo, and say first
what a load would lose. The answer was *"yeah go for it"*.

## The rule

**Every load puts the save it replaces aside first, and the Save tab's *Undo the last load* puts it back.**

- **The fourth key, `itc_undo`**, holds a whole backup in the envelope a file carries. So an undo goes through
  `restoreFrom` like any other load and is refused on the same terms. It goes one step back and no further: a second
  load puts aside the save the first one brought.
- **An undo is itself a load**, so it puts aside the save it replaces. Pressing it twice swaps back, which also lets
  a player switch between their own save and a friend's.
- **No undo, no load.** The copy is written and read back before anything else is touched. A store that will not
  keep the copy refuses the load, and nothing changes.
- ***Undo the last load* is up only when a save has been put aside.** On a phone it sits beside Back. Without it, Back
  runs across both columns.
- **The sheet says first what a load would lose**, when it loses anything: *"This has less than you have here: 3 fewer
  ships won, 1,840 fewer ✦."* It counts what was earned: ships won, Star Shards, things bought, the best run on the
  table, and the table's rows. A load that loses nothing gets no warning line. The sheet always says what is put
  aside.
- **A file or a code never carries the put-aside copy.** It is this device's own, and `PRIVACY.md` says so.

## What guards it

- `tests/backup.test.ts`, *a load undone*. The save a write replaces is put aside first, and read back whole by
  `restoreFrom`. A store with room for everything but the copy refuses the load and writes nothing. The loss lines
  name each thing fewer, and a load that loses nothing has none.
- `tests/save.browser.test.ts`, over the built page. Undo is down before any load. A load of fewer shards says so on
  its sheet. After it, Undo is up, and pressing it boots the page on the save the load replaced.
- `tests/privacy.test.ts` holds that `PRIVACY.md` lists `itc_undo`.

The probes in `scripts/probes/0642-a-load-can-be-undone.mjs` break each of these.

## Owed

- A play of the sheet's wording, with a friend's code.
