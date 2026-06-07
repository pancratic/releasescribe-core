#!/usr/bin/env node
// Thin CLI around the core engine. Shells out to git, then runs the pure
// pipeline. Keeps all git I/O here so the engine stays testable.

import { execFileSync } from 'node:child_process';
import { parseGitLog, gitLogArgs } from './core/gitlog.ts';
import { generateReleaseNotes } from './core/index.ts';

interface CliArgs {
  range?: string;
  version?: string;
  prUrlBase?: string;
  includeOther: boolean;
  cwd: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { includeOther: false, cwd: process.cwd() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--range') args.range = argv[++i];
    else if (a === '--version') args.version = argv[++i];
    else if (a === '--pr-url-base') args.prUrlBase = argv[++i];
    else if (a === '--other') args.includeOther = true;
    else if (a === '--cwd') args.cwd = argv[++i];
  }
  return args;
}

function runGitLog(cwd: string, range?: string): string {
  return execFileSync('git', gitLogArgs(range), { cwd, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const stdout = runGitLog(args.cwd, args.range);
  const commits = parseGitLog(stdout);
  const notes = generateReleaseNotes(commits, {
    version: args.version,
    prUrlBase: args.prUrlBase,
    includeOther: args.includeOther,
  });
  process.stdout.write(notes);
}

main();
