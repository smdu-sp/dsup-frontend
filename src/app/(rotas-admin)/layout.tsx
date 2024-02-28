'use client'

import * as usuarioServices from '@/shared/services/usuario.services';
import { IUsuario } from "@/shared/services/usuario.services";
import { useRouter } from 'next/navigation';
import { useEffect } from "react";

export default function RotasAdmin({children}:{children: React.ReactNode}) {
  const router = useRouter();
  useEffect(() => {
    usuarioServices.validaUsuario()
      .then((usuario: IUsuario) => {
        if (!usuario || !['ADM', 'DEV'].includes(usuario.permissao)) {
          router.replace('/');
        }
      });
  }, [])
  return <>{children}</>;
}