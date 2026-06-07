import type { RawCommit, ParsedCommit } from './types.ts';

// Matches "type(scope)!: description" / "type!: description" / "type: description".
const HEADER_RE = /^(?<type>[a-zA-Z]+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?:\s+(?<desc>.+)$/;
// Trailing "(#123)" PR reference at the end of a subject.
const PR_RE = /\(#(\d+)\)\s*$/;
// BREAKING CHANGE footer (conventional-commits spec allows "BREAKING-CHANGE" too).
const BREAKING_FOOTER_RE = /^BREAKING[ -]CHANGE:\s*(?<desc>.+)$/im;

/**
 * Parse one raw commit into a structured ParsedCommit. Non-conventional commits
 * are returned with type=null and the full subject as the description, so they
 * can still be surfaced under "Other Changes" rather than silently dropped.
 */
export function parseCommit(raw: RawCommit): ParsedCommit {
  let subject = raw.subject.trim();

  let pr: number | null = null;
  const prMatch = subject.match(PR_RE);
  if (prMatch) {
    pr = Number(prMatch[1]);
    subject = subject.replace(PR_RE, '').trim();
  }

  const breakingFooter = raw.body.match(BREAKING_FOOTER_RE);
  const breakingDescription = breakingFooter?.groups?.desc?.trim() ?? null;

  const header = subject.match(HEADER_RE);
  if (!header || !header.groups) {
    return {
      ...raw,
      type: null,
      scope: null,
      breaking: Boolean(breakingFooter),
      description: subject,
      pr,
      breakingDescription,
    };
  }

  const { type, scope, bang, desc } = header.groups;
  return {
    ...raw,
    type: type.toLowerCase(),
    scope: scope ? scope.trim() : null,
    breaking: Boolean(bang) || Boolean(breakingFooter),
    description: desc.trim(),
    pr,
    breakingDescription,
  };
}

export function parseCommits(raws: RawCommit[]): ParsedCommit[] {
  return raws.map(parseCommit);
}
