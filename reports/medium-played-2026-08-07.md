# Medium, played end to end — 2026-08-07

**The first play-test of the middle tier, and the first verdict on the fourteen changes
`docs/state-of-play.md` had been holding unplayed.** Played on the build **before** the sound work
([PR #97](https://github.com/Foxorama/into-the-coil/pull/97), decision 0072) landed, so none of it is
about sound.

⚠️ **That decision is deliberately not linked as a file.** It is unmerged as this is written, and
`tests/links.test.ts` refuses a relative link to something no clone has — correctly. The citation
becomes a link when 0072 is on `main`.

The player's words are kept verbatim, because they are the findings and a status document cannot
hold one ([0029](../docs/decisions/0029-the-tracked-record-is-the-record.md)).

⚠️ **The headline is one word and it is not a bug report.**

> *"honestly, it was just boring"*

Nothing below is a crash, a wrong number or a silent event. Every guard in the repository was green
for all of it. That is [0027](../docs/decisions/0027-measure-the-picture-not-the-model.md)'s subject
arriving at the level above the picture: **the model is right, the picture is right, and the game is
not interesting.**

---

## What was said

> *"the waves just come and go they don't do anything interesting"*

> *"it's hard when you have tier 1 and tier 2 weaponry and pretty easy with tier 3 and tier 4
> weaponry"*

> *"Shields make a massive difference, but most of the difficulty is enemies that fly past and shoot,
> or shoot from off-screen. We have no way currently to deal with enemies that fly past the player."*

> *"the hard block on the player movement was a problem because there was no indication of it, and I
> got shot a couple of times because I tried to fly forward on the screen to avoid a bullet and
> couldn't"*

> *"with upgraded weapons the bosses die in less than a second and they all do the exact same movement
> with different shapes"*

> *"there's a background scene reset between levels that's disjointing because it moves the player's
> ship, the level change needs to be seamless"*

> *"the upgrades themselves are too frequent and too boring, once you get full upgrades, the only
> interesting thing is getting shield refreshes, every other bonus is useless at that point"*

---

## Three of them are defects, and all three are confirmed in the code

Read before answering, so the report is evidence rather than agreement.

### 1. An enemy off the LEADING edge shoots, and nothing stops it

`fireEnemies` in `src/app/frame.ts` refuses to fire from off screen — and it checks **`across` only**:

```
if (e.across + e.radius < 0 || e.across - e.radius > ACROSS_SPAN) continue;
```

[0059](../docs/decisions/0059-the-lane-is-the-players-box.md) added that line when the roam made the
`across` edges reachable, and the `along` axis never got the same test. The gap is not marginal:

| | |
|---|---|
| a wave is placed at | `camera + MAX_ALONG_SPAN + EDGE_MARGIN` ≈ **camera + 246** |
| a 16:9 phone can see to | `camera + 177.8` |
| so a new enemy shoots from off screen for | **≈ 68 world units of its approach** |

At a typical closing speed that is **around two seconds of fire from a body the player cannot see**,
every wave, on every device — and it is *worse* on a narrow screen, because the spawn distance is
fixed against the widest view by 0023 while the visible span is not.

⚠️ **This is [0036](../docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md)'s
own failure mode, exactly**: *"a hit with no cause on the picture"*, which 0036 records being
**reported three times as a collision fault that did not exist**. 0059 fixed one axis of it and the
decision does not say the other was considered.

### 2. The player's box is a wall with nothing drawn on it

`src/sim/flight.ts` clamps the ship to `camera + PLAYER_MARGIN … camera + PLAYER_ALONG_SPAN −
PLAYER_MARGIN`, which is **camera + 6 to camera + 144**.

| screen | visible along | the player may reach | invisible wall short of the leading edge by |
|---|---|---|---|
| 3:2, the narrowest | 150 | 144 | 6 |
| 16:9 | 177.8 | 144 | **34** |
| 21:9, the widest | 240 | 144 | **96** |

So on a wide screen the ship is boxed into the back 60% of the picture and **the box is not drawn,
not shaded, and not hinted at anywhere.** The player flew forward to dodge and hit nothing they could
see.

⚠️ **The box itself is not the bug and must not be removed.** 0023 fixes it so that lookahead is the
only thing that varies by device — a ship that could fly to the leading edge would see less warning on
a phone than on a monitor, which is the difficulty-by-hardware rule the whole camera design exists to
prevent. **What is missing is that it is invisible**, and the fix is a picture, not a number.

### 3. The level boundary resets the camera, so the sky and the ship both jump

`onward()` → `startLevel(keepShell: true)` → `resetScene(w)`, which sets `cameraAlong = 0` and calls
`respawn`, putting the ship back at `SHIP_START_ALONG`. The sky's parallax is a function of the
camera ([0065](../docs/decisions/0065-the-sky-is-baked-and-blitted.md)), so it snaps back with it.

⚠️ **The camera reset is load-bearing and cannot simply be deleted.** `resetScene` says why:
*"distance travelled is the only clock a level has — a wave table places its content against
`cameraAlong` — so a second run that started where the first one ended would be playing a different
level with the same name."* A seamless boundary therefore means **giving a level an origin** rather
than assuming it starts at zero, which is a real change to how a level is read, not a line.

⚠️ **This is the second half of a finding 0063 already has.**
[0063](../docs/decisions/0063-a-level-break-is-a-respite.md) landed the respite — the world keeps
moving behind the banner — and the world it keeps moving is then thrown away one press later. The
report that produced 0063 said the interruption is why the branching chart *"will probably get
scrapped"*; this is the same complaint, one layer down, about the thing 0063 did not touch.

---

## Four of them are one problem, and it is the balance pass

**The power curve is a step, and the content is not authored against it.** Each of these is the same
system seen from a different angle:

- *"hard with tier 1 and 2, pretty easy with tier 3 and 4"*
- *"the upgrades are too frequent"*
- *"once you get full upgrades… every other bonus is useless"*
- *"with upgraded weapons the bosses die in less than a second"*

Difficulty is currently a function of **how upgraded the player is**, not of which level they are on
or which tier they chose. The upgrades arrive fast enough that the interesting band — where the
weapon is not yet everything — is over early, and after it the only pickup that still means anything
is a shield, because it is the only one that is *spent*.

⚠️ **This is the item `docs/state-of-play.md` has been calling the largest open thing in the project,
now with evidence.** The player's own earlier reason for deferring it was *"pre-balancing means
re-balancing later"*; the deferral has now been paid for and the evidence has arrived.

⚠️ **It is also question 1 of the eight, unchanged.**
[`the-eight-questions-answered`](the-eight-questions-answered-2026-08-07.md) recorded *"too hard to
beat with tier 1/2 weapons and too easy to beat with fully upgraded weapons"* about the boss, and
marked it **still open**. It is now the same finding about the whole game.

## Two more are one problem, and it is not balance

- *"most of the difficulty is enemies that fly past and shoot"*
- *"we have no way currently to deal with enemies that fly past the player"*
- and, underneath both, *"I tried to fly forward to avoid a bullet and couldn't"*

**The player's answer space points one way.** Everything the ship owns fires forward — the pulse, the
missiles ([0051](../docs/decisions/0051-a-missile-is-the-second-auto-weapon.md)), the bomb
([0053](../docs/decisions/0053-the-bomb-is-the-first-thing-the-player-spends.md)) — and the ship
cannot advance past `camera + 144`. So a body that gets behind the player is **unanswerable by
construction**: it cannot be shot and it cannot be outrun.

⚠️ **This is very likely why the waves read as boring rather than as unfair.** A wave that has passed
is not a threat the player is fighting, it is a timer they are waiting out — and
[0059](../docs/decisions/0059-the-lane-is-the-players-box.md)'s roam, which was landed to make the
field feel wider, puts *more* bodies behind the player than the tunnel did.

⚠️ **`docs/game.md` already reserves the answer and it has never been built.** The arsenal is *"a
list with nothing in it"* apart from the bomb, and 0039 defines a special as the thing a player
spends. A rear or an omnidirectional special is content in a slot that exists.

## And one is a content gap the roster decision predicted

> *"they all do the exact same movement with different shapes"*

[0071](../docs/decisions/0071-five-more-levels-and-one-idea-each.md) gave each of the seven bosses one
idea, and [0061](../docs/decisions/0061-a-boss-keeps-flying.md) gave **all** of them the same drifting
station, because that decision's subject was *a boss that stopped flying* rather than *seven bosses
that fly differently*. 0061 named the alternative it did not take — *"a wall-type boss holding the far
edge with its own style"* — and called it **content rather than a repair**.

⚠️ **0071 also recorded that the five new hulls "have not been looked at."** They still have not.

---

## Said when the plan was set out, and it is a precondition rather than a preference

Two more things were given after the findings above, in answer to *what should answer a threat behind
the player* and *how should the upgrade curve be fixed*. Both are recorded here because they are the
player's words and the work they constrain has not started.

### The enemies are the answer, and the diagnosis is the sharpest thing said

> *"We need to make the enemies actually enemies, currently basically every wave is just a wall that
> you pass by. They need to circle, double back etc and be actively dog-fighting with the player, it
> can be straightforward dog-fighting depending on difficulty, but currently, especially with
> auto-fire mode (which I think we should still keep) the game is just not a game, it has actually
> become what we tried to avoid, a one-button autopilot stick where you just move around a bit."*

⚠️ **That last clause is [0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md)'s own
words about the DEFAULT game.** 0024 dropped the authored horizontal assist path partly because *"a
ship following an authored path with auto-fire on is a game playing itself"*, and argued the real
difficulty is *"continuous, accurate, fast movement under time pressure."* Enemies on rails apply no
time pressure, so the shipped default has drifted into the thing that decision refused to build as an
opt-in assist.

⚠️ **0024 also already cleared the way.** It dropped the law that *"anything demanding cross-axis
evasion is scripted, not reactive"* because *"the law bans the genre… rules out aimed shots, homing
shots and anything that responds to where the player is."* Reactive enemies are permitted by name.
**Auto-fire stays** — `src/content/actions.ts`'s *there is no `fire` action and there must never be
one* is untouched by any of this.

Also chosen, alongside the enemy work: a **rear-firing weapon upgrade**, an **omnidirectional
special**, and **more forward room for the ship**.

⚠️ **The forward room is worth six world units and no more, at the current device support.** The box
is `camera + 6 … camera + 144` and `MIN_ASPECT` guarantees every device shows at least 150 along-units
— a wider box puts the ship off its own screen on a 3:2 tablet. Raising that floor to 16:9 exactly
would buy a ~172-unit box and cost letterboxing on 16:10 laptops and 3:2 tablets, which are gutter-free
today. **That trade is not taken here**; it is deferred until the enemies are reactive, because the
value of forward room against something that hunts is a different question from its value against a
wall.

### And the upgrades cannot simply be added to

> *"with the bonus upgrades, we'll need to be careful if we're adding stuff there. like there's a lot
> of upgrades now so I think this'll need at bare minimum better icons to distinguish and also better
> grouping of upgrades as it'll get complex pretty quickly"*

⚠️ **This is a precondition on the arsenal work, not a follow-up to it.** A rear weapon, an
omnidirectional special and a conversion rule for a capped pickup are three more things on a field
that already carries six faces —
and [0052](../docs/decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md) records that
**two of the six already risk reading alike**, while `src/content/sprites.ts` says the same thing
about the drawings. The title screen's key lists all six as if they were six pickups when three of
them are the same object alternating, which
[0052](../docs/decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md) already flagged as
a play-test question and which has now been played.

So the arsenal step carries a **taxonomy and legibility pass** with it: what the groups are, what
distinguishes a group at a glance, and what the key says. Landing two more kinds first and tidying
afterwards is how the field becomes unreadable.

## What this does not settle

**Nothing here is a decision.** Every item above is a finding; where it belongs is a file in
`docs/decisions/`, and the ordering between them is the player's call rather than the dependency
graph's — which is how the previous two lists were handled and why they worked.

⚠️ **The one thing the report is unambiguous about is that these interact.** Making bosses tougher
before fixing the upgrade curve tunes the wrong end of the same system; giving the player a rear
weapon changes what "hard at tier 1" means; and a seamless level boundary changes how much of a
run's difficulty is a single continuous stretch. The verdict on any of it is one play-test after the
last of them lands, exactly as
[`the-eight-questions-answered`](the-eight-questions-answered-2026-08-07.md) required and for the
same stated reason: *"something might feel right by itself in isolation and then completely fail when
you mix something else in."*
