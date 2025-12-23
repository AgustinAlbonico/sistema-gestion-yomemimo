/**
 * Fixtures personalizados para tests E2E
 * Provee utilidades comunes y datos de prueba
 */
import { test as base, expect, Page } from '@playwright/test';

// Datos de prueba para el sistema
export const TEST_USER = {
  username: 'admin',
  password: 'ferchu123',
};

export const TEST_PRODUCT = {
  name: 'Producto Test E2E',
  description: 'Producto creado para tests automatizados',
  cost: 100,
  stock: 50,
};

export const TEST_CUSTOMER = {
  firstName: 'Cliente',
  lastName: 'Test E2E',
  email: 'cliente.test@example.com',
  phone: '1155667788',
  documentNumber: '12345678',
};

export const TEST_CASH_REGISTER = {
  initialAmount: 10000,
  openingNotes: 'Apertura automática para tests E2E',
};

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

