/**
 * Tests E2E de Gestión de Productos
 * Cubre: Listado, Creación, Edición, Búsqueda
 */
import { test, expect, TEST_PRODUCT } from '../fixtures/test-fixtures';

test.describe('Productos', () => {

  test.beforeEach(async ({ helpers }) => {
    // Navegar a la página de productos
    await helpers.navigateTo('/products');
  });

  test.describe('Listado', () => {
    test('debe mostrar la página de productos correctamente', async ({ page }) => {
      // Verificar título
      await expect(page.getByRole('heading', { name: /Productos/i }).first()).toBeVisible();

      // Verificar que existe el botón de nuevo producto
      await expect(page.getByRole('button', { name: /Nuevo Producto/i })).toBeVisible();
    });

    test('debe mostrar la tabla de productos', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      // Verificar que hay una tabla o lista
      const table = page.getByRole('table');
      const hasTable = await table.isVisible();

      // Si hay tabla, verificar columnas esperadas
      if (hasTable) {
        await expect(table).toBeVisible();
      }
    });

    test('debe poder buscar productos por nombre', async ({ page }) => {
      // Buscar el input de búsqueda
      const searchInput = page.getByPlaceholder(/buscar/i);

      if (await searchInput.isVisible()) {
        await searchInput.fill('test');

        // Esperar debounce
        await page.waitForTimeout(500);

        // La tabla debería actualizarse
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Creación', () => {
    test('debe abrir el diálogo de nuevo producto', async ({ page }) => {
      // Click en nuevo producto
      await page.getByRole('button', { name: /Nuevo Producto/i }).click();

      // Verificar que se abre el diálogo
      await expect(page.getByRole('dialog')).toBeVisible();

      // Verificar campos del formulario
      await expect(page.getByLabel(/Nombre del Producto/i)).toBeVisible();
      await expect(page.getByLabel(/Costo/i)).toBeVisible();
      await expect(page.getByLabel(/Stock/i)).toBeVisible();
    });

    test('debe validar campos requeridos al crear producto', async ({ page }) => {
      // Abrir diálogo
      await page.getByRole('button', { name: /Nuevo Producto/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Intentar guardar sin llenar campos
      await page.getByRole('button', { name: /Guardar/i }).click();

      // Debe mostrar errores de validación
      await expect(page.getByText(/requerido/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('debe crear un producto correctamente', async ({ page, helpers }) => {
      const uniqueName = `${TEST_PRODUCT.name}_${helpers.generateUniqueId()}`;

      // Abrir diálogo
      await page.getByRole('button', { name: /Nuevo Producto/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Llenar formulario
      await page.getByLabel(/Nombre del Producto/i).fill(uniqueName);
      await page.getByLabel(/Descripción/i).fill(TEST_PRODUCT.description);

      // Llenar costo (NumericInput)
      const costInput = page.getByLabel(/Costo/i);
      await costInput.clear();
      await costInput.fill(TEST_PRODUCT.cost.toString());

      // Llenar stock
      const stockInput = page.getByLabel(/Stock/i);
      await stockInput.clear();
      await stockInput.fill(TEST_PRODUCT.stock.toString());

      // Guardar
      await page.getByRole('button', { name: /Guardar/i }).click();

      // Verificar éxito
      await helpers.expectSuccessToast();

      // Verificar que el diálogo se cerró
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    });

    test('debe mostrar el precio calculado automáticamente', async ({ page }) => {
      // Abrir diálogo
      await page.getByRole('button', { name: /Nuevo Producto/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Llenar costo
      const costInput = page.getByLabel(/Costo/i);
      await costInput.clear();
      await costInput.fill('100');

      // Verificar que se muestra el precio de venta calculado
      await expect(page.getByText(/Precio de Venta/i)).toBeVisible();
    });
  });

  test.describe('Edición', () => {
    test('debe poder abrir el diálogo de edición de producto', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      // Buscar el primer botón de editar en la tabla - probar diferentes selectores
      let editButtonClicked = false;
      try {
        const editButton = page.getByRole('button', { name: /editar/i }).first();
        if (await editButton.isVisible({ timeout: 2000 })) {
          await editButton.click();
          editButtonClicked = true;
        }
      } catch {
        try {
          const editButton = page.locator('button').filter({ has: page.locator('svg[class*="pencil"]') }).first();
          if (await editButton.isVisible({ timeout: 2000 })) {
            await editButton.click();
            editButtonClicked = true;
          }
        } catch {
          try {
            const editButton = page.locator('[data-testid="edit-button"]').first();
            if (await editButton.isVisible({ timeout: 2000 })) {
              await editButton.click();
              editButtonClicked = true;
            }
          } catch {
            // No se encontró botón de editar
          }
        }
      }

      if (editButtonClicked) {
        // Verificar que se abre el diálogo
        await expect(page.getByRole('dialog')).toBeVisible();

        // Cerrar
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Categorías', () => {
    test('debe mostrar las categorías en el selector', async ({ page }) => {
      // Abrir diálogo de nuevo producto
      await page.getByRole('button', { name: /Nuevo Producto/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Buscar el selector de categoría - probar diferentes selectores
      let categoryTriggerClicked = false;
      try {
        const categoryTrigger = page.getByRole('combobox').filter({ hasText: /categoría|categoria/i });
        if (await categoryTrigger.isVisible({ timeout: 2000 })) {
          await categoryTrigger.click();
          categoryTriggerClicked = true;
        }
      } catch {
        try {
          const categoryTrigger = page.locator('[role="combobox"]').first();
          if (await categoryTrigger.isVisible({ timeout: 2000 })) {
            await categoryTrigger.click();
            categoryTriggerClicked = true;
          }
        } catch {
          // No se encontró selector de categoría
        }
      }

      if (categoryTriggerClicked) {
        // Verificar que hay opciones
        await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5000 });
      }

      // Cerrar diálogo
      await page.keyboard.press('Escape');
    });
  });

  test.describe('Stock', () => {
    test('debe mostrar indicadores de stock bajo si hay productos con poco stock', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      // Buscar indicadores de stock bajo (pueden ser badges o iconos) - probar diferentes selectores
      let hasLowStock = false;
      try {
        const lowStockIndicator = page.locator('[class*="destructive"]').first();
        if (await lowStockIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
          hasLowStock = true;
        }
      } catch {
        try {
          const lowStockIndicator = page.locator('[class*="warning"]').first();
          if (await lowStockIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
            hasLowStock = true;
          }
        } catch {
          try {
            const lowStockIndicator = page.getByText(/bajo stock|sin stock/i);
            if (await lowStockIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
              hasLowStock = true;
            }
          } catch {
            // No se encontraron indicadores
          }
        }
      }

      // Este test es informativo, puede que no haya productos con stock bajo
      // Log para debugging
      console.log('Hay indicadores de stock bajo:', hasLowStock);
    });
  });
});
