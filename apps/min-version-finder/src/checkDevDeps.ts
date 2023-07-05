import { readJson } from 'fs-extra/esm';
import { readdir } from 'fs/promises';

export const checkDevDeps = async () => {
  const packagesPath = '/Users/lucaciraolo/projects/ark/core/packages';

  const packages = {};
  for await (const application of await readdir(packagesPath)) {
    if (application.includes('.')) {
      continue;
    }
    const path = `${packagesPath}/${application}/package.json`;
    const { dependencies, devDependencies } = await readJson(path);
    for (const [dependency] of Object.entries(dependencies)) {
      if (!packages[dependency]) {
        packages[dependency] = {};
      }
      packages[dependency][application] = 'normal';
    }

    if (!devDependencies) {
      continue;
    }
    for (const [dependency] of Object.entries(devDependencies)) {
      if (!packages[dependency]) {
        packages[dependency] = {};
      }
      packages[dependency][application] = 'dev';
    }
  }

  const packageToDependencyTypeMap = {
    '@testing-library/jest-dom': 'dev',
    '@testing-library/react': 'dev',
    '@testing-library/user-event': 'dev',
    '@types/jest': 'dev',
    '@types/luxon': 'dev',
    '@types/node': 'dev',
    '@types/react': 'dev',
    '@types/react-dom': 'dev',
    '@types/react-router-dom': 'dev',
    typescript: 'dev',
    'patch-package': 'dev',
    'postinstall-postinstall': 'dev',
    '@sentry/cli': 'dev',
  };

  for (const [dependency, applications] of Object.entries(packages)) {
    // find dependencies which are both dev and normal
    if (
      Object.values(applications).includes('dev') &&
      Object.values(applications).includes('normal')
    ) {
      if (!packageToDependencyTypeMap[dependency]) {
        throw new Error(
          `Dependency ${dependency} is both dev and normal, but is not in packageToDependencyTypeMap`
        );
      }

      console.log(
        JSON.stringify({ [dependency]: packages[dependency] }, null, 2)
      );
    }
  }

  // console.log(JSON.stringify(packageToDependencyTypeMap, null, 2));
};
