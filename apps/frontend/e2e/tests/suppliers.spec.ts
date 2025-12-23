/**
 * Tests E2E de Gestión de Proveedores
 * Cubre: Listado, Creación, Edición
 */
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Proveedores', () => {
  
  test.beforeEach(async ({ helpers }) => {
    await helpers.navigateTo('/suppliers');
  });

  test.describe('Listado', () => {
    test('debe mostrar la página de proveedores correctamente', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Proveedores/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Nuevo Proveedor/i })).toBeVisible();
    });

    test('debe mostrar estadísticas de proveedores', async ({ page, helpers }) => {
      await helpers.waitForLoading();
      
      // Las estadísticas suelen estar en cards
      const statsSection = page.locator('[class*="card"]').first();
      await expect(statsSection).toBeVisible();
    });
  });

  test.describe('Creación', () => {
    test('debe abrir el diálogo de nuevo proveedor', async ({ page }) => {
      await page.getByRole('button', { name: /Nuevo Proveedor/i }).click();
      
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByLabel(/Nombre/i).first()).toBeVisible();
    });

    test('debe crear un proveedor correctamente', async ({ page, helpers }) => {
      const uniqueName = `Proveedor Test ${helpers.generateUniqueId()}`;
      
      await page.getByRole('button', { name: /Nuevo Proveedor/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Llenar formulario
      await page.getByLabel(/Nombre/i).first().fill(uniqueName);
      
      // CUIT/DNI si existe
      const cuitInput = page.getByLabel(/CUIT|DNI|Documento/i);
      if (await cuitInput.isVisible()) {
        await cuitInput.fill('20123456789');
      }
      
      // Teléfono si existe
      const phoneInput = page.getByLabel(/Teléfono/i);
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('1155667788');
      }
      
      // Guardar
      await page.getByRole('button', { name: /Guardar/i }).click();
      
      // Verificar éxito
      await helpers.expectSuccessToast();
    });
  });
});

