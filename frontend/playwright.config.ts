import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const FRONTEND_URL = 'http://localhost:5173'
const BACKEND_URL = 'http://localhost:3000'
const backendDir = fileURLToPath(new URL('../backend', import.meta.url))

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Reutiliza las apps ya levantadas; si no lo están, las arranca. El backend
  // necesita `pnpm db:setup` hecho al menos una vez (crea y siembra la BD).
  webServer: [
    {
      command: 'pnpm start:dev',
      cwd: backendDir,
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'pnpm dev',
      url: FRONTEND_URL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
