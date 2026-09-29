/**
 * The jobs of a workflow file, read as text — `docs/decisions/0420-the-ci-is-sharded-and-joined.md`.
 *
 * ⚠️ **TEXT, NOT A YAML PARSER, AND THE SHAPE IT READS IS NARROW ON PURPOSE.** No YAML package is a
 * dependency here, and the facts the guards need are three per job: its key, its `needs`, and its
 * `if`. A job is a line at two spaces' indent under `jobs:` ending in a colon; its body runs to the
 * next such line. A workflow written in a shape this does not read — `needs` over several lines, a
 * job key quoted — makes the guards that use it fail rather than pass, because every one of them
 * asks for something to be FOUND.
 */
export type Job = { key: string; body: string; needs: string[]; condition: string | null };

export function jobsOf(workflow: string): Job[] {
  const lines = workflow.split(/\r?\n/);
  const start = lines.findIndex((line) => /^jobs:\s*$/.test(line));
  if (start === -1) return [];
  const jobs: Job[] = [];
  let current: { key: string; lines: string[] } | null = null;
  const close = (): void => {
    if (current === null) return;
    const body = current.lines.join('\n');
    const needs = /^ {4}needs:\s*(.+)$/m.exec(body)?.[1]?.trim() ?? '';
    const condition = /^ {4}if:\s*(.+)$/m.exec(body)?.[1]?.trim() ?? null;
    jobs.push({
      key: current.key,
      body,
      needs: needs.startsWith('[')
        ? needs.slice(1, needs.indexOf(']')).split(',').map((n) => n.trim()).filter(Boolean)
        : needs === ''
          ? []
          : [needs],
      condition,
    });
  };
  for (const line of lines.slice(start + 1)) {
    const key = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line)?.[1];
    if (key !== undefined) {
      close();
      current = { key, lines: [] };
    } else if (/^\S/.test(line)) {
      break;
    } else current?.lines.push(line);
  }
  close();
  return jobs;
}
