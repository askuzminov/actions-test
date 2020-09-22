import { RawLog } from './types';
import { sp } from './utils';

const DELIM = '###DELIM%!@^%$###';
const ESCAPE = '###ESCAPE%!@^%$###';

export const fetchAll = () => sp('git', ['fetch', 'remote', '--tags']);

export const getHash = () => sp('git', ['rev-parse', 'HEAD']);

export const getTag = (): Promise<string> => {
  try {
    return sp('git', ['describe', '--tags', '--abbrev=0', '--first-parent']);
  } catch {
    return sp('git', ['rev-list', '--max-parents=0', 'HEAD']);
  }
};

export const getCommitsRaw = (from: string, to: string) =>
  sp('git', [
    'log',
    `${from}..${to}`,
    `--pretty=format:{ "short": ${ESCAPE}%h${ESCAPE}, "hash": ${ESCAPE}%H${ESCAPE}, "title": ${ESCAPE}%s${ESCAPE}, "body": ${ESCAPE}%b${ESCAPE} }${DELIM}`,
  ]);

const escaper = (str: string) => JSON.stringify(str);

const esc = (str: string) =>
  str
    .trim()
    .split(ESCAPE)
    .map((s, i) => (i % 2 ? escaper(s) : s))
    .join('');

const parse = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    // tslint:disable-next-line: no-console
    console.log(str);
    throw e;
  }
};

export const getCommits = async () =>
  (await getCommitsRaw(await getTag(), await getHash())).split(DELIM).map(esc).filter(Boolean).map(parse) as RawLog[];

export const writeGit = async (version: string) => {
  await sp('git', ['add', '.']);
  await sp('git', ['commit', '-m', `chore(release): ${version} [skip ci]`]);
  await sp('git', ['tag', '-a', version, '-m', `Release ${version}`]);
};

export const pushGit = async () => {
  await sp('git', ['push']);
  await sp('git', ['push', '--tags']);
};
