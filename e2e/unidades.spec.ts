import { test, expect } from '@playwright/test';
import { login, FIXTURE_LOGINS } from './utils';

test.describe.serial('Unidades (CRUD administrativo)', () => {
  test('ADM cria uma unidade', async ({ page }) => {
    await login(page, FIXTURE_LOGINS.adm);
    await page.goto('/unidades/detalhes/');

    await page.getByPlaceholder('Nome').fill('Unidade E2E');
    await page.getByPlaceholder('Código').fill('E2E01');
    await page.getByPlaceholder('Sigla').fill('E2E');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page).toHaveURL(/\/unidades\/detalhes\//, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Unidade E2E' })).toBeVisible();
  });

  test('ADM vê e edita a unidade recém-criada na listagem', async ({
    page,
  }) => {
    await login(page, FIXTURE_LOGINS.adm);
    await page.goto('/unidades');

    await page.getByRole('cell', { name: 'E2E', exact: true }).click();
    await expect(page).toHaveURL(/\/unidades\/detalhes\//);

    await page.getByPlaceholder('Nome').fill('Unidade E2E Renomeada');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Unidade alterada!')).toBeVisible({
      timeout: 10000,
    });
  });

  test('ADM desativa a unidade', async ({ page }) => {
    await login(page, FIXTURE_LOGINS.adm);
    await page.goto('/unidades');

    const linha = page.locator('tr').filter({ hasText: 'E2E' });
    await linha.getByRole('button').click();
    await page.getByRole('button', { name: 'Sim' }).click();
    await expect(page.getByText('Unidade desativada!')).toBeVisible({
      timeout: 10000,
    });

    await page.goto('/unidades');
    await expect(page.getByRole('cell', { name: 'E2E', exact: true })).toHaveCount(0);
  });
});
