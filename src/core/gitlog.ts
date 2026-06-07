import type { RawCommit } from './types.ts';

// Field separator (unit sep) and record separator (record sep). These bytes
// effectively never appear in commit messages, so parsing stays robust even
// when subjects/bodies contain newlines, quotes, etc.
const FS = '\x1f';
const RS = '\x1e';

/** The `git log --pretty` format string that produces parseable output. */
export const GIT_LOG_FORMAT = `--pretty=format:%H${FS}%an${FS}%aI${FS}%s${FS}%b${RS}`;

/**
 * Parse the raw stdout of `git log GIT_LOG_FORMAT` into RawCommit records.
 * Pure function — no shelling out — so it can be unit-tested with fixtures.
 */
export function parseGitLog(stdout: string): RawCommit[] {
  return stdout
    .split(RS)
    .map((rec) => rec.replace(/^\n+/, '')) // strip leading newlines between records
    .filter((rec) => rec.trim().length > 0)
    .map((rec) => {
      const [hash = '', author = '', date = '', subject = '', ...bodyParts] = rec.split(FS);
      return {
        hash: hash.trim(),
        author: author.trim(),
        date: date.trim(),
        subject: subject.trim(),
        body: bodyParts.join(FS).trim(),
      };
    });
}

/**
 * Build the argv for the git invocation. Kept separate from execution so the
 * CLI/extension can run it with their own process API and so it's inspectable.
 */
export function gitLogArgs(range?: string): string[] {
  const args = ['log', GIT_LOG_FORMAT, '--no-merges'];
  if (range) args.push(range);
  return args;
}
