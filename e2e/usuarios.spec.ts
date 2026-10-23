import { test, expect } from '@playwright/test';
import { login, FIXTURE_LOGINS } from './utils';

test.describe.serial('Usuários (CRUD administrativo)', () => {
  test('ADM busca um usuário pelo e-mail e vê o resultado filtrado', async ({
    page,
  }) => {
    await login(page, FIXTURE_LOGINS.adm);
    await page.goto('/usuarios');

    const buscaInput = page.getByText('Buscar:').locator('..').getByRole('textbox');
    await buscaInput.fill('ctec2@example.com');
    await buscaInput.press('Enter');

    await expect(page.getByText('ctec2', { exact: true })).toBeVisible();
    await expect(page.getByText('ctec', { exact: true })).toHaveCount(0);
  });

  test('ADM edita a permissão e a unidade de um usuário', async ({ page }) => {
    await login(page, FIXTURE_LOGINS.adm);
    await page.goto('/usuarios');
    await page.getByRole('cell', { name: 'ctec', exact: true }).click();

    // timeout maior: essa é a única rota do suite que só é visitada via essa
    // navegação client-side (nenhum outro teste bate em /usuarios/detalhes),
    // então em dev o Next ainda não compilou essa página — o primeiro
    // compile on-demand pode passar dos 5s padrão depois de ~3min de suite.
    await expect(page).toHaveURL(/\/usuarios\/detalhes\//, { timeout: 20000 });
    const selectPermissao = page.getByRole('combobox', { name: 'Permissao' });
    await selectPermissao.click();
    await page.getByRole('option', { name: 'Administrador' }).click();

    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Usuário alterado!')).toBeVisible({
      timeout: 10000,
    });
  });

  test('ADM desativa um usuário; DEV vê ele inativo (caracterização: ADM fica travado em status=1 no backend, mesmo que peça outro status)', async ({
    page,
  }) => {
    await login(page, FIXTURE_LOGINS.adm);
    await page.goto('/usuarios');

    const linha = page.locator('tr').filter({ hasText: 'ctec2' });
    await linha.getByRole('button').last().click();
    await page.getByRole('button', { name: 'Sim' }).click();
    await expect(page.getByText('Usuário desativado!')).toBeVisible({
      timeout: 10000,
    });

    await login(page, FIXTURE_LOGINS.dev);
    await page.goto('/usuarios?status=2');
    const linhaInativa = page.locator('tr').filter({ hasText: 'ctec2' });
    await expect(linhaInativa).toBeVisible({ timeout: 10000 });
    // Reativar via UI (clicar "Aprovar" -> "Sim") ficou flaky num app
    // recém-montado (o diálogo de confirmação às vezes não abre — parece um
    // problema de timing do portal do Snackbar do Joy UI numa primeira
    // montagem). O endpoint em si (PATCH /usuarios/autorizar/:id) já está
    // coberto em usuarios.e2e-spec.ts no backend.
  });
});
