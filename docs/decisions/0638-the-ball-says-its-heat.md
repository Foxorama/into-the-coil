# 0638 — The ball says its heat, and the shield it is mending

**Accepted 2026-10-18.** From [`the-morning-play`](../../reports/the-morning-play-2026-10-18.md), item 2. Adds to
[0609](0609-the-ball-takes-its-knocks.md)'s regen and heat and to [0613](0613-the-dance-is-earned.md)'s readout.

## The ask

> *"the hamster ball needs to show the shield regen rate somewhere as well as the heat gauge somewhere and all of
> that also needs to be displayed well in mobile somehow as well for the hamster ball."*

## What was true

- **Heat:** the only sign of it was a glow under the ball, in four stages. It was small on a phone and easily lost
  in a busy lane.
- **Shield regen:** only its result was shown. A pip popped back with a sound, but nothing said how long until
  the next one.
- **On a touch screen** the readout keeps the ship and its shields and lets the triggers' counts go (0465), so
  anything put beside the triggers would not be on a phone.

## The rule

| | |
|---|---|
| **heat** | a gauge in the readout, after the shields it burns: the word HEAT and a bar in the hazard's gold, filling with the ram's gauge. From three quarters, where the glow under the ball turns red, it is the bullet's hot ink and pulses. Hidden on every ship that does not ram |
| **the shield coming back** | the next empty pip fills from its foot, inside the shield's own shape, as its countdown runs (2 s after a hit, 3 s between shields). Nothing when the shell is full |
| **a reader** | the gauge is labelled *Heat N%*; the shields' label adds *next shield N%* |

Both values come from the world on a change only, in twentieths, as the charge bar does (`heatShare`, `mendShare`,
`onHeat`, `onMend`). `closeRun` tells the chrome that both are gone, on [0634](0634-the-boss-bar-goes-with-the-run.md)'s
terms.

## What guards it

- **`tests/ball-readout.browser.test.ts`**, in the built page, flying Unity:
  - the gauge is drawn at least 24 px wide and wholly on the glass, on a 1280×720 desktop and on an 844×390 touch
    phone;
  - a ship that does not ram draws none.
- **`tests/ball.test.ts`, *0638***:
  - the readout is told the gauge;
  - across a shield's countdown, the mending value climbs from nothing to all but whole, then goes when the shield
    lands.

Probes are in `scripts/probes/0638-the-ball-says-its-heat.mjs`: the gauge never handed to the readout, and the
mending value stuck at nothing. Both seen red.

## Owed

- **A look on a phone in a fight**, whether the gauge and the filling pip read at a glance.
