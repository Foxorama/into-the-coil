# 0463 — The ships are cooler, and the ray gun is a ray gun

**Accepted 2026-10-02.** A play report on [0461](0461-the-ships-are-jazzed.md), in four asks (the
fifth, the hydra's heads, is its own decision):

> ok can we remove the blue glow from under the firebird, it doesn't look that great
>
> and the ray gun on the caddie looks... still really really bad.
> the noise from the caddies ray gun also doesn't fir the background music or the rest of the game,
> especially with it's high fire rate it needs to be not annoying and also be able to mostly fit in
> with the music on each level.
>
> and I reckon we can do another pass over all the ships to make them look cooler, they're looking
> really good now, but they're just not quite there yet.

## The rule

| | was | is |
|---|---|---|
| **the cars' neon** | the player's cyan glowing under both cars | gone, under both |
| **the cars' cyan** | a solid band a door deep | a pinstripe: the Firebird's shoulder line, the estate's strip along the top of its burl |
| **the phoenix** | a gold blob on the cyan band | gold on the lacquer: its body and crested head toward the nose, a wing raised under the glass, its tail in the shot's orange trailing to the rear wheel |
| **the Firebird's spoiler** | solid gold | the lacquer, a gold edge along the wing |
| **the estate's burl** | the gilt darkened | a warm wood (the gilt turned toward the shot's orange, darkened), its gilt burnished harder, a highlight down the bonnet |
| **the fighter** | lit to near white | lit deeper (`+0.15` to `−0.4` where it was `+0.3` to `−0.22`), and its wingtip pods shaded front to back |
| **the ray gun** | two lavender rings growing toward the muzzle, a white cone | a chamber on the saucer's face ahead of the dome, a chrome barrel with the rings' light down it, two chrome fins swept toward the muzzle and smaller the further forward, and an orb of light at the tip |
| **the ray's cue** | a sine falling two octaves from 1.2 kHz, on the fourth | a saw an octave over the root falling to it under a lowpass closing from 2.6 kHz to 320 Hz, a quiet triangle an octave above, and the guns' shared sub |

## Why each is the shape it is

**The gun was a spool because its rings grew toward the muzzle.** Photographed at the shipped
camera, 0461's gun was thirteen pixels of lavender with the bigger flange in front — the outline of a
cotton reel, and in one colour, so it read as a blob. A ray gun's outline is the reverse: a bulb at the
back, fins that shrink toward the muzzle, a ball of light at the end. So the outline points, and the
purple is only where the energy is — the chamber, the line down the barrel, the orb — on chrome. The
fins were first tried with lavender trailing edges, and at four times the camera the whole gun went
pale on pale; they are metal lit from above and nothing else. The tip did not move (1.13 of the box),
so the row's `muzzle` and `tests/mounts.test.ts` are unchanged; the rim meets the first fin's swept
edge where that edge crosses the disc, solved rather than placed, so no sliver of hull shows.

**The cue was a pitch, and the music moves under a pitch.** `scripts/weigh-cue.mjs --loud` on the
four guns:

| | sub | lowmid | himid | loud (A-weighted) |
|---|---|---|---|---|
| pulse | 0.071 | 0.889 | 0.985 | −48.6 dB |
| arc | 0.100 | 0.259 | 1.000 | −48.2 dB |
| throw | 0.036 | 0.392 | 1.000 | −48.3 dB |
| **ray, was** | 0.020 | 0.047 | 1.000 | **−41.2 dB** |
| **ray, is** | 0.088 | 0.948 | 1.000 | **−50.4 dB** |

It was **seven decibels louder** than every other gun, at seven and a half volleys a second, with its
weight in the band the ear is most sensitive to and almost none below. And its note was the fourth,
which over the C, F and G bars the places' progressions move through is a passing note at best. What
says *ray gun* is the vowel — bright closing to dark — so a lowpass sweeping a saw says it with the
pitch on the ROOT, the one note every chord in every place shares with the drone, which is the same
reason the pulse's tail lands there ([0099](0099-the-cues-are-in-the-key.md)). Its resonance is 2.2,
under `CueLayer`'s *past about 2 it starts being a pitch* by a hair and under the suite's 4. It sits
1.8 dB under the pulse — under it because it never stops, and not by more because a gun that cannot be
heard is not a gun. The row's gain is unchanged: [0145](0145-the-gun-makes-room.md) holds every gun's
under every outcome's, and the level moved in the layers.

**The cyan went thin because at its floor it could not be paint and be thin.** A solid mark has to
clear 2.5 CSS pixels ([0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)), and both bands were
1.8 of the predecessor's units — exactly that floor — so the cyan was as thin as a fill could be and
still the deepest thing on either flank. A pinstripe is a stroke at 0.055 of the box, held to the
silhouette as a fill is (`tests/accents.test.ts`, 0276), and it found both first drafts over the edge —
the Firebird's starting above the deck, the estate's crossing the foot of the windscreen. Each was
moved inside, not exempted. Every ship still carries the player's cyan
([0441](0441-a-pilot-flies-their-own-ship.md)).

**The neon went from both cars because it was one thing on two.** The ask named the Firebird; the
estate wore the same cyan smear between its wheels for the same reason, and an art item is the whole
picture.

## What guards it

Nothing new. Every change is a taste in [0192](0192-a-guard-holds-an-invariant.md)'s sense — no change
to the content would redden a guard over *the gun points* and be wrong — and what is invariant about
these drawings is already held: `tests/accents.test.ts` (every mark on its hull and thick enough to be
drawn, every stroke inside the silhouette), `tests/mounts.test.ts` (the shot leaves the orb),
`tests/sound.test.ts` (every pitched layer between two notes of the key, the gun under its own
cadence, every gun under every outcome).

**Photographed** off the sheet at four and eight times, in the bench at 1600×900 for all four ships
(cropped and enlarged), and the saucer in the intro's hangar, where the side view carries the same gun
without the chamber — it is behind the lens.

## What it does not do, and what the player may veto

- **Every drawing above is a taste.** The phoenix's flame tail and the fighter's deeper shading are the
  two largest moves; either goes back in one edit.
- **The estate lost its neon without being asked.** One edit puts it back.
- **The ray's cue is owed an ear.** It is measured, not heard: the dashboard plays it at the gun's
  rate over any place's music.
