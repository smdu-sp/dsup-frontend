'use server'

import { authOptions } from "@/shared/auth/authOptions";
import { getServerSession } from "next-auth";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { IUsuario } from "./usuario.services";
import { IOrdem } from "./ordem.services";

async function Logout() {
    const router = useRouter();
    await signOut({ redirect: false });
    router.replace('/login');
}

export interface IServico {
    id: string;
    ordem_id: string;
    ordem?: IOrdem;
    tecnico_id: string;
    tecnico?: IUsuario;
    data_inicio: Date;
    concluido_em?: Date;
    status: number;
    observacao?: string;
}

export interface IPaginadoServico {
    data: IServico[];
    total: number;
    pagina: number;
    limite: number;
}

const baseURL = process.env.API_URL || 'http://localhost:3000/';

async function criar(ordemDto: { ordem_id: string, tecnico_id?: string }): Promise<IServico> {
    const session = await getServerSession(authOptions);
    const novoServico = await fetch(`${baseURL}servicos/criar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(ordemDto)
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

async function avaliarServico(id: string, status: number, observacao?: string): Promise<IServico> {
    const session = await getServerSession(authOptions);
    const servicoAvaliado = await fetch(`${baseURL}servicos/avaliar-servico/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
            body: JSON.stringify({ status, observacao })            
        },
    }).then(async (response) => {
        if (response.status === 401) await Logout();
        if (response.status !== 200) return;
        return response.json();
    });
    return servicoAvaliado;
    
}

export {
    criar,
    finalizarServico,
    avaliarServico
};