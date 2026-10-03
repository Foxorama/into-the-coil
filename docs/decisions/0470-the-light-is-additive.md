# 0470 — The light is additive

**Accepted 2026-10-03.** Every bolt in the game — chain lightning, the storm, the serpent's strike, and
every boss's laser — has its glow ADDED to the frame rather than laid over it; a laser is stroked as a
six-layer column and not as a flash; a flash snaps and collapses. **Amends
[0238](0238-the-picture-answers-the-second-play-test.md)** (the four strokes of a bolt),
**[0250](0250-the-quetzal-screams.md)** (a beam drawn as a bolt), and sits a per-leg ceiling under
[0302](0302-the-bolt-shows-its-reach.md)'s absolute one on the jag. **Extends
[0459](0459-the-bosses-are-placed.md)**, whose yellow was the right ink laid the wrong way.

## The ask

> *"we need to fix up the lightning and lasers over all. they look dodgy and poorly implemented now.
> lightning needs to be brighter and flashier. lasers need more depth and layers. and the jellyfish
> boss's laser/lightning attack still looks terrible against the background."*

## What was wrong, measured on the picture

Photographed on the bench at 1280×720 before anything was changed (`shots/bolts/before/`, gitignored):

- **The jellyfish's lasers were a mustard road.** 0459 changed the Black Heart's bolt ink to its
  plasma yellow and the guard in `tests/medusa.test.ts` was satisfied — the *ink* stands off the
  vessels at 2:1. But the glow is stroked at four tenths, `source-over`, and four tenths of a yellow
  over a near-black plum is `#5e4f23`: an olive band. The dark rim under it made it browner. The ink
  was never the picture.
- **The pterodactyl's lasers were a flat pink band with a white line down it.** One stroke at one
  alpha, however wide, is a band. *"Depth and layers"* is the player naming the absence exactly.
- **Lightning was a wire.** Nine vertices on an eighty-unit link is a kink every ten units; the glow
  at four tenths was a cyan tint; the fade was a straight line over eight steps, so the bolt was at
  half brightness half the time it was on screen.

## What changed

**The light is `lighter`.** `CanvasSurface.bolt` strokes each layer of a bolt under the compositing
mode its layer says, and every glow and core says `lighter` — the ink's channels are added to the
frame's. The rim says `source-over`, because an added black is nothing and its job is to darken. The
context is put back — `source-over`, alpha one — before the verb returns, or every blit after a bolt
would be added too. A compositing mode is a property write on the context's state; it costs no draw
and shows up in no count.

**A bolt's look is a table, and there are three** — `FLASH_LAYERS`, `DOT_LAYERS`, `BEAM_LAYERS` in
`src/render/canvas.ts` — each row a width as a multiple of the stroke's, an alpha as a share of the
call's, an ink and a mode. The surface's verb grew a sixth argument, `beam`, on `hostile`'s terms: a
flag, and absent is a flash. Still one verb and still one count — a beam is a polyline stroked some
number of times, as a flash is.

| | layers, under to over (width × stroke / alpha) | |
|---|---|---|
| **flash** | wash 14 / 0.2 · rim 6 / 0.5 · glow 4 / 0.55 · core 1 / 1 | 0238's four, the glow louder because it is added now |
| **dot** | glow 4 / 0.55 · core 1 / 1 | 0238: a dot is its glow and its core |
| **beam** | wash 7 / 0.16 · rim 5.2 / 0.6 · body 4 / 0.28 · inner 2.4 / 0.4 · hot 1.4 / 0.6 · core 0.8 / 1 | the body is the hurt width (0250); each narrower layer louder |

**A flash snaps and collapses.** The fade is the life raised to 1.5, so a link is near full for its
first steps and gone fast at the end; the core is 1.2 of `BOLT_WIDTH` as it lands and 0.6 as it
dies. Thirteen vertices from nine. A second, smaller twig off the other side. **And a per-leg
ceiling on the jag** — half a leg's length — because at thirteen vertices a ten-unit link with a
sixth of its length of swing on every leg was a scribble; a link over about forty units never feels
it, and the long ones still hit 0302's three-unit ceiling.

**A beam ignites and hums.** It blooms to 1.25 of its width as it lights and settles to the hurt
width over its first eight steps of burn — wider than the hurt for an eighth of a second and never
narrower, which is the half of 0250's *as wide as it hurts* that matters. Held, the whole column
breathes between 0.88 and one over thirty steps: under two cycles a second, well short of the three
an area that size must stay under.

## Confirmed, not assumed

Stroked on a real canvas over the real colours, read back as pixels (`tests/bolt.browser.test.ts`;
8 px stroke, so a 32 px beam). Luminance and WCAG contrast against the ground it is over:

| | heart | inner (0.2 of hurt) | body (0.44) | rim (0.57) |
|---|---|---|---|---|
| beam over the Black Heart's sky `#10050f`, added | `#ffffff` 1.00 · 20:1 | 0.45 · 9.6:1 | 0.10 · 2.8:1 | 0.01 |
| the same, laid as before | 0.92 | 0.26 · 6.0:1 | 0.08 · 2.5:1 | 0.01 |
| beam over a lit vessel `#d48598`, added | 1.00 | 0.79 | 0.28 | 0.08 · **2.8:1 darker** |
| the same, laid as before | 0.92 | 0.36 | 0.17 | 0.07 |
| the arc's glow over The Approach `#0b0b14`, added | 1.00 | 0.31 · **6.7:1** | | |
| the same, laid | 0.92 | 0.23 · 5.3:1 | | |

So: the heart of a beam is white light over anything; the column falls off through four distinct
brightnesses; over a vessel the rim is darker than the vessel by 2.8:1 and the heart stands off the
rim by 8:1 — the beam carries its own edge, which is what *"against the background"* needed and what
an ink alone cannot give. The guards hold the heart at ≥ 0.85, each layer darker than the one inside
it by ≥ 0.02, the rim ≥ 1.6:1 against a vessel and darker than it, and the arc's glow ≥ 3:1 against
its sky; and that added beats laid by ≥ 0.05 of luminance for both.

`tests/bolt.test.ts` holds the contract on the recording pen: every light layer `lighter`, the rim
`source-over`, the context put back; a beam at least four layers of light, each narrower one louder,
one at the hurt width, the white core narrowest; a link full on the step it lands, under half by half
its life, thinner as it dies, at `STROKES_PER_LINK` calls; no vertex of a ten-unit link more than
half a leg off its line; a beam blooming, settling to the hurt width, never under it.

**Photographed** on the bench at 1280×720: the arc in The Approach at 50 frames 30 ms apart, the
serpent's strikes, the pterodactyl at both beam phases, the jellyfish at both. `shots/bolts/after3/`
beside `before/`. Three passes: the first showed a short link knotting at thirteen vertices (the leg
cap), the second a five-layer beam banding (the sixth layer and the alphas above).

`node scripts/prove-guard.mjs 0470`: ten probes, all red. 0250's beam-width probe re-anchored on the
line as it is now.

## Why it is built the way it is

**Compositing and not a brighter ink** — the ink was already right (0459) and the guard that held it
was green while the player saw mustard, which is [0027](0027-measure-the-picture-not-the-model.md)'s
case exactly: a contrast computed on two hex strings is a model of a pixel. The pixel guard reads
pixels.

**A table and not a second verb** — `Surface` is deliberately three verbs wide
(`src/render/surface.ts`), and a `beam` verb would hide nothing the count does not already see; but a
beam IS a bolt stroked differently, and a flag on the call says so in one place. The looks are module
constants and not parameters because a look is what a bolt is, not what a call chose, and a per-call
table would allocate on the hot path.

**No `shadowBlur`, still** — the layers are the glow. Six strokes of one path per beam, four per
flash; a fan of five beams is thirty strokes and the storm's thirty bolts at eight calls each is two
hundred and forty, on a desktop target ([0153](0153-desktop-is-the-target.md)).

## What was rejected

- **Mitre joins for sharper lightning.** Sharp at the core, but a 14-wide wash with a mitre spikes
  past its own corner by up to ten half-widths; round joins and more vertices give the angles instead.
- **Over-bright at landing by alpha above one.** The canvas ignores a `globalAlpha` outside [0, 1]. The
  snap is the fade curve and the core's width instead.
- **A faster hum.** At eight cycles a second a beam a twelfth of the lane wide is a strobe over a
  large area. Thirty steps and twelve percent.
- **Fewer vertices for a short link** — the buffer is one size; the per-leg cap gives the same picture
  without a second path length.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Nothing persisted moves.

## Owed

- **A play.** Every number in the three tables is the picture's; the hum's depth, the bloom and the
  fade's power in particular are an eye's call and the player's to move.
- **The Rime Shelf.** Added light over a bright ground adds little; the rim is what keeps a bolt's
  edge there. Not photographed on this pass — the arc over ice is the case to look at first.
