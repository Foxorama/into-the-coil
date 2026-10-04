# 0495 — The throw is a listening set

**Accepted 2026-10-04.** Item 12 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 13: *"the shuriken's sound — a listening set, not a guess."* The player does not know what would be good, and nothing
in a suite can hear ([0027](0027-measure-the-picture-not-the-model.md)). So this PR changes no sound the game makes. It
puts a question on the desk.

## The rule

**The dash plays the shipped throw and four candidates over a level while it plays**, switched from a selector. The
candidates are in `rig/throws.ts`, each the shipped row with one thing changed:

| voice | what changes |
|---|---|
| **shipped** | nothing |
| **no shing** | the noise sweep removed; the thump, the partials and the tick stay |
| **the thrum** | a saw on the root falling a fifth under a closing lowpass, with a flutter; the partials an octave down; no noise |
| **every other blade** | the cue on alternate throws, 2.5 a second, the downbeat kept |
| **the whistle** | the launcher and a quiet sine that slides a third down and across the field, nothing else |

Choosing a voice re-samples the throw from that row and hands the mixer the cue set with only that cue changed. That
is the same `setCues` the game swaps a place's cues with ([0190](0190-a-place-owns-what-it-kills.md)), so it changes on
the next blade without a reload. Choosing a voice also puts the Firebird's gun on.

**The desk fires each ship's own gun.** It fired the fighter's pulse whatever was asked. `weaponAtTier` and
`cueLines` in `rig/transport.ts` now take a ship, the fighter by default, and the gun's cue is named by `cueOfFlight`,
as the frame names it. A gun selector on the dash chooses the ship.

**The weighing scripts read candidates.** `scripts/weigh-cue.mjs --from=rig/throws.ts` and `scripts/weigh-fit.mjs
--from=rig/throws.ts` weigh a module's `ROWS` with the same arithmetic as the game's own cues. That arithmetic is
`tests/spectrum.ts`, imported and not repeated.

## Measured before it was offered

`weigh-cue --loud`, A-weighted at the bus:

| | pulse | arc | ray | **shipped** | no shing | thrum | every other | whistle |
|---|---|---|---|---|---|---|---|---|
| loud | −48.6 | −48.2 | −50.4 | **−48.2** | −49.2 | −47.8 | −48.0 | −49.0 |

All five sit inside the guns' own spread, so none can win the listen by being louder.

`weigh-fit --rung=run` against every place's bed: **the shipped throw's energy is furthest from the music's in the air
band, by 7.8 to 15.0 dB, in all seven places.** That is the plan's suspected irritant, measured: a bright wash where
the music has nothing. No shing brings it to at most 6.8 dB, the thrum to 5.6 and the whistle to 5.8. Every other
blade keeps the spectrum and halves the rate.

## Guards

`tests/dash.test.ts`, *0495 — the shuriken's listening set*:

- **THE GUN ON THE DESK**: each ship's gun line is its own gun's cue at its own `fireEvery`, and the shuriken's is
  the throw.
- **THE SET SITS WHERE A GUN SITS**: no voice is more than half a decibel louder, A-weighted at the bus, than the
  loudest gun the game ships.
- **EVERY OTHER BLADE**: on the shuriken's cadence, that voice sounds on alternate throws and on no others.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0495`:

| broken on purpose | went red |
|---|---|
| the desk's gun line reading the fighter whatever ship is asked for | `THE GUN ON THE DESK` |
| the whistle ten times louder than it is | `THE SET SITS WHERE A GUN SITS` |
| every other blade struck on every blade | `EVERY OTHER BLADE` |

0126's *cadence typed into the rig* probe is re-anchored on the gun line, and all nine of 0126's probes are red.

## Owed

- **The listen.** `npm run dash`: start the audio, choose a voice and play a level. **The one the player picks
  becomes the throw** in `src/content/cues.ts`, in a PR of its own, and `rig/throws.ts` is deleted with it.

## Rollback

⚠️ **None owed**: [0001](0001-revertability-not-risk-rating.md). The rig and two scripts; nothing the game ships.
