# 0092 — The mix is a hand, and the aura was a curve

**Accepted 2026-08-09.** Two reports from the same play-test, landed together because they are the
same knob seen from two ends.

> *"Volume wise, main sfx need to be lowered a bit, background music needs to be raised a bit… The
> boss aura music also was really weak, I didn't even notice it over the fire."*

## The rule

**A mix number is settled by an ear and nothing may assert on its value. What is guarded is the
arithmetic it has to live inside, and the geometry a sound is heard across.**

## Part one: the mix moved twice on the same report, and the first move was measured

⚠️ **[0090](0090-the-music-is-four-loops.md)'s mix pass answered this exact complaint eight hours
earlier**, and it answered it with a number: the four loudest cues at once reached 0.92 of full scale
against the music's 0.52, a ratio of 1.77, and `MASTER_GAIN` 0.55 → 0.45 with `MUSIC_GAIN` 0.34 → 0.44
brought it to 1.12. The arithmetic was right and the report came back unchanged.

⚠️ **The ratio was measuring the wrong pair of things, and it is worth naming why.** `MAX_VOICES` of
the loudest cues landing on one sample is the rarest instant in the game; the music's peak is **every
kick**. Holding the first above the second is a comparison between a worst case and a steady state,
and the ear is listening to the steady state. It is
[0027](0027-measure-the-picture-not-the-model.md) in the channel with nothing to look at — a model
quantity, correctly computed, that is not the quantity being complained about.

`MASTER_GAIN` 0.45 → **0.40**, `MUSIC_GAIN` 0.44 → **0.52**. Peak-for-peak that is 0.67 against 0.87,
so the cues are now *behind* the music at the peak — which is the thing the old comment said must
never happen.

⚠️ **[0024](0024-the-accessibility-floor-is-settings.md) is not violated by that and the distinction
matters.** Every cue is information and the music is not, so a cue must stay *audible*, which is a
statement about a transient against a bed. A snare-shaped 60ms burst at 0.67 sits clean over a
sustained 0.87 pad; it is masked by neither loudness nor band. What 0024 forbids is information the
player cannot get, not a number that is smaller than another number.

⚠️ **AND THE COMBINED BUS IS NOT GUARDED BY ANYTHING, WHICH THIS MOVE MAKES MORE EXPOSED.**
`tests/music.test.ts` sums the music's own layers and refuses a peak past full scale; `tests/sound.test.ts`
bounds four cues before the master. **Nothing measures the two together**, and they run into the same
destination: 0.67 + 0.87 is 1.54, so the loudest conceivable instant in the game — four cues on the
sample a boss-fight kick peaks, in the same direction — clips. It was 1.43 before this change, so the
exposure is not new, and the honest reason it has never been reported is that two uncorrelated signals
do not peak together often.

**The fix is a limiter and it is deliberately not in this PR.** One `DynamicsCompressorNode` at the
end of the master costs no per-frame allocation and closes the class permanently — and it changes the
character of every sound in the game, which cannot be judged by a test and was not going to be judged
tonight. `MUSIC_GAIN` sits at 0.52 against a measured ceiling of 0.597 to leave the margin in the
meantime. **This is the owed item.**

## Part two: the aura was inaudible, and it was not a gain problem

⚠️ **The obvious reading — *it is too quiet, turn it up* — is half right and would have missed the
cause.** [0091](0091-the-boss-has-an-aura.md) multiplies the aura's ceiling by how near the boss is,
and squares the ramp so *"the last few units are where it moves"*. Squaring did that far harder than
the sentence intended.

**Where a boss fight is actually flown**, driven off `BOSSES` and the player's box rather than
assumed:

| | gap to the boss's hull | aura, as shipped | aura now |
|---|---|---|---|
| pressed forward | negative — past the station | 1.000 | 1.000 |
| **mid-box** | 2 to 25 units | **1.000** | 1.000 |
| **back of the box** | 77 to 98 units | **0.004 – 0.040** | 0.31 – 0.06 |

⚠️ **Mid-box was already at the ceiling, so the report is not about the aggressive position — it is
about the defensive one.** A player being shot at retreats, and retreating is precisely what turned
the boss's own sound off. That is the whole defect, and it is invisible from any position a
constant-driven guard would have picked.

Three moves, and they are one change:

| | | why |
|---|---|---|
| `AURA_CURVE` | new constant, **1.6** | The exponent was `clamped * clamped` — **a multiply has no number in it to move**, so the only edits the shape admitted were *square it* and *do not*. 1.6 keeps 0091's property (the near half carries more of the build) and loses the silent middle |
| `AURA_FAR_UNITS` | 105 → **124** | 105 had no argument attached to it. The widest gap the game can present is `lattice` at far drift with the ship at the back of the box: **123.5**. It is `AURA_NEAR_UNITS`'s own reasoning — *a range whose end the player cannot reach* — arriving at the other end |
| the aura's voices | up about a quarter; boss-row `drone` 0.7 → **0.55** | Absolute level was the other half. Raising a layer lowers `MUSIC_GAIN`'s ceiling, so the drone pays for it — a pad and an aura sit in the same low-mid band, and 0090 had already brought the drone down at the boss for exactly that reason |

Net: **1.9× louder at point blank, 4.6× at the back of the box, and audible for the first time past
100 units.**

## What the guards did, which is the part worth keeping

⚠️ **All three of 0091's aura guards stayed green through the defect, and none of them was asleep.**
Silent at `FAR`, full at `NEAR`, the near half carrying more of the build than the far half — every
property 0091 stated is true of a curve that had collapsed to 0.004 where the fight happens. They are
written in terms of the constants they guard, so they prove the code agrees with itself and nothing
else. [0027](0027-measure-the-picture-not-the-model.md) names this and
[0019](0019-a-probe-must-be-seen-to-apply.md) cannot catch it: a probe can only redden a guard that
exists.

**So the two new guards are written in the geometry.** `gapFrom(BOX_BACK, kind)` over every row in
`BOSSES`, and the range checked against the widest gap the content can produce — so a boss authored
further out moves the requirement rather than escaping it, and neither assertion can be satisfied by
editing the constant it is about.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0092-mix-and-aura.mjs`.

| broken on purpose | went red |
|---|---|
| the curve squared again, exactly as it shipped | `0092 — THE DEFECT: a player who backs off to dodge is still inside the aura` |
| the range cut back inside the box | `0092 — THE RANGE COVERS THE BOX, so *far away* is somewhere the player can actually be` |

⚠️ **Two of 0091's own probes had stale anchors after this and `anchorFailures` is what says so** —
both pointed at `return clamped * clamped;` and one at the boss row of `MUSIC_LADDER`. Fixed here
rather than discovered in twelve minutes of CI, which is the thing
[0079](0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md) built that check for.

## What this does not settle

**Whether any of it is right**, which is an ear. `node scripts/hear.mjs --music` writes the layers and
the arc; it cannot write the game.

**Whether the aura now sits under a boss explosion**, which is the one thing nothing could test and
which 0090 already named as the first place to look if a fight is crowded. It is louder in the
direction the report asked for; if it is now *too* present the lever is the boss row and it is one
number.

**The limiter.** Named above, owed, and deliberately not taken tonight.
