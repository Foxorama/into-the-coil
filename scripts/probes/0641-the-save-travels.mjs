// The breaks behind docs/decisions/0641-the-save-travels.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0641',
    suite: 'tests/qr.test.ts',
    /*
      The short blocks laid without their hole, so every codeword after the first short block's end is in
      the wrong column — only on a version whose blocks are not all one length, which is why the guard
      walks every version. (A bit off in the format mask was tried first and read back: the format bits
      carry their own correction, three bits of it.)
    */
    broke: 'a QR symbol whose short blocks are interleaved without their hole',
    guard: 'is read back by a decoder at every version, full',
    edit: {
      path: 'src/app/qr.ts',
      find: '    if (i < shortBlocks) part.push(-1);',
      replace: '    if (i < 0) part.push(-1);',
    },
  },
  {
    decision: '0641',
    suite: 'tests/backup.test.ts',
    // Every document passed as readable: a missing or damaged hangar restored as the defaults, and reported done.
    broke: 'a restore that reads any document as one it can trust',
    guard: 'is refused, and never read as the defaults, for every way it can be wrong',
    edit: {
      path: 'src/save/backup.ts',
      find: '  return v === version ? null : DAMAGED;',
      replace: '  return null;',
    },
  },
  {
    decision: '0641',
    suite: 'tests/backup.test.ts',
    // The write taken as its own proof: a store that kept nothing reloads into the old save as if restored.
    broke: 'a restore that reports a write it never read back',
    guard: 'is written whole, and a store that refuses it says so',
    edit: {
      path: 'src/save/backup.ts',
      find: '    return docs.every(([key, text]) => store.getItem(key) === text);',
      replace: '    return true;',
    },
  },
  {
    decision: '0641',
    suite: 'tests/backup.test.ts',
    // The code left uncompressed: three and a half kilobytes of save past what any symbol holds.
    broke: 'a code that is the backup uncompressed',
    guard: 'fits a QR symbol a phone reads off a screen, for the fullest save there is',
    edit: {
      path: 'src/save/backup.ts',
      find: "  const packed = new Blob([backup]).stream().pipeThrough(new CompressionStream('deflate-raw'));",
      replace: '  const packed = new Blob([backup]).stream();',
    },
  },
];
