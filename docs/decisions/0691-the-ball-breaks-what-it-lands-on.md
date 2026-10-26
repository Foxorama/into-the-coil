# 0691 — The ball breaks what it lands on, and runs cooler

**Accepted 2026-10-26.** From the play of 2026-10-26. Amends [0615](0615-the-ball-is-solid.md) (a body the ram
did not break knocked it back), [0617](0617-the-dance-burns.md) (that knock at half), and
[0648](0648-the-ball-runs-hot.md)'s heats.

## The ask

> *"hamster ball needs to get hit at about 40% slower than it currently does and hitting non-boss enemies feels
> off, I think it should instantly kill them instead of bouncing off, but have some haptic vibration feedback.
> should still bounce off mini and bosses."*

## What was there

A landing on a body dealt three, so on Savior a body of base two took two landings and a base four three; on
Burn, up to four. Every body that lived a landing knocked the ball back at seven tenths of a boss's knock
(0617). What *hits* the ball is its own heat: every landing fills a gauge and a full gauge burns a shield
(0609); 0648 put a landing at 0.136 and a boss's at 0.1.

## The rule

| | |
|---|---|
| **a landing on a body** | breaks it, whatever its health: the ram's pairing on the enemies' pool is scaled by `RAM_BREAKS` (a thousand), which no spawned body reaches. The boss and the mid-boss are in their own pools, paired on the gun's own weight, and are untouched |
| **the knock** | off a boss or a mid-boss only, the whole knock. The enemies' pool is not looked at: a body the ram landed on is gone, and the ball goes on through what it kills, which was 0615's own line. 0617's `bodyKnock` is gone with it |
| **the haptic** | the smash, on every landing on a body, since every one is a kill (0613's feel for a kill). The knock, 0613's feel for a landing that killed nothing, no longer fires: the row is left in `FEEL_KINDS` for the pad gap's ranking, and taking it out is a follow-up |
| **the heat** | three fifths of 0648's: a landing 0.082, a boss's 0.06, a scrape 0.0054. Twelve landings on bodies to a burn, seventeen on a boss. Cooling untouched |

## Which number *gets hit* is

The ball is not hurt by bodies, bosses or stone (0593); it is hurt by fire, on every ship's terms, and by its
own gauge. *"Get hit at about 40% slower"* is read as the gauge, which is the one way the ball is hurt by
what it does — the same number the player moved a tenth in 0648. If it meant the fire, that is 0355's
invulnerability window, every ship's, and this decision has not touched it.

## What it cost, and the guards it moved

- **`tests/solid.test.ts`**: 0615's reported one, a body of a thousand the ball came back off, is 0691's — the
  same body dies on the first landing and the ball goes on through. 0617's half-knock is gone: off a boss the
  ball still comes back over twelve pixels, and a body of a million gives nothing back. Its probe in
  `scripts/probes/0617-the-dance-burns.mjs` went with it.
- **`tests/charge.test.ts`**: a landing on a body is a kill and a smash; 0613's probes name the renamed guard.
- **`tests/ball.test.ts`**: the burn guards read the row, and hold at the new heats.
- The boss floor (`tests/boss-floor.ts`) does not fly the ram (0646), and the mid-bosses keep their rows.

Probed in `scripts/probes/0691-the-ball-breaks-what-it-lands-on.mjs`: the pairing at one again, the enemies
back in the knock, and the heat back up.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
