import { resetDb, seedBase, UsuariosSeed } from '@/shared/lib/testUtils/db';
import { prisma } from '@/shared/lib/prisma';
import * as ordemServices from './ordem.services';

jest.mock('@/shared/lib/getUsuarioAtual');
import { getUsuarioAtual } from '@/shared/lib/getUsuarioAtual';
const mockedGetUsuarioAtual = getUsuarioAtual as jest.MockedFunction<typeof getUsuarioAtual>;

describe('ordem.services (integração, porta do Nest para Prisma direto)', () => {
  let seed: UsuariosSeed;

  const dtoBase = () => ({
    andar: 8,
    sala: '801',
    tipo: 1,
    observacoes: 'Tomada não funciona',
    telefone: '11999999999',
  });

  beforeEach(async () => {
    await resetDb();
    seed = await seedBase();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  describe('criar', () => {
    it('cria uma ordem com id gerado (NNNN-AA) e solicitante = usuário logado', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await ordemServices.criar({ unidade_id: seed.unidade.id, ...dtoBase() });
      expect('error' in resposta).toBe(false);
      const ordem = resposta as ordemServices.IOrdem;
      expect(ordem.id).toMatch(/^\d{4}-\d{2}$/);
      expect(ordem.solicitante_id).toBe(seed.usr.id);
      expect(ordem.status).toBe(1);
    });

    it('recusa unidade inexistente', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await ordemServices.criar({ unidade_id: 'nao-existe', ...dtoBase() });
      expect('error' in resposta).toBe(true);
    });
  });

  describe('buscarTudo — escopo por permissao', () => {
    let unidadeOutra: Awaited<ReturnType<typeof prisma.unidade.create>>;
    let usrOutraUnidade: Awaited<ReturnType<typeof prisma.usuario.create>>;
    let ordemPropria: Awaited<ReturnType<typeof prisma.ordem.create>>;
    let ordemOutraUnidade: Awaited<ReturnType<typeof prisma.ordem.create>>;

    beforeEach(async () => {
      unidadeOutra = await prisma.unidade.create({
        data: { nome: 'Unidade Outra', sigla: 'UO', codigo: '999' },
      });
      usrOutraUnidade = await prisma.usuario.create({
        data: {
          nome: 'Usuario Outra Unidade',
          login: 'usroutra',
          email: 'usroutra@example.com',
          permissao: 'USR',
          unidade_id: unidadeOutra.id,
        },
      });
      ordemPropria = await prisma.ordem.create({
        data: {
          id: 'TEST-001', unidade_id: seed.unidade.id, andar: 8, sala: '801',
          solicitante_id: seed.usr.id, telefone: '11999999999', observacoes: 'Ordem do próprio usuário',
        },
      });
      ordemOutraUnidade = await prisma.ordem.create({
        data: {
          id: 'TEST-002', unidade_id: unidadeOutra.id, andar: 1, sala: '101',
          solicitante_id: usrOutraUnidade.id, telefone: '11888888888', observacoes: 'Ordem de outra unidade/solicitante',
        },
      });
    });

    it('USR só vê ordens da própria unidade ou que ele mesmo abriu', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await ordemServices.buscarTudo(0);
      const ids = resposta.data.map((o) => o.id);
      expect(ids).toContain(ordemPropria.id);
      expect(ids).not.toContain(ordemOutraUnidade.id);
    });

    it('ADM vê todas as ordens, sem escopo', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await ordemServices.buscarTudo(0);
      const ids = resposta.data.map((o) => o.id);
      expect(ids).toContain(ordemPropria.id);
      expect(ids).toContain(ordemOutraUnidade.id);
    });

    it('fix: status/tipo NaN não quebram mais buscarTudo', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await ordemServices.buscarTudo(NaN, 1, 10, '', '', 0, '', NaN);
      expect(resposta.total).toBeGreaterThan(0);
    });

    it('buscarPorId: USR não consegue ver ordem fora do seu escopo', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await ordemServices.buscarPorId(ordemOutraUnidade.id);
      expect(resposta).toBeUndefined();
    });

    it('buscarPorId: ADM consegue ver qualquer ordem', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await ordemServices.buscarPorId(ordemOutraUnidade.id);
      expect(resposta.id).toBe(ordemOutraUnidade.id);
    });
  });

  describe('atualizar', () => {
    it('fix: USR não pode mais mudar a prioridade de uma ordem (antes qualquer autenticado podia)', async () => {
      const ordem = await prisma.ordem.create({
        data: {
          id: 'TEST-003', unidade_id: seed.unidade.id, andar: 8, sala: '801',
          solicitante_id: seed.adm.id, telefone: '11999999999', observacoes: 'Ordem de outro usuário',
        },
      });
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await ordemServices.atualizar(ordem.id, { prioridade: 4 });
      expect(resposta).toBeUndefined();

      mockedGetUsuarioAtual.mockResolvedValue(seed.tec);
      const respostaTec = await ordemServices.atualizar(ordem.id, { prioridade: 4 });
      expect(respostaTec.prioridade).toBe(4);
    });
  });

  describe('retornaPainel', () => {
    it('USR: "abertos" conta só as próprias ordens; "naoAtribuidos"/"concluidos" são globais', async () => {
      await prisma.ordem.create({
        data: {
          id: 'TEST-004', unidade_id: seed.unidade.id, andar: 8, sala: '801',
          solicitante_id: seed.usr.id, telefone: '11999999999', observacoes: 'Aberta pelo próprio usr', status: 1,
        },
      });
      await prisma.ordem.create({
        data: {
          id: 'TEST-005', unidade_id: seed.unidade.id, andar: 8, sala: '802',
          solicitante_id: seed.adm.id, telefone: '11999999999', observacoes: 'Aberta por outra pessoa', status: 1,
        },
      });
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await ordemServices.retornaPainel();
      expect(resposta.naoAtribuidos).toBe(2);
      expect(resposta.abertos).toBe(1);
    });
  });
});
