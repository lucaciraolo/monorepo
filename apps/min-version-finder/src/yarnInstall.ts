import { cd, $ } from 'zx';

const packagesPath = '/Users/lucaciraolo/projects/ark/core/packages';

export const yarnInstall = async (needsYarnInstall?: Set<string>) => {
  if (!needsYarnInstall) {
    needsYarnInstall = new Set([
      'ast-generator',
      'concierge-app',
      'manager-dashboard',
      'resident-app',
      'resident-dashboard',
      'section21-generator',
    ]);
  }
  await $`node -v`;
  for (const application of needsYarnInstall) {
    console.log(`running yarn install for ${application}`);
    cd(`${packagesPath}/${application}`);
    // await $`rm -rf node_modules`;
    await $`yarn install`;
  }
};
