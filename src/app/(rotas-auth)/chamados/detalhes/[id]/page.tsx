'use client'

import Content from "@/components/Content";
import { Abc, Business, Tag } from "@mui/icons-material";
import { Box, Button, Card, CardActions, CardOverflow, Divider, FormControl, FormLabel, Input, Option, Select, Stack } from "@mui/joy";
import { useRouter } from "next/navigation";

export default function ChamadoDetalhes(props: { params: { id: string } }) {
    const router = useRouter();
    return (
        <Content
            breadcrumbs={[
                { label: 'Chamados', href: '/chamados' },
                { label: 'Novo chamado', href: '/chamados/detalhes/' || '' },
            ]}
            titulo={'Novo chamado'}
            pagina="chamados"
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
                                        size="sm"
                                        type="text"
                                        startDecorator={<Tag />}
                                        placeholder="Código"
                                    />
                                </FormControl>
                                <FormControl sx={{ flexGrow: 1 }}>
                                    <FormLabel>Sigla</FormLabel>
                                    <Input
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
                            <Button size="sm" variant="solid" color="primary" onClick={() => {}}>
                                Salvar
                            </Button>
                            </CardActions>
                        </CardOverflow>
                </Card>
            </Box>            
        </Content>
    );
}
