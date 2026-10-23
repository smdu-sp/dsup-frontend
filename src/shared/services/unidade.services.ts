'use server'

import { prisma } from "@/shared/lib/prisma";
import { getUsuarioAtual } from "@/shared/lib/getUsuarioAtual";
import { requerPermissao, AcaoNaoAutorizada } from "@/shared/lib/permissao";
import { verificaPagina, verificaLimite } from "@/shared/lib/paginacao";

export interface IUnidade {
    id: string;
    nome: string;
    sigla: string;
    codigo: string;
    status: boolean;
}

export interface IPaginadoUnidade {
    data?: IUnidade[];
    total: number;
    pagina: number;
    limite: number;
}

async function listaCompleta(): Promise<IUnidade[]> {
    const lista = await prisma.unidade.findMany({ orderBy: { nome: 'asc' } });
    return lista;
}

async function buscarTudo(status: string = 'true', pagina: number = 1, limite: number = 10, busca: string = ''): Promise<IPaginadoUnidade> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM']);
        [pagina, limite] = verificaPagina(pagina, limite);
        const searchParams = {
            ...(busca ? { OR: [
                { nome: { contains: busca } },
                { sigla: { contains: busca } },
            ] } : {}),
            ...(status === 'all' ? {} : { status: status === 'true' }),
        };
        const total = await prisma.unidade.count({ where: searchParams });
        // Caracterização: o Nest original devolve `users: []` (não `data`)
        // nesse caso — resultado sem `data` (undefined), preservado aqui de
        // propósito porque a página trata isso como "nenhum encontrado".
        if (total === 0) return { total: 0, pagina: 0, limite: 0 } as IPaginadoUnidade;
        [pagina, limite] = verificaLimite(pagina, limite, total);
        const unidades = await prisma.unidade.findMany({
            where: searchParams,
            orderBy: { codigo: 'asc' },
            skip: (pagina - 1) * limite,
            take: limite,
        });
        return { total, pagina, limite, data: unidades };
    } catch {
        return { total: 0, pagina: 0, limite: 0 } as IPaginadoUnidade;
    }
}

// Retorno inclui `| undefined` pra refletir honestamente que essas funções
// já podiam "falhar silenciosamente" na versão fetch original (o .then()
// do fetch só não deixava o TypeScript enxergar isso através do JSON.parse).
async function buscarPorId(id: string): Promise<IUnidade | undefined> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM']);
        const unidade = await prisma.unidade.findUnique({ where: { id } });
        return unidade ?? undefined;
    } catch {
        return undefined;
    }
}

async function desativar(id: string): Promise<{ message: string } | undefined> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM']);
        const unidade = await prisma.unidade.findUnique({ where: { id } });
        if (!unidade) return undefined;
        await prisma.unidade.update({ where: { id }, data: { status: false } });
        return { message: 'Unidade desativada com sucesso.' };
    } catch {
        return undefined;
    }
}

async function criar({ nome, codigo, sigla, status }: { nome: string, codigo: string, sigla: string, status: string }): Promise<IUnidade | undefined> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM']);
        if (await prisma.unidade.findUnique({ where: { codigo } })) throw new AcaoNaoAutorizada('Ja existe uma unidade com o mesmo código');
        if (await prisma.unidade.findUnique({ where: { nome } })) throw new AcaoNaoAutorizada('Ja existe uma unidade com o mesmo nome');
        if (await prisma.unidade.findUnique({ where: { sigla } })) throw new AcaoNaoAutorizada('Ja existe uma unidade com a mesmo sigla');
        const novaUnidade = await prisma.unidade.create({
            data: { nome, sigla, codigo, status: status === 'true' }
        });
        return novaUnidade;
    } catch {
        return undefined;
    }
}

async function atualizar({ id, nome, codigo, sigla, status }: { id: string, nome: string, codigo: string, sigla: string, status: string }): Promise<IUnidade | undefined> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM']);
        const unidade = await prisma.unidade.findUnique({ where: { id } });
        if (!unidade) return undefined;
        if (nome) {
            const unidadeNome = await prisma.unidade.findUnique({ where: { nome } });
            if (unidadeNome && unidadeNome.id !== id) throw new AcaoNaoAutorizada('Já existe uma unidade com o mesmo nome.');
        }
        if (sigla) {
            const unidadeSigla = await prisma.unidade.findUnique({ where: { sigla } });
            if (unidadeSigla && unidadeSigla.id !== id) throw new AcaoNaoAutorizada('Já existe uma unidade com a mesma sigla.');
        }
        if (codigo) {
            const unidadeCodigo = await prisma.unidade.findUnique({ where: { codigo } });
            if (unidadeCodigo && unidadeCodigo.id !== id) throw new AcaoNaoAutorizada('Já existe uma unidade com o mesmo código.');
        }
        const atualizado = await prisma.unidade.update({
            where: { id },
            data: { nome, sigla, codigo, status: status === 'true' }
        });
        return atualizado;
    } catch {
        return undefined;
    }
}

async function ativar(id: string): Promise<IUnidade | undefined> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM']);
        const unidade = await prisma.unidade.findUnique({ where: { id } });
        if (!unidade) return undefined;
        return await prisma.unidade.update({ where: { id }, data: { status: true } });
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
