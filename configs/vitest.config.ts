import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/integration/setup.ts'],
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['tests/e2e/**/*'],
    typecheck: {
      enabled: true,
      tsconfig: './configs/tsconfig.test.json',
    },
  },
})
