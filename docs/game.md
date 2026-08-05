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
| **Levels 1–7** | waves, hazards, small and medium bosses, one unique end boss per level |
| **The chart** | between levels, a branching map of destinations. Every step deeper is harder |
| **The betrayer** | returns as the end boss of a later level |
| **Target length** | 15–30 minutes, prologue to final boss. ~3 minutes of stage per level plus its boss |

Upgrades, buffs and items **carry forward across levels, and are lost on a death** —
[0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md). There is **no shop and no
currency** — everything is found in the level and applied the instant you touch it.

A run carries **three lives**, fixed, with extras findable in a level. A death spends one and takes
the arsenal back to the ship's base weapon; the last one ends the run.

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
everywhere; lookahead is clamped to 150–240; rotation is exact parity because aspect is long ÷ short.

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

⚠️ **That makes a level's pickup density load-bearing.** A player who dies near the end of a level
and cannot rearm has been handed its hardest stretch with its weakest loadout. Authoring a level
answers this; 0039 names it as a constraint rather than leaving it to a play-test.

The vocabulary: faster fire, wider spray, shields, homing rockets, extra lasers, one-shot bombs,
multi-tag tracking specials, piercing shots, faster engines, orbiting mines that are half shield and
half weapon.

**Two of them exist** — faster fire and wider spray, both always-on upgrades to auto-fire, both
stacking, both lost on a death. Plus **extra lives**, which are the one pickup whose effect is on the
run rather than on the ship. Decided,
[0041](decisions/0041-a-pickup-is-the-answer-to-what-a-death-costs.md); the rest of the list is the
arsenal's work, and nothing triggers a special yet.

⚠️ **A level may never leave the player more than twenty seconds without something to rearm from**,
because a death empties the arsenal. That is a constraint on every level ever authored, and it is
guarded rather than remembered.

**The title screen carries a key** — every pickup, its real sprite, and what it does.
[0045](decisions/0045-the-player-can-see-what-they-are-carrying.md). The enemies deliberately get no
key: an enemy announces itself by shooting at you, and a pickup announces nothing.

## Levels, bosses and hazards

Themed on the fourteen *Far Carry* biomes, split into difficulty tiers. Each level gets its own
enemies, upgrade flavour and bosses.

A level is **an authored script** — a list of waves, each a place, an enemy kind, a formation and a
lane — plus one boss at the end of it. Decided,
[0040](decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md).

**Two levels exist**, played as a straight sequence with a screen between them —
[0042](decisions/0042-a-run-is-a-sequence-of-levels.md). Lives, upgrades and the arsenal cross that
boundary; the camera, the waves and the ship reset. **The chart does not exist yet**, and a line
first is deliberate: a chart is a screen, a graph and a set of rules that want to be decided against
levels somebody has played.
⚠️ **No level is themed yet**, and naming one means going to the predecessor for material, which
`CLAUDE.md` allows only for a named file and a named reason.

**Every boss is unique** — its own attacks, its own effects, its own escalation. The Jörmungandr
model is the baseline: phases keyed to remaining health, so every arsenal meets every phase, and a
heavier loadout shortens the fight without trivialising it.

⚠️ **A phase changes what a boss DOES, not what it looks like** —
[0040](decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md). Nothing on screen currently
says how much boss is left, and whether that reads as progress is the first question a play-test of
level one has to answer.

Hazards are environmental and must be dealt with, not only dodged. Asteroids are the reference case:
shoot one and the fragments become weapons that damage enemies — a hazard that stays playable under
auto-fire and low-input control schemes.

## Save and resume

The save is an **interruption hedge and not a safety net** —
[0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md). It exists so that a browser
killed in the background does not destroy a run, and it must never turn a game over into a retry.

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
