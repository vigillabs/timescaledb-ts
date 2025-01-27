# Releasing timescaledb-ts

The `timescaledb-ts` project is a monorepo that contains multiple packages. Each package is published to npm separately. The packages are versioned together and are released together.

## Rules

- Dont publish a package from your local machine.
- Never change a version of a package manually.
- Dont change the `"workspace:^"` version in a `package.json` file.
- All packages should have the same version.
- Check the changes before pushing them to GitHub.
- Manually check the deployed packages on npm after the release.

## Releasing a new version

To release a new version of the packages make sure that you are on the `main` branch and that you have the latest changes. Then, you can bump all the packages to the new version:

```bash
$ VERSION=__VERSION__ START_PATH=. pnpm run release
```

This will change all the packages to the given version and will create a commit and tag with the changes.

> Note that the release command will not modify the monorepo `"workspace:^"` version in the `package.json` files. It will only change the version of the packages. **Changes to the workspace settings are done in the pipelines and are not part of this release.**

After the release command is finished, it is wize to check the changes and make sure that everything is as expected.

You can do that by running:

```bash
$ git log --name-status HEAD^..HEAD

(HEAD -> main, tag: 0.0.0-alpha.53)

M       packages/core
M       packages/schemas
M       packages/utils
M       ...
(END)
```

This will output the contents of the last commit. Make sure that the changes are as expected(only package versions should be changed).

Then, make sure that the tag is created:

```bash
$ git tag

0.0.0-alpha.38
0.0.0-alpha.39
0.0.0-alpha.4
0.0.0-alpha.40
0.0.0-alpha.41
0.0.0-alpha.42
0.0.0-alpha.43
0.0.0-alpha.44
0.0.0-alpha.45
0.0.0-alpha.46
0.0.0-alpha.47
0.0.0-alpha.48
0.0.0-alpha.53 <--- This is the new tag
```

Finally, push the changes to GitHub:

```bash
$ git push && git push --tags
```

This will trigger a release pipeline on GitHub Actions that will publish the packages to npm.

From here you should create a write-up of the changes in a new Github release associated with the tag you just created.
