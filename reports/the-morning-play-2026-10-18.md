# The morning play — 2026-10-18

The first play of the two pages built overnight
([`the-play-test-of-2026-10-18`](the-play-test-of-2026-10-18.md) and [`the-run-resets`](the-run-resets-2026-10-18.md)):
*"So far seems really good"*, then four notes. Three are built; the fourth is a question, and its answer and the
choices it leaves are here.

## The notes

| # | the note |
|---|---|
| 1 | *"the main screen menu is using right/left triggers and not right/left shoulder buttons like the hangar. It should also have the RB and LB like the hangin out section does."* |
| 2 | *"the hamster ball needs to show the shield regen rate somewhere as well as the heat gauge somewhere and all of that also needs to be displayed well in mobile somehow as well for the hamster ball."* |
| 3 | *"The boss damage for the hamster ball also needs to be buffed slightly, took all the power ups and still a very long time to kill bosses 1, 2 and 3 — haven't tested later bosses yet"* |
| 4 | *"the supercharge missiles powerful seems to be really strong, how did we implement it and why is it so strong."* |

## Landed

- **Item 1** — [0637](../docs/decisions/0637-the-shoulders-step-the-pilot-on-the-title.md): on the title, which has no
  tabs, LB and RB step the pilot and are drawn at the band's arrows while a pad is in hand. The triggers still work.
- **Item 2** — [0638](../docs/decisions/0638-the-ball-says-its-heat.md): a HEAT gauge in the readout beside the
  shields, gold, hot and pulsing from three quarters; and the next empty shield pip fills from its foot as it
  comes back. Both are in the part of the readout a phone keeps.
- **Item 3** — [0639](../docs/decisions/0639-a-boss-heats-the-ball-less.md): a landing on a boss heats the ball less,
  eight landings to a burn where it was six or seven, about a quarter more landings a second for a pilot minding
  the gauge. Measured first: in the boss fixture the ball already fights at the floor, so its weight could not
  rise without taking those fights under it; the long fight a player has is the cooling.

## Item 4: the supercharge, and why it is so strong

**What it is.** Not a shop ware: a *tube surge*, a special worn for 10 s (`SURGE_STEPS`, `src/content/specials.ts`).
Once both tubes are fitted, a further missile pickup is a charge of the surge its face shows (0577). There are two:

| surge | adds to every volley | damage | pierce | other |
|---|---|---|---|---|
| hunt (seekers) | one seeker down the middle | 2 × 4 = 8 | 1 | fuse doubled, so it flies twice as far |
| overdrive (straight) | one missile down the middle | 3 × 3 = 9 | 12 (`BLADE_EDGE`) | — |

The tubes fire as normal; the pod is one more missile per volley, three volleys a second, even with no tubes fitted.

**Why overdrive is so strong — read off the code, not yet flown.**
- A shot that pierces lands again every 4 steps it overlaps a body, up to its pierce, so an overdrive pod lying
  across a boss can land up to twelve times: 108 damage from one missile.
- Against a boss, none of the brakes the guns have apply to a missile:
  - 0391's ceiling on how often a blade lands is not passed for missiles;
  - 0372's per-gun boss weighting is skipped (*"the missiles and the blast are not the gun's"*).
- Estimated over a boss's hull, about 5 to 8 landings a pod, so roughly 190 to 215 damage a second from the pod
  alone. Two plain straight tubes do about 18, and a full pulse gun 28 to 60.
- One 10 s charge comes to about 1,900 to 2,200 damage, against end bosses of 900 to 1,890 health. One charge can
  finish most of them.
- Hunt pierces once and adds about 24 a second; it is not the outlier.

**How it came to be.**
- 0373 asked for the auto-gun's special to be *"damage increased by 3x and bullets penetrate like shurikens"*, read as
  pierce 12.
- 0375 moved that charge onto the straight missiles.
- 0405 cut the pods from two to one, keeping everything else (*"the ask names the count"*).

The pierce was written for bullets and kept when it became a missile. **Nothing measures a surge against a boss:**
`scripts/weigh-boss.mjs` silences missiles, and 0405 says so.

**What could change it — the player's call, not made here:**
1. **Land a pod on a boss once** (or twice) and let it keep piercing through ordinary enemies. Keeps the *"penetrate
   like shurikens"* feel in a wave, and brings a charge on a boss down to the volley's own 9 a pod: about 27 a
   second.
2. **Give missiles 0391's ceiling on a boss**, as the guns have, so a pod lands on a boss at the blade's rate.
3. **Lower the pierce** everywhere, which also softens it in a wave.
4. **Leave it**, as the strong pickup it reads as, and say so.

And whichever, fly a surge in `weigh-boss` so the number is measured rather than estimated.

**The player's choice, 2026-10-19:** *"Go with option 1 for the supercharge"*. Built as
[0640](../docs/decisions/0640-a-pod-pierces-a-wave-and-not-a-boss.md), with a charge flown in `weigh-boss`
(`--surge=overdrive`). The measured before and after are in that decision's table.

## Owed

- A pad on the title (1).
- The ball's readout in a fight on a phone (2).
- Bosses 1 to 3 in the ball, and the later ones (3).
- An overdrive charge on a boss in play, now that it lands once (4).
