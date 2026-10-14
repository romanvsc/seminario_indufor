import { defineConfig, devices } from '@playwright/test'

// E2E contra backend y SPA reales, en puertos y base propios (indufor_db_e2e): no tocan la base de desarrollo.
const php = process.env.PHP_BIN ?? 'php'
export const ADMIN = { email: 'admin@indufor.test', password: 'e2e-admin-123' } // credenciales de prueba, solo para indufor_db_e2e

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:5174', trace: 'retain-on-failure', locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Base limpia en cada corrida: migrate:fresh + seeders (RBAC, frentes, admin de prueba)
      // --no-reload: serve pasa estas variables de entorno al servidor en vez de releer el .env
      command: `${php} artisan migrate:fresh --seed --force && ${php} artisan serve --host=127.0.0.1 --port=8001 --no-reload`,
      cwd: '../backend',
      url: 'http://127.0.0.1:8001/up',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        APP_ENV: 'local',
        DB_DATABASE: 'indufor_db_e2e',
        FRONTEND_URL: 'http://localhost:5174',
        SANCTUM_STATEFUL_DOMAINS: 'localhost:5174',
        SESSION_DOMAIN: 'localhost',
        SEED_ADMIN_EMAIL: ADMIN.email,
        SEED_ADMIN_PASSWORD: ADMIN.password,
        LOGIN_MAX_ATTEMPTS: '60',
      },
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      url: 'http://localhost:5174',
      reuseExistingServer: false,
      env: { VITE_API_URL: 'http://localhost:8001' },
    },
  ],
})
