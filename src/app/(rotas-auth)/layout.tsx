import { authOptions } from "@/shared/auth/authOptions";
import { validaUsuario } from "@/shared/services/usuario.services";
import { getServerSession } from "next-auth";
import { signOut } from "next-auth/react";
import { redirect } from "next/navigation";

export default async function RotasAuth({children}:{children: React.ReactNode}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const usuario = await validaUsuario();
  if (!usuario) {
    await signOut({ redirect: false });
    redirect('/login');
  }
  return <>{children}</>;
}