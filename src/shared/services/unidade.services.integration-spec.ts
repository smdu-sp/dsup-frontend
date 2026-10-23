import { resetDb, seedBase, UsuariosSeed } from '@/shared/lib/testUtils/db';
import { prisma } from '@/shared/lib/prisma';
import * as unidadeServices from './unidade.services';

jest.mock('@/shared/lib/getUsuarioAtual');
import { getUsuarioAtual } from '@/shared/lib/getUsuarioAtual';
const mockedGetUsuarioAtual = getUsuarioAtual as jest.MockedFunction<typeof getUsuarioAtual>;

describe('unidade.services (integração, porta do Nest para Prisma direto)', () => {
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
    it('ADM cria uma unidade', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const criada = await unidadeServices.criar({ nome: 'Unidade Nova', sigla: 'UN', codigo: '002', status: 'true' });
      expect(criada?.status).toBe(true);
    });

    it('recusa código, nome ou sigla duplicados', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const codigoDup = await unidadeServices.criar({ nome: 'Outra', sigla: 'OU', codigo: seed.unidade.codigo, status: 'true' });
      expect(codigoDup).toBeUndefined();
      const nomeDup = await unidadeServices.criar({ nome: seed.unidade.nome, sigla: 'OU2', codigo: '003', status: 'true' });
      expect(nomeDup).toBeUndefined();
    });

    it('TEC/USR não podem criar unidade', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await unidadeServices.criar({ nome: 'Bloqueada', sigla: 'BL', codigo: '004', status: 'true' });
      expect(resposta).toBeUndefined();
    });
  });

  describe('buscarTudo', () => {
    it('lista com paginação e filtro de busca', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await unidadeServices.buscarTudo('all', 1, 10, seed.unidade.sigla);
      expect(resposta.total).toBe(1);
      expect(resposta.data?.[0].id).toBe(seed.unidade.id);
    });

    it('TEC/USR não podem acessar', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await unidadeServices.buscarTudo();
      expect(resposta.data).toBeUndefined();
    });
  });

  describe('listaCompleta', () => {
    it('qualquer perfil autenticado pode acessar', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.usr);
      const resposta = await unidadeServices.listaCompleta();
      expect(resposta.length).toBe(1);
    });
  });

  describe('buscarPorId', () => {
    it('retorna a unidade', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await unidadeServices.buscarPorId(seed.unidade.id);
      expect(resposta?.id).toBe(seed.unidade.id);
    });
  });

  describe('atualizar', () => {
    it('atualiza os dados da unidade', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const resposta = await unidadeServices.atualizar({
        id: seed.unidade.id, nome: 'Unidade Renomeada', sigla: seed.unidade.sigla, codigo: seed.unidade.codigo, status: 'true',
      });
      expect(resposta?.nome).toBe('Unidade Renomeada');
    });
  });

  describe('desativar / ativar', () => {
    it('desativa e reativa a unidade', async () => {
      mockedGetUsuarioAtual.mockResolvedValue(seed.adm);
      const desativado = await unidadeServices.desativar(seed.unidade.id);
      expect(desativado).toBeTruthy();

      const emBanco = await prisma.unidade.findUnique({ where: { id: seed.unidade.id } });
      expect(emBanco?.status).toBe(false);

      const ativado = await unidadeServices.ativar(seed.unidade.id);
      expect(ativado?.status).toBe(true);
    });
  });
});
