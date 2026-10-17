/**
 * The arsenal's vocabulary — what the trigger throws.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`.
 *
 * ── A SPECIAL IS THE GUN'S OWN — `docs/decisions/0373-a-special-is-the-guns-own.md` ─────────────
 *
 * Asked for: *"if you're at max power ups and you collect up a power up of the same type it
 * increases your bomb count for that weapon/missile type … they'll all have their own unique
 * effects."* Every gun and every tube names the special its overflow buys (`special` on its row),
 * and a charge of it goes on the arsenal's stack, which the trigger throws newest first.
 *
 * Two shapes live here and a row is one of them. A **thrown** special has a `shot` that flies to
 * `reach` and `becomes` a blast. A **surge** has a `surge`: a timed aura on the ship that makes one
 * of its own weapons stronger while it lasts. Neither is a default for the other, so a row says
 * `null` for the one it is not.
 */

import type { CueKind } from './cues.ts';
import type { GolferKind } from './golfers.ts';
import type { MissileKind } from './missiles.ts';
import { BLADE_EDGE, type ShotKind } from './shots.ts';
import { SPRITE } from './sprites.ts';

/**
 * Every special, closed. A new one fails every `Record` over this union to BUILD until it has a row.
 *
 * ⚠️ **`mines` WAS HERE, and 0373 deleted it.** It was a name held so the arsenal could be shown
 * holding two different things, and nothing ever fired it. The typed specials are that second thing.
 *
 * ⚠️ **All six** (`reports/the-arsenal-planned-2026-09-26.md`); the shield's void is the last, 0377.
 * The ray's nova came after them (0447), and the roman candle after that (0537) — the special of a gun
 * that has not landed yet, so it is thrown from every bomb pickup before any ship opens on it.
 */
export const SPECIAL_KINDS = ['bomb', 'hunt', 'overdrive', 'storm', 'whirlpool', 'voidMissile', 'nova', 'candle', 'warDance', 'waterCannon'] as const;

/**
 * What the player can be carrying. Derived from the list rather than written beside it, so a kind
 * cannot exist in the union and be missing from the table — `src/content/sprites.ts` has the
 * incident that argues for deriving rather than restating.
 */
export type SpecialKind = (typeof SPECIAL_KINDS)[number];

/**
 * The two triggers, and which stack each one throws — `docs/decisions/0376-a-trigger-for-the-gun-and-one-for-the-tubes.md`.
 *
 * ⚠️ **THE ONE STACK 0373 BUILT WAS A FLAW, AND IT WAS RECORDED WHERE IT SHOULD HAVE BEEN RAISED.** One
 * trigger throwing the newest charge let a charge go through a weapon it was not earned from. Played:
 * *"having one bomb queue means that you might not even have the autofire gun equipped when you try to
 * use that bomb."* The gun's specials are on the first trigger and the tubes' on the second, each its
 * own newest-first stack. Order is the binding order: `special1` is the gun, `special2` the tubes.
 *
 * ⚠️ **AND `special3` THE WARD — 0447.** *"The void bomb will need to have its own unique button as
 * well because it can be used strategically to avoid enemy fire."* The two specials that unmake enemy
 * fire — the void and the nova — are a third stack on a third trigger, so a press meant to save the
 * ship never throws a bomb and a bomb press never spends the escape.
 */
export const SIDES = ['gun', 'tubes', 'ward'] as const;
export type Side = (typeof SIDES)[number];

/**
 * What a player calls each trigger — 0458, for How to play's controls, and the word the pickups' `how`
 * lines use for where a charge goes. A table over the closed union, so a fourth side is a row here.
 */
export const SIDE_LABELS: Record<Side, string> = {
  gun: 'Gun trigger',
  tubes: 'Missile trigger',
  ward: 'Ward trigger',
};

/**
 * A surge: for `steps`, the ship wears `aura` — its pods — and each of its volleys fires `pods` extra
 * missiles of the surge's OWN kind, charged — 0379. One of them since 0405, down the middle.
 *
 * ⚠️ **IT STRENGTHENED WHATEVER TUBES WERE FITTED, AND THAT WAS THE FLAW 0376 FIXED FOR THE STACK.**
 * Played: *"the missiles need a rework on the special, same problem exists when activating a special
 * with the other equipped. Let's change that special so that it fires out two additional missiles of
 * the special bomb variety, so you could have any combo of 4 or 2/2 depending on your equipped
 * missile and the special."* So the fitted tubes fire as they are, and the surge adds its own.
 */
/**
 * How far out from the ship's centreline a surge's two pods sit, in world units — 0379. Outside the
 * hull (half its seven-unit extent) and outside the fitted tubes, so four missiles leave from four
 * places. The frame launches from here and the bake draws the pods here: one number for both (0036).
 */
export const POD_ACROSS = 4.5;

/**
 * How far ahead of the ship's centre a pod ON THE CENTRELINE launches, in world units — 0405. The
 * side pods launch at `MUZZLE_ALONG`, which is under the nose; a pod there would leave from inside
 * the hull and be drawn where the hull covers it. So its barrel runs out past the longest nose any
 * ship has (7.8 units, half of it 3.9) and it launches from the barrel's tip. One number for the frame
 * and the bake, on 0036's terms, as `POD_ACROSS` is.
 */
export const POD_NOSE = 4.5;

/**
 * Where pod `j` of `count` sits across, as a share of `POD_ACROSS` either side of the centreline —
 * 0405. One pod is the centreline, between the fitted tubes: *"1 bonus missile firing in the middle
 * of the two regular ones."* More spread evenly from one side to the other, which for two is the pair
 * 0379 drew. The frame launches from it and the bake draws from it, so the count on the row is the
 * whole of what decides the picture.
 */
export function podSide(j: number, count: number): number {
  return count === 1 ? 0 : -1 + (2 * j) / (count - 1);
}

export interface Surge {
  /** How long it lasts, in fixed steps (0022). */
  steps: number;
  /** The bitmap drawn on the ship while it lasts — its pods, the picture of the whole effect (0036). */
  aura: number;
  /**
   * The pods: `count` extra missiles of `missile` each volley, placed by `podSide`, with
   * `damage` multiplying the missile's own, `fuse` its life, and `pierce` how many landings it
   * survives, gated as a blade's are (0357) — one is spent by arriving.
   */
  pods: { missile: MissileKind; count: number; damage: number; fuse: number; pierce: number };
}

/**
 * A storm: what a thrown special does when its fuse runs out, instead of becoming a blast —
 * `docs/decisions/0374-the-storm-and-the-whirlpool.md`. *"Explodes into a massive lightning blast
 * that sends lightning flickering all across the screen and chains twice for each hit."*
 */
export interface Storm {
  /** How many bodies the burst strikes first, nearest first, anywhere on the screen. */
  strikes: number;
  /** How many more each of those chains on to — *"chains twice for each hit."* One generation. */
  chains: number;
  /** How far a chain may jump from the body it came off, in world units. */
  reach: number;
  /** What a strike takes off a body. */
  damage: number;
  /** What a strike takes off a boss, as a share of its full health, when that is more — 0372's shape. */
  bossShare: number;
  /** Bolts thrown from the burst to random places on the screen, each time the flicker renews. */
  flicker: number;
  /** How long the flicker goes on renewing, in fixed steps. The picture of *"all across the screen."* */
  flickerSteps: number;
}

/**
 * A rift: what the void missile opens where its fuse runs out — `docs/decisions/0377-the-void.md`.
 * *"Creates a massive void zone that negates everything but your ship and bosses (does 10% max boss
 * health damage) will also negate bullets and chunks of the labyrinth wall, basically everything,
 * lasers fired by enemies will disappear into."*
 */
export interface Rift {
  /** Its radius in world units: everything inside it but the ship and the boss is negated. */
  radius: number;
  /** How long it stays open, in fixed steps — negating everything that enters, for all of it. */
  steps: number;
  /** What it lands on a boss it reaches, as a share of the boss's full health, once. */
  bossShare: number;
}

/**
 * A whirlpool: blades on spiral arms about a centre ahead of the ship, turning and growing until
 * none of it is on the screen — 0374. *"A huge shuriken in a whirlpool shape that gets progressively
 * bigger … it can hit bosses multiple times as it whirlpools around."*
 */
export interface Whirl {
  /** Spiral arms, evenly spaced about the centre. */
  arms: number;
  /** Blades along each arm. */
  blades: number;
  /** How far ahead of the ship the centre is set, in world units; it holds there in the camera. */
  ahead: number;
  /** The innermost blade's radius when it opens. */
  start: number;
  /** How much further out each blade along an arm sits. */
  gap: number;
  /** How far round each blade along an arm sits from the one inside it, in radians — the spiral. */
  twist: number;
  /** World units the whole thing grows by, per step. */
  grow: number;
  /** Radians it turns by, per step. */
  spin: number;
  /** What a blade takes off a body each time it lands — once per flash, as a blade's does (0357). */
  damage: number;
  /** How much bigger than the gun's own blade each blade is drawn and lands — *"huge."* */
  swell: number;
}

/**
 * A nova: a ring bursting out from where the ship was, across the whole screen, that pops what it
 * passes — 0447. *"A huge purple ring bursting out from the ship across the screen."*
 */
export interface Nova {
  /** Its radius as it leaves the ship, in world units. */
  start: number;
  /** World units it grows by, per step. It is gone when it is past every corner of the view. */
  grow: number;
  /** How thick the band that lands is, in world units — what it reaches either side of its radius. */
  band: number;
  /** What it takes off a body it crosses, once. Every enemy shot it crosses is gone. */
  damage: number;
  /** What it lands on a boss it reaches, as a share of the boss's full health, once — 0372's shape. */
  bossShare: number;
  /**
   * The rings drawn inside it, travelling with it — 0533. *"Two slightly smaller inner rings for
   * visual effect."* Empty is one ring.
   *
   * ⚠️ **A PICTURE AND NOTHING ELSE.** Only the outer ring lands: every inner ring is behind an edge
   * that has already crossed everything it passes, so none of them strikes, pops or reaches anything,
   * and the nova reaches exactly as far as it did with none.
   */
  rings: readonly NovaRing[];
}

/** One ring drawn inside a nova — 0533. */
export interface NovaRing {
  /** World units its radius trails the outer ring's by. It is laid once that leaves it at least `start`. */
  behind: number;
  /** How big its band is drawn against the outer ring's — thinner and shorter-glowing, as `swell` is. */
  swell: number;
}

/**
 * A roman candle: stars fired from the ship one after another, fanned across the lane, each going off
 * where its fuse runs out as a firework that lands on everything inside it — 0537. *"A roman candle of
 * fireworks blasting out and filling a good chunk of the screen with fireworks."*
 */
export interface Candle {
  /** How many stars it fires. */
  stars: number;
  /** Steps between one star and the next — on the beat's grid, so the volley is a figure. */
  every: number;
  /**
   * How far off the lane's axis the outermost stars leave, in radians either side. The stars sweep
   * from one side to the other in the order they are fired.
   */
  fan: number;
  /**
   * How far each star flies before it bursts, in world units, by its place in the volley — taken in
   * turn, so the bursts tile the screen near and far rather than standing on one arc.
   */
  reaches: readonly number[];
  /** What a star is in flight — a row in `SHOTS`, thrown as a bomb is and hurting nothing. */
  star: ShotKind;
  /** What a burst is — a row in `SHOTS`, landed through the blast pairings as a bomb's blast is. */
  burst: ShotKind;
  /** What each burst lands on a boss it reaches, as a share of the boss's full health, once. */
  bossShare: number;
}

export interface SpecialRow {
  /** What the player would call it. Terse, per `docs/game.md`'s voice rule. */
  label: string;
  /**
   * What it does, in the fewest words — the title key's line beside its face, since the bomb pickup
   * offers the gun specials by face (0441). Terse, per `docs/game.md`'s voice rule.
   */
  hint: string;
  /** Which trigger throws it — 0376. The gun's overflow buys a gun special, the tubes' a tube one. */
  side: Side;
  /**
   * What leaves the ship when the player triggers it, or `null` for a surge, which throws nothing.
   *
   * ⚠️ **NULLABLE, and a row answers it.** 0016 says behaviour rides the row: a surge answers
   * *nothing leaves the ship* here and *an aura* in `surge`, and a thrown special the other way round.
   */
  shot: ShotKind | null;
  /**
   * What it becomes when its fuse runs out, or `null` for something that simply retires.
   *
   * Two rows rather than one because the thing that flies and the thing that hurts are different
   * bodies with different radii, different inks and different pairings — see `src/content/shots.ts`.
   */
  becomes: ShotKind | null;
  /**
   * How far ahead of the ship it goes off, in **world units**.
   *
   * ⚠️ **THE ASK STATED THIS AS A FRACTION OF THE SCREEN, AND 0023 REFUSES SCREEN-SPACE AUTHORING.**
   * `alongSpan` runs 178 to 240 units by device, so a bomb thrown *"halfway up the screen"* would be
   * a different weapon on a 21:9 monitor than on a phone — a longer reach for the player with the
   * wider display, which is the difficulty parity 0023 exists to protect.
   *
   * So it is authored in world units against the **reference view** — 16:9, 177.8 units along, the
   * aspect `src/content/levels.ts` is already written for. 80 is a little under half of it, which is
   * the stated fraction on the aspect the levels assume, and it is the same distance everywhere.
   */
  reach: number;
  /**
   * The share of a boss's FULL health what it `becomes` lands on the boss, when that is more than
   * the blast's own damage — `docs/decisions/0372-a-death-keeps-the-ladders.md`. Zero for a special
   * that is only ever flat.
   *
   * ⚠️ **On the special and not on the blast row**, because the pyre's rungs are the same blast and
   * are not spent: what the player chose to throw is what is worth a share of the fight.
   */
  bossShare: number;
  /** The aura and what it strengthens, or `null` for a thrown special — 0373. */
  surge: Surge | null;
  /** What a thrown special does in place of becoming a blast, or `null` — 0374. */
  storm: Storm | null;
  /** The whirlpool it opens ahead of the ship, or `null` — 0374. */
  whirl: Whirl | null;
  /** The rift a thrown special opens in place of a blast, or `null` — 0377. */
  rift: Rift | null;
  /** The ring it bursts from the ship, or `null` — 0447. */
  nova: Nova | null;
  /** The stars it fires from the ship, one after another, or `null` — 0537. */
  candle: Candle | null;
  /** The dance it throws the ship into, or `null` — 0593. */
  dance: Dance | null;
  /** The jet it plays from the ship's gun, or `null` — 0595. */
  jet: Jet | null;
  /**
   * The pilot who must be open before the bomb pickup offers it in a run, or `null` for every run — 0594.
   * The War Dance's is Unity's: *"other ships can pick up the special once the hamster ball is unlocked"*.
   * Every row says its own. The hangar asks nothing more of it: fitting another ship's special already
   * waits for that ship to be won (`specialOpen`), and the ball is won only in Unity's hands.
   */
  opensWith: GolferKind | null;
  /*
    ── `charges` WAS HERE, AND IT WAS ONE ON EVERY ROW BUT THE BOMB'S — 0441 ─────────────────────

    It said how many charges a take pushed: two for the bomb, because the run opened on what the
    bomb's row said, and one for the rest. *"A player can pick up any type and get a bomb of that
    type"* makes a take one charge of every kind, and a field that is one on every row is 0282's tell
    — a mechanism whose output is identical for every kind. A take is one charge; what a run opens
    on is `OPENING_CHARGES` of the ship's own gun's special.
  */
  /**
   * Which baked bitmap says *this one*, wherever the player is shown what the trigger throws next.
   *
   * ⚠️ **The real art, never a drawing of it** — the same argument `src/app/chrome.ts` makes for the
   * pickup key: a hand-written glyph is a second description of a silhouette. A surge wears its
   * source's pickup face, so the thing on the button is the thing the player overflowed to get it.
   *
   * An index rather than a name, exactly as `Body.sprite` is.
   */
  face: number;
  /**
   * What the press sounds like: the throw, the aura lighting, the whirlpool opening — 0378. Immediate,
   * because it answers a button (0104). Each special's own, on its row, as a boss's attack names its
   * sound (0308), rather than the frame choosing one by what shape the row is.
   */
  cue: CueKind;
  /**
   * What it sounds like when a thrown special goes off — the blast, the storm, the rift — and `null`
   * for one that is not thrown. On the grid: a consequence, on a clock the player no longer holds.
   */
  lands: CueKind | null;
  /**
   * Whether the game falls silent while this one is in play — in the air, and open where it went off
   * — 0378. *"The void bomb needs to negate all sound and be an orb of silence when it's fired."* Its
   * own cues go through the hush (`throughHush` in `src/content/cues.ts`).
   */
  hushes: boolean;
}

/** Ten seconds of the sim's own clock — 0022. The seeker surge's length is the ask's. */
const SURGE_STEPS = 600;

/**
 * How many charges of its own gun's special a ship opens a run with — 0441: *"a game starts with two
 * bombs."* The fighter opens on two bombs, as every run did; the estate on two storms and the Firebird
 * on two whirlpools, because a bomb is what the ask calls every gun's special.
 */
export const OPENING_CHARGES = 2;

export const SPECIALS: Record<SpecialKind, SpecialRow> = {
  /**
   * The pulse's since 0375 — *"let's make the auto-gun pickup the regular bomb"* — and the straight
   * tube's before it. A large forward-firing missile that goes off as the bomb's explosion.
   *
   * ⚠️ **A TWENTIETH OF A BOSS — 0372**: *"increase its damage so it does 5% of max boss health
   * damage."* The larger of that and the blast's own six, so a small mid-boss is not hit softer
   * than it was; a window (0255) still multiplies it, as it multiplies everything the player fires.
   */
  bomb: {
    label: 'Bomb',
    hint: 'A big blast up the lane',
    side: 'gun',
    shot: 'bomb',
    becomes: 'blast',
    reach: 80,
    bossShare: 0.05,
    surge: null,
    storm: null,
    whirl: null,
    rift: null,
    nova: null,
    candle: null,
    dance: null,
    jet: null,
    opensWith: null,
    // The bomb pickup's face — the H-bomb in its bubble, since 0441; it was the bare `bomb` before.
    face: SPRITE.pickupBomb,
    cue: 'bomb',
    lands: 'blast',
    hushes: false,
  },
  /**
   * The seeker's — *"gives the ship a glowing purple aura and supercharges the homing missiles for
   * 10secs. They travel twice as far and do 4x as much damage."* Twice as far is twice the fuse: a
   * seeker flies until its fuse is out (0246), so its life IS its range.
   */
  hunt: {
    label: 'Hunt',
    hint: 'Ten seconds of hunting pods',
    side: 'tubes',
    shot: null,
    becomes: null,
    reach: 0,
    bossShare: 0,
    // One seeker a volley, down the middle, whatever tubes are fitted — 0379; one and not two since
    // 0405, played: *"the big problem was the supercharged missiles."*
    surge: { steps: SURGE_STEPS, aura: SPRITE.auraHunt, pods: { missile: 'homing', count: 1, damage: 4, fuse: 2, pierce: 1 } },
    storm: null,
    whirl: null,
    rift: null,
    nova: null,
    candle: null,
    dance: null,
    jet: null,
    opensWith: null,
    face: SPRITE.pickupSeeker,
    cue: 'hunt',
    lands: null,
    hushes: false,
  },
  /**
   * The forward missiles' since 0375, and the pulse's before it — *"change the autogun supercharge
   * effect over to the regular forward firing missiles."* The golden aura, three times the damage,
   * and missiles that pierce like blades; ten seconds, the seeker surge's length, until it is played.
   */
  overdrive: {
    label: 'Overdrive',
    hint: 'Ten seconds of piercing pods',
    side: 'tubes',
    shot: null,
    becomes: null,
    reach: 0,
    bossShare: 0,
    // One straight missile a volley, down the middle, whatever tubes are fitted — 0379; one since 0405.
    surge: { steps: SURGE_STEPS, aura: SPRITE.auraOverdrive, pods: { missile: 'straight', count: 1, damage: 3, fuse: 1, pierce: BLADE_EDGE } },
    storm: null,
    whirl: null,
    rift: null,
    nova: null,
    candle: null,
    dance: null,
    jet: null,
    opensWith: null,
    // The face of what it is earned from: the forward missiles' pickup.
    face: SPRITE.pickupMissile,
    cue: 'overdrive',
    lands: null,
    hushes: false,
  },
  /**
   * The arc's — *"fires a glowing lightning flickering projectile forward that explodes into a
   * massive lightning blast that sends lightning flickering all across the screen and chains twice
   * for each hit."* Thrown like the bomb, to the bomb's reach, and a storm where the bomb has a blast.
   *
   * ⚠️ **A boss takes a twentieth, once, like the bomb** — 0372's share, because the ask gives the
   * storm no number of its own and it is the bomb's place in the arc's hand. Everything else it
   * reaches takes a strike that kills most bodies outright. Both are play numbers.
   */
  storm: {
    label: 'Storm',
    hint: 'Lightning across the screen',
    side: 'gun',
    shot: 'stormBall',
    becomes: null,
    reach: 80,
    bossShare: 0,
    surge: null,
    // ⚠️ The flicker runs 64 steps since 0379, and ran 32: *"the shuriken and lightning need to last
    // just a .5 sec longer or so, they're too fast atm."* Its cue's after flickers run as long.
    storm: { strikes: 6, chains: 2, reach: 45, damage: 12, bossShare: 0.05, flicker: 8, flickerSteps: 64 },
    whirl: null,
    rift: null,
    nova: null,
    candle: null,
    dance: null,
    jet: null,
    opensWith: null,
    face: SPRITE.pickupArc,
    cue: 'stormThrow',
    lands: 'storm',
    hushes: false,
  },
  /**
   * The shuriken's — *"fires a huge shuriken in a whirlpool shape that gets progressively bigger, the
   * radius needs to be large enough that it lasts until every part of the whirlpool arc will no
   * longer be on screen, it can hit bosses multiple times as it whirlpools around."*
   *
   * ⚠️ **Three arms of eight, and the damage was measured, not asked for** —
   * `docs/decisions/0374-the-storm-and-the-whirlpool.md` has what one whirlpool takes off each boss.
   */
  whirlpool: {
    label: 'Whirlpool',
    hint: 'A spiral of giant blades',
    side: 'gun',
    shot: null,
    becomes: null,
    reach: 0,
    bossShare: 0,
    surge: null,
    storm: null,
    /*
      ⚠️ **AN ARM IS CONTINUOUS, AND THE FIRST ONE WAS NOT.** At a gap of 7 and a twist of 0.35 the
      blades along an arm stood eleven units apart — wider than a blade — so a body between two was
      never touched however often the arm swept it. Five and 0.25 at a blade swelled 2.2 leave no hole
      a body fits through.

      ⚠️ **GROWING 0.6 A STEP SINCE 0379, AND IT WAS 0.7** — *"the shuriken and lightning need to last
      just a .5 sec longer."* It ends when none of it is on the screen, so it lasts longer by growing
      slower; measured at 184 steps before, and `tests/storm.test.ts` holds the new life.
    */
    whirl: { arms: 3, blades: 8, ahead: 60, start: 6, gap: 5, twist: 0.25, grow: 0.6, spin: 0.05, damage: 4, swell: 2.2 },
    rift: null,
    nova: null,
    candle: null,
    dance: null,
    jet: null,
    opensWith: null,
    face: SPRITE.pickupShuriken,
    cue: 'whirlpool',
    lands: null,
    hushes: false,
  },
  /**
   * The shields' — *"if you cap shields, you get a void missile -> it flies forward and creates a
   * massive void zone that negates everything but your ship and bosses (does 10% max boss health
   * damage)."* Thrown to the bomb's reach; the rift is seventy-two units across — most of the lane —
   * and open for two and a half seconds: *"the void bomb needs to last 1 sec longer"*, 0479, from
   * 0377's second and a half.
   *
   * ⚠️ **ON THE WARD'S TRIGGER SINCE 0447, AND IT WAS THE TUBES'** because it is a missile. *"The void
   * bomb will need to have its own unique button."* It is earned off the shield pickup's void face now,
   * and a full shell still spills into one.
   */
  voidMissile: {
    label: 'Void',
    hint: 'A rift that swallows fire',
    side: 'ward',
    shot: 'voidBall',
    becomes: null,
    reach: 80,
    bossShare: 0,
    surge: null,
    storm: null,
    whirl: null,
    rift: { radius: 36, steps: 150, bossShare: 0.1 },
    nova: null,
    candle: null,
    dance: null,
    jet: null,
    opensWith: null,
    // Its own face since 0447 — the swirl in its bubble. It wore the shield's while a shield was the
    // only way to earn one.
    face: SPRITE.pickupVoid,
    cue: 'voidThrow',
    lands: 'rift',
    hushes: true,
  },
  /**
   * The ray's — 0447. *"Nova ring … a huge purple ring bursting out from the ship across the screen,
   * popping what it passes."* Played into place before it was built: *"at burn difficulty seems like
   * it's going to be the default choice if it pops bullets. It should probably share the shield/void
   * cycle instead of the regular weapon cycle"* — so it is the ward's, beside the void, and the bomb
   * pickup never offers it.
   *
   * ⚠️ **THE VOID HOLDS A PLACE; THE NOVA CLEARS A MOMENT.** A rift is a disc that eats everything
   * that enters it for a second and a half; a nova crosses each thing once, the whole screen over in
   * about a second, and leaves nothing behind it. One is where to fly, the other is when to press.
   *
   * ⚠️ **A twentieth of a boss, the bomb's share**, where the void lands a tenth: it reaches the boss
   * whatever the aim, and it is the caddie's opening pair.
   */
  nova: {
    label: 'Nova',
    hint: 'A ring that pops everything',
    side: 'ward',
    shot: null,
    becomes: null,
    reach: 0,
    bossShare: 0,
    surge: null,
    storm: null,
    whirl: null,
    rift: null,
    /*
      2.9 a step — 0533, *"needs to travel slightly slower"*: it was 3.5, the lane's height in 0.55 s
      and the reference view's far corner in 0.95 s; it is 0.67 s and 1.15 s, a sixth slower. It still
      closes past every corner, so it reaches exactly as far.

      The two inner rings — 0533 — trail it by a band and a gap each, a little thinner each time: a
      ring is about seven units of glow across, so ten and nineteen behind leave a dark line between.
    */
    nova: {
      start: 6,
      grow: 2.9,
      band: 3,
      damage: 12,
      bossShare: 0.05,
      rings: [
        { behind: 10, swell: 0.85 },
        { behind: 19, swell: 0.7 },
      ],
    },
    candle: null,
    dance: null,
    jet: null,
    opensWith: null,
    face: SPRITE.pickupNova,
    cue: 'nova',
    lands: null,
    hushes: false,
  },
  /**
   * The Catherine wheel's — 0537, ahead of its gun: *"a roman candle of fireworks blasting out and
   * filling a good chunk of the screen with fireworks."* On the gun trigger, so the bomb pickup offers
   * it to every ship from the day it lands, and the Firebird opens on two once its wheel does.
   *
   * ⚠️ **EIGHT STARS, ONE EVERY HALF BEAT, FANNED AND SWEEPING.** A candle is a tube that fires its
   * stars one after another; held on a moving ship it sprays them, so each leaves where the ship is
   * when it leaves. The reaches alternate near and far, and the fan sweeps the stars from one side of
   * the nose to the other, so eight bursts of twenty-two units tile the screen ahead near and far.
   *
   * ⚠️ **A BURST IS SPARKS AND NOT A FILLED FLASH — 0024, 0457.** Eight bursts in under two seconds is
   * more than three a second; what keeps them under the cap is that a firework's light is thin streaks
   * over most of its area, and `scripts/weigh-flashes.mjs` is what says so, not this paragraph.
   *
   * ⚠️ **A HUNDREDTH OF A BOSS A BURST**, so the bomb's twentieth (0372) is five bursts on the boss; a
   * fan aimed at one measured two to six on the seven bosses. 0537 has the table; they are play numbers.
   */
  candle: {
    /*
      ⚠️ **"Candle", AND IT WAS "Roman candle" UNTIL CI'S FONTS READ IT.** How to play stacks every
      face's label in one column as wide as the widest (0432), so the longest name in the bomb pickup's
      four widens the column for every row and squeezes the words beside it into wrapping. On CI's fonts
      that pushed the guide's Back button off the smallest landscape phone (`tests/layout.browser.test.ts`).
      The face is a roman candle and the hint says fireworks; the name is the shorter word.
    */
    label: 'Candle',
    hint: 'A spray of fireworks ahead',
    side: 'gun',
    shot: null,
    becomes: null,
    reach: 0,
    bossShare: 0,
    surge: null,
    storm: null,
    whirl: null,
    rift: null,
    nova: null,
    candle: { stars: 8, every: 12, fan: 0.55, reaches: [72, 112, 92, 128], star: 'candleStar', burst: 'firework', bossShare: 0.01 },
    dance: null,
    jet: null,
    opensWith: null,
    face: SPRITE.pickupCandle,
    cue: 'candle',
    lands: 'firework',
    hushes: false,
  },
  /**
   * The War Dance — 0593: the ram's special, on the gun trigger. Thrown from the ship, as the whirlpool and
   * the nova are, so it has no shot and nothing goes off: what lands is the ship, and a landing is heard as
   * the ram's own (`ram`), so `lands` is nobody's.
   */
  warDance: {
    label: 'War Dance',
    hint: 'The ship bounces round on its own, ramming',
    side: 'gun',
    shot: null,
    becomes: null,
    reach: 0,
    bossShare: 0,
    surge: null,
    storm: null,
    whirl: null,
    rift: null,
    nova: null,
    candle: null,
    /*
      ⚠️ **FASTER, AND OFF THE WALLS AT A NEW ANGLE EVERY TIME — 0609.** *"The special also needs to look way
      cooler and bounce around the screen more."* At 2.2 on one diagonal it met a wall two or three times in
      its three seconds and drew the same X every time. At 3.4 it meets one every half second or so, and each
      wall turns it onto the next of `angles` — so it covers the whole box rather than one line through it.
      Play numbers, all of them.
    */
    dance: {
      steps: 180,
      speed: 3.4,
      reach: 3,
      damage: 3,
      landGap: 6,
      /*
        ⚠️ **OFF A WALL AS A BALL COMES OFF ONE, AND ROUND AT WHAT IT IS DANCING AT — 0615.** *"It also doesn't have
        good physics on the bounce."* 0609 turned it onto the next of six headings at every wall, which is a ball
        that changes its mind at a wall; a wall reflects it now, and what keeps it off one line through the box
        is what is in the box — every body it cannot break turns it as a bumper does and throws it off faster
        (`kick`), and it bends back at the boss or the nearest body (`pull`). 0615 has the numbers; play numbers.
      */
      heading: 0.62,
      pull: 0.12,
      kick: 1.5,
      kickSteps: 20,
      free: 3,
      flare: [SPRITE.danceFlare0, SPRITE.danceFlare1, SPRITE.danceFlare2, SPRITE.danceFlare3],
      flareHold: 6,
      hum: 24,
      /*
        ⚠️ **A WAVE AT EVERY WALL AND EVERY BODY, BUT ONE A FIFTH OF A SECOND AT MOST — 0613.** *"It currently
        has no aoe."* Six walls a dance and a body every few steps in a wave would be a ring every other step;
        twelve steps apart, a three-second dance sends out fifteen at most. Its edge grows over nine steps and
        fades over six. 0613 has the numbers; play numbers.
      */
      wave: { shot: 'danceWave', gap: 12, grow: 9, fade: 6 },
    },
    jet: null,
    opensWith: 'unity',
    face: SPRITE.pickupDance,
    cue: 'warDance',
    lands: null,
    hushes: false,
  },
  /**
   * The Water Cannon — 0595: the paintball's special, and the page's *"water guns?"*, read as *a jet of water
   * swept across the lane for two seconds.* Nothing is thrown: the jet plays from the ship's own gun, sweeping
   * from one side of the nose to the other and back, and lands on everything it crosses on the blades' clock.
   * Once MMXXVI is open the bomb pickup offers it to every ship, as 0594 opened the War Dance with Unity.
   */
  waterCannon: {
    label: 'Water Cannon',
    hint: 'A jet of water swept across the lane',
    side: 'gun',
    shot: null,
    becomes: null,
    reach: 0,
    bossShare: 0,
    surge: null,
    storm: null,
    whirl: null,
    rift: null,
    nova: null,
    candle: null,
    dance: null,
    /*
      ⚠️ **NINETY LONG AND A CONE, AND IT WAS SEVENTY-TWO AND A COLUMN — 0610.** *"Looks kind of like a laser instead
      of a water spray and needs to be a little bit longer."* A quarter longer: at the end of its swing its tip is
      47 units off the nose where it was 38, so it sweeps 78% of the 120-unit lane where it swept 63%. It leaves the nozzle 2.8 across and opens to 8 at
      its tip, as a hose's spray does, and lands as wide as it is drawn the whole way (0250): half again the area
      the column landed on, on the same clock — a body takes it no more often, it is only in it longer.

      ⚠️ **AND IT FLOWS — 0616.** *"Static and stiff and so doesn't feel like a water spray at all."* Its water takes
      `flight` steps to reach its length, each parcel on the heading it left the nozzle on (`src/sim/stream.ts`): at
      ten, a sixth of a swing, the tip trails the nozzle round by up to 0.55 of a radian at the middle of the
      swing, so the spray bows as it sweeps; it reaches its length a sixth of a second after the press, and the
      last of it flies on for a sixth of a second after the nozzle stops. Twelve was photographed first and curled
      round at the ends of the swing like a whip. A play number.
    */
    jet: { steps: 120, sweep: 0.55, period: 60, length: 90, flight: 10, width: 1.4, tipWidth: 4, damage: 2, landGap: 4 },
    opensWith: 'mmxxvi',
    face: SPRITE.pickupWater,
    cue: 'waterCannon',
    lands: null,
    hushes: false,
  },
};

/**
 * The `kind` the Water Cannon's jet carries in the bolt pool — 0595, beside the serpent's rain (1), a boss's
 * beam (2) and the Catherine wheel's tether (3). Here because the frame lays it and the painter strokes it,
 * and this layer is below both.
 */
export const JET_BOLT_KIND = 4;

/**
 * The Water Cannon's jet — `docs/decisions/0595-the-aqua-duck-paints.md`. For `steps` water leaves the gun's
 * muzzle, the nozzle turned `sweep` radians either side of straight ahead and back once every `period` steps, so
 * it swings across the lane ahead of the ship; each parcel flies on the heading it left on and is `length` out
 * after `flight` steps (0616). It lands on whatever lies within `width` of the stream at the muzzle and
 * `tipWidth` at its end, straight between — a spray that opens (0610) — `damage` a landing, and a body takes it
 * only once every `landGap` steps — 0391's clock, as the blades'. Every number a play number.
 */
export interface Jet {
  readonly steps: number;
  /** Radians either side of straight ahead at the ends of its swing. */
  readonly sweep: number;
  /** Steps for one swing across and back. */
  readonly period: number;
  /** How far it reaches from the muzzle, in world units. */
  readonly length: number;
  /**
   * Steps its water takes to fly from the muzzle to `length` — 0616: every parcel keeps the heading it left on,
   * so the stream bows as it sweeps, opens outward from the press and flies on for this long after `steps`.
   */
  readonly flight: number;
  /** How far either side of its line it lands at the muzzle, in world units. */
  readonly width: number;
  /** And at its far end — 0610: the spray opens between the two, and is drawn exactly that wide. */
  readonly tipWidth: number;
  readonly damage: number;
  readonly landGap: number;
}

/**
 * The War Dance — `docs/decisions/0593-the-hamster-ball-rolls.md`, named for the frenzied hopping a weasel
 * is known for. For `steps` the ship flies itself: it bounces round the player's box at `speed` in the
 * camera's frame, off every edge, ramming everything it crosses as a ram does and heating nothing, and
 * nothing can hurt it while it dances — a ship the player cannot steer is one they cannot dodge with.
 */
export interface Dance {
  /** How long it dances, in steps. */
  readonly steps: number;
  /** How fast it bounces, in world units a step, in the camera's frame. */
  readonly speed: number;
  /** How far from the ship's centre it rams, in world units. */
  readonly reach: number;
  /** What a landing takes off a body. */
  readonly damage: number;
  /** Steps between one landing on a body and the next there — 0391's clock, as the ram's `landGap`. */
  readonly landGap: number;
  /**
   * The heading it is thrown on, in radians off straight across the lane — strictly between 0 and a right
   * angle, so it never runs along a wall it can never leave. After that its walls reflect it and its bodies
   * turn it — 0615, where 0609 took the next of a list of headings at every wall.
   */
  readonly heading: number;
  /**
   * How far it turns toward what it is dancing at, in radians a step — 0615: the boss while one is up, and
   * the nearest body in view otherwise. *"It spends most of its time bouncing … without doing a lot to enemies
   * and barely touches a boss."* A bend and not an aim: a ball at `speed` turning this much a step rounds on a
   * circle `speed / pull` across, so it curves back at its target off the walls rather than flying at it.
   */
  readonly pull: number;
  /**
   * How much faster it leaves a body it did not break, as a multiple of `speed` — 0615: a pinball's bumper,
   * which throws the ball off harder than it arrived. Settles back to `speed` over `kickSteps`.
   */
  readonly kick: number;
  readonly kickSteps: number;
  /**
   * Steps it flies straight off a wall or a body before it bends again — 0615, or a target past a wall would
   * hold it against the wall, bouncing every step.
   */
  readonly free: number;
  /** Its flaring aura's frames, cycled round the ship for as long as it dances, under every shot — 0609. */
  readonly flare: readonly number[];
  /** Steps each frame of the flare is held. */
  readonly flareHold: number;
  /** Steps between one strike of its hum and the next, while it dances (`danceHum`) — 0609. */
  readonly hum: number;
  /** The shockwave it sends out at every wall and every body it lands on — 0613. */
  readonly wave: Wave;
}

/**
 * A dance's shockwave — `docs/decisions/0613-the-dance-is-earned.md`: *"it currently has no aoe so feels like
 * it needs something a bit more interactive there."* A ring off the ship, landing once on every body inside
 * `shot`'s radius as a blast does (`blastInto`), and on a boss at the window, once — and never two inside `gap`.
 */
export interface Wave {
  /**
   * What it is — a row in `SHOTS`: its `radius` is how far it reaches and is drawn, and its `damage` what it
   * takes off each body its edge crosses.
   */
  readonly shot: ShotKind;
  /** Steps between one wave and the next, however many walls and bodies the dance meets inside them. */
  readonly gap: number;
  /** Steps its edge takes to grow from the dance's own reach to the row's radius, landing as it crosses. */
  readonly grow: number;
  /** Steps the spent ring stays at its full reach, fading, landing nothing. */
  readonly fade: number;
}

/**
 * The specials the ward's trigger throws, in the shield pickup's cycle order after the shield itself
 * — 0447. Derived from the table, so a third ward special is a face on both pickups.
 */
export const WARD_KINDS: readonly SpecialKind[] = SPECIAL_KINDS.filter((k) => SPECIALS[k].side === 'ward');

/**
 * WHAT AN UNSPENT ARSENAL BECOMES WHEN THE SHIP CARRYING IT COMES APART — one rung per charge.
 *
 * Asked for in play: *"the player's ship (and only the player's ship) exploding on death should fire
 * all unspent bombs at the player ship's location with an expanding ring based on number of bombs —
 * 0 bombs = half current bomb explosion size, 1 bomb = bomb explosion, 2 bombs = increased explosion
 * size, 3 increased further… effectively a way to give the player some breathing space for when they
 * respawn."*
 * `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`.
 *
 * ⚠️ **HERE rather than in `src/content/shots.ts`, because the ladder is indexed by a fact about the
 * ARSENAL.** The rows are shots; which rung a death lights is a statement about what the player never
 * spent, and this file is what owns that.
 *
 * ⚠️ **The zeroth rung is a real rung and it is half a blast.** A player who died having spent
 * everything still gets something, which is what makes this a beat the player can read rather than a
 * reward that sometimes appears — `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`
 * from the useful direction: *the ship came apart* is an event, and it now always draws one.
 */
export const PYRES: readonly ShotKind[] = ['blastHalf', 'blast', 'blastWide', 'blastWidest'];

/**
 * Which rung a death with `charges` unspent lights.
 *
 * ⚠️ **CLAMPED at the top.** The ask names four rungs, and a run that keeps overflowing its ladders
 * carries more than that; the widest rung already covers the lane, so the top of the ask is the top
 * of the ladder, and everything above it looks the same.
 *
 * ⚠️ **Counted over the WHOLE stack rather than over bombs**: what goes up with the ship is what the
 * ship was carrying, surges included.
 */
export function pyreFor(charges: number): ShotKind {
  const rung = charges < 0 ? 0 : charges > PYRES.length - 1 ? PYRES.length - 1 : Math.floor(charges);
  return PYRES[rung] ?? PYRES[0]!;
}
