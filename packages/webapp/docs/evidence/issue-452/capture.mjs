import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const result = spawnSync('pnpm', ['e2e', 'e2e/member-sign-in-persist.spec.ts', '--reporter=line'], {
  cwd: new URL('../../../', import.meta.url),
  env: {
    ...process.env,
    E2E_REQUIRE_DB: '1',
    AUTH_TEST_LOGIN: '1',
    PLAYWRIGHT_WEB_PORT: '3590',
    PLAYWRIGHT_GAME_SERVER_PORT: '3591',
    MEMBER_EVIDENCE_DIR: fileURLToPath(new URL('./', import.meta.url)),
  },
  stdio: 'inherit',
});
process.exitCode = result.status ?? 1;
