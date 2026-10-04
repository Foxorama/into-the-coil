# 0510 — The settings are kept

**Accepted 2026-10-04.** Item 2 of [`the-menus-reviewed`](../../reports/the-menus-reviewed-2026-10-02.md):
*"a settings screen that forgets is not a settings screen."* The second `itc_*` key, on
[0429](0429-the-table-is-kept.md)'s terms.

## The rule

**The look, the sound, the crossing and the difficulty band are kept in `localStorage` under
`itc_settings`, and the page opens on them. The pilot is not kept.**

| | |
|---|---|
| **what is kept** | `style`, `sound`, `travel`, `difficulty`: every setting but the pilot |
| **shape** | `{ v: 1, style, sound, travel, difficulty }`, versioned from the first write ([`docs/game.md`](../game.md)'s storage rule) |
| **read** | once, into the initial state before anything is applied, so the boot's `apply*` meets a kept value exactly as it meets a default. Not dispatched: a dispatch is a change the player made, and the sound's chime rides one |
| **written** | on any dispatch that changes what is kept, compared as written, so a pilot pick writes nothing |
| **a value it cannot trust** | that setting at its default, and its neighbours still read. A document of another version, or one that does not parse, is the defaults. Never an error on the title |
| **a store that refuses** | private windows, blocked site data, a full quota: the setting holds for the visit and nothing else changes |

## Why per field, and the table is not

A table row is one run and half of one is not a run, so 0429 drops a row it cannot read whole. A
setting is independent of the ones beside it: a look the game has since dropped is no reason to forget
that the sound was off. So `settingsFrom` lays each field it can trust over the defaults and keeps
the rest.

## Why not the pilot

The settings slice records it was asked for as *"pick each visit"*, and the review's queue repeats it.
The key is written **without** it rather than with it and ignored, because a field nobody reads is a
field the next reader assumes somebody does. `KeptSettings` is an `Omit` of the slice, so a setting
added later fails to build in `src/save/settings.ts` until someone decides whether it is kept.

## What it found: the music was born on

`src/app/sound.ts` builds the music on the first gesture, and it starts with sound on. `applySound`
runs at boot against a `null` music, so **a sound kept *Off* would have meant silent cues over music
that played**. Before this nobody could reach that state: Settings was only reachable after the press
that built the music. `src/app/mount.ts` now passes every unlock through `unlockAudio`, which tells
music built on that unlock the sound setting, once. Only once, because `MusicOut.setOn` restarts the
loops and cancels a duck. **Unguarded**: no browser test can hear the music. What would check it is a
browser test reading the music bus's gain after a press with the key holding *Off*. Nothing exposes
that gain to a test today.

## What guards it

- `tests/settings-kept.test.ts`: it reads back as it was left, the pilot is never kept, one bad field
  costs only itself, a document it cannot trust is the defaults, and a refused write does not throw.
  Probed in `scripts/probes/0510-the-settings-are-kept.mjs`.
- `tests/settings-kept.browser.test.ts`: a page booted with the key filled opens on those bands, a
  band pressed writes the key, and a reload opens on what was pressed.
- `tests/privacy.test.ts` holds `PRIVACY.md`'s new row against the source, both ways.

## Rollback

**Irreversible surface: a new `itc_*` key.** Reverting the code leaves `itc_settings` in players'
storage, unread and harmless; nothing else reads it. Re-landing later must read version 1 or bump
`SETTINGS_VERSION`, and a bump costs every player their kept settings once.
