'use client'

import Content from "@/components/Content";
import { Add, Cancel, Check, Close, Handyman, Pause, PlayArrow, Timer } from "@mui/icons-material";
import { Autocomplete, Box, Button, Card, CardActions, CardOverflow, Chip, Divider, FormControl, FormLabel, Input, Select, Stack, Option, Textarea, Typography, FormHelperText, ColorPaletteProp, ModalDialog, DialogTitle, DialogContent, ListItem, List, IconButton, ListItemButton, AutocompleteOption } from "@mui/joy";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import * as servicoServices from "@/shared/services/servico.services";
import * as ordemServices from "@/shared/services/ordem.services";
import * as unidadeServices from "@/shared/services/unidade.services";
import * as usuarioServices from "@/shared/services/usuario.services";
import { IOrdem } from "@/shared/services/ordem.services";
import { IUnidade } from "@/shared/services/unidade.services";
import { AlertsContext } from "@/providers/alertsProvider";
import { IMaterial, IServico, ISuspensao } from "@/shared/services/servico.services";
import { IUsuario } from "@/shared/services/usuario.services";
import { ChipPropsColorOverrides, Modal } from "@mui/material";
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
    const [tratar_com, setTratar_com] = useState('');
    const [telefone, setTelefone] = useState('');
    const [salaError, setSalaError] = useState('');
    const [observacoesError, setObservacoesError] = useState('');
    const [unidade_idError, setUnidade_idError] = useState('');
    const [andarError, setAndarError] = useState('');
    const [tipoError, setTipoError] = useState('');
    const [telefoneError, setTelefoneError] = useState('');
    const [servicos, setServicos] = useState<IServico[]>([]);
    const [usuario, setUsuario] = useState<IUsuario>();
    const [servicoAtualStatus, setServicoAtualStatus] = useState(1);
    const [servicoAtualObservacao, setServicoAtualObservacao] = useState('');
    const [servicoAtualDescricao, setServicoAtualDescricao] = useState('');
    const [servicoAtualSalvar, setServicoAtualSalvar] = useState(true);
    const [adicionaMaterialModal, setAdicionaMaterialModal] = useState(false);
    const [adicionaSuspensaoModal, setAdicionaSuspensaoModal] = useState(false);
    const [motivoSuspensao, setMotivoSuspensao] = useState('');
    const [servicoSuspensao, setServicoSuspensao] = useState('');
    const [nomeMaterial, setNomeMaterial] = useState('');
    const [quantidadeMaterial, setQuantidadeMaterial] = useState(0);
    const [medidaMaterial, setMedidaMaterial] = useState('un');
    const [adicionaMaterialServico, setAdicionaMaterialServico] = useState('');

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
                setTelefone(ordem.telefone);
                setSala(ordem.sala);
                setObservacoes(ordem.observacoes);
                setPrioridade(ordem.prioridade);
                setServicos(ordem.servicos);
                ordem.tratar_com && setTratar_com(ordem.tratar_com);
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

    function handleAtualizar(servico_id: string) {
        servicoServices.atualizar(servico_id, { descricao: servicoAtualDescricao }).then((response: IServico) => {
            if (response.descricao === servicoAtualDescricao) {
                setAlert('Descrição de serviço atualizada com sucesso!', 'Sucesso', 'success', 3000, Check);
                atualizaDados();
            }
        })
    }

    function handleAvaliar(servico_id: string) {
        servicoServices.avaliarServico(servico_id, { status: servicoAtualStatus, observacao: servicoAtualObservacao}).then((response: IServico) => {
            if (response.status === servicoAtualStatus) {
                setAlert('Ordem avaliada com sucesso!', 'Sucesso', 'success', 3000, Check);
                atualizaDados();
            }
        })
    }

    function handleSuspensao() {
        servicoServices.adicionarSuspensao(servicoSuspensao, { motivo: motivoSuspensao}).then((response: ISuspensao) => {
            if (response.motivo === motivoSuspensao) {
                setMotivoSuspensao('');
                setServicoSuspensao('');
                setAdicionaSuspensaoModal(false);
                setAlert('Serviço suspenso!', 'Sucesso', 'warning', 3000, Check);
                atualizaDados();
            }
        })
    }

    function handleRetomar(servico_id: string) {
        servicoServices.retomarServico(servico_id).then((response: ISuspensao) => {
            if (response.status === false) {
                setAlert('Serviço retomado!', 'Sucesso', 'success', 3000, Check);
                atualizaDados();
            }
        })
    }

    function handleAdicionarMaterial() {
        servicoServices.adicionarMaterial(adicionaMaterialServico, { nome: nomeMaterial, quantidade: quantidadeMaterial, medida: medidaMaterial })
        .then((response: IMaterial) => {
            if (response.nome === nomeMaterial) {
                setNomeMaterial('');
                setQuantidadeMaterial(0);
                setMedidaMaterial('un');
                setAdicionaMaterialServico('');
                setAdicionaMaterialModal(false);
                atualizaDados();
            }
        })
    }

    function handleRemoverMaterial(material_id: string) {
        servicoServices.removerMaterial(material_id).then((response: { status: boolean }) => {
            atualizaDados();
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
            if (telefone === ''){
                setTelefoneError('É obrigatório informar o telefone');
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
                    observacoes,
                    telefone,
                    tratar_com
                }).then((ordem: IOrdem) => {
                    if (!ordem) setAlert('Erro', 'Erro ao criar chamado!', 'danger', 3000, Cancel);
                    if (ordem) router.push('/chamados?criado=1');
                });
        } else {
            ordemServices.atualizar(id, {
                prioridade
            }).then((ordem: IOrdem) => {
                if (!ordem) setAlert('Erro', 'Erro ao atualizar chamado!', 'danger', 3000, Cancel);
                if (ordem) router.push('/chamados?criado=2');
            });
        }
    }
    function formatarTelefone(value: string): string {
        if (!value) return value;
        const onlyNumbers = value.replace(/\D/g, '').substring(0, 9);
        if (onlyNumbers.length <= 4)
            return onlyNumbers.replace(/(\d{0,4})/, '$1');
        if (onlyNumbers.length <= 8)
            return onlyNumbers.replace(/(\d{0,4})(\d{0,4})/, '$1-$2');
        return onlyNumbers.replace(/(\d{0,5})(\d{0,4})/, '$1-$2');
    }

    return (<>
        <Modal open={adicionaMaterialModal} sx={{ zIndex: 99 }} onClose={() => setAdicionaMaterialModal(false)}>
            <ModalDialog>
                <DialogTitle>Adicionar material utilizado</DialogTitle>
                <Stack spacing={2}>
                    <FormControl>
                        <FormLabel>Material</FormLabel>
                        <Input value={nomeMaterial} onChange={(event) => setNomeMaterial(event.target.value)} />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Quantidade</FormLabel>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Input type="number" value={quantidadeMaterial} onChange={(event) => {
                                const value = parseFloat(event.target.value) || 0;
                                setQuantidadeMaterial(value < 0 ? 0 : value);
                            }} />
                            <Select value={medidaMaterial} sx={{ zIndex: 100 }} onChange={(_, value) => setMedidaMaterial(value || "un")}>
                                <Option value="un">unidade(s)</Option>
                                <Option value="m">metro(s)</Option>
                                <Option value="kg">kg(s)</Option>
                            </Select>
                        </Box>
                    </FormControl> 
                    <Button color="success" onClick={() => handleAdicionarMaterial()}>Adicionar</Button>
                </Stack>
            </ModalDialog>
        </Modal>
        <Modal open={adicionaSuspensaoModal} onClose={() => {
            setAdicionaSuspensaoModal(false);
            setMotivoSuspensao('');
        }}>
            <ModalDialog>
                <DialogTitle>Pausar serviço</DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <FormControl>
                            <FormLabel>Motivo da Paralização</FormLabel>
                            <Textarea
                                value={motivoSuspensao}
                                onChange={(event) => setMotivoSuspensao(event.target.value)}
                                minRows={4}
                                maxRows={4}
                                required
                                autoFocus
                            />
                        </FormControl>
                    </Stack>
                </DialogContent>
                <Button color="warning" disabled={!motivoSuspensao} onClick={handleSuspensao}>Pausar</Button>
            </ModalDialog>
        </Modal>
        <Content
            breadcrumbs={[
                { label: 'Chamados', href: '/chamados' },
                { label: id ? `${id}` : 'Novo chamado', href: `/chamados/detalhes/${id ? id : '' }` || '' },
            ]}
            titulo={id ? `Chamado #${id}` : 'Novo chamado'}
            tags={id ? [
                <Chip key={ordem?.status || 0} size="lg" color={statusChip[ordem?.status || 0].color} title={statusChip[ordem?.status || 0].label}>{statusChip[ordem?.status || 0].label}</Chip>,
            ] : []}
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
                        {servico.status === 1 || servico.status === 5 ? null : 
                            <TimelineItem key={index}>
                                <TimelineOppositeContent>
                                    { servico.avaliado_em ? 
                                        `${new Date(servico.avaliado_em).toLocaleDateString('pt-BR')} - ${new Date(servico.avaliado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` 
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
                                        {(servico.status === 2 && (usuario?.permissao !== 'USR' && usuario?.id !== ordem?.solicitante_id)) ? <Typography level='title-md'>Aguardando avaliação</Typography> :
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
                                            <Divider/>
                                            <Stack direction="row" spacing={2}>
                                                <FormControl sx={{ flexGrow: 1 }}>
                                                    <FormLabel>{servicoAtualStatus === 4 ? 'Motivo' : 'Observações'}</FormLabel>
                                                    <Textarea
                                                        minRows={3}
                                                        maxRows={5} 
                                                        placeholder={
                                                            servicoAtualStatus === 4 ? 
                                                            'Descreva de maneira sucinta o motivo da não solução do problema' :
                                                            'Observação sobre a solução do problema (elogios, sugestões, etc.)'
                                                        }
                                                        value={index === 0 && servico.status !== 4 ? servicoAtualObservacao : servico.observacao}
                                                        onChange={(event) => {
                                                            if (index === 0 && servicoAtualStatus === 4)
                                                                setServicoAtualObservacao(event.target.value);
                                                        }}
                                                        disabled={index !== 0 || (servico.status === 4 || servico.status === 3)}
                                                    />
                                                </FormControl>
                                            </Stack>
                                            { servico.status === 2 ? 
                                                <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                                                    <CardActions sx={{ alignSelf: 'flex-end', pt: 2 }}>
                                                        <Button size="sm" variant="solid" color="primary" onClick={() => handleAvaliar(servico.id)}>
                                                            Avaliar
                                                        </Button>
                                                    </CardActions>
                                                </CardOverflow>
                                            : null}
                                        </Stack>}
                                    </Card>
                                </TimelineContent>
                            </TimelineItem>
                        }
                        { servico.status !== 1 && servico.status !== 5 ? 
                            <TimelineItem key={index}>
                                <TimelineOppositeContent>
                                    { servico.data_fim ? 
                                        `${new Date(servico.data_fim).toLocaleDateString('pt-BR')} - ${new Date(servico.data_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` 
                                    : '' }
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                    <TimelineDot color='success' sx={{ p: 0}}>
                                        <Check sx={{ fontSize: 10 }} />
                                    </TimelineDot>
                                    <TimelineConnector />
                                </TimelineSeparator>
                                <TimelineContent sx={{ flexGrow: 1 }}>
                                    <Card sx={{ width: '100%' }}>
                                        <Typography level="title-md">Serviço concluído.</Typography>
                                        {servico.tecnico ? <Typography level="body-sm">{servico.tecnico.nome || ''}</Typography> : null }
                                    </Card>
                                </TimelineContent>
                            </TimelineItem>
                        : null}
                        {!servico.suspensoes ? null :
                            servico.suspensoes.map((suspensao: ISuspensao, index: number) => (<>
                                {suspensao.status ? null : 
                                    <TimelineItem key={servico.id + 'fim'}>
                                        <TimelineOppositeContent>
                                            {new Date(suspensao.termino).toLocaleDateString('pt-BR')} - {new Date(suspensao.termino).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </TimelineOppositeContent>
                                        <TimelineSeparator>
                                            <TimelineDot color='success' sx={{ p: 0}}>
                                                <PlayArrow sx={{ fontSize: 10 }} />
                                            </TimelineDot>
                                            <TimelineConnector />
                                        </TimelineSeparator>
                                        <TimelineContent>
                                            <Card sx={{ width: '100%' }}>
                                                <Typography level="title-md">Suspensão encerrada</Typography>
                                            </Card>
                                        </TimelineContent>
                                    </TimelineItem>
                                }
                                <TimelineItem key={servico.id + 'fim'}>
                                    <TimelineOppositeContent>
                                        {new Date(suspensao.inicio).toLocaleDateString('pt-BR')} - {new Date(suspensao.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </TimelineOppositeContent>
                                    <TimelineSeparator>
                                        <TimelineDot color='warning' sx={{ p: 0}}>
                                            <Pause sx={{ fontSize: 10 }} />
                                        </TimelineDot>
                                        <TimelineConnector />
                                    </TimelineSeparator>
                                    <TimelineContent>
                                        <Card sx={{ width: '100%' }}>
                                            <Typography level="title-md">Início de suspensão</Typography>
                                            <Typography level="body-sm">{suspensao.motivo}</Typography>
                                        </Card>
                                    </TimelineContent>
                                </TimelineItem>
                            </>))
                        }
                        <TimelineItem key={servico.id}>
                            <TimelineOppositeContent>
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
                                        { servico.descricao || servico.status === 1 ? <><Divider/>
                                        <Stack direction="row" spacing={2}>
                                            <FormControl sx={{ flexGrow: 1 }}>
                                                <FormLabel>Descrição</FormLabel>
                                                <Textarea
                                                    minRows={3}
                                                    maxRows={3}
                                                    value={
                                                        index === 0 ? 
                                                            (!servicoAtualDescricao && servicoAtualSalvar ? servico.descricao : servicoAtualDescricao)
                                                        : 
                                                            servico.descricao
                                                    }
                                                    onChange={(event) => {
                                                        if (index === 0)
                                                            setServicoAtualDescricao(event.target.value);
                                                            setServicoAtualSalvar(event.target.value === servico.descricao);
                                                    }}
                                                    disabled={servico.status > 1 || !['TEC'].includes(usuario?.permissao || '')}
                                                />
                                            </FormControl>
                                        </Stack></> : null }
                                    </Stack>
                                    {servico.materiais && servico.materiais.length > 0 ? 
                                        <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                                            <Stack spacing={2}>
                                                <FormLabel>Materiais utilizados</FormLabel>
                                                <List component={Card} variant="outlined" sx={{ borderRadius: 8, p: 1 }}>
                                                    {servico.materiais.map((material: IMaterial, index: number) => (
                                                        <ListItem key={material.id}
                                                            endAction={
                                                                (servico.status === 1 || servico.status === 5) && ['DEV', 'ADM', 'TEC'].includes(usuario?.permissao || '') &&
                                                                <IconButton aria-label="Remover" size="sm" color="danger" variant="soft" onClick={() => {
                                                                    handleRemoverMaterial(material.id);
                                                                }}>
                                                                    <Close />
                                                                </IconButton>
                                                            }
                                                        >
                                                            <ListItemButton sx={{ borderRadius: 8 }}>{material.nome} ({material.quantidade}{material.medida})</ListItemButton>
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Stack>
                                        </CardOverflow>
                                    : null}
                                    {(servico.status === 1 || servico.status === 5) && ['TEC'].includes(usuario?.permissao || '') ?
                                    <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                                        <Stack spacing={2}>
                                            {index === 0 ? <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                {ordem?.suspensaoAtiva ?
                                                    <Button size="sm" variant="solid" color="success" startDecorator={<PlayArrow />} onClick={() => handleRetomar(servico.id)}>
                                                        Retomar serviço
                                                    </Button>                                                    
                                                : <>
                                                    <Button size="sm" variant="solid" color="primary" startDecorator={<Add />} onClick={() => {
                                                        setAdicionaMaterialModal(true);
                                                        setAdicionaMaterialServico(servico.id);
                                                        setNomeMaterial('');
                                                        setQuantidadeMaterial(0);
                                                        setMedidaMaterial('un');
                                                    }}>
                                                        Adicionar material
                                                    </Button>
                                                    <Button size="sm" variant="solid" color="warning" startDecorator={<Pause />} onClick={() => {
                                                        setAdicionaSuspensaoModal(true);
                                                        setMotivoSuspensao('');
                                                        setServicoSuspensao(servico.id);
                                                    }}>
                                                        Pausar serviço
                                                    </Button>
                                                </>}
                                            </Box> : null}
                                        </Stack>
                                    </CardOverflow> : null}
                                    { servico.status === 1 && servico.tecnico_id === usuario?.id ? 
                                        <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                                            <CardActions sx={{ alignSelf: 'flex-end', pt: 2 }}>
                                                <Button disabled={servicoAtualSalvar} size="sm" variant="solid" color="success" onClick={() => handleAtualizar(servico.id)}>
                                                    Salvar
                                                </Button>
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
                        <TimelineOppositeContent>
                                { ordem?.data_solicitacao ? 
                                    `${new Date(ordem?.data_solicitacao).toLocaleDateString('pt-BR')} - ${new Date(ordem?.data_solicitacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` 
                                : 'Chamado novo' }
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                            <TimelineDot color='info' sx={{ p: 0 }}>
                                <Handyman sx={{ fontSize: 10 }} />
                            </TimelineDot>
                            <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                            <Card sx={{ width: '100%' }}>
                                    {ordem && usuario?.permissao !== 'USR' ?
                                    <><Stack direction="row" spacing={2}>
                                        <FormControl sx={{ flexGrow: 1 }}>
                                            <FormLabel>Prioridade</FormLabel>
                                            <Select value={prioridade} onChange={(_, value) => setPrioridade(Number(value))} disabled={ordem.status > 2}>
                                                <Option value={1}>Baixa</Option>
                                                <Option value={2}>Media</Option>
                                                <Option value={3}>Alta</Option>
                                                <Option value={4}>Urgente</Option>
                                            </Select>
                                        </FormControl>
                                    </Stack><Divider/></> : null}
                                    {ordem && ordem.solicitante ? <>
                                        <Stack direction="row" spacing={2}>
                                            <FormControl sx={{ flexGrow: 1 }}>
                                                <FormLabel>Solicitante</FormLabel>
                                                <Input value={ordem.solicitante.nome} disabled />
                                            </FormControl>
                                        </Stack>
                                        <Divider/>
                                    </> : null}
                                    <Stack direction="row" spacing={2}>
                                        <FormControl sx={{ flexGrow: 1 }}>
                                            <FormLabel>Unidade *</FormLabel>
                                            {!ordem ? <Autocomplete
                                                autoFocus
                                                options={unidades}
                                                getOptionLabel={(option) => option && option.sigla}
                                                renderOption={(props, option) => (
                                                  <AutocompleteOption {...props} key={option.id} value={option.id}>
                                                    {option.sigla}
                                                  </AutocompleteOption>
                                                )}
                                                value={unidade_id && unidade_id !== '' ? unidades.find((unidade: IUnidade) => unidade.id === unidade_id) : null}
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
                                            /> : <Input value={ordem && ordem.unidade ? ordem.unidade.sigla : ""} disabled />}
                                            <FormHelperText sx={{ color: 'danger.500' }}>{unidade_idError}</FormHelperText>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>Andar *</FormLabel>
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
                                        <FormControl sx={{ flexGrow: 1 }}>
                                            <FormLabel>Sala *</FormLabel>
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
                                    </Stack>
                                    <Divider />
                                    <Stack direction="row" spacing={2}>
                                        <FormControl sx={{ flexGrow: 1 }}>
                                            <FormLabel>Telefone *</FormLabel>
                                            <Input
                                                size="sm"
                                                type="text"
                                                placeholder="Telefone de contato"
                                                value={telefone}
                                                onChange={(event) => {
                                                    if (event.target.value.length > 0)
                                                        event.target.value = formatarTelefone(event.target.value);
                                                    setTelefone(event.target.value && event.target.value)
                                                    setTelefoneError('');
                                                }}
                                                disabled={id ? true : false}
                                            />
                                            <FormHelperText sx={{ color: 'danger.500' }}>{telefoneError}</FormHelperText>
                                        </FormControl>
                                        <FormControl sx={{ flexGrow: 1 }}>
                                            <FormLabel>Tipo *</FormLabel>
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
                                            <FormLabel>Tratar com</FormLabel>
                                            <Input
                                                size="sm"
                                                type="text"
                                                placeholder="Responsável que irá receber o técnico na unidade"
                                                value={tratar_com}
                                                onChange={(event) => {
                                                    setTratar_com(event.target.value && event.target.value)
                                                }}
                                                disabled={id ? true : false}
                                            />
                                        </FormControl>
                                    </Stack>
                                    <Divider />
                                    <Stack direction="row" spacing={2}>
                                        <FormControl sx={{ flexGrow: 1 }}>
                                            <FormLabel>Descricão do problema *</FormLabel>
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
                                {!ordem || (['DEV', 'ADM', 'TEC'].includes(usuario?.permissao || 'USR') && [1, 2, 5].includes(ordem?.status || 1)) ? 
                                <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                                    <CardActions sx={{ alignSelf: 'flex-end', pt: 2 }}>
                                    {!ordem ? <Button size="sm" variant="outlined" color="neutral" onClick={() => router.back()}>
                                        Cancelar
                                    </Button> : null}
                                    <Button size="sm" variant="solid" color="primary" onClick={handleSubmit}>
                                        Salvar
                                    </Button>
                                    </CardActions>
                                </CardOverflow> : null}
                            </Card>
                        </TimelineContent>
                    </TimelineItem>
                </Timeline>
            </Box>            
        </Content>
    </>);
}
