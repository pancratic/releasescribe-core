import type { ParsedCommit, ChangelogSection, GenerateOptions } from './types.ts';
import { BREAKING_TITLE } from './group.ts';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Render a single commit as a bullet line. */
function renderCommit(c: ParsedCommit, opts: GenerateOptions, isBreaking: boolean): string {
  const text = isBreaking && c.breakingDescription ? c.breakingDescription : c.description;
  const scope = c.scope ? `**${c.scope}:** ` : '';
  let line = `- ${scope}${capitalize(text)}`;
  if (c.pr !== null) {
    line += opts.prUrlBase ? ` ([#${c.pr}](${opts.prUrlBase}/${c.pr}))` : ` (#${c.pr})`;
  }
  return line;
}

/**
 * Render grouped sections into a Keep-a-Changelog-style Markdown block.
 * Returns just the entry for this version (no file framing), so callers can
 * prepend it to an existing CHANGELOG.md.
 */
export function renderMarkdown(
  sections: ChangelogSection[],
  opts: GenerateOptions = {},
): string {
  const version = opts.version ? opts.version : 'Unreleased';
  const date = opts.date ?? today();
  const lines: string[] = [];

  lines.push(`## ${version} - ${date}`, '');

  if (sections.length === 0) {
    lines.push('_No notable changes._', '');
    return lines.join('\n');
  }

  for (const section of sections) {
    const isBreaking = section.title === BREAKING_TITLE;
    lines.push(`### ${section.title}`, '');
    for (const c of section.commits) {
      lines.push(renderCommit(c, opts, isBreaking));
    }
    lines.push('');
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
