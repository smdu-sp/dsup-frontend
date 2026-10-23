import { test, expect } from '@playwright/test';
import { login, FIXTURE_LOGINS } from './utils';

test.describe('Autenticação e gates de rota por perfil', () => {
  test('login com ambiente local aceita qualquer senha e cai no painel', async ({
    page,
  }) => {
    await login(page, FIXTURE_LOGINS.adm);
    await expect(page).toHaveURL('/');
  });

  test('rota livre (/login) redireciona pra fora se já logado', async ({
    page,
  }) => {
    await login(page, FIXTURE_LOGINS.usr);
    await page.goto('/login');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('USR não acessa /usuarios (rota admin) — redireciona pra /chamados', async ({
    page,
  }) => {
    await login(page, FIXTURE_LOGINS.usr);
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/chamados/);
  });

  test('ADM acessa /usuarios normalmente', async ({ page }) => {
    await login(page, FIXTURE_LOGINS.adm);
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/usuarios/);
  });

  test('usuário inativo é barrado mesmo com token válido', async ({
    page,
  }) => {
    // login local aceita a senha, mas ValidaUsuario() barra status != 1
    await page.goto('/login');
    await page.getByPlaceholder('Usuário de rede').fill(FIXTURE_LOGINS.tecInativo);
    await page.getByPlaceholder('Senha de rede').fill('qualquer');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL(/\/($|chamados)/, { timeout: 15000 }).catch(() => {});
    await page.goto('/chamados');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});
