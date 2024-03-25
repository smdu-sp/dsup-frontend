'use client'

import { useContext, useEffect, useState } from "react";
import { Autocomplete, AutocompleteOption, Box, Button, Card, CardActions, CardOverflow, Chip, ChipPropsColorOverrides, ColorPaletteProp, Divider, FormControl, FormLabel, Input, Option, Select, Stack } from "@mui/joy";
import { Business, Check, EmailRounded } from "@mui/icons-material";
import { useRouter } from 'next/navigation';
import { OverridableStringUnion } from '@mui/types';

import Content from "@/components/Content";
import { IUnidade } from "@/shared/services/unidade.services";
import { IUsuario } from "@/shared/services/usuario.services";
import * as usuarioServices from "@/shared/services/usuario.services";
import * as unidadeServices from "@/shared/services/unidade.services";
import { AlertsContext } from "@/providers/alertsProvider";

export default function UsuarioDetalhes() {
    const [usuario, setUsuario] = useState<IUsuario>();
    const [permissao, setPermissao] = useState('');
    const [unidades, setUnidades] = useState<IUnidade[]>([]);
    const [unidade_id, setUnidade_id] = useState('');
    const router = useRouter();
    const { setAlert } = useContext(AlertsContext);  

    const permissoes: Record<string, { label: string, value: string, color: OverridableStringUnion<ColorPaletteProp, ChipPropsColorOverrides> | undefined }> = {
      'DEV': { label: 'Desenvolvedor', value: 'DEV', color: 'primary' },
      'TEC': { label: 'Técnico', value: 'TEC', color: 'neutral' },
      'ADM': { label: 'Administrador', value: 'ADM', color: 'success' },
      'USR': { label: 'Usuário', value: 'USR', color: 'warning' },
    }

    const submitData = () => {
        if (usuario){
            usuarioServices.atualizar(usuario.id, {
                unidade_id,
            }).then((response) => {
                if (response.id) {
                    setAlert('Usuário alterado!', 'Dados atualizados com sucesso!', 'success', 3000, Check);              
                }
            })
        }
    }

    useEffect(() => {
        usuarioServices.validaUsuario()
            .then((response: IUsuario) => {
                setUsuario(response);
                setPermissao(response.permissao);
                setUnidade_id(response.unidade_id);
            });

        unidadeServices.listaCompleta()
            .then((response: IUnidade[]) => {
                setUnidades(response);
            })
    }, []);
    

    return (
        <Content
            breadcrumbs={[
                { label: 'Meu Perfil', href: '/eu' },
            ]}
            titulo={usuario ? usuario.nome : 'Meu Perfil'}
            tags={
                usuario ? <div style={{ display: 'flex', gap: '0.2rem' }}>     
                  <Chip color={permissoes[usuario?.permissao].color} size='lg'>{permissoes[usuario?.permissao].label}</Chip>
                </div> : null
            }
            pagina=""
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
                                <Select value={permissao ? permissao : 'USR'} disabled>
                                    <Option value="DEV">Desenvolvedor</Option>
                                    <Option value="ADM">Administrador</Option>
                                    <Option value="TEC">Técnico</Option>
                                    <Option value="USR">Usuário</Option>
                                </Select>
                            </FormControl>
                        </Stack>
                        <Divider />
                        <Stack>
                            <FormControl>
                                <FormLabel>Unidade</FormLabel>
                                <Autocomplete
                                    startDecorator={<Business />}
                                    options={unidades}
                                    getOptionLabel={(option) => option && option.sigla}
                                    renderOption={(props, option) => (
                                      <AutocompleteOption {...props} key={option.id} value={option.id}>
                                        {option.sigla}
                                      </AutocompleteOption>
                                    )}
                                    placeholder="Unidade"
                                    value={unidade_id && unidade_id !== '' ? unidades.find((unidade: IUnidade) => unidade.id === unidade_id) : null}
                                    onChange={(_, value) => value  && setUnidade_id(value?.id)}
                                    filterOptions={(options, { inputValue }) => {
                                        if (unidades) return (options as IUnidade[]).filter((option) => (
                                            (option).nome.toLowerCase().includes(inputValue.toLowerCase()) || 
                                            (option).sigla.toLowerCase().includes(inputValue.toLowerCase())
                                        ));
                                        return [];
                                    }}
                                    noOptionsText="Nenhuma unidade encontrada"
                                />
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
                                    disabled
                                />
                            </FormControl>
                        </Stack>
                    </Stack>
                    <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                        <CardActions sx={{ alignSelf: 'flex-end', pt: 2 }}>
                        <Button size="sm" variant="outlined" color="neutral" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button size="sm" variant="solid" onClick={submitData}>
                            Salvar
                        </Button>
                        </CardActions>
                    </CardOverflow>
                </Card>
            </Box>            
        </Content>
    );
}
