# 0609 — The ball takes its knocks

**Accepted 2026-10-17.** From a play of [0593](0593-the-hamster-ball-rolls.md)'s Hamster Ball and its War Dance,
which [0594](0594-every-ship-dances.md) gave to every ship. **Amends 0593**: the ball no longer breaks.

## The ask

> *"For the hamster ball itself — let's change it so it gets 3 shields on every difficulty and instead of the
> ball disappearing on ram, it has a shield regen rate - currently it's way too punishing with the bullets, so
> trying to figure that out. The special also needs to look way cooler and bounce around the screen more, needs
> a flaring aura, noise and impact sounds when it hits the walls."*

## The rule

**The Hamster Ball opens every life on three shields and carries no more, on every tier, and they come back on
their own: two seconds after the last hit, then one every three. A full heat gauge no longer breaks the ball: it
burns a shield off, as a hit does, and the ball rolls on cool and whole. With no shield left that burn is a
death. The War Dance flies faster and leaves every wall on a new heading, wears a flaring aura under every shot,
hums for as long as it lasts and is heard and seen at every wall it meets — on every ship.**

| | |
|---|---|
| **the count** | `shields` on every ship row: `3` on the ball, `null` on the rest, which is the tier's. Shared code holds the default (`shellOpenFor`, `shellCapFor`, under `openingHealthFor` and `fullHealthFor`), so every reader of the tier's shell — a life opening, a boundary renewing, a pickup capped, the readout's pips, Burn withholding a shield — reads the ship's where it says one ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)) |
| **the regen** | `regen` on every ship row — `{ rest: 120, every: 180 }` on the ball, `null` on the rest. `regenShell` reads a hit as the health having dropped since it last looked, so no pairing has to tell it; it runs before `stepShields`, so the mark comes back on the step the health does |
| **the burn** | `burnRam`, last in the ship's own pairings: at a full gauge, once the window a hit gives has run out, a hit of `playerDamage`, the gauge back to cool, `BURST.burn` and a burst flare off the ball, and `ballBurns` (0593's `ballBreak`'s sound). Inside the one-hit cap, so `killedBy` reads it as a body's — a crash |
| **gone** | `bare` on every ship row and the six `ballBare*` bitmaps; `ramBrokenFor`, `breakBall`, `mendBall` and the ram row's `recharge`; `ballMend`, whose sound is `shieldBack` now |
| **the dance** | `speed` 3.4 from 2.2, and `angles` on its row: the heading off straight across, taken in turn at each wall (`bounceDance`). Measured on every ship, one dance meets six walls where it met three, and covers 0.99 of the lane and 0.99 of the box along |
| **the flare** | `flare` and `flareHold` on the dance's row: four frames of a corona of eleven flame tongues (`danceFlare0`–`3`, `drawDanceFlare`), in the aura pool beside a surge's (`stepAuras`, `wearAura`) |
| **the sounds** | `danceHum`, struck every `hum` (24) steps from the dance's first, 0.46 s long so each runs into the next; `danceBounce` at every wall, panned to where it was met, with `BURST.bounce` and a spark there |
| **the boss weights** | the ram's `bossWeight` 1.6 from 8, the serpent's 1.5 from 7 and the jellyfish's 2.4 from 9 — re-solved below |
| **the pools** | the aura pool two from one, the enemy shots 195 from 196 — the pools total 500 (`tests/budget.test.ts`) |

## Why it is built the way it is

**The bullets were the punishing part, and the break made them worse.** The ball's shell was the tier's: on
Savior a life opens on the hull, on Burn there is none to fly for. A ship that must be touching what it kills
spends more of its run in the bullets' face than any other, so the first bullet was usually the last — and a
ball broken for three seconds was a ship with no gun in the middle of the fight it had been ramming. Three shields
that come back answer the first; taking the break out answers the second.

**The heat still costs something, because the page's challenge was the heat.** *"Overheat → need to let shields
recharge"* reads exactly as built now: overheating spends a shield, and the shields recharge. A ram that cost
nothing would make the ball the one ship with no way to misplay its gun. So it is a hit, on every hit's terms —
it waits out the window ([0592](0592-the-crashes-are-counted.md)'s single hit a step), it takes the assist's
damage, and with nothing left it kills. The heat under the ball says which stage it is at, as 0593 drew it.

**Two seconds and three.** The rest is long enough that a ball still being hit never mends — any hit puts it back
— and short enough that backing off one wave is rewarded. From bare to a full shell is eleven seconds, so a fight
is flown at two or three shields and a run of mistakes still empties it. Both are play numbers, and the player's
to move.

**The count is on the row, and the tier is the default.** *"On every difficulty"* is the ball's own number; every
other ship keeps its tier's. Regeneration is its own field rather than a flag on the count, so a later ship can
regenerate a tier's shell or carry its own without regenerating.

**The boss weights were solved against a ball that broke.** 0593 set eight because a held ram spent most of a
fight broken. Without the break a held ram lands every `landGap` for the whole fight, and at eight the quickest
fights from the hull fell to 9–12 s against [0260](0260-a-boss-is-fought-to-the-end.md)'s forty (the serpent 6.5 s,
the jellyfish 9.1). Flown with the floor's own flight (`heldShorts`, Savior, a scratch script over
`scripts/weigh-boss.mjs`'s `flyFight`):

| | was | at the new weight |
|---|---|---|
| volans, quetzal, gyre, hoarfrost, hydra | 9.3–12.0 s at 8 | 48.3–61.6 s at 1.6 |
| the serpent | 6.5 s at 7 | 31.6 s at 1.5 (33.9 at 1.4) — 0593's seven had it at 31.1 |
| the jellyfish | 9.1 s at 9 | 44.4 s at 2.4 (68.5 at 1.8) |

The fixture holds the ship unhittable, so a burn never lands in it, which is the quickest fight the floor asks
about: a real ball pressed on a hull burns a shield every second and a half and backs off.

**The dance bounces off its row's headings, not a fixed diagonal.** Reflected at 45° it drew the same X every
time. Each wall turns it to the next of six authored headings, keeping the direction away from the wall, so the
path is new every throw-length and reaches every corner. No randomness, so no stream to thread (0021).

**The flare is under every shot.** [0373](0373-a-special-is-the-guns-own.md) took the surge's aura from over
the bullets, and 0594 left a dancing ship's ram unseen for that reason. The flare is in the same pool as the
surge's aura, below the hostile shots, so a bullet crossing it is drawn over it; and the dancing ship cannot be
hurt while it wears it. It is no disc — 0379's play said a basic circle round the ship looks terrible — but
tongues each licking on their own phase, and its four frames held six steps each turn two and a half times a
second, under [0024](0024-the-accessibility-floor-is-settings.md)'s three.

**The hum's twin is a thing appearing, so it never ducks the music** — the jet's spray's terms
([0599](0599-the-water-and-the-paint-are-heard.md)), which `tests/sound.test.ts` reads off the twin.

**Every wall is seen where it is heard.** [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md):
a turn the model resolves at a wall is sparks there and a knock panned there, and the stone counts as a wall.

## Guards changed, and why

- `tests/ball.test.ts`: 0593's *a full gauge breaks it*, *broken, the ball is drawn without the ball, rams
  nothing, and a body hurts it* and *comes back whole and cool after its recharge* encoded the break this
  replaces, and are gone with it; the heat's first half lives on in *a full gauge costs one shield*. *A body the
  ball flies into* holds the gauge cool while it asks about bodies, and says so, because a burn is the heat's.
- `tests/tier-shell.test.ts`: *at the run's start, after a death and after a continue* said in its own comment
  that a ship whose row opened on its own would be a different answer there. This is that row; it now reads
  `shellOpenFor`, which is the tier's wherever the row says nothing.
- `tests/accents.test.ts`: the flare's frames are hull-less, as the surge's aura and the heat are.
- Probes re-anchored where the code moved under them: 0050, 0081, 0355 (two), 0373, 0476, 0479, 0526, 0594 and
  0595; 0593's file retires its two break probes and moves *a landing that heats nothing* here.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). No key, no save field, no cache prefix.

## What guards it

`tests/ball.test.ts` (the burn, the window, the death and crash, three on every tier, the regen's clock, the mark,
the rest put back), `tests/dance.test.ts` (walls a second, headings, the box covered, every wall heard and
sparked, the flare on every ship, its rate, the hum unbroken), `tests/tier-shell.test.ts` (a ship's own count
inside the pool), and the floors in `tests/level.test.ts` and `tests/serpent.test.ts` at the new weights. Probes
in `scripts/probes/0609-the-ball-takes-its-knocks.mjs`.

## Owed

- **A play** of the ball at three shields with the regen — whether two seconds and three is forgiving enough on
  Burn, and whether the burn still makes the heat worth watching.
- **A play of the dance** at 3.4 and its headings, on the ball and on a ship that is not.
- **The flare at the shipped camera**, photographed on the bench once: whether it reads as flame round any ship,
  and against each place's backdrop.
- **The ear** on `danceHum`, `danceBounce`, `ballBurns` beside the `shield` cue it lands with, and `shieldBack`.
- **The boss weights in play**: the fixture's quickest fights are a ram held unhurt on the hull; a real one backs
  off to cool.
