import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/e2e/**/*.spec.ts'],
    testTimeout: 120_000,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
