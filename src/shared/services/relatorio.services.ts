'use server'

import { authOptions } from "@/shared/auth/authOptions";
import { getServerSession } from "next-auth";
import { signOut } from "next-auth/react";

async function Logout() {
    await signOut({ redirect: false });
    window.location.href = '/login';
}

const baseURL = process.env.API_URL || 'http://localhost:3000/';

export interface IChamadoPeriodoAno {
    '#': string;
    Prioridade: string;
    Tipo: string;
    Status: string;
    Unidade: string;
    Solicitante: string;
    'Técnico Responsável': string;
    'Data de Abertura': string;
    'Data de Encerramento': string;
}

async function listarChamadosPeriodoAno(ano_inicio: number = 2024, ano_fim: number = 2024): Promise<IChamadoPeriodoAno[]> {
    const session = await getServerSession(authOptions);
    const relatorio = await fetch(`${baseURL}relatorios/listar-chamados-periodo-ano/${ano_inicio}/${ano_fim}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
        }
    }).then((response) => {
        if (response.status === 401) Logout();
        return response.json();
    })
    return relatorio;
}

export { 
    listarChamadosPeriodoAno,
};
