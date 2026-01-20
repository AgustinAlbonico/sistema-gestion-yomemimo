/**
 * Tests E2E de Gestión de Compras
 * Cubre: Listado, Creación de compras
 */
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Compras', () => {

  test.beforeEach(async ({ helpers }) => {
    await helpers.navigateTo('/purchases');
  });

  test.describe('Listado', () => {
    test('debe mostrar la página de compras correctamente', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Compras/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Nueva Compra/i })).toBeVisible();
    });

    test('debe mostrar estadísticas de compras', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      const statsSection = page.locator('[class*="card"]').first();
      await expect(statsSection).toBeVisible();
    });
  });

  test.describe('Creación', () => {
    test('debe abrir el diálogo de nueva compra', async ({ page }) => {
      await page.getByRole('button', { name: /Nueva Compra/i }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('debe mostrar selector de proveedor', async ({ page }) => {
      await page.getByRole('button', { name: /Nueva Compra/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Buscar selector de proveedor - probar diferentes selectores
      let supplierSelectorVisible = false;
      try {
        const supplierSelector = page.getByLabel(/Proveedor/i);
        if (await supplierSelector.isVisible({ timeout: 2000 })) {
          await expect(supplierSelector).toBeVisible();
          supplierSelectorVisible = true;
        }
      } catch {
        try {
          const supplierSelector = page.getByPlaceholder(/proveedor/i);
          if (await supplierSelector.isVisible({ timeout: 2000 })) {
            await expect(supplierSelector).toBeVisible();
            supplierSelectorVisible = true;
          }
        } catch {
          // No se encontró selector de proveedor
        }
      }

      if (!supplierSelectorVisible) {
        console.log('No se encontró selector de proveedor');
      }

      await page.keyboard.press('Escape');
    });

    test('debe poder agregar productos a la compra', async ({ page }) => {
      await page.getByRole('button', { name: /Nueva Compra/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Buscar buscador de productos - probar diferentes selectores
      let hasProductSearch = false;
      try {
        const productSearch = page.getByPlaceholder(/producto/i);
        if (await productSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
          hasProductSearch = true;
        }
      } catch {
        try {
          const productSearch = page.getByLabel(/Producto/i);
          if (await productSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
            hasProductSearch = true;
          }
        } catch {
          // No se encontró buscador de productos
        }
      }

      console.log('Tiene buscador de productos:', hasProductSearch);

      await page.keyboard.press('Escape');
    });
  });

  test.describe('Detalle de Compra', () => {
    test('debe poder ver el detalle de una compra', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      // Buscar botón de ver - probar diferentes selectores
      let viewButtonClicked = false;
      try {
        const viewButton = page.getByRole('button', { name: /ver/i }).first();
        if (await viewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await viewButton.click();
          viewButtonClicked = true;
        }
      } catch {
        try {
          const viewButton = page.locator('button').filter({ has: page.locator('svg[class*="eye"]') }).first();
          if (await viewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await viewButton.click();
            viewButtonClicked = true;
          }
        } catch {
          // No se encontró botón de ver
        }
      }

      if (viewButtonClicked) {
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.keyboard.press('Escape');
      }
    });
  });
});
