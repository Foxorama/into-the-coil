# The tenth play-test — 2026-08-11

**Given after playing the build carrying 0108 to 0112** — the whole five-decision batch the ninth
report produced, flown in one pass as asked. Written down because
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md) says a report is a committed file.

⚠️ **FOUR OF THE FIVE CHANNELS ARE SIGNED OFF, WHICH HAS NEVER HAPPENED BEFORE.** *"Levels feel fine,
enemy death explosions feel fine. New enemies feel good, new shot patterns etc feel good."* That
closes the enemy, boss, level and death items of the ninth report on first flight.

⚠️ **AND THE FIFTH IS THE SOUND, FOR THE FIFTH ROUND RUNNING.** Everything below is one channel.

---

## What was said, in the player's own words

**1 — The level music is one loop and it does not change per level.**

> *"Music still needs a lot of work, it's the same repetitive couple of beats still and only changes
> when the boss aura starts to appear, and it gets interesting, but the boss aura music still doesn't
> get the blood pumping and the heart racing. It's a really nice music piece, but it doesn't imply
> warning etc."*

> *"I'm listening to the music now and it has no depth, no intricacy, no variety. It sounds like it's
> 1,2,3,4,5,6,7,8 repeat overset with every 4sec or so a note that almost sounds like a bell ring
> which is what I've been calling the metronome sound."*

> *"It doesn't change per level — basically the music needs to mostly fade out after a level and then
> a new track to fit the new level needs to kick in."*

**2 — A question about whether something is holding the audio back.**

> *"Are the accessibility items or are there other instructions still limiting our music/sound output
> because if that's the case, add an accessibility setting that defaults to off and then let's really
> go ham on the music."*

**3 — And the fallback, offered rather than asked for.**

> *"If the only way we can add actually musically changes to a level is by enemy auras, let's do
> that, but if there's a better way, I'm, figuratively speaking, all ears."*

**4 — THE ITEM THAT OUTRANKS THE OTHER THREE.**

> *"I've given the same feedback a lot now, so I'm obviously describing the wrong thing the wrong way,
> because I'm not really noticing much if any difference sound over the past few prompts."*

---

## What the session found

⚠️ **ITEM 4 IS WRONG IN THE PLAYER'S FAVOUR AND THAT IS THE FINDING.** The description was accurate
every time. [0113](../docs/decisions/0113-there-is-one-composition-and-seven-levels.md) has the
architecture: `MUSIC` is a **single composition** and a level's theme is a **gain multiplier over it**,
so not one note differs between any two of the seven levels. Seven decisions have tuned that one
piece. None of them added a second one.

⚠️ **AND *"1,2,3,4,5,6,7,8 repeat"* IS A LITERAL TRANSCRIPTION.** The `run` rung covers **the first
sixty seconds of every level** and opens no melodic layer at all — `arp`, `hook`, `lead`, `toll` and
`drive` are all zero there. What plays is a kick on every beat, a clap on two and four, hand
percussion, a pad and a sixteenth bass, over a loop that comes round every 6.4 seconds.

⚠️ **ITEM 2 IS ANSWERED NO, AND THE ANSWER IS EVIDENCE RATHER THAN OPINION.** `src/content/sound.ts`
offers `on` and `off`. There is no intensity tier, no reduced-motion coupling, no cue budget, and
[0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md) says in as many words that
nothing in it restrains the loud default. **A setting was asked for and deliberately not built**: it
would have gated nothing and would have stood as a false explanation for why the music is thin.

⚠️ **ITEM 3'S FALLBACK IS DECLINED FOR A STATED REASON.** An aura is a gain envelope over two
existing layers. It can make material louder; it cannot add material, and every word of item 1 is
about material.

## The instrument this report bought

⚠️ **THE BELL HAS BEEN NAMED THREE TIMES AND GUESSED AT THREE TIMES.**
[0102](../docs/decisions/0102-the-music-goes-somewhere.md) answered *the metronome* in `beat`;
[0108](../docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md) answered it in `engine`. Two
different layers from the same four words, with nothing in the repository able to settle it.

`node scripts/hear.mjs --solo` now writes one `.wav` per layer at a rung's own gains, so the file name
is the answer. **The six layers audible during the stretch this report is about were handed over for
identification before any music was written.**

## What is owed

The four-part sequence is in
[0113](../docs/decisions/0113-there-is-one-composition-and-seven-levels.md): the rig, then the beat
becomes a per-level quantity, then `MUSIC` becomes a table over `ThemeKind` baked at the level break,
then the seven tracks. **The first two land provably inert** — every level still at 150 BPM, every
sample byte-identical — so the refactor and the composing cannot be confused for one another when the
next verdict arrives.

⚠️ **A PER-LEVEL BPM WAS PROPOSED, ACCEPTED, AND THEN MEASURED TO NOT EXIST.** With a 60 Hz sim and a
weapon ladder that subdivides the beat by 3, 4 and 6, the only tempos this game can express are 300,
150, 100 and 75 BPM. The proposal was made without checking that the grid could hold it. 0113 has the
table and what widening actually costs — the subdivision ladder moves onto the theme, which spends
0093's 5:1 cross-rhythm and a constant weapon feel across a run. **The player was shown that cost and
chose it.**
