# The bosses' look, planned — 2026-10-04

A plan for the seven end bosses' graphics and animation, **written for the next session to build
from, cold.** It holds the player's notes of 2026-10-04 verbatim, what each note is against the code
and the measurements, one proposal per note with its cost, and a queue in the order recommended. It originates nothing about
the game that a decision or a report does not already say; where it proposes, it says so. Under the
standing instruction of 2026-09-10 — *"when it comes to bullets and enemies, stop assuming, present a
plan"* — this is the plan, and nothing in it is built.

Three of the notes turned out to be defects in the fight rather than in the picture, and the plan
puts those first: a jellyfish fight that **never finishes from most places the player can stand**,
a fish whose last stage **cannot be shortened by any gun**, and a gyre whose health bar **comes back
after it is dead**. Each is measured below.

## Before anything

Read, in this order: `docs/machine.md` (node is not on PATH), `CLAUDE.md`, `docs/game.md`,
`docs/state-of-play.md`. Every change lands through `/ship` (`.claude/skills/ship/SKILL.md`): one PR at
a time, a branch off a fresh `main`, a decision record, probes under `scripts/probes/` that break each
new guard on purpose, `npm run check` then `npm run prove`, the exit codes read and never the output.
Decision numbers are taken when a PR lands, not here; `0473` landed on 3 October, so the next free one
is `0474`, and `0373`–`0375` are each used twice — check `ls docs/decisions | tail`.

**Where the game is, 2026-10-04.** Production (`intothecoil.vulpecula.games`, GitHub Pages and
itch) moves only on a `v*` tag, and the last is `v0.3.0` at the 2 October bump; nine merges since
— the phone chrome, the dice, the ray gun turret, the Firebird, the additive light, the cold, the
thinned fights, each place's arms — are on `main` and on staging only, and staging
(`next.intothecoil.vulpecula.games`) sits behind a Cloudflare Access sign-in. A release is a bump PR
and a tag push; the release workflow runs the suite first. The title rows of 0458 **are** on
production. Items 2–4 of [`the-menus-reviewed`](the-menus-reviewed-2026-10-02.md) — settings kept,
the pause, the touch section — were never built, and `the-pods-are-cigars` (0469, the fighter's
wingtip pods) is a pushed branch with no PR.

**The standing answers from the player, which no PR below may reverse without asking:**

- *"patterns only"* — nothing a boss throws homes; one pilot a level (0258); only the fish stalks.
- the uncoil's hole is **in the same place every time, on purpose** —
  [0151](../docs/decisions/0151-the-gap-you-have-to-reach.md) quotes the player: *"a static hole in
  the wall is a pattern the player needs to learn, a variable hole that spawns close to the ship
  negates the entire difficulty of the obstacle."* Item 4.2 below touches this and stops for an answer.
- a heal may push the jellyfish back over the open line and *"the bell closes again"* —
  [0404](../docs/decisions/0404-the-rain-feeds-it.md), the player's own choice. Item 7.2 keeps it.
- difficulty is managed by one question — *"is this unfair, or is this a learnable strategy?"*
- *"Don't make the serpent boss a hard rule, the pattern is what we want, the style is what makes the
  different bosses unique"* ([`the-fish-asked`](the-fish-asked-2026-09-12.md)). Every mechanism below
  is a default a row may override, never a constant — 0282.
- **a boss is not redrawn from a description.** Agreed 2026-09-08
  ([`the-vocabulary-is-the-ceiling`](the-vocabulary-is-the-ceiling-2026-09-08.md)): the target for an
  art pass arrives as a reference or a sketch from the player. Every art item below is faster with one;
  without one, the PR carries before-and-after photographs off the bench at the shipped camera, and
  the player's eye on the branch preview is the verdict.

**The instruments.** Every number in this file came from one of them; every PR below re-runs the one
it moves. All run as `node --experimental-transform-types --import ./scripts/ts.mjs scripts/<name>.mjs`.

| instrument | answers |
|---|---|
| `scripts/weigh-boss.mjs <boss> --difficulty=savior` | seconds to kill, per gun, from fifteen held places and the boss's own lane, split at the phase lines; `never` is a verdict |
| `scripts/weigh-threat.mjs <boss>` | hits a second on a parked ship; adds called against arrived |
| `scripts/solve-phase-bands.mjs <boss>` | the `upTo` values that make every phase last as long (0386) |
| `scripts/weigh-flashes.mjs` | drives the bench headless, pins a boss at a health and photographs the stage — the template for every picture in this plan |
| `rig/bench.html` (`npm run bench`) | the real game with a level select, an along scrub, and `#bosshp` to stand a boss in any phase; `?proof` makes the ship unhittable |
| `scripts/shot-sheet.mjs <kinds> --zoom=8 --theme=<place>` | one sprite off the sheet at zoom (needs `npm run sheet`) |

⚠️ The browser pane freezes the sim between calls, so nothing animated can be judged in it
([0398](../docs/decisions/0398-the-pterodactyl-is-feathered.md) notes it for the wingbeat): motion is
judged from a Playwright sequence at chosen steps, or by the player.

## What was said, 2026-10-04

> *the serpent*
> - *the roots are flat walls, no roots that look like a tree root with the serpent coiled around them*
> - *the lightning aura just looks bad.*
> - *there's aura and lightning phases, but no damage shows on the boss*
>
> *the fish boss*
> - *i think it's just the mouth is animated a bit too fast*
> - *no damage shows on the boss*
> - *the jumpy animation feels a bit weird*
> - *at end of health, the jumpy animation can't be interrupted, you should be able to damage it fast
>   enough to skip the jumpy animation and not be forced through a none-interactable action.*
>
> *the pteradactyl*
> - *feathers could be better*
> - *no damage shows on boss*
> - *up down animation just doesn't feel natural*
>
> *the cog (level 4)*
> - *the bullets don't really fit graphic wise*
> - *the hole in the bullet walls feels like it almost always appears in the same place*
> - *when it dies there's a health bar still visible -> I want this to be killable as a first in game
>   achievement -> it should take 1 bomb, 1 missile upgrade and full autofire to completely kill it. We
>   don't have achievements yet so just make the dead boss killable and I'll add the achievement later.*
>
> *ice boss*
> - *the aura needs to be a bit more translucent, it overpowers the screen at the moment.*
> - *needs some more adds and a slightly slower boss fire rate (although the fire rate was recently
>   tweaked, so it might be good now*
>
> *hydra*
> - *the heads don't blend into the body graphically that well*
>
> *jellyfish*
> - *the heart and jellyfish should be part of the background graphics like the cog is for the labyrinth*
> - *the jellyfish never opens for the 'double damage' phase.*
> - *the tentacles could look a lot better*
> - *it should have a glow to it similar to the falling jellies starts out green -> yellow -> amber ->
>   red based on health and as it gets healed it's glow will change based on that.*
> - *it should be set a bit further back in the screen for the fight, you shouldn't be able to fly
>   around it.*
> - *probably some other things.*

## What is there today, across all seven

**How a boss shows a hit.** Every body swaps to a hurt twin — the same art under a 0.55 wash of the
impact ink — for four steps, then refuses to re-arm for eight
([0035](../docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md),
[0278](../docs/decisions/0278-the-flash-is-a-wash.md),
[0334](../docs/decisions/0334-a-hit-is-an-event-again.md)). An ordinary gun hit does not spark; only
blades, missiles, stone and the serpent's armoured flank do.

**How a boss shows its health.** The bar, notched at the phase lines
([0360](../docs/decisions/0360-the-boss-has-a-health-bar.md)); a burst and a cue at every phase turn
([0111](../docs/decisions/0111-a-boss-has-one-idea.md)). On the body itself, three mechanisms exist and
each is used by one or two bosses:

| mechanism | field | who uses it | what it shows |
|---|---|---|---|
| a look per phase — faces, aura, tail | `BossPhase.look` ([0305](../docs/decisions/0305-the-serpent-darkens.md)) | serpent (horns grow, aura comes), fish (kindled → ablaze → blazing), pterodactyl (cannons lit) | **escalation**, by design — 0320 removed a sawtooth fin *because* it read as damage |
| a hull per phase | `BossPhase.hull` ([0332](../docs/decisions/0332-the-gyre-is-set-into-the-wall.md)) | gyre (chipped → broken → burnt), jellyfish (the open bell) | **damage**, on the gyre only |
| flames that climb with lost health | `row.burn` ([0336](../docs/decisions/0336-the-wheel-comes-off-its-post.md)) | gyre | the one quantity anywhere that moves **continuously** with health |

Nothing on any boss cracks, bleeds, smokes, loses a part or changes tint as it is hurt, and the serpent,
the fish, the pterodactyl, the frost ship and the hydra author none of the three. *"No damage shows on
the boss"* is said three times in the notes and is true of five bosses.

**What a boss is made of.** Baked bitmaps blitted in four layers — `bossAura` behind (flames, the
seat, the chill, tails, hydra necks), `bossBody` (chain nodes, tentacles), `bossPool` (the hull),
`bossFront` (hydra collars only) — with the room's walls painted behind all of it and the bolts
stroked over it ([0022](../docs/decisions/0022-frame-rate-is-a-feature.md),
[0233](../docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md),
[0470](../docs/decisions/0470-the-light-is-additive.md)). `blit` takes a scale, a turn and, since
0401, an alpha — but the entity loop in `src/render/scene.ts` passes no alpha, and that file is on
the hot list with two probes anchored on its blit lines.

**How a boss moves.** Five kinds, all across the lane ([0111](../docs/decisions/0111-a-boss-has-one-idea.md)):
`patrol` (constant speed, instant reversal at the edges), `bob` (a sine), `stalk`, `socket`, `wade`.
Nothing in a fight turns a hull from its velocity; only entrances and the fish's leap do.

**Measured today, Savior, every gun in its own ship, missiles silenced** (`weigh-boss`, 2026-10-04):

| boss | pulse median / on its lane | arc | shuriken | ray | last phase begins |
|---|---|---|---|---|---|
| volans | 44 s / 87–42 s | 41 s | 42 s | 46 s | 30–33 s, so the last stage is **about ten seconds** |
| gyre | 87 s / 83–49 s | 41 s | 50 s | 45 s | 24–30 s |
| medusa | **never** / never, never, never | never / never, 55, 65 | never | never; **the open phase is never reached** | 53 s on the single best lane |

---

## 0. The red bullet that hung on the Rime Shelf — not reproduced, and what is done first

> *"there was a weird bullet bug on the ice shelf, this red bullet hung around on the screen. the only
> way I could get it to go away was by flying into it and dying."*

**What the picture says.** The screenshot is the Rime Shelf mid-level — no boss bar, two bomb
pickups on the field, so most likely just after the redoubt died — with the caddie at the trailing
edge and a small red-orange mark with a lit core sitting in the upper middle of the screen. The
Rime Shelf paints every placed hostile bullet in its `foe.shot` ink, `#ff5a1e`
([0296](../docs/decisions/0296-a-bullet-belongs-to-its-place.md)), and at that size the mark is either
the turret's and the redoubt's `flak` (a bevelled slab with a glow and a hot core) or the shard's and
the warden's `spit` (a square with a halo and a white heart). It killed the ship on contact and went
with it, which is what a live shot in `enemyShots` does: a shot that lands is spent. So it was a
model shot with no velocity in the camera's frame, and nothing culls a shot that never leaves the
screen — the cull is at both along edges and across, never by time.

**What was checked, and ruled out.** `scripts/weigh-stuck.mjs` (new, in this change) flies a whole
level headless and reports any hostile shot still on the screen after five seconds, with its kind,
velocity and company. Six flights of the Rime Shelf — parked and sweeping, the pulse and the ray,
immortal and mortal (29–41 deaths a flight), Savior and Burn — found **no lingering shot**, and the
slowest thing on any screen was a melting flake at 0.86 a step. Read against the code:

| mechanism | verdict |
|---|---|
| a throw at zero speed | none: every arm multiplies a row speed by the tier's, and no hostile row has `speed` 0 |
| the wall's slot stop (`spreadShots`) | zeroes the across velocity only; the along keeps the row's speed |
| a stale slot (`steerAcross`, `holdFor`, `spin`, `firePhase` left by a released shot) | `reset` clears all four on every spawn |
| the curl (`bendShots`) | a rotation, so the speed is preserved; the wave rides the along velocity, which is never zero |
| a respawn after a death | clears the ship's own things and nothing hostile, by 0057's rule |
| the scroll rate changing under a thrown shot | the rate is one number a level; the warp multiplies it only between places |
| the breaker's hold | the fish's only, and never on this level |

A seventh pass flew **all seven levels** the same way (mortal, sweeping, the ray): nothing on the
Rime Shelf again, and the only shots that lingered anywhere were the gyre's own curtains crossing
its stopped room at half a unit a step — authored, and a note for the instrument that a linger
threshold has to clear the slowest authored crossing.

**What it is conditional on, then,** is something a headless pilot does not do: a thrown special
(the caddie's nova pops shots it crosses; a bomb; a void), a resize or rotation mid-level, a hidden
tab, or the exact moment of the redoubt's death. **The next session asks the player one question
before anything else** — *what happened just before it: a special thrown, the mid-boss dying, a
death, a window change?* — and adds that condition to the instrument.

**Proposal, in two halves, and the second is not the first.**

1. **Find it.** The instrument gains the missing conditions one at a time — a nova and a bomb
   thrown on a clock, a rift, a resize to the phone's shape mid-level, the redoubt killed by a
   bomb at the step it fires — until it reddens; then the fix is the cause, and the guard is the
   instrument run over every level in `tests/` with `linger` as its budget.
2. **And only then, if the cause is a class and not a line:** a hostile shot with no velocity in
   the camera's frame for a second while on the screen is spent, with the melt's burst
   ([0036](../docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md)). ⚠️ This is
   the cheap mechanism, and on [0280](../docs/decisions/0280-a-cheap-mechanism-does-not-rename-the-ask.md)'s
   terms it does not rename the ask: it makes the bullet go away and leaves whatever put it there.
   It is written down so it is not reinvented as the fix.

---

## The cross-boss item: damage shows on the body

**Diagnosis.** Three notes say the same thing about three bosses, and it is true of five. The flash
says *a hit landed*; the bar says *how much is left*; nothing between them says *this animal is
hurt*. The gyre is the one boss that does it, and it does it with the cheapest mechanism in the
table above — a hull per phase, which the bar's notches already announce.

**Proposal — two channels, every boss authors its own.** Per
[0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md), shared code
holds the mechanism and the default is *nothing*; each row says what its damage looks like, and a
boss may use one channel, both, or neither.

1. **A hit sheds what the animal is made of.** `row.shed: SpriteKind | null` — a fragment thrown into
   the debris pool from the point of impact when a hit *arms the flash* (so at most one shed every
   twelve steps, five a second, under any gun — the 0334 gap is the cap and no new one is needed).
   Scales for the serpent, embers and a fin-scale for the fish, **a feather for the pterodactyl**,
   a cog tooth for the gyre, ice for the frost ship, glass for the jellyfish, acid-flecked flesh for
   the hydra. Continuous, cheap (one sprite a boss), and it is the pterodactyl's whole answer on its
   own. **Consider the screen:** debris already flies on every burst; five small fragments a second
   that fall away from the hull are below the frost's flakes and the jellies' rain in every fight.
2. **A wear ladder — the hull per phase, generalised.** `BossPhase.hull` already does it for a
   boss with one bitmap. For a boss with faces (serpent, fish, pterodactyl), the ladder rides
   `look.face` instead: a worn face set per phase. For a chain or a tentacle, a worn node sprite on
   the phase. **The art is damage, not escalation:** gashes that leak the acid's green down the
   serpent's body, torn fins and missing scales on the fish, gaps in the pterodactyl's primaries, a
   cracked bell, a chewed cog. The bar's notches tell the player when to look.

**Cost.** Channel 1: one sprite a boss plus a `shed` arm beside `flash()` in `src/sim/collide.ts`
(hot file; the probe anchors there are 0334's). Channel 2: for a boss without faces, three rests plus
three twins (the twins come free from the `Hit` naming); for a faced boss, faces × 2 per step — the
serpent has seven faces and three horn sets already, so its ladder is authored on the *body node*
(one sprite per step) and the skull keeps its faces. The atlas has no memory ceiling and bakes on
every place change; a 52-unit hull is about a megabyte at the 10 px/unit cap, so a ladder is a few
megabytes at worst and no bake budget bites (0245 governs test wall-clock only).

**Guard.** Driven: a boss authoring `shed` throws at least one fragment under a gun that lands every
step, and never more than one in `IMPACT_FLASH_STEPS × (1 + FLASH_GAP_DUTY)` steps — player units, a
count a second. A phase that authors a `hull` or a worn face changes the drawn sprite on the step
the phase turns, and changes it *back* on a heal (the jellyfish needs this). The gyre's own guard
that a hull's extent may not change between phases holds for every ladder.

**What this does not do.** It does not make the flash continuous, dim it, or tint the hull by
health arithmetic. 0278 measured the wash's floor; 0334 fixed its duty; and a continuous tint needs
the alpha the entity loop does not pass — costed under item 7.4, where it is actually asked for.

---

## 1. The serpent

### 1.1 Roots that are roots, with the serpent round them

**Diagnosis.** The *"roots"* are `rootWall`, one 12-unit tile — a dark bed with six diagonal lines
stroked three ways — wallpapered by `paintRoom` along both lane edges and across the far wall, about
thirty identical blits ([0459](../docs/decisions/0459-the-bosses-are-placed.md)). No shape, no
curvature, no relation to the body. The room has no sim role: the walls are *"the picture of a bound
that already existed"* ([0335](../docs/decisions/0335-the-fight-happens-in-a-room.md)), and the Approach
authors no corridor. 0459 refused roots drawn over the body: *"nothing the player has to see is
behind scenery."*

**Proposal.** The room's wall stops being a tile and becomes **a few large root pieces** — a knotted
trunk, a fork, a tapering tip, each a baked bitmap of 40–70 units — composed by `paintRoom` from a
list on the row (`room.wall` becomes `room.walls: RootPiece[]`, each a sprite, a place in the room and
a turn), so the frame is a tangle of three or four roots rather than a strip. **The coil is the
"coiled around":** the entrance's circle (centre 107 across 50, radius 24 —
[0306](../docs/decisions/0306-the-serpent-coils-in.md)) is drawn round a root knot placed at that
centre, so the serpent arrives wrapping a root and leaves it; at rest the body lies across the far
root. Everything stays behind the body — 0459's rule holds — and nothing collides, because 0335's
argument has not changed. The far wall still parts on the death ([0459](../docs/decisions/0459-the-bosses-are-placed.md)).

**Cost.** Three or four sprites; `paintRoom` rewritten from a tiler to a placer (it is in
`scene.ts`, a hot file — the room list is laid in `layRoom` and the painter only blits);
`tests/serpent.test.ts`'s roots guard moves from *tiles present* to *pieces present and the coil's
centre inside one*. A sketch from the player of the knot shortens this by a round.

**Guard.** The coil's centre lies inside a root piece's extent, in lane units; no piece's extent
crosses the ship's box.

### 1.2 The lightning aura

**Diagnosis.** The aura is one 44-unit tile per body node — twenty-six nodes plus the head — each
with three radial glows and four rising tongues, flickering through six frames every three steps
with a one-frame offset a node, so the flicker walks down the body at twenty hertz
([0305](../docs/decisions/0305-the-serpent-darkens.md),
[0310](../docs/decisions/0310-the-storm-runs-the-whole-body.md)). In the lightning phase five frames
of six add **a jagged bolt baked into the tile**. Three things make it read badly: twenty-seven
overlapping tiles of the same four tongues are noise rather than fire; a bolt baked in a tile can
only ever be *inside its own tile*, so the storm never runs along the body as 0310 wanted; and it is
blitted source-over, so where the tiles overlap the violet piles up to a slab, while every other
light in the game is added since [0470](../docs/decisions/0470-the-light-is-additive.md).

**Proposal.** The storm is drawn as **lightning**: bolts stroked node to node along the body, the
one thing the surface strokes ([0233](../docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)),
additive like every bolt ([0470](../docs/decisions/0470-the-light-is-additive.md)) — three or four
alive at a time, each spanning two to five nodes, re-rolled from the serpent's own named stream
every few steps so they crawl down the animal, and the flare before a strike becomes a bolt from
the crown that reaches the horn tips. The haze under it becomes **one soft glow a node** at low
weight and slow flicker (hold six or more), tongues gone or one a node, so the body is lit violet
rather than wearing a violet coat. The crackle cadence of 0310 — five frames of six — is kept as the
share of steps a bolt is alive.

**Cost.** A bolt list laid in `layAura` into the existing bolt verb (counted beside the blits,
0233) — no allocation, a fixed table of bolt slots; the aura sprites rebaked without their bolts;
`tests/serpent.test.ts`'s storm guards re-anchored from *frame index* to *bolts alive*. **Consider
the screen:** the lightning phase already draws warned columns down the lane; body bolts must stay
inside the body's own extent so a bolt on the animal is never read as a bolt coming for the ship —
colour alone may not carry that ([0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md)),
so the body bolts are short and the columns are long, and that is the guard.

**Guard.** A budget: bolts stroked per frame in the lightning phase ≤ the table's slots; every
body bolt's endpoints lie within the body's extent; the flare bolt exists for the thirty steps a
strike is read off the air (`FLARE_STEPS`).

### 1.3 Damage on the serpent

The cross-boss item: `shed` is a scale; the wear ladder is on the body node — a gashed node from
70 %, a gashed and leaking node from 40 %, with the acid's own green (the body's colour was
deliberately unchanged by 0305, and this is the reason to change it). The horns keep growing; that
is escalation and reads as it.

---

## 2. The fish

### 2.1 The mouth is too fast

**Diagnosis.** The jaw is not animated; it swaps between whole faces. It opens for the twenty steps
before a volley (`FACE_GAPE`, 0319's tell), stays open through a spray, a brace or a spit, and
**snaps shut for seven steps** (`BITE_STEPS`) every time the ship crosses the fish's centreline by
more than six units (`FACE_LOOK`). The fish *stalks the player's lane*
([0258](../docs/decisions/0258-one-pilot-a-level.md)), so the ship crosses its centreline
constantly, and the snap fires constantly — on top of a gape every 36–54 steps in a fight whose
cadence runs 0.6–0.9 s. All three numbers are globals shared with the serpent and the pterodactyl.

**Proposal.** The snap gets a **refractory**, the way the flash did (0334): a bite cannot re-arm
for a row-authored number of steps after the last, default 45, and the deadband is a row field
too, default six, the fish authored at twelve. The gape stays — it is the volley's tell and
[0380](../docs/decisions/0380-the-fish-has-four-stages.md) re-anchored its share. And `wearFace`
runs during a leap, which it does not today: the face is frozen on whatever it wore when the leap
began, often mid-gape.

**Cost.** Two fields on a `Face` row type with defaults; one counter on the world. The guards in
`tests/volans.test.ts` for the gape (0319, 0380) and the spit's open jaw (0373) hold and are
re-run.

**Guard.** Driven with the ship weaving across the centreline every ten steps: bites a second
≤ 60 / refractory; a volley's gape still opens before every volley.

### 2.2 The leap feels weird

**Diagnosis.** The leap is the **entrance replayed** ([0380](../docs/decisions/0380-the-fish-has-four-stages.md)
reusing [0313](../docs/decisions/0313-the-fish-breaches.md)): from wherever it is, a straight-line dive
at a constant three units a step to along 240 on the near edge, a 64-unit run-in with half the hull
showing, three parabolas, down out of sight — and then **the ordinary arrival** flies it back from
along 240 to its station at 0.45 a step, about three seconds, the first 1.4 s of which are off the
narrowest screen. About four seconds untouchable and up to 1.4 s of empty screen, with a straight
dive at one speed at the front and a crawl at the back. It feels weird because it *is* two other
things glued together.

**Proposal.** A leap is its own `Entrance` kind — `ENTRANCE_KINDS` is a closed union made for this
([0313](../docs/decisions/0313-the-fish-breaches.md)). It **starts from the station and ends on it**:
an eased dive to the near edge nosed into its velocity, one or two arcs across the screen, and a
return curve that lands the fish back on station in about two and a half seconds, never off the
screen, never handed to the arrival. The spray and the breach cue at each edge crossing stay (0313,
[0375](../docs/decisions/0375-the-breach-has-a-body.md)).

**Cost.** One arm in `driveEntrance`, one path table; `LEAP_RUN_IN` and the hand-over at 240 go;
the leap's guards in `tests/volans.test.ts` re-anchored on *returns to station within N steps*.

### 2.3 The leap cannot be interrupted

**Diagnosis.** `bossEntering >= 0` gates every damage path — shots, missiles, blades, the whirlpool,
the storm, the rift, the nova, the arc's target pick. The leap sets it, so a fish on one point of
health leaps, and nothing landing on it in the air counts. Measured: the last stage opens at 30–33 s
and the fight ends at 41–46 s with every gun, so **the last stage is about ten seconds** and the
first leap comes 150 × fireGap steps into it — about two seconds. No gun deals fifteen per cent of
the fish in two seconds, so every fight contains a leap, and no skill shortens it. The bar also
hides for the leap. 0306's *"untouchable and fully live"* was the player's ask for an **entrance**;
the leap inherited it by reuse, not by a decision.

**Proposal.** **A leap is not an entrance.** A leaping fish is a target: every damage path reads a
new `bossLeaping` rather than `bossEntering`, damage lands, and a fish that dies in the air dies
there — the death burst where it is, the pool emptied, the clear armed as it is for any death
([0062](../docs/decisions/0062-a-boss-dies-loudly.md)). The bar stays up through a leap. The opening
breach stays untouchable, as 0306 decided. This is the whole of the note: *"you should be able to
damage it fast enough to skip the jumpy animation"* is satisfied by letting the damage count, and
the player's reward for being fast is the fish never getting its leap off. No health threshold skips
a leap — that would be a rule where the player is asking for agency.

**Cost.** One flag; the seven gate sites read it; `tests/volans.test.ts` gains the guard.

**Guard.** Driven: a fish in a leap under a gun that lands every step loses health; a fish killed
mid-leap empties the pool on that step and the bar reads zero; the opening breach still refuses
every hit (0306's own guard, re-run).

### 2.4 Damage on the fish

The cross-boss item: `shed` is an ember-lit scale; the ladder is torn fins — the sawtooth 0320
removed *because* it read as damage, put back as damage: whole, nicked, torn, ragged, on the four
stages the bar already notches. The kindled → blazing fire stays as escalation over it.

---

## 3. The pterodactyl

### 3.1 The feathers

**Diagnosis.** The body carries ten rows of individually painted contour feathers
([0398](../docs/decisions/0398-the-pterodactyl-is-feathered.md)). The wings do not: each wing is **one
filled outline** with eleven shafts stroked on it and two rows of covert scallops, so the flight
feathers are lines on a sheet rather than feathers. The flap is eight frames of foreshortening —
span 0.78 ± 0.22 — on a step clock at hold 5/4/4/3, so 1.5–2.5 Hz with no body motion and no
relation to where the animal is going.

**Proposal.** The primaries and secondaries are **drawn as feathers**: each its own overlapping
shape with a dark shaft, a lit vane edge and a slot of sky between the primary tips, the covert rows
over their roots; the hand and arm keep their outline. The beat slows to what a thing this size would
do — a cycle near a second (hold 7–8, twelve frames so it is not stepped) with a faster downstroke
than up — and **the body heaves with it**, a unit or two across in phase with the stroke, which is the
cheapest thing that makes a flap read as flight. 0398 says the beat was never seen at speed; this is
that look.

**Cost.** Twelve wing frames plus twins in place of eight (sixteen bitmaps more at the 72-unit tile);
the heave is a term in `layAura`'s wing placement; `tests/quetzal.test.ts`'s *six frames a second*
floor re-anchored to the new cycle.

### 3.2 The up and down

**Diagnosis.** The row moves by `patrol`: a constant 0.55 × patrolScale units a step across the lane,
**reversing in one step** at the edges — a triangle wave with hard corners — and the brace before
every beam ([0250](../docs/decisions/0250-the-quetzal-screams.md)) sets the across velocity to zero in
a single step and back to full in another. Nothing banks, pitches or turns; the flap ignores the
motion. A bird that slides at one speed, stops dead and reverses dead does not read as flying.

**Proposal.** Three pieces, all row-authored:

| piece | what | where |
|---|---|---|
| **ease at the turn** | `patrol` gains an optional `ease` (steps to slow into and out of a reversal and a brace); the pterodactyl authors 24, every other patroller keeps 0 and moves as today | the `patrol` arm in `src/app/boss.ts` |
| **bank with the velocity** | `turn = bank × velAcross / top speed`, so the hull leans into the climb and dive; the wings already copy the hull's turn, so they lean with it | the station step; `bank` on the row, 0 for every other boss |
| **the flap follows the stroke** | the beat runs faster on the climb than the dive — the beat's hold scaled by the across velocity's sign — so a climbing bird works and a diving one glides | the wing frame pick in `layAura` |

A `bob` would also ease — it is a sine — but the pterodactyl covers ninety units of lane and a bob
of that amplitude at the beam's cadence is a different fight; the ease on `patrol` keeps the
pattern the player has learned and changes only its corners.

**Guard.** In player units: the across velocity never changes by more than a lane-share a second
squared between two steps (the hard corner is what reddens it); the hull's turn has the sign of its
across velocity whenever it is moving.

### 3.3 Damage on the pterodactyl

The cross-boss item, and the one it fits best: `shed` is **a feather**, falling away from the hit;
the ladder is gaps in the primaries per phase — a wing frame set with one, two, three primaries
missing — so a bird at a quarter health is visibly plucked. Cost: the wing ladder is twelve frames
× 2 per step, which is the one expensive ladder in this plan; shed alone is the first PR, and the
ladder follows if the shed does not say enough.

---

## 4. The gyre

### 4.1 The bullets

**Diagnosis.** The curtains and the fan are `flak` — the turret's generic slab, repainted in the
Labyrinth's raider gold by the place
([0296](../docs/decisions/0296-a-bullet-belongs-to-its-place.md)) — and the wheel throws
`flame`, a vermilion fireball in the fire ink. The hull is a teal and hot-pink machined cog with a
red eye and its own hot inks. So a clockwork lord throws the same gold slab every raider in its level
throws, and fire in a colour its own flames do not use.

**Proposal.** The gyre authors its own shot — a boss row says what it throws (0248), and a bullet is
a kind ([0233](../docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)): a **cog tooth**,
a small square-shouldered wedge in the lord's teal with the pink-lit rim, every number of `flak`'s
kept (radius 0.9, speed 1, damage 1), so the curtain's slots, spacing, hole and reach are untouched
and only the picture changes. The wheel's `flame` is repainted in the gyre's own hot inks by the
same route 0296 gives a place — a lord's palette for a lord's fire. **Consider the screen:** a
curtain is forty-one of these across the lane and the hole must be read against the violet; the
tooth's lit rim is what carries it, and the palette guard holds the contrast.

**Guard.** The curtain's geometry guards in `tests/gyre.test.ts` re-run unchanged — the change is
a sprite; a hostile bullet's contrast against the Labyrinth's sky holds in `tests/palette.test.ts`.

### 4.2 The hole is always in the same place — it is, and that is decided

**Diagnosis.** The hole is at `uncoil.at` as a share of the line, in every stance, with no stream
read — [0151](../docs/decisions/0151-the-gap-you-have-to-reach.md), from the player's own words quoted
under *Before anything*. It is not a feeling; it is the rule. The player today says it *"feels like
it almost always appears in the same place"*, which is a report that the pattern is learned and has
stopped being interesting — not that it is unfair.

**Proposal, and a stop.** Two honest answers, and the player picks:

| option | what it costs |
|---|---|
| **leave it** — 0151 stands, the note is the pattern working | nothing |
| **the hole per stance** — `at` becomes eight values, one a stance, so the across wall's hole and the slant's are in different places; still fixed, still learnable, and the spike already points at the edge the next wall comes in over, so the tell exists | one array on the row; the far-wall reach is re-measured per stance at Burn in `tests/level.test.ts`, which is the only limit 0151 puts on where a hole may sit |

Not proposed: a hole drawn from a stream. 0151 refused it in play and nothing in the note asks for it.

### 4.3 The dead gyre: the bar that comes back, and a wreck worth killing

**Diagnosis — a bug and the ask are the same code.** When the gyre dies, `layWreck` respawns the
hull into the boss pool with `reset(…, w.bossRow)`, which sets `health` to the row's raw 1500. The
pool is no longer empty, so `bossOnField` is true again and **the bar comes back** — at 1500 over a
tier-scaled full health: 100 % on Legendary, 62.5 % on Savior, 39 % on Burn — and stays up through the
fall, the settle, the room opening and into the clear. `tests/boss-bar.test.ts` drives only the
serpent, which has no wreck, so nothing saw it. And the wreck **cannot be hit**: `shootable` is
`bossEntering < 0 && !bossBeaten`, and ship contact is gated the same way
([0337](../docs/decisions/0337-the-gyre-falls-out-of-the-wall.md)). What the player saw was a bar over
an untouchable husk reading as a boss with health left — the bar was telling the truth about a
number nobody meant.

**Proposal.** **The wreck is a body with its own health, and killing it is a kill.**

- `Wreck` gains `health: number` as a share of the boss's full health, tier-scaled like everything
  else, and `layWreck` writes it; the bar shows the wreck's own health while the wreck is on the
  field, so the bar is right rather than hidden.
- The wreck is shootable from the step it lands until the level is cleared; `bossBeaten` stops
  gating damage and a new `wreckBeaten` marks the second death.
- Killing it bursts it (`BURST.boss`, the `bossDown` cue, a shed of teeth) and **opens the room at
  once**, so the kill is also the fast way out, and logs to `bossDeaths` — which is where the
  achievement will read it from later.
- **Sized to the ask, then measured.** Savior, the wreck's window today is the fall (about 2 s),
  `settle` 60, `opens` 90 and `BOSS_DEATH_STEPS` 96 — about six seconds in all. One bomb lands
  `0.05 × full` ([0372](../docs/decisions/0372-a-death-keeps-the-ladders.md)); the first missile
  upgrade is one tube every eight steps at 3 damage, 22.5 a second; the pulse at full autofire is
  sixty a second if every shot lands and about fifty flown. So the three together over the window
  come to roughly `0.05 × full + 6 × 72` ≈ 550 at Savior's 2400, **about 0.23 of full health**;
  autofire alone over the same window is about 300, and autofire with the missile about 430. The
  row authors `health: 0.22` as the opening number, and `weigh-boss` gains a `--wreck` flag that
  flies the wreck's window with each loadout so the number is read, not believed — the player's
  *"1 bomb, 1 missile upgrade and full autofire"* is the pass line and *autofire plus missile* the
  fail line.

**Guard.** The bar is hidden the step the end boss dies and shows the wreck's share after; a wreck
under autofire alone for its window survives, and under autofire, one tube and one bomb does not,
at Savior — a guard in the player's units (seconds and a loadout), with the probe setting the share
to 0.1 and watching the first redden.

**First, because it is a visible defect in the shipped game and a one-line cause.** The bar fix
alone is a two-line PR if the wreck has to wait.

---

## 5. The frost ship

### 5.1 The aura overpowers the screen

**Diagnosis.** The *"aura"* is the chill — four bitmap layers (a haze and three rings of flakes)
spinning at different rates, swelling to a radius of 108 over 6.5 s on a ten-second pulse
([0253](../docs/decisions/0253-the-frost-ship-chills.md), 0399). At 108 it covers the whole 120-unit
lane and everything down-lane of 44: *"three quarters of a 16:9 screen and more"*
([0459](../docs/decisions/0459-the-bosses-are-placed.md)). Every transparency is **baked**:
`CHILL_OPACITY` 0.45 caps the puffs, glints and every snowflake stroke; the veil is 0.16; the flakes'
light 0.3; rings of 26, 18 and 12 flakes. The four layers are blitted source-over at alpha 1, so
where they overlap the alphas compound — and they overlap everywhere.

**Proposal.** Two levers, the cheap one first:

| lever | what |
|---|---|
| **halve the bake** | `CHILL_OPACITY` 0.45 → 0.25, the veil 0.16 → 0.08, the flakes' light 0.3 → 0.15, rings 18 / 12 / 8; the frost guard's *"HEAVILY TRANSPARENT"* ceiling of 0.5 in `tests/frost.test.ts` holds and should come down to 0.3 with it |
| **a knob the player can turn** | `rig/bench.html?chill=0.6` scales every chill alpha at bake time, so the player sets the number on the bench and reads it back here, rather than a PR a guess — the standing lesson in `a-driveable-tool-beats-a-pr-cycle` |

Not first: fading the field as it swells, which needs an alpha on the entity and an edit to the
blit line in `scene.ts` (hot file, two probes anchored). It is the right tool if the bake alone is
not enough, and item 7.4 costs it.

**Guard.** Every chill mark under 0.3 (the existing guard, lowered); the field's radius and pulse
untouched — this is a picture change and `tests/crowd.test.ts`'s safe-lane pilot does not move.

### 5.2 More adds, and the fire rate

**Diagnosis.** Adds come **only in phase 3** (49–25 %): a `summon` of two shards from the sides
topped up to a standing six or seven ([0270](../docs/decisions/0270-a-shattering-volley-is-counted-in-shards.md)),
and that phase throws no frost of its own. Phases 1, 2 and 4 have none. The frost ship has no
`escort` — the fish's clock that runs adds *while the boss keeps throwing*
([0314](../docs/decisions/0314-the-shoal-comes-in-while-it-fights.md)) — in any phase. The fire rate was
slowed six days ago by [0471](../docs/decisions/0471-the-cold-breathes.md): phases 2 and 3 from 84 and
66 authored to 90 and 84; phase 1 held at 96 because 0260's eight volleys refuse 102; phase 4
unchanged in effect because the frost's stagger, not the cadence, limits it. The player has not
played 0471.

**Proposal.** An `escort` on **phase 2** (two shards every 150 steps from the sides, standing 3)
and on **phase 4** (one every 180, standing 2), the phase-3 summons untouched, the fire rate
untouched until 0471 has been played. **Consider the screen:** phase 4 is three shards a volley
becoming thirty-six flakes under a cold that covers most of the lane, and the ice report's Burn
measurement found about two units of safe lane left in it; a shard add there is one more body that
shatters into six when it dies, so phase 4's escort is the one to cut first if `tests/crowd.test.ts`
reddens or `weigh-threat hoarfrost` shows the parked ship's hits a second climbing from the 1.11
the fish report measured. Phase 2 has room.

**Guard.** `weigh-threat hoarfrost` before and after, the *called / arrived* and *hits a second*
columns in the decision; `tests/crowd.test.ts` holds a safe place on every tier.

---

## 6. The hydra

### 6.1 The heads do not blend into the body

**Diagnosis.** [0464](../docs/decisions/0464-the-hydra-is-one-beast.md) fixed the **root**: a flared
collar drawn over the body so the body's outline no longer crosses each neck, and a flesh-to-lord
crossfade up the neck. It left four seams, and 0464 lists two of them as *not held*:

1. **the head–neck joint** — the head is its own sprite with its own closed outline, sat on a neck
   tip 0.085 r wide, and it **turns on its own** (±0.6 rad to track the ship) while the neck behind
   it is one rigid bitmap that does not bend;
2. **neck on neck** — five necks each with a full outline, overlapping past the body's edge;
3. **the necks do not flash** — head and body wear hurt twins, necks and collars have none, so on
   every hit a white head and a white body sit with coloured necks between;
4. **the rise** — for the second a neck rises the collar is off and the outline crosses it.

**Proposal.** **A neck is two bones.** The lower neck stays the rigid bitmap turned about its root;
the upper third becomes a second bitmap turned about a knuckle, and **the head's turn is carried by
the upper neck** rather than by the head alone — the head turns with it and never against it. The
head's outline opens at the throat and the upper neck widens to that throat, so there is one line
round head-and-neck rather than two. Necks and collars get hurt twins (free from the `Hit` naming)
so the whole animal flashes as one. Necks are laid back-to-front in a fixed order with a baked
contact shadow at each collar, which is the cheapest answer to the neck-on-neck seam and leaves
*one outline for the beast* for a later pass if the play still asks.

**Cost.** Five upper-neck sprites plus twins, five neck twins, five collar twins; `layNecks` lays
two bones a neck (the aura pool is at 27 of 27 — the five new entities need five more slots, which
moves the entity ceiling in `tests/budget.test.ts` by 0286's argument); the collar solve in
`hydraCollarOf` is unchanged because the root does not move. **A sketch of the joint** from the
player saves a round here more than anywhere else in this plan.

**Guard.** `tests/hydra.test.ts` already holds the collar in front and covering the join in world
units; it gains: the head's turn equals the upper neck's turn on every step; every hydra piece has a
hurt twin distinct from its rest.

---

## 7. The jellyfish and the heart

### 7.1 The heart and the bell set into the screen, as the cog is

**Diagnosis.** The *"background cog"* the player cites is not a backdrop — it is the gyre's
`socket` seat: a 68-unit housing behind a 52-unit hull in the aura layer, framed by room walls
([0332](../docs/decisions/0332-the-gyre-is-set-into-the-wall.md), [0335](../docs/decisions/0335-the-fight-happens-in-a-room.md)).
The heart is already the jellyfish's seat ([0400](../docs/decisions/0400-the-heart-is-the-room.md))
— but at 44 units it is **smaller than the 46-unit bell**, deliberately, and the room has
`wall: null`. So the mechanism is identical and the picture is the opposite: the cog sits *in* a
housing bigger than it; the bell sits *on* a heart smaller than it, in an open room.

**Proposal.** The heart gets a **chamber**: a seat of about 110 units — the gyre's housing-to-hull
ratio — of vein-flesh in the Black Heart's inks with the heart in its bore, throbbing with the
music clock as it does ([0401](../docs/decisions/0401-the-vessels-beat-with-the-music.md)); the room gets
walls of the same flesh (`room.wall`, as every other walled room has), which `paintArteries` already
feeds from the heart's position. The bell stays a body — only a body has a hurtbox — and sits in the
chamber's mouth. 0400 refused baking the vessels into the heart and the weather into the world
plane, and neither is proposed.

**Cost.** One seat sprite, one wall sprite (or the root-piece mechanism of 1.1, if that lands
first), the room row; the finale reads the heart's position from the fight (0426) and follows.

### 7.2 It never opens — measured

**Diagnosis.** The open stance exists, is live, and is reached by health alone: the last phase is
`upTo 0.21` with `damageScale 2`, a ring of eight void and the open bell
([0255](../docs/decisions/0255-the-jellyfish-opens.md), [0402](../docs/decisions/0402-the-jellyfish-is-glass.md)).
What stops it is the **feeding**: from 75 % two moon jellies fall every 75 steps, and each one that
touches the hull *or any tentacle* heals **5 % of full health**, clamped only at full
([0404](../docs/decisions/0404-the-rain-feeds-it.md)). The tentacles span ±26 across and reach
40 along, so about a third of the rain lands. 0386 measured the player's damage on this boss at
1.3–1.9 % a second — **the day before feeding existed**, and nothing was re-banded. Flown today:

> medusa, Savior — pulse: median **never**, on its lane never / never / never. arc: never / never / 55 / 65.
> shuriken: never. ray: never, **and the open phase is never reached.**

The fight finishes only from the single best held lane. And a single feed is +5 % against a band of
21 %, so even a fish that opens shuts on the next jelly — which is what 0404 chose, and the player
confirms: *"as it gets healed its glow will change."* The choice stands; the **rate** is the defect.

**Proposal.** Two numbers and no new rule:

- **the bell eats, the arms do not** — `feedBoss` tests the hull only, so the catch is the bell's
  34 units and not the tentacles' 52 × 40; the fiction is cleaner too;
- **`feeds` 0.05 → 0.02**, so a feed is a visible step on the bar and the glow (7.4) and not a
  phase reversed.

Then `weigh-boss medusa` until the median held lane finishes on every gun and the phase list shows
five entries for every gun, and `solve-phase-bands medusa` to re-band if the open phase is not
fought for as long as the others ([0386](../docs/decisions/0386-every-phase-is-fought-for-as-long.md)).
0404's *"the bell closes again"* is kept exactly: a heal in the open phase still closes it.

**Guard.** `weigh-boss medusa` is the guard — a `never` on the median lane fails the suite's boss
fixture in `tests/medusa.test.ts`, which today reaches `open` only by writing health directly. In
player units: seconds, and whether the open phase was fought at all.

### 7.3 The tentacles

**Diagnosis.** Five tentacles of eight capsule nodes each, every node a 10-unit glass capsule with
three stinging discs, laid on a **straight line** from root to tip with a sideways sine added
([0403](../docs/decisions/0403-the-tentacles-pull-out-of-the-heart.md)). The wave moves only across the lane, never
along it; the nodes are rods turned to the next node. It reads as a chain of rods wiggling.

**Proposal.** The tentacle is a **curve, not a line**: twelve smaller nodes on a travelling wave whose
amplitude grows to the tip *and* whose phase runs along the arm, with **drag** — each node lags the
one above it by a share of the bell's own across velocity, so when the bell shifts the arms trail
and catch up. Two kinds of arm: the long stinging tentacles as now, and **shorter frilled oral arms**
under the bell (a ruffled bitmap, four of them, half the reach), because a medusa has both and the
frill is what makes a jellyfish read. The tips carry the lasers' charge as a glow in the last steps
of a warning. **Consider the screen:** the lasers are warned along their path (0388); the arms stay
behind the bell's leading edge so nothing they do is read as a shot.

**Cost.** `TENDRIL_SLOTS` 40 → 60 plus 16 for the oral arms (the body pool's ceiling moves; the
hydra's chain argument 0286 again); one new sprite; `layTendrils` rewritten from line-plus-sine to
a curve with a lag term; `tests/medusa.test.ts`'s tentacle geometry guards (roots, reach, the
brace) re-anchored on the curve's envelope.

### 7.4 A glow by health — green, yellow, amber, red, and back

**Diagnosis.** The moon jellies' glow is **baked per tint**: six fixed colours, each its own
three-frame pulse ([0404](../docs/decisions/0404-the-rain-feeds-it.md)), chosen at spawn.
Nothing on any boss tints by health; the nearest is the gyre's flame count (0336) and the hull per
phase (0332), which `wearFace` already *reverts on a heal* for free.

**Proposal.** The glow is **the hull per phase**: five bells — green at full, yellow-green, yellow,
amber, and the red open bell — authored as `hull` on the five phases, each with the glow baked into
the glass and a halo sprite behind it in the aura layer in the same tint. A feed that crosses a notch
upward steps the glow back, through the mechanism that exists, and the bar's notches say where the
steps are. Five steps are what the ask names (*green → yellow → amber → red* is four, and the open
bell is the fifth).

**And the continuous version, costed, not proposed first.** A halo crossfaded by `health / full`
needs an `alpha` on `Entity`, written in `layAura`, and the blit line in `scene.ts` to pass it — a
hot file where 0025's and 0027's probes anchor on the two blit lines being adjacent. It is one
field and one argument, and it would also serve the chill's fade (5.1) and any later fade. It is
the right second step if five steps read as steps; it is not the first because the first costs
nothing in the frame loop.

**Guard.** The hull guard from the cross-boss item: the drawn bell changes on the step a phase
turns, in both directions.

### 7.5 Further back, and no way round

**Diagnosis.** Station 152, radius 17, drift 0; the ship's box runs to along 202.7. The hull covers
along 135–169, so there are **33 units behind the bell** and 37 clear on each side. The hydra had the
same note and [0459](../docs/decisions/0459-the-bosses-are-placed.md) answered it by moving its station
from 154 to 178, putting its front past the ship's reach. 0282 sent *"fly behind it and nuke it"* back
as a per-boss question, and this is the jellyfish's.

**Proposal.** **Station 190.** `tests/level.test.ts` allows up to about 196 (station + drift +
radius ≤ 213.3); at 190 the bell's front sits at 207, past the box, so nothing flies behind it; the
tentacles' reach of 40 puts the tips at 150, in the lane. To check as it moves: the boss aura's music
gain (0459 found the hydra's under the 0.1 floor at 182, in `tests/music.test.ts`); the laser fan's
lane geometry; the band of along where jellies land on the bell; and the finale's heart, which reads
its position from the fight. *Beside* it stays possible — the bell is 34 of the lane's 120 — and the
chamber of 7.1 is what narrows the picture without a wall that collides (0335).

**Guard.** The bell's leading edge ≥ `PLAYER_LEAD` at rest, in lane units; the aura's gain above the
floor at the new station.

---

## Added the same day: six more notes

> *the 'fire' projectile rate is too fast, not that the fire rate is too fast. there's barely any time
> to see it, let alone dodge it. on both the fish and the hydra*
>
> *the aura on the ice boss -> it gets bigger, but just on scale size which is why it looks so weird,
> it's scaled up for the pulse so the snowflakes and stuff in it get huge, rather than it increase in
> size organically with additionally layers.*
> *-> it also needs to expand further in size, it's still basically a non-event for the player*
> *-> icicle burst fire rate is still too close together on ice boss and hydra boss - essentially it's
> still two cluster bombs really close together and rather than creating a navigable cloud of
> shrapnel, it creates either too much or it creates a non-event.*
>
> *the void bomb needs to last 1 sec longer*
>
> *shields need to be ship thematic*
>
> *the shuriken cannon noise is still irritating rather than enjoyable -> I'm still not sure what
> noise would be good here.*

### 8. The flame flies too fast — the fish's whip and the hydra's second head

**Diagnosis.** It is the bullet, not the cadence. `flame` in `src/content/shots.ts` has `speed`
1.8, and every hostile bullet that actually flies is slower: spit 1.4, quill 1.3, flak 1.0, spine
0.95, void 0.9, acid 0.8, frost 0.75, rock 0.7. Savior's `shotSpeed` 1.15 makes it 2.07 units a
step. The fish's last stage throws it as a **whip** with `reach` 0.9, and the whip's tip flies
`1 + reach` times the root ([0249](../docs/decisions/0249-the-eagle-summons.md)) — **3.9 units a
step**. From the fish's station at 155 to a ship standing at 60, the root arrives in 0.77 s and the
tip in **0.4 s**. The hydra's second head sprays the same flame from a mouth about 80 units off the
ship: **0.65 s**. The acid from the same hydra takes 1.7 s over the same ground. The flame is also the
biggest fast bullet (radius 1.75, with an ember trail), so at that speed it smears rather than reads.

**Proposal.** The row changes — a bullet is a kind, and the three throwers share it:

| | today | proposed | seen for, Savior, 95 units |
|---|---|---|---|
| `flame.speed` | 1.8 | **1.1** — between flak and quill | 1.25 s at the root |
| the whip's `reach` (volans stage 4) | 0.9 | **0.5** — the lash still bows | 0.83 s at the tip |
| the hydra's spray | 2.07 a step | 1.27 a step | 1.05 s over 80 units |

The gyre's wheel also throws `flame` ([0336](../docs/decisions/0336-the-wheel-comes-off-its-post.md));
a slower flame tightens its spiral, so `weigh-threat gyre` is re-run and the wheel's `spin` is the
lever if the arms close up. **Consider the screen:** a slower flame is on it longer, so the fish's
stage-4 field holds more flames at once under its kites and the leap; the pool is 150 and the fish's
peak is well under it today — the number goes in the decision.

**Guard.** A taste, not a guard, on 0295's terms: `tests/authored.ts` prints, for every boss and
every bullet it throws, the seconds from its muzzle to the ship's nearest stand at Savior, so the
fastest thing in the game is a line on every run and the next one that creeps up is seen. The play
decides whether 1.1 is right.

### 9. The cold zooms instead of growing, and it is still a non-event

**Diagnosis.** `layChill` sets each of the four layers' `swell` to `2 × chillRadius / 76` every step,
so the whole bitmap — haze and flakes alike — is **scaled** from radius 46 to 108, 2.84 times, and a
snowflake baked at a size that reads at rest is a saucer at full swell. That is the whole of the
*"looks weird"*: a photograph enlarged rather than a cloud growing. And at 108 the field is
three-quarters of the screen, yet the player calls it a non-event — because what it does is slow a
ship *inside* it ([0253](../docs/decisions/0253-the-frost-ship-chills.md)) and at that reach the ship
is nearly always inside it, so there is no edge to be on the wrong side of.

**Proposal.** The field is **two kinds of thing, and only one scales.** The haze stays a gradient
disc and scales as it does, because a soft gradient enlarging is what a mist spreading looks like.
The flakes become **fixed-size patches riding outward on the radius**: twelve to sixteen 30-unit tiles
of snowflakes in two rings — one at 0.45 of the radius, one at 0.9 — placed round the hull and
spinning as the layers do, each drawn at scale 1 whatever the radius is. As the cold swells the
patches move apart and the field thins toward its edge, which is what breath does; as it retracts
they close up. The reach goes **108 → 150**, so the edge of the cold crosses the whole lane and most
of the ship's box, and *being inside it or not* is a decision the player makes along the lane. The
slow stays as it is; the retract and the pulse stay; the translucency of 5.1 lands with it or before.

**Cost.** One 30-unit flake tile (the three ring sprites go); sixteen slots in `bossAura`, which has
27 and on this boss uses four, so no pool grows; sixteen blits where there were four, under 0025's
draw-call count. `tests/crowd.test.ts`'s safe-lane pilot is re-run at the new reach, because the slow
is read against the same radius ([0459](../docs/decisions/0459-the-bosses-are-placed.md)).

**Guard.** In pixels, the player's unit: a flake patch's drawn extent is the same at radius 46 and
at full reach — the thing the note names, and a scale-only field reddens it at once.

### 10. The frost shatters as two cluster bombs

**Diagnosis.** A shard flies at 0.86 a step (Savior), splits after 38–56 steps into two bolts 0.6 rad
apart, and each bolt pops 36–48 steps later into a ring of six flakes **flying at the shard's own
speed**, which melt 90 steps after that
([0263](../docs/decisions/0263-the-frost-ship-shatters.md)). So the two pops are about 0.7 s apart
and the bolts are only some 20 units apart when they pop — two bursts almost on top of each other —
and then each ring expands at 0.86 a step to a radius of 77 units before it melts, so the flakes are
dense for a moment and gone to the corners the next. Dense, then nothing: *"either too much or a
non-event."* The hydra's fourth head throws the same `frost`.

**Proposal.** A fission stage gets a `speed` share, and the frost uses it to make a cloud:

| stage | today | proposed | why |
|---|---|---|---|
| split | 38–56 steps, 2 bolts, spread 0.6 | **24–36 steps, 3 bolts, spread 1.0** | sooner and wider, so the clouds form in three places, ~40 units apart |
| ring | 36–48 steps later, 6 at 1× | **54–66 later, 6 at 0.4×** | a second after the split, and a cloud that grows to about 25 units across rather than 150 |
| melt | 90 | **130** | the cloud lingers to be flown through |

Eighteen flakes a shard where there were twelve, drifting at a third of a unit a step: a field the
player threads rather than a flash they stand clear of. **Consider the screen:** phase 4 is three
shards a volley; three slow clouds of eighteen under the cold is more *on* the screen at once than
today, and `tests/frost.test.ts`'s pool guard and `weigh-bullets` say how much. The icicle look of
the last stage ([0390](../docs/decisions/0390-a-dud-icicle-looks-like-one.md)) is kept.

**Guard.** In lane units: a shard's flakes at their melt lie within a radius the row names (about a
fifth of the lane), and the two fission bursts of one shard are at least a second apart.

### 11. The void lasts a second longer

**Diagnosis.** `rift.steps` is 90 in `src/content/specials.ts` — a second and a half
([0377](../docs/decisions/0377-the-void.md)). `tests/void.test.ts` reads the row rather than the
number, and the throw count during a rift is derived from it.

**Proposal.** 150. One number; the decision amends 0377's *"a second and a half"*. The music's hush
holds for the rift and so lengthens with it, which the test already holds; the carve is for the level
and does not change.

### 12. Shields in the ship's livery

**Diagnosis.** The deflector shell is four places × three shimmer frames of one plate, drawn by
`drawShieldPlate` in the `player` ink for every ship ([0430](../docs/decisions/0430-the-readout-counts-ships-and-shields.md)).
The readout already wears the ship — `hud.motif` is `bracket`, `orbit`, `checker` and `walnut` on
the four rows ([0451](../docs/decisions/0451-the-readout-wears-the-ship.md)) — and the shell does not.

**Proposal.** `ShipRow.shield` beside `hud`: the plate's art per ship, baked at the same four places
and three frames — the fighter's honeycomb as it is; the caddie's a soap-film bubble in the ray's
lavender; the Firebird's black-and-gold feathered arcs; the estate's a gilded lattice. Forty-eight
small sprites in place of twelve; `SHIELD_ORBIT` and the layout stay, so nothing about what a shield
*does* moves and 0430's guards re-run as they are. The pickup's shield face stays one face, because
it is offered before a ship is known to be carrying it.

### 13. The shuriken's sound — a listening set, not a guess

**Diagnosis.** The `throw` cue is a launcher thump, a noise *shing* sweeping 11 kHz to 3.2 kHz, two
triangle partials a fifth apart and a square tick, in a small room — redrawn for the album from a
whoosh and measured then (`scripts/weigh-cue.mjs`). It fires every twelve steps, five a second. The
likeliest irritant is the one 0463 found on the ray gun: bright noise in the band the ear is most
sensitive to, five times a second, for a whole run. The player says they do not know what would be
good, and nothing in a suite can hear ([0027](../docs/decisions/0027-measure-the-picture-not-the-model.md)).

**Proposal.** Four candidates **on the dash**, switchable while a run plays, because a round trip is
for a change and not for a question:

| candidate | what changes |
|---|---|
| **no shing** | the noise sweep removed; thump, partials and tick stay |
| **the thrum** | a pitched whirr on the root falling a fifth, the partials an octave down, no noise at all |
| **every other blade** | the cue on alternate throws, 2.5 a second, the figure still on the beat |
| **the whistle** | a tone that bends with the blade's swing over 0.2 s, quiet, under the launcher |

Each is measured with `weigh-cue --loud` against the other guns and `weigh-fit` against every
place's bed before it is offered, so the four the player hears all sit where a gun is allowed to sit.
The one they pick is the PR; the others are deleted with it.

### 14. The caddie's ray gun sits on the ship, and a point fires a ring

> *"on the little caddie the raygun sits above the ship instead of under it, and it's weird that it
> has a small pointed end, but fires a large circular projectile."*

**Diagnosis.** [0467](../docs/decisions/0467-the-ray-gun-is-a-turret.md) set the emitter as a chrome
ball *half sunk in the disc* at the nose with a short barrel to a smaller orb, the tip at 1.13 of the
box's radius — and it is painted over the dome, so from above it reads as a thing sitting on the
saucer rather than mounted beneath its lip. The orb is a point; the gun fires rings of radius 1.8
([0442](../docs/decisions/0442-the-ray-gun.md)), the widest player shot after the whirlpool's blades.

**Proposal.** The emitter goes **under the lip**: drawn before the hull, with the rim's shadow across
it and only its muzzle showing past the rim at the nose — the housing's seat solved as 0467 solves
it, from below instead of above. And **the muzzle is a ring**: an open dish the size of the smallest
ring it fires, lavender-lit inside, no orb and no point; the barrel is short and ends in the dish. The
tip stays at 1.13 so the muzzle (`muzzle` on the row, 4.46 along) does not move and 0448's guns guard
holds. A sketch from the player shortens this one too; it is the fourth drawing of this gun.

**Guard.** The caddie's muzzle and tip as they are (`tests/muzzles.test.ts` and `tests/mounts.test.ts`
hold them); the emitter's bitmap drawn in the layer before the hull. Photographed on the sheet at ×8 beside the ring it fires.

## The order, and why

0. **The red bullet** (0): the one question to the player, the condition added to
   `scripts/weigh-stuck.mjs`, the cause fixed, the instrument made a guard. Before any of the below.
1. **The gyre's bar and wreck** (4.3). A visible defect with a one-line cause, and the player's
   named ask; the bar fix alone is two lines if the wreck's sizing needs a second PR.
2. **The jellyfish opens** (7.2). The fight is unfinishable from most of the lane today; two numbers
   and a measurement. **Station 190** (7.5) rides the same PR because both move `weigh-boss medusa`
   and it is re-run once.
3. **The fish's leap is a target** (2.3), then **its own path** (2.2) and **the bite's refractory**
   (2.1). The first is a flag at seven sites; the other two are one entrance kind and two row fields.
4. **The flame slows** (8) and **the void lasts** (11) — two row numbers and one whip field, one PR,
   each measured by the instrument it moves.
5. **Damage shows** — `shed` on all seven, in one PR with one sprite a boss; then the wear ladders,
   one boss a PR, in level order, each after a play of the shed has said whether it is enough.
6. **The cold grows instead of zooming** (9) with **its bake halved** (5.1), then **the frost's
   cloud** (10); **the escorts** (5.2) after 0471 has been played.
7. **The pterodactyl flies** (3.2), then **its feathers** (3.1).
8. **The hydra's neck is two bones** (6.1).
9. **The serpent's storm is lightning** (1.2), then **its roots** (1.1).
10. **The heart's chamber** (7.1), **the tentacles** (7.3), **the glow** (7.4).
11. **Shields in the livery** (12) and **the caddie's gun under the lip** (14); **the gyre's teeth**
    (4.1); **the hole per stance** (4.2) only on the player's word.
12. **The shuriken's listening set** (13) — built as a dash feature whenever the ear is free, because
    it waits on a listen and not on a PR.

**Each number is one PR**, with a decision that quotes the line of this report it answers, a probe
per guard, and the instrument re-run with its numbers in the decision. **The art items want a
sketch** — 1.1, 3.1, 6.1, 7.1, 7.3 most of all — and without one each PR carries its before-and-after
photographs off the bench at the shipped camera. A play report after each is a committed file in
`reports/` on [0029](../docs/decisions/0029-the-tracked-record-is-the-record.md)'s terms, and
`docs/state-of-play.md` is rewritten as each lands — pointers and intentions, never findings.

## What this plan deliberately does not propose

- **A hole drawn from a stream** (4.2). 0151 refused it in the player's own words.
- **Clamping the jellyfish's heal at the phase line** (7.2). 0404 chose *"the bell closes again"*;
  the rate is the defect and two numbers fix it.
- **A health threshold that skips the fish's leap** (2.3). The player asked to be able to kill it
  faster, not for the game to decide when a leap is allowed.
- **Collision on the serpent's roots** (1.1). 0335's wall is the picture of a bound the ship already
  has, and the Approach has no corridor; a root that stops the ship is a different level.
- **Slowing the frost ship again** (5.2) before 0471 has been played. The fire *rate* is 0471's; the
  flame's *speed* (8) is a different number and is proposed.
- **A per-boss flame speed.** The flame is one bullet thrown by three bosses, and the fish's whip
  already has its own knob in `reach`; a speed on the attack arm is 0282's tell until a boss needs it.
- **Picking the shuriken's sound here** (13). The ear is the instrument, and the dash is where it sits.
- **Dimming the hit flash or making it continuous.** 0278 and 0334 measured both ends.
- **A single "damage look" constant for every boss.** 0282: every instance authors its own, and the
  default is nothing.
