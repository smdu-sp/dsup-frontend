'use server'

import { prisma } from "@/shared/lib/prisma";
import { getUsuarioAtual } from "@/shared/lib/getUsuarioAtual";
import { requerPermissao, AcaoNaoAutorizada } from "@/shared/lib/permissao";
import { verificaPagina, verificaLimite } from "@/shared/lib/paginacao";

export interface ITipoChamado {
    id: string;
    nome: string;
    cor: string;
    status: boolean;
}

export interface IPaginadoTipoChamado {
    data?: ITipoChamado[];
    total: number;
    pagina: number;
    limite: number;
}

async function listaCompleta(): Promise<ITipoChamado[]> {
    const lista = await prisma.tipoChamado.findMany({ orderBy: { nome: 'asc' } });
    return lista;
}

async function buscarTudo(status: string = 'true', pagina: number = 1, limite: number = 10, busca: string = ''): Promise<IPaginadoTipoChamado> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM']);
        [pagina, limite] = verificaPagina(pagina, limite);
        const searchParams = {
            ...(busca ? { nome: { contains: busca } } : {}),
            ...(status === 'all' ? {} : { status: status === 'true' }),
        };
        const total = await prisma.tipoChamado.count({ where: searchParams });
        if (total === 0) return { total: 0, pagina: 0, limite: 0 } as IPaginadoTipoChamado;
        [pagina, limite] = verificaLimite(pagina, limite, total);
        const tipos = await prisma.tipoChamado.findMany({
            where: searchParams,
            orderBy: { nome: 'asc' },
            skip: (pagina - 1) * limite,
            take: limite,
        });
        return { total, pagina, limite, data: tipos };
    } catch {
        return { total: 0, pagina: 0, limite: 0 } as IPaginadoTipoChamado;
    }
}

async function buscarPorId(id: string): Promise<ITipoChamado | undefined> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM']);
        const tipo = await prisma.tipoChamado.findUnique({ where: { id } });
        return tipo ?? undefined;
    } catch {
        return undefined;
    }
}

async function criar({ nome, cor, status }: { nome: string, cor: string, status: string }): Promise<ITipoChamado | undefined> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM']);
        if (await prisma.tipoChamado.findUnique({ where: { nome } })) throw new AcaoNaoAutorizada('Já existe um tipo de chamado com o mesmo nome.');
        const novoTipo = await prisma.tipoChamado.create({
            data: { nome, cor, status: status === 'true' }
        });
        return novoTipo;
    } catch {
        return undefined;
    }
}

async function atualizar({ id, nome, cor, status }: { id: string, nome: string, cor: string, status: string }): Promise<ITipoChamado | undefined> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM']);
        const tipo = await prisma.tipoChamado.findUnique({ where: { id } });
        if (!tipo) return undefined;
        if (nome) {
            const tipoNome = await prisma.tipoChamado.findUnique({ where: { nome } });
            if (tipoNome && tipoNome.id !== id) throw new AcaoNaoAutorizada('Já existe um tipo de chamado com o mesmo nome.');
        }
        const atualizado = await prisma.tipoChamado.update({
            where: { id },
            data: { nome, cor, status: status === 'true' }
        });
        return atualizado;
    } catch {
        return undefined;
    }
}

async function ativar(id: string): Promise<ITipoChamado | undefined> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM']);
        const tipo = await prisma.tipoChamado.findUnique({ where: { id } });
        if (!tipo) return undefined;
        return await prisma.tipoChamado.update({ where: { id }, data: { status: true } });
    } catch {
        return undefined;
    }
}

async function desativar(id: string): Promise<{ message: string } | undefined> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM']);
        const tipo = await prisma.tipoChamado.findUnique({ where: { id } });
        if (!tipo) return undefined;
        await prisma.tipoChamado.update({ where: { id }, data: { status: false } });
        return { message: 'Tipo de chamado desativado com sucesso.' };
    } catch {
        return undefined;
    }
}

export {
    ativar,
    atualizar,
    buscarTudo,
    buscarPorId,
    criar,
    desativar,
    listaCompleta
};
