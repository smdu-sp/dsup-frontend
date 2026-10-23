import { resetDb, seedBase, UsuariosSeed } from '@/shared/lib/testUtils/db';
import { prisma } from '@/shared/lib/prisma';
import * as servicoServices from './servico.services';

jest.mock('@/shared/lib/getUsuarioAtual');
import { getUsuarioAtual } from '@/shared/lib/getUsuarioAtual';
const mockedGetUsuarioAtual = getUsuarioAtual as jest.MockedFunction<typeof getUsuarioAtual>;

describe('servico.services (integração, porta do Nest para Prisma direto)', () => {
  let seed: UsuariosSeed;
  let ordemId: string;
  let ordemCounter = 0;

  async function criarOrdem(solicitanteId: string, unidadeId: string) {
    ordemCounter++;
    return prisma.ordem.create({
      data: {
        id: `TEST-${String(ordemCounter).padStart(3, '0')}`,
        unidade_id: unidadeId, andar: 8, sala: '801',
        solicitante_id: solicitanteId, telefone: '11999999999', observacoes: 'Problema de teste',
      },
    });
  }

  beforeEach(async () => {
    await resetDb();
    seed = await seedBase();
    const ordem = await criarOrdem(seed.usr.id, seed.unidade.id);
    ordemId = ordem.id;
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  describe('criar (atribuir chamado)', () => {
    it('TEC se auto-atribui (tecnico_id omitido)', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.tec);
      const resposta = await servicoServices.criar({ ordem_id: ordemId, prioridade: 2 });
      expect(resposta.tecnico_id).toBe(seed.tec.id);

      const ordem = await prisma.ordem.findUnique({ where: { id: ordemId } });
      expect(ordem?.status).toBe(2);
      expect(ordem?.prioridade).toBe(2);
    });

    it('ADM atribui um técnico específico', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await servicoServices.criar({ ordem_id: ordemId, prioridade: 1, tecnico_id: seed.tec.id });
      expect(resposta.tecnico_id).toBe(seed.tec.id);
    });

    it('recusa atribuir a um usuário que não é TEC', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await servicoServices.criar({ ordem_id: ordemId, prioridade: 1, tecnico_id: seed.usr.id });
      expect(resposta).toBeUndefined();
    });

    it('USR não-técnico não consegue se auto-atribuir', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await servicoServices.criar({ ordem_id: ordemId, prioridade: 1 });
      expect(resposta).toBeUndefined();
    });
  });

  describe('atualizar', () => {
    it('fix: só o técnico dono (ou DEV/ADM) atualiza a descrição — antes qualquer autenticado podia', async () => {
      const servico = await prisma.servico.create({ data: { tecnico_id: seed.tec.id, ordem_id: ordemId } });

      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const respostaUsr = await servicoServices.atualizar(servico.id, { descricao: 'Tentando de fora' });
      expect(respostaUsr).toBeUndefined();

      mockedGetUsuarioAtual.mockResolvedValue(seed.tec);
      const respostaDono = await servicoServices.atualizar(servico.id, { descricao: 'Troquei a tomada' });
      expect(respostaDono.descricao).toBe('Troquei a tomada');
    });
  });

  describe('finalizarServico', () => {
    it('o técnico dono finaliza o próprio serviço', async () => {
      const servico = await prisma.servico.create({ data: { tecnico_id: seed.tec.id, ordem_id: ordemId } });
      mockedGetUsuarioAtual.mockResolvedValue(seed.tec);
      const resposta = await servicoServices.finalizarServico(servico.id);
      expect(resposta.status).toBe(2);

      const ordem = await prisma.ordem.findUnique({ where: { id: ordemId } });
      expect(ordem?.status).toBe(3);
    });

    it('outro técnico não pode finalizar', async () => {
      const outroTec = await prisma.usuario.create({
        data: { nome: 'Outro Tecnico', login: 'outrotec', email: 'outrotec@example.com', permissao: 'TEC', unidade_id: seed.unidade.id },
      });
      const servico = await prisma.servico.create({ data: { tecnico_id: outroTec.id, ordem_id: ordemId } });
      mockedGetUsuarioAtual.mockResolvedValue(seed.tec);
      const resposta = await servicoServices.finalizarServico(servico.id);
      expect(resposta).toBeUndefined();
    });
  });

  describe('avaliarServico', () => {
    it('solicitante da própria unidade avalia como resolvido (status 3) e a ordem vira concluída (4)', async () => {
      const servico = await prisma.servico.create({ data: { tecnico_id: seed.tec.id, ordem_id: ordemId, status: 2 } });
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await servicoServices.avaliarServico(servico.id, { status: 3, observacao: 'Resolvido, obrigado!' });
      expect(resposta).toBeTruthy();

      const ordem = await prisma.ordem.findUnique({ where: { id: ordemId } });
      expect(ordem?.status).toBe(4);
    });

    it('usuário de outra unidade (não-ATIC) não pode avaliar', async () => {
      const outraUnidade = await prisma.unidade.create({ data: { nome: 'Outra', sigla: 'OU', codigo: '999' } });
      const usrOutraUnidade = await prisma.usuario.create({
        data: { nome: 'Usuario Outra Unidade', login: 'usroutra', email: 'usroutra@example.com', permissao: 'USR', unidade_id: outraUnidade.id },
      });
      const servico = await prisma.servico.create({ data: { tecnico_id: seed.tec.id, ordem_id: ordemId, status: 2 } });
      mockedGetUsuarioAtual.mockResolvedValue(usrOutraUnidade);
      const resposta = await servicoServices.avaliarServico(servico.id, { status: 3, observacao: '' });
      expect(resposta).toBeUndefined();
    });

    it('ADM pode avaliar mesmo sem ser da unidade da ordem (só USR/TEC são restritos por unidade)', async () => {
      const servico = await prisma.servico.create({ data: { tecnico_id: seed.tec.id, ordem_id: ordemId, status: 2 } });
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await servicoServices.avaliarServico(servico.id, { status: 4, observacao: 'Não resolveu' });
      expect(resposta).toBeTruthy();

      const ordem = await prisma.ordem.findUnique({ where: { id: ordemId } });
      expect(ordem?.status).toBe(1);
    });
  });

  describe('adicionarSuspensao / retomarServico', () => {
    it('o técnico dono suspende e depois retoma o serviço', async () => {
      const servico = await prisma.servico.create({ data: { tecnico_id: seed.tec.id, ordem_id: ordemId } });
      mockedGetUsuarioAtual.mockResolvedValue(seed.tec);

      const suspenso = await servicoServices.adicionarSuspensao(servico.id, { motivo: 'Aguardando material' });
      expect(suspenso).toBeTruthy();
      const servicoSuspenso = await prisma.servico.findUnique({ where: { id: servico.id } });
      expect(servicoSuspenso?.status).toBe(5);

      const retomado = await servicoServices.retomarServico(servico.id);
      expect(retomado).toBeTruthy();
      const servicoRetomado = await prisma.servico.findUnique({ where: { id: servico.id } });
      expect(servicoRetomado?.status).toBe(1);
    });

    it('outro técnico não consegue suspender', async () => {
      const outroTec = await prisma.usuario.create({
        data: { nome: 'Outro Tecnico 2', login: 'outrotec2', email: 'outrotec2@example.com', permissao: 'TEC', unidade_id: seed.unidade.id },
      });
      const servico = await prisma.servico.create({ data: { tecnico_id: outroTec.id, ordem_id: ordemId } });
      mockedGetUsuarioAtual.mockResolvedValue(seed.tec);
      const resposta = await servicoServices.adicionarSuspensao(servico.id, { motivo: 'Tentando de outro' });
      expect(resposta).toBeUndefined();
    });
  });

  describe('adicionarMaterial / removerMaterial', () => {
    it('o técnico dono adiciona e depois remove um material', async () => {
      const servico = await prisma.servico.create({ data: { tecnico_id: seed.tec.id, ordem_id: ordemId } });
      mockedGetUsuarioAtual.mockResolvedValue(seed.tec);

      const adicionado = await servicoServices.adicionarMaterial(servico.id, { nome: 'Tomada', quantidade: 2, medida: 'un' });
      expect(adicionado.id).toBeTruthy();

      const removido = await servicoServices.removerMaterial(adicionado.id);
      expect(removido.status).toBe(true);
    });
  });

  describe('alterarTecnico (ADM/DEV + trilha de auditoria)', () => {
    it('ADM troca o técnico responsável e grava HistoricoTecnico', async () => {
      const novoTec = await prisma.usuario.create({
        data: { nome: 'Tecnico Novo', login: 'tecnovo', email: 'tecnovo@example.com', permissao: 'TEC', unidade_id: seed.unidade.id },
      });
      const servico = await prisma.servico.create({ data: { tecnico_id: seed.tec.id, ordem_id: ordemId } });
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);

      const resposta = await servicoServices.alterarTecnico(servico.id, { tecnico_id: novoTec.id });
      expect(resposta.tecnico_id).toBe(novoTec.id);

      const historico = await prisma.historicoTecnico.findMany({ where: { servico_id: servico.id } });
      expect(historico).toHaveLength(1);
      expect(historico[0].tecnico_anterior_id).toBe(seed.tec.id);
      expect(historico[0].tecnico_novo_id).toBe(novoTec.id);
      expect(historico[0].alterado_por_id).toBe(seed.adm.id);
    });

    it('TEC e USR não podem alterar o técnico responsável', async () => {
      const servico = await prisma.servico.create({ data: { tecnico_id: seed.tec.id, ordem_id: ordemId } });
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await servicoServices.alterarTecnico(servico.id, { tecnico_id: seed.adm.id });
      expect(resposta).toBeUndefined();
    });

    it('recusa técnico inativo', async () => {
      const servico = await prisma.servico.create({ data: { tecnico_id: seed.tec.id, ordem_id: ordemId } });
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await servicoServices.alterarTecnico(servico.id, { tecnico_id: seed.tecInativo.id });
      expect(resposta).toBeUndefined();
    });

    it('recusa alterar serviço já finalizado', async () => {
      const outroTec = await prisma.usuario.create({
        data: { nome: 'Tecnico Disponivel', login: 'tecdisponivel', email: 'tecdisponivel@example.com', permissao: 'TEC', unidade_id: seed.unidade.id },
      });
      const servico = await prisma.servico.create({ data: { tecnico_id: seed.tec.id, ordem_id: ordemId, status: 3 } });
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await servicoServices.alterarTecnico(servico.id, { tecnico_id: outroTec.id });
      expect(resposta).toBeUndefined();
    });
  });
});
