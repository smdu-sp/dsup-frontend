import { test, expect } from '@playwright/test';
import { login, FIXTURE_LOGINS } from './utils';

test.describe.serial('Chamados: criar, atribuir e alterar técnico', () => {
  let chamadoId: string;

  test('USR cria um novo chamado', async ({ page }) => {
    await login(page, FIXTURE_LOGINS.usr);
    await page.goto('/chamados/detalhes/');

    await page.getByRole('combobox').first().click();
    await page.getByRole('combobox').first().fill('UT');
    await page.getByRole('option', { name: /UT/ }).click();

    await page.getByPlaceholder('Sala').fill('801');
    await page.getByPlaceholder('Telefone de contato').fill('11999999999');
    await page
      .getByPlaceholder('Descreva de maneira sucinta a ocorrência/problema')
      .fill('Tomada não funciona (teste e2e)');

    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page).toHaveURL(/\/chamados\?criado=1/, { timeout: 15000 });
  });

  test('ADM atribui o chamado só a partir de técnicos ativos', async ({
    page,
  }) => {
    await login(page, FIXTURE_LOGINS.adm);
    await page.goto('/chamados');

    const linhaAberta = page
      .locator('tbody tr')
      .filter({ has: page.locator('td:has-text("Aberto")') })
      .first();
    chamadoId = (await linhaAberta.locator('td').first().innerText()).trim();

    await linhaAberta.getByRole('button').last().click();

    const selectTecnico = page.getByRole('combobox', { name: 'Técnico' });
    await selectTecnico.click();
    await expect(page.getByRole('option', { name: /Usuario ctec2/ })).toBeVisible();
    await expect(
      page.getByRole('option', { name: /Usuario ctecinativo/ }),
    ).toHaveCount(0);

    await page.getByRole('option', { name: /Usuario ctec2/ }).click();
    await page.getByRole('button', { name: 'Atribuir chamado' }).click();

    await expect(page.getByText('Chamado atribuído!')).toBeVisible({
      timeout: 10000,
    });
  });

  test('ADM altera o técnico responsável e o histórico aparece', async ({
    page,
  }) => {
    await login(page, FIXTURE_LOGINS.adm);
    await page.goto(`/chamados/detalhes/${chamadoId}`);

    const tecnicoFormControl = page
      .getByText('Técnico', { exact: true })
      .locator('..');
    await expect(tecnicoFormControl.getByRole('textbox')).toHaveValue(
      'Usuario ctec2',
    );

    // ícone de editar ao lado do campo Técnico
    await tecnicoFormControl.getByRole('button').click();

    const selectTecnico = page.getByRole('combobox', { name: 'Técnico' });
    await selectTecnico.click();
    await page.getByRole('option', { name: /^Usuario ctec$/ }).click();

    // botão de confirmar (ícone de check) — primeiro dos dois botões que
    // aparecem no lugar do ícone de editar, em modo de edição
    await tecnicoFormControl.getByRole('button').first().click();

    await expect(page.getByText('Técnico responsável alterado com sucesso!')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/alterou o técnico de Usuario ctec2 para Usuario ctec/)).toBeVisible();
  });
});
