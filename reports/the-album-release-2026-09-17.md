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
| release type | Album — eight tracks, 20:59 |
| primary genre | Soundtrack |
| secondary genre | Electronic |
| language | Instrumental (no lyrics) |
| explicit | No |
| label / copyright line | Vulpecula Games (the ℗ and © lines take the release year) |
| cover | `cover.jpg`, 3000 × 3000 px, JPEG — the seven places of the game in the order you fly them, with the title; no URLs, handles or prices, which every store refuses |
| audio | WAV, 44.1 kHz, 16-bit stereo, one file per track |
| loudness | every track −14.0 LUFS integrated, true peak −1.7 dBTP or lower (Saurian Belt −2.8) — the level Spotify plays at, so nothing is turned down or squashed on the way out |

## The tracks

| # | title | file | length | what it is |
|---|---|---|---|---|
| 1 | Into the Coil | `01 Into the Coil.wav` | 2:07 | The title screen's groove grown into a piece: the drone wakes, the riff and a distant heartbeat arrive, a lead states the game's theme, a flute breakdown, everything back, and an ending. |
| 2 | The Approach | `02 The Approach.wav` | 2:38 | Level one: the base composition the whole game grows out of, its climb to the first fight, and a coda. |
| 3 | Ember Nebula | `03 Ember Nebula.wav` | 2:40 | A cathedral in a furnace — choir and organ first, the fire under them after, the organ's three high notes bouncing between the ears. |
| 4 | Saurian Belt | `04 Saurian Belt.wav` | 2:38 | The floor-filler: a kit that leads, a supersaw riff, a raptor's call, tom fills that cascade from the left ear to the right. |
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

## Not done, and why

- **Canvas videos** — declined for this release.
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
dither; re-measure and repeat until within 0.15 LU. The cover is `C:\itc-renders\art\cover.html` photographed at
3000 × 3000 by Chromium.
