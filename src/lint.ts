#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';
import { rParse } from './parser';

// tslint:disable: no-console

const commit = readFileSync(
  join(process.cwd(), process.env.GIT_PARAMS || process.env.HUSKY_GIT_PARAMS || '.git/COMMIT_EDITMSG'),
  'utf8'
);

const whitelist: Record<string, boolean> = {
  break: true,
  feat: true,
  build: true,
  chore: true,
  ci: true,
  docs: true,
  fix: true,
  perf: true,
  refactor: true,
  revert: true,
  style: true,
  test: true,
};

const parsed = rParse.exec(commit);
const example = '<type>: <description> or <type>(scope): <description>';

function error(): never {
  console.error(`Schema of message: ${example}`);
  console.error('Current message:');
  console.error(commit);
  process.exit(1);
}

if (!parsed) {
  console.error('Incorrect format of commit message');
  error();
}

const [, type] = parsed;

if (!type) {
  console.error('Type required in commit message');
  error();
}

if (!whitelist[type]) {
  console.error(`Type "${type}" should be one of: ${Object.keys(whitelist).join(', ')}`);
  error();
}
