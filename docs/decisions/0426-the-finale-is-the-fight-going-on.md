# 0426 — The finale is the fight going on

**Accepted 2026-09-30.** Amends [0418](0418-the-heart-lets-go.md). The finale is one shot, and its
first frame is the fight's last: the heart the jellyfish died on races, catches fire and bursts; the
Viper is thrown out of it; the fighter comes up beside her; and the two fly off together, each golfer
speaking from their own ship, until they open up and go.

## The ask

> *"the ending movie isn't that great, it doesn't flow nicely and the dialog only works if you played
> the first game a lot, it should be character flavoured but more relevant to be saved/found/rescued
> etc. I think it needs to be a better heart explosion that flows more freely from the end boss scene
> and then the ships are flying away and the speech bubbles come out of the ships as they fly away
> rather than the weird cut to faces at the moment."*

## Why it did not flow — three seams, one of them in the fight

1. **The heart went with the jellyfish.** A `socket` seat is laid in the boss's aura pool, and an empty
   boss pool cleared that pool on the step she died — so her whole 1.6 s death beat played over no
   heart at all.
2. **The finale faded up out of the backdrop** on a heart staged at its own place in the view, with the
   jellyfish — who had just exploded — back on it, melting.
3. **Three cuts to the backdrop** between four shots, two of them close-ups nothing else in the game
   looks like.

## What changed

- **A heart outlives what was feeding on it** (`layAura` in `src/app/frame.ts`): a seat that beats
  stays where it was set once the boss is gone, holding station with the camera, flames dropped. ⚠️
  **Keyed on `bossSpawned` with an empty pool, not on `bossBeaten`** — the aura is laid before the
  step latches `bossBeaten`, so on the step she dies the latch is still down and the first draft
  cleared the heart exactly as before. A probe holds it. A new level lowers `bossSpawned` and the seat
  is cleared as any other.
- **`holdFinale`** hands the finale the fight's last frame once, as it starts: the camera and its
  rate, the place's sky, landmarks, room and pools, the picture's clock, the heart's seat and the
  fighter's place and hull (`FinaleScene`, `src/render/finale.ts`). Nothing steps under the finale, so
  that frame is still the world's.
- **The painter draws the fight's own scene** with `paintScene` and no bodies in it, so the vessels are
  still laid to the heart and the sky does not jump. ⚠️ **Which is why the finale's atlas is now the
  GAME's first** — `paintScene` blits by the game's indices — then the port's (`PORT_BASE`), then its
  own (`FINALE_BASE`). No veil until the very end.
- **The heart, racing** (`src/content/finale.ts`): its beat quickens from the fight's to a flutter,
  it swells and shakes, sixteen fireballs break out of it closer and closer together, and it clenches.
  **The burst**: a flash, a ring of its light going out across the lane, thirty shards and forty-four
  embers thrown in the world — so they stream away behind as the camera goes on — and fire going on
  after. The fireballs and embers are the game's own; the shards, glow and ring are baked here.
- **The ships at the game's scale.** The Viper is the port's bitmap drawn at the fighter's scale and a
  fifth bigger, thrown out rolling and rocking level as her engines light; the fighter is the hull the
  fight last drew, whatever its guns made it, with its own exhaust. They form up — the Viper above the
  lane's middle, the fighter below and behind — and the sky speeds up under them: they are leaving.
- **The bubbles ride the ships**: placed each step off `viperAt` and `fighterAt`, the same functions
  the painter draws them by. The Viper's hangs above her and the fighter's below it. ⚠️ The first
  photograph hung both above, and the fighter's covered the Viper for the whole of its line.
- **Each bubble names who is speaking**, beside a mark in their cap colour. With the close-ups gone,
  nothing else would say which golfer was in the Viper — [0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md):
  0418's ask was that you could see who it was, and dropping the faces must not drop that.
- **The lines are about being found**, in a voice that is theirs, and assume nothing about the golf.
  Any `saved` line can be answered by any `saving` line, so neither answers something only one says.
- **The bench's `?finale` kills the jellyfish for real** — the six places before cleared, the camera
  stood short of her, and once she has settled the health scrub set to a hundredth, so the parked ship
  finishes her. A finale that goes on from the fight cannot be looked at from a fight that never happened.

## What it does not do

- **The bubbles are placed for a landscape screen**: above and below are across the lane, which is up
  and down only when the long axis runs across the screen. Desktop is the target
  ([0153](0153-desktop-is-the-target.md)); the phone port has not started.
- **There is still no victory piece** — 0418's owed item, untouched.
- **Nobody has watched it at speed but a script.** Stills at chosen moments, on the bench at
  1280 × 720, for two pilots. The feel of the race into the burst, and the voices against the moving
  bubbles, are the play owed.

## Guards

`tests/finale.test.ts`, in pixels and seconds: **the heart stays, holding station, through her whole
death beat in the sim, and is handed over from there**; **the first frame has no backdrop over it and
the heart and fighter within half a pixel of where the fight had them**, on the narrowest and widest
screens and three places a fight can leave them; the heart catches fire before it bursts, bursts into
shards and a ring, and the Viper appears where it was; **each line is said from its own ship, on the
screen, within a hull's length of its tail, with the other ship clear of the side the bubble hangs**;
both ships are off the widest screen before the fade; every cue is played over its twin. 0418's line,
voice and rescue guards stand, with the read-time measured against the bubble's own window.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `scripts/probes/0426-the-finale-is-the-fight-going-on.mjs`:
the hold keyed on `bossBeaten`; the heart left behind by the camera; the finale fading up out of the
backdrop; the heart staged at 0418's place; no fire before the burst; the fighter's bubble hung above;
the Viper drawn off her bubble's place. 0418's probes for the jellyfish's melt and the close-ups are
removed with what they held; its Viper-before-the-burst, ships-too-slow and no-surge probes are
re-anchored on the new painter, breaking what they broke.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Nothing is persisted.
