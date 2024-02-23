import { UsuarioToken } from "@/shared/interfaces/usuario-token";
import { Box, Card, CardContent, Chip, ChipPropsColorOverrides, ColorPaletteProp, Skeleton, Typography } from "@mui/joy";
import { getSession } from "next-auth/react";
import { OverridableStringUnion } from '@mui/types';
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Usuario() {
    const router = useRouter();
    const pathname = usePathname();
    const permissoes: Record<string, { label: string, value: string, color: OverridableStringUnion<ColorPaletteProp, ChipPropsColorOverrides> | undefined }> = {
      'DEV': { label: 'Desenvolvedor', value: 'DEV', color: 'primary' },
      'TEC': { label: 'Técnico', value: 'TEC', color: 'neutral' },
      'ADM': { label: 'Administrador', value: 'ADM', color: 'success' },
      'USR': { label: 'Usuário', value: 'USR', color: 'warning' },
    }

    useEffect(() => {
      console.log(pathname);
      getSession().catch((error) => console.log(error)).then((session) => {
        if (session) setUsuario(session.usuario);
      });    
    }, []);
    const [usuario, setUsuario] = useState<UsuarioToken>();
    
    function verificaNome (nome: string) {
        const nomes = nome.split(' ');
        if (nomes.length > 2) {
            return nomes[0] + ' ' + nomes[nomes.length - 1];
        }
        return nome;
    }
    return (usuario ?
    <Card sx={{ maxWidth: 250, ":hover": { opacity: '60%' }, cursor: 'pointer' }} variant={pathname === '/eu' ? 'soft' : undefined} onClick={() => {router.push('/eu')}}>
        <CardContent sx={{ alignItems: 'center', textAlign: 'center' }}>
            <Typography
                level="title-lg"
                title={usuario.nome}
                sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >{verificaNome(usuario.nome)}</Typography>
            <Typography level="body-xs">{usuario.email}</Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>     
                <Chip color={permissoes[usuario.permissao].color} size='sm'>{permissoes[usuario.permissao].label}</Chip>
            </Box>
        </CardContent>
      </Card>
    : <Card sx={{ maxWidth: 250 }}>
        <CardContent sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Typography
            level="title-lg"
            title="Nome do Usuário"
            sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            <Skeleton>
              Nome do Usuário
            </Skeleton>
          </Typography>
          <Typography level="body-xs">
            <Skeleton>
              emailusuario@prefeitura.sp.gov.br
            </Skeleton>
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Typography level="body-xs">
              <Skeleton>
                Permissao
              </Skeleton>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
}