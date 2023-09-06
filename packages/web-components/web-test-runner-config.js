import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';
import { config } from 'dotenv';

config();
const { INTEGRATION_TEST_DATASET_ID: INTEGRATION_TEST_DATASET_ID, INTEGRATION_TEST_API_KEY: INTEGRATION_TEST_API_KEY} = process.env;
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
    preserveSymlinks: true,
    testFramework: {
        // https://mochajs.org/api/mocha
        config: {
            ui: 'tdd',
            timeout: '60000',
        },
    },
    plugins: [esbuildPlugin({ ts: true, tsconfig: 'tsconfig.json' })],
    testRunnerHtml: testFramework =>
        `<html>
            <body>
                <script>window.process = { env: { INTEGRATION_TEST_DATASET_ID:"${INTEGRATION_TEST_DATASET_ID}", INTEGRATION_TEST_API_KEY:"${INTEGRATION_TEST_API_KEY}" } }</script>
                <script type="module" src="${testFramework}"></script>
            </body>
         </html>`,
};  

