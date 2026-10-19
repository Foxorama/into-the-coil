import { describe, expect, it } from 'vitest';
import jsQR from 'jsqr';
import { QR_MOST_BYTES, qrOf, versionFor, type QrSymbol } from '../src/app/qr.ts';

/**
 * THE CODE READS BACK — `docs/decisions/0641-the-save-travels.md`.
 *
 * ⚠️ **READ BY A DECODER NOBODY HERE WROTE**, because a symbol and a check written by one author share
 * every misreading of the standard between them (0027). Each symbol is drawn into pixels with its quiet
 * zone, the way the Save tab draws it, and handed to jsQR as a camera frame would be.
 *
 * ⚠️ **EVERY VERSION, AT THE MOST IT HOLDS.** A version's block split, its alignment grid and, from 7,
 * its version bits are each their own way to be wrong, and the full symbol is the one that uses all of
 * its codewords — a short text would leave the last block's errors in padding nobody reads.
 */

/** The symbol as an RGBA frame: `scale` pixels a module, four modules of quiet zone round it. */
function frameOf(symbol: QrSymbol, scale: number): { data: Uint8ClampedArray; side: number } {
  const side = (symbol.size + 8) * scale;
  const data = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let y = 0; y < symbol.size; y++) {
    for (let x = 0; x < symbol.size; x++) {
      if (symbol.dark[y]?.[x] !== true) continue;
      for (let py = 0; py < scale; py++) {
        for (let px = 0; px < scale; px++) {
          const at = (((y + 4) * scale + py) * side + (x + 4) * scale + px) * 4;
          data[at] = 0;
          data[at + 1] = 0;
          data[at + 2] = 0;
        }
      }
    }
  }
  return { data, side };
}

/** A text of `length` characters off the code's own alphabet, the same for a length on every run. */
function textOf(length: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let seed = length * 2654435761;
  let out = '';
  for (let i = 0; i < length; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    out += alphabet[(seed >>> 16) % alphabet.length];
  }
  return out;
}

/** The longest text each version holds. */
function fullest(): Map<number, number> {
  const most = new Map<number, number>();
  for (let length = 1; length <= QR_MOST_BYTES; length++) {
    const version = versionFor(length);
    if (version !== null) most.set(version, length);
  }
  return most;
}

describe('a QR code', () => {
  it('is read back by a decoder at every version, full', () => {
    const most = fullest();
    // Every version but 23, which `src/app/qr.ts` never makes — jsQR misplaces one of its alignment patterns.
    expect([...most.keys()].sort((a, b) => a - b), 'some version holds no text at all').toEqual(
      Array.from({ length: 40 }, (_, i) => i + 1).filter((v) => v !== 23),
    );
    for (const [version, length] of most) {
      const text = textOf(length);
      const symbol = qrOf(text);
      expect(symbol?.version, `${length} bytes`).toBe(version);
      if (symbol === null) continue;
      expect(symbol.size).toBe(version * 4 + 17);
      const frame = frameOf(symbol, 3);
      const read = jsQR(frame.data, frame.side, frame.side, { inversionAttempts: 'dontInvert' });
      expect(read?.data, `version ${version}, ${length} bytes, did not read back`).toBe(text);
      expect(read?.version, `version ${version}`).toBe(version);
    }
  }, 60_000);

  it('is read back short, at the smallest scale the Save tab draws', () => {
    for (const length of [1, 40, 300, 1300]) {
      const text = textOf(length);
      const symbol = qrOf(text);
      if (symbol === null) throw new Error(`${length} bytes made no symbol`);
      const frame = frameOf(symbol, 2);
      expect(jsQR(frame.data, frame.side, frame.side)?.data, `${length} bytes`).toBe(text);
    }
  });

  it('is refused for a text no version holds', () => {
    expect(qrOf(textOf(QR_MOST_BYTES))).not.toBeNull();
    expect(qrOf(textOf(QR_MOST_BYTES + 1))).toBeNull();
  });
});
