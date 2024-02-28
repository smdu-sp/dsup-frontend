'use server'

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { IUnidade } from "./unidade.services";
import { IUsuario } from "./usuario.services";

async function logout() {
    const router = useRouter();
    await signOut({ redirect: false });
    router.replace('/login');
}

export interface IOrdem {
    id: string;
    unidade_id: string;
    unidade?: IUnidade;
    andar: number;
    sala: string;
    solicitante_id: string;
    solicitante?: IUsuario;
    data_solicitacao: Date;
    tipo: number;
    status: number;
    observacoes: string;
}

export interface IPaginadoOrdem {
    data: IOrdem[];
    total: number;
    pagina: number;
    limite: number;
}

const baseURL = process.env.API_URL || 'http://localhost:3000/';

async function buscarTudo(status: number = 1, pagina: number = 1, limite: number = 10,
    unidade_id: string = '',
    solicitante_id: string = '',
    andar: number = 0,
    sala: string = '',
    tipo: number = 0
): Promise<IPaginadoOrdem> {
    const session = await getServerSession(authOptions);
    const url = `${baseURL}ordens/buscar-tudo?status=${status}&pagina=${pagina}&limite=${limite}&unidade_id=${unidade_id}&solicitante_id=${solicitante_id}&andar=${andar}&sala=${sala}&tipo=${tipo}`;
    const ordens = await fetch(`${url}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        }
    }).then(async (response) => {
        if (response.status === 401) await logout();
        return response.json();
    })
    return ordens;
}

async function buscarPorId(id: string): Promise<IOrdem> {
    const session = await getServerSession(authOptions);
    const usuario = await fetch(`${baseURL}ordens/buscar-por-id/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        }
    }).then(async (response) => {
        if (response.status === 401) await logout();
        return response.json();
    })
    return usuario;
}

async function criar(ordemDto: { unidade_id: string, andar: number, sala: string, tipo: number, observacoes: string }): Promise<IOrdem> {
    const session = await getServerSession(authOptions);
    const novaUnidade = await fetch(`${baseURL}ordens/criar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(ordemDto)
    }).then(async (response) => {
        if (response.status === 401) await logout();
        if (response.status !== 201) return;
        return response.json();
    });
    return novaUnidade;
}

export {
    buscarTudo,
    buscarPorId,
    criar
};