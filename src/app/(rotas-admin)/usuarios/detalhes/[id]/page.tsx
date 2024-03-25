'use client'

import { useContext, useEffect, useState } from "react";
import { Autocomplete, AutocompleteOption, Box, Button, Card, CardActions, CardOverflow, Chip, ChipPropsColorOverrides, ColorPaletteProp, Divider, FormControl, FormLabel, IconButton, Input, Option, Select, Stack } from "@mui/joy";
import { Badge, Business, Check, Clear, EmailRounded, Warning } from "@mui/icons-material";
import { useRouter } from 'next/navigation';
import { OverridableStringUnion } from '@mui/types';

import Content from "@/components/Content";
import { IUnidade } from "@/shared/services/unidade.services";
import { IUsuario } from "@/shared/services/usuario.services";
import * as usuarioServices from "@/shared/services/usuario.services";
import * as unidadeServices from "@/shared/services/unidade.services";
import { AlertsContext } from "@/providers/alertsProvider";

export default function UsuarioDetalhes(props: any) {
    const [usuario, setUsuario] = useState<IUsuario>();
    const [permissao, setPermissao] = useState('USR');
    const [unidades, setUnidades] = useState<IUnidade[]>([]);
    const [unidade_id, setUnidade_id] = useState('');
    const [nome, setNome] = useState('');
    const [login, setLogin] = useState('');
    const [email, setEmail] = useState('');
    const [novoUsuario, setNovoUsuario] = useState(false);
    const { id } = props.params;
    const router = useRouter();
    const { setAlert } = useContext(AlertsContext);

    const permissoes: Record<string, { label: string, value: string, color: OverridableStringUnion<ColorPaletteProp, ChipPropsColorOverrides> | undefined }> = {
      'DEV': { label: 'Desenvolvedor', value: 'DEV', color: 'primary' },
      'TEC': { label: 'Técnico', value: 'TEC', color: 'neutral' },
      'ADM': { label: 'Administrador', value: 'ADM', color: 'success' },
      'USR': { label: 'Usuário', value: 'USR', color: 'warning' },
    }

    useEffect(() => {
        if (id) {
            usuarioServices.buscarPorId(id)
                .then((response: IUsuario) => {
                    setUsuario(response);
                    setPermissao(response.permissao);
                    setUnidade_id(response.unidade_id);
                    setEmail(response.email);
                });
        }

        unidadeServices.listaCompleta()
            .then((response: IUnidade[]) => {
                setUnidades(response);
            })
    }, [ id ]);

    const submitData = () => {
        if (usuario){
            usuarioServices.atualizar(usuario.id, {
                unidade_id,
                permissao
            }).then((response) => {
                if (response.id) {
                    setAlert('Usuário alterado!', 'Dados atualizados com sucesso!', 'success', 3000, Check);              
                }
            })
        } else {
            if (novoUsuario){
                usuarioServices.criar({
                    nome, login, email, unidade_id, permissao
                }).then((response) => {
                    if (response.id) {
                        setAlert('Usuário criado!', 'Dados inseridos com sucesso!', 'success', 3000, Check);
                        router.push('/usuarios/detalhes/' + response.id);
                    }
                })
            }
        }
    }

    const buscarNovo = () => {
        if (login)
            usuarioServices.buscarNovo(login).then((response) => {
                if (response.message) setAlert('Erro', response.message, 'warning', 3000, Warning);
                if (response.id)
                    router.push('/usuarios/detalhes/' + response.id);
                else if (response.email) {
                    setNome(response.nome ? response.nome : '');
                    setLogin(response.login ? response.login : '');
                    setEmail(response.email ? response.email : '');
                    setUnidade_id(response.unidade_id ? response.unidade_id : '');
                    setNovoUsuario(true);
                }
            })
    }

    const limpaUsuario = () => {
        setNovoUsuario(false);
        setNome('');
        setLogin('');
        setEmail('');
        setUnidade_id('');
        setPermissao('USR');
    }
    

    return (
        <Content
            breadcrumbs={[
                { label: 'Usuários', href: '/usuarios' },
                { label: usuario ? usuario.nome : 'Novo', href: `/usuarios/detalhes/${id ? id : ''}` },
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
                        {!id ? 
                        <><Stack>
                            <FormControl>
                                <FormLabel>Login de rede</FormLabel>
                                <Input 
                                    placeholder="Buscar por login de rede" 
                                    value={login} 
                                    onChange={e => setLogin(e.target.value)} 
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') buscarNovo()
                                    }}
                                    endDecorator={
                                    novoUsuario ? <IconButton onClick={limpaUsuario}><Clear /></IconButton> : <Button onClick={buscarNovo} variant="soft">Buscar</Button>}
                                    readOnly={novoUsuario}
                                />
                            </FormControl>
                        </Stack>
                        <Divider />
                        <Stack>
                            <FormControl>
                                <FormLabel>Nome</FormLabel>
                                <Input 
                                    placeholder="Nome" 
                                    value={nome} 
                                    onChange={e => setNome(e.target.value)} 
                                    readOnly={novoUsuario}
                                />
                            </FormControl>
                        </Stack>
                        <Divider />
                        </> : null}
                        <Stack>
                            <FormControl>
                                <FormLabel>Permissao</FormLabel>
                                <Select value={permissao ? permissao : 'USR'} onChange={(_, value) => value && setPermissao(value)}
                                    startDecorator={<Badge />}>
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
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    size="sm"
                                    type="email"
                                    startDecorator={<EmailRounded />}
                                    placeholder="Email"
                                    sx={{ flexGrow: 1 }}
                                    readOnly={id ? true : (novoUsuario)}
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
