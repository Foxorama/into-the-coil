# 0520 — The light is loud

**Accepted 2026-10-05.** The first part of the loud pass [0457](0457-the-flash-cap-is-measured.md) owes,
measured on its meter before it lands. Extends [0470](0470-the-light-is-additive.md): its tables stay, and
gain a row.

## The ask

> *"if we add a warning splash screen at the start of the game and adding a setting to turn them off, can
> we make the game flashy and vibrant?"* … *"yeah crank them out, let's make the game as pretty as we can"*

— the ask 0457 recorded, answered there as *yes to vibrant, no to the trade*. This work was begun on
2026-10-02, against the stack as it stood before 0470, and left uncommitted when 0470 landed over it. It was
rescued to the branch `the-light-is-added-rescued` as found, and ported here onto 0470's tables. What
survived the port and what did not are both below, with the measurements that decided each.

## What landed

**A white-hot heart in every bolt.** A flash and a dot gain a layer between the glow and the core: the glow's
own ink taken halfway to white, 1.8 strokes wide, added. A bolt now runs white at its heart, ink at its edge,
and ink-coloured light round that. `BoltLayer.ink` gains `hot`, and `src/render/bolt-inks.ts` solves each
palette's inks once — not in `canvas.ts`, which is on the hot list and may not reach `bake.ts`'s `shade`. A
beam's stack is 0470's, unchanged: it was tuned and guarded on its own and already has a hot layer.

**Light sprites are added, not laid.** `LIGHT_KINDS` in `src/content/sprites.ts` names the kinds that are
nothing but light — an explosion's flash and fireball (`burst0`, `burst1`), a missile's landing (`spark0`,
`spark1`), a bolt's landing point (`arcNode`), a ray ring's burst and fading rim (`rayBurst`, `rayFade`), the
nova's band (`novaArc`). The atlas carries a `light` flag beside its bitmaps, and `CanvasSurface.blit` draws
those `lighter`, putting the context back after. Two of them crossing burn brighter where they cross, and a
glow over the sky lifts it rather than veiling it. A kind says it is light; nothing decides it for it
([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)). The port's atlas carries the game's
lights at the game's indices.

**Brighter art**, each in its own ink taken toward white, so a palette still answers every colour: the acid
drop (a stronger glow and a hot glint), the void (a harder glow, a lit inner rim), the maw (a lit rim band, a
lit heart to each acid blot), the ray's swell and its fading ring, the void ball (a wider halo, a hot filament
down each arm, a lit ring round its heart), the rift zone (a ring of light at its heart), and the nova's band
(a deeper glow, a whiter core).

## What was built and measured out

**A louder wash under the lightning.** The rescued stack had a bloom 22 strokes wide and a wash 9 wide,
held together under a per-palette cap so they could never lift a place's sky by more than 0.04 of
luminance. On the meter the cap was right: at 0.08 the storm read 7 and 6 transitions in its worst second,
at or over 0024's six, and at 0.04 it read 3. But 0470 had meanwhile given the lightning an uncapped wash,
14 wide at 0.2, which already lifts The Approach's sky by 0.034, and the Saurian night and the Rime Shelf
by 0.075 and 0.084. Under the cap, the two layers left less light round a bolt than that one wash.
Photographed on the bench, the ported lightning was duller than `main`'s. So the wash is 0470's, and the
cap went with the bloom.

**The event horizon on the void bomb.** The rescued rift zone deepened its dark towards the heart, ran a
bright filament down each arm and burned its rim. A zone slides across the screen with the scroll and turns
as it goes, so every bright line in it strobes the screen it crosses. With the void thrown as fast as it may be:

| rift zone | worst second |
|---|---|
| `main`'s | 2 and 3 transitions |
| the full horizon | 8 — over |
| the same, dimmed | 7 — over |
| `main`'s arms with the burning rim | 6, 6 — at the cap |
| the same, the rim dimmed | 6, 4 |
| `main`'s arms with the heart's ring | 3, 3, 3 |

So the zone keeps its arms and gains only the ring.

**A staggered storm, and a slower jag.** The rescued work replaced the storm's generations of bolts one
share at a time, and halved how often a bolt's jag changes. Both were for the flash cap under the louder wash.
Without the louder wash, the storm reads 1 flash a second without either change, as it did on `main`. A
look change whose reason is gone is not carried.

## Measured

`node scripts/weigh-flashes.mjs`, 1280×720, vivid, 4-pixel cells, every scenario, on top of
[0519](0519-the-beast-lights-thrice.md):

| | worst second |
|---|---|
| the storm | 1 flash (3 transitions) |
| the void, thrown as fast as allowed | 1 flash (3 transitions) |
| the hydra at 15% | 2 flashes (5 transitions) — 0519's |
| every other scenario | 0 |

## Guards

`tests/bolt.test.ts`, *0520 — the light is loud*:

- **THE HOT HEART, IN LUMINANCE** — on every palette, in every place, for the player's bolt and the enemy's,
  a flash and a dot each stroke exactly one layer between the glow and the core, added, and whiter than the
  glow (unless the glow is white already). Read off the strokes the canvas makes.
- **A LIGHT IS ADDED** — every `LIGHT_KINDS` sprite is blitted `lighter`, every other kind `source-over`,
  turned or not, faded or not, and the context is back to `source-over` after each.
- **the port keeps the game's lights at the game's indices.**

Each is an invariant ([0192](0192-a-guard-holds-an-invariant.md)). 0470's own guards are kept and adjusted
in two places, each with its reason in the test:

- *a dot has grown a rim or a wash*: it counted a dot's layers as two. It now holds what 0238 forbids, no
  rim and nothing wider than the glow, since the heart is a third layer inside it.
- *the stacks really are two*: it told the flash from the beam by count. A flash now has as many layers of
  light as a beam, so it compares what is stroked.

`tests/bolt.browser.test.ts` strokes the tables on a real canvas in its own loop, and that loop now inks the
hot layer as the canvas does.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `scripts/probes/0520-the-light-is-loud.mjs`: the heart in the
glow's own ink; every sprite laid as paint; the game's lights unshifted in the port's atlas. All three red.
`node scripts/prove-guard.mjs 0470` still red on all ten. Its *glow dimmed to nothing* probe stayed green
while the browser test's loop stroked layers the canvas no longer strokes the same way. That was the
loop's defect, and it is fixed.

## Owed

- **A play.** The heart and the added sprites are the picture's numbers and the player's to move.
- **The storm and the arc over the Saurian night and the Rime Shelf.** The meter flies its specials in The
  Approach. 0470's wash lifts those two skies by over twice what it lifts The Approach's, and that has
  not been measured as a flash.
- **The rest of the loud pass** — the serpent's bubbles and everything after them, each on the meter first.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Nothing persisted.
