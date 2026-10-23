'use server'

import { $Enums } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { prismaSgu } from "@/shared/lib/prisma-sgu";
import { getUsuarioAtual } from "@/shared/lib/getUsuarioAtual";
import { requerPermissao, AcaoNaoAutorizada } from "@/shared/lib/permissao";
import { verificaPagina, verificaLimite } from "@/shared/lib/paginacao";
import { IUnidade } from "./unidade.services";

export interface IUsuario {
    id: string;
    nome: string;
    email: string;
    login: string;
    permissao: string;
    status: number;
    unidade_id: string;
    unidade?: IUnidade;
    ultimoLogin: Date;
    criadoEm: Date;
    atualizadoEm: Date;
}

export interface ICreateUsuario {
    nome: string;
    email: string;
    login: string;
    permissao: string;
    unidade_id?: string;
}

export interface IUpdateUsuario {
    id?: string;
    permissao?: string;
    status?: number;
    unidade_id?: string;
}

export interface IPaginadoUsuario {
    data: IUsuario[];
    total: number;
    pagina: number;
    limite: number;
}

// Mesma regra de rebaixamento de permissão do Nest (UsuariosService.validaPermissaoCriador).
function validaPermissaoCriador(permissao: $Enums.Permissao, permissaoCriador: $Enums.Permissao): $Enums.Permissao {
    if (permissao === $Enums.Permissao.DEV && permissaoCriador === $Enums.Permissao.ADM) {
        permissao = $Enums.Permissao.ADM;
    }
    if (
        (permissao === $Enums.Permissao.DEV || permissao === $Enums.Permissao.ADM) &&
        permissaoCriador === $Enums.Permissao.TEC
    ) {
        permissao = $Enums.Permissao.TEC;
    }
    return permissao;
}

async function listaCompleta(): Promise<IUsuario[]> {
    const usuario = await getUsuarioAtual();
    try {
        requerPermissao(usuario, ['ADM', 'TEC']);
        const lista = await prisma.usuario.findMany({
            orderBy: { nome: 'asc' },
            include: { unidade: true },
        });
        return lista as unknown as IUsuario[];
    } catch {
        return [];
    }
}

// Assinaturas de retorno abaixo mantêm os mesmos tipos "não-undefined" do
// fetch original — na prática já podiam devolver undefined/objeto vazio em
// erro (o .then() do fetch só não deixava o TypeScript enxergar isso
// através do JSON.parse). As páginas que chamam essas funções já fazem
// checagem de truthy, não de tipo.
async function buscarTudo(status: number = 1, pagina: number = 1, limite: number = 10, busca: string = '', permissao: string = '', unidade_id: string = ''): Promise<IPaginadoUsuario> {
    const usuarioAtual = await getUsuarioAtual();
    try {
        requerPermissao(usuarioAtual, ['ADM']);
        [pagina, limite] = verificaPagina(pagina, limite);
        const searchParams = {
            ...(busca && { OR: [
                { nome: { contains: busca } },
                { login: { contains: busca } },
                { email: { contains: busca } },
            ]}),
            ...(unidade_id !== '' && { unidade_id }),
            ...(permissao !== '' && { permissao: $Enums.Permissao[permissao as keyof typeof $Enums.Permissao] }),
            // Fix: status vindo faltando/NaN não é mais tratado como filtro
            // válido (antes gerava um 500 no Nest — bug de caracterização).
            ...(usuarioAtual.permissao !== 'DEV'
                ? { status: 1 }
                : (Number.isFinite(status) && status !== 4 ? { status } : {})),
        };
        const total = await prisma.usuario.count({ where: searchParams });
        if (total === 0) return { total: 0, pagina: 0, limite: 0 } as unknown as IPaginadoUsuario;
        [pagina, limite] = verificaLimite(pagina, limite, total);
        const usuarios = await prisma.usuario.findMany({
            where: searchParams,
            orderBy: { nome: 'asc' },
            include: { unidade: true },
            skip: (pagina - 1) * limite,
            take: limite,
        });
        return { total, pagina, limite, data: usuarios as unknown as IUsuario[] };
    } catch {
        return { total: 0, pagina: 0, limite: 0 } as unknown as IPaginadoUsuario;
    }
}

async function buscarPorId(id: string): Promise<IUsuario> {
    const usuarioAtual = await getUsuarioAtual();
    try {
        requerPermissao(usuarioAtual, ['ADM']);
        const usuario = await prisma.usuario.findUnique({ where: { id } });
        return usuario as unknown as IUsuario;
    } catch {
        return undefined as unknown as IUsuario;
    }
}

async function autorizar(id: string): Promise<{ autorizado: boolean }> {
    const usuarioAtual = await getUsuarioAtual();
    try {
        requerPermissao(usuarioAtual, ['ADM']);
        const autorizado = await prisma.usuario.update({ where: { id }, data: { status: 1 } });
        if (autorizado && autorizado.status === 1) return { autorizado: true };
        return undefined as unknown as { autorizado: boolean };
    } catch {
        return undefined as unknown as { autorizado: boolean };
    }
}

async function criar(data: ICreateUsuario): Promise<IUsuario> {
    const criador = await getUsuarioAtual();
    try {
        // Fix: era @Permissoes('SUP', 'ADM') no Nest — 'SUP' não existe no
        // enum Permissao, então na prática já só ADM (e DEV, sempre livre)
        // passavam. Removida a referência morta.
        requerPermissao(criador, ['ADM']);

        if (await prisma.usuario.findUnique({ where: { login: data.login } })) {
            throw new AcaoNaoAutorizada('Login já cadastrado.');
        }
        if (await prisma.usuario.findUnique({ where: { email: data.email } })) {
            throw new AcaoNaoAutorizada('Email já cadastrado.');
        }

        let permissao = data.permissao as $Enums.Permissao;
        if (criador.permissao !== 'DEV') {
            permissao = validaPermissaoCriador(permissao, criador.permissao as $Enums.Permissao);
        }

        let unidade_id = data.unidade_id;
        if (!unidade_id) {
            const usuario_sgu = await prismaSgu.tblUsuarios.findFirst({
                where: { cpRF: { startsWith: data.login.substring(1) } },
            });
            if (usuario_sgu) {
                const unidade = await prisma.unidade.findUnique({ where: { codigo: usuario_sgu.cpUnid as string } });
                unidade_id = unidade ? unidade.id : '';
            }
        }

        const usuario = await prisma.usuario.create({
            data: {
                nome: data.nome,
                login: data.login,
                email: data.email,
                permissao,
                ...(unidade_id ? { unidade_id } : {}),
            },
        });
        return usuario as unknown as IUsuario;
    } catch {
        return undefined as unknown as IUsuario;
    }
}

async function atualizar(id: string, data: IUpdateUsuario): Promise<IUsuario> {
    const usuarioLogado = await getUsuarioAtual();
    try {
        if (!usuarioLogado) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        if (['TEC', 'USR'].includes(usuarioLogado.permissao) && id !== usuarioLogado.id) {
            throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
        }
        const atualizacao: { permissao?: $Enums.Permissao; status?: number; unidade_id?: string } = {
            ...(data.status !== undefined && { status: data.status }),
            ...(data.unidade_id !== undefined && { unidade_id: data.unidade_id }),
        };
        if (data.permissao) {
            atualizacao.permissao = validaPermissaoCriador(data.permissao as $Enums.Permissao, usuarioLogado.permissao as $Enums.Permissao);
        }
        const usuarioAtualizado = await prisma.usuario.update({ where: { id }, data: atualizacao });
        return usuarioAtualizado as unknown as IUsuario;
    } catch {
        return undefined as unknown as IUsuario;
    }
}

async function desativar(id: string): Promise<{ desativado: boolean }> {
    const usuarioAtual = await getUsuarioAtual();
    try {
        requerPermissao(usuarioAtual, ['ADM']);
        await prisma.usuario.update({ where: { id }, data: { status: 2 } });
        return { desativado: true };
    } catch {
        return undefined as unknown as { desativado: boolean };
    }
}

async function validaUsuario(): Promise<IUsuario> {
    // Não reproduz a chamada quebrada de signOut()/window a partir de um
    // contexto de servidor que existia no Logout() original — quem trata a
    // sessão inválida/usuário inativo é o layout que chama esta função,
    // checando o retorno falsy (undefined aqui no lugar do corpo de erro
    // truthy que o Nest devolvia — ver observação na conversa).
    const usuario = await getUsuarioAtual();
    if (!usuario) return undefined as unknown as IUsuario;
    if (usuario.status !== 1) return undefined as unknown as IUsuario;
    const unidade = usuario.unidade_id
        ? await prisma.unidade.findUnique({ where: { id: usuario.unidade_id } })
        : null;
    return { ...usuario, unidade } as unknown as IUsuario;
}

async function buscarNovo(login: string): Promise<{ id?: string, login?: string, nome?: string, email?: string, unidade_id?: string, message?: string }> {
    const usuarioAtual = await getUsuarioAtual();
    try {
        requerPermissao(usuarioAtual, ['ADM']);

        const usuarioExiste = await prisma.usuario.findUnique({ where: { login } });
        if (usuarioExiste && usuarioExiste.status === 1) {
            return { message: 'Usuário já cadastrado.' };
        }
        if (usuarioExiste && usuarioExiste.status !== 1) {
            const usuarioReativado = await prisma.usuario.update({ where: { id: usuarioExiste.id }, data: { status: 1 } });
            return usuarioReativado as unknown as IUsuario;
        }

        const rf = login.substring(1);
        const usuario_sgu = await prismaSgu.tblUsuarios.findFirst({ where: { cpRF: { startsWith: rf } } });
        let unidade_id = '';
        if (usuario_sgu) {
            const unidade = await prisma.unidade.findUnique({ where: { codigo: usuario_sgu.cpUnid as string } });
            unidade_id = unidade ? unidade.id : '';
        }

        const ldap_fetch = await fetch(`${process.env.SMUL_AUTH_URL}ldap/buscar-por-login/${login}`);
        // Objeto vazio (não undefined): todos os campos do retorno são
        // opcionais e o caller acessa .message/.id/.email direto sem
        // checar se o objeto inteiro existe.
        if (ldap_fetch.status !== 200) return {};
        const usuario_ldap = await ldap_fetch.json();

        if (unidade_id !== '') {
            return { login, nome: usuario_ldap.nome, email: usuario_ldap.email, unidade_id };
        }
        return { login, nome: usuario_ldap.nome, email: usuario_ldap.email };
    } catch {
        return {};
    }
}

export {
    atualizar,
    autorizar,
    buscarNovo,
    buscarPorId,
    buscarTudo,
    criar,
    desativar,
    listaCompleta,
    validaUsuario
};
