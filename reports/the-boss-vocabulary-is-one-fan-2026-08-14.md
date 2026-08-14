# The boss vocabulary is one fan, four ways — and Jörmungandr is five mechanisms

**Written 2026-08-14**, from:

> *"The bosses need to be more interactive with more varied attacks, a baseline is the jormungdar boss
> battle from Golf-Stars. We currently have one unique boss in into-the-coil which is level 3, all the
> other boss attacks are almost exactly identical."*

⚠️ **A SURVEY AND A SPEC. Nothing here has been built.**

## ⚠️ *"All the other boss attacks are almost exactly identical"* IS LITERALLY TRUE, AND THE FILE SAYS SO

`BOSS_ATTACK_KINDS` in `src/content/bosses.ts` is `aimed · spray · rake · ring · wall`. **Four of the
five are the same mechanism** — a fan of *n* bullets across a spread — differing only in where the fan
points and whether it rotates. The union's own comment:

> *"This union says where the fan points; the phase still says how wide and how many."*

| attack | what it actually is | used by |
|---|---|---|
| `aimed` | a fan, centred on the ship | levels 1, 4 |
| `spray` | a fan, centred on the lane | level 2 |
| `rake` | a fan, centred on the lane, rotating | level 6 |
| `ring` | a fan at 360° | levels 5, 7 |
| **`wall`** | **a row across the lane with a hole in it** | **level 3** |

⚠️ **THE ONE ATTACK THAT IS NOT A FAN IS THE ONE THE PLAYER CALLS UNIQUE, AND IT IS LEVEL 3.** The
report and the table agree exactly, which is how this diagnosis is known to be the right one — not a
guess about taste. Six bosses share one mechanism; the seventh has the only second idea in the game.

⚠️ **AND THE MOVES COLLAPSE THE SAME WAY**: `patrol` ×3, `bob` ×2, `stalk` ×2. So the seven fights are
three movements × two mechanisms.

## What the Jörmungandr fight actually does — `C:\Golf-Stars\src\app\storyFinaleScreens.ts`

Read for a named reason, on `CLAUDE.md`'s terms. It is an R-Type sequence fight, and **every stage is
a different KIND of thing rather than the same volley re-pointed**:

| stage | the mechanism, and why it is not a fan |
|---|---|
| 75% | **ACID SPRAY** — *"drifts slow enough to fly around"*: a persistent, slow, area hazard rather than a bullet with a lifetime |
| 50% | **LIGHTNING, telegraphed** — a lock-on down a line the player is SHOWN before it fires |
| 25% | **VOID BLASTS** — *"detonate across the field"*: a second-order projectile that becomes a shock ring |
| last sliver | **THE UNCOIL** — *"a barrage no pilot dodges: your shields must absorb N strikes"* |
| the end | **THE FINAL STRIKE** — *"when its eye is bared, strike the ball home"*: a vulnerability WINDOW |

The Herald variant re-skins the same five: a **flak curtain walked across the field**, spinal **lances
down a telegraphed line**, seeker **torpedoes detonating into rings**, then everything at once.

⚠️ **FOUR OF THOSE FIVE ARE MECHANISMS THIS GAME HAS NO VOCABULARY FOR AT ALL.** Not tuning — there is
no telegraph, no delayed detonation, no persistent hazard, and no vulnerability window anywhere in
`src/`.

## ⚠️ The word in the report is *interactive*, and that is the finisher rather than the attacks

A fight made only of harder volleys is a **damage race the player dodges through**. What makes the
Jörmungandr fight interactive is that **the player's own choices change it**: shields are hoarded for
a barrage that is designed to be unsurvivable without them, and the fight ends on a window the player
has to be ready for rather than on a health bar reaching zero.

⚠️ **INTO THE COIL ALREADY HAS BOTH RESOURCES AND NEITHER HAS A MOMENT IT IS FOR.**
[0050](../docs/decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md)'s
shield and [0053](../docs/decisions/0053-the-bomb-is-the-first-thing-the-player-spends.md)'s bomb are
spent whenever, against anything. **An `overwhelm` phase is the first thing in this game a shield
would be FOR**, and it costs no new resource — only a reason.

## The proposed vocabulary, as arms of the existing closed union

Each is a MECHANISM and not an aiming, which is the whole point —
[0110](../docs/decisions/0110-an-attack-is-a-pattern.md) and
[0111](../docs/decisions/0111-a-boss-has-one-idea.md) already say a boss has one idea and an attack is
a pattern; what is missing is that there is only one idea to have.

| new arm | what it adds that no existing arm has |
|---|---|
| `sweep` | a curtain that WALKS across the lane — `wall` is static, and a moving wall is a different problem |
| `lance` | a **telegraph**: a mark is drawn, then fired down. The first attack in the game the player is warned about |
| `mine` | a shot that travels, stops, and **detonates into a ring** — a second-order bullet |
| `overwhelm` | a barrage that is not dodgeable, sized against the shield pool. The reason to have carried one |

⚠️ **`drift` — A PERSISTENT AREA HAZARD — IS DELIBERATELY NOT ON THAT LIST.** Everything in this game
is a pooled entity with a lifetime ([0034](../docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md));
a lingering field is a new kind of thing on the field and wants its own decision, not a union arm.

⚠️ **AND THE FINISHER IS THE ONE THAT IS NOT AN ATTACK.** A bared-vulnerability window is a change to
what a PHASE is — `BossPhase` is keyed to health and says rate, spread and count. A window is a phase
that says *stop shooting and open*. That is the largest single change here and it is the one the word
*interactive* is actually asking for.

## ⚠️ Ordering, and what must not be bundled

1. **`overwhelm` + the vulnerability window first.** They are what makes a fight a fight, they reuse
   resources that already exist, and they are testable without any new drawing.
2. **`lance` next**, because the telegraph is a new drawing primitive and
   [0036](../docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md) says an event
   the model resolves and the picture never mentions gets re-reported as a different bug.
3. **`sweep` and `mine` after**, which are the cheapest of the four.
4. **Then re-author the seven bosses** so no two share a mechanism.

⚠️ **NOT IN THE SAME PR AS THE BOSS ART ACCENTS** (`where-the-art-ceiling-is-2026-08-14.md`). A verdict
on how a boss LOOKS and a verdict on how it FIGHTS, changed together, is unattributable —
[0109](../docs/decisions/0109-a-death-is-a-drum.md)'s standing rule.

⚠️ **AND THE DIFFICULTY DIAL IS DOWNSTREAM OF ALL OF IT.**
[0084](../docs/decisions/0084-the-dial-is-the-level-and-the-guns.md) sizes a boss against the volley it
throws; four new mechanisms means the tiers are re-sized after, not during.
