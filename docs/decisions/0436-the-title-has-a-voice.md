# 0436 — The title has a voice

**Accepted 2026-10-01.** Items 5–9 of [the screens review](../../reports/the-screens-reviewed-2026-10-01.md),
as far as each could go without a decision this one is not entitled to make.

⚠️ **The wordmark's gradient runs the other way since [0440](0440-every-screen-speaks-with-the-titles-voice.md)**:
violet into cyan, as the studio's banner does. 0440 also gives every other screen the same voice.

## The rule

| | was | is |
|---|---|---|
| **the name** | the panel's own type, the cyan every button is in | a wordmark: 800 weight, spaced, run from the ship's ink into the ally violet with a halo in the first — on the title and the splash |
| **the choice** | five buttons at one weight | on a screen tall enough for the desktop column, the three tiers full width and Music and Pilot side by side under them, smaller and quieter |
| **the settings** | small, the unchosen option at 0.55 | a desktop size a pointer finds, the unchosen at 0.75 — a choice, not a disabled control |
| **the splash** | the name alone for as long as the load took | a light running along a line under the name |
| **the golfers** | *Pilot* | *Choose your pilot* |

**The phone is untouched.** Every layout change is under `@container (min-height: 461px)`, the
complement of [0370](0370-the-title-fits-the-hand.md)'s query; the wordmark and the splash line are
the same on both.

## Why each is the size it is

**The wordmark takes its inks off the palette**, so a high-contrast palette sets it in its own
colours, and its size is still [0049](0049-the-chrome-is-authored-against-the-short-axis.md)'s clamp.
It is not the badge [0427](0427-the-icon-is-the-badge.md) made: that is a painting, and putting it on
the page means inlining an image into the one page [0003](0003-single-file-build.md) builds, or a new
sidecar that 0008's closed list would have to be opened for. That is a decision about the build, not
about the title, and is left open in the review.

**The splash line sweeps and does not fill.** The boot does not know what fraction of itself is done,
and a bar that guessed would be a claim the page cannot back. What the player is owed is *it is
working*, and a sweep says exactly that.

**Music and Pilot are secondary, not hidden.** They keep their place in the focus order and their
hints, so a pad and a reader meet them where they were.

## Rollback

Nothing irreversible.
