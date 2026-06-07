import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseCommit, parseCommits } from '../src/core/conventional.ts';
import { parseGitLog, GIT_LOG_FORMAT } from '../src/core/gitlog.ts';
import { groupCommits, BREAKING_TITLE, OTHER_TITLE } from '../src/core/group.ts';
import { generateReleaseNotes, buildSections } from '../src/core/index.ts';
import type { RawCommit } from '../src/core/types.ts';

function raw(subject: string, body = ''): RawCommit {
  return { hash: 'abc123', author: 'Dev', date: '2026-06-06T10:00:00Z', subject, body };
}

// ---------- conventional parsing ----------

test('parses type, scope, description', () => {
  const c = parseCommit(raw('feat(api): add pagination'));
  assert.equal(c.type, 'feat');
  assert.equal(c.scope, 'api');
  assert.equal(c.description, 'add pagination');
  assert.equal(c.breaking, false);
});

test('detects breaking via bang', () => {
  const c = parseCommit(raw('feat!: drop node 16'));
  assert.equal(c.breaking, true);
  assert.equal(c.type, 'feat');
});

test('detects breaking via footer and captures description', () => {
  const c = parseCommit(raw('refactor: rework config', 'BREAKING CHANGE: config keys renamed'));
  assert.equal(c.breaking, true);
  assert.equal(c.breakingDescription, 'config keys renamed');
});

test('extracts PR number and strips it from description', () => {
  const c = parseCommit(raw('fix: handle null user (#142)'));
  assert.equal(c.pr, 142);
  assert.equal(c.description, 'handle null user');
});

test('non-conventional commit keeps full subject, type null', () => {
  const c = parseCommit(raw('Update readme and bump deps'));
  assert.equal(c.type, null);
  assert.equal(c.description, 'Update readme and bump deps');
});

// ---------- git log parsing ----------

test('GIT_LOG_FORMAT round-trips through parseGitLog', () => {
  const FS = '\x1f';
  const RS = '\x1e';
  const stdout =
    `h1${FS}Alice${FS}2026-06-01T00:00:00Z${FS}feat: a${FS}body line${RS}` +
    `\nh2${FS}Bob${FS}2026-06-02T00:00:00Z${FS}fix: b${FS}${RS}`;
  const commits = parseGitLog(stdout);
  assert.equal(commits.length, 2);
  assert.equal(commits[0].hash, 'h1');
  assert.equal(commits[0].subject, 'feat: a');
  assert.equal(commits[0].body, 'body line');
  assert.equal(commits[1].author, 'Bob');
  assert.ok(GIT_LOG_FORMAT.includes('%H'));
});

test('parseGitLog tolerates empty body and trailing whitespace', () => {
  const FS = '\x1f';
  const RS = '\x1e';
  const stdout = `h1${FS}A${FS}2026-06-01T00:00:00Z${FS}chore: x${FS}${RS}\n\n`;
  const commits = parseGitLog(stdout);
  assert.equal(commits.length, 1);
  assert.equal(commits[0].body, '');
});

// ---------- grouping ----------

test('groups visible sections, hides noise, breaking first', () => {
  const commits = parseCommits([
    raw('feat: new dashboard'),
    raw('fix: crash on save'),
    raw('chore: bump deps'),
    raw('feat!: remove legacy api'),
  ]);
  const sections = groupCommits(commits);
  const titles = sections.map((s) => s.title);
  assert.equal(titles[0], BREAKING_TITLE, 'breaking section must be first');
  assert.ok(titles.includes('Features'));
  assert.ok(titles.includes('Bug Fixes'));
  assert.ok(!titles.includes('Maintenance'), 'chore is hidden by default');
});

test('includeOther surfaces uncategorized commits', () => {
  const commits = parseCommits([raw('feat: x'), raw('random commit message')]);
  const withOther = groupCommits(commits, undefined, true);
  assert.ok(withOther.some((s) => s.title === OTHER_TITLE));
  const withoutOther = groupCommits(commits, undefined, false);
  assert.ok(!withoutOther.some((s) => s.title === OTHER_TITLE));
});

// ---------- end-to-end markdown ----------

test('generateReleaseNotes renders headings, version, and bullets', () => {
  const md = generateReleaseNotes(
    [raw('feat(ui): dark mode (#7)'), raw('fix: typo')],
    { version: '1.2.0', date: '2026-06-06', prUrlBase: 'https://github.com/x/y/pull' },
  );
  assert.ok(md.includes('## 1.2.0 - 2026-06-06'));
  assert.ok(md.includes('### Features'));
  assert.ok(md.includes('**ui:** Dark mode'));
  assert.ok(md.includes('[#7](https://github.com/x/y/pull/7)'));
  assert.ok(md.includes('### Bug Fixes'));
});

test('empty input renders a graceful no-changes note', () => {
  const md = generateReleaseNotes([], { version: '0.0.1', date: '2026-06-06' });
  assert.ok(md.includes('_No notable changes._'));
});

test('breaking footer description is preferred in breaking section', () => {
  const sections = buildSections([raw('refactor: rework config', 'BREAKING CHANGE: renamed keys')]);
  const breaking = sections.find((s) => s.title === BREAKING_TITLE);
  assert.ok(breaking);
  assert.equal(breaking!.commits[0].breakingDescription, 'renamed keys');
});
