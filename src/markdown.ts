import { Markdown } from './types';

export function makeMD({ config, version, tag, date }: Markdown) {
  let md = `\n## ${URL ? `[${version}](${URL}/compare/${tag}...${version})` : version} (${date})\n`;

  // tslint:disable-next-line: forin
  for (const group in config.groups) {
    md += `\n### ${group}\n\n`;

    for (const item of config.groups[group]) {
      md += `- ${item}\n`;
    }
  }

  return md;
}
