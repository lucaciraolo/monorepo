import { readJson } from 'fs-extra';
import { table } from 'table';

const paths = {
  'manager-dashboard':
    '/Users/lucaciraolo/projects/ark/core/packages/manager-dashboard/package.json',
  'ast-generator':
    '/Users/lucaciraolo/projects/ark/core/packages/ast-generator/package.json',
  common: '/Users/lucaciraolo/projects/ark/core/packages/common/package.json',
  'concierge-app':
    '/Users/lucaciraolo/projects/ark/core/packages/concierge-app/package.json',
  'resident-app':
    '/Users/lucaciraolo/projects/ark/core/packages/resident-app/package.json',
  'resident-dashboard':
    '/Users/lucaciraolo/projects/ark/core/packages/resident-dashboard/package.json',
  'section21-generator':
    '/Users/lucaciraolo/projects/ark/core/packages/section21-generator/package.json',
};

const main = async () => {
  const packages = {};

  for (const [application, path] of Object.entries(paths)) {
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
};
main();
