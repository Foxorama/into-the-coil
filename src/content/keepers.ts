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
   * something else"*. The first is where they stand before any run. Each keeper's own (0282): a whole figure
   * may stand on the ship's roof, a bust can only look over it.
   */
  readonly spots: readonly [KeeperSpot, ...KeeperSpot[]];
}

/**
 * One place a keeper may be standing — 0569. Their figure's centre in the port's units from the place
 * named, drawn behind or over what is there; or nowhere, gone from the counter, which stands empty. The line
 * is what their card says while they are there, and `null` keeps their greeting.
 *
 * At the counter it is 0554's: where their box is centred against the counter's and whether they stand
 * behind it, the counter drawn over them, or on its top — Unity on their bench, the other two behind theirs.
 */
export interface KeeperSpot {
  readonly at: 'counter' | 'ship' | 'away';
  readonly offset: { readonly along: number; readonly across: number };
  readonly drawn: 'behind' | 'over';
  readonly line: string | null;
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
    // Looking the ship over from behind it, the head over its roof.
    { at: 'ship', offset: { along: 4, across: -7.5 }, drawn: 'behind', line: 'Just admiring the lines on her. Shop’s open — I’ll be right there.' },
    { at: 'away', offset: { along: 0, across: 0 }, drawn: 'behind', line: 'Out on a stock run — honesty box is on the counter, friend.' },
  ],
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
      // Up on the ship's roof, wrench and all — small enough to stand there.
      { at: 'ship', offset: { along: -2, across: -9.5 }, drawn: 'over', line: 'Just tightening a few things up top. She’ll be right.' },
      { at: 'away', offset: { along: 0, across: 0 }, drawn: 'over', line: 'Gone for a flat white. Back in a tick.' },
    ],
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
      // Behind the ship, looking over its roof at the paint.
      { at: 'ship', offset: { along: 6, across: -7.5 }, drawn: 'behind', line: 'Checking the finish. Hold still — it’s nearly perfect.' },
      { at: 'away', offset: { along: 0, across: 0 }, drawn: 'behind', line: 'Out for more paint. Touch nothing wet.' },
    ],
  },
};
