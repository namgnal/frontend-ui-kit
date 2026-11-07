import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.mjs', timeout: 30000, fullyParallel: false, workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4174', viewport: { width: 1360, height: 1000 },
    headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure',
    launchOptions: process.env.FUI_BROWSER ? { executablePath: process.env.FUI_BROWSER } : {},
  },
  webServer: { command: 'npm run preview', url: 'http://127.0.0.1:4174', reuseExistingServer: false },
});
