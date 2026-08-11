# 0116 — The rig plays the level, and the instrument is guarded like the game

**Accepted 2026-08-11.** The instrument [0027](0027-measure-the-picture-not-the-model.md) owes before
the music rewrite, and the first thing built for it.

**It supersedes nothing.** `scripts/hear.mjs`'s other modes are each correct about the thing they
write. What none of them writes is a **level**.

## The rules

**The rig renders a LEVEL, not a rung.** `--level=<kind>` walks the camera at the game's own rate,
asks `musicLevelFor` where it is, applies the theme, and models the mixer's own ramp.

**The arithmetic of a level's music is a module, not lines inside a script.** `scripts/timeline.mjs`,
imported by the rig and by the guards. A rig whose logic cannot be reached by a test is a rig that
cannot be held to the game.

**The instrument is guarded on the same terms as the game.** Every mixer quantity it uses is imported
from the module that owns it, and its answers must equal the game's.

## What no mode could write, and it is the thing six rounds have been about

`--music` writes something it calls an arc. It is not a level:

| | `--music --arc` | a level |
|---|---|---|
| rung order | typed into the file | whatever `musicLevelFor` returns |
| each rung lasts | one phrase, 25.6 s | **42 s / 50 s / 16.1 s / 10.6 s** |
| the transition | a **linear** fade over the last 1.6 s of a slot | an **exponential** approach starting the instant the rung changes |
| the theme | none | 0107's multiplier |

⚠️ **SO EVERY BOUNDARY IN THE ONLY AVAILABLE PICTURE LANDED AT A PHRASE, BY CONSTRUCTION.** The mode
could not show a boundary landing anywhere else, because it put them all in the same place. Six
rounds of *"repetitive"*, *"it goes nowhere"* and *"push and surge sound the same"* were judged
against a file that could not exhibit the defect.

⚠️ **AND THE SEVEN LEVELS HAVE NEVER BEEN RENDERED AS THEMSELVES.** No mode applied `mixOf`, so every
file this project has ever listened to was level one's mix — including every file used to judge
*"it doesn't change per level"*.

## What it found, stated in the player's own units

⚠️ **TWENTY-SEVEN OF THE GAME'S TWENTY-EIGHT RUNG CHANGES LAND MID-BAR.** Walked over all seven
levels at 36 units/second against a 1.6-second bar:

| level | run→push | push→surge | surge→approach | approach→boss |
|---|---|---|---|---|
| approach | beat 1.00 | beat 2.00 | beat 2.14 | beat 0.53 |
| descent | beat 0.47 | beat 1.47 | beat 1.61 | **on the bar** |
| shoal | beat 2.92 | beat 3.92 | beat 0.06 | beat 2.44 |
| eye | beat 2.19 | beat 3.19 | beat 3.33 | beat 1.72 |

**The single exception is an accident of `bossAt: 4320` dividing evenly.** And `bossPeak` is worse
than the rest: it is keyed to boss health ([0113](0113-there-is-one-composition-and-seven-levels.md)),
so it cannot land on a bar except by coincidence.

⚠️ **THEN THE RAMP SMEARS IT.** `src/app/music.ts` calls `setTargetAtTime(target, ctx.currentTime,
RAMP_SECONDS / 3)` — the approach begins at the instant the frame noticed, from an arbitrary
sixteenth, and takes 1.6 s. **No section change in this game has ever been heard where a listener is
counting.**

⚠️ **THIS IS NOT A GAIN, WHICH IS WHAT [0114](0114-the-fight-is-a-different-piece.md) SAID THE NEXT
ATTEMPT MUST NOT BE.** *"There is only a very subtle difference in the sound between push and
surge"* has survived two rounds of raising things. It is the same class as every other finding in
this arc: a mechanism that cannot produce the thing being asked for.

**Nothing is fixed here.** The instrument comes first — 0113's transferable half was that the rig was
built after the third guess instead of before the first.

## The rig had drifted twice and nothing held it

⚠️ **BOTH TIMES A VERDICT ABOUT THE MUSIC WAS TAKEN FROM A WRONG INSTRUMENT.**
[0104](0104-the-gun-plays-a-figure.md): the bus shaper was missing, and the rig under-reported the
change it had just been used to choose by **4.5 dB**. [0114](0114-the-fight-is-a-different-piece.md):
`--music` and `--play` rendered the same music at two reference levels, and *"a massive musical volume
difference"* was **one instruction away from being tuned as a defect in the music**.

⚠️ **EVERY OTHER GUARD IN THIS REPOSITORY MEASURES THE MUSIC; NOTHING MEASURED THE THING THAT MEASURES
IT FOR A HUMAN.** A wrong instrument is worse than none, because it still produces a number. That is
now closed, and `RAMP_SECONDS` and `AURA_RAMP_SECONDS` are exported for it rather than restated.

## Two vacuous guards, and `npm run prove` caught both

⚠️ **THE FIRST DRAFT ASSERTED THAT A WORD APPEARED IN A FILE.** `rig.includes('mixOf')` — and
`prove` reported **STILL GREEN** on two of three probes, because deleting a call site leaves the
import behind. **A spellcheck standing in for a property**, and it looked exactly like a guard.

⚠️ **THE FIX WAS NOT A BETTER REGEX.** What a rig must be held to is that its answers equal the
game's, which is a claim about values — so the values had to be reachable, which is why
`scripts/timeline.mjs` exists at all. **The module is a consequence of the guard, not a tidy-up.**

⚠️ **AND A THIRD PROBE WENT STILL GREEN FOR THE OTHER REASON — THE BREAK WAS IN THE WRONG PLACE.** It
broke a local in `rungMarks` that only bounds the loop, while the rung comes from `rungAt`, which
looks the level up again. [0019](0019-a-probe-must-be-seen-to-apply.md) is usually read as being about
the guard; this is its other half.

⚠️ **AND THE VACUOUS REGEX WAS CAUSED BY A SHELL.** The guard was appended through a heredoc and
`\s` arrived as `s`, so the pattern never matched anything. **`scripts/prove-guard.mjs`'s own header
is about exactly this** — *"a bash loop whose `${...}` was written to the probe file verbatim… the
shell owns the quoting either way"* — and the answer there is the answer here: write the file, do not
echo it. `String.raw` is what the assertion uses now.

## What was rejected

**Fixing the bar-line defect in this decision.** It is one call's worth of change and it would have
landed unjudged. 0027's rule is the instrument first, and 0113's finding was that building it late is
what cost six rounds. The files exist now; the fix is judged against them.

**Guarding *a rung change lands on a bar*.** It is the defect, and a guard written today would assert
the broken behaviour. It belongs to the decision that fixes it.

**A `--fight` length measured from play.** The rig holds the boss for a stated 45 seconds and the aura
at the middle of its reachable range. Both are **stated choices, not measurements** — the aura's gap
is a distance the player steers (0091), so no rig has an honest value for it, and `--music --aura` is
the mode that sweeps it.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the rig given its own ramp constant, so the transitions it writes are not the ones the game plays | `THE ONE THAT DRIFTED TWICE: every mixer quantity the rig uses is imported, never restated` |
| the rung read from a table the rig keeps, rather than asked of the game | `THE RUNG SEQUENCE IS THE GAME’S ANSWER, not a list the rig keeps` |
| the boss placed at one distance for every level, so all seven reach their rungs together | `and a level of a different length reaches its rungs at different times` |
| the aura row read as a gain, so the dread sounds with no boss anywhere near | `and the aura arrives as a CEILING rather than a gain` |
| the theme multiplier dropped, so all seven levels render as level one | `THE PLACE IS IN IT: two themes do not render the same gains` |

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A script, a script module, guards
and a decision; the two exported constants change no value. The build is byte-identical and nothing
the player reaches moves.
