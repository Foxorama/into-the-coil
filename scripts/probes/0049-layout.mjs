// The breaks behind docs/decisions/0049-the-chrome-is-authored-against-the-short-axis.md.
//
// ⚠️ Every one of these is invisible on the machine the code is written on. A 1280x720 window has
// room for the mistake and 375 pixels of phone does not, which is exactly how the reported bug
// shipped: the title screen was correct on every viewport anybody had looked at it on.
//
// ⚠️ Two DIFFERENT properties are proved here and they fail on different tests. The fit rules — two
// columns, and sizes that are a fraction of the box — are what makes a phone show the whole screen;
// the safe centring and the scroll container are what happens when a viewport is smaller than
// anything that could be designed for. A guard over one is silent about the other.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0049',
    suite: 'tests/layout.browser.test.ts',
    // The reported bug itself: the key stacked above the tiers, so six things run down the axis that
    // has 375 pixels of it. Looks perfect on a laptop.
    /*
      ⚠️ **RE-ANCHORED BY 0210, AND THE MOVE IS THE INTERESTING PART.** This expected the failure on
      *the phone this bug was reported from* — 812x375. It no longer lands there: 0210 gave the title
      screen a two-column grid below 460px tall, so the screen is compact enough that stacking its
      BODY no longer overflows that device on its own.
      **The break is still caught**, one assertion over: the panel ends up centred off the top, where
      nothing can scroll to it. So the guard still fires on the thing this probe exists to catch, and
      what changed is which of the layout guard's claims notices first.
      ⚠️ It is re-anchored rather than made bigger on purpose. Widening the break until it reddened
      the original assertion again would be tuning the PROBE to the answer, which is the shape
      docs/decisions/0044 refuses.
    */
    broke: 'the title screen stacked down the short axis again, instead of across the long one',
    guard: 'keeps its first line on the display and its last control one scroll away',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  grid-template-columns: minmax(0, 7fr) minmax(0, 11fr);',
      replace: '  grid-template-columns: minmax(0, 1fr);',
    },
  },
  {
    decision: '0049',
    suite: 'tests/layout.browser.test.ts',
    /*
      Type sized in rem alone. Every number in the stylesheet is then a constant, and the screen that
      has to hold them is not.

      ⚠️ THE HEADING RATHER THAN THE PANEL, and the difference was measured rather than chosen. A
      fixed 1.25rem on the panel overflows 480x320 by about four pixels, which is inside the noise a
      font can move a layout by — so a probe on it would report the guard as sound on one machine and
      as vacuous on another. The heading's cap is worth 41 pixels at the same size. Same rule, same
      stylesheet, and the demonstration is the declaration that can actually be seen to matter.
    */
    broke: 'the heading typeset at a fixed size rather than as a fraction of the box it has to fit',
    /*
      ⚠️ **RE-ANCHORED BY 0210 ONTO A GUARD THAT MEASURES THE SIZE RATHER THAN THE OVERFLOW.** This
      used to point at the no-scrolling assertion, and the note here read: *the FIT test does not fire
      on this and the no-scrolling one does — what a too-large heading pushes past the bottom edge
      first is the panel's own padding.* Both were true while the title screen was tight.

      0210 gave that screen about 97 pixels of headroom, and **a fixed heading then FITS** — so every
      overflow assertion went green over a break that is exactly as wrong as it always was. This probe
      is what found it: *the suite stayed GREEN, the guard does not fire on the thing it exists to
      catch.*

      ⚠️ **THE FIX WAS A BETTER GUARD, NOT A BIGGER BREAK.** 3.5rem is the clamp's own maximum — the
      desktop size worn on a phone — so it is the honest hazard and inflating it would be tuning the
      probe to the answer (docs/decisions/0044). What changed is what is measured: the heading's
      COMPUTED SIZE on two boxes of different heights, which is the property 0049 states, rather than
      the overflow that used to be its symptom.
    */
    guard: 'the heading is a fraction of the box',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-title-heading { font-size: clamp(1.25rem, min(6cqw, 9cqh), 3.5rem);',
      replace: '.itc-title-heading { font-size: 3.5rem;',
    },
  },
  {
    decision: '0049',
    suite: 'tests/layout.browser.test.ts',
    // ⚠️ THE ONE THAT MADE THE HEADING VANISH. Centring an overflowing panel pushes half of it off
    // the START edge, where no scrollbar can reach — the game's own name was simply gone, rather
    // than cut off, and nothing on the page hinted that anything was missing.
    broke: 'the panel centred by the container again, so an overflowing screen loses its top',
    guard: 'keeps its first line on the display and its last control one scroll away',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  margin: auto;',
      replace: '  margin: 0 auto;\n  align-self: center;',
    },
  },
  {
    decision: '0049',
    suite: 'tests/layout.browser.test.ts',
    // The net removed. Everything is still drawn in the right place; the part below the fold simply
    // cannot be reached, which is indistinguishable from a screen that has nothing below the fold.
    broke: 'the overlay stopped scrolling, so a screen too tall for the viewport is unreachable',
    guard: 'keeps its first line on the display and its last control one scroll away',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  overflow: auto;',
      replace: '  overflow: hidden;',
    },
  },
];
