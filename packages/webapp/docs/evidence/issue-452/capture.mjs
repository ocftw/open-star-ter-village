import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Dev server + test login (real PostgreSQL via TEST_DATABASE_URL): guest-lobby, onboarding,
// onboarding-nickname-error (390px), member-lobby, restored-match.
const webapp = new URL('../../../', import.meta.url);
const env = {
  ...process.env,
  E2E_REQUIRE_DB: '1',
  AUTH_TEST_LOGIN: '1',
  PLAYWRIGHT_WEB_PORT: '3590',
  PLAYWRIGHT_GAME_SERVER_PORT: '3591',
  MEMBER_EVIDENCE_DIR: fileURLToPath(new URL('./', import.meta.url)),
};
let result = spawnSync('pnpm', ['e2e', 'e2e/member-sign-in-persist.spec.ts', '--reporter=line'], { cwd: webapp, env, stdio: 'inherit' });
// Production build (run `pnpm e2e:production` once first): lobby-header-mobile (390px, member notice).
if (result.status === 0 && existsSync(new URL('.next/standalone', webapp))) {
  result = spawnSync('npx', ['playwright', 'test', '--config', 'playwright.production.config.ts', '-g', '390px lobby header'], {
    cwd: webapp, env: { ...env, PLAYWRIGHT_PRODUCTION_WEB_PORT: '3593', PLAYWRIGHT_BROWSERS_PATH: '/tmp/pw-browsers' }, stdio: 'inherit',
  });
}
process.exitCode = result.status ?? 1;
