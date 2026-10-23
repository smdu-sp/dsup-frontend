import { Page, expect } from '@playwright/test';

export async function login(page: Page, login: string) {
  // limpa qualquer sessão anterior: /login redireciona pra fora se já
  // houver sessão válida (layout de rotas-livres), o que impediria trocar
  // de usuário no meio de um teste.
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByPlaceholder('Usuário de rede').fill(login);
  await page.getByPlaceholder('Senha de rede').fill('qualquer');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
}

export const FIXTURE_LOGINS = {
  dev: 'cdev',
  adm: 'cadm',
  tec: 'ctec',
  tec2: 'ctec2',
  tecInativo: 'ctecinativo',
  usr: 'cusr',
} as const;
