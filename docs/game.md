# Into the Coil — what the game is

The product definition. **Reasoning is not here** — it belongs in `docs/decisions/`, per `CLAUDE.md`.
This page says *what*, names the decision that owes the *why*, and stays short enough to read before
every session.

---

## One paragraph

A scrolling space shooter in the R-Type and Raiden II line. You fly one character's ship through a
run of eight levels toward the centre of the galaxy, picking up weapons that stay with you, choosing
your next destination from a branching chart, and fighting a unique boss at the end of each stop. It
is the Jörmungandr fight from *The Far Carry* — timing, arsenal, escalating phases — made into a
whole game.

## The shape of a run

| | |
|---|---|
| **Prologue** | choose 1 of the 4 *Far Carry* golfers. Short stage → the Jörmungandr fight. One of the three unchosen characters betrays you |
| **Level 1 choice** | keep your prologue character, or swap to one of 3 others drawn from the unlocked pool |
| **Levels 1–7** | waves, hazards, a mid-boss inside each level and one unique end boss at its end — [0247](decisions/0247-a-level-has-a-mid-boss-and-a-real-one.md) |
| **The chart** | between levels, a branching map of destinations. Every step deeper is harder |
| **The betrayer** | returns as the end boss of a later level |
| **Target length** | 15–30 minutes, prologue to final boss. **~2 minutes of stage per level plus its boss** — it was ~3 and the player cut it twice from play, for DENSITY: *"reduce the level length without reducing enemy count to increase the density of enemies"*, and then *"it still took me 3 minutes"*. [0114](decisions/0114-the-fight-is-a-different-piece.md) |

Upgrades and buffs **carry forward across levels, and are lost on a death** —
[0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md). There is **no shop and no
currency** — everything is found in the level and applied the instant you touch it.

A run carries **three lives**, fixed. A death spends one and takes the ship back to its base weapon;
the last one ends the run. ⚠️ **A death does NOT touch the arsenal's charges** —
[0085](decisions/0085-a-death-does-not-cost-the-bombs.md) amends 0039's *a death costs the arsenal* to
the upgrades alone, so bombs banked from clearing levels survive a death and a ship that died with none
flies again with none. **What a death took is thrown back as one piece per kind** — a weapon pickup
and a missile pickup, each showing the kind that was lost, holding that face, and wearing ×2, ×3 or
×4 for the rungs it carries — [0243](decisions/0243-a-death-throws-back-one-piece-per-kind.md).
⚠️ **There are no extras findable in a level** —
[0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md) replaced the extra-life pickup with a
second shield, so the complement only goes down. See *Upgrades*.

**A run that ends may be continued**, once per ending and only from the screen it ends on —
[0068](decisions/0068-a-run-over-is-a-continue.md). The level does not restart: the field is frozen
where the run stopped, the last death's scatter is still lying in it, and the button hands back a
fresh ship and a full complement. ⚠️ **It is the one thing in the game that resets the arsenal** —
[0085](decisions/0085-a-death-does-not-cost-the-bombs.md): a continue puts the charges back to the
ship's starting kit, which is a reduction for a run that had banked any, and a death does not. The
offer expires after seven seconds, which is the only other thing it costs.

## Orientation — the load-bearing rule

**The long axis of the screen is always the scroll axis.**

- Landscape → scrolls horizontally. R-Type.
- Portrait → scrolls vertically. Raiden II.

Levels are authored once, in `along` × `across` world units. The camera maps the long screen axis to
`along` and the short to `across`, so **both orientations show the same span of world and play at the
same difficulty**. Desktop landscape is the primary target; portrait is native, not a fallback.

⚠️ **Landscape is the only orientation shipped** — [0031](decisions/0031-landscape-is-the-shipped-orientation.md).
Portrait is dropped as a destination, not as architecture. One art view is authored (side profile),
and below a landscape aspect the game shows a rotate prompt and **does not step the simulation**.

The predecessor shipped landscape art in a portrait fight and it looked bad to the point of being
unplayable — not because the geometry was wrong, but because ships appearing to move the wrong way
takes the player out of the game entirely.

Consequences, all mandatory:

- Every ship, enemy and boss needs **one view** — side profile. Halving the largest art cost in the
  project buys more animation and more effect work per entity, not less scope.
- Nothing is authored in screen space. Attacks, spawns and terrain are world-space — which is
  ordinary scrolling-shooter architecture, and is what keeps the dodge lane and the lookahead
  identical from a 16:10 laptop to a 21:9 ultrawide.
- `manifest.webmanifest` is `"orientation": "landscape"`, and that is a **hint**: it binds an
  installed PWA only. The gate is the guarantee.

Decided — [0023](decisions/0023-the-long-axis-is-the-scroll-axis.md). `across` is a fixed 100 units
everywhere; lookahead is clamped to 178–240; rotation is exact parity because aspect is long ÷ short.

## Characters and ships

Every character owns a ship, and the ship owns its base weapon, starting special, HUD and visual
identity. Handling is optional — a ship may fly like another and still be a different ship.

⚠️ **Every ship must differ on at least one axis the player can feel.** That is the rule; "ships are
not skins" was the intention and this is the testable form of it. A dozen selectable characters that
play out the same is worse than three that do not, and the same test already applies to upgrades
below: *an upgrade that cannot change the outcome is worse than none.*

The axes, in the order they are cheapest to make felt:

| axis | example |
|---|---|
| **base weapon** | faster auto-fire · a cone spread · a single piercing beam |
| **starting special** | a shield · bombs |
| visual identity | always, and never on its own |
| handling | optional, and the hardest of the four to make legible |

Two or three differences authored first, then played, then extended — not a full roster designed up
front. The constraint is that adding one stays a table edit.

**Prologue roster — the four *Far Carry* golfers:** Feather Fade, Huang-Woo Hook, Longshot Larry,
Backspin Bo.

**Level 1 roster:** your prologue pick, plus three drawn from the unlocked pool. Always four on
offer. The draw is seeded from the run seed, so resuming does not reroll it.

**Unlock pool:** the nine *Far Carry* caddies, plus the three prologue golfers you did not fly, plus
new faces.

The predecessor names most of its caddies by species and role. This game gives them **actual names
and characterisation** — the same nine, not extra ones:

| *The Far Carry* | here |
|---|---|
| Space Ducks | **Lord Pembleforth the 5th**, a Space Duck — singular |
| Convict Sheep | **Peep** |
| Mystic Mole | **Marty** |
| Prognostic Parrot | **Percival** |
| Penelope Putter · Driver Dan · Dr Chipinski · Suggestible Sam · Sandy the Sand-Saver | carried across as they are, for now |

⚠️ **A rename is not a new face.** The pool is nine caddies either way; naming four of them does not
grow it. "New faces" above means characters that do not exist in the predecessor at all, and none are
named yet. None of the four names on the right appears in *The Far Carry*, and the caddy there is the
plural "Space Ducks".

## Controls

**Three devices, one game.** Nothing about the game changes with what is in the player's hands, and
no device is faster than another — see
[0032](decisions/0032-touch-is-relative-drag-and-not-a-stick.md).

| | movement | specials |
|---|---|---|
| keyboard | arrows or WASD, by **physical key position** so a non-QWERTY layout keeps the shape | Space, Shift |
| touch | **relative drag** — the ship moves by however far the thumb moved, not to where it is | a tap strip along the leading edge, one band per special |
| gamepad | left stick, analog, with a radial deadzone | face buttons |

**A touch stick is offered as an alternative and is not the default.** A glass stick has no tactile
centre to return to, saturates at full deflection, and costs a re-centre to reverse. Relative drag
has none of those and is the scheme the mobile shooters that got this right actually use. Both exist
because *what the author thinks is the right way to play is not necessarily the right way to play* —
but the default still has to be right, because most players never open a settings screen.

⚠️ **The control scheme is a preference, never a difficulty knob.** Every device saturates at the
same ceiling, so no device can outrun another, and none of this is allowed anywhere near
`src/sim/assist.ts` — a player who prefers a stick must not thereby be playing an easier game.
[0024](decisions/0024-the-accessibility-floor-is-settings.md) is why.

## Weapons

Each ship carries:

- **Auto-fire** — the base weapon **and every upgrade to it**. Always on, requires no input, and it
  is the only thing that fires itself.
- **A starting special** — limited capacity, unique to the ship. May be offensive, may be shields.
  **Manual.**
- **More specials, found during the run.** A shielded ship that picks up bombs carries both, each on
  its own trigger and its own cooldown. Kept to the end of the run, like every other upgrade.

⚠️ **Auto-fire is the base weapon, not the arsenal.** Specials, shields, bombs and heavies are all
triggered by the player, one trigger per owned weapon, each on its own cooldown — the Raiden II
relationship between the shot you never think about and the bomb you have to spend. Straight from the
Jörmungandr fight.

⚠️ **The arsenal is a LIST, never a slot**, and this is a code constraint rather than a flourish. A
ship modelled with one special field, an input layer with one special binding, or a save storing one
special kind each independently make a second special a rewrite instead of a pickup. Nothing here
says how many there will be — only that the shape must not decide it. One trigger per owned weapon
is already the rule above; this is what it costs to mean it.

**The skill is in surviving the onslaught, not in mashing a fire button.** A well-timed special is
the difference between combat and tracing a finger across the screen, which is exactly why the shot
is free and nothing else is. Firing the rest of the arsenal for the player is an *assist* and it is
off by default — see [0024](decisions/0024-the-accessibility-floor-is-settings.md).

## Upgrades

Found in the level, applied on contact, kept across every level that follows — and **lost on a
death**, back to the ship's base weapon and starting special
([0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md)). Every upgrade **changes how
the ship looks on screen**, and every upgrade is worth taking — an upgrade that cannot change the
outcome is worse than none.

**A pickup is rare, and a level offers nine of four kinds** —
[0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md) and
[0083](decisions/0083-two-ladders-of-four.md). They are premium game pieces: each one is a crossing the
player commits to under fire, and what the level authors is what the player gets.

| | a tier buys | tiers | per level |
|---|---|---|---|
| **`weapon`** | a barrel **and** a fire-rate step | 4 | 4 |
| **`missile`** | a tube **and** a rate step, max 2 tubes | 4 | 2 |
| **`shield`** | one hit that never reaches the hull, capped at 3 | — | 2 |
| **`bomb`** | charges for the arsenal, uncapped — the only pickup the player decides when to use | — | 1 |

**A level offers exactly enough weapons to cap the guns before its boss**, and then a couple of things
that are not weapons. The nine is derived from that rather than chosen.

⚠️ **An upgrade pickup taken once its own ladder is full becomes a bomb charge** — per ladder, which is
what makes bombs uncapped. That is how *every upgrade is worth taking* survives having a cap; before
0082 it became unbounded damage instead, which was the reported defect: *"when you get max speed
nothing is a challenge, bosses die in less a second."*

⚠️ **A weapon is a kind, and the weapon pickup cycles between the guns** —
[0233](decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md). Each gun carries its own four-tier
ladder, its own pickup face and its own three hulls, so **the ship wears the gun it is carrying**. A
weapon pickup turns to the next gun every two seconds, waits long enough to show every gun twice, and
wanders the player's box while it does; what the player is handed is the face it was showing.
**Taking a different gun starts that gun's ladder at one rung** and leaves the missile ladder alone.
The missile pickup cycles the same way over the tubes. **Every face of a cycling pickup is its own
glyph in its own ink** inside the one bubble that says *pickup* —
[0239](decisions/0239-the-guns-answer-the-third-play-test.md),
[0240](decisions/0240-the-blades-reach-the-boss.md): the pulse and the missile in their
projectiles' orange, the arc in the ship's, the shuriken in steel, the seeker in the ally ink.

| gun | what it does | a tier buys |
|---|---|---|
| **pulse** | the base weapon: fast, small, reaches the edge of the screen and can miss | a barrel **and** a fire-rate step |
| **arc** | chain lightning: from the nose to the nearest body in reach, then the next, three links at most; on a lone boss it jumps around the hull. Cannot miss, cannot reach — its reach has been cut back twice from play, [0239](decisions/0239-the-guns-answer-the-third-play-test.md), [0241](decisions/0241-the-ship-wears-its-colours.md) | a link, a fire-rate step, and weight |
| **shuriken** | steel blades about the ship's size, thrown in pairs from the wingtips: each goes up the lane and swings across it, the two a half-turn apart and crossing ahead of the nose, so their tracks are the two strands of a helix to the leading edge of the screen, landing on everything they cross once per impact flash; not spent by arriving — [0234](decisions/0234-a-blade-circles-the-ship.md), [0238](decisions/0238-the-picture-answers-the-second-play-test.md), [0244](decisions/0244-a-blade-rides-a-helix.md) | a wider band **and** a fire-rate step |

| tube | what it does | a tier buys |
|---|---|---|
| **missiles** | fly the lane from the wings; three pulses each | a tube **and** a rate step, max 2 tubes |
| **seekers** | hunt the nearest body on the screen — and only on the screen — from the moment they leave the tube, any direction, for a second and a half and then go out in a puff; two pulses each; in the ally ink — their own pickup face's — so a seeker is never mistaken for a missile, a bolt or the ship — [0235](decisions/0235-a-seeker-hunts-the-nearest-body.md), [0238](decisions/0238-the-picture-answers-the-second-play-test.md), [0241](decisions/0241-the-ship-wears-its-colours.md), [0246](decisions/0246-a-seeker-hunts-on-the-screen.md) | the same |

The rest of the vocabulary is unbuilt: multi-tag tracking specials, piercing shots, faster engines,
orbiting mines that are half shield and half weapon. Nothing triggers a special except the bomb.

⚠️ **There are no extra lives to find, and a run's complement can only go down** — 0082, on the
grounds that a shield is the better version of the same promise: it stops the death, so it keeps the
upgrades a death would cost ([0085](decisions/0085-a-death-does-not-cost-the-bombs.md) took the
charges out of that sentence — a death no longer costs them). **This is open rather than settled**,
and it is what
[0068](decisions/0068-a-run-over-is-a-continue.md)'s free continue is currently standing in for.

⚠️ **A death hands back everything it took, where it happened — but never a shield.** That is the
answer to *what is a player who just died flying with*, and it replaces the twenty-second rearm ceiling
this page carried until 0082. [0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md) made it
half and a play-test called that *"too punishing"*, so
[0083](decisions/0083-two-ladders-of-four.md) put it back to all of it.

**The title screen carries a key** — every pickup, its real sprite, and what it does.
[0045](decisions/0045-the-player-can-see-what-they-are-carrying.md). The enemies deliberately get no
key: an enemy announces itself by shooting at you, and a pickup announces nothing.

## Levels, bosses and hazards

Themed on the fourteen *Far Carry* biomes, split into difficulty tiers. Each level gets its own
enemies, upgrade flavour and bosses.

**Difficulty has two axes.** A **tier** is chosen before a run and fixed for its length
([0047](decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md)). A **dial** moves
during one: it is `1 + the level's index + the weapon pickups that level has already offered`, so it
climbs through a level, drops back at a boundary without losing the run's progress, and reaches
**11 at the last boss** — [0084](decisions/0084-the-dial-is-the-level-and-the-guns.md). The two
multiply; neither replaces the other.

⚠️ **What the dial spends today is one rule**: nothing takes more than one hit until the first level
has offered two weapon pickups. That is the reported spike at the start of the game, and the dial was
landed with the smallest content on it on purpose — what a rising dial *sends* is still to be authored.

A level is **an authored script** — a list of waves, each a place, an enemy kind, a formation and a
lane — plus one boss at the end of it. Decided,
[0040](decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md).

**Two levels exist**, played as a straight sequence with a screen between them —
[0042](decisions/0042-a-run-is-a-sequence-of-levels.md). Lives, upgrades and the arsenal cross that
boundary; the camera, the waves and the ship reset. **The chart does not exist yet**, and a line
first is deliberate: a chart is a screen, a graph and a set of rules that want to be decided against
levels somebody has played.
⚠️ **EVERY LEVEL IS A PLACE NOW** — [0107](decisions/0107-a-level-is-a-place.md). Seven themes, one
per level, each carrying its own backdrop and its own mix of the music. **No biome is NAMED**: the
places are this project's own, because the fiction is downstream of whether theming works at all and
`CLAUDE.md` allows opening the predecessor only for a named file and a named reason. A biome name
drops onto a row without touching anything else.

⚠️ **AND FIVE OF THE SEVEN WERE NAMED BY THE PLAYER, WHICH IS THE FICTION ARRIVING FROM THE OTHER
DIRECTION** — [0146](decisions/0146-three-more-places-and-two-after-them.md), 2026-08-13. A jurassic
belt with lasers in it, a labyrinth with something hunting you through it, an ice shelf, a toxic mire
with a hydra in it, and the black hole at the heart of the galaxy. **Still not the predecessor's
biomes**, and still nothing opened to find them. **Every level is now its own composition** as well as
its own room, and no two share a progression.

**Every boss is unique** — its own attacks, its own effects, its own escalation. The Jörmungandr
model is the baseline: phases keyed to remaining health, so every arsenal meets every phase, and a
heavier loadout shortens the fight without trivialising it.

⚠️ **TWO FIGHTS A LEVEL SINCE [0247](decisions/0247-a-level-has-a-mid-boss-and-a-real-one.md).**
The seven bosses the run had are its mid-bosses now, at half their health, fought inside the level
under its own music; the real boss of each place waits at the end. The real bosses are the
serpent (Jörmungandr, the Approach), the hell-spawned eagle (Ember Nebula), the pterodactyl
(Saurian Belt), the gyre (the Labyrinth — the lattice upgraded), the frost ship (Rime Shelf), the
hydra (Toxic Mire) and the jellyfish with the black heart in it (the Black Heart). Each is a first
iteration; the attacks the game had no word for — flame and frost, whips, beams, summoned hordes,
a spinning wall, a cold that slows, heads that grow, tendrils, a final opening — are each their own
decision. [`the-bosses-asked`](../reports/the-bosses-asked-2026-09-05.md) is the brief.

**The serpent has its three weapons** — [0248](decisions/0248-the-serpent-strikes.md): a wall of
acid while it is whole, a spray of void once hurt, and at its last third lightning in columns
down the whole lane, each column a warning line for three quarters of a second before it strikes.
A phase says what a boss throws, since then; acid and void are shots in inks of their own.

⚠️ **A phase changes what a boss DOES, not what it looks like** —
[0040](decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md). Nothing on screen currently
says how much boss is left, and whether that reads as progress is the first question a play-test of
level one has to answer.

⚠️ **AND A BOSS MAY NOW UNCOIL, OR OPEN** — [0150](decisions/0150-the-uncoil-and-the-eye.md) and
[0151](decisions/0151-the-gap-you-have-to-reach.md), from *"the bosses need to be more interactive
with more varied attacks."* Two of the Jörmungandr fight's five mechanisms this game had no vocabulary
for: an **uncoil** — a curtain right across the lane with a single hole in it, thrown every 10% of
health below half — and a **bared window**, where the boss stops shooting and takes triple damage
until it dies. On the chorus and the axis, and on nothing else yet.

⚠️ **The hole is in the SAME PLACE every time, and that is the whole of the challenge** — *"a static
hole in the wall is a pattern the player needs to learn, a variable hole that spawns close to the ship
negates the entire difficulty of the obstacle."* Where it may sit is a measurement: the curtain is in
the air for 39–75 steps, in the worst of which the ship covers 59.5 units, so a hole has to be
reachable from the far wall and nowhere further. **What the uncoil asks for is positioning, not a
resource** — 0151 records that this leaves *"the shield has no moment it is FOR"* open again.

⚠️ **AND DIFFICULTY IS MANAGED BY ONE QUESTION**, given 2026-08-16: *"the game is supposed to be hard
and gets harder with each level. It's a short game so the replayability comes from the difficulty.
Management of difficulty is **'is this unfair' OR 'is this a learnable strategy'**?"* A hard mechanism
is kept when it is the second one and softened only when it is the first.

Hazards are environmental and must be dealt with, not only dodged. Asteroids are the reference case:
shoot one and the fragments become weapons that damage enemies — a hazard that stays playable under
auto-fire and low-input control schemes.

## Save and resume

The save is an **interruption hedge and not a safety net** —
[0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md). It exists so that a browser
killed in the background does not destroy a run, and it must never turn a game over into a retry.

⚠️ **[0068](decisions/0068-a-run-over-is-a-continue.md) does not weaken this.** A continue is offered
on a screen, for seven seconds, and expires; reloading the page past a game over is still refused.
The save is not the place a second chance comes from.

So it stores the run's **current** lives and **current** arsenal, and resumes at the start of the
level the player was in. No re-picks, no re-rolls, and a countdown before the first wave arrives.
Closing the page costs the progress made through that level and returns nothing.

Storage keys are `itc_*`, listed in `PRIVACY.md`, versioned from v1 with a migration chain.

## Frame rate is a feature, not a target

A player who dies to a stutter has been cheated, and every point of difficulty this game can afford
is bought with smoothness. Four rules, all architectural, all owed a decision before the loop exists.

**Art is generated as code and baked into bitmaps.** Every ship, enemy, boss and effect is a pure
function of `(kind, variant, palette, view)` drawn once into an offscreen canvas at load, and blitted
thereafter. Per-frame path filling is banned. This is not a compromise between procedural art and
sprites — it is both: no asset files, so the single-file build survives; a blit per entity, so the
frame cost is a sprite's; and the art stays re-renderable at any size or palette, which is what makes
the high-contrast and colour-blind palettes free rather than a second art pass.

**The simulation runs on a fixed timestep; rendering interpolates.** A sim stepped by wall-clock
delta teleports bullets through the player on a dropped frame, and makes difficulty a property of the
machine. Fixed steps also keep the run deterministic, which is what the seeded draws, the resume and the
replays all rest on. (0022 also listed a one-button clearability proof here;
[0024](decisions/0024-the-accessibility-floor-is-settings.md) dropped it with the authored assist
path. The fixed timestep is unaffected.)

**No allocation in the hot loop.** Entities live in pre-allocated pools and are mutated in place. GC
pauses are the main cause of jank in a browser game, and a bullet-hell allocates hardest exactly when
it can least afford to.

⚠️ This qualifies decision 0017. The reducer state — screens, run, settings — stays immutable plain
data. The per-frame entity arrays inside `sim/` are mutable pools and are **not** reducer state.
Those are two different things wearing the same word.

**Canvas2D first, measured, with the door open.** The painter interface takes model and state in and
puts pixels out, so a WebGL backend is a swap rather than a rewrite. Start on Canvas2D, cap the
device pixel ratio, and let the numbers decide.

**And the budget is a guard, not a hope.** A headless run at worst-case entity count asserts a frame
budget in CI. A guard that has only ever been green is not known to work, so it is proved against a
deliberately over-populated scene before it is trusted.

## Voice

**Player-facing text is terse.** No explanatory commentary, no restating what the screen already
shows, no coaching. Players are assumed to be adaptable; hints are added where play proves they are
needed, never pre-emptively. Over-explanation costs flow, spoils content, and turns a HUD into a wall
of text.

Owed a decision, and a test.

## Accessibility

Decided — [0024](decisions/0024-the-accessibility-floor-is-settings.md).

⚠️ **AND THE PASS COMES AFTER THE GAME, WHICH IS A DECISION THAT WAS MADE AND NEVER WRITTEN DOWN.**
Given 2026-08-25: *"I thought I changed the accessibility rules so that we're going to make the game
first and then run the accessibility pass afterwards. The accessibility pass has been as restrictive
as the other guards and not in a good way."*

⚠️ **IT WAS NOT IN THIS FILE, NOT IN 0024, AND NOT IN `docs/state-of-play.md`**, so every session
since has gone on enforcing the old rule — which is
[0029](decisions/0029-the-tracked-record-is-the-record.md) exactly: a decision that lives only in chat
did not happen. **Three art decisions were authored against a floor the player had already lifted.**

⚠️ **WHAT IS DEFERRED AND WHAT IS NOT IS THE WHOLE OF IT** —
[0198](decisions/0198-the-accessibility-pass-comes-after-the-game.md). Deferred: the WCAG contrast
floors, the second palette, and every guard that refuses a colour for being hard to read. **Not
deferred: anything that is GAMEPLAY legibility** — a sky mark the size of a bullet, an enemy that
cannot be told from a pickup, a flash that hides the field. Those are not accessibility rules wearing
a different hat; they are the game working.

**There is one game, and it is the loud one.** Accessibility is knobs over that default, never
restraint of it. Unconditional and not switchable off: colour never carries meaning alone, every cue
has a visual twin, a flash-intensity cap, actions-not-keys input, an interactive first stage.
Opt-in settings: high-contrast and colour-blind palettes, reduced motion, and a closed ladder of
assists — pace, resilience, hurtbox, terrain, auto-specials, flight assist. **No assist ever makes
the game harder**, and no comfort setting may touch the sim.

The **authored horizontal assist path per level is dropped**, along with the law it required
(*anything demanding cross-axis evasion is scripted, not reactive*) — it banned most of the genre and
taxed every level forever, to serve one setting. One-button survives as a rail input mapping, which
costs no content and is deletable. The itch tag is not claimed until it has been played.

Not claimed: blind-friendly play, and textless. For a positional shooter both are a different game.

## Deliberately not in this game

- **No shop, no currency, no economy.** Re-adding one is an argued reversal, not a drift.
- **No procedural level generation.** Levels are authored; the chart between them is the variety.
- **No always-online anything.** The game makes no network requests after load.

## Carried from *The Far Carry*

**Patterns and fiction transfer; code and simulation do not** — it is a golf game and its model is
fused to that domain at the type level.

**Fiction transfers as raw material, not as scripture.** Names, details and characterisation may be
changed, sharpened or replaced on the way across. "Space Ducks" becomes the singular Space Duck, and
four caddies the predecessor names by species are **named and given a background** rather than
replaced — see the table above; the roster does not grow. Nothing here is bound to the predecessor's
spellings.

`CLAUDE.md`'s current wording — *"its patterns transfer; its content does not"* — is amended to say
this.

### Canon

**The Warden ending is canon.** The player fought Jörmungandr and won; the Reseal held. The Herald
path ends the universe, which makes for a short sequel.

So the Coil survived its defeat, and the Crow — never at the root, never caught — is still out past
the last chart. *The Far Carry*'s own Warden credits set this game up: a black bird watching a door,
with all the time there has ever been.

## Open

- Whether a *Far Carry* backup file can be imported to seed the prologue. Possible via the exported
  `far-carry-backup` envelope; impossible via storage, which is origin-scoped. Not a dependency —
  the prologue exists for every player either way.
- The chart's shape. It must read as descent toward the centre, and must not be a copy of the star
  map.
- Music. Procedural synthesis keeps the single-file build; a baked track does not. Sound effects are
  synthesised either way.
