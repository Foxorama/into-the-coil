# 0364 — The view zooms out

**Accepted 2026-09-24.** Changes the number [0023](0023-the-long-axis-is-the-scroll-axis.md) fixed the
lane at, and keeps every rule 0023 hangs on it: the lane is still one constant, still fully visible on
every device, and still the difficulty axis. **Extends [0080](0080-the-box-is-the-screen-and-the-screen-is-16-9.md)**
— the box is still the 16:9 screen, at the new scale.

## The ask

Played on a phone in landscape, then on a monitor:

> *"the enemy spawns, firing, visible screentime etc are all much much better than desktop … desktop
> just has way less overall screen space and the enemies just immediately die most of the time."*

And, when the strip ahead of the ship on the phone was offered as the reason:

> *"the strip doesn't make it play better, the view space makes it play better … the enemy wave's
> screen space time and enemy bullet screen space time is way better."*

## What the difference was

Not tuning. Nothing in the game reads the device except the camera, and the camera sized both
screens by one rule: the lane is 100 units across and the view along is that times the aspect,
clamped to 1.78–2.4. A 19.5:9 phone therefore showed **217 units** ahead against a 16:9 monitor's
**177.8**, at the same speeds — so everything the player watches was on the phone's screen 22% longer.

## The rule

**`ACROSS_SPAN` is 120.** Every size and every speed stays in world units, so this is a zoom: the same
ships, bullets and waves, drawn 1/1.2 the size, with more of the world round them.

| | 16:9 monitor | 19.5:9 phone |
|---|---|---|
| view along, was → is | 177.8 → 213.3 units | 216.7 → 260 units |
| leading edge to trailing edge at the scroll rate | 4.9 s → 5.9 s | 6.0 s → 7.2 s |
| everything's size on screen | 83% of what it was | 83% |

The monitor now shows what the phone showed. Both follow from the one constant: every along span is
an aspect times `ACROSS_SPAN`, the art is baked at `view.scale × dpr` so it re-rasterises at the new
size rather than being shrunk, and the player's box (`ACROSS_SPAN × MIN_ASPECT`) grows with the view
so a 16:9 monitor still has no strip.

**An authored `lane` is a share of the lane, 0 to 100** — `laneAcross` in `src/content/levels.ts`. The
five hundred wave, pickup and landmark rows keep the numbers they were written with; read as
positions they would all have slid towards the near edge. The one hand-placed across position left
in the content, the coil entrance in `src/content/bosses.ts`, is now `ACROSS_SPAN / 2`, and its
along is moved to the new middle of a 16:9 screen, which is what its note says it was.

## What moved with it, and why each one is the zoom rather than a retune

Every item below was found by a guard going red on the first run, and each is the same sentence: a
number that was a share of the screen had been written as a world distance.

| what | was → is | why |
|---|---|---|
| `PLAYER_INSET` | 0.06 → 0.05 | the margins are half a ship, and the ship did not grow: 6 across and 10.7 along, exactly as before; 7.2 would also have been off the corridor's whole-unit grid |
| every boss `station` | × 1.2 | [0101](0101-the-sky-is-a-hurry-and-the-boss-holds-back.md)'s floor is a share of the screen, and after [0080](0080-the-box-is-the-screen-and-the-screen-is-16-9.md) widened the view with no station moving, the bosses crowded the player until a play report said so. The sentinel fell to 53% here on the first run. Scaled, each boss sits where it did on the glass and its fire has a fifth further to come |
| `AURA_FAR_UNITS` | 145 → 178 | follows the stations; solved against the widest back-of-the-box gap rather than scaled blind |
| mid-boss health, all seven | re-solved | `scripts/solve-mid-health.mjs`, as its header says to after anything that changes what lands; further stations and a wider lane landed less |
| lattice `patrol` | 0.5 → 0.6 | it patrols the whole lane, so its crossing grew by a fifth and its fight became a count of crossings — 15 s or 26 s, nothing between |
| shuriken `speed` | 1 → 1.2 | the player's pace, in seconds across the screen: at 1 it was back to the 2.9 s that *"slightly faster"* was said about |
| `PLAYER_SHOT_LIFE`, `playerShots`, `WORST_CASE` | 80 → 96, 88 → 106, 542 → 560 | the widest view went 240 → 288, so a shot on a 21:9 monitor flies a fifth longer; the pool keeps its headroom and the ceiling moves on [0153](0153-desktop-is-the-target.md)'s terms |
| the maw's swallow point | 35.6 → `ACROSS_SPAN × MIN_ASPECT / 5` | asked as *"20% away from the left screen"* and written as that fifth's value; the value would have been a sixth of the new screen. Written as the expression now, so it follows the next zoom |
| the three uncoil holes' `at`, the title's weave | × 1.2 | positions across the lane, so the axis's hole stays on the far side from the chorus's and the title flies the same share of the screen; the holes' widths are a ship's room and stay |
| `spit` extent | 2.6 → 2.7 | a world unit is 6 px of a 1280×720 screen now, not 7.2, so the five pixels between it and the pulse fell to 4.8 |
| fifteen sprites' marks, the fast sky layer | thickened | [0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)'s 2.5 px floor on the screen the game is judged on; marks sized to sit just over it fell under it at 83% |

**What did not move, deliberately:** every enemy and bullet speed, every hurtbox, every formation
gap, the corridor tiers' narrowest widths (a squeeze is a distance against a ship that is the same
size), and `SHIP_SPEED`. Those are what makes this a zoom rather than a rescale — a rescale would
have multiplied them too and changed nothing the player sees.

**Fixtures that read a world distance as a screen fact** were corrected and say so where they are:
waves placed at 200 that now start on screen, lanes read back as positions, a pushed ship that met a
wall the wider lane had moved, a death fixture that assumed the enemy pool held only its own shot.

**The proof found seventeen probes the zoom had silenced**, almost all breaks or fixtures sized in the
old units, and each is re-sized with a note where it lives. **Two of 0326's were deleted instead**:
they restored closers that used to die at the edge of a 178-unit view before firing, and on the wider
view those bodies live long enough to fire, so the dry stretch they broke towards cannot happen. The
guard they named is still seen to fire by 0259's probe.

## What was rejected

**Slowing the along motion on desktop by 18%.** It buys the same seconds without drawing more world,
but it makes *how fast is that bullet* a property of the monitor, and it answers the time and not the
space the play named.

**Showing a margin round a lane that stays 100.** The view would be 120 across and the ship would be
held out of the outer ten units on each side — a strip, on the across axis, which is the thing the
second quote calls bad.

## What this changes that was not asked for

**The lane is 20% wider in world units and the waves are not.** A formation's gaps, an enemy's
radius and every speed are unchanged, so a pattern covers a smaller share of a wider lane, and the
ship — still 1.7 units a step — takes 1.18 s to cross it instead of 0.98. The game is roomier. That is
the trade the play asked for and it is left for the play to judge; `SHIP_SPEED` and the formation
gaps are the knobs if it is too much.

**The player's pulse is slower on the glass.** At 2.6 units a step it crosses a 16:9 screen in
1.37 s rather than 1.14. The blade's pace was the player's own number and was restored; the pulse's
never was, so it is left, and named here as the first thing to look at if the gun feels sluggish.

**The phone's strip is unchanged in share.** The box is the 16:9 view; a 2.17 phone still shows 18%
more along than the ship can reach, now 47 units rather than 39. Making the box follow each device's
view is the next change and is its own decision, because the box is read by the room walls, rain,
rocks and pickups — the sim would start to vary by device in places it currently does not.

## Why no guard

No invariant is added. *More view is better* is a play verdict about one number, and a test pinning
120 would be a number chosen today asserted against tomorrow. The guards that hold 0023's shape —
the lane is fully visible, the view is uniform, spawns are past the widest edge — are unchanged and
re-run against the new constant.

## What this leaves owed

**A play on both devices.** The phone may now be too small to read: 83% of a size that was already
small at arm's length. If it is, the answer is a per-device camera rather than a different number
here, and it is the *"mobile mode and desktop mode"* the play has already named as likely.
