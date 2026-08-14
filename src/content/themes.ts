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
import { SCALE } from './cues.ts';
import { LABYRINTH_VOICES } from './labyrinth.ts';
import { MIRE_VOICES } from './mire.ts';
import { MUSIC, type MusicLayer, type MusicVoice } from './music.ts';
import { NEBULA_VOICES } from './nebula.ts';
import type { PaletteName } from './palette.ts';
import { RIME_VOICES } from './rime.ts';
import { SAURIAN_VOICES } from './saurian.ts';

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
}

/**
 * The lowest a theme may scale a layer to, and the highest.
 *
 * ⚠️ **The floor is not zero.** A theme that silenced a layer the rung had opened would break both
 * *the ladder only opens layers* (0090) and *every rung adds something* (0102) from a table whose
 * subject is colour and mix — and it would do it invisibly, because the ladder's own guards read
 * `MUSIC_LADDER` and never see this. Half is a lean, not a removal.
 *
 * ⚠️ **The ceiling is what the mix's headroom can pay for.** `MUSIC_GAIN` sits under a measured peak
 * (0092, 0104) and a theme is a multiplier on top of it, so `tests/music.test.ts` drives every theme
 * at every rung through the shaper and refuses one that clips.
 */
/*
  ── THE BAND WAS ±3 dB, AND THAT IS WHY SEVEN PLACES SOUNDED LIKE ONE ────────────────────────────

  ⚠️ **`docs/decisions/0147-a-place-is-a-balance.md`.** Reported, having heard all five of 0146's new
  places: *"level 3 sounds incredibly similar to level 2… level 4, 5, 6 were pretty bland and very
  similar to the other levels, it didn't feel like I'd travelled somewhere else in the galaxy."*

  ⚠️ **MEASURED WITH `node scripts/weigh-apart.mjs`, THE SEVEN PLACES SIT 1.9 TO 6.0 dB APART**, and
  the three the report names as interchangeable are the three closest pairs in the table. `sub` is the
  loudest layer in **all seven**; the top of every mix is a sub, a kick, a bass and a pad; and every
  layer that carries a place's brief — the lasers, the roar, the music box, the twin lead, the hydra —
  is in the bottom third of its own mix at −15 to −30 dB.

  ⚠️ **AT ±3 dB A THEME CANNOT STATE A BALANCE, IT CAN ONLY TINT ONE.** `MUSIC_LADDER` is a single
  arrangement and every place was a small nudge over it, so the arrangement won — which is
  `docs/decisions/0113-there-is-one-composition-and-seven-levels.md`'s own failure arriving one level
  up: 0128 and 0132 fixed the MATERIAL and left the BALANCE shared.

  ⚠️ **WHAT REPLACES THE NARROW BAND IS MORE GUARDS, NOT FEWER** — the same trade
  `docs/decisions/0120-a-rung-may-close-a-layer.md` made when it took 0090's additive rule away.
  `tests/themes.test.ts` now holds, per place: the bus does not clip at any rung; **every rung is
  louder than the one below**; no layer a rung opens is inaudible; **no place's quietest third is a
  whisper**; and **no two places are within 3 dB of each other's profile**. Those are properties of
  the thing the report is about. A ±3 dB window was a property of nothing.
*/
export const MIX_FLOOR = 0.22;
export const MIX_CEILING = 2.6;

/**
 * Every theme. One per level, in order.
 *
 * ⚠️ **The backdrops are a HAND, on `docs/decisions/0037-the-ship-has-mass.md`'s terms**, and the one
 * thing they are not free to be is bright: every one of them is a near-black, because
 * `src/content/palette.ts` says the void is the thing eight other inks have to be legible against and
 * `tests/palette.test.ts` holds that as a contrast floor per ink per palette. What a theme moves is
 * the HUE of the dark, which is enough to say *somewhere else* and cannot cost a bullet its edge.
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
    /*
      ⚠️ **THE MIX LEANS ON THE FLOOR NOW AND IT USED TO LEAN ON THE CHOIR** — 0134. Reported: *"it's
      very high on the treble with no deep bassy times."* Measured, the place ran **28.6% of its
      energy under 300 Hz at `surge` against level one's 40.0%**, and the fix is two-sided: the
      material grew a running pedal, and this table stopped pushing the organ's top rank over it.

      ⚠️ **`groove` is at the ceiling on purpose.** It is the undercurrent, it is centred, and
      `MIX_CEILING` is what a multiplier may spend — a place whose whole complaint was the bottom is
      the place that should be spending it there.
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
    space: { vivid: '#121006', 'high-contrast': '#040300' },
    nebula: { vivid: '#4a4418', 'high-contrast': '#241f0c' },
    mix: {
      groove: 2.2,
      ride: 2.2,
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
    /*
      ⚠️ **THE MIX LEANS ON THE THINGS A BODY MAKES.** The breath, the footfall and the heartbeat are
      the picture; the pad is the wall they happen against and is deliberately the quietest thing
      here, which is the opposite of every other place in the game.
    */
    mix: {
      call: 2.6,
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
    space: { vivid: '#08131a', 'high-contrast': '#000408' },
    nebula: { vivid: '#1e4a5c', 'high-contrast': '#0e2e3a' },
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
    space: { vivid: '#0b1206', 'high-contrast': '#010500' },
    nebula: { vivid: '#3a5418', 'high-contrast': '#1c2a0c' },
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
      call: 2.6,
      engine: 1.15,
      drone: 1.15,
      ride: 1.17,
      crash: 0.897,
      sub: 0.585,
      perc: 1.25,
      toll: 0.624,
      chords: 1.2,
      dread: 0.897,
      auraFast: 1.014,
    },
    voices: CORE_VOICES,
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

export function mixOf(theme: ThemeKind, layer: MusicLayer): number {
  const want = THEMES[theme].mix[layer] ?? 1;
  return want < MIX_FLOOR ? MIX_FLOOR : want > MIX_CEILING ? MIX_CEILING : want;
}
