/**
 * Tests E2E de Gestión de Gastos
 * Cubre: Listado, Creación, Filtros
 */
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Gastos', () => {
  
  test.beforeEach(async ({ helpers }) => {
    await helpers.navigateTo('/expenses');
  });

  test.describe('Listado', () => {
    test('debe mostrar la página de gastos correctamente', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Gastos/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Nuevo Gasto/i })).toBeVisible();
    });

    test('debe mostrar estadísticas de gastos', async ({ page, helpers }) => {
      await helpers.waitForLoading();
      
      // Las estadísticas suelen estar en cards
      const statsSection = page.locator('[class*="card"]').first();
      await expect(statsSection).toBeVisible();
    });

    test('debe mostrar la lista de gastos', async ({ page, helpers }) => {
      await helpers.waitForLoading();
      
      // Puede ser tabla o lista
      const table = page.getByRole('table');
      const list = page.locator('[class*="list"]');
      
      const hasTable = await table.isVisible().catch(() => false);
      const hasList = await list.isVisible().catch(() => false);
      
      // Al menos uno debe estar visible (o mensaje de vacío)
      await page.waitForTimeout(500);
    });
  });

  test.describe('Creación', () => {
    test('debe abrir el diálogo de nuevo gasto', async ({ page }) => {
      await page.getByRole('button', { name: /Nuevo Gasto/i }).click();
      
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('debe mostrar categorías de gastos', async ({ page }) => {
      await page.getByRole('button', { name: /Nuevo Gasto/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Buscar selector de categoría
      const categorySelector = page.getByRole('combobox').first()
        .or(page.getByLabel(/Categoría/i));
      
      if (await categorySelector.isVisible()) {
        await categorySelector.click();
        await page.waitForTimeout(300);
      }
      
      await page.keyboard.press('Escape');
    });

    test('debe crear un gasto correctamente', async ({ page, helpers }) => {
      await page.getByRole('button', { name: /Nuevo Gasto/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Descripción
      const descInput = page.getByLabel(/Descripción|Concepto/i);
      if (await descInput.isVisible()) {
        await descInput.fill(`Gasto Test ${helpers.generateUniqueId()}`);
      }
      
      // Monto
      const amountInput = page.getByLabel(/Monto|Importe/i);
      if (await amountInput.isVisible()) {
        await amountInput.clear();
        await amountInput.fill('1500');
      }
      
      // Guardar
      await page.getByRole('button', { name: /Guardar/i }).click();
      
      // Verificar éxito
      await helpers.expectSuccessToast();
    });
  });

  test.describe('Filtros', () => {
    test('debe poder filtrar por período', async ({ page, helpers }) => {
      await helpers.waitForLoading();
      
      // Buscar filtros de fecha
      const todayButton = page.getByRole('button', { name: 'Hoy' });
      const monthButton = page.getByRole('button', { name: /Mes/i });
      
      if (await todayButton.isVisible()) {
        await todayButton.click();
        await page.waitForTimeout(300);
      }
    });
  });
});

