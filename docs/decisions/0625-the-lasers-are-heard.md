# 0625 — The lasers are heard

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), items 14 and 15. Amends
[0308](0308-the-attacks-are-heard.md)'s fallback for one kind of attack, and a guard of
[0089](0089-a-cue-has-a-body.md)'s.

## The ask

> *"Pteradachyl Boss — Lazers need a chargin hum for their line appearance — then a lazer zap + hiss for the hit —
> needs to apply to all lazers"*

## What was true

Every laser — the pterodactyl's three phases, the hydra's lance head, the jellyfish's two fans — sounded `bossShot`,
the crash every boss volley shares, on the step its warning line was drawn (`throwAttack` in `src/app/boss.ts`), and
nothing on the step it began to burn, which is the moment in the attack that hurts. No beam row named a cue.

## The rule

| | |
|---|---|
| **the charge** | `laserCharge`, on the step the volley's line is drawn: a sine climbing two octaves, A to A, swelling over 0.42 s, with a saw an octave under it opening through a sweeping lowpass and a thin band of noise pulled upward across the field. It builds, and ends on a release |
| **the zap and the hiss** | `laserZap`, on the step the line becomes the beam — `pinBeams`, the first step `lifeFor` has counted down onto `holdFor`, which is the first step `strikeShip` hurts on: a crack, a square diving three octaves in a tenth of a second, a body on the root, and a hiss of high noise either side for half a second, the length of a beam's burn |
| **every laser** | the charge is the **fallback for a `beam` attack** where `bossShot` is every other attack's (0282: shared code holds the default, a row may still name its own), and the zap is laid by the frame for every beam bolt. A laser added to any row is heard without the row saying so. Once a volley each: three beams are one charge and one zap |

**"For the hit"** is read as the beam's strike — the step it burns — not as the ship being hit, which already sounds
the shield or the death. If it meant the ship, the zap is one line moved into `strikeShip`.

## What moved to let it

### A warning builds

`tests/sound.test.ts`'s *starts and ends at zero* held every cue to being quieter in its last quarter than its first —
*"what every cue must do, whatever its curve."* A charge is the one sound meant to be louder at the end: it is the
line filling up toward the step it fires, and a hum that decayed through its warning would be a laser losing power
before it shot. The change is to the guard, said here, per [0192](0192-a-guard-holds-an-invariant.md): **a cue whose
picture is a warning line (`warning-appears`) is held to building instead** — louder in its last quarter than its
first — and still to beginning and ending at zero. Derived from the twin, as 0308's duck rule derives *fired*, so it
is a kind of sound and not a name let off.

### Two pictures for the twins

`warning-appears` (the line drawn) and `beam-appears` (the line becoming the beam, `beamBloom`). Both end in
`-appears` because both are a thing being fired, which recurs, so neither ducks the music — the duck rule reads that
off the name.

### The cadence guard knows a beam's two sounds

0323's *a boss's attack finishes before its own next volley* now counts a beam as its charge and its zap, each once a
round. Both fit: the shortest round a laser has is 1.02 s and the longest of the two cues is 0.5.

## What guards it

`tests/quetzal.test.ts`, *0625*: driven at each of the pterodactyl's three laser phases with an immortal ship, a volley
is heard as exactly one charge and one zap and no crash, the zap the warning less one step after the charge — the step
the beam starts to hurt; and no beam row in the three bosses that fire them names another sound, so the fallback is
what every laser plays. `tests/sound.test.ts`: the charge builds. Probes in
`scripts/probes/0625-the-lasers-are-heard.mjs`, all four seen red; 0308's probe on the volley's cue line is re-anchored.

**Not held by any guard:** that it sounds like a laser. The cues obey every rule the table has — in the key, under
the ceiling, inside full scale — and were not listened to.

## Owed

**An ear**, on the bench (`npm run dash`, every cue on a button) and in the three fights: whether the charge reads as
charging over the pterodactyl's shortest warning (0.3 s, cut by the zap at 0.3 of its 0.42), and whether the hiss is
too long against the jellyfish's 0.3 s burn.
