/**
 * Tests E2E de Autenticación
 * Cubre: Login, Logout, Validaciones
 */
import { test, expect, TestHelpers, TEST_USER } from '../fixtures/test-fixtures';

test.describe('Autenticación', () => {
  
  test.describe('Login', () => {
    // Para tests de login, no usamos el estado autenticado
    test.use({ storageState: { cookies: [], origins: [] } });

    test('debe mostrar la página de login correctamente', async ({ page }) => {
      await page.goto('/#/login');
      
      // Verificar elementos del formulario
      await expect(page.getByText('Bienvenido')).toBeVisible();
      await expect(page.getByLabel('Usuario')).toBeVisible();
      await expect(page.getByLabel('Contraseña')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
    });

    test('debe hacer login exitoso con credenciales válidas', async ({ page }) => {
      await page.goto('/#/login');
      
      // Llenar formulario
      await page.getByLabel('Usuario').fill(TEST_USER.username);
      await page.getByLabel('Contraseña').fill(TEST_USER.password);
      
      // Submit
      await page.getByRole('button', { name: 'Ingresar' }).click();
      
      // Verificar redirección al dashboard
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
    });

    test('debe mostrar error con credenciales inválidas', async ({ page }) => {
      await page.goto('/#/login');
      
      // Llenar con credenciales incorrectas
      await page.getByLabel('Usuario').fill('usuario_invalido');
      await page.getByLabel('Contraseña').fill('contraseña_incorrecta');
      
      // Submit
      await page.getByRole('button', { name: 'Ingresar' }).click();
      
      // Verificar mensaje de error (toast)
      const errorToast = page.locator('[data-sonner-toast]').filter({ hasText: /error|incorrecto|inválido/i });
      await expect(errorToast.first()).toBeVisible({ timeout: 10000 });
      
      // Verificar que seguimos en login
      await expect(page).toHaveURL(/.*login/);
    });

    test('debe validar campos requeridos', async ({ page }) => {
      await page.goto('/#/login');
      
      // Intentar submit sin llenar campos
      await page.getByRole('button', { name: 'Ingresar' }).click();
      
      // Verificar mensajes de validación
      await expect(page.getByText(/requerido/i).first()).toBeVisible();
    });

    test('debe poder mostrar/ocultar contraseña', async ({ page }) => {
      await page.goto('/#/login');
      
      const passwordInput = page.getByLabel('Contraseña');
      const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).last();
      
      // Verificar que inicialmente está oculta
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click en el botón de mostrar
      await toggleButton.click();
      
      // Verificar que ahora es visible
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('debe redirigir a login si no está autenticado', async ({ page }) => {
      // Intentar acceder a ruta protegida
      await page.goto('/#/dashboard');
      
      // Debe redirigir a login
      await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });
  });

  test.describe('Logout', () => {
    test('debe poder cerrar sesión correctamente', async ({ page, helpers }) => {
      // Navegar al dashboard
      await helpers.navigateTo('/dashboard');
      
      // Buscar y hacer click en el menú de usuario o botón de logout
      // El logout generalmente está en un dropdown del header
      const userMenu = page.locator('[data-testid="user-menu"]').or(
        page.getByRole('button').filter({ has: page.locator('svg[class*="user"]') })
      );
      
      // Si hay un menú de usuario, hacer click
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.getByRole('menuitem', { name: /cerrar sesión|logout|salir/i }).click();
      } else {
        // Buscar botón de logout directo
        const logoutButton = page.getByRole('button', { name: /cerrar sesión|logout|salir/i });
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
        }
      }
      
      // Verificar redirección a login
      await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });
  });

  test.describe('Sesión persistente', () => {
    test('debe mantener la sesión después de recargar la página', async ({ page, helpers }) => {
      // Navegar al dashboard
      await helpers.navigateTo('/dashboard');
      
      // Verificar que estamos en el dashboard
      await helpers.expectRoute('/dashboard');
      
      // Recargar la página
      await page.reload();
      
      // Verificar que seguimos autenticados
      await helpers.waitForLoading();
      await helpers.expectRoute('/dashboard');
    });
  });
});

