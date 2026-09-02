# 0210 — The title plays the music, and a fifth screen was invisible

**Accepted 2026-09-02.** The first screen added to the game since the shell was built, and the first
addition of a control to the title screen since
[0070](0070-a-style-is-a-setting-and-the-first-one.md).

> *"a menu option to the start screen for music that allows a user to select a level and play the
> music, or play all, which runs through the music from level to level and then restarts at level 1"*

## The rule

**`music` is a screen.** Its buttons are `THEME_KINDS` — the same *the buttons ARE the table* the
tiers and the style options already follow, so a place added to `src/content/themes.ts` appears here
without anybody remembering. *Play all* holds each place for one `PHRASE_SECONDS` and wraps.

**The room plays at the `run` rung, not the ladder.** It answers *what does this place sound like*,
not *how does it develop* — the dashboard ([0126](0126-the-dashboard-is-the-instrument.md)) is where
the arc lives, and duplicating it here would be a second instrument to keep in step.

**Which place is being auditioned is a local, not a slice.**
[0017](0017-the-state-is-slices.md) holds what a save must survive and a seeded test must compare; an
audition is gone the moment the listener leaves. `shownTheme` beside it is a local for the same
reason.

**The tiers are the leading actions and the music room follows them.** `src/app/mount.ts` narrows the
index it is handed against `DIFFICULTY_KINDS`, so anything past the end of that table is not a tier.
The old line ended `?? DIFFICULTY_KINDS[0]`, which would have started a run on the easiest tier.

## ⚠️ The screen mounted, reported itself shown, and drew nothing

The stylesheet named its four screens explicitly — `.itc-title, .itc-gameover, .itc-cleared,
.itc-victory` — **in eight separate selector lists**. A fifth screen routed correctly, mounted
correctly, set its own `-shown` class, and was **completely invisible**, because `display: none` is
the default and the rule that lifts it did not name it.

**Nothing failed.** The console was clean, the DOM said the screen was shown, and the page was blank.
The selector lists are now derived from the table, and `tests/chrome.test.ts` holds that every
panelled screen has a rule making it visible.

## ⚠️ And the derivation broke two things on its way in, both caught by guards

1. **`each()` interpolated the raw screen name**, emitting `.itc-gameOver-shown` against a DOM
   carrying `itc-gameover-shown` — one capital, on the one screen whose name is camelCase, matching
   nothing. The prefix rule caught it on the first run, against the very refactor meant to make
   screens safer to add.
2. **Making the stylesheet a template silently weakened the guards that read it.** They regexed
   `const STYLE = \`…\`` out of the source, so a `${each()}` hole is what a source scan now sees —
   **still green, over a stylesheet it could no longer parse.** `STYLE` is exported and the guards
   read the evaluated string.

⚠️ **A backtick in a CSS comment closed the template and the file stopped parsing** — which is
[0200](0200-the-tool-that-edits-must-not-lose-what-it-edits.md)'s hazard met inside a file rather
than in a shell. And file paths in stylesheet comments must carry no extension, because the prefix
scanner reads every dotted token as a class.

## The fourth control cost the title screen its fit

`tests/layout.browser.test.ts` refused the title on **four of six devices**. Three tiers fitted a
480×320 landscape phone with the `cq`-clamped type this file already uses; four did not, and that
guard's own words are *scrolling is the net and not the design*.

**The fix is this file's first container query.** [0049](0049-the-chrome-is-authored-against-the-short-axis.md)
put `container-type: size` on the overlay precisely so the chrome is authored against the box the
player is looking at — on an embedded page those are different numbers, and a media query would
answer for the wrong one. Below 460px tall both screens wrap into rows and tighten; a desktop is
untouched.

⚠️ **EVERY NUMBER IN IT WAS MEASURED, NOT CHOSEN.** The guard reported 8px, then 3px, then 15px of
scroll, and each round the space came out of whatever had most give. **Twice the fix did nothing at
all because the override sat BEFORE the base rule** — equal specificity, later wins — and the tell
was coordinates that did not move between runs. The block now sits at the end of the sheet.

## What is owed

**A listen.** Nothing here can be judged by a test: no assertion can hear. The room exists so the
music can be heard without playing to it, and whether the places are distinct is an ear's call.

⚠️ **And the comparison it was asked for is against numbers that have moved.**
[0209](0209-the-rig-hears-in-stereo.md) found the rig rendering a stereo mix folded to mono, so the
dashboard passes tuned before today rest on ratios that were measuring a fold.
