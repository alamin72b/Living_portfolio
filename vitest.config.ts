import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
    environment: 'node',
    maxWorkers: 1,
    testTimeout: 30000,
    hookTimeout: 60000,
    coverage: { reporter: ['text', 'html'] },
  },
});
