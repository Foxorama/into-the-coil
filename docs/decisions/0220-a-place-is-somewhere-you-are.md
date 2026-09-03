# 0220 — A place is somewhere you are

**Accepted 2026-09-03.** Five of the seven places redrawn, from one report.

> *"ember nebula is looking good, but it needs a lot more detail throughout the level and the pillars
> of god need a lot more character and depth to them. then saurian and rime shelf need to be planetary
> backdrops where the level is based on a planet, not that the planet is in the background, black
> heart needs to be a beating black heart, labyrinth needs to be a branching twisting path the player
> is flying through etc"*

## The rules

- **A place a level is *on* has a skyline, and the skyline is on the lane.** Saurian Belt and Rime
  Shelf are ground now.
- **A landmark may beat.** `LandmarkEntry.beat` is world units per cycle, `0` for still.
- **What each place's landmark is lives in `LANDMARK_OF`**, a `Record` over the closed union —
  [0016](0016-a-hub-enumerates-kinds.md) — with `null` where none is authored.
- **A structure mark that does not taper is one path.**

## ⚠️ The word that changed the most geometry was *through*

[0211](0211-every-place-has-its-own-structure.md) read The Labyrinth as *"long structure going past"*
and drew four independent walls. That is scenery **beside** the player. A path you fly **through** has
two sides and they have to agree, so it is authored as a **centreline and a gap** and the walls are
what that pair implies — which is also what makes *the corridor never closes* a claim with one right
answer.

The same word runs through the whole report. *"the level is based on a planet, not that the planet is
in the background."* Every one of these places was a texture the player went past; the ask was to be
inside them.

## ⚠️ Two channels was the first draft, and the player was between them

At 0.36 and 0.63 of the tile the walls sit at lanes 22 and 76 — and the ship, which flies in the
middle, was in neither. Four wavy lines and a player in open space is *going past* again, with more
lines. **One channel centred on the lane** puts the walls at roughly 24 and 76 and the player inside.

## ⚠️ Sines, because the wander that reads as a twist is the wander that reads as a seam

`crossing` walks and then forces its last point back to the first
([0207](0207-the-eagle-has-lanes.md)), so every unit of drift is repaid in one final segment.
Raising the wander from 0.018 to 0.032 was tried: the bench showed zigzag ridgelines with a kink at
every tile join. **Periods that divide the tile are periodic by construction** — 0207 discharged by
arithmetic rather than by a correction — so the amplitude can be whatever the picture wants.

## ⚠️ Tile y 0.25 to 0.75 is the lane, and this is the third time

The weather tile is `ACROSS_SPAN * 2` and blitted centred, so its y runs lane −100 to 200 and only the
middle half is on the screen.

| | authored at | what the player saw |
|---|---|---|
| The Approach's horizon, 0211 | tile 0.86 | nothing — lane 122 |
| the Pillars' far columns, this pass | foot 0.97 | nothing — three columns where five were drawn |
| Saurian Belt's ridges, this pass | 0.60 / 0.655 / 0.715 | lane 70, 81, 93 |

**All three were found by looking**, and the first two only ever could have been —
[0027](0027-measure-the-picture-not-the-model.md). The third is a guard now: *a planet's skyline tops
out inside the lane, and three quarters of it is on the screen.*

⚠️ **AND THE GUARD'S FIRST DRAFT WAS WRONG IN THE OTHER DIRECTION.** It asserted every point of a
crest was on the lane and reddened on Saurian Belt's near ridge at lane 102 — which is **correct**: the
nearest ground runs off the bottom of the frame, exactly as the Pillars' feet do, and a ridge forbidden
to do that is a ridge with no relief. [0192](0192-a-guard-holds-an-invariant.md): *a red guard is never
answered by changing the work to suit it.*

## ⚠️ A beating sprite, and there were only two ways to have one

The atlas is bitmaps and nothing in `src/render/` animates one. Either a second baked frame — a whole
sprite slot and a second drawing to keep in step with the first — or **the scale `blit` already
takes**. It swells and settles; that is a beat, for one number and no new state.

⚠️ **DRIVEN BY THE CAMERA, WHICH IS [0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)'s
*every speed is in the camera's frame*.** There is no clock in `scene.ts` and adding one would give the
renderer state. `cameraAlong` is already an argument, already monotonic, and already what `at`, `depth`
and `extent` are all measured against.

⚠️ **AND THE SHAPE IS THE CLAIM, NOT THE RANGE.** *Lub-dub* — two thumps and a long rest — is the whole
reason anyone recognises a heartbeat. A single sine passes *the size changes* with room to spare and
reads as breathing. This is [0219](0219-range-and-clean-stop-being-one-knob.md)'s lesson arriving in a
different medium on the same day: the guard that measures the range cannot see the shape.

## ⚠️ A `Record` opens a hole an early return could not

`if (theme !== 'nebula') return` drew nothing for six places in one line and could not be wrong. A
table with a `null` in it can **disagree with the level scripts** — and when it does, the painter blits
an empty sprite at exactly the right position, at exactly the right size, on every frame of that level,
and nothing anywhere says so. The table is still right (0016); the guard is the price of it.

## ⚠️ Every stroked mark was drawn as one path per segment, since 0211

`lineCap` is `round`, so each join was covered twice and composited its own alpha against itself. On a
hairline rim that is invisible, which is every stroked mark this file had. At a tenth of the gas over a
twentieth of a tile it is **a string of beads down the middle of the wall**, and the bench showed it
the moment The Labyrinth's wall faces were drawn. The per-segment loop stays for the thing it was
written for — `Pen` has no variable-width stroke, so a taper has to be one — and is now the only thing
in it.

## ⚠️ Dark is free and lit is not, which is why Ember Nebula gained nineteen marks

[0196](0196-the-backdrop-is-rounded-out.md) measured Ember Nebula at about a third of the contrast
headroom the other five places have, and 0211 concluded from that measurement that nothing there may be
lit. **A dark mark spends none of it** — it darkens the ground the bright inks are read against, which
moves every ratio the right way. So the budget that forbids one lit filament permits nine dark
filaments and twenty globules, and the depth comes from **weight** (0.32 → 0.55 → 0.70) rather than from
light. Saurian Belt and Rime Shelf have the room, and their crests are lit; that is the same
measurement making the opposite call rather than an exception to it.

⚠️ **AND THE CONTRAST GUARD COUNTS CLOUDS AND NOT STRUCTURE, WHICH THIS PASS LEANS ON AND DID NOT
FIX.** 0196's `cloudCover` measures the weather pile; nothing anywhere counts a lit mark. That was
safe when every lit mark in the game was one hairline rim, and this change adds a skyline to two
places and a wall face to a third. **What is claimed is that it is still safe, and the reason is
AREA**: the crests are 0.4% of a tile between them and the wall faces are at a tenth of the gas, so no
pixel gains what a cloud does. **What would actually check it** is `cloudCover` accumulating
`STRUCTURE_OF`'s lit marks by their covered area alongside the clouds — a real extension of a guard
that already exists, not a new one. It is owed, it is not done here, and this paragraph is the record
of that rather than a claim that the question did not arise.

## ⚠️ And a fraction of a tile is not a size until the tile is a number

The first pass at the globules used `0.01` to `0.03` of the tile. `SPRITE_EXTENT.skyNebula` is 200
world units — about a screen — so `0.03` stretched 2.4× along the flow is a **92-pixel slab**, and the
bench showed angular masses across half the screen with the warm glow the place is recognised by eaten
by them. At `0.011` a globule is about 20 pixels, which is a knot in the dust. **Four times out, in the
only direction that is not self-correcting.**

## What is held, and what is deliberately not

| claim | how |
|---|---|
| a planet's skyline is on the lane, and recedes | `tests/places.test.ts`, in lane units |
| the corridor never closes, and the ship fits down it | same, against `SPRITE_EXTENT.ship` |
| it branches | same |
| the heart changes size, in CSS pixels | same, through `paintScene` |
| two thumps and a rest, and no step at the wrap | same |
| no level places a landmark where none is drawn | same |
| a non-tapered mark is one `stroke()` | same, through `tests/paths.ts` |

⚠️ **HOW ANY OF IT LOOKS IS A TASTE AND IS NOT GUARDED.** How lumpy a column is, how many globules a
nebula carries, whether a heart reads as an organ — 0192 asks *name a change to the content that would
redden this and be CORRECT*, and for every one of those the answer is *almost any*.
`scripts/shot-place.mjs` is the instrument, and it found six things no number in the repository
reported: a slab of globules, columns with their feet below the frame, a corridor the player was not
in, a shelf that looked like a circuit board, a heart with no light behind it, and the beading.

⚠️ **THREE RIDGES SCROLL AT ONE RATE, AND THAT IS A REAL LIMIT RATHER THAN AN OVERSIGHT.** All of a
place's structure is baked into one tile, so a receding range cannot have the far ridge move slower
than the near one — which is what distance actually does. Fixing it means structure on more than one
sky layer, which is a change to `Sky` and to the bake, and it is not worth it for a horizon in the
bottom quarter of the screen at these speeds. **Written down rather than discovered**, which is
[0029](0029-the-tracked-record-is-the-record.md).

## ⚠️ The music room gets all of it, and that is by construction rather than by a second edit

The standing instruction is *"all changes requested should affect both equally and I shouldn't need to
specify."* [0212](0212-the-room-walks-the-level.md) built the room out of the game's own parts:
`enterRoom` calls `landmarksFor` — the shell's, not a copy — and the same `paintScene` draws it. So a
place's new ground, a new landmark and its `beat` reach the room the moment they reach the level, and
**there is nothing in this change that could have reached one and not the other.**

That is the point of 0212's refusal to let the room have a second description of anything, and it is
worth stating here because it is the first change since that decision where somebody could reasonably
have gone looking for the second edit.

## The shot rig

`scripts/shot-place.mjs` — every place, three camera positions each, straight off `rig/bench.ts`'s own
controls. It reloads the page per shot, because
[0116](0116-the-rig-plays-the-level.md) and [0205](0205-the-bench-jumps-to-where-the-thing-is.md) both
insist the bench is the game rather than a model of it, and the price of that is a parked ship taking
fire from every wave the scrub bar walks past. The first run of it photographed a *Run over* screen
where Saurian Belt should have been. **Nothing in it quiets the sim to suit the camera** — the camera
arrives before the damage does instead.

## ⚠️ And `prove` reported failure over a gitignored log, which is why a harness fix is in an art PR

`npm run prove` returned **774 probes red and an exit code of 1.** Nothing was wrong with a probe and
nothing was wrong with the tree.

It fingerprinted `trees[0]` and judged all six workers against that one manifest, on the reasoning that
six copies of one tree are one tree. They are, **if they are taken at one instant** — and they are taken
one after another, so anything that moves in the source between the first copy and the last is drift in
five trees that no probe put there. `.claude/typecheck.log` is appended to by this repository's own
PostToolUse hook on every edit, and `.claude/skills/ship/SKILL.md` says to start `prove` *"at commit
time in the background"*. **The ritual walks you into it.**

⚠️ **AND THE FILE'S OWN PROSE WAS ALREADY RIGHT** — *"comparing the whole tree to the copy it started
as"*. The code said *the copy the FIRST one started as*. One manifest per tree now, taken the instant
that tree is made, with `fingerprintTrees` split out so the pairing can be broken and seen to redden.

⚠️ **IT IS IN THIS PR BECAUSE IT IS THE COST OF SHIPPING THIS PR, NOT BECAUSE IT IS RELATED.** Without
it there is no exit code to read, and [0199](0199-a-verdict-is-an-exit-code.md) is about a verdict
thrown away by a pipe — this is one manufactured by the check that *is* the verdict.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0220` — eleven breaks, eleven guards red. Two probes belonging to other
decisions were stranded and re-anchored: 0203 (the entry grew `beat`) and **0211, whose break had to
reverse direction**. It pointed Ember Nebula's lanes at `'labyrinth/walls'`, because both places drew
with `crossing` and swapping the stream made them one drawing; The Labyrinth is a sum of sines now and
does not call `crossing` at all, so that edit would have left the two places drawing different things
and the guard **green**. Re-pointing a stranded anchor without re-reading the break is how a probe
survives `tests/prove-guard.test.ts` and quietly stops proving anything.
