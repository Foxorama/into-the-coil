/**
 * Cosmo, who keeps Cosmo's Cosmetics — `docs/decisions/0542-cosmos-counter.md`.
 *
 * ⚠️ **THE ALIEN IN THE GILT FRAME, ON THE PLAYER'S WORD.** 0523 drew the family photo the shop sells as
 * three of the alien's own; asked who Cosmo is, the answer was that alien. A shopkeeper selling a picture
 * of their own family is a character for the cost of one face, and the face is the frame's: the family's
 * green, two dark eyes, two antennae with a bead on each.
 *
 * What Cosmo says is the shop's state in a shopkeeper's words — the ware in the window owned, out of reach,
 * or the player's to take — chosen by the shell, never typed in the chrome.
 */

/** Who stands behind the counter, and the lines they have. */
export interface KeeperRow {
  readonly name: string;
  /** Said when the shop is opened, with the ware in the window the player's to buy. */
  readonly greet: string;
  /** Said when the ware in the window is the player's already — `{where}` is where it is fitted. */
  readonly owned: string;
  /** Said when the balance falls short — `{short}` is how many Star Shards. */
  readonly short: string;
  /** Said when the player has just bought what was in the window. */
  readonly sold: string;
  /** Said when the ware in the window is wheels and the ship on the pad has none to try them on. */
  readonly noWheels: string;
}

export const COSMO: KeeperRow = {
  name: 'Cosmo',
  greet: 'Try it on, no charge for looking.',
  owned: 'That one’s yours already — fit it in {where}.',
  short: 'Come back with {short} more Star Shards, friend.',
  sold: 'Pleasure doing business. It suits you.',
  noWheels: 'Lovely set — shame your ship has no wheels to try them on.',
};
