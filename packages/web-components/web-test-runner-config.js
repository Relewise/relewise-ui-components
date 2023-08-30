import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';

const mode = process.env.MODE || 'dev';
if (!['dev', 'prod'].includes(mode)) {
    throw new Error(`MODE must be "dev" or "prod", was "${mode}"`);
}

const browsers = {
    chromium: playwrightLauncher({product: 'chromium'}),
    firefox: playwrightLauncher({product: 'firefox'}),
    webkit: playwrightLauncher({product: 'webkit'}),
};

export default {
    files: ['tests/**/*.test.ts'],
    browsers: Object.values(browsers),
    nodeResolve: {exportConditions: mode === 'dev' ? ['development'] : []},
    plugins: [esbuildPlugin({ ts: true })],
};

