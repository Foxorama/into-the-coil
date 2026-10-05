/**
 * The run: how many lives are left, how deep it has got, and what the ship is carrying.
 *
 * `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` is the whole of what this
 * file decides; the reasoning is there and is not repeated here, per
 * `docs/decisions/0029-the-tracked-record-is-the-record.md`.
 *
 * ⚠️ **Plain data, because this is the thing `save/` will serialise** — no `Map`, no `Set`, no class
 * instance. `tests/state-shape.test.ts` holds it, and the reason it is worth a guard is that a `Map`
 * survives `structuredClone` and comes back from `JSON.parse(JSON.stringify(…))` as `{}` with no
 * error anywhere.
 */

import { OPENING_CHARGES, SIDES, SPECIALS, type Side, type SpecialKind } from '../../content/specials.ts';
import { UPGRADE_TIERS, tiersOf, type UpgradeKind } from '../../content/pickups.ts';
import { DIFFICULTIES, type DifficultyKind } from '../../content/difficulty.ts';
import { SHIPS, type ShipKind } from '../../content/ships.ts';
import { WEAPONS, type WeaponKind } from '../../content/weapons.ts';
import type { MissileKind } from '../../content/missiles.ts';
import type { LevelTally } from '../../content/score.ts';
import { DEFAULT_CREDIT, type CreditKind } from '../../content/credits.ts';
import { DEFAULT_GOLFER, GOLFERS } from '../../content/golfers.ts';

/**
 * The ship a run that has not begun is carrying — the default pilot's, so a state nobody is playing
 * resolves to a real ship rather than a sentinel. `begin` always sets one.
 */
const DEFAULT_SHIP: ShipKind = GOLFERS[DEFAULT_GOLFER].ship;

/**
 * The tier a run that has not begun is carrying.
 *
 * ⚠️ **`begin` always sets one, so nothing reads this except a state nobody is playing.** It is the
 * middle tier because that is the one the game is tuned for — a default that is a real answer,
 * rather than a sentinel that would have to be checked for.
 */
export const DEFAULT_DIFFICULTY: DifficultyKind = 'savior';

/**
 * Lives a run starts with, on a given tier.
 *
 * ⚠️ **`STARTING_LIVES` was the single description of this and is now a column in
 * `src/content/difficulty.ts`.** 0039 put the number in the same category as `SHIP_SPEED` — placed
 * by a hand, settled by playing — and that is still true of each of the three; what has changed is
 * that there are three of them and a tier is what picks one.
 * `docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md`.
 *
 * Nothing may assert on the values. What the tests hold are the relationships that must be true at
 * any value.
 */
export function livesFor(difficulty: DifficultyKind): number {
  return DIFFICULTIES[difficulty].lives;
}

/**
 * The arsenal: one newest-first stack per trigger — 0376. Plain data, a record over `SIDES`.
 */
export type Arsenal = Readonly<Record<Side, readonly SpecialKind[]>>;

/** Every charge on every stack — what goes up with the ship (0079) and what the readout totals. */
export function chargesIn(arsenal: Arsenal): number {
  let sum = 0;
  for (const side of SIDES) sum += arsenal[side].length;
  return sum;
}

/** `arsenal` with `side`'s stack replaced by `stack` and every other stack as it was. */
function withStack(arsenal: Arsenal, side: Side, stack: readonly SpecialKind[]): Arsenal {
  return {
    gun: side === 'gun' ? stack : arsenal.gun,
    tubes: side === 'tubes' ? stack : arsenal.tubes,
    ward: side === 'ward' ? stack : arsenal.ward,
  };
}

/**
 * What a run begins with: `OPENING_CHARGES` of the ship's own gun's special on that special's
 * trigger, and nothing else — 0053, 0373, 0376, and 0441's *"a game starts with two bombs"*, a bomb
 * being what the ask calls every gun's special.
 *
 * ⚠️ **ONE CALLER, `begin`.** A death stopped calling it in
 * `docs/decisions/0085-a-death-does-not-cost-the-bombs.md` and a continue in
 * `docs/decisions/0372-a-death-keeps-the-ladders.md`: a run is stocked once.
 *
 * ⚠️ **A function rather than a constant**, so nothing can hold a reference to the array a run is
 * using and mutate the next run's starting kit through it.
 */
/*
  ⚠️ **AND THE TIER'S OWN WARD, SINCE 0447** — Burn's void, under the ship's own pair so the ship's
  own is thrown first. Not for a ship whose own special is already the ward's: *"if the player starts
  as feather with the nova ring … they don't get a bonus void bomb on top."*
*/
/*
  ⚠️ **THE FITTED SPECIAL SINCE 0524, AND THE SHIP'S OWN BY DEFAULT.** The hangar may fit a ship with
  another won ship's special — *"pair the shuriken special with the lightning gun once you've unlocked
  both"* — and a run opens on two of whichever is fitted. The ward rule reads the side of THAT special,
  so a fighter fitted with the nova opens with no void on top, as the caddie always has.
*/
export function startingArsenal(ship: ShipKind, difficulty: DifficultyKind, special: SpecialKind = ownSpecial(ship)): Arsenal {
  const own = special;
  const side = SPECIALS[own].side;
  const opening: SpecialKind[] = [];
  for (let i = 0; i < OPENING_CHARGES; i++) opening.push(own);
  const ward: SpecialKind[] = [];
  if (side !== 'ward') for (const kind of DIFFICULTIES[difficulty].opensWith) ward.push(kind);
  return withStack({ gun: [], tubes: [], ward }, side, side === 'ward' ? [...ward, ...opening] : opening);
}

/** The special a ship's own gun brings — 0441's opening, and since 0524 the hangar's default. */
export function ownSpecial(ship: ShipKind): SpecialKind {
  return WEAPONS[SHIPS[ship].weapon].special;
}

export interface RunState {
  /**
   * How hard this run is, chosen before it started and fixed for its length.
   *
   * ⚠️ **On the RUN, because it is a property of the run and because `save/` has to store it.** A
   * saved run resumed at a different tier would be a different run, and the resume
   * (`docs/game.md`) is explicitly an interruption hedge rather than a second chance.
   *
   * ⚠️ **Not on `Assists`, and it never may be.**
   * `docs/decisions/0024-the-accessibility-floor-is-settings.md` closes that ladder with *no assist
   * may ever make the game harder*, which makes two of these three tiers unrepresentable there.
   */
  difficulty: DifficultyKind;
  /** Lives left. A death spends one; at zero the run is over. */
  lives: number;
  /** Which level, zero-based. */
  level: number;
  /**
   * What the triggers throw: a stack per side, one entry per charge, and the LAST is thrown next.
   *
   * ⚠️ **A STACK OF KINDS SINCE 0373, AND TWO OF THEM SINCE 0376.** 0373 put every charge on one stack
   * behind one trigger — *"one trigger, fires the charges in descending order earnt from most recent
   * pickup"* — and played, *"having one bomb queue means that you might not even have the autofire
   * gun equipped when you try to use that bomb."* So the gun's specials and the tubes' are two stacks
   * on two triggers, each still newest-first.
   */
  arsenal: Arsenal;
  /**
   * Auto-fire upgrades, in the order they were taken.
   *
   * ⚠️ **A LIST rather than a tier, for the same reason the arsenal is** — and this is where that
   * shape stops being an argument and starts being used. `src/content/pickups.ts` resolves the whole
   * list into a weapon every time it changes, so *"two rapids and a spread"* is a statement the save
   * can hold and the reducer can compare. A running `fireEvery` on the run would be a number nobody
   * could undo, and a death has to undo it.
   */
  upgrades: readonly UpgradeKind[];
  /**
   * The ship this run is flown in — 0441.
   */
  ship: ShipKind;
  /**
   * The gun it is flown with — 0525: the ship's own, or since the hangar may fit one, another's. Fixed
   * for the run, as the gun always was (0441); on the run and not read off the ship, because the shell
   * resolves the world's ship row from the two (`fitted`) every time the run is rearmed.
   */
  gun: WeaponKind;
  /**
   * Which tube the missile ladder is on — 0233.
   *
   * ⚠️ **In the RUN, beside the list, because the save has to hold it.** A missile pickup of a kind
   * the ship is not carrying switches the tube, so *which tube* is a thing the list alone cannot say.
   *
   * ⚠️ **Nothing but a pickup changes it — 0372.** A death and a continue both keep the kind with the
   * ladder, so the ship's own tube is only ever what `begin` issues.
   */
  missile: MissileKind;
  /**
   * Every cleared level's account, in the order they were cleared — 0428. The run's score is these
   * added up (`bankedScore`); the level being flown counts on the frame and joins them at its clear.
   *
   * ⚠️ **A death keeps them and a continue empties them — 0438.** The score is the CREDIT's, as a
   * cabinet's is: the credit that ran out goes on the table with the level it reached, and the one
   * the continue buys starts from nothing on the level where the last one ended.
   */
  tallies: readonly LevelTally[];
  /** Continues taken this run — 0428. Since 0438, which credit this is, counting from nought. */
  continues: number;
  /**
   * Whether this run may be continued when it runs out — 0517. `src/content/credits.ts` is the table.
   *
   * ⚠️ **ON THE RUN, COPIED BY `begin`, on `difficulty`'s terms**: chosen on the title before the run
   * and fixed for its length. `src/state/root.ts` reads it to send a run that ran out to the run-over
   * screen or the game-over one, because the settings slice may take part in no agreement.
   */
  credits: CreditKind;
}

/** Every cleared level's total added up — the score before the level being flown. */
export function bankedScore(run: RunState): number {
  let sum = 0;
  for (const tally of run.tallies) sum += tally.total;
  return sum;
}

/** Every cleared level's bonus added up. */
export function bankedBonus(run: RunState): number {
  let sum = 0;
  for (const tally of run.tallies) sum += tally.bonus;
  return sum;
}

export type RunAction =
  /*
    ⚠️ **A RUN BEGINS IN A SHIP — 0441.** The pilot is a setting, chosen before the run, and the shell
    resolves it to the ship it flies; the run keeps the ship rather than the pilot, because the ship is
    what the reducer and the frame read.
  */
  // 0517: and on its credits, which the title chose.
  /*
    0524: and on the special the hangar fitted, or — absent — the ship's own gun's. The default lives
    here, in shared code; the hangar's fitting is the instance, and the shell always passes it.
  */
  // 0525: and with the gun the hangar fitted, or — absent — the ship's own, on the special's terms.
  | { slice: 'run'; type: 'begin'; difficulty: DifficultyKind; ship: ShipKind; credits: CreditKind; special?: SpecialKind; gun?: WeaponKind }
  | { slice: 'run'; type: 'continued' }
  | { slice: 'run'; type: 'lifeLost' }
  | { slice: 'run'; type: 'took'; special: SpecialKind }
  | { slice: 'run'; type: 'spent'; side: Side }
  /*
    ⚠️ **AN UPGRADE NAMES ITS KIND SINCE 0233.** The pickup that was taken was showing one face of
    its ladder, and the face is which tube it was offering. The gun's half went with its ladder (0441).
  */
  | { slice: 'run'; type: 'upgraded'; upgrade: 'missile'; kind: MissileKind }
  | { slice: 'run'; type: 'levelCleared' }
  // A cleared level's account, banked — 0428. Before `levelCleared`, which moves the level on.
  | { slice: 'run'; type: 'scored'; tally: LevelTally };

/**
 * No run in progress.
 *
 * ⚠️ **Zero lives rather than three**, which is what makes `begin` the only way into a run: a state
 * that is already stocked would let a reload or a stray dispatch drop the player into a half-run
 * whose level and arsenal came from nowhere.
 */
export const initialRun: RunState = {
  lives: 0,
  level: 0,
  arsenal: { gun: [], tubes: [], ward: [] },
  upgrades: [],
  ship: DEFAULT_SHIP,
  gun: SHIPS[DEFAULT_SHIP].weapon,
  missile: SHIPS[DEFAULT_SHIP].missile,
  difficulty: DEFAULT_DIFFICULTY,
  tallies: [],
  continues: 0,
  credits: DEFAULT_CREDIT,
};

export function reduceRun(state: RunState, action: RunAction): RunState {
  switch (action.type) {
    case 'begin':
      return {
        lives: livesFor(action.difficulty),
        level: 0,
        arsenal: startingArsenal(action.ship, action.difficulty, action.special ?? ownSpecial(action.ship)),
        upgrades: [],
        ship: action.ship,
        gun: action.gun ?? SHIPS[action.ship].weapon,
        missile: SHIPS[action.ship].missile,
        difficulty: action.difficulty,
        tallies: [],
        continues: 0,
        credits: action.credits,
      };
    case 'continued':
      /*
        A CONTINUE — `docs/decisions/0068-a-run-over-is-a-continue.md`.

        ⚠️ **THE LIVES ARE REFILLED AND NOTHING ELSE MOVES** —
        `docs/decisions/0372-a-death-keeps-the-ladders.md`, in the ask's own words: *"you don't
        lose power ups on death or continue, you keep the level you had."* 0068 sent the ship back to
        the starting kit with no upgrades and 0085 reset the charges; both are gone, and the level
        index staying put is no longer the only thing a continue keeps. The charges are kept too, and
        the +1 a clear used to grant was taken away in the same ask to pay for it.

        ⚠️ **The tier is carried, never re-chosen.** It is a property of the run
        (`docs/decisions/0047-…`), and this is still the same run — a continue that dropped the
        player onto the middle tier because that is the default would be the game quietly changing
        the game.

        ⚠️ **Not conditioned on the lives being zero.** The reducer is not the place to find out
        whether the shell asked at a sensible moment, on the same terms `lifeLost` and `spent` give
        for clamping rather than throwing. Nothing but the run-over screen dispatches it, and the
        run-over screen is the only screen a run with no lives can be on —
        `src/state/root.ts` holds that as an agreement.
      */
      return {
        lives: livesFor(state.difficulty),
        level: state.level,
        arsenal: state.arsenal,
        upgrades: state.upgrades,
        ship: state.ship,
        gun: state.gun,
        missile: state.missile,
        difficulty: state.difficulty,
        /*
          ⚠️ **THE SCORE STARTS AGAIN — 0438**, reversing 0428's *a continue keeps it*: *"the score
          … needs to reset on a continue with highscores tracking score and level reached."* The
          credit that ran out was put on the table by the shell before this landed, so nothing it
          scored is lost; it is just no longer this credit's.
        */
        tallies: [],
        continues: state.continues + 1,
        credits: state.credits,
      };
    case 'lifeLost':
      /*
        ⚠️ **A DEATH COSTS THE LIFE AND NOTHING ELSE** —
        `docs/decisions/0372-a-death-keeps-the-ladders.md`. 0085 left the arsenal alone; 0372 leaves
        the ladders and both kinds alone as well, so the ship that comes back is the ship that came
        apart. 0039's *"back to the ship's base weapon"*, 0066's scatter and 0266's restoring of it
        are all reversed by that one ask, and the scatter is deleted rather than left to throw an
        empty ring.

        ⚠️ **Clamped at zero, never below.** Nothing should dispatch this at zero lives, and the
        reducer is not the place to find out whether anything did: a negative life count would
        propagate silently into the save schema and into whatever renders a life counter.
      */
      return state.lives <= 0
        ? state
        : {
            lives: state.lives - 1,
            level: state.level,
            arsenal: state.arsenal,
            upgrades: state.upgrades,
            ship: state.ship,
            gun: state.gun,
            missile: state.missile,
            difficulty: state.difficulty,
            tallies: state.tallies,
            continues: state.continues,
            credits: state.credits,
          };
    case 'took': {
      // Its charges go on TOP of its own side's stack, so what was earned last is thrown first — 0373, 0376.
      const side = SPECIALS[action.special].side;
      // One charge a take, of every kind, since 0441: *"a player can pick up any type and get a bomb
      // of that type."*
      const arsenal = withStack(state.arsenal, side, [...state.arsenal[side], action.special]);
      return {
        lives: state.lives,
        level: state.level,
        arsenal,
        upgrades: state.upgrades,
        ship: state.ship,
        gun: state.gun,
        missile: state.missile,
        difficulty: state.difficulty,
        tallies: state.tallies,
        continues: state.continues,
        credits: state.credits,
      };
    }
    case 'spent': {
      /*
        ⚠️ **The top of that side's stack, and an empty stack is a no-op** — 0373, 0376. The shell
        reads the top before it dispatches this, so the two agree on which special was thrown; the
        reducer is not the place to find out whether the shell asked for something that was not there.
      */
      const spentFrom = state.arsenal[action.side];
      if (spentFrom.length === 0) return state;
      const left = spentFrom.slice(0, -1);
      return {
        lives: state.lives,
        level: state.level,
        arsenal: withStack(state.arsenal, action.side, left),
        upgrades: state.upgrades,
        ship: state.ship,
        gun: state.gun,
        missile: state.missile,
        difficulty: state.difficulty,
        tallies: state.tallies,
        continues: state.continues,
        credits: state.credits,
      };
    }
    /*
      ── `gainedLife` WAS HERE, AND ITS REMOVAL IS THE LOUDEST THING IN 0082 ────────────────────────

      It added one to `lives` with no ceiling, on the grounds that *a level author decides how many
      are findable* — `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md`'s
      replacement for lives that refill at a level boundary.

      ⚠️ **`docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` took the extra life off the
      field**, on the ask's own reasoning: *"a shield is an extra life anyway and it's far more game
      impactful and meaningful."* It is — a shield stops the death happening, so it also keeps the
      arsenal a death would cost. **But nothing grants a life any more, so a run's complement can only
      go down**, and 0039's replacement now has nothing behind it.

      ⚠️ **Deleted rather than left dispatchable, and that is the honest half.** An action nothing
      sends is a rule nobody can test — `src/content/specials.ts` argues exactly this about `took`,
      which had been in that state since 0039 and is only now cashed. Leaving a door ajar for a life
      source that does not exist would make this reducer describe a game that is not being played.

      ⚠️ **What makes it survivable today is `docs/decisions/0068-a-run-over-is-a-continue.md`'s free
      continue**, which is deliberate and temporary. The day that stops being free is the day this
      needs an answer, and 0082 says so rather than leaving it to be rediscovered.
    */
    case 'upgraded': {
      /*
        ── A DIFFERENT KIND KEEPS THE COUNT — 0256, amending 0233 ─────────────────────────────────

        0233 started the new gun's ladder again at one rung, on *"they start from level one with
        that weapon upgrade"*. Played with the mid-bosses in: *"picking up a new weapon/missile type
        doesn't reset your power count — it's too punishing when you accidentally get a pickup with
        a lot of enemies on screen or right before a boss."* The ladder is the ship's and the kind is
        what it is fitted to: a pickup of another kind switches the kind and climbs the same ladder,
        so the list never loses an entry here and the hull keeps its tier through a switch.

        ⚠️ **CLAMPED AT THE CAP HERE rather than trusted to `tiersOf`.** A pickup of another kind
        at a full ladder is an upgrade (`effectOf` — the ship changes), and it used to be the one
        way the list could grow past `UPGRADE_TIERS` of a kind; it switches and adds nothing now, so
        the list is the tier and the save holds nothing the ladder cannot read.
      */
      // One rung a pickup: 0243's `count` went with the scatter that was its only sender — 0372.
      // The tubes are the one ladder since 0441; the gun is the ship's.
      const room = UPGRADE_TIERS - tiersOf(state.upgrades, action.upgrade);
      const upgrades = room > 0 ? [...state.upgrades, action.upgrade] : state.upgrades;
      return {
        lives: state.lives,
        level: state.level,
        arsenal: state.arsenal,
        upgrades,
        ship: state.ship,
        gun: state.gun,
        missile: action.kind,
        difficulty: state.difficulty,
        tallies: state.tallies,
        continues: state.continues,
        credits: state.credits,
      };
    }
    case 'levelCleared':
      /*
        ⚠️ **Lives and arsenal are untouched, and that is the whole of what "carry forward" means.**
        `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` amended `docs/game.md`
        to say upgrades cross a LEVEL boundary and not a death, and this line is the level boundary.
        A clear that reset anything would be the death rule wearing the wrong name.
      */
      /*
        ⚠️ **A clear no longer grants a charge** — `docs/decisions/0372-a-death-keeps-the-ladders.md`
        takes 0053's *"gains one per level cleared"* away, in the ask's words: *"it should be more
        than balanced by the fact that you're keeping them all on continues."*
      */
      return {
        lives: state.lives,
        level: state.level + 1,
        arsenal: state.arsenal,
        upgrades: state.upgrades,
        ship: state.ship,
        gun: state.gun,
        missile: state.missile,
        difficulty: state.difficulty,
        tallies: state.tallies,
        continues: state.continues,
        credits: state.credits,
      };
    case 'scored':
      // Appended and nothing else moves: the account is the frame's, the run only keeps it — 0428.
      return {
        lives: state.lives,
        level: state.level,
        arsenal: state.arsenal,
        upgrades: state.upgrades,
        ship: state.ship,
        gun: state.gun,
        missile: state.missile,
        difficulty: state.difficulty,
        tallies: [...state.tallies, action.tally],
        continues: state.continues,
        credits: state.credits,
      };
    default: {
      // Adding a member to `RunAction` fails to compile HERE, per
      // `docs/decisions/0016-a-hub-enumerates-kinds.md`'s fifth defeat.
      const unhandled: never = action;
      return unhandled;
    }
  }
}
