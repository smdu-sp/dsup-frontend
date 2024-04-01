'use client'

import Content from "@/components/Content";
import { useContext, useEffect, useState } from "react";
import * as unidadeServices from "@/shared/services/unidade.services";
import { Box, Button, Card, CardActions, CardOverflow, Divider, FormControl, FormLabel, Input, Option, Select, Stack } from "@mui/joy";
import { Abc, Business, Check, Tag } from "@mui/icons-material";
import { useRouter } from 'next/navigation';
import { IUnidade } from "@/shared/services/unidade.services";
import { AlertsContext } from "@/providers/alertsProvider";

export default function UnidadeDetalhes(props: { params: { id: string } }) {
    const [idUnidade, setIdUnidade] = useState<string>('');
    const [status, setStatus] = useState<string>('true');
    const [nome, setNome] = useState<string>('');
    const [sigla, setSigla] = useState<string>('');
    const [codigo, setCodigo] = useState<string>('');
    const { id } = props.params;
    const { setAlert } = useContext(AlertsContext);
    const router = useRouter();

    const submitForm = async () => {
        if (!id){
            const criado: IUnidade = await unidadeServices.criar({
                nome, codigo, sigla, status
            });
            if (criado) router.push('/unidades/detalhes/' + criado.id);
        } else {
            const alterado: IUnidade = await unidadeServices.atualizar({
                id, nome, codigo, sigla, status
            });
            if (alterado) setAlert('Unidade alterada!', 'Unidade alterada com sucesso!', 'success', 3000, Check);
        }
    }

    useEffect(() => {
        if (id) {
            unidadeServices.buscarPorId(id)
                .then((response: IUnidade) => {
                    setIdUnidade(response.id);
                    setNome(response.nome);
                    setSigla(response.sigla);
                    setCodigo(response.codigo);
                    setStatus(response.status ? 'true' : 'false');
                });
        }
    }, [ id ]);

    return (
        <Content
            breadcrumbs={[
                { label: 'Unidades', href: '/unidades' },
                { label: nome ? nome : 'Nova Unidade', href: '/unidades/detalhes/' + idUnidade || '' },
            ]}
            titulo={nome ? nome : 'Nova Unidade'}
            pagina="unidades"
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
                            <Stack direction="row" spacing={2}>
                                <FormControl sx={{ flexGrow: 1 }}>
                                    <FormLabel>Nome</FormLabel>
                                    <Input
                                        value={nome || ''}
                                        onChange={(event) => setNome(event.target.value)}
                                        size="sm"
                                        type="text"
                                        startDecorator={<Business />}
                                        placeholder="Nome"
                                        required
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        value={status}
                                        onChange={(_, value) => value && setStatus(value)}
                                        size="sm"
                                        placeholder="Status"
                                        startDecorator={<Business />}
                                    >
                                        <Option value={'true'}>Ativo</Option>
                                        <Option value={'false'}>Inativo</Option>
                                    </Select>
                                </FormControl>
                            </Stack>
                            <Divider />
                            <Stack direction="row" spacing={2}>
                                <FormControl sx={{ flexGrow: 1 }}>
                                    <FormLabel>Código</FormLabel>
                                    <Input
                                        value={codigo || ''}
                                        onChange={(event) => setCodigo(event.target.value)}
                                        size="sm"
                                        type="text"
                                        startDecorator={<Tag />}
                                        placeholder="Código"
                                    />
                                </FormControl>
                                <FormControl sx={{ flexGrow: 1 }}>
                                    <FormLabel>Sigla</FormLabel>
                                    <Input
                                        value={sigla || ''}
                                        onChange={(event) => setSigla(event.target.value)}
                                        size="sm"
                                        type="text"
                                        startDecorator={<Abc />}
                                        placeholder="Sigla"
                                    />
                                </FormControl>
                            </Stack>
                        </Stack>
                        <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                            <CardActions sx={{ alignSelf: 'flex-end', pt: 2 }}>
                            <Button size="sm" variant="outlined" color="neutral" onClick={() => router.back()}>
                                Cancelar
                            </Button>
                            <Button size="sm" variant="solid" color="primary" onClick={submitForm}>
                                Salvar
                            </Button>
                            </CardActions>
                        </CardOverflow>
                </Card>
            </Box>            
        </Content>
    );
}
