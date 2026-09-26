# 0378 — The specials are heard

**Accepted 2026-09-26.** Every special now makes its own sound, and each one is named on its row in
`src/content/specials.ts`:
- **`cue`** is the sound of the press. It is played the moment the button is pressed.
- **`lands`** is the sound a thrown special makes going off. It is played on the next sixteenth of the beat.

Before this, five specials borrowed another sound:

| special | borrowed | now plays | goes off as |
|---|---|---|---|
| hunt (purple surge) | the shield's | `hunt` | — |
| overdrive (golden surge) | the shield's | `overdrive` | — |
| storm | the bomb's launch, then the arc's zap | `stormThrow` | `storm` |
| whirlpool | the blade gun's throw | `whirlpool` | — |
| void | the bomb's launch, then the blast | `voidThrow` | `rift` |

The bomb keeps `bomb` and `blast`. The death pyre keeps its literal `blast`.

This pays the cues owed by [0373](0373-a-special-is-the-guns-own.md),
[0374](0374-the-storm-and-the-whirlpool.md) and [0377](0377-the-void.md), and closes the last item
owed on [`the-arsenal-planned`](../../reports/the-arsenal-planned-2026-09-26.md).

## The ask

> *"alright sweet, crank out the sounds for the remaining items"*

## The sounds

They follow [0375](0375-the-bomb-is-a-missile.md)'s lesson, the one special sound approved by ear.
Every pitch is the root, its fifth or its octaves. The character comes from the noise, the filters and
the pan, where the key cannot object.

| cue | what it is |
|---|---|
| **hunt** | A swell on the root, a filtered square that tracks, and two pings an octave apart, left then right — the lock-on. |
| **overdrive** | A kick onto the root, and a rev up the octave in parallel fifths with the filters opening, with a sizzle over the top. |
| **stormThrow** | Charge rather than ignition: held-noise crackle falling as it goes, and a buzz dropping onto A3. |
| **storm** | *"A blast of lightning with some after flickers."* One hard, bright crack with a kick on the root under it, then three snaps of held noise, each later, quieter and somewhere else. |
| **whirlpool** | *"Sharpening knives."* Three strokes of a blade along steel, left, right, left: a narrow band of noise sweeping up as the edge runs, and a thin ring as it leaves; the last rings on. |
| **voidThrow** | *"A short fire sound."* A muffled thump on the root and a breath, over in a fifth of a second. |
| **rift** | *"A very low whumm mmmm mmm mm while it's active."* Four swells on the root, each shorter and quieter, a filter closing on each so it opens on the *wh*; a sub under all four. |

**The first set was heard and refused:** *"they're not great to be honest, they all sound a bit dodgy
and not at all like what I'd expect them to sound like."* The storm, whirlpool, voidThrow and rift
above are the second set, built from what the play said each should be. The surges' cues stay as
they are for now, because the missile special they belong to is being rebuilt.

## The hush

*"Void bomb needs to negate all sound and be an orb of silence when it's fired. There needs to be a
short fire sound, then nothing, then a very low whumm while it's active."*
- **When.** While a special whose row `hushes` is in play, the game is hushed. That covers the ball in
  the air and a rift it opened that is still open; `hushed(w)` in the frame answers it. A rift
  remembers which special opened it.
- **How much.** The music, every cue and the room fall to `HUSH_LEVEL`, about 30 dB down. It is not
  zero, because a hard cut reads as a fault when the score comes back.
- **What goes round it.** The void's own two cues are `throughHush`. They go to a second set of
  places wired straight to the master, so they are what is left in the silence.
- **The shell.** It hands the answer to the speaker every step while the sim is stepping, and the
  speaker passes on only a change. Paused, on the title or between lives, nothing is in play, so the
  world comes back.
- **Guards.** The speaker's forwarding and the frame's answer are held in `tests/sound.test.ts` and
  `tests/void.test.ts`. The shape — the field, the room and the music reaching the master only
  through one gain, and a second field going round it — is held in a real browser by
  `tests/sound.browser.test.ts`, the only place there is a graph to see.
- **The rig models it.** The specials take in `hear.mjs --play` hushes the bed and the other cues on
  the game's own time constants. Measured on the take: −18.9 dB before the void, −50 dB while it
  flies, −27 dB for the whumm, and −19.7 dB after the rift closes.

Each fits the table's rules:
- **Twins.** Four new twins name what draws them: `aura-appears`, `storm-strikes`, `whirl-appears` and
  `rift-opens`. The two throws are `bomb-appears`, which now says *a thrown special*.
- **Duck.** The storm and the rift are longer than a beat and resolve something, so they duck, a little
  less than the blast. The presses do not.
- **The room.** Every new cue has some `air`. A press gets less of the room than what it causes.

**Loudness was checked against the bomb** with `scripts/weigh-cue.mjs`:
- The presses land between −34.7 and −39.3 dB, beside the bomb's −38.3.
- The storm sits level with the blast at most, so a bomb is still the loudest thing a charge buys.
- The first rift weighed 7 dB under the blast and was rebuilt twice for it. The second set is quiet
  on purpose, because it plays into the hush.
- The second storm first weighed 3 dB over the blast, and its gain came down until the bomb was the
  loudest again.

## The rig was rendering every cue narrower than the game

`scripts/hear.mjs` is what the user judges by ear. It laid every cue by its mono middle through the
mono pan law.
- **What the game plays.** A cue whose layers pan bakes a left and a right (`widthOf`), and the game
  hands that pair to a `StereoPannerNode`.
- **What that meant.** Measured when this was written, **every cue in the table pans**. So every cue the
  rig ever rendered was narrower than the game and at another level, over the music included. That
  covers the bomb approved by ear under 0375.
- **The guard that kept it that way.**
  [0209](0209-the-rig-hears-in-stereo.md)'s guard named the cue catalogue *the one deliberate mono*,
  because *position is not part of a timbre*. That is true of where a cue happens, and false of a
  cue's own authored width. The guard now allows no mono render.

This is the third time the rig has differed from the game, after
[0104](0104-the-gun-plays-a-figure.md) and [0114](0114-the-fight-is-a-different-piece.md). It is fixed
on the same terms as those:
- **`panStereoGains`** in `src/app/music.ts` is the spec's law for a stereo input, beside `panGains`,
  the law for a mono one. In the middle the panner passes both channels through whole; turned to one
  side, it folds the far channel into the near one.
- **`layCue`** in `src/app/sound.ts` is the one function the rig lays a cue with, and a test drives it
  by value. A spellcheck of the rig's text went green over a real break the last time, which is why
  the guard is not one here.
- **A new take in `--play`**, `specials`, plays every special over a level: its press where it is
  pressed, and its landing after its row's real fuse, snapped to the sixteenth as the speaker does. It
  is read off the rows, so a special added later is in the take without anyone remembering to add it.
  It answers *"the bomb over music sound didn't have the bomb sound"* from 0375's listen.

## Confirmed, not assumed

`scripts/probes/0378-the-specials-are-heard.mjs` has sixteen breaks, and every one turned its guard
red:
- each special put back on the sound it borrowed;
- a bomb that goes off in silence;
- two specials sharing a press;
- the rig laying a wide cue by its middle;
- the stereo law splitting the middle as the mono law does;
- the cue catalogue written in mono;
- the speaker restarting the hush every step;
- the hush lifting while the rift is still open;
- the whumm hushed with everything else;
- the cue field, the music or the room wired past the hush, each in a real browser.

**Not held by any guard: the one line in `src/app/mount.ts` that hands `hushed` to the speaker.** A
guard would have to earn and fire a void in a real run in a browser, and the speaker, the frame and
the graph on either side of that line are each held.

**The first of them happened for real.** The edit that moved the surges off the shield's cue was
refused by the editor and went unnoticed. The guard found the surges still sounding like a shield
before this was committed.

The 0209 probe was re-anchored on the renamed play file.

## Owed

- The ear. These were made without being heard by anyone who can hear them, and the numbers above
  only say they are in the family's range.
