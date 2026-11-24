const { defineConfig, devices } = require('@playwright/test');

const run = process.env.DEMO_FAILURE === '1' ? 'demo' : 'final';

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  timeout: 30000,
  expect: { timeout: 7000 },
  outputDir: `test-results/${run}`,
  reporter: [
    ['list'],
    ['html', { outputFolder: `reports/${run}`, open: 'never' }],
    ['json', { outputFile: `results/${run}.json` }],
  ],
  metadata: {
    assignment: 'Практическая работа 7. Вариант 1. Каталог товаров',
    application: 'OWASP Juice Shop 20.4.0-SNAPSHOT',
    run: run === 'demo' ? 'Учебное неверное ожидание C01' : 'Итоговый прогон каталога товаров',
  },
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
    ...devices['Desktop Chrome'],
    locale: 'en-US',
    timezoneId: 'Europe/Moscow',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
