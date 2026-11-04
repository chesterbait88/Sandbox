import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['config/**/*.test.ts', 'client/src/**/*.test.ts', 'server/src/**/*.test.ts'],
    environment: 'node'
  }
});
