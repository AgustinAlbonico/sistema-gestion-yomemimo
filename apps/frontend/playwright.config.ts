/**
 * Configuración de Playwright para tests E2E
 * Sistema de Gestión POS - NexoPOS
 */
import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directorio donde se encuentran los tests
  testDir: './e2e',

  // Ejecutar tests en paralelo dentro de cada archivo
  fullyParallel: true,

  // Fallar si hay test.only en CI
  forbidOnly: !!process.env.CI,

  // Reintentos en CI
  retries: process.env.CI ? 2 : 0,

  // Workers en paralelo (reducido en CI para estabilidad)
  workers: process.env.CI ? 1 : undefined,

  // Reporter de resultados
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // Configuración global compartida por todos los tests
  use: {
    // URL base de la aplicación
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

    // Capturar traza en caso de fallo (útil para debugging)
    trace: 'on-first-retry',

    // Capturar screenshot en caso de fallo
    screenshot: 'only-on-failure',

    // Video solo en reintentos
    video: 'on-first-retry',

    // Timeout de acciones (clicks, fills, etc)
    actionTimeout: 10000,

    // Timeout de navegación
    navigationTimeout: 30000,

    // Ignorar errores HTTPS (útil en desarrollo)
    ignoreHTTPSErrors: true,

    // Locale y timezone para Argentina
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
  },

  // Timeout global por test
  timeout: 60000,

  // Timeout para expects
  expect: {
    timeout: 10000,
  },

  // Configuración de proyectos (navegadores)
  projects: [
    // Setup de autenticación (se ejecuta primero)
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Tests en Chromium (principal)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Usar estado de autenticación guardado
        storageState: 'e2e/.auth/user.json',
      },
      // Buscar tests en la carpeta tests/
      testMatch: /tests\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },

    // Setup de autenticación con caja abierta (para ventas, ingresos, gastos, compras)
    {
      name: 'setup-with-cash',
      testMatch: /auth\.setup-with-cash\.ts/,
    },

    // Tests que requieren caja abierta (ventas, ingresos, gastos, compras)
    // NOTA: Se ejecutan en serie con un solo worker porque comparten el estado
    // de caja en el servidor. Solo puede haber una caja abierta por usuario a la vez.
    {
      name: 'with-cash',
      testMatch: /(sales|incomes|expenses|purchases)\.spec\.ts/,
      fullyParallel: false,
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
        // Usar estado de autenticación con caja ya abierta
        storageState: 'e2e/.auth/user-with-cash.json',
      },
      dependencies: ['setup-with-cash'],
    },

    // Tests en Firefox (opcional)
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: 'e2e/.auth/user.json',
    //   },
    //   testMatch: /tests\/.*\.spec\.ts/,
    //   dependencies: ['setup'],
    // },
  ],

  // Servidor de desarrollo (opcional - iniciar frontend automáticamente)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});

