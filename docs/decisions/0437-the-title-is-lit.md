# 0437 — The title is lit

**Accepted 2026-10-01.** The open items of [the screens review](../../reports/the-screens-reviewed-2026-10-01.md),
asked for as *"do the open items too, hide the duplicate counts on mobile"*.

## The rule

| | was | is |
|---|---|---|
| **the badge** | the launcher icon only | beside the wordmark on the title and the splash |
| **behind the title** | the space colour, flat | three layers of stars drifting at three speeds, and the pilot's ship crossing low every sixteen seconds with its exhaust lit; the tier buttons get a backing of the void so nothing passes behind a label |
| **the golfers' screen** | nothing said who was flying | a filled tick on the golfer flying now, and `aria-current` on the button |
| **a touch screen's readout** | the two stack counts beside the discs that say the same numbers | the stack groups off the glass — and still in the page |

## Why each is built the way it is

**The badge is a file that already ships.** [0436](0436-the-title-has-a-voice.md) left it open because
an image on the page looked like either bytes inlined into the one page
([0003](0003-single-file-build.md)) or a new sidecar for [0008](0008-the-shell-sidecars.md)'s closed
list. It is neither: `icon-192.png` is already a sidecar, and the service worker already precaches it
for the install splash, so naming it from the page adds no file and nothing that fails offline. The
painting is the card's framing, as [0427](0427-the-icon-is-the-badge.md) requires.

**The sky is the stylesheet's, not the music room's flythrough, and that is a choice with a cost.**
The room ([0213](0213-the-room-is-a-flythrough.md)) flies the real ship through a real place, but it
does it by borrowing the run's camera, ship and pools, and its place is the one the mix and the atlas
follow — on the title that would put the place's music and sky under the title track. A CSS sky and a
CSS ship touch nothing the game owns. **What it does not do**: it is not the game's own sky art, and
the ship does not weave or fire. The stars are a fixed hash, so it is the same sky every load.
Reduced motion stills the stars and takes the ship away.

**The golfers' mark is a mark, not a cursor.** `show` still puts the focus on the first control
(0415's order); moving the cursor to the flying golfer would change what a pad's first press does on
a screen the player reaches at boot. On the first visit the tick is on the default golfer — who flies
if the player skips, so it is true then too.

**The touch counts are clipped, not removed.** The discs are a picture of where the canvas listens and
are hidden from a reader ([0060](0060-a-trigger-is-a-place-on-the-glass.md)), so the readout's labels
are the only place a screen reader hears the charges. `touchable` is the same capability that draws the
discs, so a phone and a touchscreen laptop both get the discs and lose the duplicate.

## Held by

`tests/hud.browser.test.ts`, *0437 — the open items*: the stack groups clipped on a touch page and
present in it, unclipped on a desktop one, and exactly one golfer marked — the menu's — in words and
in the picture. The probes in `scripts/probes/0437-the-title-is-lit.mjs` throw the touch switch each
wrong way and point the mark at nobody.

## Rollback

Nothing irreversible.
