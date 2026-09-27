# 0400 — The heart is the room

**Accepted 2026-09-28.** The Black Heart's last fight is fought in a room with no walls, over the heart,
and the level's own vessels run into it. **Amends [0335](0335-the-fight-happens-in-a-room.md)** — a room
may have no walls. **Uses [0332](0332-the-gyre-is-set-into-the-wall.md)'s `socket`** — the heart is the
seat. **Removes [0220](0220-a-place-is-somewhere-you-are.md)'s heart landmark** from the level.

## The ask

> 3. the boss fight needs to be similar to the labyrinth in that it's a stationary screen, no walls.
> 4. the black heart needs to be set into the screen like the cog boss at the end of the 4th and not
>    show in the background prior to that, with the background level arteries leading to it.
> 6. the jellyfish boss is positioned over the heart at the end of the level.

Items 3, 4 and 6 of a thirteen-item report on the last level. 0401 to 0404 are the rest.

## What it was

The jellyfish bobbed across a level that scrolled on through its fight. The heart was a landmark at
`surge`, a long way off at 0.07 of the camera, beating on the camera's travel — and still on the screen
behind the boss.

## The rules

**A room may have no walls** (`Room.wall: number | null`). What makes a room is the camera coming to
rest ([0335](0335-the-fight-happens-in-a-room.md)); the walls were what made the Labyrinth's a labyrinth.
A room with none lays nothing for the painter, so `w.room` stays `null`; it has no far wall to part, so
it states `opens: 0`. The camera settles over the gyre's 150 steps, sixty units short of the fight.

**The jellyfish is set over the heart.** Its move is `socket`, closing on the lane's middle, with the
heart as its seat, drawn behind it in the aura layer. **A seat may `throb`**: `Entity.throb` is a share
of its size, and the painter multiplies it by the heart's strength this frame. That strength comes from
the music (0401), so the sim never reads it.

**The level's vessels run into the heart.** `VEINS_OF.core.arteries` are five vessels. Each leaves a
trunk of the weather tile `back` world units down the lane from the heart, and meets the heart at
`into`. Each is a cubic that starts on the trunk's own heading, so the join is a branch and not a
kink. **It leaves the trunk where the trunk is drawn this frame.** The weather layer's parallax is
`WEATHER_DEPTH` in `src/content/veins.ts`, read by the sky's table and by `trunkAcross`, so the vessel
cannot float beside its trunk. The painter lays each vessel as capsule lengths end to end
(`paintArteries`), thin at the trunk and the artery's `width` at the heart.

**No landmark.** The heart does not show before the fight.

## What was refused

- **Baking the vessels into the heart's bitmap.** The heart is in the world and the trunks are in the
  weather at 0.09 of the camera. A baked join only meets its trunk at one camera position, and it
  slides off it for the whole of the approach.
- **Putting the weather in the world plane** so a baked confluence could be authored against it. Every
  sky layer is strictly below 1 (`SkyLayer.depth`), for the reason written there.

## What it cost

- **About sixty blits** for the vessels, only while the heart is on the field.
- **`tests/places.test.ts`'s three beat guards** held the heart landmark. They now hold the same
  machinery against the entry the level placed until today. A landmark may still state a beat, and
  none does.

## The guards, and that each was seen to fail

`scripts/probes/0400-the-heart-is-the-room.mjs`:

| guard | the break |
|---|---|
| *the fight stops the screen … with no walls, and the heart is set into it* (`tests/medusa.test.ts`) | the room taken off the row; the seat not beating |
| *the heart is not in the level's background* | the landmark put back |
| *each vessel into the heart leaves a trunk where the trunk is drawn* (`tests/heart.test.ts`) | the vessel's trunk read without the parallax |
| *drawn only where a fight has a heart* | no heart handed to the painter |

## Not held by any guard

**Whether the vessels read as the level's arteries leading to the heart.** Photographed on the bench.
Also unguarded: whether a room with no walls reads as *stationary* rather than stalled. Both are owed a play.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, save schema, cache
prefix or origin is touched.
