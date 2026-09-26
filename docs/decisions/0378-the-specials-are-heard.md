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
| **storm** | A clap, crackle running both ways across the field, two zaps on the octaves, and thunder with the root under it. |
| **whirlpool** | Two whooshes sweeping across the field in opposite directions, a tone rising an octave, and steel ringing on A5. |
| **voidThrow** | Low and hollow: a sub falling an octave onto the root, and dark air closing behind it. |
| **rift** | Air pulled inward from both sides, a seal on the root, then a drone that dies away over the rift's second and a half. |

Each fits the table's rules:
- **Twins.** Four new twins name what draws them: `aura-appears`, `storm-strikes`, `whirl-appears` and
  `rift-opens`. The two throws are `bomb-appears`, which now says *a thrown special*.
- **Duck.** The storm and the rift are longer than a beat and resolve something, so they duck, a little
  less than the blast. The presses do not.
- **The room.** Every new cue has some `air`. A press gets less of the room than what it causes.

**Loudness was checked against the bomb** with `scripts/weigh-cue.mjs`:
- The presses land between −34.7 and −39.3 dB, beside the bomb's −38.3.
- The storm and the rift sit about 3 dB under the blast, so a bomb is still the loudest thing a charge
  buys.
- The rift first weighed 7 dB under the blast, because its drone was on A1 and A-weighting hears
  almost nothing that low. Its weight moved into a filtered saw's harmonics and the air. Its fade was
  then steepened, because the decay guard was right: a rift closes.

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

`scripts/probes/0378-the-specials-are-heard.mjs` has ten breaks, and every one turned its guard red:
- each special put back on the sound it borrowed;
- a bomb that goes off in silence;
- two specials sharing a press;
- the rig laying a wide cue by its middle;
- the stereo law splitting the middle as the mono law does;
- the cue catalogue written in mono.

**The first of them happened for real.** The edit that moved the surges off the shield's cue was
refused by the editor and went unnoticed. The guard found the surges still sounding like a shield
before this was committed.

The 0209 probe was re-anchored on the renamed play file.

## Owed

- The ear. These were made without being heard by anyone who can hear them, and the numbers above
  only say they are in the family's range.
