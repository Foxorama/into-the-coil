/**
 * The themes: what makes one level a different PLACE from the next.
 *
 * `docs/decisions/0107-a-level-is-a-place.md`.
 *
 * ── WHY THIS EXISTS AND WHY IT IS NOT A SECOND PALETTE ──────────────────────────────────────────
 *
 * Reported from play: *"the same music and boss music repeats level after level after level… the
 * music for the next level needs to be different so it doesn't feel like just one level over and over
 * again"*, and *"I think we're close to the part where we need to introduce the biomes and level
 * themes now to start differentiating levels."* `docs/game.md` has said *"no level is themed yet"*
 * since the levels existed.
 *
 * ⚠️ **A THEME MAY NOT TOUCH AN INK THAT CARRIES MEANING, AND THAT IS THE WHOLE SHAPE OF IT.**
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` makes the palette a SETTING — a player
 * on high contrast must get the same game — so a theme that recoloured `enemy` or `pickup` would be
 * either an accessibility setting the player did not choose or a difficulty change, and 0024 bans
 * both. What a theme changes is the two roles that exist precisely to carry no meaning: the backdrop
 * everything is found against, and nothing else.
 *
 * ⚠️ **So it composes with the palette rather than replacing it**, which is why `space` below is a
 * value per `PaletteName` rather than one colour. `tests/palette.test.ts` drives every ink of every
 * palette against every theme's backdrop, so a theme cannot be authored that makes a bullet hard to
 * see on high contrast.
 *
 * ── AND WHY THE MUSIC HALF IS A MIX AND NOT A SECOND PIECE ──────────────────────────────────────
 *
 * ⚠️ **MEASURED BEFORE IT WAS DESIGNED.** The eleven loops cost **862 ms and 11.3 MB** to bake, of
 * which the pitched layers are 858 ms and 10.2 MB. Seven themes each with their own transposed set is
 * **6 seconds and 72 MB** — which is not a thing to hold in memory on the mid-range Android
 * `docs/decisions/0022-frame-rate-is-a-feature.md` sizes for, and not a thing to synthesise at a
 * level boundary either.
 *
 * ⚠️ **BOTH HALVES OF THAT LAST SENTENCE ARE NOW FALSE, AND IT IS LEFT STANDING BECAUSE THE REASONING
 * IS WRITTEN ONCE** — `docs/decisions/README.md`. The game has had seven per-place compositions since
 * `docs/decisions/0146-three-more-places-and-two-after-them.md`, and
 * `docs/decisions/0133-the-place-is-baked-at-the-boundary.md` synthesises one **at a level boundary**,
 * which is precisely the thing it says is not a thing.
 *
 * ⚠️ **AND THE DEVICE IN IT IS NO LONGER THE ONE BEING SIZED FOR** —
 * `docs/decisions/0153-desktop-is-the-target.md`. The phone is a port that has not started, so a
 * comment citing it as a reason to make something smaller is stale by definition. **The live ceiling
 * is `tests/sound.test.ts`'s 56 MB**, which is a desktop number that says so — and whose own
 * condition for being raised again is the boundary bake rather than a bigger figure, which is an
 * argument this decision does not retire because it was never a phone argument.
 *
 * ⚠️ **What is free is the MIX.** A theme carries a gain multiplier per layer, applied over
 * `MUSIC_LADDER`'s own rung, so each level is a different arrangement of one set of material: the
 * same eleven loops, emphasised differently. Nothing is re-baked, nothing is allocated, and a level
 * that leans on the arp and the hook does not sound like one built on the drone and the groove.
 *
 * ⚠️ **THE NEXT LEVER IS DIFFERENT MATERIAL AND ITS COST IS ALREADY MEASURED**, so a later session
 * does not have to find it again: a second and third `chords` progression is 427 ms and 2.15 MB each
 * at the prewarm, and that buys real melodic variety across seven levels shared three ways. It is not
 * done here because this decision already changes the backdrop, the mix and the aura, and a fourth
 * axis would make a play-test unable to say which of them worked.
 *
 * ── AND THAT LEVER HAS NOW BEEN PULLED, ONCE ────────────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0128-a-place-plays-its-own-material.md`.** A theme may state `voices` for the
 * layers it plays differently and shares every layer it does not, so the cost is proportional to how
 * much of a place is new rather than to how many places there are. **Ember Nebula is the first and it
 * re-voices two of twenty-three.**
 *
 * ⚠️ **The paragraph above priced seven whole transposed sets and was right to refuse them** —
 * [`what-seven-compositions-would-cost`](../../reports/what-seven-compositions-would-cost-2026-08-12.md)
 * put 0113's storage model at 672 MB resident. What it did not price is a diff, which is what this is.
 */

import { CORE_VOICES } from './core.ts';
import { CUES, SCALE, type CueKind, type CueLayer, type CueRow } from './cues.ts';
import { LABYRINTH_VOICES } from './labyrinth.ts';
import { MIRE_VOICES } from './mire.ts';
import {
  LAYER_BARS,
  MUSIC,
  MUSIC_LADDER,
  MUSIC_LAYERS,
  type MusicLayer,
  type MusicLevel,
  type MusicVoice,
} from './music.ts';
import { NEBULA_VOICES } from './nebula.ts';
import type { PaletteName } from './palette.ts';
import { RIME_VOICES } from './rime.ts';
import { SAURIAN_CUES, SAURIAN_VOICES } from './saurian.ts';

/**
 * Every theme, in the order the run meets them. Closed —
 * `docs/decisions/0016-a-hub-enumerates-kinds.md`.
 *
 * ⚠️ **These are places rather than the fourteen *Far Carry* biomes, and that is a deliberate
 * deferral rather than an oversight.** `docs/game.md` themes the levels on the predecessor's biomes;
 * `CLAUDE.md` allows opening the predecessor only for a named file and a named reason, and the reason
 * to open it is the FICTION, which is downstream of whether theming works at all. A biome name drops
 * onto a row here without touching anything else.
 *
 * ── AND FIVE OF THE SEVEN WERE NAMED BY THE PLAYER, WHICH IS WHY THREE OF THEM CHANGED ──────────
 *
 * ⚠️ **`docs/decisions/0146-three-more-places-and-two-after-them.md`.** Asked for, 2026-08-13:
 * *"level 3 will be a space laser dinosaur style biome… level 4 will be a labyrinth style, lost in a
 * maze being hounded and chased… one will be ice, one will be toxic mire hydra boss and the last will
 * be the black hole heart of the galaxy."* Three of the seven rows were holding a name and a hue that
 * the brief contradicts, so `debris` and `forge` are gone, `rime` moves from level four to level five
 * where the ice now is, and `bloom` becomes what its level actually contains.
 *
 * ⚠️ **A theme kind is renamed by the compiler, which is the whole reason this was cheap.** The union
 * is read in exactly two places — this table and `src/content/levels.ts`'s `theme` column — so a name
 * that no longer describes its level fails to build rather than quietly going on being wrong, which
 * is `docs/decisions/0016-a-hub-enumerates-kinds.md` paying for itself.
 */
export const THEME_KINDS = ['approach', 'nebula', 'saurian', 'labyrinth', 'rime', 'mire', 'core'] as const;

/** Derived from the list, so a theme cannot exist in the union and be missing from the table. */
export type ThemeKind = (typeof THEME_KINDS)[number];

/**
 * A place's own shape: which layers it opens at which rung, sparse all the way down.
 *
 * ⚠️ **NAMED so the rig can hold one and thread it** — 0163. An inline type on the field could not be
 * referred to by `levelWrites`'s parameter or by the dashboard's edit map.
 */
export type ThemeLadder = Partial<Record<MusicLevel, Partial<Record<MusicLayer, number>>>>;

export interface ThemeRow {
  /**
   * What the level break calls it — `docs/game.md`'s voice rule: what it is, never why it is good.
   *
   * ⚠️ **On the row rather than in `src/app/chrome.ts`**, for the reason `src/content/styles.ts`
   * gives: a second list of names goes on saying the old thing the day one of them changes.
   */
  title: string;
  /**
   * The backdrop everything is found against, per palette.
   *
   * ⚠️ **PER PALETTE, and that is what keeps 0024 whole.** High contrast is a setting a player chose
   * for a reason; a theme that handed it a purple void would be overriding that choice with a
   * cosmetic one. Each palette states its own version of the place, and
   * `tests/palette.test.ts` holds every ink against every one of them.
   *
   * ⚠️ **It costs nothing at runtime.** `src/render/canvas.ts` holds the clear colour as a field, so
   * a theme change is one property write and no re-bake — which is what makes this affordable at a
   * level boundary that `docs/decisions/0076-a-level-has-an-origin.md` says keeps the scene.
   */
  space: Record<PaletteName, string>;
  /**
   * The colour of the weather hanging in it, per palette.
   *
   * ⚠️ **`docs/decisions/0112-the-sky-has-weather.md`.** Reported: *"needs to be more than streaks and
   * some weird colouration per level. Needs an actual space skyscape with nebulous clouds and such
   * like."* The backdrop above is a flat hue and this is the thing IN it.
   *
   * ⚠️ **PER PALETTE, on exactly `space`'s terms, and 0024 is why.** High contrast is a setting a
   * player chose; a theme that hung a purple cloud in it would be overriding that choice with a
   * cosmetic one. `tests/palette.test.ts` holds every ink against every backdrop, and
   * `tests/budget.test.ts` holds the cloud faint enough that what it sits on is still what everything
   * is found against.
   *
   * ⚠️ **It costs ONE BITMAP at a level boundary rather than a seventh atlas** —
   * `src/render/bake.ts`'s `bakeNebula`, and 0107's own argument about seven transposed pieces of
   * music arriving in the other channel.
   */
  nebula: Record<PaletteName, string>;
  /**
   * The place's second colour: its accent, and what every LIT edge in it is drawn in.
   *
   * ⚠️ **A PLACE HAD ONE COLOUR AND THAT IS WHY IT READ AS ONE** —
   * `docs/decisions/0223-a-place-has-a-palette.md`. Reported: *"the backgrounds are looking good, but
   * they're still a solo colour. saurian is green, nebula is purple. give me vibrant living levels,
   * not static basic backdrops."* Every cloud, crest, rim and wall face came out of `nebula` — one
   * hex — so a place could be thicker or thinner and never **varied**. No amount of structure fixes
   * that, because the structure was the same colour as the gas.
   *
   * ⚠️ **IT IS A DIFFERENT HUE AND NOT A LIGHTER SHADE, WHICH IS THE WHOLE DIFFERENCE.** A tint of the
   * body colour reads as *the same place, brighter*; a neighbouring hue reads as **two things
   * happening at once**, which is what a sky with weather in it looks like.
   * `tests/themes.test.ts` holds the separation as an angle, because *a bit different* is not a claim.
   *
   * ⚠️ **AND IT IS THE EXPENSIVE ONE.** It is brighter than the body by design, and
   * `docs/decisions/0222-the-background-is-not-black.md` measured what brightness in the sky costs:
   * every lit mark in a place is now drawn in this, so the accessibility floor is checked against
   * **this** colour rather than against `nebula`, whichever of the two is louder.
   */
  glow: Record<PaletteName, string>;
  /**
   * The colour of the land, per palette — and `null` for a place that is in space.
   *
   * ⚠️ **THIS FIELD IS WHAT MAKES A PLACE A PLANET, AND IT DECIDES THREE THINGS AT ONCE.**
   * `docs/decisions/0221-a-planet-is-not-a-space.md`. Reported: *"the planets still have the starry
   * space backdrop visible, ground features need be properly have nothing behind them and the sky in
   * the background needs to match the sky."* Three separate faults with one cause — 0220 drew ground
   * into the WEATHER tile, which is drawn behind the star fields, so the ridges were translucent
   * marks with stars shining through them under a sky that was still the void.
   *
   * So a place with land gets:
   *
   *   · **an opaque ground tile, drawn in front of everything else in the sky** — nothing behind it
   *   · **no star fields at all**, because you cannot see stars from under a daytime sky
   *   · **a `space` colour that is a SKY**, since that is now what is above the horizon
   *
   * ⚠️ **ONE FIELD RATHER THAN A FLAG AND A TABLE**, because two would drift. `src/render/bake.ts`'s
   * `GROUND_OF` says what a place's land LOOKS like and this says what colour it is; a place with one
   * and not the other draws a silhouette in nothing or a colour on nothing, and
   * `tests/places.test.ts` holds the two lists equal. It is the same hole 0220's `LANDMARK_OF` opened
   * and the same guard closing it.
   *
   * ⚠️ **AND IT IS DARKER THAN THE SKY ABOVE IT, ALWAYS.** Ground read against a sky is a silhouette
   * — that is what a horizon IS — and it is also what keeps the accessibility floor: the bottom of the
   * screen stays the darkest thing on it, so the inks a player has to find are never harder to see
   * down there than up here.
   */
  ground: Record<PaletteName, string> | null;
  /**
   * How this place mixes the music, as a multiplier over `MUSIC_LADDER`'s own rung.
   *
   * ⚠️ **A MULTIPLIER rather than a ladder, so a theme cannot break the ladder's shape.** 0090's rule
   * is that the ladder only ever opens layers and 0102's is that every rung adds something; a theme
   * that could set gains outright would be able to violate both from a table nobody reads as being
   * about structure. Scaling what the rung already decided keeps the build intact and changes what
   * the build is made of.
   *
   * ⚠️ **Absent means 1**, so a theme states only what it leans on and a reader sees the difference
   * rather than the whole table twice.
   *
   * ⚠️ **Bounded either side by `tests/music.test.ts`** — a multiplier of zero would close a layer the
   * ladder opened, which is 0090's seam arriving through a side door, and one much above 1 would
   * spend the mix's measured headroom.
   *
   * ── AND A THEME CAN NOW SAY SOMETHING ABOUT A BOSS WITHOUT A SECOND TABLE ───────────────────────
   *
   * ⚠️ **`docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`.** Reported: *"how much can we
   * mix it up for the bosses?"* — and the obvious build is a second `bossMix` field, which is a
   * second table to keep in step with this one.
   *
   * ⚠️ **It is not needed, because four layers are now ZERO everywhere except the fight.** `toll`
   * opens at `approach`, and `lead`, `stomp` and the aura only at `boss` — so a multiplier stated
   * against any of them is a statement about the boss and about nothing else, and it costs no field
   * and no guard. Every theme below states at least one, which is what stops seven bosses sharing an
   * arrangement the way they share a behaviour.
   */
  mix: Partial<Record<MusicLayer, number>>;
  /**
   * The rungs this place opens DIFFERENTLY, as a replacement for the shared ladder's own number.
   *
   * ── WHY `mix` COULD NOT DO THIS, AND WHY THE REASON IT COULD NOT HAS EXPIRED ────────────────────
   *
   * ⚠️ **`docs/decisions/0162-a-place-has-its-own-ladder.md`.** `mix` above is a MULTIPLIER, and its
   * own doc says why: *"a theme cannot break the ladder's shape. 0090's rule is that the ladder only
   * ever opens layers and 0102's is that every rung adds something."* **Both of those rules are
   * gone** — `docs/decisions/0120-a-rung-may-close-a-layer.md` retired the first and
   * `docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md` the second — so the thing a
   * multiplier was protecting no longer exists.
   *
   * ⚠️ **AND A MULTIPLIER CANNOT OPEN WHAT THE LADDER CLOSED, WHICH IS THE DEFECT.** `MUSIC_LADDER`'s
   * `run` row has `arp`, `ride`, `hook`, `drive`, `counter` and `lead` all at **zero**, and any
   * multiple of zero is zero. So *every* place opens a level with the same six fast layers shut,
   * whatever it says in `mix` and whatever it re-voices. Reported against exactly that:
   * *"still slow and melodic… more appropriate for a cthulhu-ian investigative game"*, and *"the run
   * feels almost exactly the same"* — a literal description of one shared row that no amount of
   * per-place writing could reach.
   *
   * ⚠️ **ABSENT MEANS THE SHARED LADDER, AND SPARSE ALL THE WAY DOWN.** A place states the rungs it
   * differs on, and inside a rung only the layers it differs on — so a reader sees the difference
   * rather than the table twice, exactly as `mix` and `voices` already work.
   *
   * ⚠️ **`mix` STILL APPLIES OVER THE TOP, AND THE TWO MEAN DIFFERENT THINGS.** This is the place's
   * own SHAPE — which layers are open at which rung, and how far. `mix` is its BALANCE —
   * `docs/decisions/0147-a-place-is-a-balance.md`. A place may state both, and the second multiplies
   * the first.
   *
   * ⚠️ **NOTHING HERE IS GUARDED FOR SHAPE, ON 0161's TERMS.** What is held is that a stated layer
   * and rung exist and that a value is inside the range the desk can express. Whether a place climbs,
   * holds, or drops away is an authoring judgement, and a guard over it would be the thing 0161 was
   * written to remove arriving one table over.
   */
  ladder?: ThemeLadder;
  /**
   * The layers this place plays DIFFERENTLY, as a replacement for their voices.
   *
   * ── A THEME MAY REPLACE MATERIAL, AND ONLY WHAT IT REPLACES IS BAKED ────────────────────────────
   *
   * ⚠️ **`docs/decisions/0128-a-place-plays-its-own-material.md`.**
   * [0113](0113-there-is-one-composition-and-seven-levels.md) says a theme is a composition and
   * [`what-seven-compositions-would-cost`](../../reports/what-seven-compositions-would-cost-2026-08-12.md)
   * priced its storage model at **672 MB resident** and ruled it out. What that report did not price
   * is the shape below: a theme states the layers it changes and shares every other one, so the cost
   * is proportional to how much of a place is actually new rather than to how many places there are.
   *
   * ⚠️ **Absent means the base composition, and a theme that states nothing has no music of its own**
   * — which is exactly 0113's floor, written as a type rather than as a sentence.
   *
   * ⚠️ **IT REPLACES A LAYER'S WHOLE VOICE ARRAY AND NOT ONE VOICE OF IT.** Indexing into an array by
   * position would make a theme depend on the ORDER of the base's voices, so re-ordering
   * `src/content/music.ts` would silently re-point every override — the class of coupling
   * `docs/decisions/0016-a-hub-enumerates-kinds.md` exists to refuse. A theme may also state FEWER
   * voices than the base, which is how a place gets sparser.
   *
   * ⚠️ **The mix above still applies over the top**, so a place can lean on a layer it has also
   * re-voiced. The two are independent and both are multipliers over the same rung.
   */
  voices?: Partial<Record<MusicLayer, readonly MusicVoice[]>>;
  /**
   * The cues this place sounds DIFFERENTLY, as a replacement for their layers.
   *
   * ⚠️ **`docs/decisions/0190-a-place-owns-what-it-kills.md`**, and it is `voices` one channel over
   * on purpose — same shape, same fallback, same *a place states what it differs on and nothing
   * else*. A cue this table does not name is the base composition's, byte for byte.
   *
   * ⚠️ **`layers` AND NOT A WHOLE `CueRow`.** What a place owns is the SOUND; `twin`, `hold`,
   * `duck`, `figure`, `air`, `gain` and `glue` are what the cue is for and how it behaves, and
   * every one of them is read somewhere this table cannot reach — the hot path, the accessibility
   * tier, the grid. `PLACE_CUES` in `src/content/cues.ts` has the argument.
   *
   * ⚠️ **AND ONLY `PLACE_CUES` MAY APPEAR HERE** — `tests/themes.test.ts` refuses the rest. The
   * player's gun sounding different per biome is a design statement nobody has made.
   */
  cues?: Partial<Record<CueKind, readonly CueLayer[]>>;
  /**
   * How loud this place sits against the other six. One number over everything it plays.
   *
   * ── THE ONE THING A PLACE COULD NOT SAY, AND IT COST A UNIFORM EDIT OF TWENTY-FOUR NUMBERS ──────
   *
   * ⚠️ **`docs/decisions/0191-a-place-sits-somewhere.md`.** Saurian Belt's driven mix runs the bus
   * into the shaper's clamp on **0.13%** of samples at `surge` against a guard of 0.05%, and the fix
   * that costs nothing musically is **the whole place 1.4 dB down**: every ratio the player drove is
   * preserved exactly and the only thing that changes is where the place sits.
   *
   * ⚠️ **AND THERE WAS NO WAY TO WRITE THAT.** `mix` is per LAYER, so a uniform trim meant scaling
   * every entry — twenty existing ones plus four layers that had none, because a layer this place had
   * never sounded has no multiplier to scale. Twenty-four numbers, none of them legible afterwards:
   * a reader sees `groove: 1.87` and cannot tell it is 2.2 with a trim on it, which is exactly the
   * illegibility `docs/decisions/0182-a-mix-number-has-no-band.md` deleted a clamp for causing.
   *
   * ⚠️ **IT IS NOT A CEILING AND NOTHING IS CLAMPED TO IT** — 0182 again. What bounds the product is
   * still the bus, and the clip guard still drives the real shaper at every place and every rung.
   * This is a hand saying *this place is loud*, in the one place that sentence belongs.
   */
  trim?: number;
  /**
   * How much room this place has, per layer. `0` is none and `1` is a cathedral.
   *
   * ── SPACE IS NOT SUSTAIN, AND THIS PROJECT HAD ONLY EVER HAD SUSTAIN ────────────────────────────
   *
   * ⚠️ **`docs/decisions/0136-the-place-has-a-room-and-an-arc.md`.** Reported: *"it still needs more
   * reverb… the sky background is going to be the Eagle Nebula and the Pillars of Creation, so the
   * music track needs to be suitably awe inspiring to match."* Every lever reached for before this
   * was a longer note, a slower attack or a lower decay — and a held note is a held note. What says
   * *large room* is the same note arriving again, later, darker.
   *
   * ⚠️ **PER LAYER, because a room is not a master effect here.** The drums want a short room or the
   * pulse turns to mud, and the choir wants a long one; a single wet control over the bus would make
   * the one that matters most impossible. It is also why this is a number and not a shape — the
   * shape is a constant in `src/app/music.ts` and only *how much* is content.
   *
   * ⚠️ **Absent is dry**, so the base composition and the five places that state nothing are
   * byte-identical to what they were, and `tests/themes.test.ts` asserts that rather than assuming
   * it.
   *
   * ⚠️ **It is baked into the loop and costs nothing at runtime** — three passes of a multiply-add
   * over a finished buffer, about eleven milliseconds for a sixteen-bar layer. What it costs is at
   * the BOUNDARY (0133), which is where a place's whole bake is already spent.
   */
  air?: Partial<Record<MusicLayer, number>>;
  /**
   * The notes this place may sound, as pitch classes over the root. Absent is `SCALE`.
   *
   * ── SEVEN PLACES SOUNDED ALIKE AND SIX OF THEM WERE PLAYING THE IDENTICAL SEVEN NOTES ───────────
   *
   * ⚠️ **`docs/decisions/0148-a-place-has-its-own-notes.md`.** Reported 2026-08-14, having played all
   * five of 0146's places after 0147 rebalanced them: *"level 3 currently reads as a copy of level 2
   * with some slight variation… the level melodies are copies of the earlier ones and aren't their
   * own unique themes and styles."*
   *
   * ⚠️ **THE MELODIES WERE NOT COPIES AND THE MEASUREMENT SAYS WHAT WAS.** `scripts/weigh-notes.mjs`
   * printed **two distinct pitch-class sets across seven places** — the six authored ones all
   * sounding A B C D E F G, and the base composition, which nobody wrote as a place, the only one
   * with any chromatic colour at all. A place could choose its rhythm, its balance and its timbre and
   * could not choose a note.
   *
   * ⚠️ **THE GUARD THAT DID IT WAS WIDER THAN ITS OWN REASON.** `tests/themes.test.ts` required every
   * re-voiced note to be a tone of A natural minor *"or the place is simply wrong over its own bed"*,
   * and against the cues *"a place in another key would put the player's own gun out of tune."* Both
   * are arguments for keeping the TONIC. Neither is an argument for banning the other five notes —
   * and `src/content/music.ts` breaks the ban **ninety-three times**, with a G# in `chords`, `groove`
   * and `arp` and a b2 and a tritone through the whole fight, over the same cues, since before the
   * guard existed. **The rule the base composition is exempt from is the rule that flattened every
   * place written after it.**
   *
   * ⚠️ **SO WHAT IS GUARDED IS THE ROOT AND NOT THE SCALE.** A place still states its notes and is
   * still held to them, because a typo is what the original guard was genuinely catching; what it may
   * now state is a mode of its own. `docs/decisions/0099-the-cues-are-in-the-key.md` is untouched —
   * the cues are still in A, every place is still rooted on A, and nothing here transposes.
   */
  scale?: readonly number[];
  /**
   * How far the LEVEL's own build may open this place's aura, before a boss is anywhere near.
   *
   * ⚠️ **REQUIRED, BECAUSE THE ALTERNATIVE IS THE WALL WEARING A DEFAULT** — 0183. This was
   `AURA_LEVEL_CEILING` in `src/content/music.ts`, one number for all seven places, and a field with
   * a fallback would be the same number reached a longer way round. Every place states its own, and
   `tests/themes.test.ts` holds that they are not all the same.
   *
   * ⚠️ **1 IS LEGAL AND IS A REAL CHOICE**: the dread arrives with the level rather than with the
   * boss, and the fight's proximity has nothing left to add — which is
   `scripts/probes/0091-aura.mjs`'s break, and is now a thing a place may be rather than a defect.
   */
  aura: number;
}

/*
  ── THERE IS NO BAND ON WHAT A PLACE MAY STATE, AND THERE WAS ONE FOR SIX WEEKS ──────────────────

  ⚠️ **`docs/decisions/0182-a-mix-number-has-no-band.md`.** `MIX_FLOOR` was 0.22, `MIX_CEILING` was
  2.6, and `mixOf` clamped to them WITHOUT SAYING SO. Reported: *"the music is restricted and has
  been for ages with gains, sound limits and all sorts of what seem like artificial restrictions."*

  ⚠️ **THE HEADER THAT USED TO SIT HERE HAD ALREADY RECORDED THE DEFECT AND KEPT THE WALL.**
  `src/content/arrangement.ts` says it in one line — *"the rule set forbade its own answer… `arp`
  reads exactly 2.60 in two places because somebody drove it into the wall and the wall said
  nothing."* Three entries were still sitting on it the day it came off.

  ⚠️ **AND EVERY REASON IT GAVE IS NOW HELD BY SOMETHING THAT MEASURES A LISTENER.** The ceiling said
  *the mix's headroom cannot pay for more*; the clip guard drives every place at every rung through
  the real shaper and says so directly. The floor said *a theme must not silence a layer the rung
  opened*; `docs/decisions/0162-a-place-has-its-own-ladder.md` made closing a layer a thing a place
  states outright, so the floor was guarding a second spelling of a legal sentence.
*/


/**
 * Every theme. One per level, in order.
 *
 * ⚠️ **The backdrops are a HAND, on `docs/decisions/0037-the-ship-has-mass.md`'s terms**, and the one
 * thing they are not free to be is bright: every one of them is a near-black, because
 * `src/content/palette.ts` says the void is the thing eight other inks have to be legible against and
 * `tests/palette.test.ts` holds that as a contrast floor per ink per palette. What a theme moves is
 * the HUE of the dark, which is enough to say *somewhere else* and cannot cost a bullet its edge.
 */
/*
  ── FOURTEEN OF THE LADDER ENTRIES BELOW ARE 0187's, AND THEY ARE ALL `sub` OR `engine` ─────────────

  ⚠️ **`docs/decisions/0187-the-kick-is-the-pulse.md`.** `ARRANGEMENT` moved the kick and the kit out
  of the bed and into the pulse, and 0164's floor then refused the mix until it delivered — fourteen
  lifts across five places, computed from the deficit rather than guessed, converged in one pass.

  ⚠️ **THEY ARE PER RUNG BECAUSE THE PROBLEM IS**: `run` and `push` were already inside the new role
  everywhere, and every failure was at `surge` and above, where the layers pile up. A place-wide
  `mix` lift would have raised the kick in the two rungs that did not need it —
  `docs/decisions/0162-a-place-has-its-own-ladder.md`'s lever, for the third decision running.
*/
export const THEMES: Record<ThemeKind, ThemeRow> = {
  /**
   * Level one. The void as it has always been — this is the theme that changes nothing, so that the
   * six below are read against something rather than against each other.
   */
  approach: {
    title: 'The Approach',
    space: { vivid: '#0b0b14', 'high-contrast': '#000000' },
    nebula: { vivid: '#2b3352', 'high-contrast': '#1c1c28' },
    // ⚠️ A COLD BLUE BODY AND A WARM TEAL EDGE. The Approach is the baseline every other place
    // deviates from, so it takes the narrowest hue step of the seven — enough that a rim is not the
    // cloud it sits on, and not enough to say anything about the place.
    glow: { vivid: '#3f7a86', 'high-contrast': '#243c42' },
    // In space. Its one horizon arc is a limb of the world being LEFT, seen from off it — 0211.
    ground: null,
    // The reference, and the number every place used to be — 0183. Level one changes nothing.
    aura: 0.55,
    mix: {
      call: 1.6,
      hook: 1.9,
      arp: 1.85,
      ride: 2.05,
      crash: 1.85,
      lead: 1.4,
      counter: 1.45,
      frenzy: 1.85,
      wraith: 1.8,
      toll: 1.3,
      sub: 0.72,
      engine: 0.82,
      stomp: 0.78,
      drive: 0.9,
      groove: 1.65,
      perc: 0.9,
    },
  },
  /**
   * Level two. A cathedral in a furnace: a choir, an organ, and what the fire does to both.
   *
   * ⚠️ **THE FIRST PLACE THAT IS ANOTHER PIECE RATHER THAN ANOTHER ARRANGEMENT** —
   * `docs/decisions/0132-a-place-may-be-another-piece-entirely.md`. It states twenty-one of the
   * twenty-three layers, its own sixteen-bar progression and its own tune;
   * `src/content/nebula.ts` is the composition and has the argument.
   *
   * ⚠️ **The mix leans on the choir and holds the drums back**, which is the half a multiplier can do
   * and the material cannot: `engine` is a tam-tam and a breath here, and the ladder still opens it
   * at the same rung with the same shape.
   */
  nebula: {
    title: 'Ember Nebula',
    space: { vivid: '#140b16', 'high-contrast': '#050008' },
    nebula: { vivid: '#5c2a4a', 'high-contrast': '#2a1626' },
    // ⚠️ MAROON GAS AND AN EMBER EDGE, WHICH IS THE PLACE'S OWN NAME. The widest step of the seven:
    // a furnace is the one place where two colours at once is the literal subject.
    glow: { vivid: '#c25a2a', 'high-contrast': '#5c2a12' },
    ground: null, // In space, and the Pillars are the proof: they are a thing you fly PAST.
    /*
      ⚠️ **HIGHER THAN THE REFERENCE, BECAUSE THE PLACE IS A BUILD.** A cathedral in a furnace
      escalates to organ and pumping beats and hands over to a Dante's-inferno fight; the dread
      belongs in the escalation rather than only in the arrival.
    */
    aura: 0.6,
    /*
      ⚠️ **THE MIX LEANS ON THE FLOOR NOW AND IT USED TO LEAN ON THE CHOIR** — 0134. Reported: *"it's
      very high on the treble with no deep bassy times."* Measured, the place ran **28.6% of its
      energy under 300 Hz at `surge` against level one's 40.0%**, and the fix is two-sided: the
      material grew a running pedal, and this table stopped pushing the organ's top rank over it.

      ⚠️ **`groove` is high on purpose.** It is the undercurrent, it is centred, and a place whose
      whole complaint was the bottom is the place that should be spending its authority there. **It
      used to read *at the ceiling*, and 0182 took the ceiling away** — 2.6 is now a number somebody
      chose rather than the largest one they were allowed to write.
    */
    mix: {
      chords: 2.3,
      call: 1.9,
      hook: 2.55,
      arp: 2.6,
      counter: 1.85,
      toll: 1.6,
      crash: 2.1,
      ride: 2.1,
      wraith: 2.5,
      frenzy: 2.5,
      lead: 1.4,
      dread: 1.2,
      drone: 1.3,
      sub: 0.8,
      engine: 0.55,
      stomp: 1.15,
      drive: 0.78,
      perc: 0.45,
      groove: 0.9,
    },
    voices: NEBULA_VOICES,
    /*
      ⚠️ **THERE IS NO KIT IN A CATHEDRAL, AND FOR ITS WHOLE LIFE THIS PLACE HAD ONE** —
      `docs/decisions/0172-a-place-opens-with-its-own-four.md`. The shared ladder's `run` row is the
      same seven layers in all seven places, and `mix` is a MULTIPLIER, so *"a choir, an organ, and
      what the fire does to both"* opened over a drum kit and a bassline like everything else.

      ⚠️ **`perc` IS CLOSED AND `groove` IS HALVED, so the choir is what the level opens with.**
      What arrives afterwards is the floor, which is the arc this place's own header describes:
      the cathedral first, the furnace under it.
    */
    ladder: {
      run: { perc: 0, groove: 0.7, chords: 1, call: 0.72, arp: 0.5 },
      push: { perc: 0.42, groove: 1.02, chords: 0.98, call: 0.74, arp: 0.72 },
      surge: { perc: 0.6, chords: 0.94, hook: 0.82 },
      boss: { sub: 1.293 },
      bossPeak: { sub: 1.331 },
    },
    /*
      ⚠️ **THE ROOM IS THE PLACE, AND THE BOSS IS WHERE IT STOPS** — 0136. Asked for: *"more reverb…
      suitably awe inspiring to match the Pillars of Creation"*, and then *"the boss needs to drop
      from the high octaves down into the lower tones of hellfire and menace."*

      ⚠️ **So the drop is a drop in SPACE as well as in register.** The choir sings in a cathedral and
      the fire is two feet from your face: `stomp` has no room at all and `frenzy` has almost none,
      which makes the boss's arrival a change of *place* and not only of notes. Nothing else in this
      game can say *close* — there has never been a reverb to take away.

      ⚠️ **The floor stays dry whatever the ceiling does.** `groove`, `sub` and `engine` carry the
      pulse and the bottom; a wet bass is mud and a wet kick is a kick you cannot hear the front of.
      A room per layer rather than over the bus is exactly what buys that.
    */
    air: {
      chords: 0.95,
      crash: 0.9,
      toll: 0.9,
      call: 0.85,
      lead: 0.8,
      drone: 0.75,
      counter: 0.7,
      hook: 0.6,
      ride: 0.6,
      dread: 0.6,
      arp: 0.5,
      perc: 0.38,
      auraSlow: 0.32,
      wraith: 0.24,
      groove: 0.18,
      engine: 0.15,
      auraFast: 0.15,
      frenzy: 0.1,
      sub: 0.08,
    },
  },
  /**
   * Level three. A hot-blooded place: bone flutes over a hi-NRG floor, and a thing the size of a
   * building at the end of it.
   *
   * ⚠️ **THE SECOND PLACE THAT IS ANOTHER PIECE RATHER THAN ANOTHER ARRANGEMENT** —
   * `docs/decisions/0146-three-more-places-and-two-after-them.md`. `src/content/saurian.ts` is the
   * composition and has the argument; what is here is the hue and the balance.
   *
   * ⚠️ **The mix leans on the BOTTOM AND THE TOP AND HOLLOWS THE MIDDLE**, which is what a floor
   * sounds like and is the half a multiplier can do that the material cannot: the octave bass and the
   * offbeat sub come up, the hats come up, and the pad that would otherwise fill the space between
   * them gives way.
   */
  saurian: {
    title: 'Saurian Belt',
    /*
      ⚠️ **A SKY, AND IT IS THE BLUEST ONE THE FLOOR ALLOWS.** Asked for: *"saurian needs blue
      skies."* `space` is the colour every ink's contrast is measured against
      (`tests/sky.test.ts`, `docs/decisions/0198-the-accessibility-pass-comes-after-the-game.md`), so
      *blue sky* and *daylight* are two different asks and only the first one is available: measured,
      `enemy` sits at **6.09:1** on the old near-black and at **4.07:1** on this, against a floor of
      3. A daylight blue takes it under. **This is a dark game by construction** — 0024, *there is one
      game and it is the loud one* — and what a night-blue buys is that the place stops being the
      void, which is what was actually reported.
    */
    space: { vivid: '#16305a', 'high-contrast': '#050b16' },
    // Cloud in a sky rather than gas in a void: warmer and lighter than the blue it hangs in.
    nebula: { vivid: '#5a6478', 'high-contrast': '#2a2e34' },
    // ⚠️ THE ONE THE REPORT NAMED: *"saurian is green"*. Olive dust under a blue sky, with a warm
    // sunlit edge on every crest and rock — so the place is a blue sky, an olive haze and a gold rim
    // rather than one green.
    glow: { vivid: '#a87c2e', 'high-contrast': '#4a3a18' },
    // Rock in shadow, well under its own sky — a horizon is a silhouette or it is not a horizon.
    ground: { vivid: '#0a1220', 'high-contrast': '#000208' },
    /*
      ⚠️ **LOWER, BECAUSE A DANCEFLOOR DOES NOT DO SLOW DREAD.** The place is a run; what it wants is
      for the fight to be the arrival, not for a shadow to lengthen across the whole level.
    */
    aura: 0.45,
    /*
      ⚠️ **1.4 dB DOWN, AND IT IS THE WHOLE PLACE** — 0191. Driven on the desk, this level's mix
      clamped **0.13%** of samples at `surge` against a guard of 0.05% — the base composition's kit
      and bass are open here at 1.62 where the title screen plays them at 0.5, over a floor that
      already has its own kick. **The ratios are the player's and are untouched**; what moved is where
      the place sits, which is the one change that costs nothing musically.
    */
    trim: 0.85,
    mix: {
      groove: 2.2,
      /*
        ⚠️ **2.2 → 0.4, AND IT IS THE ONE `mix` NUMBER 0189 MOVES** —
        `docs/decisions/0189-a-place-is-what-it-does-not-play.md`. This was **8.43×** after the
        re-base, the largest multiplier in the game, and it was that large for one reason: `ride` was
        what this place FOLLOWED at `push` (`LEADS`), so 0164's role floor demanded the loudest hat
        in any level. The desk closed it to a whisper and gave `push` to `arp`; a lead's multiplier
        left on a layer that is no longer the lead is a number with no argument behind it.

        ⚠️ **IN `mix` RATHER THAN IN THE LADDER, WHICH IS 0185's REASONING RUNNING THE OTHER WAY.**
        That decision put its lifts in the ladder because `mix` is one number for the whole place and
        lifting `drive` for `surge` cost the boss. This is the case that argument does not cover:
        the change is wanted at **every** rung, and expressing it in the ladder means five entries of
        0.076 — a value no reader can weigh against the 1.6s around it.
      */
      ride: 0.4,
      arp: 2.55,
      hook: 2.45,
      drive: 1.3,
      frenzy: 2.55,
      wraith: 2.1,
      crash: 1.6,
      counter: 1.6,
      lead: 1.3,
      auraFast: 1.4,
      sub: 0.62,
      chords: 1.15,
      drone: 0.72,
      call: 1.5,
      engine: 0.95,
      stomp: 0.6,
      toll: 0.68,
      perc: 1.1,
      dread: 0.8,
    },
    voices: SAURIAN_VOICES,
    /*
      ⚠️ **THE FIRST PLACE IN THE GAME WITH ITS OWN CUES** — 0190. A bone snap and a throat where the
      base has a spark and a box, and a spit where it has a laser. `src/content/saurian.ts` has what
      they are and why the other twelve are left alone.
    */
    cues: SAURIAN_CUES,
    /*
      ⚠️ **A FLOOR OPENS WITH HATS AND WITHOUT A PAD, AND THE SHARED LADDER HAS IT THE OTHER WAY UP** —
      `docs/decisions/0172-a-place-opens-with-its-own-four.md`. `MUSIC_LADDER.run` closes `ride` and
      opens `chords`; *"the floor arrives… full hands-in-the-air"* is exactly the opposite pair, and
      no multiplier could say it because any multiple of zero is zero.

      ⚠️ **THIS IS 0162's HEADLINE CASE.** `ride` at `run` is a layer the shared ladder does not open
      at all, in the one place whose brief is a dancefloor.
    */
    ladder: {
      run: { drone: 0, chords: 0, call: 0, groove: 0, bass: 1.62, beat: 1.62, ride: 0.42, sub: 1.13, engine: 1.68, perc: 2.21, drive: 1.25 },
      push: { drone: 0, chords: 0, call: 0, lead: 0, groove: 0, bass: 1.62, beat: 1.62, ride: 0.42, sub: 1.13, engine: 1.68, perc: 2.21, drive: 1.25, arp: 0.832, hook: 0.105, crash: 0.62 },
      surge: { drone: 0, chords: 0, lead: 0, counter: 0, groove: 0, bass: 1.62, beat: 1.62, ride: 0.42, sub: 1.13, engine: 1.68, perc: 2.21, drive: 1.25, arp: 0.832, hook: 0.954, ownA: 1 },
      approach: { drone: 0, chords: 0, lead: 0, counter: 0, groove: 0, bass: 1.62, beat: 1.62, ride: 0.42, sub: 1.13, engine: 1.68, perc: 2.21, drive: 1.25, ownA: 1, arp: 0.9, toll: 1.6, dread: 1.7 },
      boss: { drone: 0, bass: 1.62, beat: 1.62, ride: 0.42, sub: 1.5, engine: 1.68, perc: 2.21, drive: 1.25, toll: 1.35, dread: 1.6, frenzy: 1.1, wraith: 1.2, stomp: 0.95 },
      bossPeak: { drone: 0, bass: 1.62, beat: 1.62, ride: 0.42, sub: 1.6, engine: 1.68, perc: 2.21, drive: 1.25, toll: 1.35, dread: 1.85, frenzy: 1.2, wraith: 1.3, stomp: 1 },
    },
    /*
      ── THE THREE RUNGS ABOVE `surge` ARE 0185's, AND THEY ARE THE JURASSIC HALF ───────────────────

      ⚠️ **`docs/decisions/0185-the-belt-gets-its-bottom.md`.** The brief is *a mix up of modern
      eurobeat and older style jurassic inspired music*, and the measurement said the ancient half was
      not in the mix: `toll` nearly ten decibels under its role at `approach`, `dread` nine, and
      `drive` — the eurobeat lead — six under at `surge`. **Five of Saurian Belt's six known-adrift
      entries were the two halves of its own brief.**

      ⚠️ **IN THE LADDER AND NOT IN `mix`, WHICH IS THE POINT.** `mix` is one number per layer for the
      whole place, so lifting `drive` for `surge` would lift it in the fight as well and take the
      arrival off something else — measured, and it did: at `mix.drive` 1.7 the boss lost `frenzy`
      and `wraith`. A rung-shaped problem takes 0162's rung-shaped lever, and
      `docs/decisions/0176-the-re-based-mix-is-the-mix.md`'s approved balance is left alone.

      ⚠️ **AND THE KIT IS NOT THINNED AT `approach`, BECAUSE 0167 REFUSES IT.** The obvious eurobeat
      move is the breakdown before the drop, and the first version of this dropped `engine` to 0.9
      there. `docs/decisions/0167-a-build-does-not-duck.md` failed it on the spot: **a boundary only
      ever adds**, and a carried layer getting quieter is a duck whatever it is in aid of. What
      replaces it is the bell and the dread coming UP to meet the kit, which is the same intent and
      the only version the arrangement permits.

      ⚠️ **`drone` AT `bossPeak` IS THE ONE ENTRY THAT IS BOOKKEEPING RATHER THAN MUSIC.** Lifting
      `dread` to 2.4 put `drone` — the `air` role, and *meant* to sit under everything — 5.3 dB past
      0164's floor; 1.25 puts it back. It is the cost of the layer above it moving, named rather than
      absorbed.
    */
    /*
      ⚠️ **THE NATURAL MINOR PLUS A RAISED SEVENTH, WHICH IS THE ONLY MODE IN THE GAME THAT IS NOT
      THE NATURAL MINOR** — `docs/decisions/0148-a-place-has-its-own-notes.md`. G# is the third of the
      E major this place cadences onto four times in sixteen bars, and E major over an A minor key is
      the entire harmonic signature of eurobeat. Without it the progression is a reshuffle of the same
      six triads every other place is a reshuffle of, which is what was reported.

      ⚠️ **BOTH SEVENTHS, AND NOT THE SHARP ONE INSTEAD.** `FLUTE` sings the natural G and the floor
      plays the sharp one; a harmonic minor that dropped the G would take the ancient half of the
      brief away to buy the machine half, which is the compromise `src/content/saurian.ts` opens by
      refusing.
    */
    scale: [0, 2, 3, 5, 7, 8, 10, 11],
    /*
      ⚠️ **A CLUB HAS A ROOM AND A JUNGLE DOES NOT, SO THE SPLIT IS BY REGISTER.** Everything that
      carries the floor is bone dry — a wet kick is a kick you cannot hear the front of, and a wet
      sixteenth bass is mud. What gets the room is the material that is supposed to be coming from
      somewhere else: the flute, the horn, the swell and the pad behind them.
    */
    air: {
      crash: 0.62,
      toll: 0.58,
      call: 0.52,
      drone: 0.5,
      lead: 0.45,
      chords: 0.4,
      dread: 0.4,
      counter: 0.34,
      auraSlow: 0.34,
      hook: 0.3,
      ride: 0.24,
      arp: 0.24,
      wraith: 0.2,
      perc: 0.14,
      auraFast: 0.12,
      drive: 0.1,
      engine: 0.08,
      frenzy: 0.08,
      groove: 0.06,
      sub: 0.05,
      stomp: 0.05,
    },
  },
  /**
   * Level four. A corridor: a tune that comes back, and something one phrase behind it.
   *
   * ⚠️ **`src/content/labyrinth.ts` is the composition** and the two ideas in it are structural
   * rather than timbral — an accent that limps and a canon that follows. What is here is the hue, the
   * balance, and the one thing a table can say that a pattern cannot: how much room each layer is in.
   */
  labyrinth: {
    title: 'The Labyrinth',
    space: { vivid: '#0e0a14', 'high-contrast': '#030006' },
    nebula: { vivid: '#3a2a52', 'high-contrast': '#1d1428' },
    // ⚠️ VIOLET STONE AND A COLD CYAN LIGHT IN THE CORRIDOR. The lit edges here are the walls' inner
    // faces, so the accent is literally the lighting of the passage the player flies down.
    glow: { vivid: '#b45ac0', 'high-contrast': '#4a1440' },
    ground: null, // A corridor in space. It has walls, and a wall is not a horizon.
    /*
      ⚠️ **THE HIGHEST BUT ONE, AND THE FICTION IS THE ARGUMENT.** A labyrinth is the place where the
      thing hunting you is already there; the aura is what says so long before it is on the field.
    */
    aura: 0.6,
    /*
      ⚠️ **THE MIX LEANS ON THE THINGS A BODY MAKES.** The breath, the footfall and the heartbeat are
      the picture; the pad is the wall they happen against and is deliberately the quietest thing
      here, which is the opposite of every other place in the game.
    */
    mix: {
      call: 1.85,
      counter: 2.4,
      perc: 2.35,
      engine: 1.8,
      toll: 1.15,
      ride: 1.85,
      arp: 1.95,
      hook: 1.9,
      wraith: 2,
      frenzy: 2.05,
      crash: 1.8,
      dread: 1.4,
      lead: 1.3,
      auraFast: 1.35,
      sub: 0.5,
      groove: 0.72,
      drive: 0.6,
      stomp: 0.62,
      chords: 0.72,
      drone: 0.7,
    },
    voices: LABYRINTH_VOICES,
    /*
      ⚠️ **A CORRIDOR IS WHAT IS NOT IN IT** — `docs/decisions/0172-a-place-opens-with-its-own-four.md`.
      *"A corridor, and something breathing in it"*: this place opens on footsteps, a breath and a
      drone, and the pad and the bassline that every other level opens with are both shut. It follows
      `perc` at `run` and now there is room to hear it.
    */
    ladder: {
      run: { chords: 0, groove: 0.45, sub: 0.6, perc: 0.98, engine: 0.62, ride: 0.4, call: 0.4 },
      push: { chords: 0.4, groove: 0.6, ride: 0.72, perc: 0.92 },
      surge: { perc: 0.9, sub: 2.025, engine: 1.398 },
      approach: { sub: 2.29, engine: 1.285 },
      boss: { sub: 2.253 },
      bossPeak: { sub: 2.285, dread: 1.9 },
    },
    /*
      ⚠️ **THIS IS THE FIRST PLACE THAT USES `air` BY WITHHOLDING IT** — 0136 gave a place a room and
      the interesting thing to do with one is to take it away. Almost everything here is close enough
      to touch; the music box and the horn are not, so they read as coming from elsewhere in the maze.
      Two numbers, and they are the whole picture.
    */
    air: {
      call: 0.95,
      toll: 0.85,
      crash: 0.55,
      drone: 0.4,
      auraSlow: 0.4,
      lead: 0.3,
      dread: 0.3,
      counter: 0.25,
      wraith: 0.25,
      chords: 0.2,
      ride: 0.15,
      hook: 0.12,
      arp: 0.12,
      perc: 0.1,
      auraFast: 0.08,
      drive: 0.06,
      engine: 0.06,
      frenzy: 0.06,
      groove: 0.05,
      stomp: 0.04,
      sub: 0.04,
    },
  },
  /**
   * Level five. Ice.
   *
   * ⚠️ **IT WAS LEVEL FOUR AND THE BRIEF MOVED IT** —
   * `docs/decisions/0146-three-more-places-and-two-after-them.md`: *"one will be ice."* The row keeps
   * its name, its hue and its mix and changes which level plays it, because the only thing wrong with
   * it was where it sat in the run.
   *
   * ⚠️ **ITS OLD MIX IS NOW THE NEUTRAL ONE, WHICH IS THE WHOLE OF 0108's PACE ITEM.** *"The pace of
   * the music sounded good around level 4, that should be our starting point"* — so what this row
   * used to say lives in `MUSIC_LADDER` and level one starts there. What is left here is what makes
   * it *this* place rather than the floor: the same brightness taken further, and the low end pulled
   * out from under it.
   */
  rime: {
    title: 'Rime Shelf',
    /*
      ⚠️ **AUSTERE IS THE WORD, AND IT IS A COLOUR DECISION BEFORE IT IS A COUNT.** Asked for: *"rime
      shelf needs to be icy and austere."* A flat colourless steel-blue with nothing warm anywhere in
      it — the sky over an ice sheet has no weather in it and no sunset, and what makes a place austere
      is that there is nothing to look at rather than that there is something bleak to look at.
      `enemy` sits at **3.70:1** here against a floor of 3, which is the palest of the three planets and
      is the point.
    */
    space: { vivid: '#1a3a50', 'high-contrast': '#040d16' },
    // Ice haze, barely separable from the sky it hangs in. Austerity is a small number here.
    nebula: { vivid: '#3f6478', 'high-contrast': '#16303c' },
    // ⚠️ STEEL HAZE AND A PALE GREEN AURORA. Austere does not mean colourless — an ice sheet's one
    // spectacle is the light in the sky over it, and it is the only warmth this place gets.
    glow: { vivid: '#3d8f78', 'high-contrast': '#2a5a4a' },
    // The shelf: blue-white shadow. Nearly the darkest ground of the three, under the palest sky.
    ground: { vivid: '#0b1a26', 'high-contrast': '#000308' },
    /*
      ⚠️ **THE LOWEST.** Ice is still, and the shelf's threat is the one that arrives without warning.
      A build that spends the level would spend the only surprise the place has.
    */
    aura: 0.4,
    /*
      ⚠️ **THE MIX LEANS ON THE GLASS AND KEEPS THE FLOOR IT NEEDS.** The old row pulled the low end
      out from under a shared composition to make it read as thin and bright; this place states its
      own material and does not need that — what it needs is for the bell, the frost and the singing
      to be above a floor that is genuinely there, because a cold mix with no bottom is a mix a
      player turns down.
    */
    mix: {
      arp: 2.6,
      hook: 2.45,
      call: 2.4,
      ride: 2.4,
      crash: 2.4,
      counter: 1.95,
      toll: 1.7,
      perc: 1.6,
      frenzy: 2.4,
      wraith: 1.85,
      lead: 1.55,
      chords: 1.25,
      auraFast: 1.4,
      sub: 0.78,
      groove: 0.95,
      engine: 0.72,
      stomp: 0.58,
      drone: 0.62,
      dread: 0.78,
      drive: 0.8,
    },
    voices: RIME_VOICES,
    /*
      ⚠️ **THE ONE PLACE WITH NO BOTTOM, AND `sub` IS THE LOUDEST LAYER IN ALL SEVEN** —
      `docs/decisions/0172-a-place-opens-with-its-own-four.md`, and it is the most direct answer
      available to `weigh-apart`'s standing finding. *"It rings… it cracks… the blizzard"* is glass
      and air; the shelf is a thin, high, cold thing until something breaks, and `sub` arriving at
      `push` IS the crack.
    */
    ladder: {
      run: { sub: 0, groove: 0, chords: 1.02, call: 0.76, perc: 0.5, arp: 0.45 },
      push: { sub: 1.06, groove: 0.92, chords: 0.98, call: 0.78, arp: 0.52 },
      surge: { chords: 0.9 },
      bossPeak: { engine: 1.262 },
    },
    /*
      ⚠️ **A LOT OF ROOM, AND IT IS THE ONE PLACE WHERE THAT IS LITERAL RATHER THAN FIGURATIVE.** An
      ice shelf is a flat hard surface under an open sky and it is the only environment in this game
      that would genuinely have a long reflection. The floor stays dry — 0136's own rule, because a
      wet kick is a kick you cannot hear the front of — and everything above it is in the open.
    */
    air: {
      call: 0.95,
      toll: 0.9,
      crash: 0.9,
      chords: 0.85,
      drone: 0.8,
      counter: 0.75,
      lead: 0.7,
      hook: 0.65,
      arp: 0.55,
      dread: 0.55,
      ride: 0.5,
      auraSlow: 0.4,
      perc: 0.35,
      wraith: 0.28,
      drive: 0.2,
      auraFast: 0.18,
      engine: 0.14,
      frenzy: 0.12,
      groove: 0.08,
      stomp: 0.06,
      sub: 0.05,
    },
  },
  /**
   * Level six. A toxic mire, and the thing in it grows a head back.
   *
   * ⚠️ **It was `bloom` and the brief renamed it** —
   * `docs/decisions/0146-three-more-places-and-two-after-them.md`: *"one will be toxic mire hydra
   * boss."* Level six's boss is `chorus`, which is already a body that answers in several voices, so
   * the name is the one part of this row that had to move.
   */
  mire: {
    title: 'The Toxic Mire',
    /*
      ⚠️ **THE DIMMEST OF THE THREE PLANETS, AND ON PURPOSE.** Asked for: *"toxic mire is also a
      planet, but needs an overhanging canopy so that it feels like you're flying through a tight
      narrow corridor above the toxic pools below and beneath the overhanging canopy above."* Almost
      none of this place's sky is visible — the canopy takes the top of the screen and the pools take
      the bottom — so a bright one would only show through the gaps and read as holes in a roof.
      What little of it there is is a sick yellow-green murk hanging between the two.
    */
    /*
      ⚠️ **DARKENED FROM `#1c2a10` AFTER THE BENCH, AND THE REASON IS THAT IT IS AIR.** At the first
      value the murk between the canopy and the pools came out as a solid green slab with a dark frame
      round it — the shot showed a wall, not a corridor. Every other place's `space` is something you
      are looking THROUGH at nothing; here it is something you are looking through at a roof and a
      floor, and it has to be darker than both the things it separates are lit by or it competes with
      them.
    */
    space: { vivid: '#111a08', 'high-contrast': '#040701' },
    // Spore haze, and it is the thing that is actually visible here rather than the sky behind it.
    nebula: { vivid: '#5a7a24', 'high-contrast': '#2a3a10' },
    // ⚠️ SPORE HAZE AND THE POOLS' OWN SICK YELLOW. The pools are the light source here (0221), so the
    // accent is what is coming off them and the haze is what it is lighting.
    glow: { vivid: '#4ad85a', 'high-contrast': '#1c5a22' },
    // ⚠️ **ONE COLOUR FOR BOTH THE CANOPY AND THE POOLS**, because they are one enclosure and the
    // corridor between them is the subject. Two tones would read as a floor and a separate ceiling.
    ground: { vivid: '#080f04', 'high-contrast': '#000200' },
    /*
      ⚠️ **HIGH, BECAUSE THE MIRE SEEPS.** The one place whose whole character is that it reaches you
      before you reach it.
    */
    aura: 0.58,
    /*
      ⚠️ **THE MIX PUTS THE TUNE UNDER THE PAD, WHICH IS THE ONE ROW HERE THAT IS DELIBERATELY WRONG
      BY THE USUAL RULE.** Every other place lifts `call` so the melody is legible; this one holds it
      level with the chords, because the picture is a thing singing from under the water and a melody
      you have to listen past is what that sounds like.
      `docs/decisions/0140-no-layer-is-inaudible.md` is the bound it must still clear, and it does.
    */
    mix: {
      chords: 2.05,
      groove: 2.35,
      wraith: 2.6,
      frenzy: 2.45,
      toll: 1.95,
      dread: 1.8,
      call: 1.35,
      counter: 1.7,
      hook: 1.95,
      drone: 1.45,
      engine: 1.25,
      lead: 1.45,
      auraFast: 1.35,
      ride: 1.05,
      arp: 1.15,
      crash: 1.3,
      perc: 0.95,
      sub: 0.8,
      drive: 0.85,
      stomp: 0.85,
    },
    voices: MIRE_VOICES,
    /*
      ⚠️ **STILL WATER IS A BOTTOM AND ALMOST NOTHING ELSE** —
      `docs/decisions/0172-a-place-opens-with-its-own-four.md`. *"Still water with something under
      it… it is coming up"*: the one place that FOLLOWS its sub, opening with a kit and a bassline
      over the top of it, which is the arrangement arguing with the brief. Both are shut and what
      surfaces afterwards is the level.
    */
    ladder: {
      run: { perc: 0.32, groove: 0, engine: 0.5, chords: 0.58, sub: 1, arp: 0.4 },
      push: { perc: 0.62, groove: 0.55, arp: 0.6 },
    },
    /*
      ⚠️ **HUMID RATHER THAN LARGE.** A swamp has no reflections — it is full of things that absorb —
      so the room here is short and on the layers that are supposed to be far away rather than on the
      ones nearby. It is the middle setting between Ember Nebula's cathedral and The Labyrinth's
      corridor, and it exists to prove the axis has one.
    */
    air: {
      toll: 0.75,
      call: 0.6,
      crash: 0.6,
      chords: 0.55,
      drone: 0.5,
      lead: 0.45,
      counter: 0.4,
      dread: 0.4,
      auraSlow: 0.38,
      hook: 0.3,
      arp: 0.28,
      ride: 0.22,
      wraith: 0.22,
      perc: 0.18,
      auraFast: 0.14,
      drive: 0.12,
      engine: 0.1,
      frenzy: 0.08,
      groove: 0.06,
      stomp: 0.05,
      sub: 0.04,
    },
  },
  /** Level seven. The black hole at the heart of the galaxy, and the drone is what is left of it. */
  core: {
    title: 'The Black Heart',
    space: { vivid: '#10050f', 'high-contrast': '#040003' },
    nebula: { vivid: '#5a1e3c', 'high-contrast': '#2c0c1c' },
    // ⚠️ DEEP RED AND A HOT WHITE-PINK RIM. The last place is nearly empty, so what little is lit has
    // to be the brightest thing in the game — which is what an accretion edge looks like.
    glow: { vivid: '#8ac0e8', 'high-contrast': '#1c3a52' },
    ground: null, // Nothing to stand on. The place's whole character is absence — 0211.
    /*
      ⚠️ **THE HIGHEST, BECAUSE HERE THE AURA IS THE PLACE.** The Black Heart is what the run has been
      travelling towards; 0170 already made it audible in its own fight, and this is the other half —
      it is audible on the way in.
    */
    aura: 0.6,
    /*
      ⚠️ **THE DRONE IS THE SUBJECT AND THE ROW ALREADY SAID SO.** It has leant on this layer since
      the theme table existed; `src/content/core.ts` is what finally makes that a statement about the
      place rather than a preference about a shared pad.
    */
    mix: {
      groove: 1.6,
      arp: 1.85,
      hook: 1.85,
      counter: 1.7,
      stomp: 1.482,
      frenzy: 1.911,
      wraith: 1.755,
      lead: 1.4,
      drive: 1.17,
      call: 1.85,
      engine: 1.15,
      drone: 1.15,
      ride: 1.17,
      crash: 0.70,
      sub: 0.585,
      perc: 1.25,
      toll: 0.624,
      chords: 1.2,
      dread: 0.897,
      auraFast: 1.014,
    },
    voices: CORE_VOICES,
    /*
      ⚠️ **THE BLACK HEART HAS NO HYMN, AND IT HAD THE SAME ONE AS EVERY OTHER PLACE** —
      `docs/decisions/0172-a-place-opens-with-its-own-four.md`. `call` is the melodic thing a level
      opens with (0113) and this place opens on a riff instead; `chords` is the pad that a wall of
      guitars is recorded without, which `air` already says here — *"reverb on a wall of guitars is
      mud"* — and which the ladder went on opening anyway.

      ⚠️ **AND `drive` ARRIVES AT `run`, WHERE THE SHARED LADDER HOLDS IT TO `surge`.** Guitars in
      the third minute is not a metal track; it is a metal track's bridge.
    */
    ladder: {
      run: { chords: 0, call: 0, drive: 0.55, engine: 1, perc: 0.7, groove: 0.6 },
      push: { chords: 0.36, drive: 0.7, hook: 0.78 },
      surge: { sub: 1.235 },
      approach: { sub: 1.45 },
      boss: { sub: 2.668 },
      bossPeak: { sub: 2.773 },
    },
    /*
      ⚠️ **ALMOST NONE, AND IT IS THE ONLY PLACE THAT EARNS THAT BY BEING LOUD RATHER THAN BY BEING
      SMALL.** This genre is recorded close and dry on purpose: reverb on a wall of guitars is mud,
      and the thing that makes it enormous is the density rather than the space. What gets a room is
      the drone, the bell and the crash — the three sounds that are supposed to be coming from the
      hole rather than from the band.
    */
    air: {
      drone: 0.8,
      toll: 0.7,
      crash: 0.55,
      auraSlow: 0.45,
      call: 0.35,
      dread: 0.3,
      lead: 0.22,
      counter: 0.2,
      chords: 0.18,
      wraith: 0.16,
      auraFast: 0.12,
      ride: 0.1,
      hook: 0.08,
      arp: 0.08,
      perc: 0.08,
      drive: 0.06,
      engine: 0.05,
      frenzy: 0.05,
      groove: 0.04,
      stomp: 0.03,
      sub: 0.03,
    },
  },
};

/**
 * What `layer` is scaled by in `theme`. The single description of *a theme's mix is a multiplier*.
 *
 * ⚠️ **Clamped rather than trusted**, so a hand that authors 3 gets the ceiling instead of a mix that
 * clips — and `tests/themes.test.ts` refuses the row outright, which is the half that tells somebody.
 */

/**
 * What `layer` is made of in `theme` — its own voices if it states any, the base composition if not.
 *
 * ⚠️ **THE SINGLE DESCRIPTION OF *WHAT DOES THIS PLACE PLAY*.** `src/app/music.ts` bakes through it
 * and `tests/themes.test.ts` measures through it, so a theme that states nothing is provably the same
 * audio rather than merely intended to be — which is what makes sharing a buffer safe.
 *
 * ⚠️ **`undefined` is *no place yet*** — the title screen, a fixture, anything before a level has
 * been entered — and it is the base composition rather than level one's, because level one is a place
 * like any other and may one day state material of its own.
 */
export function voicesOf(theme: ThemeKind | undefined, layer: MusicLayer): readonly MusicVoice[] {
  if (theme === undefined) return MUSIC[layer];
  return THEMES[theme].voices?.[layer] ?? MUSIC[layer];
}

/**
 * What `kind` is made of IN THIS PLACE — the place's own layers, or the base composition's.
 *
 * ⚠️ **`voicesOf` one channel over** — `docs/decisions/0190-a-place-owns-what-it-kills.md`. It is
 * the one description of *what does an enemy dying here sound like*, and it exists as a function
 * rather than as a lookup for the reason 0162 gives about `rungOf`: the bake, the WAV rig, the
 * dashboard and two measuring scripts all need the answer, and a call site that read `CUES[kind]`
 * for itself would be an instrument reporting a sound nobody hears.
 *
 * ⚠️ **`undefined` IS THE BASE COMPOSITION AND IT IS A REAL CALLER**, not a defensive default:
 * `scripts/hear.mjs` writes the base cue set, and the title screen sounds before a place is chosen.
 */
export function cueLayersOf(theme: ThemeKind | undefined, kind: CueKind): readonly CueLayer[] {
  if (theme === undefined) return CUES[kind].layers;
  return THEMES[theme].cues?.[kind] ?? CUES[kind].layers;
}

/**
 * The whole row as this place sounds it — the base's behaviour with the place's voice in it.
 *
 * ⚠️ **COMPOSED HERE SO NOTHING ELSE DOES IT TWICE.** `sampleCue` and `cueSeconds` both want a
 * `CueRow`, and a second `{ ...CUES[kind], layers }` written at a call site is how the bake and the
 * guard end up measuring different lengths of the same cue.
 *
 * ⚠️ **IT ALLOCATES, SO IT IS A BAKE-TIME FUNCTION AND NOTHING ELSE** —
 * `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`. The speaker's hot path reads
 * `hold` and `duck` off `CUES` directly and must go on doing so; those two are the same in every
 * place BY CONSTRUCTION, because a place states layers and cannot state them.
 */
export function cueRowOf(theme: ThemeKind | undefined, kind: CueKind): CueRow {
  const layers = cueLayersOf(theme, kind);
  return layers === CUES[kind].layers ? CUES[kind] : { ...CUES[kind], layers };
}

/**
 * Which cues this place has to BAKE for itself — the ones whose audio differs from the base.
 *
 * ⚠️ **`revoicedBy`'s twin, and it needs no `bakedBy` beside it.** A music layer has a second
 * reason to be re-baked — the place's own room (0136) — so `bakedBy` is a wider set than
 * `revoicedBy`. A cue's room is a SEND on a node the place does not touch, so here the two sets are
 * the same one and there is only one function.
 */
export function cuedBy(theme: ThemeKind): CueKind[] {
  const own = THEMES[theme].cues;
  if (own === undefined) return [];
  return (Object.keys(own) as CueKind[]).filter((kind) => own[kind] !== undefined);
}

/**
 * How much room `layer` has in `theme` — `0` for a place that states none, and for no place at all.
 *
 * ⚠️ **Clamped rather than trusted**, on `mixOf`'s own terms: a hand that authors 3 gets a cathedral
 * rather than a wash nothing can be heard through, and `tests/themes.test.ts` refuses the row
 * outright.
 */
export function airOf(theme: ThemeKind | undefined, layer: MusicLayer): number {
  if (theme === undefined) return 0;
  const want = THEMES[theme].air?.[layer] ?? 0;
  return want < 0 ? 0 : want > AIR_CEILING ? AIR_CEILING : want;
}

/**
 * The most room a layer may have — `1` is as much room as direct sound.
 *
 * ⚠️ **IT IS A MIX BOUND AND NOT A STABILITY ONE, WHICH IT WAS FOR ONE DRAFT.** The first room wrote
 * three taps back into the buffer they were all reading, so they behaved as a single loop and only
 * decayed while their gains SUMMED under one — a ceiling of 0.55 was arithmetic about feedback.
 * `addRoom` gives each comb its own delay line now, so each is stable on its own and `air` is a pure
 * wet/dry mix. **The stale reason is recorded rather than deleted** because the number did not change
 * and a reader would otherwise trust the old argument for it.
 *
 * ⚠️ **What bounds it now is legibility.** Past about equal parts, the direct sound stops being the
 * thing you hear and a melody turns to weather — which is a fine effect and not one a layer carrying
 * a tune may have.
 */
export const AIR_CEILING = 1;

/**
 * The notes `theme` may sound, as pitch classes over the root. `SCALE` for a place that states none,
 * and for no place at all.
 *
 * ⚠️ **`docs/decisions/0148-a-place-has-its-own-notes.md`.** The default is the natural minor because
 * that is what six of the seven places were written in and none of them has to change to keep it.
 */
export function scaleOf(theme: ThemeKind | undefined): readonly number[] {
  if (theme === undefined) return SCALE;
  return THEMES[theme].scale ?? SCALE;
}

/** Which layers `theme` plays differently from the base. Empty for a place with no music of its own. */
export function revoicedBy(theme: ThemeKind): MusicLayer[] {
  const own = THEMES[theme].voices;
  if (own === undefined) return [];
  return (Object.keys(own) as MusicLayer[]).filter((layer) => own[layer] !== undefined);
}

/**
 * Which layers a place has to BAKE for itself — the ones whose audio differs from the base.
 *
 * ── AND IT IS NOT THE SAME SET AS `revoicedBy`, WHICH IS A TRAP THIS NEARLY WALKED INTO ─────────
 *
 * ⚠️ **`docs/decisions/0136-the-place-has-a-room-and-an-arc.md` added a second way for a place's
 * audio to differ.** Before it, *plays its own notes* and *sounds different from the base* were the
 * same sentence; a place can now state `air` for a layer it does not re-voice, and that layer's
 * buffer is genuinely different — the room is baked in.
 *
 * ⚠️ **Everything that bakes a place was asking `revoicedBy`**: `bakePlace` at a level boundary
 * (0133) and the dashboard's own cache. Both would have shared the base's DRY array for such a layer
 * and the room would simply never have arrived — silently, with every guard green, because nothing
 * asserts a layer that was not claimed.
 *
 * ⚠️ **Ember Nebula gives air only to layers it also re-voices, so nothing is wrong today.** This is
 * the trap closed before the first place walks into it, which is the cheapest moment there is.
 */
export function bakedBy(theme: ThemeKind): MusicLayer[] {
  const air = THEMES[theme].air ?? {};
  const withAir = (Object.keys(air) as MusicLayer[]).filter((layer) => (air[layer] ?? 0) > 0);
  return [...new Set([...revoicedBy(theme), ...withAir])];
}

/**
 * The solved balance, as a scale over each place's hand-authored `mix`.
 *
 * ── THE MIX THAT SHIPPED FOR ITS WHOLE LIFE WAS THE ONE NOBODY CHOSE ────────────────────────────
 *
 * ⚠️ **`docs/decisions/0176-the-re-based-mix-is-the-mix.md`.** Reported after driving all three on the
 * desk: *"re-based now sounds and blends incredibly well, let's make that the released version of the
 * sound."* Until now the game played `MUSIC_LADDER × mix` and the desk could audition two other
 * balances it could not ship; this is the one that won, folded into the table it was always a
 * multiplier over.
 *
 * ⚠️ **IT IS EXACTLY A PER-LAYER, PER-PLACE SCALE, AND THAT IS WHY THIS IS A TABLE AND NOT A
 * SOLVER.** `rebasedLevel`'s whole definition is
 * `out[rung][layer] = shipped[rung][layer] × (solved[push][layer] / shipped[push][layer])` — the rung
 * cancels, so the entire third mix is 161 numbers. Folding them here reproduces
 * `scripts/solve-mix.mjs`'s output to **8.9e-16**, over every place, rung and layer: the game plays
 * the balance the player approved and runs no solver to do it.
 *
 * ⚠️ **SO THE SOLVER IS NOW A RESEARCH TOOL AND NOT A DEPENDENCY.** `scripts/solve-mix.mjs` produced
 * these numbers and is how they would be produced again; nothing under `src/` calls it, and a
 * four-hundred-iteration solve is not something a run start can afford — 0157 is what that costs.
 *
 * ⚠️ **IT IS NOT BOUNDED, AND NEITHER IS `mix` ANY MORE** — 0182. This is a measured balance and its
 * values run from 0.16 to 12.19 — `labyrinth/ride` wants twelve because its material is twenty-odd
 * decibels under everything around it, which is
 * [0140](../../docs/decisions/0140-no-layer-is-inaudible.md)'s *a gain is not a loudness* stated as a
 * number. Clamping it would be the wall that says nothing, which 0164's own header records `arp`
 * being driven into twice — **and the band over `mix` above was that wall, so it went too.**
 *
 * ⚠️ **A LAYER THIS TABLE DOES NOT NAME IS UNSCALED**, which is what the aura pair and every layer the
 * solve left alone are. `SOLVED_BY` excludes the aura by name — its gain is a distance the player
 * steers (0091) — so a scale for it would be an arrangement decision about a thing that is not part of
 * the arrangement.
 *
 * ⚠️ **AT `HOLD_WEIGHT` 0.28 AND `REBASE_RUNG` `push`**, which are the desk's own defaults and
 * therefore what was driven. A different `steady` slider is a different table, and re-generating is
 * `node scripts/solve-mix.mjs`'s job rather than a hand's.
 */
export const REBASE: Record<ThemeKind, Partial<Record<MusicLayer, number>>> = {
  approach: {
    drone: 1.4957,
    sub: 0.28208,
    engine: 0.42064,
    perc: 3.6912,
    chords: 0.82295,
    groove: 0.86114,
    arp: 1.8882,
    ride: 0.51678,
    call: 1.6842,
    hook: 1.8632,
    lead: 1.5213,
  },
  nebula: {
    drone: 1.6196,
    sub: 0.50587,
    engine: 0.84205,
    perc: 7.567,
    chords: 0.83217,
    groove: 1.228,
    arp: 1.5104,
    ride: 1.135,
    call: 1.9278,
    hook: 1.5917,
    lead: 0.98103,
  },
  saurian: {
    drone: 1.6407,
    sub: 0.4566,
    engine: 1.2134,
    perc: 1.3219,
    chords: 2.1301,
    groove: 0.6834,
    arp: 2.1317,
    ride: 3.8308,
    call: 2.4772,
    hook: 1.2412,
    lead: 1.3597,
  },
  labyrinth: {
    drone: 1.1521,
    sub: 0.32361,
    engine: 0.40784,
    perc: 0.75512,
    chords: 4.7711,
    groove: 1.6007,
    arp: 2.2725,
    ride: 6.5873,
    call: 1.162,
    hook: 2.8866,
    lead: 1.3064,
  },
  rime: {
    drone: 1.7862,
    sub: 0.27473,
    engine: 0.65264,
    perc: 1.0859,
    chords: 1.1921,
    groove: 0.33877,
    arp: 2.0289,
    ride: 0.82378,
    call: 0.84375,
    hook: 1.6515,
    lead: 2.5729,
  },
  mire: {
    drone: 1.1996,
    sub: 0.57934,
    engine: 0.51716,
    perc: 2.1322,
    chords: 0.28424,
    groove: 1.6518,
    arp: 1.7602,
    ride: 0.49169,
    call: 2.7104,
    hook: 0.7005,
    lead: 0.5387,
  },
  core: {
    drone: 0.86653,
    sub: 0.31815,
    engine: 0.80713,
    perc: 1.1821,
    chords: 1.5292,
    groove: 0.5598,
    arp: 1.3852,
    ride: 1.9256,
    call: 1.7566,
    hook: 1.8996,
    drive: 0.86169,
    lead: 1.3825,
  },
};

/**
 * What this place multiplies the shared ladder by — the hand's colour, times the solved balance.
 *
 * ⚠️ **THERE IS NO CLAMP, AND THE ONE THERE WAS SAID NOTHING WHEN IT BIT** — 0182. 0176 moved the
 * band off the product and onto the hand, which was the right half of the fix and left the wall
 * standing: a tint of 2.9 still became 2.6, still read as 2.9 in the table, and still lost the
 * difference without a word. **What bounds this product is the bus**, and the clip guard drives it
 * through the real shaper at every place and every rung.
 */
/**
 * How far the level's own build may open this place's aura — the place's own number.
 *
 * ⚠️ **ONE DESCRIPTION, ON `rungOf`'s OWN TERMS** — 0162. The game, the rig, the dashboard and four
 * measuring scripts all need *how loud may the dread get here*, and while the answer was a constant
 * every one of them imported it. A place may differ now, so a call site that reads a number instead
 * is an instrument reporting a level nobody hears.
 */
export function auraCeilingOf(theme: ThemeKind): number {
  return THEMES[theme].aura;
}

/**
 * What brings each rung of a place back to its `run` loudness — a scale over the whole rung.
 *
 * ── A LEVEL HOLDS ONE LOUDNESS, AND THE LADDER CLIMBS UNDER IT ──────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0226-the-level-holds-one-loudness.md`.** Six reports on the same stretch of The
 * Approach, and the sixth said what the first five had been circling: *"the tempo should be
 * increasing, but the volume should be consistent for each track for the level."* Every answer before
 * it made the climb gentler, evener or narrower; none of them asked whether there should be one.
 * 0123 had already found that *loudness does not predict a section* — a rung is a change of NOTES —
 * so the climb was decoration that read as somebody turning the knob up.
 *
 * ⚠️ **A SCALE OVER THE RUNG, NOT A RE-BALANCE, WHICH IS WHY 0167 SURVIVES THIS.** That decision
 * forbade paying for arrivals out of the carried layers because the solved mix did it *per layer*
 * and the border became *"a hard jump between sounds"*. Every ratio inside a rung is untouched here;
 * the whole rung is lower by one number, paced across the build by `levelWrites`, so the arrangement
 * changes and the level does not.
 *
 * ⚠️ **SOLVED IN THE LISTENER'S UNIT, THROUGH THE SHIPPED BUS.** `node scripts/solve-hold.mjs` finds,
 * for each place and rung, the scale at which `tests/clean.ts`'s `loud` — K-weighted, after the
 * compressor and the shaper — equals the same place's `run`, and prints this table. `run` is the
 * reference because it is the section the report called *"decent"* and every later one *"too loud"*.
 *
 * ⚠️ **A RUNG THIS TABLE DOES NOT NAME IS UNSCALED.** `calm` is the title's and is not a level's
 * rung; `run` is the reference and is 1 by construction.
 */
export const LEVEL_HOLD: Record<ThemeKind, Partial<Record<MusicLevel, number>>> = {
  approach: { push: 0.6744, surge: 0.5683, approach: 0.6979, boss: 0.6191, bossPeak: 0.6191 },
  nebula: { push: 0.8072, surge: 0.8282, approach: 0.7474, boss: 0.692, bossPeak: 0.6802 },
  saurian: { push: 0.9579, surge: 0.8644, approach: 0.8793, boss: 0.8072, bossPeak: 0.7867 },
  labyrinth: { push: 0.5399, surge: 0.3386, approach: 0.3149, boss: 0.3565, bossPeak: 0.3017 },
  rime: { push: 0.692, surge: 0.5881, approach: 0.6034, boss: 0.8107, bossPeak: 0.8003 },
  mire: { push: 0.6244, surge: 0.4511, approach: 0.5085, boss: 0.4789, bossPeak: 0.4789 },
  core: { push: 0.4688, surge: 0.4176, approach: 0.4472, boss: 0.423, bossPeak: 0.4105 },
};

/** The hold on `rung` in `theme` — `1` where the table says nothing. */
export function holdOf(theme: ThemeKind, rung: MusicLevel): number {
  return LEVEL_HOLD[theme][rung] ?? 1;
}

export function mixOf(theme: ThemeKind, layer: MusicLayer): number {
  /*
    ⚠️ **`trim` IS THE PLACE'S OWN LEVEL AND IT MULTIPLIES EVERYTHING** — 0191. It is here rather
    than in `rungOf` for the reason `rungOf`'s own header gives about `mixOf`: that function answers
    what the LADDER says, and how loud a place sits is a balance rather than a shape.
  */
  return (THEMES[theme].mix[layer] ?? 1) * (REBASE[theme][layer] ?? 1) * (THEMES[theme].trim ?? 1);
}

/**
 * How far open `layer` is at `rung` IN THIS PLACE — the place's own number, or the shared ladder's.
 *
 * ── THE ONE DESCRIPTION, AND IT HAS TO BE, BECAUSE EIGHT THINGS ASK IT ──────────────────────────
 *
 * ⚠️ **`docs/decisions/0162-a-place-has-its-own-ladder.md`.** The game, the rig, the dashboard, the
 * WAV writer and three measuring scripts all need *what is this layer doing at this rung of this
 * level*, and until now every one of them wrote `MUSIC_LADDER[rung][layer]` for itself. That was safe
 * while the answer was the same everywhere; the moment a place may differ, a call site that forgot is
 * an instrument reporting a mix nobody hears — which
 * `docs/decisions/0116-the-rig-plays-the-level.md` has now been paid for twice.
 *
 * ⚠️ **`tests/music.test.ts` SCANS FOR A RAW `MUSIC_LADDER[` READ** outside this function, on the
 * terms `gainOf` is held to by 0126. That is the guard that makes *one description* a fact rather
 * than an intention.
 *
 * ⚠️ **THE AURA'S CEILING AND `mixOf` ARE DELIBERATELY NOT IN HERE.** This answers what the LADDER
 * says; the nearness multiplier is a distance the player steers (0091) and the balance is the place's
 * own (0147). Folding either in would make one function that cannot be asked a simple question.
 */
/**
 * ⚠️ **`ladder` IS AN INPUT AND THE GAME NEVER PASSES ONE** — 0138's shape, applied to the other
 * half of what a place is. The shipped game asks with three arguments and gets `THEMES[theme]`'s own;
 * `rig/dash.ts` hands it whatever the desk has been edited to, and hears the mixer follow on the next
 * tick. `tests/dash.test.ts` scans `src/` to keep it that way, exactly as it does for `sections`.
 */
export function rungOf(
  theme: ThemeKind,
  rung: MusicLevel,
  layer: MusicLayer,
  ladder: ThemeRow['ladder'] = THEMES[theme].ladder,
): number {
  /*
    ⚠️ **THE HOLD IS MULTIPLIED IN HERE AND NOT IN `mixOf`, AGAINST THIS FUNCTION'S OWN HEADER** —
    0226. `mixOf` is per LAYER and the hold is per RUNG: a scale that depends on where the level is
    belongs with the answer to *what is this layer doing at this rung*, and eight callers ask that
    question here. `rungIn` below stays the bare ladder, which is what a solver has to see.
  */
  return rungIn(ladder, rung, layer) * holdOf(theme, rung);
}

/**
 * The same lookup over a ladder handed in — which is how the override path is reachable at all.
 *
 * ⚠️ **IT EXISTS BECAUSE NO PLACE STATES A LADDER YET, AND A MECHANISM NO DATA EXERCISES IS GUARDED
 * BY NOTHING.** `rungOf` reads `THEMES`, so with every `ladder` absent a version of it that ignored
 * the override entirely would return the right answer for all seven places and every test would pass.
 * That is `docs/decisions/0005-a-guard-must-be-seen-to-fail.md`'s subject reached from the other side:
 * not a guard that cannot fail, but a code path nothing can drive.
 *
 * ⚠️ **PURE, AND SEPARATED FOR EXACTLY THE REASON `musicLevelFor` AND `rephaseIn` WERE** — the
 * arithmetic most likely to be wrong is the part a headless test can hand its own table to.
 * `tests/themes.test.ts` drives it with a synthetic place; `rungOf` above is the one reader of
 * `THEMES`, and `tests/dash.test.ts` keeps it the one reader of `MUSIC_LADDER`.
 */
export function rungIn(
  ladder: ThemeRow['ladder'],
  rung: MusicLevel,
  layer: MusicLayer,
): number {
  return ladder?.[rung]?.[layer] ?? MUSIC_LADDER[rung][layer];
}

/**
 * How many notes a bar a layer's pattern sounds — the quantity a listener calls PACE.
 *
 * ── IT LIVED IN `tests/pace.ts` AND THE DESK NEEDED IT ──────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0168-the-pace-is-on-the-desk.md`.** Reported after playing all seven levels on
 * the re-based mix: *"approach slows down the beat instead of maintaining/increasing… same thing on
 * all levels."* Measured, that is exact and universal — every place drops **17–28%** in notes a bar
 * at `approach`, because the rung closes `groove` and `hook` (both dense) and opens `toll` and
 * `dread` (both held).
 *
 * ⚠️ **IT IS PURE CONTENT AND COSTS NOTHING**, which is why it can be on a readout that redraws
 * sixty times a second: counting non-null steps in a pattern is not DSP, and every other number the
 * mix panel shows is.
 *
 * ⚠️ **IT MOVED HERE RATHER THAN BEING COPIED**, on
 * `docs/decisions/0029-the-tracked-record-is-the-record.md`'s terms — `tests/pace.ts` imports it,
 * `rig/transport.ts` imports it, and a second count of the same steps is how the printed figure and
 * the asserted one drift apart. `themes.ts` is where it belongs because `voicesOf` is the thing that
 * knows which pattern a place actually plays.
 */
export function notesPerBar(theme: ThemeKind | undefined, layer: MusicLayer): number {
  let notes = 0;
  for (const voice of voicesOf(theme, layer)) {
    for (const step of voice.steps) if (step !== null && step !== undefined) notes++;
  }
  return notes / LAYER_BARS[layer];
}

/**
 * The pace of a whole rung: every layer the rung opens, counted.
 *
 * ⚠️ **THE LADDER IS AN ARGUMENT SO AN EDITED ONE MOVES IT** — 0163. The point of putting this on the
 * desk is that dragging a layer open at `approach` changes the number while you watch, which is what
 * turns *"it slows down"* into something you can fix without a round trip.
 */
export function paceAt(theme: ThemeKind, rung: MusicLevel, ladder?: ThemeRow['ladder']): number {
  let notes = 0;
  for (const layer of MUSIC_LAYERS) {
    /*
      ⚠️ **THROUGH `rungOf` AND NOT `rungIn`, WHICH IS ONE ROUTER RATHER THAN TWO** — and the first
      version of this got it wrong in a way `npm run prove` caught. Defaulting the ladder here meant a
      second `= THEMES[theme].ladder` in this file, and 0162's routing guard is a SOURCE SCAN for that
      expression: with two of them, the probe that rewrites `rungOf`'s left the other one satisfying
      the scan, and a guard that had gone red for two decisions went quietly green. `rungOf` owns the
      theme-to-ladder decision; everything else asks it.
    */
    if (rungOf(theme, rung, layer, ladder) > 0) notes += notesPerBar(theme, layer);
  }
  return notes;
}
