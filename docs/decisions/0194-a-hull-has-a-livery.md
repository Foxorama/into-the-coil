# 0194 — A hull has a livery, and decoration is an ink that means nothing

**Accepted 2026-08-25.** The first of three the art brief needs, and it is the pipeline the other two
stand on.

> *"The current art is great as a demo/pre-alpha does it work, but I want fun quirky graphics like we
> have in The Far Carry for the spaceships and weapons."*

## ⚠️ What was actually in the way, and it was not taste

`drawKind` set **one** `fillStyle`, stroked in `space`, and — since
[0149](0149-a-hull-has-an-interior.md) — filled one accent in `space`. So the entire game was **one
meaningful colour and void.** Not a choice about these shapes; the only picture the function could
produce.

**The predecessor's `src/render/shipArt.ts`** — opened for a named reason and one named file, per
`CLAUDE.md` — builds every craft from `{ body, glass, flame, accent }`: a body colour, a windscreen,
an exhaust and a trim stripe. **That is the whole of why its fleet reads as characterful.** Four
colours per object, not one.

## The rule

**An accent shape may name an ink, and the ink means nothing.** `glass`, `flame` and `trim` join the
palette as a closed `DecorInk`; an `AccentShape` gains an optional `ink` whose absence is `space`.

⚠️ **EVERY 0149 ACCENT IS BIT-IDENTICAL**, because it names no ink and therefore lands in the `space`
group alone, drawn by exactly the code that drew it before. **The seven bosses do not move.**

⚠️ **AND THE MECHANISM IS 0149's, NOT A SECOND ONE.** Containment, outer bounds, minimum thickness
and blit count are all written over the *shapes*; they do not care what colour the shapes are. What
changed in `tests/accents.test.ts` is that they now run over **every kind that wears an interior**,
derived from `ACCENT_OF`, where they used to run over a hard-coded list of seven.

## ⚠️ Decoration is held to the OPPOSITE floor, and that is not an exemption

A meaningful ink must clear WCAG AA **against the void**, because it is found against the void. A
decorative ink is **never drawn against the void** — it is laid over a hull that has already cleared
that bar, inside the same bitmap. Holding it to the same floor would demand a canopy as loud as the
ship it is a window in.

**So `tests/palette.test.ts` now sorts every ink into one of three camps and holds each to its own
floor**, with a guard that no ink is in none or in two:

| camp | floor |
|---|---|
| **background** (`space`, `sky`) | the inverted one 0065 argues for |
| **meaning** (`player`, `enemy`, `bullet`, …) | WCAG AA against the void |
| **decoration** (`glass`, `flame`, `trim`) | **separation from every meaningful ink** |

⚠️ **THE COST THE THIRD FLOOR IS ABOUT IS THE ONE `MUST_NOT_BE_CONFUSED` IS ABOUT.** A `flame` sitting
where `bullet` sits is a ship with a shot painted on it, and the player checks it — an eighth of a
second, in a bullet hell.

⚠️ **AND THE HIGH-CONTRAST PALETTE SPENDS NOTHING ON DECORATION.**
[0024](0024-the-accessibility-floor-is-settings.md) read the only way it can be: *there is one game
and it is the loud one; accessibility is knobs over that default.* Every decorative ink there **is**
`space`, so a livery collapses to the hole 0149 already punched and **that palette's art is what it
was before this decision.** That is also what makes the exemption above safe: on the palette where it
would matter most, there is no decoration at all.

## What wears one, and what deliberately does not

| | |
|---|---|
| **the three ship tiers and their hurt twins** | a keel, a canopy, an engine core — and a tier adds marks rather than changing them, which is 0081's *the same ship, further along* |
| **the bomb, and the bomb pickup** | a lit core inside a casing |
| **the weapon, missile and shield pickups** | a shaft and a lit head |
| **the bullets — `bullet`, `spit`, `lance`, `flak`** | **nothing, and the number says why** |
| **`missile`** | nothing, same reason |

⚠️ **THE SHOTS ARE TOO SMALL, AND THAT IS MEASURED RATHER THAN ASSUMED.**
[0193](0193-the-sheet-is-the-instrument.md)'s own finding is that the binding viewport bakes at
**7.19 px/unit**. A `bullet` is 1.8 units — **13 px, whole** — and `missile` is 3.4 units, so its hull
radius is about 10 px and a mark on it would be a pixel across.
[0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md) forbids it. **The instrument built two
decisions ago is what decided this rather than a guess**, which is the whole argument for building it
first.

⚠️ **AND `lifeIcon`, `shieldOrb` AND THE BLASTS ARE RINGS AND CROSSES WITH `evenodd` HOLES IN THE
MIDDLE.** A mark at the centre would be painted over a hole — opaque colour where the sky shows
through. 0149 drew that distinction; this is the first table to hit it.

## ⚠️ What the sheet caught that no guard could

**A mark can pass every guard in the file and be invisible.**

The first version painted `trim` second, under `glass` and `flame`. Every clearance, thickness and
bounds guard was green — and the sheet measured **ten pixels of `trim` on the whole ship**, because
the keel was drawn and then covered by the two marks sitting on it.

⚠️ **THE FIX IS THE ORDER AND IT IS ALSO THE RIGHT PICTURE.** `trim` is painted **last**, over the
canopy frame, which is what a panel line is. Then the opposite happened — the keel covered the engine
core, `flame` measured **zero** — and the answer was to stop them overlapping in `x` at all.

**Measured on the sheet, per sprite, in surviving pixels:**

| | `glass` | `flame` | `trim` |
|---|---|---|---|
| `ship` | 20 | 30 | 48 |
| `shipMk3` | 16 | 30 | 66 |
| `bomb` | 52 | 16 | — |
| `pickupShield` | 52 | — | 60 |

⚠️ **THAT A MARK SURVIVES TO THE BITMAP IS NOT GUARDED, AND THAT IS DELIBERATE** —
[0192](0192-a-guard-holds-an-invariant.md). *How much of a panel line should show* is a taste; a
correct authoring change reddens any number put on it. It is **measured on the sheet**, which is what
[0193](0193-the-sheet-is-the-instrument.md) is for.

## What the guards caught while this was authored

Every one of these was a real defect in the art, found by a guard rather than by eye:

| | |
|---|---|
| the keel within **1.35 px** of the wedge's edge | 0149's clearance floor |
| a Mk3 mark **2.12 px** across | 0106's floor, as a mark |
| a tier flame at **−1.34 px** — *over a hole* | `drawFins` adds its pair `evenodd` **with** the wedge, so wherever a fin overlaps the hull the two cancel |
| a mark **1.48 px** from the waist notch | the wedge is concave at `W(-0.3, 0)` |
| the weapon pickup's keel at **−2.72 px** | that hull has a notch too, at `(-0.25, 0)` |

⚠️ **THE FIN HOLES ARE THE ONE WORTH CARRYING FORWARD.** Three of this game's hulls are the wedge plus
`evenodd` fins, and the region either side of the spine is **not solid ink** — it looks solid in the
file and is a gap in the bitmap. Anything authored onto those hulls goes on the centreline or forward
of the canopy.

## What this does NOT do

⚠️ **The exhaust does not hang off the back.** The predecessor's does; here every mark is inside the
hull, because 0149 makes the silhouette's outer bounds what collision, the extents and 0101's screen
share are written against. An engine core forward of the tail notch stands in for it. **A trailing
flame is a different decision** and it is about extents, not about colour.

⚠️ **No enemy and no boss gains a livery.** Level-specific enemy art is the next PR and it needs a
`variant` this does not build.

⚠️ **Nothing about the backdrop.** `makeRng('sky')` still takes no theme, so every level still has
identical star and cloud positions. That is the third PR and the largest of the three.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix. The palette is not persisted; the atlas is baked at load.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| a decorative ink set to the colour of a pickup | `0194 — AND NO DECORATION IS MISTAKEABLE FOR ANYTHING THAT MEANS SOMETHING` |
| decoration given a colour of its own on the high-contrast palette | `0194 — THE HIGH-CONTRAST PALETTE SPENDS NOTHING ON DECORATION` |
| a decorative ink counted as a meaningful one | `clears WCAG AA against the background, in every palette` |
| a livery mark run out past the hull it is drawn on | `and the interior stays inside the hull, with room to spare` |
