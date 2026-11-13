import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/preview',
  workers: 1,
  use: {
    ...devices['Pixel 7'],
    baseURL: 'http://127.0.0.1:4175/POS-Software/',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
  webServer: {
    command: 'python3 tests/preview/serve-build.py',
    url: 'http://127.0.0.1:4175/POS-Software/',
    reuseExistingServer: false,
  },
});
