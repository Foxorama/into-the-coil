# Into the Coil (Original Soundtrack) — the release sheet, 2026-09-17

The album plan ([`the-album-plan-2026-09-07`](the-album-plan-2026-09-07.md)) turned into files. Everything a
distributor asks for is below, in the order its upload form asks for it. The files themselves are outside
the repository, at `C:\itc-renders\album\Into the Coil (Original Soundtrack)\`; how to make every one of them
again is at the end.

## The release

| field | value |
|---|---|
| artist | Vulpecula Games |
| album title | Into the Coil (Original Soundtrack) |
| release type | Album — eight tracks, 20:36 (corrected 2026-09-23: the eight files total 1236.2 s, and 20:59 was never measured) |
| primary genre | Soundtrack |
| secondary genre | Electronic |
| language | Instrumental (no lyrics) |
| explicit | No |
| label / copyright line | Vulpecula Games (the ℗ and © lines take the release year) |
| cover | `cover.jpg`, 3000 × 3000 px, JPEG — the seven places of the game in the order you fly them, with the title; no URLs, handles or prices, which every store refuses. **Re-shot 2026-09-23** against the painted places; the 2026-09-17 one is four places out of date |
| audio | WAV, 44.1 kHz, 16-bit stereo, one file per track |
| loudness | every track −14.0 LUFS integrated, true peak −1.7 dBTP or lower (Saurian Belt −2.8) — the level Spotify plays at, so nothing is turned down or squashed on the way out |

## The tracks

| # | title | file | length | what it is |
|---|---|---|---|---|
| 1 | Into the Coil | `01 Into the Coil.wav` | 2:07 | The title screen's groove grown into a piece: the drone wakes, the riff and a distant heartbeat arrive, a lead states the game's theme, a flute breakdown, everything back, and an ending. |
| 2 | The Approach | `02 The Approach.wav` | 2:38 | Level one: the base composition the whole game grows out of, its climb to the first fight, and a coda. |
| 3 | Ember Nebula | `03 Ember Nebula.wav` | 2:40 | A cathedral in a furnace — choir and organ first, the fire under them after, the organ's three high notes bouncing between the ears. |
| 4 | Saurian Belt | `04 Saurian Belt.wav` | 2:32 | The floor-filler: a kit that leads, a supersaw riff, a raptor's call, tom fills that cascade from the left ear to the right — and it ends on the drums alone. |
| 5 | The Labyrinth | `05 The Labyrinth.wav` | 2:37 | A corridor, and something breathing in it — footsteps, a limping spiral, a pursuit. |
| 6 | Rime Shelf | `06 Rime Shelf.wav` | 2:37 | Glass that rings and cracks, and the weather coming in over it. |
| 7 | The Toxic Mire | `07 The Toxic Mire.wav` | 2:40 | Still water with something under it. |
| 8 | The Black Heart | `08 The Black Heart.wav` | 2:43 | Four movements under one heartbeat that quickens: a piano and flute lament, the same song faster, an orchestral ballad that climbs to its summit and walks back down, and a sombre acceptance into the last fight. |

**Every level track is the level as the game plays it**, start to boss, then **fifteen seconds of its fight** —
*"not have the boss music going on for so long because it's a bit repetitive when you're not fighting a boss"* —
then **the walk down**: the level's opening returns for eight bars, reached by the same section change the level
uses everywhere else — *"an abrupt shift from boss music → 4 bars → end"* was the first version — and **a coda**
is struck under it as it lets go: six bars in the place's own instruments (its pad, drone, lowest note, lead and
kit, each taken from a layer the place actually plays; The Black Heart's heart beats twice more), ringing into the
fade that ends the file. No sound effect, gun, death or cue is in any file.

## Suggested album description

> The complete soundtrack to *Into the Coil*, a shoot-'em-up that flies you through seven places towards the
> black heart of the galaxy. Each track is a level's music as you hear it in the game — the journey, the fight,
> and an ending — beginning with the title theme and closing on The Black Heart, a lament for the end that
> becomes a ballad and settles into acceptance, underscored by a heartbeat that quickens all the way down.

## What a distributor asks that this sheet cannot answer

- **Songwriter / composer credit** — Spotify's form wants a person's legal name (Spotify for Artists shows it as
  a credit). Vulpecula Games can be the artist and the label, but the composer field is yours to fill.
- **Which distributor.** Spotify does not take uploads directly; DistroKid, CD Baby, TuneCore, Amuse and others
  do, and each assigns the ISRC for every track and the UPC for the release — do not invent them.
- **Release date.** Allow two to four weeks between upload and release so the store review and Spotify's
  pre-release pitching window both fit.
- **Artist profile image** (for Spotify for Artists, after release) — any of the place frames in
  `C:\itc-renders\art\` at 3000 × 3000 would do, or the cover.

## The videos — added 2026-09-23

Declined on 2026-09-17 *"because I still had to do the background level improvements"*; asked for once the
seven places were painted (#389–#398). **Every one of them is the music room's own flythrough of that place,
recorded from the shipped page** — the game's art, not a mock-up of it — and they live outside the repository
at `C:\itc-renders\video\`.

| what | where | the file |
|---|---|---|
| a video per track | `youtube\` | 3840 × 2160 at 60 fps, the mastered WAV as AAC 320k, the track's own length. A title card — number, name, album, artist — fades in at 1.5 s and is gone by 10 s, clear of the lane the ship weaves in; the picture fades in over a second and out over the last four |
| the whole album | `Into the Coil (Original Soundtrack) - Full Album.mp4` | the eight joined without re-encoding, 20:36. `chapters.txt` is the description's chapter list |
| a Canvas per track | `canvas\` | 1080 × 1920, **8.0 s**, silent, 1.4–3.5 MB. Its last second dissolves into its first, so it loops |
| the long vertical | `vertical\` | the whole title tour at 1080 × 1920, silent — **not a Canvas**, see below |

**A Canvas is three to eight seconds and both ends are hard**, which is why the tour that blends the places
could not be one. Spotify's own upload panel states only the ratio, the height and the format, so the length is
worth re-reading before the upload rather than trusted from here.

**A Canvas is a CROP of the widescreen picture and not the picture turned on its side.** The game refuses a
portrait window ([0031](../docs/decisions/0031-landscape-is-the-shipped-orientation.md), over
[0023](../docs/decisions/0023-the-long-axis-is-the-scroll-axis.md)'s long axis), and some of the art has an up — Ember Nebula's spires, Saurian Belt's volcanoes
— so a rotated frame would lay them on their side. Each Canvas is a 9:16 slice of the 4K frame, its moment and
its crop chosen off a contact sheet of the master: the volcano erupting, the heart passing, the ship crossing
the Labyrinth's walls. The picks are in `picks.txt` beside the files.

**Track 1 has no level, so its picture is a tour of the seven**, in flying order, blending **on the title
track's own section changes** — `TITLE_SCORE` is 8, 8, 16, 16, 8 and 16 bars at `BAR_SECONDS`, which is six
sections for seven places, so the sixteen-bar groove is halved at its own eight-bar mark. The Black Heart takes
the last section and the ending with it.

⚠️ **THE FIRST CUT OF THESE WAS MADE FROM A FROZEN ROOM.** The music room is a screen that does not step, so
the volcano's rock, the Mire's bubbles and the Heart's vein beads stood still in every recording of it —
[0362](../docs/decisions/0362-the-room-has-a-clock.md) is the fix and the report that found it. The masters
made before it are kept at `video\master\frozen-room\`; **a recording of the room made against anything older
than 0362 shows a volcano that does not throw.**

## Not done, and why
- **The coda in the game.** The album renders it; the game still loops the fight until the boss dies and has no
  ending rung. `src/content/codas.ts` is written so the game can read the same table when the coda rung lands
  (the plan's step 3).
- **The title track in the game.** The title screen still loops its two bars; `src/content/title-track.ts` is a
  score the game could walk on a clock (the plan's step 5).
- **A title screen and a trailer.** The game has neither; they are not audio work and are their own job.

## Making the files again

From the worktree (node from `docs/machine.md`; ffmpeg is on this machine under WinGet's Gyan.FFmpeg):

```bash
node scripts/hear.mjs --level=approach --album --cold --out=C:/itc-renders/album-draft3/t.wav
node scripts/album.mjs --title --out=C:/itc-renders/album-draft3/t-album-title.wav
npx vite build
node scripts/album-art.mjs --out=C:/itc-renders/art --size=1500 --scale=2
```

The level renders take one command per level kind (`approach`, `descent`, `coilward`, `shoal`, `batteries`,
`gauntlet`, `eye`). Mastering is ffmpeg: measure with `ebur128=peak=true`, apply the gain to −14 LUFS, then
`alimiter=limit=0.82:attack=4:release=60:level=false`, and write `pcm_s16le` at 44.1 kHz with triangular
dither; re-measure and repeat until within 0.15 LU.

**The videos** are one command per place, at the track's own length, and then ffmpeg:

```bash
node scripts/album-video.mjs --place="Ember Nebula" --seconds=160.4 --out=C:/itc-renders/video/master/"03 Ember Nebula".mp4
```

Every frame it records is exactly one 60 Hz step, so the picture walks the level at the same 36 units a second
`scripts/timeline.mjs` renders the audio at and the two stay together with no sync mark. The cutting — the title
card, the fades, the audio, the 9:16 crop and its loop, the join and the chapter list — is four shell scripts
beside the files: `cut.sh`, `card.mjs`, `tour.sh`, `album.sh`. **A master takes about 45 minutes and three run at
once comfortably**; the whole album is an afternoon.

**The cover** is `C:\itc-renders\art\cover.html` photographed at 3000 × 3000 by Chromium, over seven place frames
from `scripts/album-art.mjs`. Re-shot 2026-09-23 against the painted places (#389–#398), at **90 s of each walk**
rather than 12 s, because that is where a place is doing what it is for — the belt's volcanoes erupting, the heart
in frame (112 s for that one, which is where it reaches the middle). Two things a band must not show, both found by
looking: **the dashed lane marker**, which is the game's furniture and not its art — the bands are drawn at 3300 px
so it falls outside — and **the ship in more than one band**, which reads as a repeat rather than a journey, so
every band but the first is placed off the ship's lane.
