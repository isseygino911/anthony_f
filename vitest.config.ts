import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts (which drives the app build) to keep the
// test runner config isolated from production build config, per
// less-is-more / single-responsibility.
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
