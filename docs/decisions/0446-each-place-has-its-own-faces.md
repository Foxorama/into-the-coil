# 0446 — Each place has its own faces

**Accepted 2026-10-01.** The item [0232](0232-each-place-has-its-own-enemy.md) left owed — *"per-place
variants of the SHARED silhouettes are not in this decision … spines, shards and bulbs on a drifter per
place is the next art decision"* — taken further than spines on a drifter.

## The ask

> *"then we can start adding thematic sprites per level for the enemies so that we actually have
> interesting levels instead of the same model being used 7 times with a different colour. sprites
> should be thematic based on ship flight, bullet type, level and boss theme."*

## The rule

**Every place authors its own body for each of the eight kinds the levels share** — drifter, lancer,
weaver, turret, charger, warden, spinner, sower. `src/render/foes.ts` holds a `Roster`
(`Record<SharedKind, FoeBody>`) per place and `bodyOf` reads a `Record<ThemeKind, Roster>`, so a place
that has not said what its drifter is does not compile, rather than quietly flying level one's — the
table is the guard, on [0016](0016-a-hub-enumerates-kinds.md)'s terms. The Approach's roster is the
eight drawings every place used to share (`APPROACH_BODIES` in `src/render/bake.ts`), unchanged.

**A body is a creature or a machine native to its place, whose silhouette still says what its kind
does** — [0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md). A lancer
still points down the lane and is the widest at its back; a turret still has a flat gun face and a
dome behind it; a weaver still lies across the lane it weaves along and a charger along the lane it
charges down; a warden is still an aperture with a hole the sky shows through and three eyes on its
front; a spinner is still four arms off a hub; a sower is still a chevron. Where a kind fires more
than one shot, its body says how many: the three cracks, horns, slits and canals of the turrets'
three-shot spray, the two emitters at a sower's arm ends.

**Nothing but the drawing moves.** No sprite index, row, extent, hurtbox, cycle or behaviour changed.
The atlas has been baked per place since [0195](0195-a-place-has-its-own-sky.md) and `drawKind` already
took the place; a body here is only what the bake draws for an existing sprite in that place. Each
body authors its own three poses ([0410](0410-the-enemies-move.md)) and its hit twin is its own base
under the wash, by construction ([0278](0278-the-flash-is-a-wash.md)). The skin and the motif are
still the place's ([0228](0228-an-enemy-wears-its-place.md)), on every body.

## What each place sends

| | Ember Nebula | Saurian Belt | The Labyrinth | Rime Shelf | The Toxic Mire | The Black Heart |
|---|---|---|---|---|---|---|
| drifter | a cinder, licked by flame all round | an ammonite, arms in its mouth | a quadcopter drone | a snowflake, turning | a toad, kicking | a red cell, tumbling |
| lancer | a comet-wasp, its back burning into three tongues | a crocodile's skull, its jaws working | a stepped delta with two thrusters | a gem cut as a spearhead | a mosquito, its sting forward | a squid, mantle first, arms jetting |
| weaver | three fireballs, each trailing a tongue | a fish's skeleton, swimming | a zig-zag chain of blocks | an ice needle with two pairs of barbs, tilting | a striped leech | a vessel with a knot of pulse in it |
| turret | a slag vent, three lava cracks from its mouth | a horned frill — three horns, three shots | a crenellated tower with three slits | an ice dome hung with icicles | a toadstool, warts on its cap, gills spraying | a jelly's bell, arms out of its mouth |
| charger | a meteor dragging its fire | a gar, its tail beating | a missile | an icicle, crystals at its root | a tadpole, its tail lashing | a stinging cell's barbed harpoon |
| warden | a ring of fire with uneven flares | a jaw of teeth that draw back as it opens | a gear, the gyre's small cousin | a hexagonal ring of ice, spiked | a ring of frogspawn, three eggs looking | a heart valve, three leaflets |
| spinner | a fire-wheel of four forked flames | four crossed bones | a jack of capped arms | four ice blades | a four-lobed flytrap | a four-armed medusa |
| sower | a fire-bird, flame feathers at its wingtips | a pterosaur | a stepped chevron with two emitters | a frost swallow of two crystals | a bat | an artery forking into two swellings |

Each echoes its place's own lord where it can: the gyre's gear in the Labyrinth warden and tower, the
medusa's bell in the Black Heart turret and spinner, the quetzal's wings in the Saurian sower, the
shoal mother in its gar and fishbone, the hoarfrost's icicles in the Rime dome.

## ⚠️ What the picture changed

Every body was drawn on `rig/sheet`'s terms at four times play size and at play size, and the six places
photographed on `rig/bench.html` mid-level; what the first drafts got wrong was all findable that way
and none of it by a guard.

- **The first ring of fire was a saw blade.** Twelve even tongues round a ring read as a circular
  saw at every size. Uneven flares at uneven places read as fire; even teeth read as a machine, which
  is the Labyrinth's gear and is right there.
- **The first red cell was the gaze.** A red disc with a dark dimple and the drifter's eye in it was
  the Black Heart's own signature at a smaller size. A cell's middle is the THIN part, so it is pale,
  and it has no eye.
- **The first toad was a beetle** — thin limbs on a small body. Toads are legs; the legs doubled.
- **Three outlines were too close to The Approach's to count as new models**, and only the new guard
  saw it: the Labyrinth's chain of blocks and the Mire's leech were 1.8 and 1.5 px from the plain bar,
  the toadstool 1.5 px from the half-disc. The chain staggers now, the leech is fat in the middle and
  thin at its ends, and the toadstool's rim curls down past its gills.
- **A bounding box round an S is the wrong measure of which way a body lies.** Held over every frame,
  the axis guard flagged five new weavers' bent poses whose rest drawings are 2.2 to 3.3 times as long
  across as along. It reads the rest drawing; how far a body bends is `tests/cycles.test.ts`'s.

## ⚠️ Built on first use, because the two files import each other

The drawing kit — `poly`, `motif`, `eye`, `bent`, the poses — lives in `src/render/bake.ts`, which asks
`foes.ts` for a body. So `foes.ts` calls nothing it imports while it is being evaluated (it restates
`bake.ts`'s identity pose as `STILL` for exactly that reason), and `bodyOf` builds the table on its
first call, when The Approach's roster exists. The first draft did call `REST` at load and the sheet
came up blank with a `ReferenceError`, which is how it was found.

## Guards

`tests/faces.test.ts`:

- **THE REPORTED ONE, in CSS pixels** — no two places draw a shared kind as the same silhouette: every
  pair of places' rest outlines of each kind are at least 2 px apart on a 1280×720 screen, 0410's
  floor for *a different picture*. The ask's *same model with a different colour* is a claim about an
  outline, so the guard is about the outline and not the paint.
- **and every place's weaver lies across the lane, and its charger along it** — 0228's sentence, held
  over seven drawings of each where it was stated over one: twice as long one way as the other.

And four guards that measured The Approach alone now measure every place, because each place's
drawings are now its own: `tests/cycles.test.ts`'s 2 px of motion across a cycle,
`tests/signature.test.ts`'s *no two kinds share a silhouette*, and `tests/accents.test.ts`'s one
outline per body with every stroke inside it — that last over every ENEMY in the six other places and
every body at The Approach, because every body in every place took 153 s alone and timed out at the
file's 150 s, and the bosses whose curved hulls cost that are one drawing in every place.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0446`:

| broken on purpose | went red |
|---|---|
| Ember Nebula sends The Approach's eight in its own colours — the report, put back | `THE REPORTED ONE` |
| Ember Nebula's fire-chain swollen into a blob | `and every place's weaver lies across the lane` |
| Rime Shelf's snowflake given three poses that are all its rest | `in pixels: every enemy's outline moves` |
| the Toxic Mire's spinner drawn as its warden | `and every signature is a new silhouette against every other enemy hull` |
| Ember Nebula's vent cracks run past its rim | `is more fills in the SAME bitmap` |

Each of the last three is in a place other than The Approach, so the guard as it stood would have stayed
green over it. 0228's *charger sealed and left flat* probe was re-anchored on The Approach's row of the
table, where the code it breaks moved.

## What it costs

No bitmap more: the six places' bodies are drawn into the sprite indices that already existed, in the
atlas each place already baked. `tests/bakes.test.ts`'s bake budget is green over it. Nothing here runs
in a frame.

## Owed

- **A play in every place, at speed.** Every body was judged on the sheet and photographed standing
  still on the bench; whether a toad reads as a toad while it roams, and whether any is too busy, is
  the player's. Any of the 48 is the user's to veto.
- **The swift is still one drawing in all three places that send it** (The Approach, Ember Nebula,
  Saurian Belt). It is Volans's escort, sent by levels as well; its painter takes no place.
- **The holds are the kind's, and the animals are new.** A snowflake turns and a toad kicks at the
  drifter's `BEAT` and hold of 10; `EnemyRow.cycle` is per kind, not per place, so a body that wants
  another rhythm is a change to the row's shape.
- **`docs/state-of-play.md` is not rewritten here**; another session holds it.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Art baked at load; nothing persisted.
