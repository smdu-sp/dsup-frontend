'use server'

import { authOptions } from "@/shared/auth/authOptions";
import { getServerSession } from "next-auth";
import { signOut } from "next-auth/react";

async function Logout() {
    await signOut({ redirect: false });
    window.location.href = '/login';
}

const baseURL = process.env.API_URL || 'http://localhost:3000/';

async function listarChamadosPeriodoAno(ano_inicio: number = 2024, ano_fim: number = 2024) {
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
