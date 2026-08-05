# The flash outlasted the gap between hits, so two hits and one hit drew the same picture

**2026-08-05.** A correction to
[`reports/enemy-silhouettes-2026-08-05.md`](enemy-silhouettes-2026-08-05.md), which read the same
play-test wrongly. The verdict was re-phrased by the player and the second reading found a real
defect that the first reading had explained away.

## What was actually reported

> *"There were slow moving drifters which I interpreted as squares, and then the lancers that moved
> quicker and fired. Some of the lancers flashed white when hit, then I had to wait for the white
> flash to go away and then shoot them again. Some of the same shaped lancers didn't flash white and
> disappeared much faster. I assume it was 1 bullet → triggered flash, 2nd bullet → hit white, 3rd
> bullet → killed enemy, but because of the fire rate it looked like 1 bullet → killed enemy with no
> triggered flash."*

⚠️ **The previous report got this wrong.** It read *"the diamond shapes"* as the drifters and
concluded the whole complaint was the drifter/lancer silhouettes being too alike. The player was
distinguishing the two populations correctly, **by motion**, the whole time. The shapes needed fixing
and that fix stands; it was not what this complaint was about.

## The stated mechanism is not real, and it is worth saying so precisely

*"2nd bullet → hit white"* — a shot absorbed by the flash — would be a serious bug: damage output
would depend on how the fire rate happens to line up with a cosmetic timer. It does not happen. The
only thing `flashFor` gates is which bitmap is drawn, and the gate that could block damage —
`invulnFor` — is never set on an enemy by anything.

Two assertions now say so rather than an argument that it cannot be: a shot landing mid-flash still
damages, and a shot landing mid-flash can still kill. Both are probed.

## What IS real, and it took a measurement rather than an argument

Driving the real frame at the real fire rate, against a lancer at four distances:

| distance | hits land at | gap | flash still running? |
|---|---|---|---|
| 30 | steps 13, 19 | 6 steps (100ms) | **yes** |
| 60 | steps 21, 28 | 7 steps (117ms) | **yes** |
| 120 | steps 38, 45 | 7 steps (117ms) | **yes** |
| 200 | steps 61, 67 | 6 steps (100ms) | **yes** |

The flash was **8 steps, 133ms**. It never once finished before the next hit arrived.

⚠️ **So the second hit drew nothing of its own.** A lancer under fire went white once and died still
white. One hit and two hits produced the same picture, which is exactly why the hit count read as
random — *"sometimes they'd get hit, go white, then need a second shot and other times they appeared
to just die straight away."* The player was not misreading anything. They were being shown the same
thing in both cases.

The gap is stable because it is not really about distance: successive shots in flight sit a fixed
distance apart, and the closing speed converts that into a time.

### The fix, and what is guarded

The flash is **4 steps** now, and the guard is a **relationship, not a duration**: the real frame is
driven and the flash from one hit must have ended before the next connects. Nothing pins four steps
or a fire rate of nine. Raising the fire rate later fails it, correctly — it would have to be paid
for with a shorter flash.

## A hypothesis this report does NOT act on

*"I had to wait for the white flash to go away"* reads as though the white state felt like it was
**blocking** — which is what a white flash means in most games, and what the ship's own
invulnerability blink means in this one. The ship blinks to the same `impact` ink when it cannot be
hurt, and an enemy flashes it when it just has been: **one visual channel, two opposite meanings.**

That is a plausible and slightly alarming reading, and it is written down rather than built, because
it is inference about a player's mental model and not a measurement. The measured defect above
explains the reported behaviour on its own. If the flash still reads as *wait* at four steps, this is
the next thing to change, and the change is a third sprite — a dimmed ship for the recovery blink —
rather than a new mechanism.

## Two things with no representation at all, named for later

**A death draws nothing.** An enemy that dies is released, and that is the whole of it — no burst, no
debris, no sound. *"They just disappeared"* is a literally accurate description of what the code
does. Particles are in 0022's budget and have never been built.

~~**A shot that misses draws nothing either**, so a near miss and a wide miss look the same.~~
⚠️ **Struck the same day** — a near miss is not an event the model resolves at all, so it is not in
this class and should never have been listed in it. The correction and the rule it produced are in
[0036](../docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md#the-rules-own-boundary-found-within-the-hour).

The death is a real one, is not urgent, and is the same class as the finding above: an event the
model knows about and the picture does not mention. It is now drawn —
`reports/destruct-burst-2026-08-05.md`.

---

## The habit that keeps working

Three sessions, three findings, and every one of them came from putting the actual thing in front of
an instrument rather than reasoning about it — a screenshot for the silhouettes, and a stepped
measurement of the real frame for this. The reasoning was confident and wrong both times.
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md).
