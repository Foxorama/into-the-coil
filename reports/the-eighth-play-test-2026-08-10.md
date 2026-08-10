# The eighth play-test — 2026-08-10

**Given after playing the build carrying 0103, 0104 and 0105** — the three PRs of the previous
session, flown together. Written down because
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md) says a report is a committed file.

⚠️ **THE AUDIO PASS LANDED AND THE VERDICT IS A BASELINE RATHER THAN A FINISH** — *"the music is a
great baseline now"*, followed immediately by the thing it is not. That is the first positive verdict
the sound has ever had, and it arrives with four items.

---

## The four, in the player's own words

**1 — The game still feels slow, and it is the background.**

> *"The game still feels slow, like the sense of flight and movement still feels like I'm walking
> instead of flying at fast speeds — which is a background thing, there are thin lines that are hardly
> visible, but the default background starfield is slow, not so much the starfield an issue, but the
> slow lines, I don't feel like I'm zooming through space."*

⚠️ **The sixth report about the sky's speed, and the first that names the right cause.**
[0106](../docs/decisions/0106-a-mark-thinner-than-a-pixel-is-not-drawn.md): the streak layer was
drawing marks **1.57 CSS pixels across**, and **six separate bounds over that layer were all green**
— including an ink FLOOR added by 0097 for precisely the failure *a layer nobody can see*.

⚠️ **[0103](../docs/decisions/0103-the-fast-layer-is-in-front.md) predicted the wrong next lever in
writing**, and the player corrected it in the same breath: *"which is a background thing."*
`SCROLL_PER_STEP` is untouched.

**2 — The music is one track for minutes.**

> *"The music is a great baseline now, but it's the one track repeating for minutes and minutes and
> minutes. It does get slightly interesting when the boss starts to appear, but then goes back to the
> same track."*

**3 — The aura should be a level-long build.**

> *"The aura music for the boss needs to start about 15-30secs into the start of a level and then amp
> up until you beat the boss."*

⚠️ **This is a new mechanism rather than a tuning of 0091.** Today the aura exists only while the boss
is on the field and is keyed to how close it is. **The player chose to keep both**: a level-long
tension curve, with 0091's distance-keyed aura remaining as the fine detail once the boss is present.

**4 — Every level sounds and looks the same.**

> *"And the same music and boss music repeats level after level after level… then the music for the
> next level needs to be different so it doesn't feel like just one level over and over again."*

> *"I think we're close to the part where we need to introduce the biomes and level themes now to
> start differentiating levels."*

⚠️ **THE SCOPE WAS PUT TO THE PLAYER AND ANSWERED: a `theme` row per level carrying sky, palette and
music.** Generic space themes rather than the fourteen *Far Carry* biomes — so no predecessor material
is opened — with biome NAMES and fiction droppable on later without rework.
`docs/game.md`'s *"no level is themed yet"* is what this closes.

---

## What this report does not settle

⚠️ **Only item 1 has landed** at the time of writing. Items 2, 3 and 4 are one piece of work and are
not started.

⚠️ **Nothing here is a defect.** For the first time in eight rounds the list is entirely about what the
game is missing rather than about what it does wrong.
