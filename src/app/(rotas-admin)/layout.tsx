import { authOptions } from "@/shared/auth/authOptions";
import { validaUsuario } from "@/shared/services/usuario.services";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function RotasAdmin({children}:{children: React.ReactNode}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const usuario = await validaUsuario();
  // signOut() do next-auth/react só funciona client-side; chamado aqui
  // (Server Component) sempre lançava ReferenceError: window is not
  // defined, e o redirect abaixo nunca era alcançado. O redirect sozinho já
  // barra o acesso; o cookie de sessão inválido é sobrescrito no próximo
  // login bem-sucedido.
  if (!usuario) redirect('/login');
  if (!['DEV', 'ADM'].includes(usuario.permissao)) redirect('/chamados');
  return <>{children}</>;
}