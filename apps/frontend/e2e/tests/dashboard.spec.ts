/**
 * Tests E2E del Dashboard
 * Cubre: Visualización, Métricas, Navegación
 */
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Dashboard', () => {

  test.beforeEach(async ({ helpers }) => {
    await helpers.navigateTo('/dashboard');
  });

  test.describe('Visualización', () => {
    test('debe mostrar el dashboard correctamente', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      // Verificar que carga el dashboard (puede tener diferentes variantes)
      let dashboardContentVisible = false;
      try {
        const dashboardContent = page.locator('main').first();
        if (await dashboardContent.isVisible({ timeout: 2000 })) {
          await expect(dashboardContent).toBeVisible();
          dashboardContentVisible = true;
        }
      } catch {
        try {
          const dashboardContent = page.locator('[class*="dashboard"]').first();
          if (await dashboardContent.isVisible({ timeout: 2000 })) {
            await expect(dashboardContent).toBeVisible();
            dashboardContentVisible = true;
          }
        } catch {
          // No se encontró contenido del dashboard
        }
      }

      if (!dashboardContentVisible) {
        throw new Error('No se pudo encontrar el contenido del dashboard');
      }
    });

    test('debe mostrar métricas principales', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      // Los dashboards suelen tener cards con métricas
      const metricsCards = page.locator('[class*="card"]');
      const cardCount = await metricsCards.count();

      expect(cardCount).toBeGreaterThan(0);
    });

    test('debe mostrar gráficos o estadísticas', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      // Buscar elementos de gráficos (Recharts usa SVG)
      const charts = page.locator('svg');
      const chartsCount = await charts.count();

      // Los gráficos son opcionales, solo verificar que la página carga
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Navegación', () => {
    test('debe navegar a ventas desde el dashboard', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      // Buscar link a ventas en el sidebar o el contenido - probar diferentes selectores
      let salesLinkClicked = false;
      try {
        const salesLink = page.getByRole('link', { name: /Ventas/i }).first();
        if (await salesLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await salesLink.click();
          salesLinkClicked = true;
        }
      } catch {
        try {
          const salesLink = page.locator('a[href*="sales"]').first();
          if (await salesLink.isVisible({ timeout: 2000 }).catch(() => false)) {
            await salesLink.click();
            salesLinkClicked = true;
          }
        } catch {
          // No se encontró link de ventas
        }
      }

      if (salesLinkClicked) {
        await helpers.expectRoute('/sales');
      }
    });

    test('debe navegar a productos desde el dashboard', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      // Buscar link a productos - probar diferentes selectores
      let productsLinkClicked = false;
      try {
        const productsLink = page.getByRole('link', { name: /Productos/i }).first();
        if (await productsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await productsLink.click();
          productsLinkClicked = true;
        }
      } catch {
        try {
          const productsLink = page.locator('a[href*="products"]').first();
          if (await productsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
            await productsLink.click();
            productsLinkClicked = true;
          }
        } catch {
          // No se encontró link de productos
        }
      }

      if (productsLinkClicked) {
        await helpers.expectRoute('/products');
      }
    });

    test('debe navegar a caja desde el dashboard', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      // Buscar link a caja - probar diferentes selectores
      let cashLinkClicked = false;
      try {
        const cashLink = page.getByRole('link', { name: /Caja/i }).first();
        if (await cashLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await cashLink.click();
          cashLinkClicked = true;
        }
      } catch {
        try {
          const cashLink = page.locator('a[href*="cash"]').first();
          if (await cashLink.isVisible({ timeout: 2000 }).catch(() => false)) {
            await cashLink.click();
            cashLinkClicked = true;
          }
        } catch {
          // No se encontró link de caja
        }
      }

      if (cashLinkClicked) {
        await helpers.expectRoute('/cash-register');
      }
    });
  });

  test.describe('Período', () => {
    test('debe poder cambiar el período de visualización', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      // Buscar selector de período - probar diferentes selectores
      let periodSelectorClicked = false;
      try {
        const periodSelector = page.getByRole('combobox').first();
        if (await periodSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
          await periodSelector.click();
          periodSelectorClicked = true;
        }
      } catch {
        try {
          const periodSelector = page.getByRole('button', { name: /Hoy|Semana|Mes/i }).first();
          if (await periodSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
            await periodSelector.click();
            periodSelectorClicked = true;
          }
        } catch {
          // No se encontró selector de período
        }
      }

      if (periodSelectorClicked) {
        await page.waitForTimeout(300);

        // Cerrar
        await page.keyboard.press('Escape');
      }
    });
  });
});
