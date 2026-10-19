/**
 * A QR code, made here — `docs/decisions/0641-the-save-travels.md`.
 *
 * The Save tab shows the player's whole save as a code a phone's camera opens, and nothing else in the
 * game needs one. A library would be the game's first runtime dependency for a page drawn a few times
 * a year, so this is the symbol written out: byte mode, the lowest error correction (a code read off a
 * lit screen is not a code read off a crumpled label), the smallest version that holds the text, and
 * the mask the standard's own penalty picks.
 *
 * ⚠️ **NOTHING HERE IS TRUSTED BECAUSE IT LOOKS RIGHT.** `tests/qr.test.ts` draws every symbol it
 * makes into pixels and reads it back with a decoder nobody here wrote, across every version a save
 * can need — a symbol off by one module is a picture of a QR code, and only a reader can tell.
 *
 * Pure: no DOM and no clock. `src/app/chrome.ts` draws what this returns.
 */

/** The codewords of error correction per block, by version — level L. Index 0 is unused. */
const ECC_PER_BLOCK = [
  -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30,
  30, 30, 30, 30, 30, 30, 30, 30, 30,
] as const;

/** How many blocks the codewords are split into, by version — level L. Index 0 is unused. */
const BLOCKS = [
  -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21,
  22, 24, 25,
] as const;

/** Level L's two format bits. */
const LEVEL_L = 1;

/** A finished symbol: `size` modules a side, `dark[y][x]` for each. No quiet zone — the drawer adds it. */
export interface QrSymbol {
  version: number;
  size: number;
  dark: boolean[][];
}

/** The modules a version has for data and its correction, after every function pattern. */
function rawModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    result -= (25 * align - 10) * align - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

/** The data codewords a version holds at level L. */
function dataCodewords(version: number): number {
  return Math.floor(rawModules(version) / 8) - (ECC_PER_BLOCK[version] ?? 0) * (BLOCKS[version] ?? 0);
}

/** The most bytes a symbol can hold — version 40 at level L. A longer text has no code. */
export const QR_MOST_BYTES = dataCodewords(40) - 3;

/** The product of two field elements, in GF(2⁸) over the standard's polynomial. */
function multiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

/** The Reed–Solomon divisor of a degree. */
function divisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = multiply(result[j] ?? 0, root);
      if (j + 1 < result.length) result[j] = (result[j] ?? 0) ^ (result[j + 1] ?? 0);
    }
    root = multiply(root, 0x02);
  }
  return result;
}

/** The correction codewords of `data` for `div`. */
function remainder(data: readonly number[], div: readonly number[]): number[] {
  const result = new Array<number>(div.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() ?? 0);
    result.push(0);
    div.forEach((coef, i) => {
      result[i] = (result[i] ?? 0) ^ multiply(coef, factor);
    });
  }
  return result;
}

/** The centres of a version's alignment patterns, along either axis. */
function alignments(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const result = [6];
  for (let pos = version * 4 + 10; result.length < count; pos -= step) result.splice(1, 0, pos);
  return result;
}

/** The standard's eight masks, in its order: whether each flips the module at column `x`, row `y`. */
const MASKS: readonly ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** The data and correction codewords of `bytes` at `version`, interleaved as they are laid. */
function codewords(bytes: Uint8Array, version: number): number[] {
  const capacity = dataCodewords(version);
  const bits: number[] = [];
  const put = (value: number, length: number): void => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  put(0b0100, 4);
  put(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) put(b, 8);
  put(0, Math.min(4, capacity * 8 - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | (bits[i + j] ?? 0);
    data.push(b);
  }
  for (let pad = 0xec; data.length < capacity; pad ^= 0xec ^ 0x11) data.push(pad);

  const blocks = BLOCKS[version] ?? 1;
  const ecc = ECC_PER_BLOCK[version] ?? 0;
  const raw = Math.floor(rawModules(version) / 8);
  const shortBlocks = blocks - (raw % blocks);
  const shortLength = Math.floor(raw / blocks);
  const div = divisor(ecc);
  const split: number[][] = [];
  for (let i = 0, k = 0; i < blocks; i++) {
    const take = shortLength - ecc + (i < shortBlocks ? 0 : 1);
    const part = data.slice(k, k + take);
    k += take;
    const correction = remainder(part, div);
    // A short block carries a hole where a long one has its last data codeword, so the columns line up.
    if (i < shortBlocks) part.push(-1);
    split.push([...part, ...correction]);
  }
  const out: number[] = [];
  for (let i = 0; i < (split[0]?.length ?? 0); i++) {
    for (const block of split) {
      const b = block[i];
      if (b !== undefined && b >= 0) out.push(b);
    }
  }
  return out;
}

/** The standard's penalty for a laid symbol — the lowest of the eight masks is the one drawn. */
function penalty(dark: readonly (readonly boolean[])[]): number {
  const size = dark.length;
  let score = 0;
  const at = (x: number, y: number, across: boolean): boolean => (across ? dark[y]?.[x] : dark[x]?.[y]) === true;
  for (const across of [true, false]) {
    for (let line = 0; line < size; line++) {
      let run = 0;
      let last = false;
      let pattern = '';
      for (let i = 0; i < size; i++) {
        const here = at(i, line, across);
        pattern += here ? '1' : '0';
        if (i > 0 && here === last) run++;
        else {
          if (run >= 5) score += run - 2;
          run = 1;
        }
        last = here;
      }
      if (run >= 5) score += run - 2;
      // A run that looks like a finder, with four light modules on one side — the margin counts as light.
      const padded = '0000' + pattern + '0000';
      for (let i = padded.indexOf('1011101'); i >= 0; i = padded.indexOf('1011101', i + 1)) {
        if (padded.slice(i - 4, i) === '0000' || padded.slice(i + 7, i + 11) === '0000') score += 40;
      }
    }
  }
  let darkCount = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const here = at(x, y, true);
      if (here) darkCount++;
      if (x + 1 < size && y + 1 < size && here === at(x + 1, y, true) && here === at(x, y + 1, true) && here === at(x + 1, y + 1, true)) score += 3;
    }
  }
  const total = size * size;
  score += Math.ceil(Math.abs(darkCount * 20 - total * 10) / total - 1) * 10;
  return score;
}

/**
 * A version never made. jsQR — the reader `tests/qr.test.ts` checks every symbol with, and the reader
 * inside a good share of the web's scanner pages — puts version 23's fourth alignment centre at 74
 * where the standard has 78, so a correct version-23 symbol does not read there. The next version up
 * holds everything it would have, four modules a side larger.
 */
const NEVER = 23;

/** The smallest version that holds `length` bytes, or `null` when none does. */
export function versionFor(length: number): number | null {
  // Four bits of mode, then the count, then the bytes — the count is wider from version 10.
  for (let version = 1; version <= 40; version++) {
    if (version === NEVER) continue;
    if (4 + (version <= 9 ? 8 : 16) + length * 8 <= dataCodewords(version) * 8) return version;
  }
  return null;
}

/** `text`'s bytes as a QR symbol, or `null` when no version holds them. */
export function qrOf(text: string): QrSymbol | null {
  const bytes = new TextEncoder().encode(text);
  const version = versionFor(bytes.length);
  if (version === null) return null;
  const size = version * 4 + 17;
  const dark: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fixed: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (x: number, y: number, on: boolean): void => {
    const row = dark[y];
    const lock = fixed[y];
    if (row === undefined || lock === undefined || x < 0 || x >= size) return;
    row[x] = on;
    lock[x] = true;
  };

  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ] as const) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const ring = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, ring !== 2 && ring !== 4);
      }
    }
  }
  const centres = alignments(version);
  const last = centres.length - 1;
  centres.forEach((cx, i) => {
    centres.forEach((cy, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    });
  });

  const format = (mask: number): void => {
    const data = (LEVEL_L << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const bit = (i: number): boolean => ((bits >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6));
    set(8, 8, bit(7));
    set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  // Reserved before the data is laid, so the zigzag walks round it; drawn for real per mask below.
  format(0);
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const on = ((bits >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, on);
      set(b, a, on);
    }
  }

  const words = codewords(bytes, version);
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        const row = dark[y];
        if (row === undefined || fixed[y]?.[x] === true) continue;
        if (i < words.length * 8) row[x] = (((words[i >>> 3] ?? 0) >>> (7 - (i & 7))) & 1) !== 0;
        i++;
      }
    }
  }

  const apply = (mask: number): void => {
    const flips = MASKS[mask];
    for (let y = 0; y < size; y++) {
      const row = dark[y];
      for (let x = 0; x < size; x++) if (row !== undefined && fixed[y]?.[x] !== true && flips?.(x, y) === true) row[x] = !row[x];
    }
  };
  let best = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < MASKS.length; mask++) {
    apply(mask);
    format(mask);
    const score = penalty(dark);
    if (score < bestScore) {
      best = mask;
      bestScore = score;
    }
    apply(mask);
  }
  apply(best);
  format(best);
  return { version, size, dark };
}
