// Stamp CRLF line endings onto a file, and refuse it if it is not pure ASCII.
//
// ⚠️ WRITTEN BECAUSE `dash.cmd` FAILED BOTH WAYS AT ONCE, and neither failure looks like what it is.
// cmd.exe misparses a batch file with LF-only line endings — it eats characters off the front of
// lines and reports `'etlocal' is not recognized`, which reads like a corrupted install rather than
// like an encoding problem. A byte above 127 shifts the parse the same way under the OEM codepage.
// Every editor and every tool in this project writes LF and UTF-8, so a `.cmd` is wrong by default.
//
// ⚠️ AND IT IS A SCRIPT RATHER THAN A SHELL ONE-LINER, which is the rule
// `scripts/prove-guard.mjs` states in its own header: *the shell owns the quoting either way*. The
// attempt before this one passed the batch file's own backslashes through two layers of shell and
// wrote `C:UsersoxorAppData` into it, which is the same class of defect one level down.
//
// Usage:  node scripts/crlf.mjs dash.cmd

import { readFileSync, writeFileSync } from 'node:fs';

const target = process.argv[2];
if (target === undefined) {
  console.error('usage: node scripts/crlf.mjs <file>');
  process.exit(1);
}

const text = readFileSync(target, 'utf8');

const offenders = [...text].filter((ch) => ch.charCodeAt(0) > 127);
if (offenders.length > 0) {
  console.error(
    `${target} has ${offenders.length} character(s) above ASCII — ${[...new Set(offenders)].join(' ')}\n` +
      'cmd.exe reads a batch file in the OEM codepage, and a multi-byte character shifts the parse ' +
      'so that later lines lose their first character. Replace them with ASCII.',
  );
  process.exit(1);
}

const stamped = text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
writeFileSync(target, stamped, 'ascii');

const bytes = readFileSync(target);
const cr = bytes.filter((b) => b === 13).length;
const lf = bytes.filter((b) => b === 10).length;
if (cr !== lf) {
  console.error(`${target} still has ${cr} CR against ${lf} LF after stamping`);
  process.exit(1);
}
console.log(`${target}: ${lf} lines, all CRLF, pure ASCII`);
