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

Upgrades, buffs and items carry forward for the whole run. There is **no shop and no currency** —
everything is found in the level and applied the instant you touch it.

## Orientation — the load-bearing rule

**The long axis of the screen is always the scroll axis.**

- Landscape → scrolls horizontally. R-Type.
- Portrait → scrolls vertically. Raiden II.

Levels are authored once, in `along` × `across` world units. The camera maps the long screen axis to
`along` and the short to `across`, so **both orientations show the same span of world and play at the
same difficulty**. Desktop landscape is the primary target; portrait is native, not a fallback.

Consequences, all mandatory:

- Every ship, enemy and boss needs **two views** — side profile and top-down. This is the single
  largest art cost in the project.
- Nothing is authored in screen space. Attacks, spawns and terrain are world-space or they break on
  rotation.
- `manifest.webmanifest` moves from `"orientation": "landscape"` to `"any"`.

Owed a decision before the first frame is drawn.

## Characters and ships

Every character owns a ship, and the ship owns its handling, HUD, starting special and visual
identity. Ships differ; they are not skins.

**Prologue roster — the four *Far Carry* golfers:** Feather Fade, Huang-Woo Hook, Longshot Larry,
Backspin Bo.

**Level 1 roster:** your prologue pick, plus three drawn from the unlocked pool. Always four on
offer. The draw is seeded from the run seed, so resuming does not reroll it.

**Unlock pool:** the nine named *Far Carry* caddies — Penelope Putter, Driver Dan, Dr Chipinski,
Space Ducks, Convict Sheep, Suggestible Sam, Sandy the Sand-Saver, Mystic Mole, Prognostic Parrot —
plus the three prologue golfers you did not fly, plus new faces.

New to this game: **Lord Pembleforth the 5th** (Space Duck), **Peep** (Convict Sheep), **Marty** (the
Mystic Mole). None of these names exist in *The Far Carry*; the caddy there is the plural "Space
Ducks".

## Weapons

Each ship carries:

- **Auto-fire** — basic, always on, requires no input.
- **A starting special** — limited capacity, unique to the ship. May be offensive, may be shields.

The skill is in the specials and the heavies, not in holding a fire button. Straight from the
Jörmungandr fight: one trigger per owned weapon, each on its own cooldown.

## Upgrades

Found in the level, applied on contact, carried to the end of the run. Every upgrade **changes how
the ship looks on screen**, and every upgrade is worth taking — an upgrade that cannot change the
outcome is worse than none.

The vocabulary: faster fire, wider spray, shields, homing rockets, extra lasers, one-shot bombs,
multi-tag tracking specials, piercing shots, faster engines, orbiting mines that are half shield and
half weapon.

## Levels, bosses and hazards

Themed on the fourteen *Far Carry* biomes, split into difficulty tiers. Each level gets its own
enemies, upgrade flavour and bosses.

**Every boss is unique** — its own attacks, its own effects, its own escalation. The Jörmungandr
model is the baseline: phases keyed to remaining health, so every arsenal meets every phase, and a
heavier loadout shortens the fight without trivialising it.

Hazards are environmental and must be dealt with, not only dodged. Asteroids are the reference case:
shoot one and the fragments become weapons that damage enemies — a hazard that stays playable under
auto-fire and low-input control schemes.

## Save and resume

A run resumes **from the start of the last level reached**. No re-picks, no re-rolls, and a countdown
before the first wave arrives.

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
machine. Fixed steps also keep the run deterministic, which is what the seeded draws, the resume, the
replays and the one-button clearability proof all rest on.

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

The floor is set before the first game file, not before launch. Confirmed: colour never carries
meaning alone, high-contrast palette, configurable controls, an interactive first stage, reduced
motion under one owner, a flash-intensity cap, and no information delivered by audio alone.

One-button play is a settings bundle over assist knobs — auto-fire, non-lethal terrain, and an
**authored** horizontal assist path per level. Not a runtime autopilot. The law it requires:
*anything demanding cross-axis evasion is scripted, not reactive.*

Not claimed: blind-friendly play, which for a positional shooter is a different game.

Owed a decision.

## Deliberately not in this game

- **No shop, no currency, no economy.** Re-adding one is an argued reversal, not a drift.
- **No procedural level generation.** Levels are authored; the chart between them is the variety.
- **No always-online anything.** The game makes no network requests after load.

## Carried from *The Far Carry*

**Patterns and fiction transfer; code and simulation do not** — it is a golf game and its model is
fused to that domain at the type level.

**Fiction transfers as raw material, not as scripture.** Names, details and characterisation may be
changed, sharpened or replaced on the way across. "Space Ducks" becomes the singular Space Duck, and
Lord Pembleforth the 5th, Peep and Marty are new. Nothing here is bound to the predecessor's
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
