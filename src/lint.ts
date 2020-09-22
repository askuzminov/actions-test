#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';
import { whitelist } from './config';
import { log } from './log';
import { rParse } from './parser';

const { GIT_PARAMS, HUSKY_GIT_PARAMS } = process.env;

const commit = readFileSync(join(process.cwd(), GIT_PARAMS || HUSKY_GIT_PARAMS || '.git/COMMIT_EDITMSG'), 'utf8');

const parsed = rParse.exec(commit);
const example =
  '<type>: <description> or <type>(scope): <description> or <type>!: <description> or <type>(scope)!: <description>';

function error(): never {
  log('error', 'Lint', `Schema of message: ${example}`);
  log('error', 'Lint', 'Current message:');
  log('error', 'Lint', commit);
  process.exit(1);
}

if (!parsed) {
  log('error', 'Lint', 'Incorrect format of commit message');
  error();
}

const [, type] = parsed;

if (!type) {
  log('error', 'Lint', 'Type required in commit message');
  error();
}

if (!whitelist[type]) {
  log('error', 'Lint', `Type "${type}" should be one of: ${Object.keys(whitelist).join(', ')}`);
  error();
}
