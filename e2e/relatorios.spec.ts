import { test, expect } from '@playwright/test';
import { login, FIXTURE_LOGINS } from './utils';

test('ADM gera o relatório de chamados por período e baixa a planilha', async ({
  page,
}) => {
  await login(page, FIXTURE_LOGINS.adm);
  await page.goto('/relatorios');

  const anoAtual = new Date().getFullYear();

  await page.getByRole('combobox', { name: 'Relatório:' }).click();
  await page.getByRole('option', { name: 'Chamados por período (em anos)' }).click();

  await page.getByRole('combobox', { name: 'Ano inicial:' }).click();
  await page.getByRole('option', { name: String(anoAtual), exact: true }).click();

  await page.getByRole('combobox', { name: 'Ano final:' }).click();
  await page.getByRole('option', { name: String(anoAtual), exact: true }).click();

  await expect(page.getByRole('table').first()).toBeVisible({ timeout: 10000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByTitle('Baixar planilha').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
});

test('TEC/USR não têm acesso a relatórios', async ({ page }) => {
  await login(page, FIXTURE_LOGINS.usr);
  await page.goto('/relatorios');
  await expect(page).not.toHaveURL(/\/relatorios/);
});
