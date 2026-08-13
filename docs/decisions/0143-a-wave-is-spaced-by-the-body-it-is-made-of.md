# 0143 — A wave is spaced by the body it is made of

**Accepted 2026-08-13.** A **repeat report**, and therefore a question about what the previous fix
left standing rather than about which number to move next — [0121](0121-a-wave-dies-together.md), and
`docs/state-of-play.md`'s standing rule for exactly this.

> *"Formation of the enemy waves need to be grouped tighter for diamonds and a few others because
> they're spread out and killing a single enemy sounds out of sequence… ideally a player should be
> able to take out a group together and get a nice music reward to the melody for it."*

## The rule

**The gap across a wave is `2 × radius + 1`, resolved from the wave's own enemy.** `ACROSS_GAP` is
gone; `gapAcross(radius)` replaces it, and `WaveEntry.enemy` is a single kind, so the answer is exact
at the spawn with no search.

## ⚠️ What 0121 left standing

0121 answered almost this sentence — *"tighter clusters… the music beats have less impact if you kill
1-2 enemies than if you kill 3-5"* — by squeezing **one constant** from 11 to 9. It was bounded from
above by the volley's width and from below by *the widest enemy in the game*: a radius-4 warden is 8
across, and neighbours that touch spend
[0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md).

⚠️ **SO EVERY WAVE WAS CHARGED THE WIDEST BODY'S PRICE.** A wave of diamonds — drifters, 5.2 across —
was spaced as though a warden were in it, carrying **3.8 units of clear air where it needs 1**. 0121's
arithmetic was right and its scope was one number.

## What it buys, as a count rather than a gap

| kind | width | gap | 4 abreast | inside a 19.75 volley? |
|---|---|---|---|---|
| weaver | 4.4 | 5.4 | 16.2 | **yes — was no** |
| charger | 4.8 | 5.8 | 17.4 | **yes — was no** |
| **drifter** | 5.2 | **6.2** | **18.6** | **yes — was no** |
| lancer | 6.4 | 7.4 | 22.2 | no |
| spinner | 6.8 | 7.8 | 23.4 | no |
| turret | 7.4 | 8.4 | 25.2 | no |
| warden | 8.0 | **9.0** | 27.0 | no — **unchanged** |

⚠️ **THE WARDEN DOES NOT MOVE, AND THAT IS WHAT MAKES THIS SAFE TO JUDGE.** `2 × 4 + 1` is 9, exactly
the shipped constant — so this is a strict tightening for six bodies and a **no-op for the one the old
number was sized for**. Nothing anywhere gets wider, and a verdict that the game got harder cannot be
about the warden.

⚠️ **Three kinds go from three-in-a-volley to four**, which is the ask stated as a quantity: four kills
inside one trigger pull is four `kill` cues on one grid window instead of three.

## What is NOT changed

⚠️ **`ALONG_GAP` stays at 14**, exactly as 0121 left it and for 0121's own reason: neighbours at 14
arrive **0.97 beats apart**, so consecutive kills land on consecutive beats. 0121 changed it to 10
once, and a probe that refused to fire is what established the change was wrong. **The report is about
the across axis, again.**

⚠️ **`CLEAR_AIR` is 0121's unit of air, kept.** What is refused is charging it against the wrong body.

## What is guarded

| | |
|---|---|
| three abreast fit a volley — now **seven claims, one per kind** | ✅ `tests/level.test.ts` |
| **the narrow bodies reach four**, and the drifter by name | ✅ the ask as a count, not as a gap |
| neighbours of every kind still do not overlap — per kind, strictly stronger than the old one-widest check | ✅ |
| a six still fits the lane, asked about the widest body | ✅ |
| nothing allocates on the spawn path | ✅ `tests/budget.test.ts`, untouched — `gapAcross` returns a number |

⚠️ **0121's own two probes are re-pointed rather than deleted**, because the claims they hold are still
the right ones: a spread a volley cannot reach, and bodies that touch. They anchored on
`const ACROSS_GAP = 9;`, which no longer exists.

## ⚠️ What the proof found, and it was a guard rather than the game

`npm run prove` refused to run: `tests/seam.test.ts`'s *THE REPORTED ONE: the ship is drawn in the
same place across the boundary* was red on this branch and green on `main`, reporting **the ship was
not drawn, so this measures nothing**.

⚠️ **THE SHIP WAS DRAWN, ALIVE AND EXACTLY WHERE IT BELONGED.** Measured on the fixture at the sampled
step: `health 994`, never dead, `invulnFor 31` — and `sprite` equal to **`spriteHit`**. A ship inside
its invulnerability window wears its other face, and `shipAt` looked for `SPRITE.ship` alone.

⚠️ **SO THE GUARD DEPENDED ON THE FIXTURE'S DAMAGE TIMING AT ONE STEP, AND ANY CHANGE TO LEVEL PACING
FLIPS IT.** This decision tightened the waves; the fixture took its last hit a little later; a test
about a level boundary went red about a sprite id. The subject of every assertion in that file is
**where** the ship is drawn — never which face — so the lookup now accepts either.

⚠️ **The file already records this happening once in another form** — *a dying ship is not drawn, so
without this the assertion below silently stops measuring anything* — and the `toBeDefined()` line
added then is what caught it again. It did its job twice.

⚠️ **NO PROBE IS PLANTED FOR IT, DELIBERATELY.** Reverting the lookup would redden the seam guard
*today*, because today's pacing happens to leave the fixture invulnerable at that step — and stop
reddening it after any future pacing change, while still applying cleanly. That is a probe that
quietly stops testing, which [0019](0019-a-probe-must-be-seen-to-apply.md) is named for. It was seen
to fail and be fixed, on this branch, and that is recorded here instead.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix. Level content is unchanged; what moved is how far apart a wave's members are placed.
