import { readJson, writeJson } from 'fs-extra/esm';
import { readdir } from 'fs/promises';
import { table } from 'table';
import { $, cd } from 'zx';

const packagesPath = '/Users/lucaciraolo/projects/ark/core/packages';

const packages = {};

for await (const application of await readdir(packagesPath)) {
  if (application.includes('.')) {
    continue;
  }
  const path = `${packagesPath}/${application}/package.json`;
  const { dependencies } = await readJson(path);
  for (const [dependency, version] of Object.entries(dependencies)) {
    if (!packages[dependency]) {
      packages[dependency] = {};
    }
    packages[dependency][application] = version;
  }
}

type Diff = Record<string, [string, string][]>;
const diff: Diff = {};
for (const [dependency, applications] of Object.entries(packages)) {
  const versions = Object.values(applications);
  if (versions.length > 1) {
    const [first, ...rest] = versions;
    if (rest.some((version) => version !== first)) {
      const sorted = Object.entries(applications).sort(([, a], [, b]) =>
        a.localeCompare(b)
      );
      diff[dependency] = sorted;
    }
  }
}

let count = 1;
for (const [dependency, applications] of Object.entries(diff)) {
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
console.log(JSON.stringify(Object.keys(diff), null, 2));

console.log('Attempting to upgrade...');

const allowedUpgrades = [
  // Batch 1 done
  '@sentry/cli',
  '@stripe/stripe-js',
  '@stripe/react-stripe-js',
  '@types/luxon',
  'luxon',
  '@testing-library/jest-dom',
  '@testing-library/react',
  '@testing-library/user-event',
  'react-hook-form',
  'react-scripts',
  'graphql',
  '@apollo/client',
  'react-use-intercom',

  // 'typescript', //seems to break ast generator
  // TODO

  // "react",
  // "react-router-dom",
  // "web-vitals",
  // "@amplitude/react-native",
  // "@react-native-async-storage/async-storage",
  // "@react-native-community/checkbox",
  // "@react-navigation/bottom-tabs",
  // "@react-navigation/native",
  // "@react-navigation/stack",
  // "@sentry/react-native",
  // "@types/react-native-vector-icons",
  // "appcenter",
  // "appcenter-analytics",
  // "appcenter-crashes",
  // "react-native",
  // "react-native-device-info",
  // "react-native-fs",
  // "react-native-gesture-handler",
  // "react-native-gifted-chat",
  // "react-native-image-crop-picker",
  // "react-native-image-header-scroll-view",
  // "react-native-modal",
  // "react-native-render-html",
  // "react-native-safe-area-context",
  // "react-native-screens",
  // "react-native-splash-screen",
  // "react-native-svg",
  // "react-native-vector-icons",
  // "@emotion/react",
  // "@emotion/styled",
  // "@mui/icons-material",
  // "@mui/lab",
  // "@mui/material",
  // "@mui/styles"
];

const needsYarnInstall = new Set<string>();

for (const [dependency, applications] of Object.entries(diff)) {
  if (!allowedUpgrades.includes(dependency)) {
    continue;
  }

  const [_, version] = applications.pop();
  for (const [application, currentVersion] of applications) {
    console.log(
      `Upgrading ${dependency} in ${application} from ${currentVersion} to ${version}`
    );
    needsYarnInstall.add(application);
    const path = `${packagesPath}/${application}/package.json`;
    const packageJson = await readJson(path);
    packageJson['dependencies'][dependency] = version;
    await writeJson(path, { ...packageJson }, { spaces: 2 });
  }
}

await $`node -v`;

for (const application of needsYarnInstall) {
  console.log(`running yarn install for ${application}`);
  cd(`${packagesPath}/${application}`);
  await $`yarn install`;
}
