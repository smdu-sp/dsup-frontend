'use server'

import { authOptions } from "@/shared/auth/authOptions";
import { getServerSession } from "next-auth";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { IUsuario } from "./usuario.services";
import { IOrdem } from "./ordem.services";

async function Logout() {
    await signOut({ redirect: false });
    window.location.href = '/login';
}

export interface IServico {
    id: string;
    ordem_id: string;
    descricao?: string;
    ordem?: IOrdem;
    tecnico_id: string;
    tecnico?: IUsuario;
    suspensoes?: ISuspensao[];
    materiais?: IMaterial[];
    data_inicio: Date;
    data_fim?: Date;
    avaliado_em?: Date;
    status: number;
    observacao?: string;
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

const baseURL = process.env.API_URL || 'http://localhost:3000/';

async function criar(servicoDto: { ordem_id: string, prioridade: number, tecnico_id?: string }): Promise<IServico> {
    const session = await getServerSession(authOptions);
    const novoServico = await fetch(`${baseURL}servicos/criar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(servicoDto)
    }).then(async (response) => {
        if (response.status === 401) await Logout();
        if (response.status !== 201) return;
        return response.json();
    });
    return novoServico;
}

async function finalizarServico(id: string): Promise<IServico> {
    const session = await getServerSession(authOptions);
    const servicoFinalizado = await fetch(`${baseURL}servicos/finalizar-servico/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        },
    }).then(async (response) => {
        if (response.status === 401) await Logout();
        if (response.status !== 200) return;
        return response.json();
    });
    return servicoFinalizado;
    
}

async function avaliarServico(id: string, avaliarServicoDto: {status: number, observacao: string} ): Promise<IServico> {
    const session = await getServerSession(authOptions);
    const servicoAvaliado = await fetch(`${baseURL}servicos/avaliar-servico/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(avaliarServicoDto)
    }).then(async (response) => {
        if (response.status === 401) await Logout();
        if (response.status !== 200) return;
        return response.json();
    });
    return servicoAvaliado; 
}

async function atualizar(id: string, updateServicoDto: { descricao: string } ): Promise<IServico> {
    const session = await getServerSession(authOptions);
    const servicoAtualizado = await fetch(`${baseURL}servicos/atualizar/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(updateServicoDto)
    }).then(async (response) => {
        if (response.status === 401) await Logout();
        if (response.status !== 200) return;
        return response.json();
    });
    return servicoAtualizado; 
}

async function adicionarSuspensao(id: string, adicionarSuspensaoDto: { motivo: string }): Promise<ISuspensao> {
    const session = await getServerSession(authOptions);
    const suspensao = await fetch(`${baseURL}servicos/adicionar-suspensao/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(adicionarSuspensaoDto)
    }).then(async (response) => {
        if (response.status === 401) await Logout();
        if (response.status !== 200) return;
        return response.json();
    });
    return suspensao; 
}

async function retomarServico(id: string): Promise<ISuspensao> {
    const session = await getServerSession(authOptions);
    const suspensao = await fetch(`${baseURL}servicos/retomar-servico/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
        }
    }).then(async (response) => {
        if (response.status === 401) await Logout();
        if (response.status !== 200) return;
        return response.json();
    });
    return suspensao; 
}

async function adicionarMaterial(servico_id: string, adicionarMaterialDto: { nome: string, quantidade: number, medida: string }): Promise<IMaterial> {
    const session = await getServerSession(authOptions);
    const novoMaterial = await fetch(`${baseURL}servicos/adicionar-material/${servico_id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(adicionarMaterialDto)
    }).then(async (response) => {
        if (response.status === 401) await Logout();
        if (response.status !== 201) return;
        return response.json();
    });
    return novoMaterial;
}

async function removerMaterial(material_id: string): Promise<{ status: boolean }> {
    const session = await getServerSession(authOptions);
    const novoMaterial = await fetch(`${baseURL}servicos/remover-material/${material_id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        },
    }).then(async (response) => {
        if (response.status === 401) await Logout();
        if (response.status !== 201) return;
        return response.json();
    });
    return novoMaterial;
}

export {
    atualizar,
    adicionarSuspensao,
    adicionarMaterial,
    criar,
    finalizarServico,
    avaliarServico,
    retomarServico,
    removerMaterial
};
