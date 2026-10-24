# 0667 — Play asks of Venoma

**Accepted 2026-10-24.** The first read of [0666](0666-venoma-flies-the-viper.md), answered:

> *"Make the flame the intro colour flame, there's no way a player will get confused with her flame and the serpents
> colouring. Distance of her shots needs to be 75% of the screen and the acid should splat like the paintball, but have
> a hiss noise like it's sizzling and burning through. Sounds for her attack also need to sound different and better and
> need to be listenable better with the constant autofire. And fix the show owned so it's just Owned or something."*

## The rule

| | |
|---|---|
| **her flame** | `wyrmFlame` on `src/content/flames.ts`, the Viper's own (`from: 'viper'`, no price): the port's `VIPER.flame` round `VIPER.core`, the violet the intro sees her leave on. The Viper's row burns it as it comes |
| **her range** | `range` on a gun's row, a share of the screen's long side, in place of 0666's `life` in steps: the acid's is 0.75. The frame turns it into a lifetime against the view the player has (`firePaint`, and `firePulse` for a straight gun that names one), as the Catherine wheel's reach is a share of it (0549) |
| **her splat** | the acid is a paint gun now — the marker's flight, `splat`, with one colour in its hopper: the spit in flight, and `acidSplat` where it lands, a blast on the splat's terms that lands on everything inside it once. Its mark is a puddle of venom that fizzes while wet (`drawAcidSplat`) and is then a faint scorch. `firePaint` fires a gun's `shots` balls fanned as a straight gun's barrels are, each scattered and coloured on the paint stream; the marker fires one, so its draws are unchanged |
| **how long a splat is wet** | `wet` on a paint row, where every splat was `SPLAT_WET` 10 steps: the marker's 10, the acid's 40, since the fizz is what says it burns |
| **the damage** | a spit 0.9 and its burn 0.6, where a spit was 1.5 alone: four landing on one body take off what they did. The burn's reach is what is new |
| **her sounds** | the spit (`spit`) is a wet drop — a breath of soft noise, a sine from the fifth onto the root an octave up, the guns' shared bottom — shuffled on the pulse's figure and quieter than it. The hiss is the burn's (`acidHiss`, the paint row's `lands`): a sizzle of high noise cooling, four crackles across, a low burn under; dry and held, as the marker's splat is |
| **Owned** | Cosmo's toggle is *☐ Owned*, with no hint, the box held to the word by a no-break space |

## Why

**The flame.** 0666 weighed the port's violet against the serpent's void — three degrees of hue — and left her on the
standard flame. Played, the call is that it cannot be mistaken, and the reasons are in the picture: a flame is a tongue
behind the player's own hull, every frame, and never a ring flying at them. 0295 says *consider* the screen and argue it
per case; this is the case argued the other way, by the person who plays it.

**The range as a share of the screen.** The ask is a share of what the player sees, and the wheel's reach is already
written that way. A count of steps was 0666's — sized against the narrowest view, so on a wider one the spray fell
further short — and it cannot be *75% of the screen* on more than one screen.

**The spit and the hiss came apart.** 0666's spit was bright noise held seventy milliseconds through a narrow band, ten
times a second: the frequencies the ear tires of first, never stopping. A gun that never stops is heard as rhythm, so
the volley is a short pitched drop in key, under the pulse's level, on its figure. The hiss is an event — something
burning where it landed — so it is on the landing, over the guns and under the hit, held so four landings in a volley
are one burn heard.

**Owned.** The shop's action hints have no style of their own, so on a phone the label and its hint ran together into
one line, *Show ownedPut what you own…*. Buy and Back have no hint; the toggle has none now either.

## What guards it

`tests/venoma.test.ts`:
- *0666 — the acid*:
  - the spray reaches between 72% and 78% of the screen, from the jaw;
  - a spit splats where it lands with the acid's burn, heard as the hiss and not the marker's splat.
- *0667*:
  - the Viper's flame is the port's own inks, read off `VIPER`;
  - the toggle is *Owned* with no hint;
  - the spit is quieter than the pulse, with no long noise in it, and the burn is heard as `acidHiss`.

`tests/sound.test.ts` reads `src/content/weapons.ts` for the cues a gun names on its row and holds the hiss dry with the
other cues on the fire cadence.

The probes in `scripts/probes/0667-play-asks-of-venoma.mjs` put her back on the standard flame, cut the range to half,
take the burn and the hiss away, make the spray louder than the pulse, and bring *Show owned* back.

**Not held by any guard.** Whether the spit is *better* to listen to is a judgement, made by the reasoning above and not
by listening: the session that built it has no speakers. The play is the test of it.
