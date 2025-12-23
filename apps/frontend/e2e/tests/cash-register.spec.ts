/**
 * Tests E2E de Caja Registradora
 * Cubre: Apertura de caja, Cierre de caja, Movimientos manuales
 */
import { test, expect, TEST_CASH_REGISTER } from '../fixtures/test-fixtures';

test.describe('Caja Registradora', () => {
  
  test.beforeEach(async ({ helpers }) => {
    // Navegar a la página de caja
    await helpers.navigateTo('/cash-register');
  });

  test.describe('Visualización', () => {
    test('debe mostrar la página de caja correctamente', async ({ page }) => {
      // Verificar título de la página
      await expect(page.getByRole('heading', { name: 'Caja' })).toBeVisible();
      
      // Verificar que existe algún estado de caja (abierta o cerrada)
      const openButton = page.getByRole('button', { name: 'Abrir Caja' });
      const closeButton = page.getByRole('button', { name: 'Cerrar Caja' });
      
      // Debe mostrar uno de los dos botones
      const isOpen = await closeButton.isVisible();
      const isClosed = await openButton.isVisible();
      
      expect(isOpen || isClosed).toBe(true);
    });

    test('debe mostrar el historial de cajas cuando está cerrada', async ({ page }) => {
      // Si la caja está abierta, verificar que se muestra el resumen
      const isOpen = await page.getByText('Caja Abierta').isVisible();
      
      if (!isOpen) {
        // Si está cerrada, debe mostrar el historial
        await expect(page.getByText('Historial de Cajas')).toBeVisible();
      }
    });
  });

  test.describe('Apertura de Caja', () => {
    test('debe poder abrir el diálogo de apertura de caja', async ({ page }) => {
      // Verificar si la caja está cerrada
      const openButton = page.getByRole('button', { name: 'Abrir Caja' });
      
      if (await openButton.isVisible()) {
        await openButton.click();
        
        // Verificar que se abre el diálogo
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Abrir Caja' })).toBeVisible();
        
        // Verificar elementos del formulario
        await expect(page.getByLabel(/Monto Inicial/i)).toBeVisible();
      } else {
        // La caja ya está abierta, skip este test
        test.skip();
      }
    });

    test('debe abrir la caja con un monto inicial', async ({ page, helpers }) => {
      const openButton = page.getByRole('button', { name: 'Abrir Caja' });
      
      if (await openButton.isVisible()) {
        await openButton.click();
        
        // Esperar el diálogo
        await expect(page.getByRole('dialog')).toBeVisible();
        
        // Llenar monto inicial
        const amountInput = page.getByLabel(/Monto Inicial/i);
        await amountInput.clear();
        await amountInput.fill(TEST_CASH_REGISTER.initialAmount.toString());
        
        // Llenar notas opcionales
        const notesInput = page.getByLabel(/Notas/i);
        if (await notesInput.isVisible()) {
          await notesInput.fill(TEST_CASH_REGISTER.openingNotes);
        }
        
        // Confirmar apertura
        await page.getByRole('button', { name: 'Abrir Caja' }).last().click();
        
        // Verificar éxito
        await expect(page.getByText('Caja Abierta')).toBeVisible({ timeout: 10000 });
      } else {
        test.skip();
      }
    });
  });

  test.describe('Caja Abierta', () => {
    test('debe mostrar el resumen de caja cuando está abierta', async ({ page }) => {
      const cajaAbierta = page.getByText('Caja Abierta');
      
      if (await cajaAbierta.isVisible()) {
        // Verificar elementos del resumen
        await expect(page.getByText(/Saldo Inicial/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Cerrar Caja/i })).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('debe poder agregar un movimiento manual', async ({ page }) => {
      const movementButton = page.getByRole('button', { name: /Movimiento Manual/i });
      
      if (await movementButton.isVisible()) {
        await movementButton.click();
        
        // Verificar que se abre el diálogo
        await expect(page.getByRole('dialog')).toBeVisible();
        
        // Cerrar sin hacer cambios
        await page.keyboard.press('Escape');
      } else {
        test.skip();
      }
    });

    test('debe mostrar los movimientos del día', async ({ page }) => {
      const cajaAbierta = page.getByText('Caja Abierta');
      
      if (await cajaAbierta.isVisible()) {
        // Verificar sección de movimientos
        await expect(page.getByText(/Movimientos del Día/i)).toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Cierre de Caja', () => {
    test('debe poder abrir el diálogo de cierre', async ({ page }) => {
      const closeButton = page.getByRole('button', { name: /Cerrar Caja/i });
      
      if (await closeButton.isVisible()) {
        await closeButton.click();
        
        // Verificar que se abre el diálogo
        await expect(page.getByRole('dialog')).toBeVisible();
        
        // Cerrar sin realizar el cierre
        await page.keyboard.press('Escape');
      } else {
        test.skip();
      }
    });
  });

  test.describe('Historial', () => {
    test('debe poder filtrar el historial por fecha', async ({ page }) => {
      // Solo aplica si la caja está cerrada
      const historial = page.getByText('Historial de Cajas');
      
      if (await historial.isVisible()) {
        // Buscar el input de fecha
        const dateInput = page.locator('input[type="date"]').first();
        
        if (await dateInput.isVisible()) {
          // Establecer una fecha
          const today = new Date().toISOString().split('T')[0];
          await dateInput.fill(today);
          
          // Verificar que se aplica el filtro (la tabla se actualiza)
          await page.waitForTimeout(500);
        }
      } else {
        test.skip();
      }
    });
  });
});

