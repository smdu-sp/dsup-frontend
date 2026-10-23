import { resetDb, seedBase, UsuariosSeed } from '@/shared/lib/testUtils/db';
import { prisma } from '@/shared/lib/prisma';
import * as usuarioServices from './usuario.services';

jest.mock('@/shared/lib/getUsuarioAtual');
import { getUsuarioAtual } from '@/shared/lib/getUsuarioAtual';
const mockedGetUsuarioAtual = getUsuarioAtual as jest.MockedFunction<typeof getUsuarioAtual>;

describe('usuario.services (integração, porta do Nest para Prisma direto)', () => {
  let seed: UsuariosSeed;

  beforeEach(async () => {
    await resetDb();
    seed = await seedBase();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  describe('criar', () => {
    it('ADM cria usuário passando unidade_id explícito (sem depender do SGU)', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const criado = await usuarioServices.criar({
        nome: 'Usuario Novo Teste',
        login: 'novousuario',
        email: 'novo@example.com',
        permissao: 'TEC',
        unidade_id: seed.unidade.id,
      });
      expect(criado.login).toBe('novousuario');
      expect(criado.unidade_id).toBe(seed.unidade.id);
    });

    it('recusa login duplicado', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await usuarioServices.criar({
        nome: 'Usuario Duplicado',
        login: seed.adm.login,
        email: 'outro@example.com',
        permissao: 'TEC',
        unidade_id: seed.unidade.id,
      });
      expect(resposta).toBeUndefined();
    });

    it('TEC/USR não conseguem criar usuário (fix: era @Permissoes(SUP,ADM) morto, agora só ADM)', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.tec);
      const resposta = await usuarioServices.criar({
        nome: 'Usuario Bloqueado',
        login: 'bloqueado1',
        email: 'bloqueado@example.com',
        permissao: 'TEC',
        unidade_id: seed.unidade.id,
      });
      expect(resposta).toBeUndefined();
    });
  });

  describe('buscarTudo', () => {
    it('ADM lista todos os usuários ativos por padrão', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await usuarioServices.buscarTudo(1);
      expect(resposta.total).toBe(5); // dev, adm, tec, tec2, usr (tecInativo é status 2)
    });

    it('filtra por busca (nome/login/email)', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await usuarioServices.buscarTudo(1, 1, 10, seed.tec.email);
      expect(resposta.total).toBe(1);
      expect(resposta.data[0].login).toBe(seed.tec.login);
    });

    it('filtra por permissao', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await usuarioServices.buscarTudo(1, 1, 10, '', 'TEC');
      expect(resposta.total).toBe(2); // ctec + ctec2
    });

    it('TEC/USR não podem acessar', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await usuarioServices.buscarTudo(1);
      expect(resposta.data).toBeUndefined();
    });

    it('fix: DEV sem status na chamada não quebra mais (antes gerava NaN no where)', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.dev);
      const resposta = await usuarioServices.buscarTudo(NaN);
      expect(resposta.total).toBeGreaterThan(0);
    });
  });

  describe('buscarPorId', () => {
    it('retorna o usuário', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await usuarioServices.buscarPorId(seed.tec.id);
      expect(resposta.id).toBe(seed.tec.id);
    });
  });

  describe('atualizar', () => {
    it('ADM pode atualizar qualquer usuário', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await usuarioServices.atualizar(seed.tec.id, { unidade_id: seed.unidade.id });
      expect(resposta.id).toBe(seed.tec.id);
    });

    it('TEC só pode atualizar a si mesmo', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.tec);
      const proprio = await usuarioServices.atualizar(seed.tec.id, { unidade_id: seed.unidade.id });
      expect(proprio).toBeTruthy();

      const outro = await usuarioServices.atualizar(seed.usr.id, { unidade_id: seed.unidade.id });
      expect(outro).toBeUndefined();
    });

    it('TEC não consegue se auto-promover: permissão é rebaixada de volta pra TEC', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.tec);
      const resposta = await usuarioServices.atualizar(seed.tec.id, { permissao: 'ADM' });
      expect(resposta.permissao).toBe('TEC');
    });
  });

  describe('listaCompleta', () => {
    it('retorna TODOS os usuários, inclusive inativos (sem filtro de status)', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await usuarioServices.listaCompleta();
      expect(resposta.length).toBe(6);
      expect(resposta.some((u) => u.id === seed.tecInativo.id)).toBe(true);
    });

    it('USR não pode acessar', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await usuarioServices.listaCompleta();
      expect(resposta).toEqual([]);
    });
  });

  describe('desativar / autorizar', () => {
    it('desativa e reativa um usuário', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const desativado = await usuarioServices.desativar(seed.tec.id);
      expect(desativado.desativado).toBe(true);

      const emBanco = await prisma.usuario.findUnique({ where: { id: seed.tec.id } });
      expect(emBanco?.status).toBe(2);

      const reativado = await usuarioServices.autorizar(seed.tec.id);
      expect(reativado.autorizado).toBe(true);
    });
  });

  describe('validaUsuario', () => {
    it('retorna o usuário logado com a unidade populada', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await usuarioServices.validaUsuario();
      expect(resposta.id).toBe(seed.usr.id);
      expect(resposta.unidade?.id).toBe(seed.unidade.id);
    });

    it('usuário inativo: devolve undefined (layout trata redirecionando pro login)', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.tecInativo);
      const resposta = await usuarioServices.validaUsuario();
      expect(resposta).toBeUndefined();
    });
  });
});
