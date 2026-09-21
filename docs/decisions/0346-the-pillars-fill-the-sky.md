# 0346 — The Pillars fill the sky

**Accepted 2026-09-21.** A play report on [0345](0345-ember-nebula-is-in-colour.md), answered the same
day. **Amends [0203](0203-the-rule-was-never-about-size.md)** — a landmark entry may say how big it is
drawn. **Builds on [0225](0225-a-landmark-is-not-a-carbon-copy.md)**, whose three castings this level
had only ever placed one of, and on [0223](0223-a-place-has-a-palette.md): every lit edge in a place
takes its accent, and the Pillars' rim never had.

## The ask

> *"Pillars and ember look good, but the pillars could be more prominent, they only take up part of
> the screen and level, we can make them larger and more interesting."*
>
> *"The stars in front of the pillars is fine, it gives a sense of depth which is lovely, but … pillars
> could be more vibrant and prominent."*

**The second sentence closes 0345's open question**: stars in front of a landmark is a thing the
player likes, so the draw order stays and 0343's candidate planet is no longer blocked by it.

## What the player sees differently

Stands of pillars from the first second of the level to the fight, the biggest taller than the screen,
sliding against each other at three rates; every column rimmed in ember with a glow behind its head.

## The rules

**A landmark entry may state a `scale`, and absent is 1**
([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)). A landmark's bitmap is 75
units for every place and the lane is 100, so **at its own size no landmark can span the screen
whatever is drawn in it** — *"only part of the screen"* was arithmetic. A taller bitmap for all seven
places is memory six have no use for; `blit` already takes a scale, which is the argument
`beat` made for itself in 0220. The painter's `extent` is the drawn width, so arrival and culling
needed no change. Volcanoes and the heart say nothing and are unchanged, and a guard holds that.

**The level places all three castings.** The organ's stand is still at `push` and is the biggest, at
1.7×: its tallest column is 117 units. One stands in the opening; the last arrives as the first leaves.

⚠️ **The opening stand's `at` is −1400, on purpose.** `at` is where a stand *enters*, and at a
landmark's rate that is a long way from being seen: the first draft entered at 120 and the photograph
at 400 had a sliver of it. `src/render/scene.ts` warns about a negative `at`; the hazard it names is a
negative *difference*, which an earlier `at` makes more positive, not less.

**The rim is the ember, and each head has a crown of it.** `LANDMARK_OF.nebula` threw the accent away,
so the brightest thing on the Pillars was the gas's body colour — a dull mauve line. The crown is light
with no edge (two stops, to nothing) drawn before the column so the column cuts into it.

## What the photographs found

| shot | what was wrong | what changed |
|---|---|---|
| 1080p, first crowns | **a ruled horizontal line across the sky**: the tallest column's tip is a twentieth of a tile from the top edge, so a crown centred on it was clipped flat — [0204](0204-a-landmark-is-lit-by-the-place-it-stands-in.md)'s *rectangle clipped around the gas*, again, and 1.7× bigger | the crown sits a little below the tip and is never larger than its distance to an edge |
| 1080p, along 400 | the opening stand barely on screen | `at: -1400` |

**Softness is owed an eye.** A scaled blit is a bitmap drawn above the resolution it was baked at — 1.7×
at worst. The Pillars are dust and light and the photographs read clean; if the rim looks soft on a
monitor, the lever is baking this place's landmark at its drawn size, which costs memory and a decision.

## The guards, and that each was seen to fail

`tests/pillars.test.ts`:

| guard | the break, and what it said |
|---|---|
| the organ's stand is taller than the lane, and is the biggest | scale back to 1 → *69 units against a lane of 100* |
| every casting is placed, and the first is **on screen** at the opening | `at: 900` → *−63 units of a 101-unit stand are in view* |
| no scale stated, none drawn | a volcano given 2 |
| no light in the Pillars is cut off by their own bitmap | the fit removed → *67.7px past the top* — the first draft, exactly |

⚠️ **The first guard came back STILL GREEN and was wrong, not the probe.** It claimed *the biggest stand
spans the lane*; shrinking the organ's stand left another clearing it. A claim about a maximum cannot
see the one that matters being put back, so it is about the organ's stand now.

Two probes elsewhere were stranded and re-anchored on only what they break (0203, 0220).

No rollback note: no storage key, save schema, cache prefix or origin is touched.
