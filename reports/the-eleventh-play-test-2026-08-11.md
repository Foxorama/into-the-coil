# The eleventh play-test — 2026-08-11

**Three rounds in one session, all on the sound**, given against renders and then against the
`level-music-depth` branch preview. Written down because
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md) says a report is a committed file,
and because two of the three rounds corrected something this session had got wrong.

⚠️ **IT IS THE FIRST ROUND IN SIX WHERE THE SOUND MOVED IN THE PLAYER'S OPINION** — *"it's a lot
better"* — and the same message contained the two items below it. Partial credit is data.

---

## Round one — the metronome, named at last

> *"It's the loud notes in mix-run and level-solo-chords, the big strong notes are basically exactly
> the same and when the go bong....... bong......bong......bong.... etc"*

⚠️ **THE LAYER IS `chords`, AND THE SOLO RIG IS WHAT MADE THE ANSWER POSSIBLE.** Three previous
rounds had guessed — [0102](../docs/decisions/0102-the-music-goes-somewhere.md) answered *the
metronome* in `beat`, [0108](../docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md) in
`engine`. Both wrong.

⚠️ **AND THE DESCRIPTION WAS EXACT.** Measured on the baked buffer, the progression is real — 110,
87, 131, 98, 110, 87, 98, 82 Hz, an honest A minor–F–C–G. **The pitch moved and nothing else ever
did**: four voices, one strike per bar, on the downbeat, at identical weight, 110 times a level. This
repository's own comment already said what that is — *"identical repetition at a fixed interval IS a
metronome"* — written for the drums in 0102 and never checked against the chords.

⚠️ **IT WAS THE LAYER 0108's OWN FIX SKIPPED.** That decision added `accents` because *"a pitched note
has a weight now, which it never had"*, and applied it to the chords' rolling sub while leaving the
four stabs — the loudest, most exposed pitched event in the level — untouched.

## Round two — a peaceful boss, and where the notes should go

> *"The v2 boss music is more additional notes that need to appear throughout the level for
> variation and the actual boss music needs to be faster and more intense. Not necessarily menacing,
> but the boss music now is almost kind of peaceful instead of an intense boss fight."*

> *"Can we also emphasise the regular enemy death and maybe introduce another wave or two to hit the
> enemy note deaths, they provide a good counter point but those notes aren't quite hit often
> enough."*

⚠️ **THE PEACEFUL BOSS WAS THIS SESSION'S OWN DOING AND IT IS THE MOST TRANSFERABLE THING HERE.**
Answering 0108's bed guard, the previous commit had trimmed `drive` 0.94 → 0.44, `lead` 0.98 → 0.74,
`stomp` 0.96 → 0.48 and `toll` 0.86 → 0.6 — **a ratio fixed by shrinking its numerator.** The guard
was satisfied and the feature was gone. Nothing caps a ladder gain at 1; only the mix peak does, so
the headroom to pay for the bed with BOTTOM was there the whole time and the wrong lever was reached
for.

⚠️ **AND *"THOSE NOTES"* IS THE WORD THAT DECIDED THE FIX.** What the player picks out of the kill cue
is the tuned tom, not the crack or the body — so the two pitched voices went up and the noise did not.
Raising the row's gain would have made the hiss louder in the same proportion and answered a different
sentence.

## Round three — density is the counterpoint

> *"Honestly, still not a lot of difference, ends up being a repetitive track. Can we reduce the level
> length by 30secs without reducing enemy count to increase the density of enemies? This might need
> the first pickup changed to a weapon increase instead of a shield."*

> *"The sound isn't bad, it's just repetitive and monotonous after about half the level and when you
> have upgrade weapons, there's just not enough density of enemies to counterpoint the background
> music."*

⚠️ **THE PLAYER'S DIAGNOSIS MATCHED A MEASUREMENT THIS SESSION HAD ALREADY TAKEN AND DRAWN THE WRONG
CONCLUSION FROM.** A level was putting 289–423 bodies on screen, one every 0.43–0.61s — *more than one
per beat* — and that number had been used to argue that **more waves could not be the lever.** It is
the right measurement and the wrong reading: the supply was never short, the **kill rate** was, and it
falls exactly when the gun is upgraded and the field is spread thin. Compression raises the kill rate
without adding a body.

---

## What the guards found that no eye did

⚠️ **A PROBE REFUSED TO FIRE AND THAT IS HOW THE MISSING GUARD WAS FOUND.** 0113's own probe closed the
new melodic layer at `run` — the reported defect exactly, a level opening with no tune — and pointed at
*opens a layer at every step*. **The suite stayed green**, because `run` opens five other layers and
not one of them is a melody. **Nothing in this repository held the thing the whole decision is about.**
The guard now exists, written over a property rather than a name.

⚠️ **TWO MORE BREAKS STOPPED BEING BREAKS, both because the game got better.** Moving `drive` down to
`surge` gave that rung two arrivals, so closing the hook no longer starves it; the level compression
means a single missing filler wave is absorbed — driven, one is green, two are green, three go red.

⚠️ **AND ONE PROBE WAS FLATTENED BY A MECHANICAL RE-ANCHORING PASS**, its find and replace rewritten to
the same number so it changed nothing. `npm test` caught it. **An anchor can be moved mechanically; a
BREAK cannot** — and a scan across every probe for the same defect found no others.

## What is owed

⚠️ **THE MUSIC IS STILL ONE COMPOSITION AND THAT IS NOW THE WHOLE OF THE REMAINING COMPLAINT.** At 146
seconds the phrase comes round 5.7 times rather than 13.7. Doubling it again costs another 38 MB and
buys one halving. **The next lever is seven tracks, not a longer one** —
[0113](../docs/decisions/0113-there-is-one-composition-and-seven-levels.md) has the shape and
`per-level-beat` is the branch clearing the ground for it.

⚠️ **AND THE PER-LEVEL TEMPO REFACTOR IS HALF DONE AND PARKED**, at the player's own instruction to
prove the direction on one level before paying for seven.
