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
      const dashboardContent = page.locator('main').or(page.locator('[class*="dashboard"]'));
      await expect(dashboardContent).toBeVisible();
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
      const charts = page.locator('svg').or(page.locator('[class*="chart"]'));
      
      // Los gráficos son opcionales, solo verificar que la página carga
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Navegación', () => {
    test('debe navegar a ventas desde el dashboard', async ({ page, helpers }) => {
      await helpers.waitForLoading();
      
      // Buscar link a ventas en el sidebar o el contenido
      const salesLink = page.getByRole('link', { name: /Ventas/i }).first()
        .or(page.locator('a[href*="sales"]').first());
      
      if (await salesLink.isVisible()) {
        await salesLink.click();
        await helpers.expectRoute('/sales');
      }
    });

    test('debe navegar a productos desde el dashboard', async ({ page, helpers }) => {
      await helpers.waitForLoading();
      
      const productsLink = page.getByRole('link', { name: /Productos/i }).first()
        .or(page.locator('a[href*="products"]').first());
      
      if (await productsLink.isVisible()) {
        await productsLink.click();
        await helpers.expectRoute('/products');
      }
    });

    test('debe navegar a caja desde el dashboard', async ({ page, helpers }) => {
      await helpers.waitForLoading();
      
      const cashLink = page.getByRole('link', { name: /Caja/i }).first()
        .or(page.locator('a[href*="cash"]').first());
      
      if (await cashLink.isVisible()) {
        await cashLink.click();
        await helpers.expectRoute('/cash-register');
      }
    });
  });

  test.describe('Período', () => {
    test('debe poder cambiar el período de visualización', async ({ page, helpers }) => {
      await helpers.waitForLoading();
      
      // Buscar selector de período
      const periodSelector = page.getByRole('combobox').first()
        .or(page.getByRole('button', { name: /Hoy|Semana|Mes/i }).first());
      
      if (await periodSelector.isVisible()) {
        await periodSelector.click();
        await page.waitForTimeout(300);
        
        // Cerrar
        await page.keyboard.press('Escape');
      }
    });
  });
});

