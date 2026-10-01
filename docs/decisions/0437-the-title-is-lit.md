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

## What it cost two other guards

**Dropping the touch counts blinded 0360's.** *The bar never lies over the readout* measured the
readout on a touch page, as *the widest the game can show* — which it stopped being here, so a bar put
back at 31% cleared it and 0360's probe went green. It measures a page without touch now, which is the
widest. Found by CI, where it showed up as the next item.

**And 0432's key guard was intermittent, which is how CI found the first.** It counted faces whose
visibility was `visible`, and for a few percent of each turn the outgoing face fades under the
incoming one with both visible: CI caught it mid-crossfade while 0360's probe was running, and
reported that probe as red on the wrong test. It sums the faces' opacities now, which is exactly one
at every moment of a turn — sampled 343 times over two full turns before it was trusted — and a row
whose turns never start or all share one clock sums to its face count or to nothing.
([0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)).

**And 0169's probe was reading a race, which CI drew on the second run.** It shrank `HUD_MS` to 500 ms
on the claim that a press takes 1.2 s, but [0169](0169-a-browser-budget-is-measured.md)'s own note is
that a press pays for whatever is left of the prewarm when it lands. Five pages each, pressed the moment
the title showed and pressed a second later: 917–1419 ms and 99–153 ms, the same on #458's build and
this one, so 0437 did not cause it — the cheaper bake of 0425 made the warm case reachable on a runner
slow to the title. The probe shrinks to 30 ms now, under the fastest press measured, and is red
whatever the prewarm has done; it was red three times in three locally.

## Rollback

Nothing irreversible.
