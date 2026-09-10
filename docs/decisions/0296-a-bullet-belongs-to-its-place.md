# 0296 — A bullet belongs to its place

**Status:** accepted
**Builds on:** [0228](0228-an-enemy-wears-its-place.md), [0295](0295-a-ranking-guard-is-a-content-limiter.md)

## The report

> *"Fire, frost, void, acid all are generic types as well and we can have different 'fire' attacks
> […] we have every bullet on every level exactly the same, then the game is boring and low quality."*

And, from the play before it: *"There's some enemy bullets that are incredibly small and hard to see
and some enemy ships that look just look bullets so in some cases you can't tell what's what."*

## What was true

[0228](0228-an-enemy-wears-its-place.md) gave every place a `FoeSkin` — a hull, a plate, a lit strip,
an eye — so the Saurian Belt's raiders are olive and Rime Shelf's are ice blue. **The bullets those
same raiders fire never read it.** `drawKind` sent them straight to `palette[INK_OF[kind]]`, so the
ships changed by place and their fire did not: one pink in all seven.

**That is the tell
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md) names** — a mechanism whose
output is identical for every kind. And it is the cheap half of the report as well: `bakeAtlas`
already takes a `ThemeKind` and `src/app/mount.ts` already rebakes when the backdrop changes, so the
bullets were the only thing in the game not reading an argument that was already being threaded past
them. Seven places' worth of distinct hostile fire costs **no extra sprites, draw calls or frame
budget**.

**And on level one the two collided exactly.** `approach`'s skin carries `lit: '#ff7286'`, which is
`palette.enemy` character for character — the bullet ink. The hull accents and the fire were not
similar; they were the same value. That is the level the report came from.

## What this does

`FoeSkin` gains `shot?: string`. Seven places author one. `drawKind` resolves the ink for the shots
whose ink is `enemy` from the place's skin, falling back to the palette.

**Optional, which is the DEFAULT shape 0282 asks for** and not an oversight: the row says what its
version is, shared code holds the fallback. It carries two cases in one line — a place that authors
nothing, and the high-contrast palette, where `foeOf` returns `null` for every place because a skin
is decoration and that palette has none.

**The covered set is derived, never listed** — every shot whose ink is `enemy`, read off `SHOTS`. A
fifth raider bullet is covered the day its row exists.

## Which things belong to a place, and which are themselves

This is [0295](0295-a-ranking-guard-is-a-content-limiter.md)'s test applied per thing, and the answer
comes out different for two sets of bullets **in the same change**:

> *"Does it make sense for a rule to be hard? If yes, then it's a hard rule. If no, then it's a
> specific rule for that thing."*

- **A raider's bullet** — `spit`, `lance`, `flak`, `quill`. No reason it should be one colour
  everywhere, and seven reasons it should not. It belongs to its place.
- **`fire`, `acid`, `void`, `frost`** — the serpent's acid, the eagle's flame, the frost ship's
  shard, the volcanoes' rock. **These do not move.** *"Fire should be flame red everywhere"*: fire is
  fire, and a flame that changed hue by level would teach the player something untrue about the
  world. That is a hard rule, and it is hard **about fire** rather than about bullets.

## What the colours are, and why each

| place | shot | |
|---|---|---|
| approach | `#ff2e4d` | grey hulls leave the whole hot end free |
| nebula | `#ff2f8f` | the hulls are ORANGE, so orange fire is a raider shooting itself |
| saurian | `#ff4d2e` | olive hulls on the one blue sky, where a warm shot has most room |
| labyrinth | `#ffd12e` | teal hulls with magenta lamps: both cold ends are spoken for |
| rime | `#ff5a1e` | everything is cold, so an ember is the loudest thing that can happen |
| mire | `#ff2e6b` | **left as baked** — see below |
| core | `#ffe84a` | the hulls are RED, the one place a red bullet would vanish |

Every one was **baked and looked at through the game's own atlas** before it was written down, not
picked from hex codes — `scripts/threat-sheet.mjs`, which lands with this and is the picture
`CLAUDE.md`'s *consider what shares the screen space* is argued against.

⚠️ **THE MIRE IS THE TIGHTEST PAIRING AND IS DELIBERATELY NOT ADJUSTED.** Rose against a purple hull
are near neighbours. *"Close might be fine and we'll be stuffing around with it for no reason"* — so
it goes to play as baked, which is *consider the screen* answered by the screen. The lime lit strips
pull the hulls apart further than the still image suggested.

## What this deliberately does not do

- **It does not resize anything.** Not one extent moves.
- **It does not repaint level one's hulls.** `lit: '#ff7286'` stands. Whether hot red is separation
  enough there is a question for play — and the answer may not be paint at all: *"we move weavers so
  they show up when the similar bullets are not on screen."*
- **It does not touch the flame.** It is still the smallest and dimmest thing in the game at 8.6 px,
  and it gains nothing here because it is on the `fire` ink by design. *"Make the fireballs bigger
  with trailing fire and make it look like fire"* is a shape job and its own pass.
- **It adds no guard.** Nothing here is an invariant: every colour is a per-place authoring choice,
  which is the point.

## What is owed

⚠️ **A PLACE'S `shot` IS HELD TO NO FLOOR, WHERE ITS `hull` IS.** `tests/foes.test.ts` holds every
skin's hull legible on its own backdrop and apart from the pickup and the ship; the `shot` beside it
is held to nothing, so a place could author a bullet that vanishes into its own sky and every guard
would stay green. That is the reported defect, reachable by authoring.

It is **named rather than closed**, because closing it is a decision about bullets and those are not
made by assumption here. The three options, with the argument against each already known: a hard
floor (0295 refused a size floor on the reasoning that a hard-to-see bullet may one day be the right
answer, and contrast is the same shape of rule); a taste in `tests/authored.ts` (printed every run,
cannot fail — 0192's mechanism for exactly this); or nothing, on the grounds that
`scripts/threat-sheet.mjs` makes it visible and a colour nobody looked at is the real defect.
