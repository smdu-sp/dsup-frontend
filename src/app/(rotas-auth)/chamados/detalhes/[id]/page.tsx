'use client'

import Content from "@/components/Content";
import { Abc, Business, Check } from "@mui/icons-material";
import { Autocomplete, Box, Button, Card, CardActions, CardOverflow, Divider, FormControl, FormLabel, Input, Select, Stack, Option, Textarea, FormHelperText } from "@mui/joy";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import * as ordemService from "@/shared/services/ordem.services";
import * as unidadeServices from "@/shared/services/unidade.services";
import { IOrdem } from "@/shared/services/ordem.services";
import { IUnidade } from "@/shared/services/unidade.services";
import { AlertsContext } from "@/providers/alertsProvider";

export default function ChamadoDetalhes(props: { params: { id: string } }) {
    const router = useRouter();
    const { setAlert } = useContext(AlertsContext);
    const { id } = props.params;
    const [ordem, setOrdem] = useState<IOrdem>();
    const [unidade_id, setUnidade_id] = useState('');
    const [unidades, setUnidades] = useState<IUnidade[]>([]);
    const [andar, setAndar] = useState<number>(8);
    const [tipo, setTipo] = useState<number>(4);
    const [prioridade, setPrioridade] = useState<number>(1);
    const [sala, setSala] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [salaError, setSalaError] = useState('');
    const [observacoesError, setObservacoesError] = useState('');
    const [unidade_idError, setUnidade_idError] = useState('');
    const [andarError, setAndarError] = useState('');
    const [tipoError, setTipoError] = useState('');

    useEffect(() => {
        if (id) ordemService.buscarPorId(id)
            .then((ordem: IOrdem) => {
                setOrdem(ordem);
                setUnidade_id(ordem.unidade_id);
                setAndar(ordem.andar);
                setTipo(ordem.tipo);
                setSala(ordem.sala);
                setObservacoes(ordem.observacoes);
                setPrioridade(ordem.prioridade);
            });
        unidadeServices.listaCompleta()
            .then((response: IUnidade[]) => {
                setUnidades(response);
            })
    }, [ id ]);

    function handleSubmit() {
        if (!id) {
            let erros = 0;
            if (unidade_id === ''){
                setUnidade_idError('É obrigatório informar a unidade');
                erros++;
            }
            if (!andar){
                setAndarError('É obrigatório informar o andar');
                erros++;
            }
            if (!tipo){
                setTipoError('É obrigatório informar o tipo');
                erros++;
            }
            if (sala === ''){
                setSalaError('É obrigatório informar a sala');
                erros++;
            }
            if (observacoes === ''){
                setObservacoesError('É obrigatório informar a descrição do problema');
                erros++;
            }
            if (erros === 0)
                ordemService.criar({
                    unidade_id,
                    andar,
                    sala,
                    tipo,
                    observacoes
                }).then((ordem: IOrdem) => {
                    setAlert('Chamado criado com sucesso!', 'Sucesso', 'success', 3000, Check);
                    if (ordem) router.push('/chamados/detalhes/' + ordem.id);
                })
        } else {
            ordemService.atualizar(id, {
                prioridade
            }).then((ordem: IOrdem) => {
                setAlert('Chamado alterado com sucesso!', 'Sucesso', 'success', 3000, Check);
                if (ordem) router.push('/chamados/detalhes/' + ordem.id);
            })
        }
    }
    return (
        <Content
            breadcrumbs={[
                { label: 'Chamados', href: '/chamados' },
                { label: id ? `${id}` : 'Novo chamado', href: `/chamados/detalhes/${id ? id : '' }` || '' },
            ]}
            titulo={id ? `Chamado #${id}` : 'Novo chamado'}
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
                        <Stack spacing={2}>
                            {ordem ?
                            <><Stack direction="row" spacing={2}>
                                <FormControl sx={{ flexGrow: 1 }}>
                                    <FormLabel>Prioridade</FormLabel>
                                    <Select value={prioridade} onChange={(event, value) => setPrioridade(Number(value))}>
                                        <Option value={1}>Baixa</Option>
                                        <Option value={2}>Media</Option>
                                        <Option value={3}>Alta</Option>
                                        <Option value={4}>Urgente</Option>
                                    </Select>
                                </FormControl>
                            </Stack><Divider/></> : null}
                            <Stack direction="row" spacing={2}>
                                <FormControl sx={{ flexGrow: 1 }}>
                                    <FormLabel>Unidade</FormLabel>
                                    <Autocomplete
                                        autoFocus
                                        options={unidades}
                                        getOptionLabel={(option) => option && `${option.nome} (${option.sigla})`}
                                        placeholder="Unidade"
                                        value={unidade_id && unidades.find((unidade: IUnidade) => unidade.id === unidade_id)}
                                        onChange={(_, value) => {
                                            value  && setUnidade_id(value?.id);
                                            setUnidade_idError('');
                                        }}
                                        filterOptions={(options, { inputValue }) => {
                                            if (unidades) return (options as IUnidade[]).filter((option) => (
                                                (option).nome.toLowerCase().includes(inputValue.toLowerCase()) || 
                                                (option).sigla.toLowerCase().includes(inputValue.toLowerCase())
                                            ));
                                            return [];
                                        }}
                                        noOptionsText="Nenhuma unidade encontrada"
                                        disabled={id ? true : false}
                                    />
                                    <FormHelperText sx={{ color: 'danger.500' }}>{unidade_idError}</FormHelperText>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Andar</FormLabel>
                                    <Select
                                        size="sm"
                                        value={andar}
                                        onChange={(_, value) => {
                                            setAndar(value ? value : 8)
                                            setAndarError('');
                                        }}
                                        placeholder="Andar"
                                        disabled={id ? true : false}
                                    >
                                        <Option value={8}>8</Option>
                                        <Option value={17}>17</Option>
                                        <Option value={18}>18</Option>
                                        <Option value={19}>19</Option>
                                        <Option value={20}>20</Option>
                                        <Option value={21}>21</Option>
                                        <Option value={22}>22</Option>
                                    </Select>
                                    <FormHelperText sx={{ color: 'danger.500' }}>{andarError}</FormHelperText>
                                </FormControl>
                            </Stack>
                            <Divider />
                            <Stack direction="row" spacing={2}>
                                <FormControl sx={{ flexGrow: 1 }}>
                                    <FormLabel>Sala</FormLabel>
                                    <Input
                                        size="sm"
                                        type="text"
                                        placeholder="Sala"
                                        value={sala}
                                        onChange={(event) => {
                                            setSala(event.target.value && event.target.value)
                                            setSalaError('');
                                        }}
                                        disabled={id ? true : false}
                                    />
                                    <FormHelperText sx={{ color: 'danger.500' }}>{salaError}</FormHelperText>
                                </FormControl>
                                <FormControl sx={{ flexGrow: 1 }}>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select
                                        size="sm"
                                        value={tipo}
                                        onChange={(_, value) => {
                                            setTipo(value ? value : 1)
                                            setTipoError('');
                                        }}
                                        placeholder="Tipo de chamado"
                                        disabled={id ? true : false}
                                    >
                                        <Option value={1}>Elétrica</Option>
                                        <Option value={2}>Hidráulica</Option>
                                        <Option value={3}>Telefonia</Option>
                                        <Option value={4}>Outros</Option>
                                    </Select>
                                    <FormHelperText sx={{ color: 'danger.500' }}>{tipoError}</FormHelperText>
                                </FormControl>
                            </Stack>
                            <Divider />
                            <Stack direction="row" spacing={2}>
                                <FormControl sx={{ flexGrow: 1 }}>
                                    <FormLabel>Descricão do problema</FormLabel>
                                    <Textarea
                                        minRows={5}
                                        maxRows={10} 
                                        placeholder="Descreva de maneira sucinta a ocorrência/problema"
                                        value={observacoes}
                                        onChange={(event) => {
                                            setObservacoes(event.target.value && event.target.value)
                                            setObservacoesError('');
                                        }}
                                        disabled={id ? true : false}
                                    />
                                    <FormHelperText sx={{ color: 'danger.500' }}>{observacoesError}</FormHelperText>
                                </FormControl>
                            </Stack>
                        </Stack>
                        <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                            <CardActions sx={{ alignSelf: 'flex-end', pt: 2 }}>
                            <Button size="sm" variant="outlined" color="neutral" onClick={() => router.back()}>
                                Cancelar
                            </Button>
                            <Button size="sm" variant="solid" color="primary" onClick={handleSubmit}>
                                Salvar
                            </Button>
                            </CardActions>
                        </CardOverflow>
                </Card>
            </Box>            
        </Content>
    );
}
