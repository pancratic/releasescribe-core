import type { RawCommit, GenerateOptions, ChangelogSection } from './types.ts';
import { parseCommits } from './conventional.ts';
import { groupCommits } from './group.ts';
import { renderMarkdown } from './format.ts';
import { DEFAULT_SECTIONS } from './types.ts';

export * from './types.ts';
export { parseGitLog, gitLogArgs, GIT_LOG_FORMAT } from './gitlog.ts';
export { parseCommit, parseCommits } from './conventional.ts';
export { groupCommits } from './group.ts';
export { renderMarkdown } from './format.ts';

/** Full deterministic pipeline: raw commits -> grouped sections. */
export function buildSections(
  raws: RawCommit[],
  opts: GenerateOptions = {},
): ChangelogSection[] {
  const parsed = parseCommits(raws);
  return groupCommits(parsed, opts.sections ?? DEFAULT_SECTIONS, opts.includeOther ?? false);
}

/** Full deterministic pipeline: raw commits -> Markdown release notes. */
export function generateReleaseNotes(
  raws: RawCommit[],
  opts: GenerateOptions = {},
): string {
  return renderMarkdown(buildSections(raws, opts), opts);
}
