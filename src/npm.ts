import { readFileSync } from 'fs';
import { join } from 'path';
import { ParseConfig } from './types';
import { sp } from './utils';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

export async function nextVersion(config: ParseConfig, preid?: string | boolean) {
  const params = ['version', preid ? 'prerelease' : config.isMajor ? 'major' : config.isMinor ? 'minor' : 'patch'];

  if (typeof preid === 'string') {
    params.push(`--preid=${preid}`);
  }

  params.push('--no-git-tag-version');

  await sp(npmCmd, params);
}

export function getVersion(): string {
  const file = readFileSync(join(process.cwd(), 'package.json'), 'utf8');
  return `v${(JSON.parse(file) as Record<string, string>).version}`;
}

export async function publish(registry: string, preid?: string | boolean) {
  await sp(npmCmd, ['publish', '--tag', preid ? 'canary' : 'latest', '--registry', registry]);
}
