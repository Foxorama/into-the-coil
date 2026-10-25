# 0674 — The intro is a setting

**Accepted 2026-10-25.** Item 7 of [`the-menus-planned`](../../reports/the-menus-planned-2026-10-24.md). It amends
[0635](0635-every-flight-plays-the-intro.md), which made every flight play the intro and owed *"whether an intro
every run is welcome or wants a setting"*. Answered: a setting.

## The ask

> *Travel gets an Intro band: Every flight / First flight.*

## The rule

| | was | is |
|---|---|---|
| **Settings** | *Travel*, then *Hand* | *Travel*, then **Intro** — *Every flight* or *First flight* — then *Hand*. Kept with the settings ([0510](0510-the-settings-are-kept.md)) |
| **Every flight** (the default) | 0635: each *Fly* plays the intro | unchanged |
| **First flight** | — | 0513's rule before 0635 reversed it: the first *Fly* of a visit plays the intro, and later ones go straight into the run. A reload is a new visit |
| **The title's *Fly*** | no line under it | *Straight in* under it when the next flight skips the intro: on *First flight* after the visit's first, and for a pilot the story is not told round ([0666](0666-venoma-flies-the-viper.md)). Nothing when it plays |

The table is `src/content/intro.ts`. The shell's `fly` (`src/app/mount.ts`) is the one place it is read. The flag is
the page's, as 0513's `flownThisVisit` was, and a flight whose pilot has no story does not spend it.

## What the plan said about the save, checked

The plan read [0664](0664-the-controls-are-bound.md) as making the settings *"read back whole or not at all"*.
Read in `src/save/settings.ts`, that is true of the bindings alone (`keysFrom`, `padFrom`). The document is read
per field (`settingsFrom`, 0512's terms), so a new field is not a new version, as with the rumble (0613) and the
bindings (0664). `SETTINGS_VERSION` stays 1.

## What it cost and the guards it moved

- **`tests/run-ends.browser.test.ts`**, *0674*: First flight chosen on the band; *Fly* says nothing and the intro
  plays; a quit and *Fly* says *Straight in* and the run's readout comes up; a reload's first flight plays the
  intro again. 0635's own test, every flight, is unchanged and still green.
- **`tests/settings-kept.test.ts`**, *0674*: the field read back, a document from before it read as *Every
  flight*, and the version unmoved.
- **`tests/settings.test.ts`**: Settings' bands are six and the intro is one of them, walked off its table, on
  exactly one screen; and the frame cannot import the table (0024).
- **Settings is three rows down two columns on every device.** A sixth band, laid out as before, made a third
  column on touch, so 667×375 scrolled by 34 px. On a desktop without touch the single column ran *Music room*
  and *Back* past 720 rows. `tests/layout.browser.test.ts` caught both. Now column one is the sound, the crossing
  and the intro, and column two is the hand, the steering and the rumble. The walk still goes down one column and
  on to the next. On a phone the intro is a one-line strip, as the rumble's was, so the third row costs what 0613's
  spanning strip did. *Every flight* is kept on one line.
- **`PRIVACY.md`** names the field.
- **The plan named `tests/intro.browser.test.ts` for 0635's case.** It is in `tests/run-ends.browser.test.ts`, so
  this one is beside it.

Probed in `scripts/probes/0674-the-intro-is-a-setting.mjs`: the flight that ignores the band, the save that
forgets it, Settings two to a column, and *Fly* that does not say which.

**Not held by any guard:** the band's words and the line under *Fly*, which are the voice rule's.

**Photographed** at 1280×720 and 844×390, the layout guard's six, and 1920×1080 and 2560×1080: Settings. The
title's *Straight in* is seen only after a flight, which the photographs do not fly; the browser test reads it.

## What is owed

- A play: whether *Straight in* under *Fly* is read, and whether *First flight* is the one a returning player
  picks.

## Rollback

⚠️ **One field on an irreversible surface** ([0001](0001-revertability-not-risk-rating.md)). `itc_settings` gains
`intro` on version 1. Under this build, a document written before it has no field and reads as *Every flight*,
the rule it was flying under. A build before this one reads the fields it knows one by one and never sees this
one: it plays every flight's intro, keeps every other setting, and the next time a setting moves it writes the
document without the field, so the choice of *First flight* is lost and nothing else is. No version bump and no
other key.
