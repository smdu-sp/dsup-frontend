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
    const novaUnidade = await fetch(`${baseURL}servicos/criar`, {
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
    return novaUnidade;
}

export {
    criar
};
