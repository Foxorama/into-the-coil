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
| **The way in** | the page opens on the name while the game loads, then offers the four *Far Carry* golfers; the pick turns the sound on and plays the intro, in which Venoma Krait's Viper lights on its pad and blasts out of the spaceport, and the chosen golfer runs out of the bar to their own ship and chases her through the first level's sky. The title comes up when they are gone; the intro's Skip is up throughout, Escape goes to the menu from anywhere before it — [0415](decisions/0415-the-golfer-is-chosen.md), [0416](decisions/0416-the-viper-has-a-pilot.md), [0411](decisions/0411-the-chase-begins-at-the-port.md), [0412](decisions/0412-the-port-is-heard.md). Each golfer flies their own ship — [0441](decisions/0441-a-pilot-flies-their-own-ship.md) |
| **The menu** | rows: a difficulty band and a pilot band of portraits over *Fly*, *Hangin’ Out* and *Settings*, beside the top five of the table. *Hangin’ Out* is the hangar, where a ship won in is fitted out — [0521](decisions/0521-the-hangar-opens.md) — and its second tab is *Cosmo’s Cosmetics*, which sells things to hang from the dash for Star Shards — [0523](decisions/0523-cosmo-opens.md). Settings holds the look, the sound and the crossing as bands, the music room, and a *How to play* tab. Up and down move between rows and left and right along one, on a pad, the arrows or WASD; B and Escape go back — [0458](decisions/0458-the-title-is-rows.md) |
| **The way out** | the last boss beaten, the finale — and no cut into it: the heart the jellyfish died on races, catches fire and bursts, and the Viper is thrown out of it with one of the golfers who was not chosen in her cockpit — Venoma's captive all along, and the heart took her. The fighter comes up beside her and the two fly off together, each golfer speaking from their own ship — the found one about being found, the chosen one answering, a named speech bubble each with a voice of their own — until they open up and go. Then the victory screen. Skip is up throughout — [0418](decisions/0418-the-heart-lets-go.md), [0426](decisions/0426-the-finale-is-the-fight-going-on.md). ⚠️ No victory piece of music yet |
| **Prologue** | choose 1 of the 4 *Far Carry* golfers. Short stage → the Jörmungandr fight. One of the three unchosen characters betrays you |
| **Level 1 choice** | keep your prologue character, or swap to one of 3 others drawn from the unlocked pool |
| **Levels 1–7** | waves, hazards, a mid-boss inside each level and one unique end boss at its end — [0247](decisions/0247-a-level-has-a-mid-boss-and-a-real-one.md) |
| **The chart** | between levels, a branching map of destinations. Every step deeper is harder |
| **The betrayer** | returns as the end boss of a later level |
| **Target length** | 15–30 minutes, prologue to final boss. **~2 minutes of stage per level plus its boss** — it was ~3 and the player cut it twice from play, for DENSITY: *"reduce the level length without reducing enemy count to increase the density of enemies"*, and then *"it still took me 3 minutes"*. [0114](decisions/0114-the-fight-is-a-different-piece.md) |

Upgrades and buffs **carry forward across levels, through a death and through a continue** —
[0372](decisions/0372-a-death-keeps-the-ladders.md), reversing
[0039](decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md)'s *lost on a death*. **Nothing
that changes a run is bought** — everything is found in the level and applied the instant you touch it.
A run's score pays Star Shards, and they buy only looks —
[0522](decisions/0522-the-score-pays-in-shards.md).

A run carries **three lives**, fixed. **A death spends one and nothing else**: both ladders, both
kinds and the arsenal's charges are the ship that comes back —
[0372](decisions/0372-a-death-keeps-the-ladders.md); nothing is thrown onto the field. The last life
ends the run.
⚠️ **There are no extras findable in a level** —
[0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md) replaced the extra-life pickup with a
second shield, so the complement only goes down. See *Upgrades*.

**A run is one credit unless the player chose Freeplay** —
[0517](decisions/0517-no-quarters-given.md). The title's continues chip is *No quarters given* until
it is pressed: a run that runs out ends on the game-over screen, with its account and *Main Menu*.
On *Freeplay*, kept between visits like the other settings, **a run that ends may be continued**,
once per ending and only from the screen it ends on —
[0068](decisions/0068-a-run-over-is-a-continue.md). The level does not restart: the field is frozen
where the run stopped, and the button hands back a fresh ship and a full complement of lives. **It
keeps everything else** — the ladders, the kinds and the charges
([0372](decisions/0372-a-death-keeps-the-ladders.md), reversing 0068's starting kit and
[0085](decisions/0085-a-death-does-not-cost-the-bombs.md)'s reset). The offer expires after seven
seconds, which is the only other thing it costs.

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

Decided — [0023](decisions/0023-the-long-axis-is-the-scroll-axis.md), at the scale
[0364](decisions/0364-the-view-zooms-out.md) set. `across` is one constant, `ACROSS_SPAN` (120 units),
everywhere; lookahead is clamped to 1.78–2.4 times it; rotation is exact parity because aspect is
long ÷ short.

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

**Each flies their own ship, and the ship owns the gun** —
[0441](decisions/0441-a-pilot-flies-their-own-ship.md). All four are drawn from above in one square
box, with one hurtbox, so what tells them apart is the gun:

| golfer | ship | gun |
|---|---|---|
| Huang-Woo Hook | the fighter | **pulse** |
| Feather Fade | the Little Green Caddie, a saucer | **ray** — [0442](decisions/0442-the-ray-gun.md) |
| Backspin Bo | the Firebird, the black car with the gold phoenix | **shuriken**, thrown from its hubcaps |
| Longshot Larry | the Gilded Estate, the gold wagon | **arc**, from a lightning rod on the roof rack |

A ship opens a run on its whole gun and two charges of the special fitted to it in the hangar — its own
gun's, until the ship and another have both been won in and it borrows theirs
([0524](decisions/0524-the-special-is-fitted.md)) — and carries its missile tubes on its own hull.

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
| keyboard | arrows or WASD, by **physical key position** so a non-QWERTY layout keeps the shape | Space, Shift, and E or X for the ward |
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

- **Auto-fire**: the ship's own gun, whole from the first second
  ([0441](decisions/0441-a-pilot-flies-their-own-ship.md)), and the missile tubes the run has
  found. Always on, requires no input, and the only thing that fires itself.
- **A starting special**: two charges of the ship's own gun's special. **Manual.**
- **More specials, earned during the run.** The bomb pickup offers every gun's special to every ship,
  and a full missile ladder's pickup buys a charge of that tube's own. Kept to the end of the run.

⚠️ **Auto-fire is the base weapon, not the arsenal.** Specials are triggered by the player — the
Raiden II relationship between the shot you never think about and the bomb you have to spend.
Straight from the Jörmungandr fight. **There are THREE triggers, the gun's, the tubes' and the
ward's, and each throws the charge of its own side earned most recently** —
[0376](decisions/0376-a-trigger-for-the-gun-and-one-for-the-tubes.md), correcting
[0373](decisions/0373-a-special-is-the-guns-own.md)'s single queue, which let a charge be thrown
through a weapon it was not earned from; the ward — the void and the nova, the two that unmake enemy
fire — is its own button so a press meant to save the ship never throws a bomb
([0447](decisions/0447-the-ward-is-a-third-trigger.md)).

⚠️ **The arsenal is a STACK, never a slot**, and this is a code constraint rather than a flourish. A
ship modelled with one special field or a save storing one special kind would make a second special a
rewrite instead of a pickup. The stack holds charges of any kinds in the order earned, so what the
trigger throws next is always a fact the state can answer.

**The skill is in surviving the onslaught, not in mashing a fire button.** A well-timed special is
the difference between combat and tracing a finger across the screen, which is exactly why the shot
is free and nothing else is. Firing the rest of the arsenal for the player is an *assist* and it is
off by default — see [0024](decisions/0024-the-accessibility-floor-is-settings.md).

## Upgrades

Found in the level, applied on contact, kept across every level that follows **and every death** —
[0372](decisions/0372-a-death-keeps-the-ladders.md). Every upgrade **changes how the ship looks on
screen**, and every upgrade is worth taking — an upgrade that cannot change the outcome is worse than
none.

**A pickup is rare: a level authors two, and the fights offer the rest** —
[0082](decisions/0082-a-pickup-is-rare-and-says-what-it-is.md),
[0083](decisions/0083-two-ladders-of-four.md) and [0256](decisions/0256-a-pickup-keeps-the-count.md).
They are premium game pieces: each one is a crossing the player commits to under fire, and what the
level authors is what the player gets.

| | a tier buys | tiers | a level authors | the mid-boss drops | the end boss |
|---|---|---|---|---|---|
| **`bomb`** | one charge of the gun special its face shows — bomb, storm or whirlpool | — | none; level one one before its mid-boss | 1 | — |
| **`missile`** | a tube **and** a rate step, max 2 tubes | 4 | 1 a fifth of the way in; level one a second between the fights | — | — |
| **`shield`** | cycles: one hit that never reaches the hull, capped by the tier — 3, or none on Burn — or a charge of the void or the nova on the ward's trigger | — | — | 1; on Burn the `ward` in its place | — |
| **`ward`** | the shield pickup without its shield: a charge of the void or the nova — [0447](decisions/0447-the-ward-is-a-third-trigger.md) | — | — | on Burn only, as the shield | — |

A run starts with two charges of its own gun's special. **The bomb pickup is where the weapon pickup
was, and it cycles the gun specials the way the weapon pickup cycled the guns**
([0441](decisions/0441-a-pilot-flies-their-own-ship.md), on
[0233](decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)'s clock). Any ship can take any face
for one charge of it, so a choice of special is made under fire. A missile pickup taken once its own
ladder is full becomes a charge of that tube's special
([0373](decisions/0373-a-special-is-the-guns-own.md)). That is how *every upgrade is worth taking*
survives a cap.

**The missile pickup cycles over the tubes**, and taking a different tube switches it and keeps the
count ([0256](decisions/0256-a-pickup-keeps-the-count.md)). **Every face of a cycling pickup is its
own glyph in its own ink**, inside the one bubble that says *pickup*:
[0239](decisions/0239-the-guns-answer-the-third-play-test.md) and
[0240](decisions/0240-the-blades-reach-the-boss.md).

⚠️ **A gun has no tiers.** Each is its ship's, at what its old ladder's top rung was. **The ship
wears its gun and its tubes**: each ship is drawn bare, with one tube, and with two.

| gun | whose | what it does |
|---|---|---|
| **pulse** | the fighter | fast, small, four barrels; reaches the edge of the screen and can miss |
| **arc** | the Gilded Estate | chain lightning. From the nose to the nearest body in reach whose whole hull is on the screen, then the next, three links at most, each jump shorter; on a lone boss it jumps around the hull. Cannot miss, cannot reach. Its first jump is 82, zoomed with the view — [0443](decisions/0443-the-arc-is-zoomed-with-the-view.md), [0257](decisions/0257-the-arc-lands-on-the-screen.md) |
| **shuriken** | the Firebird | steel blades, thrown in pairs from the front wheels. Each goes up the lane and swings across it, the two a half-turn apart, so their tracks are the two strands of a helix; they land on everything they cross, once per impact flash, and are not spent by arriving — [0234](decisions/0234-a-blade-circles-the-ship.md), [0244](decisions/0244-a-blade-rides-a-helix.md) |
| **ray** | the Little Green Caddie | four concentric lavender rings, one volley every eight steps, which burst where they land and hurt everything close by — [0442](decisions/0442-the-ray-gun.md) |

| tube | what it does | a tier buys |
|---|---|---|
| **missiles** | fly the lane from the wings; three pulses each | a tube **and** a rate step, max 2 tubes |
| **seekers** | hunt the nearest body on the screen — and only on the screen — from the moment they leave the tube, any direction, for a second and a half and then go out in a puff; two pulses each; in the ally ink — their own pickup face's — so a seeker is never mistaken for a missile, a bolt or the ship — [0235](decisions/0235-a-seeker-hunts-the-nearest-body.md), [0238](decisions/0238-the-picture-answers-the-second-play-test.md), [0241](decisions/0241-the-ship-wears-its-colours.md), [0246](decisions/0246-a-seeker-hunts-on-the-screen.md) | the same |

| special | whose | what it does |
|---|---|---|
| **bomb** | pulse | a large missile fired up the lane; goes off as a filled explosion — a burst, the fire rolling out, the smoke — that lands the larger of its own damage and a twentieth of a boss's full health, once however much of the animal it covers — [0372](decisions/0372-a-death-keeps-the-ladders.md), [0375](decisions/0375-the-bomb-is-a-missile.md). A third of a second between throws keeps explosions under the flash cap |
| **hunt** | seekers | ten seconds of two purple pods on the ship's flanks, each volley firing a seeker of their own beside the fitted tubes: four times the damage, burning twice as long — [0373](decisions/0373-a-special-is-the-guns-own.md), [0379](decisions/0379-the-specials-are-seen.md) |
| **overdrive** | missiles | ten seconds of two golden pods, each volley firing a straight missile of their own beside the fitted tubes: three times the damage, piercing like a blade — [0373](decisions/0373-a-special-is-the-guns-own.md), moved off the gun by [0375](decisions/0375-the-bomb-is-a-missile.md), [0379](decisions/0379-the-specials-are-seen.md) |
| **storm** | arc | thrown like the bomb; goes off as six strikes to the nearest bodies on the screen, each chaining to two more, a twentieth of a boss once, and bolts flickering across the screen for half a second — [0374](decisions/0374-the-storm-and-the-whirlpool.md) |
| **whirlpool** | shuriken | three spiral arms of eight big blades opened ahead of the ship, turning and growing, landing on a boss again and again, and gone once none of it is on the screen — [0374](decisions/0374-the-storm-and-the-whirlpool.md) |
| **nova** | ray, and the shield pickup's third face | on the ward's trigger: a lavender ring bursting from the ship to past every edge of the screen, popping every shot it touches, striking every body it crosses once and a boss once for a twentieth — [0447](decisions/0447-the-ward-is-a-third-trigger.md) |
| **void** | the shield pickup's second face, and a shield at a full shell; one to open a Burn run unless the ship opens on novas | thrown up the lane on the ward's trigger as a turning swirl ([0447](decisions/0447-the-ward-is-a-third-trigger.md)); opens a rift 72 units across for a second and a half that removes every hostile shot, body and boss lightning inside it, carves the Labyrinth stone it covers for the rest of the level, and lands a tenth of a boss once. The ship, the boss and the player's own fire are untouched — [0377](decisions/0377-the-void.md) |

A thrown special that reaches the edge of the screen goes off there
([0377](decisions/0377-the-void.md)). Every special is heard as itself — its press, and for a
thrown one what it sounds like going off, on the root like the bomb
([0378](decisions/0378-the-specials-are-heard.md)). The void is the last change on the same ask —
[`the-arsenal-planned`](../reports/the-arsenal-planned-2026-09-26.md). Still unbuilt
beyond them: multi-tag tracking specials, faster engines, orbiting mines.

⚠️ **There are no extra lives to find, and a run's complement can only go down** — 0082, on the
grounds that a shield is the better version of the same promise: it stops the death. Since
[0372](decisions/0372-a-death-keeps-the-ladders.md) a death costs only the life, so that is ALL a
shield saves now. **This is open rather than settled**, and it is what
[0068](decisions/0068-a-run-over-is-a-continue.md)'s free continue is currently standing in for — and
since [0517](decisions/0517-no-quarters-given.md) the free continue is Freeplay's, so on the default a
run is the tier's lives and nothing else.

⚠️ **A player who just died is flying with everything they had** — 0372. The scatter that handed a
death's ladders back on the field (0066, 0243, 0266) is gone with the cost it answered.

⚠️ **A gun's hit on a boss is weighed by its row, and a boss may author its own weight for a gun** —
0372. The arc is 1.5, because it is the one gun whose fight closing in cannot shorten; the serpent
authors it back at 1, because it was already that animal's quickest gun.

**How to play carries a key** — every pickup, its real sprite turning through its faces, what each
face gives and how it is taken. [0045](decisions/0045-the-player-can-see-what-they-are-carrying.md),
on the title until [0458](decisions/0458-the-title-is-rows.md) moved it behind a tab. The enemies deliberately get no
key: an enemy announces itself by shooting at you, and a pickup announces nothing — **and it does so
as it appears**: a firing body's first volley leaves inside a third of a second of its hull entering
the view, on its own grid slot, so bullets are on the screen for the time a body is and not only
after a full reload — [0259](decisions/0259-the-bullets-stay-on-the-screen.md). Every level is held to
eight seconds without a bullet on the screen and two fifths of its waves' time with one, at the
capped loadout, by the instrument that measured the report.

## Levels, bosses and hazards

Themed on the fourteen *Far Carry* biomes, split into difficulty tiers. Each level gets its own
enemies, upgrade flavour and bosses.

**Difficulty is a tier, chosen before a run and fixed for its length**
([0047](decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md)). *Savior of the
Galaxy* is the tier the game is tuned for, and the other two are **a margin either side of it, axis by
axis**, so a change to Savior moves both —
[0356](decisions/0356-the-tuned-tier-is-savior.md). Within a run, what climbs is the levels' own
scripts.

**A tier also sets the shell** — [0355](decisions/0355-a-tier-opens-on-a-shell.md). On *Legendary
Pilot* every life opens on three shields and every level renews them; on *Savior of the Galaxy* a
life opens on the hull and a shield is flown for, as it always was; on *Let the Galaxy Burn* the ship
carries none, the mid-boss throws the ward pickup where the shield would be, and a run opens with one
void unless its ship opens on novas ([0447](decisions/0447-the-ward-is-a-third-trigger.md)).

⚠️ **The dial is gone** — [0441](decisions/0441-a-pilot-flies-their-own-ship.md). It was a second
axis that moved through a run ([0084](decisions/0084-the-dial-is-the-level-and-the-guns.md)), and the
one thing it spent was level one's one-hit opening. That opening existed because the starting gun was
weak. Every ship now opens on its whole gun, so the opening went, and the dial with it.

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
serpent (Jörmungandr, the Approach), the flying fish (Volans, Ember Nebula), the pterodactyl
(Saurian Belt), the gyre (the Labyrinth — the lattice upgraded), the frost ship (Rime Shelf), the
hydra (Toxic Mire) and the jellyfish with the black heart in it (the Black Heart). Each is a first
iteration; the attacks the game had no word for — flame and frost, whips, beams, summoned hordes,
a spinning wall, a cold that slows, heads that grow, tendrils, a final opening — are each their own
decision. [`the-bosses-asked`](../reports/the-bosses-asked-2026-09-05.md) is the brief. **And each
is drawn as the creature it is named for** — [0264](decisions/0264-the-real-bosses-are-drawn.md):
a body on one spine, a skull with a lit maw, fins and feathers and spires in the outline, and a
skin of its own rather than the uniform of the things its place sends.

**The serpent has its three weapons, and throws them together** —
[0248](decisions/0248-the-serpent-strikes.md), [0261](decisions/0261-the-serpent-throws-together.md):
a fan of acid that rakes across the lane while it is whole; acid and void in turn once hurt; and
at its last third acid, void and lightning in turn — the lightning in columns down the whole lane,
each column a warning line for three quarters of a second before it strikes. A phase says what a
boss throws, since 0248; acid and void are shots in inks of their own.

**The fish whips and summons** — [0249](decisions/0249-the-eagle-summons.md),
[0262](decisions/0262-the-eagle-throws-quills.md): a raking fan of quills — its own bullet, a
feather shaft first — while whole, then a whip of flames thrown along an arc with the tip faster
than the root so it bows as it flies, then volleys that call kites — a new body, Ember Nebula's
horde, sent by no level, that dives for the ship's lane. A boss may send a body as well as a bullet.
**And it spits them** — [0373](decisions/0373-the-fish-spits-its-adds.md): every horde the fish
calls comes out of its open mouth in a fan thrown at the player, kites and a shoal of minnows alike,
and both hunt and fire. **It swims** — [0374](decisions/0374-the-fish-beats-its-tail.md): the
caudal fin is a body of its own behind the hull, beating about the peduncle, and the hull yaws
against it. **And its breach has a body** — [0375](decisions/0375-the-breach-has-a-body.md).
**It has four stages** — [0380](decisions/0380-the-fish-has-four-stages.md): kindled and raking
with kites out of its mouth; ablaze, dumping kites on the volley with the shoal under them; the
breaker rising anywhere along the near edge after a half-second tell, with the field otherwise
empty; and white-hot, leaping out through the edge and back across the screen between whips of
flame. **And it is drawn a fifth bigger, with its tail one animal** —
[0381](decisions/0381-the-fish-is-bigger.md).

**The frost ship chills and shatters** — [0253](decisions/0253-the-frost-ship-chills.md),
[0263](decisions/0263-the-frost-ship-shatters.md): a cold on the hull that slows a ship inside it
and freezes one that stays; a shard of frost that is one bullet from the hull and twelve by the
time it reaches you — two bolts along its heading, each a snowflake of six, each melting; and
shards called in from the sides that shatter into a snowflake where they die. A shot may have a
life after the muzzle, and a body's death may throw.

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

## Score

**A kill is worth its enemy's points times the streak, a boss is worth its own points flat, and a
cleared level pays a bonus for what the ship still holds** —
[0428](decisions/0428-the-score-is-kept.md). **A run pays one Star Shard for every 10,000 points of
its best credit**, once, when it ends — [0522](decisions/0522-the-score-pays-in-shards.md), reversing
0428's *not a currency*. The shards buy looks and nothing a run can feel.

| | |
|---|---|
| **the streak** | kills without a hit, ×1 up to ×8, one step every ten kills. **Any hit ends it, a shield's included.** A level boundary does not |
| **in play** | top right: the run's score, the multiplier and the way to the next step |
| **the break** | the level's points, its rank (S–D, by the share killed and the hits taken), the bonus for each shield, each bomb (the gun's charges) and each missile powerup (the tubes' charges) held, the level's total and the run's |
| **the end** | the victory shows every level's rank, the points, the bonuses and the final score; the run over shows the score, the level reached and where it lands on the table; both ends say the Star Shards paid, and the run over what stopping would pay |
| **the shards** | the best credit's score, one per 10,000, paid at the run's end — victory, game over, the run-over offer running out, or a quit — and never at a continue; the balance is in the hangar, kept with it — [0522](decisions/0522-the-score-pays-in-shards.md) |
| **a continue** | starts the score again: the credit that ran out goes on the table with its score and the level it reached — [0438](decisions/0438-the-score-is-the-credits.md) |
| **the table** | the best ten runs, kept on the device; the best five on the title, standing still — [0429](decisions/0429-the-table-is-kept.md), [0458](decisions/0458-the-title-is-rows.md) |

⚠️ Every number in it is a play number. One has been played: a one-credit clear on *Legendary Pilot*
scored 1,579,750 — 157 shards.

## Save and resume

**The high-score table, the settings and the hangar are what is kept between visits today** —
[0429](decisions/0429-the-table-is-kept.md), [0510](decisions/0510-the-settings-are-kept.md),
[0521](decisions/0521-the-hangar-opens.md); the pilot is picked each visit. The hangar holds which
ships have beaten the jellyfish and how each is fitted out. What follows is the run save, which does not exist yet.

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

- **Nothing that changes a run is for sale.** A currency and a shop exist since
  [0522](decisions/0522-the-score-pays-in-shards.md), and they sell looks: a dash, a dangle, a flame's
  colour. Selling anything the simulation reads — a gun, a life, a charge, a shield — is an argued
  reversal of 0522, not a drift. It was *no shop, no currency, no economy* until then, and no decision
  had argued it: the one sentence behind it was about power found in a level.
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
