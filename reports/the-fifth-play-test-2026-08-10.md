# The fifth play-test — 2026-08-10

**Six items, given after playing the build carrying the music work.** Written down because
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md) says a report is a committed file:
chat evaporates between sessions, and four decisions are being written off this list.

⚠️ **It is the FIRST play-test that has ever mentioned the sound**, in either direction, and it
mentions almost nothing else. Two previous reports went by with
[0072](../docs/decisions/0072-a-cue-is-baked-and-played.md)'s twelve cues unremarked, which
`docs/state-of-play.md` had been flagging as a silence rather than a verdict. Three of the six items
below are about audio and all three are about **coherence** rather than about volume, pitch or
taste — which is the thing this project has never had a report on.

---

## The build

The play-test was taken against `main` carrying
[0089](../docs/decisions/0089-a-cue-has-a-body.md) through
[0096](../docs/decisions/0096-the-enemies-play-along.md) — the whole of the audio work, plus the
enemy-fire grid. `docs/machine.md` has the byte-count check; the items below are all about behaviour
that only exists in that build.

## The six, in the player's own words

**1 — The title's metronome does not blend.**

> *"Title screen music isn't quite right. The metronome doesn't fit the other beat. It doesn't blend
> nicely, it sounds like two separate tracks being played at the same time."*

**2 — The level's music does not go anywhere.**

> *"The ingame background music doesn't change and increase in tempo as you progress through the
> level. It's also an incredibly limited couple of repeating beats that's a few seconds of sound
> repeated for minutes."*

**3 — The effects do not mesh with the music.**

> *"The primary and second fire, enemy fire and explosion noises for bomb, enemy and player death
> don't sync into the music properly, they're all close to on beat, but the sounds just don't mesh at
> all."*

⚠️ **"Close to on beat" is a verdict on [0093](../docs/decisions/0093-the-gun-is-on-the-grid.md),
[0094](../docs/decisions/0094-in-time-is-not-in-phase.md) and
[0096](../docs/decisions/0096-the-enemies-play-along.md), and it is a PASS.** Those three put every
cadence in the game on a sixteenth grid and hold the loops in phase with the sim; the report says the
timing arrived and something else did not. That is a different quantity, and identifying which one is
the whole of the work.

**4 — The enemies fire together, and every bullet is the same.**

> *"The enemies all fire at exactly the same time when they appear, all the enemy bullets are exactly
> the same."*

⚠️ **The first half is reported against the build that was supposed to fix it.**
[0096](../docs/decisions/0096-the-enemies-play-along.md) quantises an enemy's fire phase once, at
spawn, and says in as many words that this is what stops a screen of them firing in unison.

**5 — The missiles come out of the middle.**

> *"The missiles now fire from the center of the ship and it looks like only one missile. First tube
> should fire from the top side of the ship — yes it will look off balance, that's the point when you
> only have one. Second tube should fire from the bottom side of the ship — it will now look properly
> balanced."*

⚠️ **The ask carries its own answer to the obvious objection**, which is rare and worth keeping: the
off-balance single is the point, not a cost.

**6 — The sky has one layer and it crawls.**

> *"Background starfield has lost it's multiple layers, there's only one starfield background and the
> background or the screen moves too slow, the pace of the level itself is fine but it feels like a
> crawl because of the background visual moving soooo slowly."*

⚠️ **"The pace of the level itself is fine"** is the sentence that makes this actionable. It is not a
report about `SCROLL_PER_STEP`; it is a report about the one thing on the screen that is supposed to
say how fast the ship is going.

## What was asked for at the end

> *"Full auto and merge PRs."*

## Three of the six are defects against the decision that already answered them

⚠️ **Which is now the pattern of this whole feedback round rather than an accident** —
`docs/state-of-play.md` says so about the previous one, and
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md) is the rule. **The question to
ask first is what the previous fix left standing.** For the record, before anything was built:

| item | the decision that answered it | what it left standing |
|---|---|---|
| 4, the volley | [0096](../docs/decisions/0096-the-enemies-play-along.md) | a phase quantised against `w.steps`, which is the same number for every body in a formation, because a formation spawns on one step |
| 5, the centreline | [0077](../docs/decisions/0077-a-pickup-arrives-rather-than-stopping.md) | a one-tube ship on the centreline, which 0077 chose deliberately and the ask now reverses |
| 6, the sky | [0088](../docs/decisions/0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md) | the fast layer dimmed to 2% of the far layer's ink, so the quickest thing the player can SEE moves at 0.24 |

⚠️ **Item 6's two halves are one cause and neither is a speed constant.** 0088 answered *the near
layer is distracting* and *the sky is too slow* in one pass, by dimming the near layer and speeding
both up — and what it dimmed away was the only fast layer on the screen. Multiplying the depths a
fourth time would be answering a report about the wrong quantity.

⚠️ **0088 predicted its own successor in writing**: *"the levers that are left are the alpha (which
can go to nothing) and the depth (which has a ceiling with an argument behind it), and after that the
answer is not a number — it is a different sky."* The alpha did go to nothing, and this is the
different sky.

## What items 1 to 3 have in common, and it is not a number

⚠️ **All three are about things that are individually correct and do not belong together.** *Two
separate tracks*, *a few seconds repeated*, *close to on beat but they don't mesh* — none of them is
a complaint that something is too loud, too quiet, too fast or out of time. The project has tuned
gains ([0092](../docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md)) and tuned timing
([0093](../docs/decisions/0093-the-gun-is-on-the-grid.md),
[0094](../docs/decisions/0094-in-time-is-not-in-phase.md)) and has never once tuned **harmony**,
which is the third axis and the only one left.

⚠️ **A cue's pitches were never in the key and nothing has ever asked them to be.**
[0072](../docs/decisions/0072-a-cue-is-baked-and-played.md) and
[0089](../docs/decisions/0089-a-cue-has-a-body.md) both treat `from` and `to` as timbre — *"a RATE
rather than a pitch, so one pair of numbers means the same thing for all four waves"* — which is
correct about the synthesiser and says nothing about what note comes out. The music is A minor
(`MUSIC_ROOT` is 55); the pulse falls to 52 Hz, the kill to 62, the death to 48, the blast to 58. Four
different notes, none of them in the scale, landing on the beat.

## What is not in this report

**No verdict on anything else.** The six items are what was said; the rest of the build — the dial,
the pickups, the death beat, the boss aura — went unmentioned again, which
[the-batch-flown](the-batch-flown-2026-08-08.md) records is not the same as *seen*.
