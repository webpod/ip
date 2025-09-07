import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    include: ['src/test/smoke/browser.test.js'],
    browser: {
      provider: 'playwright',
      enabled: true,
      instances: [
        { browser: 'chromium' },
      ],
    },
  }
})
