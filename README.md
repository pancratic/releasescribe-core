# releasescribe-core

Generate clean, categorized changelogs and release notes from your **git history**
and **[Conventional Commits](https://www.conventionalcommits.org/)** — zero config,
zero network, MIT licensed.

This is the open-source engine behind
[**ReleaseScribe for VS Code**](https://marketplace.visualstudio.com/) (which adds
one-click generation and optional AI polish).

## Install

```bash
npm i -g releasescribe-core
```

## Use

```bash
# Full history
releasescribe

# A range, a version label, and PR links
releasescribe --range v1.3.0..HEAD --version 1.4.0 \
  --pr-url-base https://github.com/your/repo/pull > CHANGELOG-new.md
```

### Options
| Flag | Description |
|---|---|
| `--range <git range>` | e.g. `v1.3.0..HEAD` (default: full history) |
| `--version <label>` | Heading version (default: `Unreleased`) |
| `--pr-url-base <url>` | Turn `(#123)` into Markdown links |
| `--other` | Include an "Other Changes" section for non-conventional commits |
| `--cwd <path>` | Repository path (default: current directory) |

## What it does
- Parses `feat`, `fix`, `perf`, `refactor`, `docs`, scopes (`feat(api):`),
  breaking changes (`feat!:` / `BREAKING CHANGE:` footers), and PR refs `(#123)`.
- Groups into **Features / Bug Fixes / Performance / ⚠ Breaking Changes**.
- Emits **Keep a Changelog**-style Markdown. Noise (`chore`, `ci`, `build`,
  `test`, `style`) is hidden by default.

## Want one-click + AI-polished, customer-facing notes?
[**ReleaseScribe for VS Code**](https://marketplace.visualstudio.com/) wraps this
engine with a Command-Palette workflow and an optional AI rewrite (bring your own
LLM key) that turns terse commits into prose your users will actually read.

## License
MIT.
