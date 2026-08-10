# 0107 — A level is a place, and the aura is a level-long build

**Accepted 2026-08-10.** Items 2, 3 and 4 of
[the-eighth-play-test](../../reports/the-eighth-play-test-2026-08-10.md).

**The first time anything in this game distinguishes one level from another**, and it closes
`docs/game.md`'s *"no level is themed yet"*, which has been true since there were levels.

## The rules

**A level names a THEME, and a theme may only touch what carries no meaning** — the backdrop, and how
the music is mixed. Never an ink a player has to find.

**A theme's music is a MULTIPLIER over the ladder, never a ladder of its own.**

**The aura is a level-long build as well as a proximity cue, and the two are combined by a maximum.**

## What was asked for

> *"The music is a great baseline now, but it's the one track repeating for minutes and minutes and
> minutes. It does get slightly interesting when the boss starts to appear, but then goes back to the
> same track."*

> *"The aura music for the boss needs to start about 15-30secs into the start of a level and then amp
> up until you beat the boss."*

> *"And the same music and boss music repeats level after level after level… the music for the next
> level needs to be different so it doesn't feel like just one level over and over again."*

> *"I think we're close to the part where we need to introduce the biomes and level themes now to
> start differentiating levels."*

## The scope was put to the player, and the measurement decided the shape

⚠️ **Asked and answered: a theme row per level carrying sky, palette and music** — generic places
rather than the fourteen *Far Carry* biomes, so no predecessor material is opened and a biome NAME
drops onto a row later without rework.

⚠️ **AND HOW THE MUSIC VARIES WAS DECIDED BY A MEASUREMENT RATHER THAN A PREFERENCE.** The eleven
loops cost **862 ms and 11.3 MB** to bake, of which the pitched layers are 858 ms and 10.2 MB:

| | bake | RAM |
|---|---|---|
| the whole loop set | 862 ms | 11.3 MB |
| pitched layers only | 858 ms | 10.2 MB |
| **seven transposed themes** | **6.0 s** | **72 MB** |

**Seven pieces is not a thing to hold in memory** on the mid-range Android
[0022](0022-frame-rate-is-a-feature.md) sizes for, and not a thing to synthesise at a boundary
[0076](0076-a-level-has-an-origin.md) says keeps the scene.

⚠️ **So a theme mixes rather than replaces.** It carries a gain multiplier per layer over
`MUSIC_LADDER`'s own rung, and each level is a different arrangement of one set of material. Nothing
is re-baked, nothing is allocated.

| theme | leans on | RMS against the neutral |
|---|---|---|
| `approach` | — the identity | 0.00 dB |
| `nebula` | drone+ chords+ arp− hook− | +0.41 dB |
| `debris` | engine+ groove+ drone− chords− | +0.26 dB |
| `rime` | arp+ hook+ engine+ drone− groove− | +0.01 dB |
| `forge` | groove+ drone+ engine+ arp− hook− | +0.67 dB |
| `bloom` | hook+ chords+ arp+ groove+ | +0.31 dB |
| `core` | drone+ lead+ drive+ engine+ hook+ | +0.53 dB |

**The loudness barely moves and that is correct** — a place rebalances the piece rather than turning
it up. What changes is which parts of it are in front.

## A theme may not touch an ink that carries meaning

⚠️ **[0024](0024-the-accessibility-floor-is-settings.md) makes the palette a SETTING**, so a theme
that recoloured `enemy` or `pickup` would be either an accessibility setting the player did not
choose or a difficulty change, and 0024 bans both. What a theme changes is the two roles that exist
precisely to carry no meaning — and only the backdrop, at that.

⚠️ **The backdrop is a value PER PALETTE rather than one colour**, which is what makes it compose
rather than override. `tests/themes.test.ts` drives every ink of every palette against every theme's
backdrop and refuses one that drops below the 4.5:1 floor — the cross-product, because the failure is
a single cell of it.

⚠️ **AND A SECOND BOUND, BECAUSE CONTRAST ALONE IS NOT ENOUGH.** A bright backdrop can clear the
luminance floor and still be a level played on a wall of colour — the starfield would vanish into it,
since [0065](0065-the-sky-is-baked-and-blitted.md) draws the sky to sit just above the void rather
than to be legible on anything. So a backdrop must stay within 2:1 of the palette's own `space`:
**what a theme moves is the hue of the dark, not the dark.**

⚠️ **It costs one property write.** `src/render/canvas.ts` holds the clear colour as a field, so a
place is the cheapest visual change the engine has — no re-bake, nothing that can hitch at a boundary.

## The aura is a level-long build now, and 0091's rule is reversed on instruction

⚠️ **The aura existed only while a boss was on the field**, keyed to how close it was — so the one
thing in the music that rose and fell was present for the twenty seconds of a three-minute level. That
is most of *"the one track repeating for minutes."*

⚠️ **`AURA_ONSET_UNITS` is 720, which is twenty seconds** at the camera's 36 units a second — the
middle of the range asked for, and a DISTANCE rather than a timer, so a level authored longer spends
longer building.

⚠️ **THE CEILING IS 0.55 AND THE FIGHT MUST STILL HAVE SOMEWHERE TO GO.** If the level-long build
reached 1 the boss would arrive at the volume it had been at for a minute, and
[0091](0091-the-boss-has-an-aura.md)'s whole subject — *as it gets closer to the player* — would have
nothing left to say. The level climbs to just over half and the fight's own proximity carries the
rest.

⚠️ **AND THE TWO ARE COMBINED BY A MAXIMUM, NEVER A SUM.** A sum puts the aura past the headroom
`tests/music.test.ts` measures the moment a player closes on a boss at the end of a long level —
which is every boss fight in the game.

### 0091's counterweight is reversed, and its probe is re-pointed rather than kept

⚠️ **A guard read *nothing but a boss ever opens it*, and the player has asked for the opposite.** A
rule the player has reversed is not a rule a guard should go on enforcing, so it is rewritten to say
what is still true: **the fight is the only place the aura reaches the top.**

⚠️ **0091's probe broke *the aura opened before the fight*, which is now the feature.** It is
re-pointed at the level-long build being allowed all the way to 1 — the one edit that makes the boss's
arrival free while leaving every ladder assertion green.

## What the proof found

⚠️ **TWO GUARDS WERE WRITTEN THAT MEASURED THEMSELVES, AND `npm run prove` caught both.**

- *The level's peak is below the boss row* — true at a build ceiling of 1 (0.88 against 1.00) and
  completely failing to say what it means. Replaced with a **ratio**: the fight must be able to nearly
  double what the level reached.
- *The build is silent before `AURA_ONSET_UNITS`* — which moves with the constant under test, so
  setting the onset to zero left the suite green. Replaced with the window the report names, **in
  seconds**: silent through the fifteenth, started by the thirtieth.

⚠️ **Eight probes, all seen red**, including the shipped game restored: two levels handed the same
place. Nothing in the repository could see that before, because until now nothing asked whether two
levels were distinguishable at all.

⚠️ **And several existing probes carried the pre-0107 aura zeroes on their REPLACEMENT side**, so each
would have closed the aura at its rung as a side effect and reddened this decision's climb guard
instead of its own. A replacement is a break and must break exactly one thing.

## Rollback

⚠️ **No irreversible surface** — [0001](0001-revertability-not-risk-rating.md). No storage key, no
save field, no cache prefix, no origin. A new content table, a field on the level row, two constants
and a method on the canvas backend. A save written under it loads unchanged, because a level script is
code rather than state.

## What this does not settle

⚠️ **The material is still one piece.** Seven arrangements of eleven loops is not seven pieces of
music, and if *"the same music repeats"* survives this, **the next lever is a second and third
`chords` progression** — measured at 427 ms and 2.15 MB each at the prewarm, shared three ways across
seven levels. It is deliberately not done here: this decision already changes the backdrop, the mix
and the aura, and a fourth axis would make a play-test unable to say which of them worked.

⚠️ **The boss music is still one boss's worth of music.** *"The same music and boss music repeats"*
is answered for the level and not for the fight; the `boss` rung is mixed by the theme like every
other, but no boss brings anything of its own.

⚠️ **The sky is untouched.** A theme carries a backdrop and not a starfield, because the sky is baked
into the atlas and a per-theme starfield is a re-bake at a boundary. Whether that is worth it is a
question for after somebody has flown seven different-coloured voids.

⚠️ **No biome is named.** `docs/game.md` themes the levels on the predecessor's fourteen and this
names seven places of its own; the fiction is downstream of whether theming works at all, and
`CLAUDE.md` allows opening the predecessor for a named file and a named reason. That reason now
exists in a way it did not before — but it wants asking rather than assuming.
