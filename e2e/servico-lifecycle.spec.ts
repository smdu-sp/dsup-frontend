import { test, expect } from '@playwright/test';
import { login, FIXTURE_LOGINS } from './utils';

test.describe.serial('Ciclo de vida de um serviço: assumir, pausar, retomar, finalizar, avaliar', () => {
  let chamadoId: string;

  test('USR cria o chamado', async ({ page }) => {
    await login(page, FIXTURE_LOGINS.usr);
    await page.goto('/chamados/detalhes/');

    await page.getByRole('combobox').first().click();
    await page.getByRole('combobox').first().fill('UT');
    await page.getByRole('option', { name: /UT/ }).click();
    await page.getByPlaceholder('Sala').fill('900');
    await page.getByPlaceholder('Telefone de contato').fill('11999999999');
    await page
      .getByPlaceholder('Descreva de maneira sucinta a ocorrência/problema')
      .fill('Ar-condicionado com vazamento (teste e2e ciclo de vida)');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page).toHaveURL(/\/chamados\?criado=1/, { timeout: 15000 });
  });

  test('TEC assume o chamado', async ({ page }) => {
    await login(page, FIXTURE_LOGINS.tec);
    await page.goto('/chamados');

    const linhaAberta = page
      .locator('tbody tr')
      .filter({ has: page.locator('td:has-text("Aberto")') })
      .first();
    chamadoId = (await linhaAberta.locator('td').first().innerText()).trim();

    await linhaAberta.getByRole('button').last().click();
    await page.getByRole('button', { name: 'Assumir chamado' }).click();
    await expect(page.getByText('Chamado atribuído!')).toBeVisible({
      timeout: 10000,
    });
  });

  test('TEC pausa e depois retoma o serviço', async ({ page }) => {
    await login(page, FIXTURE_LOGINS.tec);
    await page.goto(`/chamados/detalhes/${chamadoId}`);

    await page.getByRole('button', { name: 'Pausar serviço' }).click();
    await page
      .getByLabel('Motivo da Paralização')
      .fill('Aguardando peça de reposição (teste e2e)');
    await page.getByRole('button', { name: 'Pausar', exact: true }).click();
    await expect(page.getByText('Serviço suspenso!')).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole('button', { name: 'Retomar serviço' }).click();
    await expect(page.getByText('Serviço retomado!')).toBeVisible({
      timeout: 10000,
    });
  });

  test('TEC finaliza o serviço', async ({ page }) => {
    await login(page, FIXTURE_LOGINS.tec);
    await page.goto(`/chamados/detalhes/${chamadoId}`);

    await page.getByRole('button', { name: 'Finalizar' }).click();
    await expect(page.getByText('Ordem finalizada com sucesso!')).toBeVisible({
      timeout: 10000,
    });
  });

  test('USR avalia o serviço como resolvido', async ({ page }) => {
    await login(page, FIXTURE_LOGINS.usr);
    await page.goto(`/chamados/detalhes/${chamadoId}`);

    const selectResolvido = page.getByRole('combobox', {
      name: 'O problema foi solucionado?',
    });
    await selectResolvido.click();
    await page.getByRole('option', { name: 'Sim' }).click();

    await page.getByRole('button', { name: 'Avaliar' }).click();
    await expect(page.getByText('Ordem avaliada com sucesso!')).toBeVisible({
      timeout: 10000,
    });
  });
});
