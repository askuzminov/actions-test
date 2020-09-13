import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const tag = execSync(`git describe --tags --abbrev=0 --first-parent`, { encoding: 'utf8' });
const commitsRaw = execSync(
  `git log ${tag.trim()}..HEAD --pretty=format:'{ "short": "%h", "hash": "%H", "title": "%s", "body": "%b", "author": "%d" }'`,
  {
    encoding: 'utf8',
  }
);

interface RawLog {
  short: string;
  hash: string;
  title: string;
  body: string;
}

const commits = commitsRaw
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => JSON.parse(s)) as RawLog[];

console.log(commits);

const rParse = /^(\w*)(?:\(([\w$.\-*/ ]*)\))?: (.*)$/;

interface Message {
  type: string;
  scope?: string;
  content: string;
  body: string;
  hash: string;
  shortHash: string;
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
        type: 'unknown',
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

function nextVersion(config: ReturnType<typeof parse>) {
  return execSync(`npm version ${config.isMajor ? 'major' : config.isMinor ? 'minor' : 'patch'} --no-git-tag-version`, {
    encoding: 'utf8',
  }).trim();
}

const pack = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as Record<
  string,
  string | undefined | Record<string, string | undefined>
>;

function getURL(): string {
  const parsed = /([^/.]+)[/.]+([^/.]+)[/.]+[^/.]+$/.exec((typeof pack.repository === 'object' && pack.repository?.url) || '');
  return parsed ? `https://github.com/${parsed[1]}/${parsed[2]}` : '';
}

const URL = getURL();

const TITLE = `# Changelog\n\nAll notable changes to this project will be documented in this file. See [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit guidelines.\n`;

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

function makeMD(config: ReturnType<typeof parse>) {
  const version = nextVersion(config);

  let md = `\n## ${URL ? `[${version}](${URL}/compare/${tag.trim()}...${version})` : version} (${getDate()})\n`;

  for (const group in config.groups) {
    md += `\n### ${group}\n\n`;

    for (const item of config.groups[group]) {
      md += `- ${item}\n`;
    }
  }

  return { md, version };
}

const config = parse(commits);

console.log(config);

if (config.isEmpty) {
  console.log('No change found in GIT');
} else {
  const { md, version } = makeMD(config);

  writeFileSync(join(process.cwd(), 'CHANGELOG.md'), `${TITLE}${md}${changelog}`, 'utf8');

  execSync('git add .');
  execSync(`git commit -m "chore(release): ${version} [skip ci]"`);
  execSync(`git tag -a ${version}  -m 'Release ${version}'`);
}
