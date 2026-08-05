// The breaks behind docs/decisions/0038-the-handover-is-a-file.md.
//
// ⚠️ The link scan was GREEN on its first run, over roughly sixty existing cross-references. That is
// the shape decision 0005 refuses to trust — indistinguishable from a scan whose extractor is
// broken. These are one half of the answer; the other half lives inside `tests/links.test.ts`, which
// runs the extractor over a link, an anchor, an external URL and a fenced example so a typo'd
// pattern fails there rather than passing forever.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0038',
    suite: 'tests/links.test.ts',
    // A renamed decision is the realistic version of this: the citation still reads as a working
    // link, and the reader who follows it finds out months later in the middle of something else.
    broke: 'a citation pointed at a decision that does not exist, which is how every rotted link looks',
    guard: 'every relative link in every markdown file resolves, in a clean checkout',
    edit: {
      path: 'docs/state-of-play.md',
      find: '| bullets, contact, death | [0034](decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md) |',
      replace: '| bullets, contact, death | [0034](decisions/0034-bullets-and-collisions.md) |',
    },
  },
  {
    decision: '0038',
    suite: 'tests/links.test.ts',
    // ⚠️ THE ONE CI FOUND AND THE FILESYSTEM COULD NOT. `docs/milestones/` is gitignored, so a tracked
    // document citing it resolves on this machine and in no clone. Four decisions had been doing
    // exactly this, undetected, and the first version of this very test was blind to it.
    broke: 'a tracked document citing gitignored working material, which resolves here and nowhere else',
    guard: 'every relative link in every markdown file resolves, in a clean checkout',
    edit: {
      path: 'docs/state-of-play.md',
      find: '- **itch**: `BUTLER_API_KEY`, the *played in the browser* flag, and the channel. `docs/scaffold-plan.md`',
      replace:
        '- **itch**: see [the plan](scaffold-plan.md). `docs/scaffold-plan.md`',
    },
  },
  {
    decision: '0038',
    suite: 'tests/links.test.ts',
    // ⚠️ The file's whole design is that it cannot state a conclusion — 0029's "a summary is a second
    // copy". Prose with the links stripped out is exactly the drift this decision exists to refuse,
    // and it would otherwise look like an ordinary edit.
    broke: 'a settled row explaining its result instead of citing where it is recorded',
    guard: 'cites on every settled row rather than summarising',
    edit: {
      path: 'docs/state-of-play.md',
      find: '| bullets, contact, death | [0034](decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md) |',
      replace: '| bullets, contact, death | shots hurt enemies, enemies hurt the ship, and a death restarts the scene |',
    },
  },
];
