'use client'

import Content from "@/components/Content";
import { use, useContext, useEffect, useState } from "react";
import * as tipoChamadoServices from "@/shared/services/tipoChamado.services";
import { Box, Button, Card, CardActions, CardOverflow, Chip, ChipPropsColorOverrides, ColorPaletteProp, Divider, FormControl, FormLabel, Input, Option, Select, Stack } from "@mui/joy";
import { Check, Palette, Label } from "@mui/icons-material";
import { useRouter } from 'next/navigation';
import { ITipoChamado } from "@/shared/services/tipoChamado.services";
import { AlertsContext } from "@/providers/alertsProvider";
import { OverridableStringUnion } from '@mui/types';

const cores = ['primary', 'neutral', 'success', 'warning', 'danger'];

export default function TipoChamadoDetalhes(props: { params: Promise<{ id: string }> }) {
    const [idTipo, setIdTipo] = useState<string>('');
    const [status, setStatus] = useState<string>('true');
    const [nome, setNome] = useState<string>('');
    const [cor, setCor] = useState<string>('neutral');
    const { id } = use(props.params);
    const { setAlert } = useContext(AlertsContext);
    const router = useRouter();

    const submitForm = async () => {
        if (!id){
            const criado: ITipoChamado | undefined = await tipoChamadoServices.criar({
                nome, cor, status
            });
            if (criado) router.push('/tipos-chamado/detalhes/' + criado.id);
        } else {
            const alterado: ITipoChamado | undefined = await tipoChamadoServices.atualizar({
                id, nome, cor, status
            });
            if (alterado) setAlert('Tipo de chamado alterado!', 'Tipo de chamado alterado com sucesso!', 'success', 3000, Check);
        }
    }

    useEffect(() => {
        if (id) {
            tipoChamadoServices.buscarPorId(id)
                .then((response: ITipoChamado | undefined) => {
                    if (!response) return;
                    setIdTipo(response.id);
                    setNome(response.nome);
                    setCor(response.cor);
                    setStatus(response.status ? 'true' : 'false');
                });
        }
    }, [ id ]);

    return (
        <Content
            breadcrumbs={[
                { label: 'Tipos de Chamado', href: '/tipos-chamado' },
                { label: nome ? nome : 'Novo Tipo de Chamado', href: '/tipos-chamado/detalhes/' + idTipo || '' },
            ]}
            titulo={nome ? nome : 'Novo Tipo de Chamado'}
            pagina="tipos-chamado"
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
                                        startDecorator={<Label />}
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
                                    >
                                        <Option value={'true'}>Ativo</Option>
                                        <Option value={'false'}>Inativo</Option>
                                    </Select>
                                </FormControl>
                            </Stack>
                            <Divider />
                            <Stack direction="row" spacing={2} alignItems="center">
                                <FormControl sx={{ flexGrow: 1 }}>
                                    <FormLabel>Cor</FormLabel>
                                    <Select
                                        value={cor}
                                        onChange={(_, value) => value && setCor(value)}
                                        size="sm"
                                        startDecorator={<Palette />}
                                    >
                                        {cores.map((c) => <Option key={c} value={c}>{c}</Option>)}
                                    </Select>
                                </FormControl>
                                <Chip color={cor as OverridableStringUnion<ColorPaletteProp, ChipPropsColorOverrides>}>{nome || 'Pré-visualização'}</Chip>
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
