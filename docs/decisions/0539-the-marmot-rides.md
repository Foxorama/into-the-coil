# 0539 — The Marmot rides

**Accepted 2026-10-05.** Item 2 of [`the-thunderbolt-planned`](../../reports/the-thunderbolt-planned-2026-10-05.md),
with [0538](0538-the-catherine-wheel.md), which moves the guns. A fifth pilot and a fifth ship beside
[0415](0415-the-golfer-is-chosen.md)'s four and [0441](0441-a-pilot-flies-their-own-ship.md)'s.

## The ask

> *"I want to add in The Thunderbolt from Golf-Stars with The Marmot as the pilot riding it, he'll have a
> cool motorbike spacesuit helmet and will have the lightning gun equipped with it's specials as his
> default."*

And, asked while it was planned whether he flies from the first run:

> *"Locked until you beat the game with every pilot (on any difficulty, but must clear it with all four
> starting pilots) - he can show up on the list of random rescuee's with some voice lines before he's
> unlocked as a teaser though."*

## The rule

**The Marmot is a fifth pilot, and the Thunderbolt his ship: a hot-rod space chopper drawn from the side
with him riding it, flying the arc and opening on two storms. He may be flown once Feather Fade,
Huang-Woo Hook, Longshot Larry and Backspin Bo have each beaten the jellyfish, on any tier and any
credits. Until then he is on the pilot band as a dark card that cannot be pressed, the band says who
still has to clear the game, and he is in the Viper's rescue pool with his own lines from the first
run.**

| | |
|---|---|
| **the pilot** | `marmot` on `src/content/golfers.ts`: the Marmot, he/him, from the 19th Hole — *The Far Carry*'s Marmot Bartender, who pocketed golf balls from the trade tents. His row names his body (`figure: 'marmot'`) and every other runner's painter is the default |
| **the lock** | `opensAfter` on every pilot's row: empty for the four, the four for him. `pilotOpen` reads it against the hangar's wins (`won`, a win per ship, which is a win per pilot); the pilot band is shut through the hangar's own `setOpen`, and a press on a shut card is refused in the shell too |
| **the teaser** | nothing: `rescuable` already walks every pilot, so he is found in the Viper — and finds others — from the first run, in five lines each that land for a player who never met him (0426's rule) |
| **his pictures** | a runner on the golfers' own stride — shorter legs under a plump body in a riding suit, a bushy tail, and his helmet with the visor down; a portrait with the visor pushed up, so his face shows in the opening |
| **the ship** | `thunderbolt` on `src/content/ships.ts`, side-on as the cars are, in the predecessor's frame. One outline takes in the bike, his back, his helmet with its ear bumps, his arm out to the ape-hanger bars, and his tail; the gap under his arm is a hole in it |
| **its gun** | the arc, drawn into its body as a lightning ball on the fork crown, where the shot leaves |
| **its kit** | pods on a rack over the rear fender (one, then two); one pipe; tyres on its own rims (*Lightning spokes*); three looks on its tank (a cyan bolt, his paw in gold, gold pinstripes); a shell that is a cage of forked lightning (`storm`); and a hot-rod readout — raked corners, flames along its lower edge and a fork of lightning crackling off its corner (`hotrod`) |

## Why it is built the way it is

**A marmot is a second body, and the row says which.** The golfers are people drawn from a cap, a polo,
skin, hair and a cut, and `src/render/golfer-art.ts` said a fifth golfer would be a row and not a
drawing. That stopped being true at a marmot. Rather than a branch on his name, his row carries what
body he is, and the painter's default is the person every other runner is —
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md).

**The lock is a row and a win record, and nothing new is saved.** A pilot clears the game in their own
ship, and the hangar already records a win per ship for every tier and every credit setting
([0521](0521-the-hangar-opens.md)). *Cleared with all four* is four of those wins. `opensAfter` is on
every row — the four say nobody — so a sixth pilot gated on the Marmot is a row too.

**A shut pilot is the hangar's shut option, not a new mechanism.** The hangar has shown a dash or a gun
that is not yet won since 0521: shown, dashed, unpressable, with the band saying why. The pilot band
takes the same call on the title and in the hangar. A shut card's face is a silhouette, so the player
sees someone is there and not who. The plan offered four small faces lit as each pilot clears; the
band's sentence names who is left, which says the same, and costs no new chrome.

**The rider is silhouette, so everything on him is paint on the hull.** The cars carry their turrets in
their rooflines; the Thunderbolt carries the Marmot in its outline the same way. Every mark on him is
held on the hull and over the floor by `tests/accents.test.ts`, in CSS pixels at the shipped camera —
and the floor decided several things: the neon bolt and the paw print on a two-unit tank are light and
not body, the flame along the frame likewise, the rim's bolt is one fat slash because a zigzag five
pixels across is a smudge, and the outline's arcs under the tyres run a tenth of a unit wide of the
tyres because ten chords cut inside the circle painted in them.

**The predecessor's golf bag is gone.** It stood where the rider sits; the rider is the ask. His pods
stand on a rack over the rear fender where a bag would be strapped.

**Five a row in the hangar.** The dash, gun and special bands put four in one row (0524); with five
ships they put five, at the same height.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). `itc_hangar` reads per ship and a
ship it has never heard of reads as not won, so a document written before this change opens with the
Thunderbolt unwon and the Marmot shut, and one written after it is read by an older build without his
ship. `itc_scores` keeps a row whose pilot it does not know by dropping that row, which an older build
would do to a Marmot score.

## What guards it

`tests/marmot.test.ts`: he is shut until each of the four has won and open the
moment the last does; the band's sentence names who is left; he is in the rescue pool from the first
run with five lines each way; his runner and portrait draw. The Thunderbolt is held where every ship is
— its paint on its hull and over the floor, its muzzle and tubes where its drawing puts them
(`tests/mounts.test.ts`), every borrowed gun on it, and flown in the boss floors as every ship is.
Probes in `scripts/probes/0539-the-marmot-rides.mjs`.

## Owed

- **A play**, once the four have cleared — and before that, a look at him on the band and in the Viper.
- **His art at the shipped camera**, which has had one photographed pass on the sheet: the helmet with
  the visor down reads as a rider more than as a marmot, and his ears and tail are what say who he is.
- **The ear** on his voice, pitched at 1.38.
