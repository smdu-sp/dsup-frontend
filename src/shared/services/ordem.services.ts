'use server'

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { getUsuarioAtual } from "@/shared/lib/getUsuarioAtual";
import { requerPermissao, AcaoNaoAutorizada } from "@/shared/lib/permissao";
import { verificaPagina, verificaLimite } from "@/shared/lib/paginacao";
import { IUnidade } from "./unidade.services";
import { IUsuario } from "./usuario.services";
import { IServico } from "./servico.services";

export interface IOrdem {
    id: string;
    unidade_id: string;
    unidade?: IUnidade;
    andar: number;
    sala: string;
    solicitante_id: string;
    solicitante?: IUsuario;
    tratar_com?: string;
    data_solicitacao: Date;
    tipo: number;
    status: number;
    prioridade: number;
    observacoes: string;
    telefone: string;
    servicos: IServico[];
    suspensaoAtiva?: boolean;
}

export interface IPaginadoOrdem {
    data: IOrdem[];
    total: number;
    pagina: number;
    limite: number;
}

// Mesma lógica de OrdensService.geraId(): NNNN-AA, incrementando o último
// cadastrado no ano corrente.
async function geraId(): Promise<string> {
    const agora = new Date();
    const data = agora.getFullYear().toString().substring(2);
    let numerico = 1;
    const ultimoCadastrado = await prisma.ordem.findFirst({
        where: { id: { endsWith: data } },
        orderBy: { data_solicitacao: 'desc' },
    });
    if (ultimoCadastrado) numerico = parseInt(ultimoCadastrado.id.substring(0, 4)) + 1;
    return `${numerico.toString().padStart(4, '0')}-${data}`;
}

// Assinaturas de retorno abaixo mantêm os mesmos tipos "não-undefined" do
// fetch original — na prática já podiam devolver undefined/objeto de erro em
// erro (o .then() do fetch só não deixava o TypeScript enxergar isso através
// do JSON.parse).
async function buscarTudo(status: number = 1, pagina: number = 1, limite: number = 10,
    unidade_id: string = '',
    solicitante_id: string = '',
    andar: number = 0,
    sala: string = '',
    tipo: number = 0
): Promise<IPaginadoOrdem> {
    const usuario = await getUsuarioAtual();
    try {
        if (!usuario) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        [pagina, limite] = verificaPagina(pagina, limite);
        const searchParams = {
            // Fix: status/tipo vindo faltando/NaN não são mais tratados como
            // filtro válido (antes gerava um 500 no Nest — bug de caracterização).
            ...(Number.isFinite(status) && status !== 0 && { status }),
            ...(unidade_id !== '' && { unidade_id }),
            ...(solicitante_id !== '' && { solicitante_id }),
            ...(sala !== '' && { sala }),
            // Caracterização: esse filtro por "andar" é morto no Nest original
            // (a condição espalha `sala` de novo em vez de `andar`) — não é
            // um dos 3 bugs aprovados pra correção, preservado como estava.
            ...(andar !== 0 && { sala }),
            ...(Number.isFinite(tipo) && tipo !== 0 && { tipo }),
            ...(usuario.permissao === 'USR' && {
                // usuario.unidade_id pode ser null (usuário sem unidade); o
                // Nest original (com strictNullChecks desligado) deixava
                // passar — em runtime isso só faz essa ramificação do OR não
                // casar com nada, já que Ordem.unidade_id nunca é nulo.
                OR: [{ unidade_id: usuario.unidade_id }, { solicitante_id: usuario.id }],
            }),
        } as Prisma.OrdemWhereInput;
        const total = await prisma.ordem.count({ where: searchParams });
        if (total === 0) return { total: 0, pagina: 0, limite: 0 } as unknown as IPaginadoOrdem;
        [pagina, limite] = verificaLimite(pagina, limite, total);
        const ordens = await prisma.ordem.findMany({
            where: searchParams,
            orderBy: { data_solicitacao: 'desc' },
            skip: (pagina - 1) * limite,
            take: limite,
            include: {
                unidade: true,
                solicitante: true,
                servicos: { orderBy: { data_inicio: 'desc' }, include: { tecnico: true } },
            },
        });
        return { total, pagina, limite, data: ordens as unknown as IOrdem[] };
    } catch {
        return { total: 0, pagina: 0, limite: 0 } as unknown as IPaginadoOrdem;
    }
}

async function buscarPorId(id: string): Promise<IOrdem> {
    const usuario = await getUsuarioAtual();
    try {
        if (!usuario) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        const ordem = await prisma.ordem.findUnique({
            where: {
                id,
                ...(usuario.permissao === 'USR' && {
                    OR: [{ unidade_id: usuario.unidade_id }, { solicitante_id: usuario.id }],
                }),
            } as Prisma.OrdemWhereUniqueInput,
            include: {
                solicitante: true,
                unidade: true,
                servicos: {
                    include: {
                        suspensoes: true,
                        materiais: true,
                        tecnico: true,
                        historicoTecnicos: {
                            include: { tecnicoAnterior: true, tecnicoNovo: true, alteradoPor: true },
                            orderBy: { alterado_em: 'desc' },
                        },
                    },
                    orderBy: { data_inicio: 'desc' },
                },
            },
        });
        if (!ordem) throw new AcaoNaoAutorizada('Ordem não encontrada');
        const suspensaoAtiva = await prisma.servico.findFirst({ where: { ordem_id: id, status: 5 } });
        return { ...ordem, suspensaoAtiva: !!suspensaoAtiva } as unknown as IOrdem;
    } catch {
        return undefined as unknown as IOrdem;
    }
}

async function criar(ordemDto: { unidade_id: string, andar: number, sala: string, tipo: number, observacoes: string, telefone: string, tratar_com?: string }): Promise<IOrdem | { error: string }> {
    const solicitante = await getUsuarioAtual();
    try {
        if (!solicitante) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        const unidade = await prisma.unidade.findUnique({ where: { id: ordemDto.unidade_id } });
        if (!unidade) throw new AcaoNaoAutorizada('Unidade não encontrada');
        const id = await geraId();
        const novaOrdem = await prisma.ordem.create({
            data: {
                id,
                unidade_id: ordemDto.unidade_id,
                solicitante_id: solicitante.id,
                andar: ordemDto.andar,
                sala: ordemDto.sala,
                tipo: ordemDto.tipo,
                observacoes: ordemDto.observacoes,
                telefone: ordemDto.telefone,
                tratar_com: ordemDto.tratar_com,
                prioridade: 1,
            },
        });
        return novaOrdem as unknown as IOrdem;
    } catch (erro) {
        return { error: (erro as Error).message };
    }
}

async function atualizar(id: string, ordemDto: { prioridade: number }): Promise<IOrdem> {
    const usuario = await getUsuarioAtual();
    try {
        // Fix: PATCH /ordens/atualizar não checava permissão nenhuma no Nest
        // — qualquer usuário autenticado (inclusive USR) podia mudar a
        // prioridade de qualquer ordem. Passa a exigir DEV/ADM/TEC, que já
        // é quem a própria UI mostra o controle de prioridade pra.
        requerPermissao(usuario, ['DEV', 'ADM', 'TEC']);
        const ordem = await prisma.ordem.findUnique({ where: { id } });
        if (!ordem) throw new AcaoNaoAutorizada('Ordem não encontrada');
        const atualizada = await prisma.ordem.update({ where: { id }, data: { prioridade: ordemDto.prioridade } });
        return atualizada as unknown as IOrdem;
    } catch {
        return undefined as unknown as IOrdem;
    }
}

async function retornaPainel(): Promise<{ abertos: number, naoAtribuidos: number, concluidos: number }> {
    const usuario = await getUsuarioAtual();
    try {
        if (!usuario) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        const abertos = usuario.permissao === 'USR'
            ? await prisma.ordem.count({ where: { AND: [{ OR: [{ status: 2 }, { status: 1 }] }, { solicitante_id: usuario.id }] } })
            : await prisma.ordem.count({ where: { status: 2 } });
        const naoAtribuidos = await prisma.ordem.count({ where: { status: 1 } });
        const concluidos = await prisma.ordem.count({ where: { status: 4 } });
        return { abertos, naoAtribuidos, concluidos };
    } catch {
        return undefined as unknown as { abertos: number, naoAtribuidos: number, concluidos: number };
    }
}

export {
    atualizar,
    buscarTudo,
    buscarPorId,
    criar,
    retornaPainel
};
