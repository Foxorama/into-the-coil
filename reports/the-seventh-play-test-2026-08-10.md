# The seventh play-test — 2026-08-10

**Given after playing the build carrying 0097 through 0102** — the whole six-decision batch the sixth
play-test asked for, flown in one pass exactly as the player asked for it to be judged. Written down
because [0029](../docs/decisions/0029-the-tracked-record-is-the-record.md) says a report is a committed
file.

⚠️ **THE HEADLINE IS THE SOUND, AND HALF THE REPORT IS ABOUT NOTHING ELSE** — the third feedback round
running in which that is true, and the first in which it comes with a question about whether the whole
line of work is worth continuing.

⚠️ **THIS IS THE FIRST OBSERVATION OF THE AUTHORED GAME.**
[0100](../docs/decisions/0100-a-level-places-its-pickups-too.md) found that levels two through seven had
never had a pickup in them; every earlier impression of their pacing is an impression of a different
game. **So *"levels 2 & 3 feel incredibly slow, easy and non-interactive"* is a first report, not a
repeat**, and it should not be read against anything said about those levels before this build.

---

## The strategic question, asked outright

> *"If we can't actually do a really good rhythm game with the sound we're using let me know and I can
> drop this line of gameplay, if we can do it, then it needs to be top notch, it can't just be good
> because good will sound below average. It needs to be great."*

**Answered the same session, and the answer split in two.**

⚠️ **THE SOUND ENGINE IS NOT THE CONSTRAINT.** The parts that are normally hard are built: a
sample-locked loop set that cannot drift ([0090](../docs/decisions/0090-the-music-is-four-loops.md)),
the sim clock phase-locked to the audio clock
([0094](../docs/decisions/0094-in-time-is-not-in-phase.md)), every cadence on a sixteenth grid
([0093](../docs/decisions/0093-the-gun-is-on-the-grid.md),
[0096](../docs/decisions/0096-the-enemies-play-along.md)), one synthesiser shared between the music and
the effects, and a key ([0099](../docs/decisions/0099-the-cues-are-in-the-key.md)).

⚠️ **BUT THE PLAYER NEVER PLAYS A NOTE, AND THAT IS A DESIGN FACT RATHER THAN AN AUDIO ONE.**
`src/content/actions.ts` bans a fire action; auto-fire is a rule. The only thing the player does is
steer, and steering has no beat. Everything currently on the grid is **the machine** keeping time. The
game can sound rhythmic; the player cannot be rhythmic.

**The player's decision, given immediately:**

> *"Rhythm game is definitely not what I want for this game, but I want the sound to be rhythmic and
> immersive and it's currently not close to that experience."*

⚠️ **So no rhythmic input is to be built, and the whole ask is the SOUND.** That is worth recording as
a closed question: a future session should not re-open *should the bomb be worth more on the beat*
without being asked to.

---

## The audio items, in the player's own words

**1 — The title and boss music are the FLOOR, not the ceiling.**

> *"The title and boss screen music needs to be the minimum base level we build upon for the music."*

⚠️ **A statement about the LADDER's shape rather than about any one piece.**
[0090](../docs/decisions/0090-the-music-is-four-loops.md)'s ladder is additive and climbs *up to*
fullness; this says the bottom rung of a level must already be at the top rung of the title.

**2 — The level music is too calm and too repetitive.**

> *"The current level music is way too calm and repetitive."*

⚠️ **The third time in three rounds** — *"a few seconds of sound repeated for minutes"* (fifth),
*"still flat and lifeless, has no depth, no pace, no increased tempo"* (sixth), and now. 0102 answered
the sixth by adding `groove`, `arp` and an eight-bar chord progression, and this is the verdict on
that.

**3 — The effects do not mesh with the music, and the timing is not why.**

> *"The game sound effects also don't blend in with the music at all, they need to pulse and beat with
> the music and currently they're timingly in sync, but the sound doesn't mess [mesh] at all."*

> *"Enemy explosions should pulse with the beat, the gun fire should be in sync with the tone, both
> player and enemy."*

⚠️ **THE SECOND ROUND OF *IN TIME BUT NOT MESHING*, and 0099 answered the first with harmony alone.**
0099's own text assumes the cues are *"arriving on the beat"*. **They are not.** `src/app/frame.ts`
fires `kill`, `hit`, `blast`, `pickup`, `shield`, `death` and `bossDown` on the step a collision
resolves — an arbitrary sixtieth of a second. Only `pulse`, `missile` and `threat` inherit the grid,
from their own cadences. *"Enemy explosions should pulse with the beat"* is describing something that
was never built.

**4 — The mix is still wrong, and the background is the quiet half.**

> *"Volume levels are still way off as well, background too quiet etc."*

⚠️ **The fourth mix report, and the first three all moved a number.**
[0092](../docs/decisions/0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md) records `MUSIC_GAIN` as
capped at **0.597** by a measured unweighted peak of 1.674 — a peak set by one kick transient. There is
no compressor, no limiter and no soft-clip anywhere on the music bus (`src/app/music.ts` is a bare
`GainNode` into a bare `GainNode`), where every cue has `glue`. **The music has been gain-staged four
times and never mastered.**

**5 — And the gun itself, which is a new item.**

> *"The gun fire at the moment as well doesn't fit in with the music at all, it's technically on beat,
> but it also doesn't fit a great sound experience."*

⚠️ **This is not the timing complaint again.** 0093 put the gun on the grid, 0102 gave the pulse a sub,
and the report has moved past both to the voice itself. It is the most frequent sound in the game by a
wide margin.

---

## The defects

**6 — Bosses 3 and up show no hit interaction at all.**

> *"Bosses 3+ don't show any hit interaction at all."*

⚠️ **Literal, and it was five of the seven.**
[0103](../docs/decisions/0103-the-fast-layer-is-in-front.md) has the measurement: `INK_OF` carried
`boss3Hit` through `boss7Hit` in their own hulls' ink, and `drawKind` shares one `case` arm between a
boss and its hurt sprite — so the two bitmaps were identical and the flash swapped the picture for the
picture. Nothing about the collision or the flash counter was wrong, and
[0035](../docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md)'s three probes over that
machinery all still fire.

**7 — The second missile tube arrives one pickup late.**

> *"Missile tubes don't get a second firing till like the 3rd upgrade? — upgrades for missiles should
> be 1 tube, 2 tubes, faster fire rate."*

⚠️ **Counted exactly right.** `rung(0, MAX_LAUNCHERS, tubes)` rounds to 0, **1, 1, 2**, 2. 0103 has why
it was an interpolation and not a tuned number, and what deleting the last interpolation in the file
cost a guard.

---

## The balance items

**8 — Enemies fly and shoot too fast.**

> *"Enemies overall fly too fast and shoot too fast."*

⚠️ **Deliberately NOT answered in the same pass as the sky.** The sky's rate is what the player judges
enemy speed against, and 0103 moves it; tuning both at once is the confound this project has recorded
twice already.

**9 — Level 4's density is the target, and levels 2 and 3 are the problem.**

> *"Around stage level 4 is when the density feels good. The current difficulty is based on weapon
> powerups and when your weapons are maxed before the 1st boss, levels 2 & 3 feel incredibly slow, easy
> and non-interactive."*

⚠️ **The diagnosis in the report is correct and the fix the player chose is the other one.** Every one
of the seven levels authors the identical nine pickups — four `weapon`, two `missile`, one `bomb`, two
`shield` — and four weapon pickups is the whole ladder
([0083](../docs/decisions/0083-two-ladders-of-four.md)), with the fourth at `at: 4600` of a ~6,350-unit
level. So the guns cap before the first boss by construction, and every weapon pickup afterwards is a
bomb charge.

⚠️ **Respreading the ladders across the run was offered and REFUSED, with a reason that is a product
decision:**

> *"Raise 2 and 3 to 4's density — we'll be adding different weapon and missile types in future and
> that's how we'll change the pickups per run later to be still rewarding and interesting."*

**So the pickup tables are not to be touched.** A future session that reads item 9 and reaches for the
level scripts' pickup lists is doing the thing that was explicitly declined.

**10 — The sky, for the fifth time.**

> *"Background scroll is too slow, probably needs to be another 75% faster again."*

⚠️ **0103 is the first pass that does not move a number**, and the reason is measured: the near dot
layer sits at 0.825 against a ceiling of **0.845**. The background sky had 2% left in it.

---

## What this report does not settle

⚠️ **Nothing in it has been flown**, and the audio half is not started at the time of writing.

⚠️ **The sky's next lever is named and is not in the sky** — 0103 says so in writing, so the sixth pass
does not open by reaching for a depth again.

⚠️ **AND ONE THING IN HERE IS A TASTE QUESTION NOBODY HAS HEARD.** Separating the missile's cadence
from the pulse's widens their cross-rhythm at tier 2 from every five pulses to every twenty. The player
praised that counter-beat by name in the fifth play-test. 0103 records it as the first thing to listen
for.
