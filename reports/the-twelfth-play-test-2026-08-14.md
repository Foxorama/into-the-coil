# The twelfth play-test — the run is a pad and a flute, and it always was

**Given 2026-08-14**, against the `level-three-has-its-own-notes` preview carrying
[0148](../docs/decisions/0148-a-place-has-its-own-notes.md).

> *"Level 3 definitely sounds a bit different, but especially the run tonally feels almost exactly the
> same. Tempo and beat isn't close to the eurobeat style either. For the mix it needs to lean heavily
> on the euro, but then lean into bone drum styles, it's probably going to need new sounds, but across
> the whole experience from levels 3-7 we need to increase the tempo and beat to match the
> hyper-faster eurobeat/techno style. It's still slow and melodic — slow in this case is that it
> doesn't feel appropriate for a hyper fast space jet flying through combat, it feels more appropriate
> for a cthulhu-ian investigative game."*

## ⚠️ *"The run feels almost exactly the same"* IS EXACTLY RIGHT AND WAS PREDICTABLE

`MUSIC_LADDER`'s `run` row, in `src/content/music.ts`:

| open at `run` | closed at `run` |
|---|---|
| `drone` `sub` `engine` `perc` `chords` `groove` `call` `auraSlow` `auraFast` | **`arp` `hook` `drive` `counter` `lead` `ride` `crash` `toll` `dread`** |

⚠️ **EVERY FAST LAYER IN THE GAME IS CLOSED AT `run`.** What is open is two pads, a bass, a kit and one
slow melody. **That is a literal description of *slow and melodic*,** and it is the shared ladder — so
it is true of all seven levels and has been since 0102 wrote the rungs.

⚠️ **AND BOTH OF 0148's SUPERSAWS ARE IN LAYERS THAT DO NOT OPEN UNTIL `push`.** `hook` opens at
`push`, `counter` at `surge`. At `run`, the only thing 0148 changed is one detuned voice in `chords`
and the progression. **The player heard the level exactly as it is.**

⚠️ **SO THE PLACE WAS NEVER THE LEVER FOR THIS COMPLAINT — THE RUNG IS.** 0148 answered *level 3 is a
copy of level 2*, which was a question about material. *The opening is slow* is a question about the
LADDER, and no amount of per-place writing can reach it.

## ⚠️ The tempo instruction is 0102's own deferred conversation, arriving

[0102](../docs/decisions/0102-the-music-goes-somewhere.md) closed with this, and it has been sitting in
`docs/state-of-play.md` unread ever since:

> *"the music's tempo does not rise, because 0093 fixes a beat at 24 sim steps and the gun, the
> enemies and the phase-lock all ride it. What rises is the rate of events… **If that does not read as
> faster to an ear, the next conversation is whether the grid is worth what it costs, not another pass
> at the music.**"*

⚠️ **IT DOES NOT READ AS FASTER, AND THAT IS NOW SAID TWICE.** *"Still flat and lifeless, has no
depth, no pace, no increased tempo"* (0102's own trigger), and now *"tempo and beat isn't close…
increase the tempo and beat."* The subdivision answer has been tried and has not landed.

### ⚠️ What a real tempo change costs, and it is not a music change

`STEPS_PER_BEAT = 24` at 60 Hz is 150 BPM — which **is** eurobeat's tempo, so the number is not the
problem. What rides that grid ([0093](../docs/decisions/0093-the-gun-is-on-the-grid.md),
[0096](../docs/decisions/0096-the-enemies-play-along.md)) is the player's gun cadence, every enemy's
fire cadence, and the phase quantisation at spawn. **Changing it is a gameplay rebalance wearing a
music change**, which is why it is left here as a measured question rather than done unsupervised.

| steps/beat | BPM | divides by 2 | by 3 | by 4 | by 8 | verdict |
|---|---|---|---|---|---|---|
| **24** (today) | 150 | ✅ | ✅ | ✅ | ✅ | every subdivision; the tempo reads slow |
| 20 | 180 | ✅ | ❌ | ✅ | ❌ | **no triplets and no 32nds** — 0147 just gave level 7 thirty-seconds |
| 18 | 200 | ✅ | ✅ | ❌ | ❌ | **no sixteenths**, which is most of this game |
| 16 | 225 | ✅ | ❌ | ✅ | ✅ | fast enough for techno, too fast for eurobeat, no triplets |

⚠️ **THE ARITHMETIC IS WHY THIS IS NOT A ONE-LINE CHANGE**, and 20 is the only candidate near the
requested feel. It costs the triplet and the thirty-second, and
[0147](../docs/decisions/0147-a-place-is-a-balance.md) spent the thirty-second on level seven eight
hours earlier.

⚠️ **AND *"levels 3-7"* IMPLIES A PER-LEVEL TEMPO, WHICH THE GRID CANNOT CURRENTLY EXPRESS AT ALL.**
The grid is global because the gun is global. A per-level tempo means the gun's cadence changes at a
level boundary, which is a design question about the game and not about the soundtrack.

## What is asked for that is NOT the grid

1. **Open the fast layers earlier.** The cheapest, most reversible answer to *the opening is slow*, and
   it touches one table. It changes all seven levels, which is what *"across the whole experience"*
   asks for.
2. **Bone drums, and new sounds.** *"Lean heavily on the euro, but then lean into bone drum styles"* —
   `perc` and `engine` are where a kit lives, and `src/content/saurian.ts` already has log drums and
   claves in them. This is material, not balance.
3. **The brass, which is still unattributed.** Measured on the previous round: `sub` came down 3.4 dB
   in every place while `call`, `hook`, `arp` and `counter` went up 4.6–6.2 dB in every place — and
   those four hold 42–54% of their energy in the 130–800 Hz trombone register. **`call` is open at
   `run`**, which ties it to the complaint above. Not yet confirmed by ear; `npm run dash` solos it.

## ⚠️ What was NOT done, and why

**Nothing.** The player left for a day with a standing instruction — *"if you're not sure on the music,
kick on with the art styles and boss styling, we can upgrade that and then go back to working on the
music when I get back"* — and the tempo half of this report is a gameplay change that wants their ear
on it. The arrangement half is safe and is the first thing to do on their return, or on their say-so.

⚠️ **AND THE DASHBOARD IS SERVED OUT OF THE WORKING TREE**, so *"if my dashboard has been updated"* is
answered by `git pull`. 0148 is on `main` and on `next.intothecoil.vulpecula.games`.
