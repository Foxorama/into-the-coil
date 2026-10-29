# 0696 — The candidate is cut

**Accepted 2026-10-29.** From [`the-release-review`](../../reports/the-release-review-2026-10-29.md),
which lands [`the-road-to-v1`](../../reports/the-road-to-v1-2026-10-19.md)'s step 5: *"a `v0.9.0`
candidate played inside the itch embed while the page is still restricted."* The player's answer to
the road report's question 6 is the rule here: *"the v0.9.0 to v1.0 bump should essentially be no
changes."*

## The ask

> *"Build the v0.9.0 candidate PR: pin butler, add the meta description and og tags, establish the
> sound guard per 0044, bump to 0.9.0, and land the review report with it. Do not tag."*

## The rule

**`v0.9.0` is the release candidate, and `v1.0.0` is the same tree with only the version moved.** So
everything the candidate needs that is not a play is in this one change, and nothing else is:

| | was | is |
|---|---|---|
| **the version** | `0.6.0`, tagged 2026-10-12; `main` 58 commits and 88 decisions past it, none of which a player had | `0.9.0` in `package.json`, which is the one place it is written ([0002](0002-brand-identity-contract.md)). The tag is the player's, and deploys to both destinations ([`release.yml`](../../.github/workflows/release.yml)) |
| **butler** | installed from `…/LATEST/…` on every tag, so a butler release on tag day changed the tool mid-release (road report 4.5) | pinned at `15.32.0`, which was LATEST on the day, with the line that read it beside the URL. Moving it is one edit |
| **a shared link** | `index.html` had no description and no `og:` tag, so a link to the game unfurled as a bare URL (road report 4.6) | a description, `og:title`, `og:description`, `og:url`, `og:image` and a `twitter:card`. The description is the itch page's short line. **The image is the home-screen icon**, because the files beside the page are a closed list of what cannot be inlined ([0008](0008-the-shell-sidecars.md)) and a card image is not on it; a 1200×630 card is a sidecar decision of its own if one is wanted |
| **the sound suite** | two of seven red on the author's machine and green in CI, since at least 0682 | see below |

## The sound suite: what was red, measured

**Two of `tests/sound.browser.test.ts`'s seven were red on the author's twelve-core machine and green
on CI**, the 10-26 handover having recorded the first reading at 0682. A rerun is not evidence
([0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)), so both sequences were run
with every buffer and every source recorded with its duration and its moment on the page's clock.

| the guard | read | modelled | what the extra was |
|---|---|---|---|
| *THE WHOLE CHAIN* | 192 buffers | 185 | **the title piece's seven parts.** *Fly* plays the intro ([0635](0635-every-flight-plays-the-intro.md), [0674](0674-the-intro-is-a-setting.md)); the intro is not part of a run, so it wants the title piece once the prewarm is done ([0597](0597-the-title-track-plays-in-the-menu.md)). Here the seven bake 220 ms after the press, inside the 250 ms poll that first saw 185; on a two-core runner they land after the read, which saw exactly 185 |
| *turning it back on says so* | 41 sources, then 42 | 35 (the chime, 27 loops, 7 title) | **two things.** The *On* press is sometimes heard twice — the chime, and the press cue [0659](0659-a-menu-press-is-heard.md) added, which lands in the speaker before or after the setting unmutes it: two cues on one trace, one on the next. And a loop waiting for a number the press could not reach waited for the title's next pass instead, and read that pass's seven on top. Pressed a few milliseconds after Settings opens, whether the prewarm has finished is also a fact about the machine |

**The rule, which is the file's own:** a count two orders can produce is a race, not a guard, and
what closes a window is a count, never a clock. Both tests now wait for the title's buffers — the
prewarm's own evidence, since the title bakes only after it — before the read or the press. The
second holds what is exact to a number (the loops and the title, twenty-seven and seven, every time)
and the cues apart, to *at least the chime*, which both orders satisfy. The *Off* test between them
already waited for the title and already subtracted the cues. Nothing in the game moved; the guard's
quantity did. The two tests carry the measurement beside the number.

**Seen and left:** the press cue on the *On* chip is heard on some presses and swallowed on others,
by the order of the press and the unmute inside one click. The chime is that press's designed answer
and always sounds, so a player hears feedback either way; whether the press cue should sound there at
all is 0659's question, not this change's.

## A third guard, found by this PR's own CI

[0596](0596-the-yellow-submarine-hangs.md)'s browser probe — the submarine's width zeroed — went red on
the first run of this PR and *STILL GREEN* on the second, with nothing changed near it. Measured in the
page: the dangle on Cosmo's tile swings, and the guard in `tests/cosmo.browser.test.ts` read each part's
`getBoundingClientRect().width`, which is the box of the *rotated* element. A zero-width box 1.2em tall,
turned by the swing, is over four pixels wide at some phases of the animation and under at others, so
the verdict was the animation's phase at the read. It reads `offsetWidth` now — the width the layout
gave the part, which the swing does not touch. The same shape as a photograph on a round-second grid
sampling one phase of a periodic motion.

## A fourth, seen and not established

[0541](0541-the-looks-are-on-the-pad.md)'s flame probe — the flame compared away, so the pad burns the
one it had — was red on this PR's first two runs and, on the third, in a different shard with different
neighbours, its guard passed under the break in the filtered run and failed in the whole-suite run that
followed (the harness calls that *WRONG TEST*). So under one load the pad read as changing with no fit.
Measured here: `samePhase` with an act that does nothing, eight takes at eight phases, reads 0.00000 of
the band for noise, change and after, every time — the stand is still, and the hop a fit makes is 26
steps against a bob of 105. **What would establish it is the proof's own load**, which `tests/stand.ts`
has met four times before (its comments carry each), and the instrument is the filtered run printing the
band's three numbers when the guard passes under a break. Not fixed here, because a fix without the
mechanism is a guess, and the candidate does not wait on it.

## What guards it

- **The unfurl titles**: `tests/brand.test.ts` holds `og:title` and `twitter:title` to `GAME_TITLE` the
  way it holds `<title>` — two more spellings HTML cannot import — and that a description and an
  absolute `og:image` exist. `scripts/probes/0696-the-candidate-is-cut.mjs` respells `og:title` and
  makes the image relative, and the guard is seen to go red on each
  ([0005](0005-a-guard-must-be-seen-to-fail.md)).
- **The two sound counts**: the two tests themselves, with the measurement beside each number. Their
  existing probes (0119, 0659) still redden them, and under 0597's — a title that never bakes — each
  now runs its wait out and fails by its assertion rather than the file's limit
  ([0019](0019-a-probe-must-be-seen-to-apply.md)).
- **The version**: `tests/brand.test.ts` already holds that the shipped page carries `package.json`'s
  version and not a placeholder.
- **butler**: nothing. A pinned URL that stops resolving fails the release job, which is the only run
  that reads it, and that failure names the line.

## Rollback

The version is a shipped surface ([0001](0001-revertability-not-risk-rating.md)): a build between
tags carries the new string, and the service worker's cache name is stamped with it (`vite.config.ts`),
so every player's precached shell is replaced once on the first visit after the tag. That is the
designed path for every release, not a change to it. To take it back: move `package.json` to `0.6.0`
and re-tag nothing — the tag is the only thing that deploys, and this change makes none.
