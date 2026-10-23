'use server'

import { prisma } from "@/shared/lib/prisma";
import { getUsuarioAtual } from "@/shared/lib/getUsuarioAtual";
import { requerPermissao, AcaoNaoAutorizada } from "@/shared/lib/permissao";
import { emailAtualizacaoChamado, enviaEmail } from "@/shared/lib/mail";
import { IUsuario } from "./usuario.services";
import { IOrdem } from "./ordem.services";
import * as ordemServices from "./ordem.services";

export interface IServico {
    id: string;
    ordem_id: string;
    descricao?: string;
    ordem?: IOrdem;
    tecnico_id: string;
    tecnico?: IUsuario;
    suspensoes?: ISuspensao[];
    materiais?: IMaterial[];
    historicoTecnicos?: IHistoricoTecnico[];
    data_inicio: Date;
    data_fim?: Date;
    avaliado_em?: Date;
    status: number;
    observacao?: string;
}

export interface IHistoricoTecnico {
    id: string;
    servico_id: string;
    tecnico_anterior_id: string;
    tecnicoAnterior?: IUsuario;
    tecnico_novo_id: string;
    tecnicoNovo?: IUsuario;
    alterado_por_id: string;
    alteradoPor?: IUsuario;
    alterado_em: Date;
}

export interface IMaterial {
    id: string;
    nome: string;
    quantidade: number;
    medida: string;
    servico_id: string;
}

export interface ISuspensao {
    id: string;
    motivo: string;
    inicio: Date;
    termino: Date;
    servico_id: string;
    servico?: IServico;
    status: boolean;
}

export interface IPaginadoServico {
    data: IServico[];
    total: number;
    pagina: number;
    limite: number;
}

// Assinaturas de retorno abaixo mantêm os mesmos tipos "não-undefined" do
// fetch original — na prática já podiam devolver undefined em erro (o
// .then() do fetch só não deixava o TypeScript enxergar isso através do
// JSON.parse).
async function criar(servicoDto: { ordem_id: string, prioridade: number, tecnico_id?: string }): Promise<IServico> {
    const usuario = await getUsuarioAtual();
    try {
        if (!usuario) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        let tecnico_id = usuario.id;
        if (servicoDto.tecnico_id) {
            const tecnico = await prisma.usuario.findUnique({ where: { id: servicoDto.tecnico_id } });
            if (!tecnico) throw new AcaoNaoAutorizada('Técnico não encontrado.');
            if (tecnico.permissao !== 'TEC') throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
            tecnico_id = tecnico.id;
        }
        if (!servicoDto.tecnico_id || servicoDto.tecnico_id === '') {
            const tecnico = await prisma.usuario.findUnique({ where: { id: usuario.id } });
            if (!tecnico) throw new AcaoNaoAutorizada('Técnico não encontrado.');
            if (tecnico.permissao !== 'TEC') throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
            tecnico_id = tecnico.id;
        }
        if (!servicoDto.ordem_id) throw new AcaoNaoAutorizada('Ordem de Serviço não informada.');

        const ordem = await ordemServices.buscarPorId(servicoDto.ordem_id);
        if (!ordem) throw new AcaoNaoAutorizada('Ordem de Serviço não encontrada.');

        const novoServico = await prisma.servico.create({ data: { tecnico_id, ordem_id: servicoDto.ordem_id } });
        await prisma.ordem.update({ where: { id: ordem.id }, data: { status: 2, prioridade: servicoDto.prioridade } });

        const corpo = emailAtualizacaoChamado(
            ordem.solicitante!.nome.split(' ')[0],
            ordem.id,
            'Serviço atribuído ao técnico',
            'DSUP Chamados', `${process.env.URL_BASE_FRONTEND}/chamados/detalhes/${ordem.id}`
        );
        await enviaEmail(`#${ordem.id} Atualização de Chamado`, corpo, [ordem.solicitante!.email]);

        return novoServico as unknown as IServico;
    } catch {
        return undefined as unknown as IServico;
    }
}

async function finalizarServico(id: string): Promise<IServico> {
    const usuario = await getUsuarioAtual();
    try {
        if (!usuario) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        const servico = await prisma.servico.findUnique({ where: { id } });
        if (!servico) throw new AcaoNaoAutorizada('Serviço não encontrado.');
        if (servico.tecnico_id !== usuario.id) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        const suspensaoAtiva = await prisma.suspensao.findFirst({ where: { servico_id: servico.id, status: true } });
        if (suspensaoAtiva) throw new AcaoNaoAutorizada('Serviço possui suspensão ativa.');

        const finalizado = await prisma.servico.update({ where: { id }, data: { status: 2, data_fim: new Date() } });
        const ordem = await prisma.ordem.update({ where: { id: servico.ordem_id }, data: { status: 3 }, include: { solicitante: true } });

        const corpo = emailAtualizacaoChamado(
            ordem.solicitante.nome.split(' ')[0],
            ordem.id,
            'Finalizado. Aguardando avaliação do solicitante',
            'DSUP Chamados', `${process.env.URL_BASE_FRONTEND}/chamados/detalhes/${ordem.id}`
        );
        await enviaEmail(`#${ordem.id} Atualização de Chamado`, corpo, [ordem.solicitante.email]);

        return finalizado as unknown as IServico;
    } catch {
        return undefined as unknown as IServico;
    }
}

async function avaliarServico(id: string, avaliarServicoDto: { status: number, observacao: string }): Promise<IServico> {
    const usuario = await getUsuarioAtual();
    try {
        if (!usuario) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        const servico = await prisma.servico.findUnique({ where: { id } });
        if (!servico) throw new AcaoNaoAutorizada('Serviço não encontrado.');
        const ordem = await prisma.ordem.findUnique({ where: { id: servico.ordem_id } });
        if (!ordem) throw new AcaoNaoAutorizada('Ordem não encontrada.');
        const unidadeUsuario = await prisma.unidade.findFirst({ where: { id: usuario.unidade_id ?? undefined } });
        const validaAtic = unidadeUsuario?.sigla === 'ATIC';
        if (ordem.unidade_id !== usuario.unidade_id && ['USR', 'TEC'].includes(usuario.permissao) && !validaAtic) {
            throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        }
        const avaliado = await prisma.servico.update({
            where: { id },
            data: { ...avaliarServicoDto, avaliado_em: new Date() },
        });
        await prisma.ordem.update({ where: { id: ordem.id }, data: { status: avaliarServicoDto.status === 3 ? 4 : 1 } });
        return avaliado as unknown as IServico;
    } catch {
        return undefined as unknown as IServico;
    }
}

async function atualizar(id: string, updateServicoDto: { descricao: string }): Promise<IServico> {
    const usuario = await getUsuarioAtual();
    try {
        if (!usuario) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        const servico = await prisma.servico.findUnique({ where: { id } });
        if (!servico) throw new AcaoNaoAutorizada('Serviço não encontrado.');
        // Fix: PATCH /servicos/atualizar não checava permissão nenhuma no
        // Nest — qualquer usuário autenticado podia mudar a descrição de
        // qualquer serviço de terceiros. Passa a exigir ser o técnico dono
        // (ou DEV/ADM) e o serviço estar na mesma janela usada em
        // alterar-tecnico (status 1 ou 5 — em andamento ou suspenso).
        const ehDono = servico.tecnico_id === usuario.id;
        if (!ehDono) requerPermissao(usuario, ['DEV', 'ADM']);
        if (servico.status !== 1 && servico.status !== 5) {
            throw new AcaoNaoAutorizada('Não é possível atualizar um serviço já finalizado.');
        }
        const atualizado = await prisma.servico.update({ where: { id }, data: { descricao: updateServicoDto.descricao } });
        return atualizado as unknown as IServico;
    } catch {
        return undefined as unknown as IServico;
    }
}

async function alterarTecnico(id: string, alterarTecnicoDto: { tecnico_id: string }): Promise<IServico> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM']);
        const servico = await prisma.servico.findUnique({ where: { id } });
        if (!servico) throw new AcaoNaoAutorizada('Serviço não encontrado.');
        if (servico.status !== 1 && servico.status !== 5) {
            throw new AcaoNaoAutorizada('Não é possível alterar o técnico de um serviço já finalizado.');
        }
        if (alterarTecnicoDto.tecnico_id === servico.tecnico_id) {
            throw new AcaoNaoAutorizada('O técnico informado já é o responsável por este serviço.');
        }
        const tecnico = await prisma.usuario.findUnique({ where: { id: alterarTecnicoDto.tecnico_id } });
        if (!tecnico) throw new AcaoNaoAutorizada('Técnico não encontrado.');
        if (tecnico.permissao !== 'TEC') throw new AcaoNaoAutorizada('Usuário informado não é um técnico.');
        if (tecnico.status !== 1) throw new AcaoNaoAutorizada('Técnico informado está inativo.');

        const atualizado = await prisma.servico.update({ where: { id }, data: { tecnico_id: alterarTecnicoDto.tecnico_id } });
        await prisma.historicoTecnico.create({
            data: {
                servico_id: id,
                tecnico_anterior_id: servico.tecnico_id,
                tecnico_novo_id: alterarTecnicoDto.tecnico_id,
                alterado_por_id: usuario.id,
            },
        });
        return atualizado as unknown as IServico;
    } catch {
        return undefined as unknown as IServico;
    }
}

async function adicionarSuspensao(id: string, adicionarSuspensaoDto: { motivo: string }): Promise<ISuspensao> {
    const usuario = await getUsuarioAtual();
    try {
        if (!usuario) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        const servico = await prisma.servico.findUnique({ where: { id, tecnico_id: usuario.id } });
        if (!servico) throw new AcaoNaoAutorizada('Serviço não encontrado.');
        const suspensaoAtiva = await prisma.suspensao.findFirst({ where: { servico_id: id, status: true } });
        if (suspensaoAtiva) throw new AcaoNaoAutorizada('Serviço possui suspensão ativa.');

        const suspensao = await prisma.suspensao.create({ data: { servico_id: id, motivo: adicionarSuspensaoDto.motivo } });
        await prisma.servico.update({ where: { id }, data: { status: 5 } });

        const ordem = await prisma.ordem.findUnique({ where: { id: servico.ordem_id }, include: { solicitante: true } });
        const corpo = emailAtualizacaoChamado(
            ordem!.solicitante.nome.split(' ')[0],
            ordem!.id,
            `Serviço suspenso. Motivo: ${adicionarSuspensaoDto.motivo}`,
            'DSUP Chamados', `${process.env.URL_BASE_FRONTEND}/chamados/detalhes/${ordem!.id}`
        );
        await enviaEmail(`#${ordem!.id} Atualização de Chamado`, corpo, [ordem!.solicitante.email]);

        return suspensao as unknown as ISuspensao;
    } catch {
        return undefined as unknown as ISuspensao;
    }
}

async function retomarServico(id: string): Promise<ISuspensao> {
    const usuario = await getUsuarioAtual();
    try {
        if (!usuario) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        const servico = await prisma.servico.findUnique({ where: { id, tecnico_id: usuario.id } });
        if (!servico) throw new AcaoNaoAutorizada('Serviço não encontrado.');
        const suspensaoAtiva = await prisma.suspensao.findFirst({ where: { servico_id: id, status: true } });
        if (!suspensaoAtiva) throw new AcaoNaoAutorizada('Serviço não possui suspensão ativa.');

        const suspensao = await prisma.suspensao.update({ where: { id: suspensaoAtiva.id }, data: { status: false, termino: new Date() } });
        await prisma.servico.update({ where: { id }, data: { status: 1 } });

        const ordem = await prisma.ordem.findUnique({ where: { id: servico.ordem_id }, include: { solicitante: true } });
        const corpo = emailAtualizacaoChamado(
            ordem!.solicitante.nome.split(' ')[0],
            ordem!.id,
            'Serviço retomado após suspensão',
            'DSUP Chamados', `${process.env.URL_BASE_FRONTEND}/chamados/detalhes/${ordem!.id}`
        );
        await enviaEmail(`#${ordem!.id} Atualização de Chamado`, corpo, [ordem!.solicitante.email]);

        return suspensao as unknown as ISuspensao;
    } catch {
        return undefined as unknown as ISuspensao;
    }
}

async function adicionarMaterial(servico_id: string, adicionarMaterialDto: { nome: string, quantidade: number, medida: string }): Promise<IMaterial> {
    const usuario = await getUsuarioAtual();
    try {
        if (!usuario) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        const servico = await prisma.servico.findUnique({ where: { id: servico_id } });
        if (!servico) throw new AcaoNaoAutorizada('Serviço não encontrado.');
        if (servico.tecnico_id !== usuario.id) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        const material = await prisma.material.create({ data: { ...adicionarMaterialDto, servico_id } });
        return material;
    } catch {
        return undefined as unknown as IMaterial;
    }
}

async function removerMaterial(material_id: string): Promise<{ status: boolean }> {
    const usuario = await getUsuarioAtual();
    try {
        if (!usuario) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        const material = await prisma.material.findUnique({ where: { id: material_id }, include: { servico: true } });
        if (!material) throw new AcaoNaoAutorizada('Material não encontrado.');
        if (material.servico.tecnico_id !== usuario.id) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        await prisma.material.delete({ where: { id: material_id } });
        return { status: true };
    } catch {
        return undefined as unknown as { status: boolean };
    }
}

export {
    atualizar,
    adicionarSuspensao,
    adicionarMaterial,
    alterarTecnico,
    criar,
    finalizarServico,
    avaliarServico,
    retomarServico,
    removerMaterial
};
