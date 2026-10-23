import { Usuario } from "@prisma/client";

// Erro esperado (regra de negócio) — as funções de service capturam isso e
// devolvem undefined/uma resposta de erro, igual ao antigo `if (response.status
// !== 200) return;` do lado do fetch.
export class AcaoNaoAutorizada extends Error {}

// Equivalente a RoleGuard.verificaPermissoes: DEV sempre passa; os demais
// precisam estar na lista de papéis informada. É uma assertion function:
// depois de chamada sem lançar, o TypeScript já sabe que `usuario` não é
// null no resto do escopo.
export function requerPermissao(usuario: Usuario | null, roles: string[]): asserts usuario is Usuario {
  if (!usuario) throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
  if (usuario.permissao === 'DEV') return;
  if (!roles.includes(usuario.permissao)) {
    throw new AcaoNaoAutorizada('Operação não autorizada para este usuário.');
  }
}
