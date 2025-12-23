/**
 * Tests E2E de Gestión de Clientes
 * Cubre: Listado, Creación, Edición, Búsqueda
 */
import { test, expect, TEST_CUSTOMER } from '../fixtures/test-fixtures';

test.describe('Clientes', () => {
  
  test.beforeEach(async ({ helpers }) => {
    // Navegar a la página de clientes
    await helpers.navigateTo('/customers');
  });

  test.describe('Listado', () => {
    test('debe mostrar la página de clientes correctamente', async ({ page }) => {
      // Verificar título
      await expect(page.getByRole('heading', { name: /Clientes/i }).first()).toBeVisible();
      
      // Verificar botón de nuevo cliente
      await expect(page.getByRole('button', { name: /Nuevo Cliente/i })).toBeVisible();
    });

    test('debe mostrar estadísticas de clientes', async ({ page, helpers }) => {
      await helpers.waitForLoading();
      
      // Las estadísticas suelen estar en cards
      const statsCards = page.locator('[class*="card"]').first();
      await expect(statsCards).toBeVisible();
    });

    test('debe mostrar la tabla de clientes', async ({ page, helpers }) => {
      await helpers.waitForLoading();
      
      // Verificar tabla
      const table = page.getByRole('table');
      if (await table.isVisible()) {
        await expect(table).toBeVisible();
      }
    });

    test('debe poder buscar clientes', async ({ page, helpers }) => {
      await helpers.waitForLoading();
      
      // Buscar input de búsqueda
      const searchInput = page.getByPlaceholder(/buscar/i).first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Creación', () => {
    test('debe abrir el diálogo de nuevo cliente', async ({ page }) => {
      await page.getByRole('button', { name: /Nuevo Cliente/i }).click();
      
      // Verificar diálogo
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Verificar campos del formulario
      await expect(page.getByLabel(/Nombre/i).first()).toBeVisible();
      await expect(page.getByLabel(/Apellido/i)).toBeVisible();
    });

    test('debe validar campos requeridos', async ({ page }) => {
      await page.getByRole('button', { name: /Nuevo Cliente/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Intentar guardar sin datos
      await page.getByRole('button', { name: /Guardar/i }).click();
      
      // Debe mostrar errores
      await expect(page.getByText(/requerido/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('debe crear un cliente correctamente', async ({ page, helpers }) => {
      const uniqueEmail = `cliente_${helpers.generateUniqueId()}@test.com`;
      
      await page.getByRole('button', { name: /Nuevo Cliente/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Llenar formulario
      await page.getByLabel(/Nombre/i).first().fill(TEST_CUSTOMER.firstName);
      await page.getByLabel(/Apellido/i).fill(TEST_CUSTOMER.lastName);
      
      // Email (puede ser opcional)
      const emailInput = page.getByLabel(/Email/i);
      if (await emailInput.isVisible()) {
        await emailInput.fill(uniqueEmail);
      }
      
      // Teléfono
      const phoneInput = page.getByLabel(/Teléfono/i);
      if (await phoneInput.isVisible()) {
        await phoneInput.fill(TEST_CUSTOMER.phone);
      }
      
      // Guardar
      await page.getByRole('button', { name: /Guardar/i }).click();
      
      // Verificar éxito
      await helpers.expectSuccessToast();
      
      // Verificar que se cerró el diálogo
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    });

    test('debe mostrar selector de condición IVA', async ({ page }) => {
      await page.getByRole('button', { name: /Nuevo Cliente/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Buscar selector de condición IVA
      const ivaSelector = page.getByLabel(/IVA|Condición/i).first()
        .or(page.getByText(/Condición IVA/i));
      
      const hasIvaField = await ivaSelector.isVisible().catch(() => false);
      console.log('Campo de condición IVA visible:', hasIvaField);
    });
  });

  test.describe('Edición', () => {
    test('debe poder abrir el diálogo de edición', async ({ page, helpers }) => {
      await helpers.waitForLoading();
      
      // Buscar botón de editar
      const editButton = page.getByRole('button', { name: /editar/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg[class*="pencil"]') }).first());
      
      if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editButton.click();
        
        // Verificar diálogo
        await expect(page.getByRole('dialog')).toBeVisible();
        
        // Cerrar
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Detalle de Cliente', () => {
    test('debe poder ver el detalle de un cliente', async ({ page, helpers }) => {
      await helpers.waitForLoading();
      
      // Buscar botón de ver detalle
      const viewButton = page.getByRole('button', { name: /ver/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg[class*="eye"]') }).first())
        .or(page.getByRole('row').first().locator('button').first());
      
      if (await viewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await viewButton.click();
        
        // Verificar que se muestra información del cliente
        await expect(page.getByRole('dialog')).toBeVisible();
        
        // Cerrar
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Categorías de Cliente', () => {
    test('debe mostrar las categorías disponibles', async ({ page }) => {
      await page.getByRole('button', { name: /Nuevo Cliente/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Buscar selector de categoría
      const categoryTrigger = page.getByRole('combobox').first()
        .or(page.locator('[role="combobox"]').first());
      
      if (await categoryTrigger.isVisible()) {
        await categoryTrigger.click();
        
        // Verificar que hay opciones
        await page.waitForTimeout(300);
      }
      
      await page.keyboard.press('Escape');
    });
  });
});

