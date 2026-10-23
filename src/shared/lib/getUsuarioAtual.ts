import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth/authOptions";
import { prisma } from "./prisma";
import { Usuario } from "@prisma/client";

// Equivalente ao JwtStrategy.validate() do Nest: a sessão só carrega o id do
// usuário, o dado atual (permissao, status, etc.) é sempre buscado fresco no
// banco a cada chamada. Não checa status !== 1 aqui — isso é feito
// separadamente por validaUsuario() (mesma separação que existia entre a
// validação do JWT e o endpoint /usuarios/valida-usuario no Nest).
export async function getUsuarioAtual(): Promise<Usuario | null> {
  const session = await getServerSession(authOptions);
  if (!session?.usuario?.id) return null;
  return prisma.usuario.findUnique({ where: { id: session.usuario.id } });
}
