// Core data model for ReleaseScribe. Deliberately free of any VS Code, Node, or
// network imports so the whole engine is unit-testable in isolation.

export interface RawCommit {
  hash: string;
  author: string;
  /** ISO 8601 author date. */
  date: string;
  subject: string;
  body: string;
}

export interface ParsedCommit extends RawCommit {
  /** Conventional-commit type, lowercased (e.g. "feat"), or null if none. */
  type: string | null;
  /** Optional scope from `type(scope):`. */
  scope: string | null;
  /** True if `!` flag or a BREAKING CHANGE footer is present. */
  breaking: boolean;
  /** The human-facing description (subject minus the `type(scope):` prefix). */
  description: string;
  /** Pull-request number parsed from a trailing `(#123)`, if any. */
  pr: number | null;
  /** The BREAKING CHANGE description, if a footer was present. */
  breakingDescription: string | null;
}

export interface SectionConfig {
  /** Conventional types that map into this section. */
  types: string[];
  /** Heading shown in the output. */
  title: string;
  /** Whether to render this section by default (free users can't change). */
  show: boolean;
}

export interface ChangelogSection {
  title: string;
  commits: ParsedCommit[];
}

export interface GenerateOptions {
  /** Version label for the heading, e.g. "1.4.0". */
  version?: string;
  /** Date string for the heading; defaults to today (YYYY-MM-DD). */
  date?: string;
  /** Section definitions in render order. */
  sections?: SectionConfig[];
  /** Include a catch-all "Other Changes" section for uncategorized commits. */
  includeOther?: boolean;
  /** Base URL for linking PRs, e.g. "https://github.com/org/repo/pull". */
  prUrlBase?: string;
}

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { types: ['feat'], title: 'Features', show: true },
  { types: ['fix'], title: 'Bug Fixes', show: true },
  { types: ['perf'], title: 'Performance', show: true },
  { types: ['refactor'], title: 'Refactoring', show: false },
  { types: ['docs'], title: 'Documentation', show: false },
  { types: ['build', 'ci', 'chore', 'test', 'style'], title: 'Maintenance', show: false },
];
