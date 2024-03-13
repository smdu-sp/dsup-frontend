'use client'

import Content from "@/components/Content";
import { Abc, Business, Check, Close, Handyman, PlayArrow, Timer } from "@mui/icons-material";
import { Autocomplete, Box, Button, Card, CardActions, CardOverflow, Chip, Divider, FormControl, FormLabel, Input, Select, Stack, Option, Textarea, FormHelperText, ColorPaletteProp } from "@mui/joy";
import { useRouter } from "next/navigation";
import { use, useContext, useEffect, useState } from "react";
import * as servicoServices from "@/shared/services/servico.services";
import * as ordemServices from "@/shared/services/ordem.services";
import * as unidadeServices from "@/shared/services/unidade.services";
import * as usuarioServices from "@/shared/services/usuario.services";
import { IOrdem } from "@/shared/services/ordem.services";
import { IUnidade } from "@/shared/services/unidade.services";
import { AlertsContext } from "@/providers/alertsProvider";
import { IServico } from "@/shared/services/servico.services";
import { IUsuario } from "@/shared/services/usuario.services";
import { ChipPropsColorOverrides, Typography } from "@mui/material";
import Timeline from "@mui/lab/Timeline";
import { OverridableStringUnion } from '@mui/types';
import { TimelineConnector, TimelineContent, TimelineDot, TimelineItem, TimelineOppositeContent, TimelineSeparator } from "@mui/lab";
import { timelineOppositeContentClasses } from '@mui/lab/TimelineOppositeContent';

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
    const [servicos, setServicos] = useState<IServico[]>([]);
    const [usuario, setUsuario] = useState<IUsuario>();
    const [servicoAtualStatus, setServicoAtualStatus] = useState(1);
    const [servicoAtualObservacao, setServicoAtualObservacao] = useState('');

    const statusChip: { label: string, color: OverridableStringUnion<ColorPaletteProp, ChipPropsColorOverrides> | undefined }[]  = [
      { label: '', color: 'neutral' },
      { label: 'Aberto', color: 'neutral' },
      { label: 'Em andamento', color: 'primary' },
      { label: 'Aguardando avaliação', color: 'warning' },
      { label: 'Concluído', color: 'success' },
    ]

    function atualizaDados() {
        if (id) ordemServices.buscarPorId(id)
            .then((ordem: IOrdem) => {
                setOrdem(ordem);
                setUnidade_id(ordem.unidade_id);
                setAndar(ordem.andar);
                setTipo(ordem.tipo);
                setSala(ordem.sala);
                setObservacoes(ordem.observacoes);
                setPrioridade(ordem.prioridade);
                setServicos(ordem.servicos);
            });
        unidadeServices.listaCompleta()
            .then((response: IUnidade[]) => {
                setUnidades(response);
            })
        usuarioServices.validaUsuario().then((response: IUsuario) => {
            setUsuario(response);
        })
    }

    useEffect(() => {
        atualizaDados();
    }, [ id ]);

    function handleFinalizar(servico_id: string) {
        servicoServices.finalizarServico(servico_id).then((response: IServico) => {
            if (response.status === 2) {
                setAlert('Ordem finalizada com sucesso!', 'Sucesso', 'success', 3000, Check);
                atualizaDados();
            }
        })
    }

    function handleAvaliar(servico_id: string) {
        console.log({ servico_id, servicoAtualStatus, servicoAtualObservacao });
        servicoServices.avaliarServico(servico_id, { status: servicoAtualStatus, observacao: servicoAtualObservacao}).then((response: IServico) => {
            if (response.status === servicoAtualStatus) {
                setAlert('Ordem avaliada com sucesso!', 'Sucesso', 'success', 3000, Check);
                atualizaDados();
            }
        })
    }

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
                ordemServices.criar({
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
            ordemServices.atualizar(id, {
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
            tags={[
                <Chip size="lg" color={statusChip[ordem?.status || 0].color} title={statusChip[ordem?.status || 0].label}>{statusChip[ordem?.status || 0].label}</Chip>,
            ]}
            pagina="chamados"
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '90%',
                    maxWidth: 1000,
                    mx: 'auto',
                    px: { xs: 2, md: 6 },
                    py: { xs: 2, md: 3 },
                    gap: 2,
                }}
            >
                <Timeline
                    sx={{
                        [`& .${timelineOppositeContentClasses.root}`]: {
                            flex: 0.25,
                        },
                    }}
                >
                    { servicos ? servicos.map((servico: IServico, index: number) => (
                        <>
                        {servico.status === 1 ? null : 
                            <TimelineItem key={index}>
                                <TimelineOppositeContent>
                                    { servico.concluido_em ? 
                                        `${new Date(servico.concluido_em).toLocaleDateString('pt-BR')} - ${new Date(servico.concluido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` 
                                    : '' }
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                    <TimelineDot color={ servico.status === 2 ? 'grey' : (servico.status === 3 ? 'success' : 'error')} sx={{ p: 0}}>
                                        {servico.status === 3 ? <Check sx={{ fontSize: 10 }} /> : 
                                            (servico.status === 2 ? <Timer sx={{ fontSize: 10 }} /> : <Close sx={{ fontSize: 10 }} />)}
                                    </TimelineDot>
                                    <TimelineConnector />
                                </TimelineSeparator>
                                <TimelineContent sx={{ flexGrow: 1 }}>
                                    <Card>
                                        {(servico.status === 2 && usuario?.permissao !== 'USR') || (servico.status < 2) ? <Typography>Aguardando avaliação</Typography> :
                                        <Stack spacing={2}>
                                            <Stack direction="row" spacing={2}>
                                                <FormControl sx={{ flexGrow: 1 }}>
                                                    <FormLabel>O problema foi solucionado?</FormLabel>
                                                    <Select 
                                                        value={index === 0 && servico.status === 2 ? servicoAtualStatus : servico.status}
                                                        onChange={(_, value) => {
                                                            if (index === 0)
                                                                value && setServicoAtualStatus(value);
                                                        }}
                                                        disabled={index !== 0 || servico.status !== 2}
                                                    >
                                                        <Option value={3}>Sim</Option>
                                                        <Option value={4}>Não</Option>
                                                    </Select>
                                                </FormControl>
                                            </Stack>
                                            {servico.status === 4 || (index === 0 && servicoAtualStatus === 4) ?<><Divider/>
                                            <Stack direction="row" spacing={2}>
                                                <FormControl sx={{ flexGrow: 1 }}>
                                                    <FormLabel>Motivo</FormLabel>
                                                    <Textarea
                                                        minRows={3}
                                                        maxRows={5} 
                                                        placeholder="Descreva de maneira sucinta o motivo da não solução do problema"
                                                        value={index === 0 && servico.status !== 4 ? servicoAtualObservacao : servico.observacao}
                                                        onChange={(event) => {
                                                            if (index === 0 && servicoAtualStatus === 4)
                                                                setServicoAtualObservacao(event.target.value);
                                                        }}
                                                        disabled={index !== 0 || servicoAtualStatus !== 4}
                                                    />
                                                </FormControl>
                                            </Stack></> : null }
                                            { servico.status === 2 && usuario?.permissao === 'USR' ? 
                                                <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                                                    <CardActions sx={{ alignSelf: 'flex-end', pt: 2 }}>
                                                        <Button size="sm" variant="solid" color="primary" onClick={() => handleAvaliar(servico.id)}>
                                                            Avaliar
                                                        </Button>
                                                    </CardActions>
                                                </CardOverflow> : null}
                                        </Stack>}
                                    </Card>
                                </TimelineContent>
                            </TimelineItem>
                        }
                        <TimelineItem key={servico.id}>
                            <TimelineOppositeContent color="textSecondary">
                                { servico.data_inicio ? 
                                    `${new Date(servico.data_inicio).toLocaleDateString('pt-BR')} - ${new Date(servico.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` 
                                : '' }
                            </TimelineOppositeContent>
                            <TimelineSeparator>
                                <TimelineDot color='info' sx={{ p: 0}}>
                                    <Handyman sx={{ fontSize: 10 }} />
                                </TimelineDot>
                                <TimelineConnector />
                            </TimelineSeparator>
                            <TimelineContent>
                                <Card sx={{ width: '100%' }}>
                                    <Stack spacing={2}>
                                        <Stack direction="row" spacing={2}>
                                            <FormControl sx={{ flexGrow: 1 }}>
                                                <FormLabel>Técnico</FormLabel>
                                                <Input value={servico.tecnico?.nome} disabled />
                                            </FormControl>
                                        </Stack>
                                        <Divider/>
                                        <Stack direction="row" spacing={2}>
                                            <FormControl sx={{ flexGrow: 1 }}>
                                                <FormLabel>Data de início</FormLabel>
                                                <Input value={`${new Date(servico.data_inicio).toLocaleDateString('pt-BR')} - ${new Date(servico.data_inicio).toLocaleTimeString('pt-BR')}`} disabled />
                                            </FormControl>
                                        </Stack>
                                    </Stack>
                                    { servico.status === 1 && servico.tecnico_id === usuario?.id ? 
                                        <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                                            <CardActions sx={{ alignSelf: 'flex-end', pt: 2 }}>
                                                <Button size="sm" variant="solid" color="primary" onClick={() => handleFinalizar(servico.id)}>
                                                    Finalizar
                                                </Button>
                                            </CardActions>
                                        </CardOverflow> : null
                                    }
                                </Card>
                            </TimelineContent>
                        </TimelineItem>
                    </>)) : null}
                    <TimelineItem key={ordem?.id}>
                        <TimelineOppositeContent color="textSecondary">
                                { ordem?.data_solicitacao ? 
                                    `${new Date(ordem?.data_solicitacao).toLocaleDateString('pt-BR')} - ${new Date(ordem?.data_solicitacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` 
                                : 'Chamado novo' }
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                            <TimelineDot color='info' sx={{ p: 0}}>
                                <PlayArrow sx={{ fontSize: 10 }} />
                            </TimelineDot>
                            <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                            <Card sx={{ width: '100%' }}>
                                <Stack spacing={2}>
                                    {ordem && usuario?.permissao !== 'USR' ?
                                    <><Stack direction="row" spacing={2}>
                                        <FormControl sx={{ flexGrow: 1 }}>
                                            <FormLabel>Prioridade</FormLabel>
                                            <Select value={prioridade} onChange={(_, value) => setPrioridade(Number(value))}>
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
                        </TimelineContent>
                    </TimelineItem>
                </Timeline>
            </Box>            
        </Content>
    );
}
