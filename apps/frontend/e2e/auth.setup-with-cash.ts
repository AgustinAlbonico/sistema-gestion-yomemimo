/**
 * Setup para tests que requieren caja abierta
 * Login + apertura de caja
 */
import { test as setup, expect } from '@playwright/test';
import { TEST_USER, TEST_CASH_REGISTER } from './fixtures/test-fixtures';

setup('autenticar y abrir caja', async ({ page }) => {
  // Login
  await page.goto('/#/login');
  await expect(page.getByText('Bienvenido')).toBeVisible({ timeout: 15000 });
  await page.getByLabel('Usuario').fill(TEST_USER.username);
  await page.getByLabel('Contraseña').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

  // Abrir caja
  await page.goto('/#/cash-register');
  await page.waitForTimeout(1000);

  const openButton = page.getByRole('button', { name: 'Abrir Caja' });
  const isOpenButtonVisible = await openButton.isVisible({ timeout: 3000 }).catch(() => false);

  if (isOpenButtonVisible) {
    await openButton.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Esperar sugerencia del servidor
    await page.waitForTimeout(2000);

    // Llenar monto con teclado (más confiable con NumericInput)
    const amountInput = page.getByLabel(/Monto Inicial/i);
    await amountInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(TEST_CASH_REGISTER.initialAmount.toString());

    await page.waitForTimeout(500);

    // Notas
    const notesInput = page.getByLabel(/Notas/i);
    if (await notesInput.isVisible().catch(() => false)) {
      await notesInput.fill(TEST_CASH_REGISTER.openingNotes);
    }

    // Confirmar
    const confirmButton = page.getByRole('dialog').getByRole('button', { name: 'Abrir Caja' }).first();
    const isEnabled = await confirmButton.isEnabled().catch(() => false);

    if (isEnabled) {
      await confirmButton.click();
      await expect(page.getByText('Caja Abierta')).toBeVisible({ timeout: 5000 });
    }
  }

  // Volver a dashboard
  await page.goto('/#/dashboard');

  // Guardar estado para este proyecto
  await page.context().storageState({ path: 'e2e/.auth/user-with-cash.json' });
});
