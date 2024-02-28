'use client'

import * as usuarioServices from '@/shared/services/usuario.services';
import { IUsuario } from "@/shared/services/usuario.services";
import { signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useEffect } from "react";

export default function RotasAuth({children}:{children: React.ReactNode}) {
  const router = useRouter();
  useEffect(() => {
    usuarioServices.validaUsuario()
      .then((usuario: IUsuario) => {
        if (!usuario || usuario.status !== 1) {
          signOut({ redirect: false }).then(() => router.replace('/login'));
        }
      });
  }, [])
  return <>{children}</>;
}