# 0666 — Venoma flies the Viper

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 1. An
eighth pilot and an eighth ship, beside [0595](0595-the-aqua-duck-paints.md)'s, locked on a new part of
[0592](0592-the-crashes-are-counted.md)'s lock: tiers finished.

## The ask

> *"Venoma secret ship — unlocked if beat all diffs with any character. Has the serpent boss attacks → acid spray;
> missile turrets are the void blasts from serpent boss + special is red lightning called down from the sky."*

## The rule

**Venoma Krait, the Coil's prodigy and the rival the intro has always chased, flies the Viper: the ship that
blasts out of the port in the intro, flyable. It spits a short, wide spray of venom, its tubes throw the serpent's
void, and its special calls red lightning down from the top of the screen. She opens once every tier has been
finished, in any ship. The story is not told round her: no intro, and the victory screen straight after the last
boss.**

| | |
|---|---|
| **the pilot** | `venoma` on `src/content/golfers.ts`, she/her, from the Coil. A person in 0416's colours: the hood in the Wyrm-Ship's green, the bag in its acid, sleeves to the wrist. `opens.tiers` names every tier — a new part of `PilotLock`, read against `finished` (0608's: a tier is finished by a run that won on it, in any ship), and the band's hint says *"Finish the game on …"* with the tiers still owed |
| **no story** | `story` on every golfer row. Hers is `false`: *Fly* starts the run without the intro (`fly` in `src/app/mount.ts`), the run finished goes to the victory screen and not the finale (`src/state/root.ts`), and she is never the golfer found in the Viper (`rescuable`). She has no lines, since nothing reads them |
| **the ship** | `viper` on `src/content/ships.ts`, side-on in the predecessor's frame as the cars and the duck are (`drawViper`): the port's own drawing of her (`paintViper`) laid in that frame at `VIPER_SCALE` — the snake's-head prow with a lit eye and fangs under the jaw, the canopy, the launcher on its back, the dorsal fin hooked over like a tail, the swept wing. Its body is the player's cyan taken halfway to the acid's lime, a palette mix, where the port's is a fixed dark green |
| **its looks** | `wyrmGreen` (the port's scales along the lateral line), `kraitBands`, `diamondback` and `venomLine`. A shell of shed scales (`scales`, `drawScalePlate`), heard as a hiss over a rattle (`shieldScales`). Its War Dance coils the fin back, then rears the head and throws the fin forward (`viperStrikes`) |
| **the gun** | `acid` on `src/content/weapons.ts`: four spits a volley every six steps, flight `straight`, in a fan of `fan` 0.26 between barrels — twice the pulse's `SPREAD_STEP`, forty-five degrees across the four — that lives `life` 36 steps, seventy-nine units from the jaw, under half the narrowest view — forty was measured at 53% of it. Two optional fields on the row, each with its default in shared code (0282): `fan` (absent: `SPREAD_STEP`) and `life` (absent: no lifetime). Heard as `spit`, its own `cue` (absent: the flight's) |
| **the spit** | `venom` on `src/content/shots.ts`, a pulse and a half a spit, drawn as a bead with its tail behind it (`venomSpit`) in the player's own cyan |
| **the tubes** | `tubeFire: 'venomVoid'` on the Viper's row, optional (absent: the fitted kind's own missile). What is fitted still says how a tube's shot flies, how hard it lands and whether it hunts (`fireMissiles`); the row's shot is how it looks and how big it lands — the serpent's ring (`venomVoid`) in the seeker's lavender |
| **Red Lightning** | `redLightning` on `src/content/specials.ts`, the acid's special, `smite` on its row: eight bolts, one every six steps on the grid, each straight down from the top of the lane onto the body nearest the ship that it has not just struck, on the storm's targeting (`nearestFrom`), for the storm's twelve, and an eightieth of a boss's health a bolt where that is more — a tenth if all eight find it, the void's share (0377). One with nothing to strike falls ahead of the ship on its own stream (`smiteRng`, 0021) and lands on nothing. It holds the throw gap while it falls, as the candle does. Heard as the sky called (`smite`) and a crack for each bolt (`smiteStrike`), the storm's without its after flickers. A link of `SMITE_BOLT_KIND`, stroked in a fifth bolt tone (`BOLT_SMITE`). The bomb pickup offers it once Venoma is open (`opensWith`), with a cloud-and-bolt face (`pickupSmite`) |

## Why it is built the way it is

**The Viper is the port's drawing because it already was the Viper.** The intro has flown her since 0411, and
a player who opens her has watched that ship leave the port at the start of every run. The shapes are the
port's own numbers, laid in the fight's frame; what changed is what the fight asks of a hull: the ink a palette
answers, marks over 0106's floor, and the far wing left out, because that is where the launcher stands.

**No story, because she is the story.** The intro is a pilot chasing the Viper out of the port; the finale finds
a golfer in the Viper's cockpit. Neither has a version where the Viper's pilot is the one flying. Writing one —
Venoma chasing something else, a finale with a different captive — is a new story, which the page did not ask
for. Leaving both out is the smallest change that is not wrong.

**The spray is the serpent's attack, the player's.** The serpent opens on a fan of acid raking the lane (0261).
Turned round, a fan is a gun that covers the lane in front of the nose and reaches nothing past half the
screen: a gun the Viper has to fly close with, which is what makes it a different gun from the pulse rather than
a better one. At the same damage a step as the pulse when all four land.

**Her fire is the player's ink, not the serpent's.** The acid's lime and the void's violet mean *the serpent is
throwing this at you* (0248), and Venoma flies against the serpent. A spit in the acid's ink, in that fight, is
a shot the player must dodge that is their own (0081, `tests/legibility.test.ts`). The spit is the ship's cyan and
the void ring the seeker's lavender. What they keep of the serpent's is the shape: the ring's hole, and a spit
that is told from the serpent's gobbet by its tail.

**Red lightning, and what tells it from the serpent's.** The page asked for red. The serpent's own strike is
stroked in the enemy's red, and it falls from the top of the screen too. Three things tell them apart, in
order:

1. Hers lands on the step it is drawn. The serpent's is a warning line for three quarters of a second first.
2. Hers falls only where the player pressed it, onto what is in front of them.
3. The ink is a scarlet of its own, with a red heart, where the serpent's is the enemy's pink-red with a white
   core.

The first photograph had the palette's inks alone and a white core, and read as a pink-white streak. So the
bolt is mixed half way to a pure red, and its heart is its own glow lifted toward white
(`src/render/bolt-inks.ts`). No palette role is a saturated red; this is the one bolt ink that is not a role.

## Not done

- **The Viper burns the standard flame, not the port's violet.** The port's `#b060c0` is three degrees of hue
  off the serpent's void, and a trail behind the player in the void's colour is 0295's case. Cosmo's Nebula Burn
  is the violet that clears it.
- **She has no runner or portrait of her own drawing.** She is a person, drawn as every golfer is in her colours;
  the hood 0416 gave her runner is on her row.
- **Her lines are empty.** She is never found and never finds anyone; if a story is ever told round her, it
  needs them.

## What guards it

- `tests/venoma.test.ts`:
  - The lock opens on the last tier finished and not before, and the band says which tiers are owed.
  - She is never the one found.
  - Flying her starts no intro, and her run finished goes to the victory screen.
  - The acid fans wider than the pulse and falls short.
  - The tubes throw void rings and keep the fitted kind's hunt and damage.
  - Red Lightning lands on the body nearest the ship from the top of the lane, eight times, holding the throw gap.
- The ship tables' guards walk `SHIP_KINDS` and so take the Viper on the day its row exists: `tests/mounts.test.ts`
  (the row's jaw and tubes are where the bake draws them), `tests/accents.test.ts`, `tests/legibility.test.ts`,
  `tests/gun-layer.test.ts`.

The probes in `scripts/probes/0666-venoma-flies-the-viper.mjs` open her lock early, tell her story, give the acid
the pulse's reach, let the tubes fire missiles, and call the lightning down from the ship.
