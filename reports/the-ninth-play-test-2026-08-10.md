# The ninth play-test — 2026-08-10

**Given after playing the build carrying 0106 and 0107** — the sky's hairline and the level-as-a-place
batch, flown together. Written down because
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md) says a report is a committed file.

⚠️ **THE HEADLINE IS *STILL NOT A LOT OF VARIETY*, AND IT IS THE SAME WORD ABOUT FIVE DIFFERENT
CHANNELS.** *"Have playtested the latest changes and there's still not a lot of variety. It's getting
better though."* The eight items below are that sentence broken into the places it is true, and four
of the five channels have never had the mechanism the report is asking for at all.

⚠️ **AND THE PLATFORM IS NAMED FOR THE FIRST TIME AS A PRIORITY RATHER THAN AS A VIEWPORT** —
*"remembering that we're optimising for desktop first and not mobile. If we can make it work on
mobile later great, but desktop is the prestige experience here."* That is a change of what a
trade-off costs, not only of what a screen is: a number that was held back because a phone could not
pay for it is now a number that may be spent, and the phone is the fallback.
[0022](../docs/decisions/0022-frame-rate-is-a-feature.md)'s budget is untouched — it is a *floor*,
and a floor is not a target.

---

## The eight, in the player's own words

### Sound

**1 — The bass is not felt.**

> *"how deep can we push the bass? I want to feel the bass beats in my chest"*

**2 — There is no percussion, only drums.**

> *"Can we get some percussion up in here to counterpoint it as well?"*

**3 — The boss music does not rise with the level's.**

> *"and how much can we mix it up for the bosses? the level music is getting passable, but the boss
> music isn't increasing proportionally."*

⚠️ **This is [0107](../docs/decisions/0107-a-level-is-a-place.md)'s own success producing the
complaint.** The level's ladder gained four rungs and a level-long aura build; the `boss` rung gained
nothing but `lead`. The gap between *approach* and *boss* is the smallest step in the ladder and it is
the one the whole ladder exists to arrive at.

**4 — The pace is right at level four and should start there.**

> *"from playtesting, the pace of the music sounded good around level 4, that should be our starting
> point for the music."*

⚠️ **The only thing that differs between level one and level four is the theme's `mix`** — 0107 —
so this is a statement about `rime` against `approach`, and `approach` is the theme that deliberately
changes nothing.

**5 — The metronome, for the third report running.**

> *"the metronome beats are still louder and because they're two beats back and forth, every mix
> sounds the same."*

⚠️ **AND [0102](../docs/decisions/0102-the-music-goes-somewhere.md) FIXED THIS IN THE WRONG LAYER,
WHICH ITS OWN GUARD CANNOT SEE.** 0102's finding was that every drum in the game was struck at one
weight, and it gave `beat` velocities and wrote `tests/music.test.ts`'s accent guard **over `beat`
specifically, because that is what was reported**. `beat` is `TITLE_ONLY`. **`engine` — the layer
that plays under every second of every level — was never touched**: four-on-the-floor and a clap on
two and four, every entry a literal `1`, identical in every bar of every level. *Two beats back and
forth* is a description of `engine`, and *every mix sounds the same* is the consequence of it being
the loudest thing in a mix a theme may only scale.

**6 — The gun landed; the deaths did not.**

> *"the player weapons are definitely feeling more like part of the music now, but the enemy deaths
> don't, they're on their own sound band at the moment and instead of punctuating the music, they
> detract from it."*

⚠️ **Half of [0104](../docs/decisions/0104-the-gun-plays-a-figure.md) is confirmed and half is
reported back.** The pulse got a `figure` and a length that fits its own cadence; `kill` got `onGrid`
and a `duck` and neither of the other two. It is on the beat, in the key, and it is a 0.46-second
noise explosion that pushes the bed down 18% to make room for itself.

### Pickups

> *"pretty good, happy with that for now"*

⚠️ **The first channel in nine rounds to be closed by the player.**
[0082](../docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md) is done being tuned.

### Enemies

**7 — Patterns, not pursuit.**

> *"need more variety and more attacks that are pattern attacks and less target player attacks."*

⚠️ **EVERY ENEMY SHOT IN THE GAME IS AIMED AT THE SHIP AND ALWAYS HAS BEEN.** `fireEnemies` in
`src/app/frame.ts` computes `atan2(ship − enemy)` for every body that fires, with no alternative
anywhere in the model. [0073](../docs/decisions/0073-an-enemy-is-a-pilot.md) gave motion a closed
union and left firing a single behaviour; this report is that omission arriving.

### Bosses

**8 — Six of seven are one boss.**

> *"level 4 (or it might have been 5) was the only boss with a different attack. the rest of them
> either had thick or thin bullets and that was the only difference. up/down motion, spray attack
> that increases number of bullets as health goes down."*

⚠️ **IT IS AN ACCURATE READING OF THE TABLE.** `stepBoss` is one behaviour: track a drifting station,
slide across the lane, reverse at the edges, and fire an aimed fan whose width and count come from the
phase. What `src/content/bosses.ts` varies is `station`, `drift`, `patrol`, `shot` and the phase
numbers — and 0101 drove all seven stations into a fifteen-unit band, so the two axes the player can
actually see are the bullet and the fan. `docs/state-of-play.md` has predicted this report in writing
since chunk 8 was written: *"one behaviour with seven silhouettes on it."*

⚠️ **The player named the mechanism twice and it is the same mechanism both times** — *"up/down
motion"* and *"spray attack that increases number of bullets as health goes down"*. The second half
already exists as `phases[].shots` and is invisible because the fan is aimed: a spread centred on the
ship reads as *one shot with error bars*, not as a wall of bullets to move through.

### Sky

> *"almost there. needs to be a bit faster. also needs to be more than streaks and some weird
> colouration per level. needs an actual space skyscape with nebulous clouds and such like."*

⚠️ **THE SEVENTH REPORT ABOUT THE SKY'S SPEED AND THE FIRST ABOUT ITS CONTENT.** *A bit faster* is
the smallest speed ask any of the seven has carried — 0106 moved it and the movement registered. What
is new is the other half: the sky is three fields of marks and a near-black backdrop, and
[0107](../docs/decisions/0107-a-level-is-a-place.md)'s per-level hue is what *"weird colouration"*
names. Nothing in the sky has ever had an area.

---

## How this is being answered

⚠️ **Six changes, one at a time, and the verdict is one play-test over all of them** — the standing
instruction from the fifth report onward: *"partial implementation and adjusting is going to be worse
than adjusting with everything in."*

| # | what | items |
|---|---|---|
| 1 | the bed — sub-bass, percussion, the engine's velocities, level four's pace as the floor | 1, 2, 4, 5 |
| 2 | the boss's music | 3 |
| 3 | a death that punctuates | 6 |
| 4 | enemies that fire patterns | 7 |
| 5 | bosses with one idea each | 8 |
| 6 | a sky with weather in it | the sky |

## What this report does not settle

⚠️ **The three questions the eighth round was held to were answered by omission, and that counts.**
*Does the music read as seven places or one track in seven coats* — answered as *every mix sounds the
same*, so: one track. *Is the boss arrival still an arrival* — answered as *not increasing
proportionally*, so: no, and the 55% aura ceiling was not the reason. *Levels 2–3* — **not mentioned
at all**, by a player who had raised them twice, which is the closest thing to a pass those levels
have had.

⚠️ **The maxed gun is still deferred and is still the lever the evidence points at** —
[0105](../docs/decisions/0105-a-body-is-on-screen-long-enough-to-answer.md). Nothing here changes
that, and nothing here should be read as having tested it.
