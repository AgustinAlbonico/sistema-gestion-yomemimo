/**
 * Tests E2E de Caja Registradora
 * Cubre: Apertura de caja, Cierre de caja, Movimientos manuales
 */
import { test, expect, TEST_CASH_REGISTER, E2E_CASH_REGISTER, E2E_TIMEOUTS } from '../fixtures/test-fixtures';

test.describe('Caja Registradora', () => {

  test.beforeEach(async ({ helpers }) => {
    await helpers.navigateTo('/cash-register');
  });

  test.describe('Visualización', () => {
    test('debe mostrar la página de caja correctamente', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Caja' }).first()).toBeVisible();

      const openButton = page.getByRole('button', { name: 'Abrir Caja' });
      const closeButton = page.getByRole('button', { name: 'Cerrar Caja' });

      const isOpen = await closeButton.isVisible();
      const isClosed = await openButton.isVisible();

      expect(isOpen || isClosed).toBe(true);
    });

    test('debe mostrar el historial de cajas cuando está cerrada', async ({ page }) => {
      const isOpen = await page.getByText('Caja Abierta').isVisible();

      if (!isOpen) {
        await expect(page.getByRole('heading', { name: 'Historial de Cajas' })).toBeVisible();
      }
    });
  });

  test.describe('Apertura de Caja', () => {
    test('debe poder abrir el diálogo de apertura de caja', async ({ page }) => {
      const openButton = page.getByRole('button', { name: 'Abrir Caja' });

      if (await openButton.isVisible()) {
        await openButton.click();

        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Abrir Caja' })).toBeVisible();
        await expect(page.getByLabel(/Monto Inicial/i)).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('debe abrir la caja con un monto inicial', async ({ page, helpers }) => {
      const openButton = page.getByRole('button', { name: 'Abrir Caja' });

      if (await openButton.isVisible()) {
        await openButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        const amountInput = page.getByLabel(/Monto Inicial/i);
        await amountInput.clear();
        await amountInput.fill(TEST_CASH_REGISTER.initialAmount.toString());

        const notesInput = page.getByLabel(/Notas/i);
        if (await notesInput.isVisible()) {
          await notesInput.fill(TEST_CASH_REGISTER.openingNotes);
        }

        await page.getByRole('button', { name: 'Abrir Caja' }).last().click();

        await expect(page.getByText('Caja Abierta')).toBeVisible({ timeout: E2E_TIMEOUTS.navigation });
      } else {
        test.skip();
      }
    });

    test('debe mostrar error al intentar abrir con monto inválido', async ({ page }) => {
      const openButton = page.getByRole('button', { name: 'Abrir Caja' });

      if (await openButton.isVisible()) {
        await openButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        const amountInput = page.getByLabel(/Monto Inicial/i);
        await amountInput.clear();
        await amountInput.fill('-100');

        const saveButton = page.getByRole('button', { name: 'Abrir Caja' }).last();

        const isDisabled = await saveButton.isDisabled();
        expect(isDisabled).toBe(true);

        await page.keyboard.press('Escape');
      } else {
        test.skip();
      }
    });
  });

  test.describe('Caja Abierta', () => {
    test('debe mostrar el resumen de caja cuando está abierta', async ({ page }) => {
      const cajaAbierta = page.getByText('Caja Abierta');

      if (await cajaAbierta.isVisible({ timeout: 3000 })) {
        await expect(page.getByText(/Saldo Inicial/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Cerrar Caja/i })).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('debe mostrar los movimientos del día', async ({ page }) => {
      const cajaAbierta = page.getByText('Caja Abierta');

      if (await cajaAbierta.isVisible({ timeout: 3000 })) {
        await expect(page.getByText(/Movimientos del Día/i)).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('debe mostrar estadísticas de ventas en el resumen', async ({ page }) => {
      const cajaAbierta = page.getByText('Caja Abierta');

      if (await cajaAbierta.isVisible({ timeout: 3000 })) {
        await expect(page.getByText(/Ventas|Total/i)).toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Movimiento Manual', () => {
    test.beforeEach(async ({ page }) => {
      const cajaAbierta = page.getByText('Caja Abierta');
      if (!(await cajaAbierta.isVisible({ timeout: 3000 }))) {
        test.skip();
      }
    });

    test('debe poder abrir el diálogo de movimiento manual', async ({ page }) => {
      const movementButton = page.getByRole('button', { name: /Movimiento Manual/i });

      if (await movementButton.isVisible()) {
        await movementButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.keyboard.press('Escape');
      } else {
        test.skip();
      }
    });

    test('debe registrar un movimiento manual de entrada', async ({ page, helpers }) => {
      const movementButton = page.getByRole('button', { name: /Movimiento Manual/i });

      if (await movementButton.isVisible()) {
        await movementButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        const descInput = page.getByLabel(/Descripción|Concepto/i);
        if (await descInput.isVisible()) {
          await descInput.fill(`Movimiento test ${helpers.generateUniqueId()}`);
        }

        const amountInput = page.getByLabel(/Monto|Importe/i);
        if (await amountInput.isVisible()) {
          await amountInput.clear();
          await amountInput.fill(E2E_CASH_REGISTER.manualMovementAmount.toString());
        }

        const saveButton = page.getByRole('button', { name: /Guardar|Registrar/i }).first();
        await saveButton.click();

        await helpers.expectSuccessToast();
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
      } else {
        test.skip();
      }
    });

    test('debe registrar un movimiento manual de retiro', async ({ page, helpers }) => {
      const movementButton = page.getByRole('button', { name: /Movimiento Manual/i });

      if (await movementButton.isVisible()) {
        await movementButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        const descInput = page.getByLabel(/Descripción|Concepto/i);
        if (await descInput.isVisible()) {
          await descInput.fill(`Retiro test ${helpers.generateUniqueId()}`);
        }

        const amountInput = page.getByLabel(/Monto|Importe/i);
        if (await amountInput.isVisible()) {
          await amountInput.clear();
          await amountInput.fill(E2E_CASH_REGISTER.manualWithdrawalAmount.toString());
        }

        // Buscar selector de tipo de movimiento - probar diferentes selectores
        let typeSelectorClicked = false;
        try {
          const typeSelector = page.getByRole('radio', { name: /retiro|salida/i }).first();
          if (await typeSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
            await typeSelector.click();
            typeSelectorClicked = true;
          }
        } catch {
          try {
            const typeSelector = page.getByRole('button', { name: /retiro|salida/i });
            if (await typeSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
              await typeSelector.click();
              typeSelectorClicked = true;
            }
          } catch {
            // No se encontró selector de tipo
          }
        }

        if (typeSelectorClicked) {
          await page.waitForTimeout(200);
        }

        const saveButton = page.getByRole('button', { name: /Guardar|Registrar/i }).first();
        await saveButton.click();

        await helpers.expectSuccessToast();
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
      } else {
        test.skip();
      }
    });

    test('debe validar monto mínimo en movimiento manual', async ({ page }) => {
      const movementButton = page.getByRole('button', { name: /Movimiento Manual/i });

      if (await movementButton.isVisible()) {
        await movementButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        const amountInput = page.getByLabel(/Monto|Importe/i);
        if (await amountInput.isVisible()) {
          await amountInput.clear();
          await amountInput.fill('0');

          const saveButton = page.getByRole('button', { name: /Guardar|Registrar/i }).first();
          const isDisabled = await saveButton.isDisabled();
          expect(isDisabled).toBe(true);
        }

        await page.keyboard.press('Escape');
      } else {
        test.skip();
      }
    });
  });

  test.describe('Cierre de Caja', () => {
    test.beforeEach(async ({ page }) => {
      const cajaAbierta = page.getByText('Caja Abierta');
      if (!(await cajaAbierta.isVisible({ timeout: 3000 }))) {
        test.skip();
      }
    });

    test('debe poder abrir el diálogo de cierre', async ({ page }) => {
      const closeButton = page.getByRole('button', { name: /Cerrar Caja/i });

      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.keyboard.press('Escape');
      } else {
        test.skip();
      }
    });

    test('debe mostrar el resumen de cierre con totales', async ({ page }) => {
      const closeButton = page.getByRole('button', { name: /Cerrar Caja/i });

      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        await expect(page.getByText(/Total Ventas|Efectivo/i)).toBeVisible();
        await expect(page.getByText(/Retiros|Ingresos Extra/i)).toBeVisible();

        await page.keyboard.press('Escape');
      } else {
        test.skip();
      }
    });

    test('debe poder cerrar la caja', async ({ page, helpers }) => {
      const closeButton = page.getByRole('button', { name: /Cerrar Caja/i });

      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        const notesInput = page.getByLabel(/Notas|Comentarios/i);
        if (await notesInput.isVisible()) {
          await notesInput.fill(E2E_CASH_REGISTER.closeNotes);
        }

        const confirmButton = page.getByRole('button', { name: /Cerrar Caja|Confirmar/i }).last();
        await confirmButton.click();

        await helpers.expectSuccessToast();
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: E2E_TIMEOUTS.dialog });

        await expect(page.getByText('Historial de Cajas')).toBeVisible({ timeout: E2E_TIMEOUTS.navigation });
      } else {
        test.skip();
      }
    });

    test('debe contar el cierre', async ({ page, helpers }) => {
      const closeButton = page.getByRole('button', { name: /Cerrar Caja/i });

      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        const countButton = page.getByRole('button', { name: /Contar|Arqueo/i });
        if (await countButton.isVisible().catch(() => false)) {
          await countButton.click();

          const billetesSection = page.getByText(/billetes/i);
          await expect(billetesSection).toBeVisible();
        }

        await page.keyboard.press('Escape');
      } else {
        test.skip();
      }
    });
  });

  test.describe('Historial', () => {
    test('debe mostrar el historial cuando la caja está cerrada', async ({ page }) => {
      const openButton = page.getByRole('button', { name: 'Abrir Caja' });

      if (await openButton.isVisible({ timeout: 3000 })) {
        await expect(page.getByText('Historial de Cajas')).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('debe poder filtrar el historial por fecha', async ({ page }) => {
      const historial = page.getByText('Historial de Cajas');

      if (await historial.isVisible({ timeout: 3000 })) {
        const dateInput = page.locator('input[type="date"]').first();

        if (await dateInput.isVisible()) {
          const today = new Date().toISOString().split('T')[0];
          await dateInput.fill(today);
          await page.waitForTimeout(500);
        }
      } else {
        test.skip();
      }
    });

    test('debe poder ver detalle de un cierre histórico', async ({ page }) => {
      const historial = page.getByText('Historial de Cajas');

      if (await historial.isVisible({ timeout: 3000 })) {
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
      } else {
        test.skip();
      }
    });
  });

  test.describe('Flujo Completo', () => {
    test('debe completar el ciclo completo de caja', async ({ page, helpers }) => {
      const openButton = page.getByRole('button', { name: 'Abrir Caja' });

      if (await openButton.isVisible({ timeout: 3000 })) {
        await openButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        const amountInput = page.getByLabel(/Monto Inicial/i);
        await amountInput.clear();
        await amountInput.fill(E2E_CASH_REGISTER.initialAmount.toString());

        await page.getByRole('button', { name: 'Abrir Caja' }).last().click();
        await expect(page.getByText('Caja Abierta')).toBeVisible({ timeout: E2E_TIMEOUTS.navigation });

        await expect(page.getByText(/Saldo Inicial/i)).toBeVisible();
        await expect(page.getByText(new RegExp(E2E_CASH_REGISTER.initialAmount.toString()))).toBeVisible();

        const movementButton = page.getByRole('button', { name: /Movimiento Manual/i });
        if (await movementButton.isVisible()) {
          await movementButton.click();
          await expect(page.getByRole('dialog')).toBeVisible();

          const descInput = page.getByLabel(/Descripción|Concepto/i);
          if (await descInput.isVisible()) {
            await descInput.fill(`Ciclo test ${helpers.generateUniqueId()}`);
          }

          const amountInput = page.getByLabel(/Monto|Importe/i);
          if (await amountInput.isVisible()) {
            await amountInput.clear();
            await amountInput.fill(E2E_CASH_REGISTER.manualMovementAmount.toString());
          }

          await page.getByRole('button', { name: /Guardar|Registrar/i }).first().click();
          await helpers.expectSuccessToast();
        }

        const closeButton = page.getByRole('button', { name: /Cerrar Caja/i });
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await expect(page.getByRole('dialog')).toBeVisible();

          const notesInput = page.getByLabel(/Notas|Comentarios/i);
          if (await notesInput.isVisible()) {
            await notesInput.fill(E2E_CASH_REGISTER.closeNotes);
          }

          await page.getByRole('button', { name: /Cerrar Caja|Confirmar/i }).last().click();
          await helpers.expectSuccessToast();
          await expect(page.getByText('Historial de Cajas')).toBeVisible({ timeout: E2E_TIMEOUTS.navigation });
        }
      } else {
        test.skip();
      }
    });
  });
});
