import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const MIN_SECTION_LENGTH = 12;
const MIN_REASON_LENGTH = 20;

function stripComments(value) {
  return value.replace(/<!--[\s\S]*?-->/g, '').trim();
}

function section(body, name) {
  const heading = new RegExp(`^##\\s+${name}\\s*$`, 'im');
  const match = heading.exec(body);
  if (!match) return null;

  const start = match.index + match[0].length;
  const rest = body.slice(start);
  const nextHeading = /^##\s+/m.exec(rest);
  return rest.slice(0, nextHeading?.index ?? rest.length);
}

function meaningfulSectionContent(value) {
  return stripComments(value)
    .replace(/^\s*[-*]\s*$/gm, '')
    .trim();
}

function parseEvidenceRows(evidenceSection) {
  const rows = [];

  for (const line of stripComments(evidenceSection).split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;

    const cells = trimmed.slice(1, -1).split('|').map((cell) => cell.trim());
    if (cells.length < 3) continue;
    if (cells.every((cell) => /^:?-+:?$/.test(cell))) continue;
    if (/changed surface or material claim/i.test(cells[0])) continue;

    rows.push(cells.slice(0, 3));
  }

  return rows;
}

function isCompletedRow(cells) {
  const placeholder = /\b(?:todo|tbd|placeholder)\b|<(?:claim|scenario|evidence)>/i;
  return cells.every((cell) => cell.length > 0 && !placeholder.test(cell));
}

export function validatePullRequestBody(body) {
  const errors = [];

  if (!body || !body.trim()) {
    return ['Pull request body is empty. Use .github/pull_request_template.md.'];
  }

  const summary = section(body, 'Summary');
  const changes = section(body, 'Changes');
  const evidence = section(body, 'Evidence');

  for (const [name, value] of [['Summary', summary], ['Changes', changes], ['Evidence', evidence]]) {
    if (value === null) errors.push(`Missing required "## ${name}" section.`);
  }

  if (summary !== null && meaningfulSectionContent(summary).length < MIN_SECTION_LENGTH) {
    errors.push('Complete the Summary section with a concrete outcome.');
  }

  if (changes !== null && meaningfulSectionContent(changes).length < MIN_SECTION_LENGTH) {
    errors.push('Complete the Changes section with the material changes.');
  }

  if (evidence === null) return errors;

  const provided = /^\s*-\s*\[[xX]\]\s+Evidence provided\s*$/m.test(evidence);
  const notApplicable = /^\s*-\s*\[[xX]\]\s+Evidence not applicable\s*$/m.test(evidence);

  if (provided === notApplicable) {
    errors.push('Select exactly one evidence mode: provided or not applicable.');
    return errors;
  }

  if (notApplicable) {
    const reasonMatch = /^\*\*N\/A reason:\*\*\s*(.*)$/m.exec(stripComments(evidence));
    const reason = reasonMatch?.[1]?.trim() ?? '';
    if (reason.length < MIN_REASON_LENGTH) {
      errors.push(`Explain why evidence is not applicable in at least ${MIN_REASON_LENGTH} characters.`);
    }
    return errors;
  }

  const rows = parseEvidenceRows(evidence);
  if (rows.length === 0) {
    errors.push('Add at least one completed evidence-table row.');
  } else if (rows.some((row) => !isCompletedRow(row))) {
    errors.push('Complete or remove every evidence-table row.');
  }

  return errors;
}

function bodyFromCommandLine() {
  const bodyFileIndex = process.argv.indexOf('--body-file');
  if (bodyFileIndex !== -1) {
    const file = process.argv[bodyFileIndex + 1];
    if (!file) throw new Error('--body-file requires a path.');
    return readFileSync(file, 'utf8');
  }

  return process.env.PR_BODY ?? '';
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  const errors = validatePullRequestBody(bodyFromCommandLine());
  if (errors.length > 0) {
    console.error('PR evidence validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log('PR evidence structure is complete. Reviewer judgment is still required.');
}
