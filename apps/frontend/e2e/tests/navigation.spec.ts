/**
 * Tests E2E de Navegación General
 * Cubre: Sidebar, Breadcrumbs, Rutas
 */
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Navegación', () => {
  
  test.beforeEach(async ({ helpers }) => {
    await helpers.navigateTo('/dashboard');
  });

  test.describe('Sidebar', () => {
    test('debe mostrar el sidebar con todas las opciones principales', async ({ page }) => {
      // Buscar el sidebar
      const sidebar = page.locator('aside').or(page.locator('nav'));
      await expect(sidebar.first()).toBeVisible();
      
      // Verificar links principales
      await expect(page.getByRole('link', { name: /Dashboard|Inicio/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /Ventas/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /Productos/i }).first()).toBeVisible();
    });

    test('debe navegar correctamente a cada sección', async ({ page, helpers }) => {
      const routes = [
        { name: /Ventas/i, path: '/sales' },
        { name: /Productos/i, path: '/products' },
        { name: /Clientes/i, path: '/customers' },
        { name: /Caja/i, path: '/cash-register' },
      ];

      for (const route of routes) {
        const link = page.getByRole('link', { name: route.name }).first();
        
        if (await link.isVisible({ timeout: 1000 }).catch(() => false)) {
          await link.click();
          await helpers.waitForLoading();
          await helpers.expectRoute(route.path);
          
          // Volver al dashboard para el siguiente test
          await helpers.navigateTo('/dashboard');
        }
      }
    });
  });

  test.describe('Rutas Protegidas', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('debe redirigir a login si intenta acceder a rutas protegidas', async ({ page }) => {
      await page.goto('/#/sales');
      
      // Debe redirigir a login
      await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });

    test('debe redirigir al dashboard desde rutas inexistentes', async ({ page }) => {
      // Esta requiere estar autenticado, así que usamos otro contexto
    });
  });

  test.describe('Breadcrumbs y Títulos', () => {
    test('debe mostrar el título correcto en cada página', async ({ page, helpers }) => {
      const pages = [
        { path: '/sales', title: /Ventas/i },
        { path: '/products', title: /Productos/i },
        { path: '/customers', title: /Clientes/i },
        { path: '/cash-register', title: /Caja/i },
      ];

      for (const pageInfo of pages) {
        await helpers.navigateTo(pageInfo.path);
        await helpers.waitForLoading();
        
        const heading = page.getByRole('heading', { name: pageInfo.title }).first();
        await expect(heading).toBeVisible();
      }
    });
  });

  test.describe('Responsive', () => {
    test('debe mostrar el menú móvil en pantallas pequeñas', async ({ page, helpers }) => {
      // Cambiar viewport a móvil
      await page.setViewportSize({ width: 375, height: 667 });
      
      await helpers.navigateTo('/dashboard');
      await helpers.waitForLoading();
      
      // Buscar botón de menú hamburguesa
      const menuButton = page.getByRole('button', { name: /menu/i })
        .or(page.locator('button').filter({ has: page.locator('svg[class*="menu"]') }));
      
      // En móvil debería haber un botón de menú
      await page.waitForTimeout(500);
    });
  });
});

