import { arg } from './utils';

export const ARG = arg<{
  help: boolean;
  prerelease: boolean | string;
  'disable-push': boolean;
  'disable-git': boolean;
  'disable-md': boolean;
  'disable-github': boolean;
  'publish-github': boolean;
  'publish-npmjs': boolean;
}>({
  help: false,
  prerelease: false,
  'disable-push': false,
  'disable-git': false,
  'disable-md': false,
  'disable-github': false,
  'publish-github': false,
  'publish-npmjs': false,
});

if (ARG.help) {
  // tslint:disable: no-console
  console.log('Commands:');
  console.log('help -> get command list');
  console.log('prerelease -> only up version');
  console.log('prerelease=SOME.NEW.VERSION -> only up version with custom ID');
  console.log('disable-push -> prevent git push');
  console.log('disable-git -> prevent git commit and tag');
  console.log('disable-md -> prevent write CHANGELOG.md');
  console.log('disable-github -> prevent github release');
  console.log('publish-github -> publish in github registry');
  console.log('publish-npmjs -> publish in npmjs registry');
  process.exit(0);
}
