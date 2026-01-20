/**
 * Fixtures personalizados para tests E2E
 * Provee utilidades comunes y datos de prueba
 */
import { test as base, expect, Page } from '@playwright/test';
import {
  E2E_USER,
  E2E_CUSTOMER,
  E2E_CASH_REGISTER,
  E2E_INCOME,
  E2E_EXPENSE,
  E2E_TIMEOUTS,
} from './test-data';

// Datos de prueba para el sistema
export const TEST_USER = E2E_USER;

export const TEST_PRODUCT = {
  name: 'Producto Test E2E',
  description: 'Producto creado para tests automatizados',
  cost: 100,
  stock: 50,
};

export const TEST_SALE = {
  productSearch: 'a',
};

export const TEST_CUSTOMER = E2E_CUSTOMER;

export const TEST_INCOME = E2E_INCOME;

export const TEST_EXPENSE = E2E_EXPENSE;

export const TEST_CASH_REGISTER = E2E_CASH_REGISTER;


/**
 * Helpers para acciones comunes en tests
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Espera a que desaparezca el loader de carga
   */
  async waitForLoading(): Promise<void> {
    // Esperar que no haya loaders visibles
    await this.page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});
    // Pequeña pausa adicional para estabilidad
    await this.page.waitForTimeout(300);
  }

  /**
   * Navega a una ruta específica usando HashRouter
   */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(`/#${path}`);
    await this.waitForLoading();
  }

  /**
   * Verifica que un toast de éxito aparezca
   */
  async expectSuccessToast(text?: string): Promise<void> {
    const toastLocator = this.page.locator('[data-sonner-toast]').filter({ hasText: text ?? '' });
    await expect(toastLocator.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Espera a que se complete la navegación del modal
   */
  async waitForDialogClose(): Promise<void> {
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 }).catch(() => {});
  }


  /**
   * Verifica que un toast de error aparezca
   */
  async expectErrorToast(text?: string): Promise<void> {
    const toastLocator = this.page.locator('[data-sonner-toast][data-type="error"]').filter({ hasText: text ?? '' });
    await expect(toastLocator.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Hace click en un botón por su texto
   */
  async clickButton(text: string): Promise<void> {
    await this.page.getByRole('button', { name: text }).click();
  }

  /**
   * Llena un campo de formulario por su label
   */
  async fillField(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label).fill(value);
  }

  /**
   * Selecciona una opción de un Select por su label
   */
  async selectOption(label: string, optionText: string): Promise<void> {
    await this.page.getByLabel(label).click();
    await this.page.getByRole('option', { name: optionText }).click();
  }

  /**
   * Abre un diálogo modal haciendo click en un botón
   */
  async openDialog(buttonText: string): Promise<void> {
    await this.clickButton(buttonText);
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible' });
  }

  /**
   * Abre una caja si está cerrada
   *
   * Estrategia: Usa el monto sugerido por el servidor para evitar tener que llenar
   * el campo "Razón del Ajuste" que aparece cuando se modifica el monto manualmente.
   *
   * Flujo:
   * 1. Navega a la página de caja
   * 2. Si está cerrada, abre el diálogo
   * 3. Espera a que se cargue la sugerencia del servidor
   * 4. Confirma con el monto sugerido (sin modificar)
   * 5. Vuelve a la página original
   */
  async ensureCashRegisterOpen(_initialAmount?: number, _notes?: string): Promise<void> {
    // Guardar la URL actual para volver después
    const currentUrl = this.page.url();
    const currentHash = currentUrl.includes('#') ? currentUrl.split('#')[1] : '/dashboard';

    // Navegar a la página de caja
    await this.page.goto('/#/cash-register');
    // Esperar a que la página cargue completamente
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(1000);

    const openButton = this.page.getByRole('button', { name: 'Abrir Caja' });
    const isClosed = await openButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isClosed) {
      await openButton.click();
      await this.page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });

      // Esperar a que se cargue la sugerencia del servidor y se llene el formulario
      await this.page.waitForTimeout(2500);

      // Buscar el botón de confirmar dentro del diálogo
      const dialog = this.page.getByRole('dialog');

      // Esperar a que el botón esté habilitado (puede tardar si está cargando la sugerencia)
      const confirmButton = dialog.getByRole('button', { name: 'Abrir Caja' }).first();

      // Esperar hasta 5 segundos a que el botón se habilite
      let isEnabled = false;
      for (let i = 0; i < 10; i++) {
        isEnabled = await confirmButton.isEnabled().catch(() => false);
        if (isEnabled) {
          break;
        }
        await this.page.waitForTimeout(500);
      }

      if (isEnabled) {
        await confirmButton.click();
        // Esperar confirmación de que se abrió la caja y que la UI se actualice
        await this.page.waitForTimeout(1500);
      } else {
        // Si después de esperar el botón sigue deshabilitado, intentar llenar el monto manualmente
        // con la razón del ajuste
        const amountInput = this.page.getByLabel(/Monto Inicial/i);
        await amountInput.click();
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type('10000');
        await this.page.waitForTimeout(500);

        // Llenar la razón del ajuste (campo que aparece cuando se modifica el monto)
        const adjustmentReasonInput = this.page.getByLabel(/Razón del Ajuste/i);
        if (await adjustmentReasonInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await adjustmentReasonInput.fill('Ajuste automático para test E2E');
          await this.page.waitForTimeout(500);
        }

        // Intentar nuevamente
        const retryEnabled = await confirmButton.isEnabled().catch(() => false);
        if (retryEnabled) {
          await confirmButton.click();
          await this.page.waitForTimeout(1500);
        } else {
          throw new Error('No se pudo abrir la caja: el botón de confirmar permanece deshabilitado');
        }
      }
    }

    // Volver a la página original y recargar para asegurar que el estado se sincronice
    if (currentHash !== '/cash-register') {
      await this.page.goto(`/#${currentHash}`);
      await this.page.waitForLoadState('networkidle').catch(() => {});
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Crea un cliente básico desde el formulario UI
   */
  async createCustomer(firstName: string, lastName: string, phone?: string, email?: string): Promise<void> {
    await this.page.getByRole('button', { name: /Nuevo Cliente/i }).click();
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await this.page.getByLabel(/Nombre/i).first().fill(firstName);
    await this.page.getByLabel(/Apellido/i).fill(lastName);

    if (email) {
      const emailInput = this.page.getByLabel(/Email/i);
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill(email);
      }
    }

    if (phone) {
      const phoneInput = this.page.getByLabel(/Teléfono/i);
      if (await phoneInput.isVisible().catch(() => false)) {
        await phoneInput.fill(phone);
      }
    }

    await this.page.getByRole('button', { name: /Guardar/i }).click();
    await this.expectSuccessToast();
  }

  /**
   * Registra un ingreso desde UI
   */
  async createIncome(description: string, amount: number): Promise<void> {
    await this.page.getByRole('button', { name: /Nuevo Ingreso/i }).click();
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const descriptionInput = this.page.getByLabel(/Descripción|Concepto/i);
    if (await descriptionInput.isVisible().catch(() => false)) {
      await descriptionInput.fill(description);
    }

    const amountInput = this.page.getByLabel(/Monto|Importe/i);
    if (await amountInput.isVisible().catch(() => false)) {
      await amountInput.fill(amount.toString());
    }

    await this.page.getByRole('button', { name: /Guardar/i }).click();
    await this.expectSuccessToast();
  }

  /**
   * Registra un gasto desde UI
   */
  async createExpense(description: string, amount: number): Promise<void> {
    await this.page.getByRole('button', { name: /Nuevo Gasto/i }).click();
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const descriptionInput = this.page.getByLabel(/Descripción|Concepto/i);
    if (await descriptionInput.isVisible().catch(() => false)) {
      await descriptionInput.fill(description);
    }

    const amountInput = this.page.getByLabel(/Monto|Importe/i);
    if (await amountInput.isVisible().catch(() => false)) {
      await amountInput.fill(amount.toString());
    }

    await this.page.getByRole('button', { name: /Guardar/i }).click();
    await this.expectSuccessToast();
  }

  /**
   * Confirma una venta a cuenta corriente desde el modal
   */
  async confirmOnAccountSale(): Promise<void> {
    const onAccountCheckbox = this.page.getByLabel(/Cuenta Corriente/i);
    if (await onAccountCheckbox.isVisible().catch(() => false)) {
      await onAccountCheckbox.check();
    }

    const confirmButton = this.page.getByRole('button', { name: /CONFIRMAR VENTA/i });
    if (await confirmButton.isEnabled().catch(() => false)) {
      await confirmButton.click();
    }
  }


  /**
   * Cierra el diálogo modal actual
   */
  async closeDialog(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden' }).catch(() => {});
  }

  /**
   * Busca en una tabla y verifica que existe un registro
   */
  async searchInTable(searchText: string): Promise<void> {
    const searchInput = this.page.getByPlaceholder(/buscar|search/i).first();
    await searchInput.fill(searchText);
    await this.page.waitForTimeout(500); // Debounce
  }

  /**
   * Verifica que la tabla contenga un texto específico
   */
  async expectTableContains(text: string): Promise<void> {
    await expect(this.page.getByRole('table')).toContainText(text);
  }

  /**
   * Verifica que estamos en la ruta correcta
   */
  async expectRoute(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`#${path}`));
  }

  /**
   * Genera un identificador único para datos de test
   */
  generateUniqueId(): string {
    return `e2e_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Verifica si aparece un toast de error de caja cerrada.
   * Retorna true si el toast aparece (indicando que la caja está cerrada).
   */
  async isCashRegisterClosedToast(timeout: number = 2000): Promise<boolean> {
    const toastLocator = this.page.locator('[data-sonner-toast][data-type="error"]').filter({ hasText: /caja.*cerrada/i });
    return await toastLocator.isVisible({ timeout }).catch(() => false);
  }

  /**
   * Obtiene el primer locator visible de un array.
   * Útil para selectores alternativos cuando no se cuál está disponible.
   *
   * @param locators - Array de locators a probar
   * @param timeout - Timeout máximo para esperar cada locator (default: 2000ms)
   * @returns El primer locator visible, o null si ninguno es visible
   */
  async getFirstVisibleLocator(locators: Array<ReturnType<typeof this.page.locator>>, timeout: number = 2000): Promise<ReturnType<typeof this.page.locator> | null> {
    for (const locator of locators) {
      try {
        const first = locator.first();
        if (await first.isVisible({ timeout })) {
          return first;
        }
      } catch {
        // Locator no existe o no es visible, continuar con el siguiente
        continue;
      }
    }
    return null;
  }

  /**
   * Intenta hacer click en el primer botón/elemento visible que coincida con los criterios.
   * Prueba múltiples selectores secuencialmente hasta que uno funcione.
   *
   * @param selectors - Array de funciones que retornan locators
   * @returns true si algún click fue exitoso, false si ninguno funcionó
   */
  async safeClick(selectors: Array<() => ReturnType<typeof this.page.locator>>): Promise<boolean> {
    for (const selectorFn of selectors) {
      try {
        const locator = selectorFn().first();
        if (await locator.isVisible({ timeout: 2000 }).catch(() => false)) {
          await locator.click();
          return true;
        }
      } catch {
        // Selector no funciona, continuar con el siguiente
        continue;
      }
    }
    return false;
  }

  /**
   * Intenta llenar el primer campo visible que coincida con el label.
   *
   * @param label - Label o regex del campo a buscar
   * @param value - Valor a llenar
   * @returns true si se llenó el campo, false si no se encontró ninguno visible
   */
  async safeFill(label: RegExp | string, value: string): Promise<boolean> {
    try {
      const input = this.page.getByLabel(label).first();
      if (await input.isVisible({ timeout: 2000 })) {
        await input.fill(value);
        return true;
      }
    } catch {
      // Input no encontrado o no visible
    }
    return false;
  }
}

/**
 * Fixture extendido con helpers
 */
export const test = base.extend<{ helpers: TestHelpers }>({
  helpers: async ({ page }, use) => {
    const helpers = new TestHelpers(page);
    await use(helpers);
  },
});

export { expect };

