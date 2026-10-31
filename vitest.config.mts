import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.dirname(fileURLToPath(import.meta.url)) + '/src' } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/__tests__/setupTests.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/__tests__/**', 'src/types/**', '**/*.d.ts'],
      thresholds: { functions: 90 }
    }
  }
});
