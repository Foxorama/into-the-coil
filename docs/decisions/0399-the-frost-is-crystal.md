# 0399 — The frost is crystal

**Accepted 2026-09-28.** The Rime Shelf's end boss is redrawn as a large cluster of ice, a keel with
ten faceted spires grown off it and a red heart frozen in a gem at its core, 54 units across where it
was 33. Its cold is drawn: a haze and three rings of flakes behind the hull, heavily transparent,
turning at three rates so the flakes twirl, and ending exactly where the slow ends. The cold reaches
38 units where it reached 30, so the band between its edge and the hull stays 17. **Amends**
[0253](0253-the-frost-ship-chills.md) and [0264](0264-the-real-bosses-are-drawn.md).

## The ask

> we need to update the graphics on the ice boss, it should be a large crystalline structure and it
> needs to be high tier graphics to match the other bosses that we've uplifted
>
> it also needs to have it's slowing aura actually visible, it does currently slow the ship now, but
> there's no actually visible aura
>
> the aura can't just be a basic circle either, it needs to look like a frosty aura, but not the flame
> aura style we've used elsewhere because it's an effect field not a 1hit death field. maybe an aura
> that's heavily transparent but full of soft light twirling snowflakes or something

## What it was

Photographed on the bench in its first and last phases before anything moved: 0264's polygon, a blue
fish-like hull with a thick black rim, two triangles of lit paint and a red eye, 198 CSS pixels
across on a 1280×720 screen. The cold was 30 units from the hull's centre and nothing drew it; 0253's
puffs at the ship said *you are slowed* after the fact, and nothing said *here is where you will be*.
That is [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)'s class: an event the
model resolves and the picture never mentions.

## What changed

**The crystal** (`boss12`, `src/render/bake.ts`). A keel of ice pointing at the player, and ten
spires grown off its edges, swept back and not mirrored, the two great ones reaching the tile's
corners. Each spire is a hexagonal crystal seen from above: parallel flanks, a bevelled point off its
axis, a lit ridge between a facet toward the light and one away from it, a fracture in the thick of
the big ones and a glint at their points. The outline is **built**, not listed: a spire is placed on
the keel by where along it stands, and the outline walks the edge stepping out round each one, so the
spires move one number at a time and none can overlap into a hole under `evenodd`. The keel is cut
into planes, crusted with rime in the hollows between spires, and carries a six-faceted gem with the
place's eye in it. *"Whatever the ice is keeping"* is the Rime Shelf's own line. Its outline is 0.9
world units on the hydra's terms, because the default share of a 54-unit tile photographed as stained
glass. The hurtbox grew from 13 to 21, the same 0.39 of the drawing.

**The cold, seen.** `Chill.field` is required on the row: layers laid behind the hull, bottom first,
each with a signed spin a step. The frost ship's are a haze (a veil thickening to the rim, a mottled
band of mist, tapered wisps and rime specks scattered along the edge) and three rings of flakes, half
six-armed snowflakes and half motes, each trailing a wisp of its own orbit. `layChill` puts them in
the aura pool's first slots, under the flames, the tail, the hull and every enemy, bullet and the
ship. It swells each to `2 × radius / extent`, so the painted edge **is** the slow's edge from one
number, and turns each on `w.steps`. The rings turn at 0.005, 0.009 and 0.016 rad a step, outer to
inner, which is 57, 75 and 83 px a second at each ring's middle on 1280×720. **Nothing in it is the
frost bullet's ink, and nothing is laid down at half or more.** The shards are saturated cyan with a
dark edge, and a field of snowflakes round the hull that throws them is the one place a decoration
could be read as a bullet.

**The cold reaches 38.** A 21-unit hurtbox in a 30-unit cold leaves a 9-unit ring, most of it under
the spires. What the player flies in is the band past the hull, so the band stayed 17 and the radius
moved. This is a change to the fight and is the call the player may veto.

## The guards, and that each was seen to fail

`scripts/probes/0399-the-frost-is-crystal.mjs`, all in `tests/frost.test.ts`:

| broken on purpose | went red |
|---|---|
| the frost ship drawn at its old 33 units | `THE ASKED-FOR ONE, LARGE` |
| the hurtbox left at 13 under a drawing grown to 54 | `THE ASKED-FOR ONE, LARGE` |
| the cold never laid, so it slows and is not seen | `THE ASKED-FOR ONE, SEEN WHERE IT IS` |
| the field drawn at thirty units while the cold reaches the row's radius | `THE ASKED-FOR ONE, SEEN WHERE IT IS` |
| the haze's rim painted a fifth inside the edge of the cold | `THE ASKED-FOR ONE, SEEN WHERE IT IS` |
| the cold's marks laid down at 0.9 | `THE ASKED-FOR ONE, HEAVILY TRANSPARENT` |
| the cold painted in the frost bullet's own ink | `THE ASKED-FOR ONE, HEAVILY TRANSPARENT` |
| the outer ring thinned to six flakes | `THE ASKED-FOR ONE, HEAVILY TRANSPARENT` |
| the field laid unturned, so nothing twirls | `THE ASKED-FOR ONE, TWIRLING` |
| the inner ring turned at the middle ring's rate | `THE ASKED-FOR ONE, TWIRLING` |

*Seen where it is* traces the haze as the game bakes it, turns its furthest ink into world units by
the swell the frame laid, and parks a ship two pixels inside and two outside that edge: chilled, then
not. That is the picture against the model in the player's units, and not the constant against
itself ([0027](0027-measure-the-picture-not-the-model.md)). The twirl's first probe slowed the inner
ring to the outer ring's rate, and the speed floor fired before the ordering could. It was re-aimed at
the middle ring's rate, which clears the floor, and it is the ordering that goes red.

## Not held by any guard

- **Whether it reads as ice, and the twirl as a twirl, at play speed.** Photographed on the sheet and
  on the bench in two phases and at two moments half a second apart; the motion is frames the pane
  freezes. A play is owed.
- **The one frame the cold outlives the hull.** `layAura` runs before the step's hits land, so the
  field, like a serpent's flames and a fish's tail, is drawn once more under the death burst. The
  guard holds it gone by the next step and says why.
- **Whether 38 is right.** It keeps the band; it also covers more of the lane at the hull's station.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
