import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface RawLog {
  short: string;
  hash: string;
  title: string;
  body: string;
}

interface Message {
  type: string;
  scope?: string;
  content: string;
  body: string;
  hash: string;
  shortHash: string;
}

const ARG = arg();
const TITLE = `# Changelog\n\nAll notable changes to this project will be documented in this file. See [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit guidelines.\n`;
const rParse = /^(\w*)(?:\(([\w$.\-*/ ]*)\))?: (.*)$/;

const pack = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as Record<
  string,
  string | undefined | Record<string, string | undefined>
>;

const URL = getURL();

const tag = ex(`git describe --tags --abbrev=0 --first-parent`);
const commitsRaw = ex(
  `git log ${tag.trim()}..HEAD --pretty=format:'{ "short": "%h", "hash": "%H", "title": "%s", "body": "%b", "author": "%d" }'`
);

const commits = commitsRaw
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => JSON.parse(s)) as RawLog[];

function ex(cmd: string) {
  return execSync(cmd, { encoding: 'utf8' });
}

function arg<T extends Record<string, string | boolean>>(): T {
  const ar = process.argv.slice(2);
  const argv: Record<string, string | boolean> = {};

  for (const item of ar) {
    const c = item.split('=');

    argv[c[0]] = c[1] || true;
  }

  return argv as T;
}

function parseItem(log: RawLog): Message {
  const parsed = rParse.exec(log.title);

  return parsed
    ? {
        type: parsed[1],
        scope: parsed[2],
        content: parsed[3],
        shortHash: log.short,
        hash: log.hash,
        body: log.body,
      }
    : {
        type: 'other',
        content: log.title,
        shortHash: log.short,
        hash: log.hash,
        body: log.body,
      };
}

function parse(commits: RawLog[]) {
  let isMajor = false;
  let isMinor = false;
  let isEmpty = true;
  let groupsRaw: Record<string, string[]> = {};

  for (const commit of commits) {
    const item = parseItem(commit);
    console.log(item);
    if (item.type === 'break' || item.body.indexOf('BREAKING CHANGE:') > -1) {
      isMajor = true;
    }
    if (item.type === 'feat') {
      isMinor = true;
    }

    (groupsRaw[item.type] ??= []).push(
      `${item.scope ? `**${item.scope}**: ` : ''}${item.content}${URL ? ` ([${item.shortHash}](${URL}/commit/${item.hash}))` : ''}${
        item.body ? `\n\n  \`\`\`${item.body}\`\`\`\n` : ''
      }`
    );

    isEmpty = false;
  }

  const groups = Object.keys(groupsRaw)
    .sort()
    .reduce((obj, key) => {
      obj[key] = groupsRaw[key];
      return obj;
    }, {} as Record<string, string[]>);

  return {
    groups,
    isMajor,
    isMinor,
    isEmpty,
  };
}

function nextVersion(config: ReturnType<typeof parse>, preid?: string | boolean) {
  return ex(
    `npm version ${
      preid
        ? `prerelease${typeof preid === 'string' ? ` --preid=${preid}` : ''}`
        : config.isMajor
        ? 'major'
        : config.isMinor
        ? 'minor'
        : 'patch'
    } --no-git-tag-version`
  ).trim();
}

function getURL(): string {
  const parsed = /([^/.]+)[/.]+([^/.]+)[/.]+[^/.]+$/.exec((typeof pack.repository === 'object' && pack.repository?.url) || '');
  return parsed ? `https://github.com/${parsed[1]}/${parsed[2]}` : '';
}

let changelog = '';
try {
  changelog = readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf8');
} catch {}

if (changelog.startsWith(TITLE)) {
  changelog = changelog.slice(TITLE.length);
}

function getDate() {
  const date = new Date();
  return date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate();
}

function makeMD(config: ReturnType<typeof parse>, version: string) {
  let md = `\n## ${URL ? `[${version}](${URL}/compare/${tag.trim()}...${version})` : version} (${getDate()})\n`;

  for (const group in config.groups) {
    md += `\n### ${group}\n\n`;

    for (const item of config.groups[group]) {
      md += `- ${item}\n`;
    }
  }

  return md;
}

function run() {
  const config = parse(commits);

  console.log(config);

  if (config.isEmpty) {
    console.log('No change found in GIT');
  } else {
    const version = nextVersion(config, ARG.prerelease);
    const md = makeMD(config, version);

    console.log(md);
    console.log(version);

    // writeFileSync(join(process.cwd(), 'CHANGELOG.md'), `${TITLE}${md}${changelog}`, 'utf8');

    // execSync('git add .');
    // execSync(`git commit -m "chore(release): ${version} [skip ci]"`);
    // execSync(`git tag -a ${version}  -m 'Release ${version}'`);
  }
}

run();
