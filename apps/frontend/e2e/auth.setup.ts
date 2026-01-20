/**
 * Setup de autenticación para tests E2E
 * Se ejecuta antes de todos los tests para guardar el estado de sesión
 */
import { test as setup, expect } from '@playwright/test';
import { TEST_USER } from './fixtures/test-fixtures';

const authFile = 'e2e/.auth/user.json';

/**
 * Setup: Login y guardar estado de autenticación
 * Este estado se reutiliza en todos los tests para evitar hacer login repetidamente
 *
 * NOTA: La caja no se abre aquí porque el formulario de apertura tiene validaciones
 * complejas (sugerencias del servidor, ajustes manuales, etc.). Los tests que necesitan
 * caja abierta deben abrirla ellos mismos usando el helper `ensureCashRegisterOpen()`.
 */
setup('autenticar usuario', async ({ page }) => {
  // Navegar a la página de login
  await page.goto('/#/login');

  // Esperar a que cargue el formulario
  await expect(page.getByText('Bienvenido')).toBeVisible({ timeout: 15000 });

  // Llenar credenciales
  await page.getByLabel('Usuario').fill(TEST_USER.username);
  await page.getByLabel('Contraseña').fill(TEST_USER.password);

  // Hacer click en el botón de login
  await page.getByRole('button', { name: 'Ingresar' }).click();

  // Esperar navegación al dashboard
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

  // Verificar que el usuario está logueado (visible en el layout)
  await expect(page.getByText(/dashboard|inicio/i).first()).toBeVisible();

  // Guardar estado de autenticación
  await page.context().storageState({ path: authFile });
});

