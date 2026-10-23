import { resetDb, seedBase, UsuariosSeed } from '@/shared/lib/testUtils/db';
import { prisma } from '@/shared/lib/prisma';
import * as relatorioServices from './relatorio.services';

jest.mock('@/shared/lib/getUsuarioAtual');
import { getUsuarioAtual } from '@/shared/lib/getUsuarioAtual';
const mockedGetUsuarioAtual = getUsuarioAtual as jest.MockedFunction<typeof getUsuarioAtual>;

describe('relatorio.services (integração, porta do Nest para Prisma direto)', () => {
  let seed: UsuariosSeed;

  beforeEach(async () => {
    await resetDb();
    seed = await seedBase();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  describe('listarChamadosPeriodoAno', () => {
    it('ADM lista os chamados do período com os campos formatados', async () => {
      const ordem = await prisma.ordem.create({
        data: {
          id: 'TEST-001', unidade_id: seed.unidade.id, andar: 8, sala: '801',
          solicitante_id: seed.usr.id, telefone: '11999999999', observacoes: 'Problema de teste',
          tipo: 1, prioridade: 2, data_solicitacao: new Date(2024, 5, 1),
        },
      });
      await prisma.servico.create({
        data: { tecnico_id: seed.tec.id, ordem_id: ordem.id, data_fim: new Date(2024, 5, 2) },
      });

      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await relatorioServices.listarChamadosPeriodoAno(2024, 2024);
      expect(resposta).toHaveLength(1);
      expect(resposta[0]['#']).toBe(ordem.id);
      expect(resposta[0].Tipo).toBe('Elétrica');
      expect(resposta[0].Prioridade).toBe('Média');
      expect(resposta[0]['Técnico Responsável']).toBe(seed.tec.nome);
    });

    it('TEC/USR não podem acessar (fix: era @Permissoes(SUP,ADM) morto, agora só ADM)', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await relatorioServices.listarChamadosPeriodoAno(2024, 2024);
      expect(resposta).toBeUndefined();
    });
  });
});
