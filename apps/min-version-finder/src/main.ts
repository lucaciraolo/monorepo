import { checkDevDeps } from './checkDevDeps.js';
import { upgradeToMinVersion } from './upgradeToMinVersion.js';
import { yarnInstall } from './yarnInstall.js';

await upgradeToMinVersion('dependencies');
// await upgradeToMinVersion('devDependencies');
// await checkDevDeps();
// await yarnInstall();
