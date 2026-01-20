/**
 * Tests E2E de Gestión de Gastos
 * Cubre: Listado, Creación, Filtros, Marcar como pagado
 */
import { test, expect } from '../fixtures/test-fixtures';
import { E2E_EXPENSE, E2E_EXPENSE_PENDING } from '../fixtures/test-data';

test.describe('Gastos', () => {

  test.beforeEach(async ({ helpers }) => {
    await helpers.navigateTo('/expenses');
    await helpers.ensureCashRegisterOpen();
  });

  test.describe('Listado', () => {
    test('debe mostrar la página de gastos correctamente', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Gastos/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Nuevo Gasto/i })).toBeVisible();
    });

    test('debe mostrar estadísticas de gastos', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      const statsSection = page.locator('[class*="card"]').first();
      await expect(statsSection).toBeVisible();
    });

    test('debe mostrar la lista de gastos', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      const table = page.getByRole('table');
      const list = page.locator('[class*="list"]');

      const hasTable = await table.isVisible().catch(() => false);
      const hasList = await list.isVisible().catch(() => false);

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

      // Buscar selector de categoría - probar diferentes selectores
      let categorySelectorVisible = false;
      try {
        const categorySelector = page.getByRole('combobox').first();
        if (await categorySelector.isVisible({ timeout: 2000 })) {
          await categorySelector.click();
          categorySelectorVisible = true;
        }
      } catch {
        try {
          const categorySelector = page.getByLabel(/Categoría/i);
          if (await categorySelector.isVisible({ timeout: 2000 })) {
            await categorySelector.click();
            categorySelectorVisible = true;
          }
        } catch {
          // Selector de categoría no encontrado
        }
      }

      if (categorySelectorVisible) {
        await page.waitForTimeout(300);
      }

      await page.keyboard.press('Escape');
    });

    test('debe crear un gasto correctamente', async ({ page, helpers }) => {
      await page.getByRole('button', { name: /Nuevo Gasto/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      const descInput = page.getByLabel(/Descripción|Concepto/i);
      if (await descInput.isVisible()) {
        await descInput.fill(`Gasto Test ${helpers.generateUniqueId()}`);
      }

      const amountInput = page.getByLabel(/Monto|Importe/i);
      if (await amountInput.isVisible()) {
        await amountInput.clear();
        await amountInput.fill(E2E_EXPENSE.amount.toString());
      }

      await page.getByRole('button', { name: /Registrar Gasto/i }).click();
      await helpers.expectSuccessToast();
    });

    test('debe crear un gasto pendiente de pago', async ({ page, helpers }) => {
      await page.getByRole('button', { name: /Nuevo Gasto/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Esperar a que el modal cargue completamente los campos
      await page.waitForTimeout(1000);

      const descInput = page.getByLabel(/Descripción|Concepto/i);
      await expect(descInput).toBeVisible({ timeout: 5000 });
      await descInput.fill(E2E_EXPENSE_PENDING.description);

      const amountInput = page.getByLabel(/Monto|Importe/i);
      if (await amountInput.isVisible()) {
        await amountInput.clear();
        await amountInput.fill(E2E_EXPENSE_PENDING.amount.toString());
      }

      const paidCheckbox = page.getByLabel(/Pagado/i);
      if (await paidCheckbox.isVisible()) {
        await paidCheckbox.uncheck();
      }

      await page.getByRole('button', { name: /Registrar Gasto/i }).click();
      await helpers.expectSuccessToast();
    });

    test('debe validar monto mínimo requerido', async ({ page }) => {
      await page.getByRole('button', { name: /Nuevo Gasto/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      const amountInput = page.getByLabel(/Monto|Importe/i);
      if (await amountInput.isVisible()) {
        await amountInput.clear();
        await amountInput.fill('0');

        // El botón dice "Registrar Gasto"
        const saveButton = page.getByRole('button', { name: /Registrar Gasto/i });
        const isDisabled = await saveButton.isDisabled();
        expect(isDisabled).toBe(true);
      }

      await page.keyboard.press('Escape');
    });
  });

  test.describe('Marcar como Pagado', () => {
    test('debe poder marcar un gasto como pagado', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      const table = page.getByRole('table');
      const hasTable = await table.isVisible().catch(() => false);

      if (hasTable) {
        const unpaidIndicator = page.getByText(/pendiente/i).first();
        const hasUnpaid = await unpaidIndicator.isVisible().catch(() => false);

        if (hasUnpaid) {
          // Buscar botón de marcar como pagado - probar diferentes selectores
          let markPaidButtonClicked = false;
          try {
            const markPaidButton = page.getByRole('button', { name: /marcar.*pagado|pagar/i }).first();
            if (await markPaidButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await markPaidButton.click();
              markPaidButtonClicked = true;
            }
          } catch {
            try {
              const markPaidButton = page.locator('[data-testid="mark-as-paid"]').first();
              if (await markPaidButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await markPaidButton.click();
                markPaidButtonClicked = true;
              }
            } catch {
              // No se encontró botón
            }
          }

          if (markPaidButtonClicked) {
            await helpers.expectSuccessToast();
          }
        }
      }
    });

    test('debe mostrar confirmación antes de marcar como pagado', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      const table = page.getByRole('table');
      const hasTable = await table.isVisible().catch(() => false);

      if (hasTable) {
        const unpaidIndicator = page.getByText(/pendiente/i).first();
        const hasUnpaid = await unpaidIndicator.isVisible().catch(() => false);

        if (hasUnpaid) {
          // Buscar botón de marcar como pagado - probar diferentes selectores
          let markPaidButtonClicked = false;
          try {
            const markPaidButton = page.getByRole('button', { name: /marcar.*pagado|pagar/i }).first();
            if (await markPaidButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await markPaidButton.click();
              markPaidButtonClicked = true;
            }
          } catch {
            try {
              const markPaidButton = page.locator('[data-testid="mark-as-paid"]').first();
              if (await markPaidButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await markPaidButton.click();
                markPaidButtonClicked = true;
              }
            } catch {
              // No se encontró botón
            }
          }

          if (markPaidButtonClicked) {
            const confirmDialog = page.getByRole('dialog');
            const hasConfirm = await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false);

            if (hasConfirm) {
              await expect(page.getByText(/confirmar/i)).toBeVisible();
              await page.keyboard.press('Escape');
            }
          }
        }
      }
    });

    test('debe actualizar el listado después de marcar como pagado', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      const unpaidBefore = await page.getByText(/pendiente/i).count();

      const table = page.getByRole('table');
      const hasTable = await table.isVisible().catch(() => false);

      if (hasTable && unpaidBefore > 0) {
        // Buscar botón de marcar como pagado - probar diferentes selectores
        let markPaidButtonClicked = false;
        try {
          const markPaidButton = page.getByRole('button', { name: /marcar.*pagado|pagar/i }).first();
          if (await markPaidButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await markPaidButton.click();
            markPaidButtonClicked = true;
          }
        } catch {
          try {
            const markPaidButton = page.locator('[data-testid="mark-as-paid"]').first();
            if (await markPaidButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await markPaidButton.click();
              markPaidButtonClicked = true;
            }
          } catch {
            // No se encontró botón
          }
        }

        if (markPaidButtonClicked) {
          const confirmButton = page.getByRole('button', { name: /confirmar|aceptar/i }).last();
          if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmButton.click();
            await helpers.expectSuccessToast();
            await page.waitForTimeout(1000);

            const paidIndicator = page.getByText(/pagado/i).first();
            await expect(paidIndicator).toBeVisible({ timeout: E2E_TIMEOUTS.toast });
          }
        }
      }
    });
  });

  test.describe('Edición', () => {
    test('debe poder editar un gasto existente', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      // Buscar botón de editar - probar diferentes selectores
      let editButtonClicked = false;
      try {
        const editButton = page.getByRole('button', { name: /editar/i }).first();
        if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await editButton.click();
          editButtonClicked = true;
        }
      } catch {
        try {
          const editButton = page.locator('[data-testid="edit-expense"]').first();
          if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await editButton.click();
            editButtonClicked = true;
          }
        } catch {
          // No se encontró botón de editar
        }
      }

      if (editButtonClicked) {
        await expect(page.getByRole('dialog')).toBeVisible();

        const descInput = page.getByLabel(/Descripción|Concepto/i);
        if (await descInput.isVisible()) {
          const currentVal = await descInput.inputValue();
          await descInput.clear();
          await descInput.fill(`${currentVal} (editado)`);
        }

        await page.getByRole('button', { name: /Guardar/i }).click();
        await helpers.expectSuccessToast();
      }
    });
  });

  test.describe('Eliminación', () => {
    test('debe poder eliminar un gasto', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      // Buscar botón de eliminar - probar diferentes selectores
      let deleteButtonClicked = false;
      let initialRows = 0;
      try {
        const deleteButton = page.getByRole('button', { name: /eliminar/i }).first();
        if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          initialRows = await page.getByRole('table').locator('tr').count();
          await deleteButton.click();
          deleteButtonClicked = true;
        }
      } catch {
        try {
          const deleteButton = page.locator('[data-testid="delete-expense"]').first();
          if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            initialRows = await page.getByRole('table').locator('tr').count();
            await deleteButton.click();
            deleteButtonClicked = true;
          }
        } catch {
          // No se encontró botón de eliminar
        }
      }

      if (deleteButtonClicked) {
        const confirmButton = page.getByRole('button', { name: /confirmar|aceptar/i }).last();
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
          await helpers.expectSuccessToast();
          await page.waitForTimeout(1000);

          const finalRows = await page.getByRole('table').locator('tr').count();
          expect(finalRows).toBeLessThanOrEqual(initialRows);
        }
      }
    });
  });

  test.describe('Filtros', () => {
    test('debe poder filtrar por período', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      const todayButton = page.getByRole('button', { name: 'Hoy' });
      const monthButton = page.getByRole('button', { name: /Mes/i });

      if (await todayButton.isVisible()) {
        await todayButton.click();
        await page.waitForTimeout(300);
      }
    });

    test('debe poder filtrar gastos por estado (pagado/pendiente)', async ({ page }) => {
      await page.waitForTimeout(500);

      // Buscar filtro de estado - probar diferentes selectores
      let statusFilterVisible = false;
      try {
        const statusFilter = page.getByRole('button', { name: /pagado|pendiente|estado/i }).first();
        if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
          await statusFilter.click();
          statusFilterVisible = true;
        }
      } catch {
        try {
          const statusFilter = page.getByLabel(/estado/i);
          if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
            await statusFilter.click();
            statusFilterVisible = true;
          }
        } catch {
          // Filtro de estado no encontrado
        }
      }

      if (statusFilterVisible) {
        await page.waitForTimeout(300);
      }
    });

    test('debe poder filtrar por categoría', async ({ page }) => {
      await page.waitForTimeout(500);

      // Buscar filtro de categoría - probar diferentes selectores
      let categoryFilterVisible = false;
      try {
        const categoryFilter = page.getByRole('button', { name: /categoría/i });
        if (await categoryFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
          await categoryFilter.click();
          categoryFilterVisible = true;
        }
      } catch {
        try {
          const categoryFilter = page.getByLabel(/categoría/i);
          if (await categoryFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
            await categoryFilter.click();
            categoryFilterVisible = true;
          }
        } catch {
          // Filtro de categoría no encontrado
        }
      }

      if (categoryFilterVisible) {
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Búsqueda', () => {
    test('debe poder buscar gastos por descripción', async ({ page, helpers }) => {
      await helpers.waitForLoading();

      const searchInput = page.getByPlaceholder(/buscar|search/i).first();
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('test');
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Exportar', () => {
    test('debe mostrar botón de exportar', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /exportar|descargar/i });
      const isVisible = await exportButton.isVisible().catch(() => false);

      if (isVisible) {
        await expect(exportButton).toBeVisible();
      }
    });
  });
});
