// The breaks behind docs/decisions/0407-an-update-waits-for-the-browser-to-finish-starting.md.
//
// The sweep test now stands its next release up with `register()` under a new script URL rather
// than `update()`. These are the two halves of the sweep broken in the shipped worker, so the
// guard is seen to fire through the new trigger and not only through the old one.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0407',
    suite: 'tests/offline.browser.test.ts',
    // The sweep never deletes anything: a new worker takes over and the old offline copy stays.
    broke: 'the activate sweep deletes nothing, so the previous release’s cache is kept',
    guard: 'retires its own stale cache',
    edit: {
      path: 'public/sw.js',
      find: '            if (k.indexOf(PREFIX) === 0 && k !== CACHE) return caches.delete(k);',
      replace: '            if (k.indexOf(PREFIX) === 0 && k !== CACHE) return undefined;',
    },
  },
  {
    decision: '0407',
    suite: 'tests/offline.browser.test.ts',
    // The predecessor's sweep: everything not ours goes, including another game's offline copy.
    broke: 'the activate sweep deletes every cache that is not its own, a stranger’s included',
    guard: 'retires its own stale cache',
    edit: {
      path: 'public/sw.js',
      find: '            if (k.indexOf(PREFIX) === 0 && k !== CACHE) return caches.delete(k);',
      replace: '            if (k !== CACHE) return caches.delete(k);',
    },
  },
];
