'use server'

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Session, getServerSession } from "next-auth";
import { signOut } from "next-auth/react";
import { redirect } from "next/navigation";

export interface IUsuario {
    id: string;
    nome: string;
    email: string;
    login: string;
    permissao: string;
    status: number;
    ultimoLogin: Date;
    criadoEm: Date;
    atualizadoEm: Date;
}

export interface IPaginadoUsuario {
    data: IUsuario[];
    total: number;
    pagina: number;
    limite: number;
}

const baseURL = process.env.API_URL || 'http://localhost:3000/';

async function buscarTudo(status: number = 1, pagina: number = 1, limite: number = 10, busca: string = ''): Promise<IPaginadoUsuario> {
    const session = await getServerSession(authOptions);
    const usuarios = await fetch(`${baseURL}usuario/buscar-tudo?status=${status}&pagina=${pagina}&limite=${limite}&busca=${busca}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        }
    }).then((response) => {
        if (response.status === 401) signOut();
        return response.json();
    })
    return usuarios;
}

async function buscarPorId(id: string): Promise<IUsuario> {
    const session = await getServerSession(authOptions);
    const usuario = await fetch(`${baseURL}usuario/buscar-por-id/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        }
    }).then((response) => {
        if (response.status === 401) signOut();
        return response.json();
    })
    return usuario;
}

async function autorizar(id: string): Promise<{ autorizado: boolean }> {
    const session = await getServerSession(authOptions);
    const autorizado = await fetch(`${baseURL}usuario/autorizar/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        }
    }).then((response) => {
        if (response.status === 401) signOut();
        if (response.status !== 200) return;
        return response.json();
    })
    return autorizado;
}

async function desativar(id: string): Promise<{ autorizado: boolean }> {
    const session = await getServerSession(authOptions);
    const desativado = await fetch(`${baseURL}usuario/desativar/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        }
    }).then((response) => {
        if (response.status === 401) signOut();
        if (response.status !== 200) return;
        return response.json();
    });
    return desativado;
}

async function validaUsuario(): Promise<IUsuario> {
    const session = await getServerSession(authOptions);
    const usuario = await fetch(`${baseURL}usuario/valida-usuario`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        }
    }).then((response) => {
        if (response.status === 401) signOut();
        return response.json();
    })
    return usuario;
}

export { 
    buscarTudo,
    buscarPorId,
    autorizar,
    desativar,
    validaUsuario
};
