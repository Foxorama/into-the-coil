/**
 * Who keeps each of the hangar's tabs — `docs/decisions/0542-cosmos-counter.md` for Cosmo, and
 * `docs/decisions/0550-every-tab-has-a-keeper.md` for the two who joined them.
 *
 * ⚠️ **THE ALIEN IN THE GILT FRAME, ON THE PLAYER'S WORD.** 0523 drew the family photo the shop sells as
 * three of the alien's own; asked who Cosmo is, the answer was that alien. A shopkeeper selling a picture
 * of their own family is a character for the cost of one face, and the face is the frame's: the family's
 * green, two dark eyes, two antennae with a bead on each.
 *
 * ⚠️ **AND A KEEPER A TAB SINCE 0550**, asked for as *"we need to have someone for the mechanic for
 * Hanging out and the paints and Parts"*: Unity, an Aussie trader mechanic drawn from a least weasel, on
 * Hangin' Out, and MMXXVI, a space duck, on Paint & Parts — each with the line they were given. Cosmo had
 * stood on all three tabs since 0548, and a tab's counter is now its own keeper's.
 *
 * What a keeper says is the tab's state in their own words, chosen by the shell and never typed in the
 * chrome. Only a shop has states to say: the others have their one line.
 */

import type { PortKind } from './port.ts';
import type { Rng } from '../sim/rng.ts';

/** Everyone who keeps a counter in the port. Closed — 0016. */
export const KEEPER_KINDS = ['cosmo', 'unity', 'mmxxvi'] as const;
export type KeeperKind = (typeof KEEPER_KINDS)[number];

/** What a shopkeeper says of the ware in the window, beyond their greeting. */
export interface ShopLines {
  /** Said when the ware in the window is the player's already — `{where}` is where it is fitted. */
  readonly owned: string;
  /** Said when the balance falls short — `{short}` is how many Star Shards. */
  readonly short: string;
  /** Said when the player has just bought what was in the window. */
  readonly sold: string;
  /** Said when the ware in the window is wheels and the ship on the pad has none to try them on. */
  readonly noWheels: string;
  /** 0578: said when the ware in the window waits for another — `{first}` is the one to buy first. */
  readonly first: string;
  /**
   * 0564: said when the shop is walked into, one a visit in turn, until the player looks at something — so
   * the first thing heard is a greeting and never a remark about whatever ware happens to be in the window.
   */
  readonly arrive: readonly string[];
  /** 0564: said when the ware just bought is fitted at the counter. */
  readonly fitted: string;
  /** 0564: said when every ware in the shop is the player's. */
  readonly soldOut: string;
}

/** Who stands behind a counter, what their counter is, and the lines they have. */
export interface KeeperRow {
  readonly name: string;
  /** Said when the tab is opened — and, for a keeper with no shop, all they say. */
  readonly greet: string;
  /** Their figure in the port's atlas — a bust behind the counter or a whole one on it — and the counter. */
  readonly figure: PortKind;
  readonly counter: PortKind;
  /** The two lines on the counter's front: the name, large, and what is done there, under it. */
  readonly sign: readonly [string, string];
  /** What they say of a ware in the window — a shop's, and `null` for a keeper with nothing to sell. */
  readonly shop: ShopLines | null;
  /**
   * Where they may be found when the hangar is opened — 0569: *"after a run finishes the position of the
   * figure can be in a few different random locations, behind the stall, working the ship, out for coffee,
   * something else"*. The first is where they stand before any run. Each keeper's own (0282): which of the
   * dock's places they go to, and what they say there, is the row's.
   */
  readonly spots: readonly [KeeperSpot, ...KeeperSpot[]];
  /**
   * 0611: the keeper whole, as they stand about the dock — their picture in the port's atlas, and where in
   * it they are, in its world units: the soles `feet` below the box's middle (the painter is handed this
   * line and stands them on it), the top of them `tall` over the soles, and `half` their widest either side —
   * those two measured off the baked picture's painted pixels, and what the stand's no-overlap guard reads.
   * Each keeper's own: Unity a least weasel with a wrench on the shoulder, Cosmo a head taller than MMXXVI.
   */
  readonly about: { readonly figure: PortKind; readonly feet: number; readonly tall: number; readonly half: number };
}

/**
 * One place a keeper may be standing — 0569, amended by 0611.
 *
 * - **At the counter**, 0554's: where their box is centred against the counter's and whether they stand
 *   behind it, the counter drawn over them, or on its top — Unity on their bench, the other two behind theirs.
 * - **Away**: nowhere, gone from the counter, which stands empty.
 * - **At one of the dock's places** (`DOCK_PLACES`), whole, their feet on its floor. A place holds one
 *   keeper at a time — the draw is without replacement (`drawSpots`).
 *
 * The line is what their card says while they are there; at the counter, `null` keeps their greeting.
 */
export type KeeperSpot =
  | {
      readonly at: 'counter';
      readonly offset: { readonly along: number; readonly across: number };
      readonly drawn: 'behind' | 'over';
      readonly line: string | null;
    }
  | { readonly at: 'away'; readonly line: string }
  | { readonly at: DockPlaceKind; readonly line: string };

/**
 * ── THE DOCK'S PLACES — 0611 ─────────────────────────────────────────────────────────────────────
 *
 * *"the moving characters can appear on top of each other - and apparently kinda floating in mid air.
 * random locations should be on the elevator, on the ground behind or in front of the vehicle or to the
 * sides, or in their shops."* The places in the room a keeper may be found away from their counter. They
 * are the room's, not a keeper's: one keeper to a place, so two are never drawn in one spot, and no two
 * places' pictures meet (`tests/stand.test.ts`). Which of them a keeper goes to is their row's. Closed — 0016.
 */
export const DOCK_PLACE_KINDS = ['lift', 'behind', 'front', 'left', 'right'] as const;
export type DockPlaceKind = (typeof DOCK_PLACE_KINDS)[number];

/**
 * Where a place is, as the floor a keeper stands on there.
 *
 * - **`lift`**: on the hover-lift's platform, `along` from its middle, riding it up to the mezzanine and down.
 * - **`deck`**: on the deck, `along` from the ship's centre on its cradle and `across` down into the deck
 *   from its top edge, where the back wall stands on it. `drawn` is the depth: **behind** the ship is drawn
 *   before the cradle, so the cradle and the ship stand in front of whoever is there; **over** after the
 *   ship, nearer the player than it is.
 */
export type DockPlace =
  | { readonly floor: 'lift'; readonly along: number }
  | { readonly floor: 'deck'; readonly along: number; readonly across: number; readonly drawn: 'behind' | 'over' };

export const DOCK_PLACES: Record<DockPlaceKind, DockPlace> = {
  // On the lift's platform, its middle — the rail is at its back corner.
  lift: { floor: 'lift', along: 0.5 },
  // At the back of the deck by the ship's tail, against the wall: the cradle's slope and the ship in front.
  behind: { floor: 'deck', along: -19.5, across: 0.6, drawn: 'behind' },
  // Down at the front of the deck, under the ship's nose, in front of the cradle's foot.
  front: { floor: 'deck', along: 6, across: 14, drawn: 'over' },
  // Either side of the cradle, half way down the deck.
  left: { floor: 'deck', along: -34, across: 7, drawn: 'over' },
  right: { floor: 'deck', along: 27, across: 7, drawn: 'over' },
};

/** Whether a spot is one of the dock's places, which a keeper shares with the others one at a time. */
export function isDockPlace(at: KeeperSpot['at']): at is DockPlaceKind {
  return at !== 'counter' && at !== 'away';
}

/**
 * Where every keeper is this visit, drawn into `out` as an index into each row's `spots` — 0611. The keepers
 * are taken in an order the stream shuffles, so no one keeper has first pick of the places; each draws
 * evenly from their spots that are not a place another has already taken. The counter and away are a
 * keeper's own and always there to draw, so every keeper always has somewhere to be.
 */
export function drawSpots(rng: Rng, out: Record<KeeperKind, number>): void {
  const order: KeeperKind[] = [...KEEPER_KINDS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const swap = order[i]!;
    order[i] = order[j]!;
    order[j] = swap;
  }
  const taken: DockPlaceKind[] = [];
  for (const kind of order) {
    const spots = KEEPERS[kind].spots;
    const free: number[] = [];
    spots.forEach((spot, i) => {
      if (!isDockPlace(spot.at) || !taken.includes(spot.at)) free.push(i);
    });
    const pick = free[rng.int(0, free.length - 1)]!;
    out[kind] = pick;
    const at = spots[pick]!.at;
    if (isDockPlace(at)) taken.push(at);
  }
}

/** Cosmo, whose lines the shell reads by name — `src/app/mount.ts`'s `keeperLine`. */
export const COSMO = {
  name: 'Cosmo',
  greet: 'Try it on, no charge for looking.',
  figure: 'cosmo',
  counter: 'stall',
  sign: ['COSMO’S', 'COSMETICS'],
  shop: {
    owned: 'That one’s yours already — fit it in {where}.',
    short: 'Come back with {short} more Star Shards, friend.',
    sold: 'Pleasure doing business. It suits you.',
    noWheels: 'Lovely set — shame your ship has no wheels to try them on.',
    // 0578: the second tube of a kind, which waits for the first.
    first: 'That one goes beside the {first} — take that first, friend.',
    arrive: [
      'Welcome, welcome! Try anything on — no charge for looking.',
      'Back again? Have a browse, friend.',
      'Ah, a pilot with taste. Look around.',
      'Fresh stock on every shelf. Well — the same stock, freshly dusted.',
    ],
    fitted: 'There. Wear it well.',
    soldOut: 'You’ve cleaned me out, friend. More stock soon.',
  },
  spots: [
    // At the stall, a head over the counter, a unit to the bar's side of its middle, as 0542 stood them.
    { at: 'counter', offset: { along: -1, across: -5 }, drawn: 'behind', line: null },
    { at: 'away', line: 'Out on a stock run — honesty box is on the counter, friend.' },
    // 0611: about the dock, whole, and the shop open whatever Cosmo is doing.
    { at: 'lift', line: 'Just heading up to the shop, friend — ride along?' },
    { at: 'behind', line: 'Just admiring the lines on her. Shop’s open — I’ll be right there.' },
    { at: 'front', line: 'There you are! Fine machine. Finer still with a little something from the shop.' },
    { at: 'left', line: 'Taking in the view, friend. Shop’s open whenever you are.' },
    { at: 'right', line: 'Lovely, lovely. Picture her in something new.' },
  ],
  // 0611: whole, in the waistcoat and bow tie, a hand up in a wave.
  about: { figure: 'cosmoAbout', feet: 7, tall: 14.2, half: 3.7 },
} as const satisfies KeeperRow;

export const KEEPERS: Record<KeeperKind, KeeperRow> = {
  cosmo: COSMO,
  /*
    ⚠️ **UNITY: THE TRADER MECHANIC, A LEAST WEASEL — 0550.** *"an aussie trader mechanic for Hangin Out
    named Unity - I bring it all together for the quote - androgynous based on a Least Weasel"*. The tab
    where the loadout and the dash are put together, kept by the one who puts them together. The Aussie is
    in the picture — a bush hat and a tradie's hi-vis — and not put on in the line, which is theirs as given.

    ⚠️ **SMALL, ON THE BENCHTOP, LEANING ON A GIANT WRENCH — 0554.** *"Least weasel mechanic should be small
    and standing on the benchtop in overalls. Leaning against a giant wrench that is propped up against one
    of the columns of the trade stand."* A least weasel is the smallest carnivore there is, and a bust
    Cosmo's size behind the counter made them a person-sized one. So they stand on the top, whole and about
    half the counter's height, in navy overalls over the hi-vis, a shoulder against a wrench taller than
    they are that leans on the post by the pad. The box is centred off the bench's middle so the wrench's
    jaw meets that post and their boots the timber (`paintUnityStanding`).
  */
  unity: {
    name: 'Unity',
    greet: 'I bring it all together.',
    figure: 'unity',
    counter: 'bench',
    sign: ['UNITY’S', 'TRADE & REPAIR'],
    shop: null,
    spots: [
      // On the bench, against the wrench, as 0554 stood them.
      { at: 'counter', offset: { along: 7, across: -4.5 }, drawn: 'over', line: null },
      { at: 'away', line: 'Gone for a flat white. Back in a tick.' },
      // 0611: about the dock, the wrench over a shoulder. 0569's spot on the ship's roof went — a hovering roof is not a floor.
      { at: 'lift', line: 'Just ducking up to the bench. Won’t be a tick.' },
      { at: 'behind', line: 'Having a squiz round the back of her. She’ll be right.' },
      { at: 'front', line: 'Righto, she’s all yours. I bring it all together.' },
      { at: 'left', line: 'Just standing back for a look. She’s coming together.' },
      { at: 'right', line: 'Tightened a few things up. Bonza.' },
    ],
    // 0611: whole and upright, the giant wrench on a shoulder — about eight units of weasel, the wrench over them.
    about: { figure: 'unityAbout', feet: 7, tall: 11.1, half: 3.3 },
  },
  /*
    ⚠️ **MMXXVI: THE SPACE DUCK — 0550.** *"for paints and parts a space duck named MMXXVI - we'll make it
    look good"*. The year in numerals is the name as given; the paint shop's booth is theirs.

    ⚠️ **A BILL AND A NECK — 0555.** *"the space duck needs to be cuter and have a proper bill and not a
    hamburger mouth, also needs a neck"*. Turned three quarters to the pad, on a neck out of the collar
    ring, the booth a painter's mess round them (`paintMmxxvi`, `paintBooth`).

    ⚠️ **TWO UNITS LOWER — 0556.** *"Lower the duck a bit so they're head is visible without being blocked
    by the stand"*: at Cosmo's five up, the beret sat in the awning's scallops.
  */
  mmxxvi: {
    name: 'MMXXVI',
    greet: 'We’ll make it look good.',
    figure: 'mmxxvi',
    counter: 'booth',
    sign: ['MMXXVI', 'PAINT & PARTS'],
    shop: null,
    spots: [
      // Behind the booth, as 0556 lowered them.
      { at: 'counter', offset: { along: -1, across: -3 }, drawn: 'behind', line: null },
      { at: 'away', line: 'Out for more paint. Touch nothing wet.' },
      // 0611: about the dock, whole, a brush in hand.
      { at: 'lift', line: 'Going up for more colour. Mind the wet bits.' },
      { at: 'behind', line: 'Checking the finish. Hold still — it’s nearly perfect.' },
      { at: 'front', line: 'Stand there. No — there. The light’s better.' },
      { at: 'left', line: 'Stepping back to see the whole of her. Art needs distance.' },
      { at: 'right', line: 'From this side she really sings. We’ll make it look good.' },
    ],
    // 0611: whole, in the suit and the apron, the bubble on, a brush up.
    about: { figure: 'mmxxviAbout', feet: 7, tall: 13.4, half: 3.3 },
  },
};
