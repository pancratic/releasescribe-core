import type { ParsedCommit, ChangelogSection, SectionConfig } from './types.ts';
import { DEFAULT_SECTIONS } from './types.ts';

export const BREAKING_TITLE = '⚠ BREAKING CHANGES';
export const OTHER_TITLE = 'Other Changes';

/**
 * Group parsed commits into ordered changelog sections.
 *
 * - Breaking changes always surface first in their own section (and the commit
 *   still also appears under its normal section, e.g. Features).
 * - Only sections marked `show` are emitted; the rest are dropped as noise.
 * - Uncategorized (non-conventional) commits go to "Other Changes" when
 *   `includeOther` is true, otherwise they are omitted.
 */
export function groupCommits(
  commits: ParsedCommit[],
  sections: SectionConfig[] = DEFAULT_SECTIONS,
  includeOther = false,
): ChangelogSection[] {
  const typeToSection = new Map<string, SectionConfig>();
  for (const section of sections) {
    for (const t of section.types) typeToSection.set(t, section);
  }

  const result: ChangelogSection[] = [];

  // Breaking changes first.
  const breaking = commits.filter((c) => c.breaking);
  if (breaking.length > 0) {
    result.push({ title: BREAKING_TITLE, commits: breaking });
  }

  // One section per configured (visible) section, in declared order.
  for (const section of sections) {
    if (!section.show) continue;
    const matched = commits.filter(
      (c) => c.type !== null && section.types.includes(c.type),
    );
    if (matched.length > 0) {
      result.push({ title: section.title, commits: matched });
    }
  }

  // Catch-all.
  if (includeOther) {
    const uncategorized = commits.filter(
      (c) => c.type === null || !typeToSection.has(c.type),
    );
    if (uncategorized.length > 0) {
      result.push({ title: OTHER_TITLE, commits: uncategorized });
    }
  }

  return result;
}
