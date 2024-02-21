'use client'

import Content from "@/components/Content";
import { IUsuario } from "@/shared/services/usuario.services";
import { useEffect, useState } from "react";
import * as usuarioServices from "@/shared/services/usuario.services";
import { Box, Button, Card, CardActions, CardOverflow, Chip, ChipPropsColorOverrides, ColorPaletteProp, Divider, FormControl, FormLabel, Input, Option, Select, Stack } from "@mui/joy";
import { EmailRounded } from "@mui/icons-material";
import { useRouter } from 'next/navigation';
import { OverridableStringUnion } from '@mui/types';

export default function UsuarioDetalhes(props: any) {
    const [usuario, setUsuario] = useState<IUsuario>();
    const { id } = props.params;
    const router = useRouter();
    const [permissao, setPermissao] = useState('');

    const permissoes: Record<string, { label: string, value: string, color: OverridableStringUnion<ColorPaletteProp, ChipPropsColorOverrides> | undefined }> = {
      'DEV': { label: 'Desenvolvedor', value: 'DEV', color: 'primary' },
      'SUP': { label: 'Superusuario', value: 'SUP', color: 'neutral' },
      'ADM': { label: 'Administrador', value: 'ADM', color: 'success' },
      'USR': { label: 'Usuário', value: 'USR', color: 'warning' },
    }

    useEffect(() => {
        if (id) {
            usuarioServices.buscarPorId(id)
                .then((response: IUsuario) => {
                    setUsuario(response);
                    setPermissao(response.permissao);
                });
        } else {
            router.push('/usuarios');
        }
    }, [ id ]);

    return (
        <Content
            breadcrumbs={[
                { label: 'Usuários', href: '/usuarios' },
                { label: usuario ? usuario.nome : 'Novo', href: '/usuarios/' + id },
            ]}
            titulo={id ? usuario?.nome : 'Novo'}
            tags={
                usuario ? <div style={{ display: 'flex', gap: '0.2rem' }}>     
                  <Chip color={permissoes[usuario?.permissao].color} size='lg'>{permissoes[usuario?.permissao].label}</Chip>
                </div> : null
            }
            pagina="usuarios"
        >
            <Box
                sx={{
                    display: 'flex',
                    mx: 'auto',
                    width: '90%',
                    maxWidth: 800,
                    px: { xs: 2, md: 6 },
                    py: { xs: 2, md: 3 },
                }}
            >
                <Card sx={{ width: '100%' }}>
                    <Stack spacing={2} >
                        <Stack>
                            <FormControl>
                                <FormLabel>Permissao</FormLabel>
                                <Select value={permissao ? permissao : 'USR'} onChange={(_, value) => value && setPermissao(value)}>
                                    <Option value="DEV">Desenvolvedor</Option>
                                    <Option value="SUP">Superusuário</Option>
                                    <Option value="ADM">Administrador</Option>
                                    <Option value="USR">Usuário</Option>
                                </Select>
                            </FormControl>
                        </Stack>
                        <Divider />
                        <Stack direction="row" spacing={2}>
                            <FormControl sx={{ flexGrow: 1 }}>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    value={usuario ? usuario?.email : 'USR'}
                                    size="sm"
                                    type="email"
                                    startDecorator={<EmailRounded />}
                                    placeholder="Email"
                                    sx={{ flexGrow: 1 }}
                                    readOnly
                                />
                            </FormControl>
                        </Stack>
                    </Stack>
                    <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                        <CardActions sx={{ alignSelf: 'flex-end', pt: 2 }}>
                        <Button size="sm" variant="outlined" color="neutral" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button size="sm" variant="solid">
                            Salvar
                        </Button>
                        </CardActions>
                    </CardOverflow>
                </Card>
            </Box>            
        </Content>
    );
}
