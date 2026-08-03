// The breaks behind docs/decisions/0016-a-hub-enumerates-kinds.md.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0016',
    suite: 'tests/registry.test.ts',
    broke: "`import.meta.glob('./enemies/*.ts')`",
    guard: 'nothing in src/ defeats it by auto-discovery',
    plant: {
      path: 'src/content/probe.ts',
      content: "const rows = import.meta.glob('./enemies/*.ts');\nexport const ENEMIES = rows;\n",
    },
  },
  {
    decision: '0016',
    suite: 'tests/registry.test.ts',
    broke: '`Record<string, number>`',
    guard: 'nothing in src/ defeats it by open-key',
    plant: { path: 'src/content/probe.ts', content: 'export const ENEMIES: Record<string, number> = {};\n' },
  },
  {
    decision: '0016',
    suite: 'tests/registry.test.ts',
    broke: '`(e: any)`',
    guard: 'nothing in src/ defeats it by any',
    plant: { path: 'src/content/probe.ts', content: 'export const tick = (e: any): unknown => e;\n' },
  },
  {
    decision: '0016',
    suite: 'tests/registry.test.ts',
    broke: 'a `// @ts-ignore` line',
    guard: 'nothing in src/ defeats it by silenced-compiler',
    plant: { path: 'src/content/probe.ts', content: '// @ts-ignore\nexport const x = 1;\n' },
  },
  {
    decision: '0016',
    suite: 'tests/registry.test.ts',
    broke: 'a `switch` with a plain `default:`',
    guard: 'every switch in src/ ends in an exhaustiveness arm',
    plant: {
      path: 'src/content/probe.ts',
      content: [
        "export const label = (k: 'a' | 'b'): number => {",
        '  switch (k) {',
        "    case 'a':",
        '      return 1;',
        '    default:',
        '      return 0;',
        '  }',
        '};',
        '',
      ].join('\n'),
    },
  },
  {
    decision: '0016',
    suite: 'tests/registry.test.ts',
    broke: 'the `any` pattern loosened to `\\bany\\b`',
    guard: 'no pattern fires on a line it must leave alone',
    edit: {
      path: 'tests/registry.test.ts',
      find: 'pattern: /:\\s*any\\b|\\bas\\s+any\\b|<\\s*any\\s*[,>]|\\bany\\[\\]/,',
      replace: 'pattern: /\\bany\\b/,',
    },
  },
  {
    decision: '0016',
    suite: 'tests/registry.test.ts',
    broke: "the `any` pattern typo'd to `anyy`",
    guard: 'every pattern matches the move it bans',
    edit: {
      path: 'tests/registry.test.ts',
      find: 'pattern: /:\\s*any\\b|',
      replace: 'pattern: /:\\s*anyy\\b|',
    },
  },
  {
    decision: '0016',
    suite: 'tests/registry.test.ts',
    broke: 'exhaustiveness re-defined as `default` rather than `never`',
    guard: 'the switch parser finds a switch, its body, and whether it decides',
    edit: {
      path: 'tests/registry.test.ts',
      find: 'exhaustive: /\\bnever\\b/.test(body),',
      replace: 'exhaustive: /\\bdefault\\b/.test(body),',
    },
  },
  {
    decision: '0016',
    suite: 'tests/registry.test.ts',
    broke: '`silenced-compiler` switched from a raw scan to a stripped one',
    guard: 'the raw/code split is the right way round for each row',
    edit: { path: 'tests/registry.test.ts', find: "scan: 'raw',", replace: "scan: 'code'," },
  },
];
