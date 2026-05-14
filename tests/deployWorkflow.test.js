import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('GitHub Pages environment URL points to the deployed page, not the repository', () => {
  const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');

  assert.match(workflow, /url:\s*\$\{\{\s*steps\.deployment\.outputs\.page_url\s*\}\}/);
  assert.doesNotMatch(workflow, /url:\s*\$\{\{\s*github\.event\.repository\.html_url\s*\}\}/);
});
