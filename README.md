# Simple release

- Collect git history for semantic-release
- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit guidelines
- Generate CHANGELOG.md
- Update package.json
- Push and commit new version
- Upload release on Github
- Upload package on Github
- Upload package on Npmjs.org

## Install

```bash
npm i @askuzminov/actions-test
```

## Commands

- **help** -> get command list
- **prerelease** -> only up version');
- **prerelease=SOME.NEW.VERSION** -> only up version with custom ID
- **disable-push** -> prevent git push
- **disable-git** -> prevent git commit and tag
- **disable-md** -> prevent write CHANGELOG.md
- **disable-github** -> prevent github release
- **publish-github** -> publish in github registry
- **publish-npmjs** -> publish in npmjs registry
