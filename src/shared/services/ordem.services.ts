'use server'

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Session, getServerSession } from "next-auth";
import { signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import router from "next/router";

async function logout() {
  await signOut({ redirect: false });
  router.replace('/login');
}

export interface IUnidade {
    id: string;
    nome: string;
    sigla: string;
    codigo: string;
    status: boolean;
}

export interface IPaginadoUnidade {
    data: IUnidade[];
    total: number;
    pagina: number;
    limite: number;
}

const baseURL = process.env.API_URL || 'http://localhost:3000/';

async function buscarTudo(status: string = 'true', pagina: number = 1, limite: number = 10, busca: string = ''): Promise<IPaginadoUnidade> {
    const session = await getServerSession(authOptions);
    const usuarios = await fetch(`${baseURL}ordens/buscar-tudo?status=${status}&pagina=${pagina}&limite=${limite}&busca=${busca}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        }
    }).then(async (response) => {
        if (response.status === 401) await logout();
        return response.json();
    })
    return usuarios;
}

async function buscarPorId(id: string): Promise<IUnidade> {
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

async function desativar(id: string): Promise<{ autorizado: boolean }> {
    const session = await getServerSession(authOptions);
    const desativado = await fetch(`${baseURL}ordens/desativar/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        }
    }).then(async (response) => {
        if (response.status === 401) await logout();
        if (response.status !== 200) return;
        return response.json();
    });
    return desativado;
}

async function criar({ nome, codigo, sigla, status }: { nome: string, codigo: string, sigla: string, status: string }): Promise<IUnidade> {
    const session = await getServerSession(authOptions);
    const novaUnidade = await fetch(`${baseURL}ordens/criar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
            nome,
            sigla,
            codigo,
            status: status === 'true'
        })
    }).then(async (response) => {
        if (response.status === 401) await logout();
        if (response.status !== 201) return;
        return response.json();
    });
    return novaUnidade;
}

async function atualizar({ id, nome, codigo, sigla, status }: { id: string, nome: string, codigo: string, sigla: string, status: string }): Promise<IUnidade> {
    const session = await getServerSession(authOptions);
    const atualizado = await fetch(`${baseURL}ordens/atualizar/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
            nome,
            sigla,
            codigo,
            status: status === 'true'
        })
    }).then(async (response) => {
        if (response.status === 401) await logout();
        if (response.status !== 200) return;
        return response.json();
    });
    return atualizado;
}

async function ativar(id: string): Promise<IUnidade> {
    const session = await getServerSession(authOptions);
    const ativado = await fetch(`${baseURL}ordens/atualizar/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status: true })
    }).then(async (response) => {
        if (response.status === 401) await logout();
        if (response.status !== 200) return;
        return response.json();
    });
    return ativado;
}

async function validaUsuario(): Promise<IUnidade> {
    const session = await getServerSession(authOptions);
    const usuario = await fetch(`${baseURL}ordens/valida-usuario`, {
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

export { 
    ativar,
    atualizar,
    buscarTudo,
    buscarPorId,
    criar,
    desativar
};
