import assert from 'node:assert/strict';
import test from 'node:test';

import { validatePullRequestBody } from './validate-pr-evidence.mjs';

const completedBody = `
## Summary

Show the redesigned lobby states to reviewers.

## Changes

- Restyle the lobby and waiting room.

## Evidence

- [x] Evidence provided
- [ ] Evidence not applicable

**N/A reason:**

| Changed surface or material claim | Scenario exercised | Evidence |
| --- | --- | --- |
| Waiting room seat states | Alice hosts while Bob joins a three-player room | [Screenshot](https://example.com/waiting.png) |

## Risks and limitations

None.
`;

test('accepts a completed evidence table', () => {
  assert.deepEqual(validatePullRequestBody(completedBody), []);
});

test('accepts a concrete not-applicable reason', () => {
  const body = completedBody
    .replace('- [x] Evidence provided', '- [ ] Evidence provided')
    .replace('- [ ] Evidence not applicable', '- [x] Evidence not applicable')
    .replace('**N/A reason:**', '**N/A reason:** This corrects a typo with no runtime or rendered behavior change.')
    .replace('| Waiting room seat states | Alice hosts while Bob joins a three-player room | [Screenshot](https://example.com/waiting.png) |', '');

  assert.deepEqual(validatePullRequestBody(body), []);
});

test('rejects an empty body', () => {
  assert.match(validatePullRequestBody('')[0], /body is empty/i);
});

test('rejects missing required sections', () => {
  const errors = validatePullRequestBody('## Summary\n\nA sufficiently concrete summary.');
  assert.ok(errors.some((error) => error.includes('## Changes')));
  assert.ok(errors.some((error) => error.includes('## Evidence')));
});

test('rejects template comments without author content', () => {
  const body = completedBody.replace(
    'Show the redesigned lobby states to reviewers.',
    '<!-- Required: explain the outcome. -->',
  );

  assert.ok(validatePullRequestBody(body).some((error) => /Complete the Summary/.test(error)));
});

test('rejects no selected evidence mode', () => {
  const body = completedBody.replace('- [x] Evidence provided', '- [ ] Evidence provided');
  assert.ok(validatePullRequestBody(body).some((error) => /exactly one evidence mode/.test(error)));
});

test('rejects both selected evidence modes', () => {
  const body = completedBody.replace('- [ ] Evidence not applicable', '- [x] Evidence not applicable');
  assert.ok(validatePullRequestBody(body).some((error) => /exactly one evidence mode/.test(error)));
});

test('rejects provided mode without evidence rows', () => {
  const body = completedBody.replace(
    '| Waiting room seat states | Alice hosts while Bob joins a three-player room | [Screenshot](https://example.com/waiting.png) |',
    '',
  );

  assert.ok(validatePullRequestBody(body).some((error) => /at least one completed evidence-table row/.test(error)));
});

test('rejects incomplete evidence rows', () => {
  const body = completedBody.replace(
    '| Waiting room seat states | Alice hosts while Bob joins a three-player room | [Screenshot](https://example.com/waiting.png) |',
    '| <claim> | TODO | |',
  );

  assert.ok(validatePullRequestBody(body).some((error) => /Complete or remove/.test(error)));
});

test('rejects a short not-applicable reason', () => {
  const body = completedBody
    .replace('- [x] Evidence provided', '- [ ] Evidence provided')
    .replace('- [ ] Evidence not applicable', '- [x] Evidence not applicable')
    .replace('**N/A reason:**', '**N/A reason:** No UI change.')
    .replace('| Waiting room seat states | Alice hosts while Bob joins a three-player room | [Screenshot](https://example.com/waiting.png) |', '');

  assert.ok(validatePullRequestBody(body).some((error) => /at least 20 characters/.test(error)));
});
