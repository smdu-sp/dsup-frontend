'use server'

import { prisma } from "@/shared/lib/prisma";
import { getUsuarioAtual } from "@/shared/lib/getUsuarioAtual";
import { requerPermissao } from "@/shared/lib/permissao";

export interface IChamadoPeriodoAno {
    Finalizado: string;
    '#': string;
    Prioridade: string;
    Tipo: string;
    Status: string;
    Unidade: string;
    Andar: string;
    Sala: string;
    Solicitante: string;
    'Tratar com': string;
    Telefone: string;
    'Técnico Responsável': string;
    'Data de Abertura': string;
    'Data de Encerramento': string;
    'Observações': string;
}

async function listarChamadosPeriodoAno(ano_inicio: number = 2024, ano_fim: number = 2024): Promise<IChamadoPeriodoAno[]> {
    const usuario = await getUsuarioAtual();
    try {
        // Fix: era @Permissoes('SUP', 'ADM') no Nest — 'SUP' não existe no
        // enum Permissao, então na prática já só ADM (e DEV) passavam.
        requerPermissao(usuario, ['ADM']);

        const prioridades = ['', 'Baixa', 'Média', 'Alta', 'Urgente'];
        const tipos = ['', 'Elétrica', 'Hidráulica', 'Telefonia', 'Outros'];
        const status = ['', 'Aberto', 'Em Andamento', 'Aguardando avaliação', 'Concluído'];

        if (!ano_fim) ano_fim = ano_inicio;
        if (ano_inicio > ano_fim || ano_inicio < 2024 || ano_fim < 2024) {
            throw new Error('Ano de início deve ser maior ou igual a 2024 e menor ou igual ao ano de fim');
        }

        const chamados = await prisma.ordem.findMany({
            where: {
                data_solicitacao: {
                    gte: new Date(ano_inicio, 0, 1),
                    lt: new Date(ano_fim + 1, 0, 1),
                },
            },
            orderBy: { data_solicitacao: 'asc' },
            select: {
                id: true,
                andar: true,
                sala: true,
                tratar_com: true,
                telefone: true,
                observacoes: true,
                data_solicitacao: true,
                prioridade: true,
                tipo: true,
                status: true,
                solicitante: { select: { nome: true } },
                unidade: { select: { sigla: true } },
                servicos: {
                    orderBy: { data_inicio: 'desc' },
                    select: { data_fim: true, tecnico: { select: { nome: true } } },
                },
            },
        });

        return chamados.map((chamado) => ({
            Finalizado: chamado.status === 4 ? 'Sim' : 'Não',
            '#': chamado.id,
            Prioridade: prioridades[chamado.prioridade],
            Tipo: tipos[chamado.tipo],
            Status: status[chamado.status],
            Unidade: chamado.unidade.sigla,
            Andar: String(chamado.andar),
            Sala: chamado.sala,
            Solicitante: chamado.solicitante.nome,
            'Tratar com': chamado.tratar_com ?? '',
            Telefone: chamado.telefone,
            'Técnico Responsável': chamado.servicos[0]?.tecnico?.nome ?? '',
            'Data de Abertura': new Date(chamado.data_solicitacao).toLocaleDateString().split('T')[0],
            'Data de Encerramento': chamado.servicos[0]?.data_fim
                ? new Date(chamado.servicos[0].data_fim).toLocaleDateString().split('T')[0]
                : '',
            'Observações': chamado.observacoes,
        })) as unknown as IChamadoPeriodoAno[];
    } catch {
        return undefined as unknown as IChamadoPeriodoAno[];
    }
}

export {
    listarChamadosPeriodoAno,
};
