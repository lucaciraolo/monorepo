import { readJson, writeJson } from 'fs-extra/esm';
import { readdir } from 'fs/promises';
import { table } from 'table';
import { $, cd } from 'zx';
import { yarnInstall } from './yarnInstall.js';

const packagesPath = '/Users/lucaciraolo/projects/ark/core/packages';

type DependencyType = 'devDependencies' | 'dependencies';

export const getDependencyVersionDiff = async (
  dependencyType: DependencyType
) => {
  const packages = {};

  for await (const application of await readdir(packagesPath)) {
    if (application.includes('.')) {
      continue;
    }
    const path = `${packagesPath}/${application}/package.json`;

    const packageJson = await readJson(path);
    const dependencies = packageJson[dependencyType];
    for (const [dependency, version] of Object.entries(dependencies)) {
      if (!packages[dependency]) {
        packages[dependency] = {};
      }
      packages[dependency][application] = version;
    }
  }

  type DependencyVersionDiff = Record<string, [string, string][]>;
  const dependencyVersionDiff: DependencyVersionDiff = {};

  for (const [dependency, applications] of Object.entries(packages)) {
    const versions = Object.values(applications);
    if (versions.length > 1) {
      const [first, ...rest] = versions;
      if (rest.some((version) => version !== first)) {
        const sorted = Object.entries(applications).sort(([, a], [, b]) =>
          a.localeCompare(b, undefined, { numeric: true })
        );
        dependencyVersionDiff[dependency] = sorted;
      }
    }
  }
  return dependencyVersionDiff;
};

const printDependencyVersionDiff = async (
  dependencyVersionDiff?: Record<string, [string, string][]>
) => {
  if (!dependencyVersionDiff) {
    dependencyVersionDiff = await getDependencyVersionDiff('dependencies');
  }
  let count = 1;
  for (const [dependency, applications] of Object.entries(
    dependencyVersionDiff
  )) {
    const output = table(applications, {
      columns: [
        {
          width: 20,
          alignment: 'right',
        },
        {
          width: 20,
        },
      ],
      header: {
        // content: `#${count}\n${dependency}`,
        content: dependency,
        wrapWord: false,
      },
    });
    console.log(output);
    count += 1;
  }

  console.log('Possible upgrades list:');
  console.log(JSON.stringify(Object.keys(dependencyVersionDiff), null, 2));
};

export const upgradeToMinVersion = async (dependencyType: DependencyType) => {
  const dependencyVersionDiff = await getDependencyVersionDiff(dependencyType);
  await printDependencyVersionDiff(dependencyVersionDiff);

  console.log('Attempting to upgrade...');

  // const allowedUpgrades = [
  // Batch 1 done
  // '@sentry/cli',
  // '@stripe/stripe-js',
  // '@stripe/react-stripe-js',
  // '@types/luxon',
  // 'luxon',
  // '@testing-library/jest-dom',
  // '@testing-library/react',
  // '@testing-library/user-event',
  // 'react-hook-form',
  // 'react-scripts',
  // 'graphql',
  // '@apollo/client',
  // 'react-use-intercom',
  // 'react',
  // 'react-dom',
  // 'typescript',
  // 'web-vitals',
  // TODO
  // "react-router-dom",
  // "@emotion/react",
  // "@emotion/styled",
  // "@mui/icons-material",
  // "@mui/lab",
  // "@mui/material",
  // "@mui/styles"
  // ];

  const allowedUpgrades = [
    '@graphql-codegen/cli',
    '@graphql-codegen/introspection',
    '@graphql-codegen/typescript',
    '@graphql-codegen/typescript-operations',
    '@graphql-codegen/typescript-react-apollo',
    '@testing-library/jest-dom',
    '@testing-library/react',
    '@testing-library/user-event',
    '@types/jest',

    '@types/luxon',
    '@types/node',
    '@types/react-dom',
    '@types/react-router-dom',
    '@react-native-community/eslint-config',
    '@types/lodash',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    'babel-plugin-module-resolver',
    'patch-package',
    'prettier',
    '@sentry/cli',
    'concurrently',

    '@sentry/react',

    'typescript',
    // "@types/react",
    '@emotion/react',
    '@emotion/styled',
    '@mui/icons-material',
    '@mui/lab',
    '@mui/material',
    '@mui/styles',
  ];

  const needsYarnInstall = new Set<string>();

  for (const [dependency, applications] of Object.entries(
    dependencyVersionDiff
  )) {
    if (!allowedUpgrades.includes(dependency)) {
      continue;
    }

    const [, version] = applications.pop();
    for (const [application, currentVersion] of applications) {
      console.log(
        `Upgrading ${dependency} in ${application} from ${currentVersion} to ${version}`
      );
      needsYarnInstall.add(application);
      const path = `${packagesPath}/${application}/package.json`;
      const packageJson = await readJson(path);
      packageJson[dependencyType][dependency] = version;
      await writeJson(path, { ...packageJson }, { spaces: 2 });
    }
  }

  await yarnInstall(needsYarnInstall);
};
