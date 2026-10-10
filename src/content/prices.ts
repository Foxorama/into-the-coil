/**
 * What Cosmo's charges — `docs/decisions/0585-the-prices-rise.md`.
 *
 * Played: *"Increase the cost of everything by 15%"*. Every row keeps the number it was asked at — 250 for
 * the cheaper stuff, 400 for the thrusters, 500 a tube, 1000 for the spinners — and is charged that number
 * raised by `PRICE_RISE`, so the ask each price came from is still on its row and the rise is one number.
 *
 * ⚠️ **A WHOLE SHARD, ROUNDED TO THE NEAREST.** A balance is a whole number (0522), so 250 raised by
 * fifteen per cent is charged 288, not 287.5.
 */

/** How much more everything costs than it was asked at — fifteen per cent. */
export const PRICE_RISE = 1.15;

/** What a ware asked at `asked` shards is charged. */
export function priced(asked: number): number {
  return Math.round(asked * PRICE_RISE);
}
