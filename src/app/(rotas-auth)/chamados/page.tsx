'use client'

import Content from '@/components/Content';
import { Suspense, useCallback, useContext, useEffect, useState } from 'react';
import { Autocomplete, Box, Button, Chip, ChipPropsColorOverrides, ColorPaletteProp, FormControl, FormLabel, IconButton, Option, Select, Snackbar, Stack, Table, Tooltip, Typography, useTheme } from '@mui/joy';
import { Build, Check, Clear, Edit, Refresh } from '@mui/icons-material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertsContext } from '@/providers/alertsProvider';
import { TablePagination } from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { IUnidade } from '@/shared/services/unidade.services';
import { IOrdem, IPaginadoOrdem } from '@/shared/services/ordem.services';
import * as ordemServices from '@/shared/services/ordem.services';
import * as unidadeServices from '@/shared/services/unidade.services';
import * as usuarioServices from '@/shared/services/usuario.services';
import * as servicoServices from '@/shared/services/servico.services';
import { IUsuario } from '@/shared/services/usuario.services';

export default function Chamados(){
  return (
    <Suspense>
      <SearchChamados />
    </Suspense>
  )
}

function SearchChamados() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { setAlert } = useContext(AlertsContext);
  const [ordens, setOrdens] = useState<IOrdem[]>([]);
  const [pagina, setPagina] = useState(searchParams.get('pagina') ? Number(searchParams.get('pagina')) : 1);
  const [limite, setLimite] = useState(searchParams.get('limite') ? Number(searchParams.get('limite')) : 10);
  const [total, setTotal] = useState(searchParams.get('total') ? Number(searchParams.get('total')) : 1);
  const [status, setStatus] = useState<number>(searchParams.get('status') ? Number(searchParams.get('status')) : 0);
  const [unidade_id, setUnidade_id] = useState(searchParams.get('unidade_id') || '');
  const [solicitante_id, setSolicitante_id] = useState(searchParams.get('solicitante_id') || '');
  const [unidades, setUnidades] = useState<IUnidade[]>([]);
  const [usuarios, setUsuarios] = useState<IUsuario[]>([]);
  const [logado, setLogado] = useState<IUsuario>();
  const [tipo, setTipo] = useState(searchParams.get('tipo') ? Number(searchParams.get('tipo')) : 0);

  const confirmaVazio: {
    aberto: boolean,
    confirmaOperacao: () => void,
    titulo: string,
    pergunta: string,
    color: OverridableStringUnion<ColorPaletteProp, ChipPropsColorOverrides>
  } = {
    aberto: false,
    confirmaOperacao: () => {},
    titulo: '',
    pergunta: '',
    color: 'primary'
  }

  const tipos: { label: string, color: OverridableStringUnion<ColorPaletteProp, ChipPropsColorOverrides> | undefined }[]  = [
    { label: '', color: 'neutral' },
    { label: 'Elétrica', color: 'primary' },
    { label: 'Hidráulica', color: 'warning' },
    { label: 'Telefonia', color: 'success' },
    { label: 'Outros', color: 'neutral' },
  ]

  const prioridades: { label: string, color: OverridableStringUnion<ColorPaletteProp, ChipPropsColorOverrides> | undefined }[]  = [
    { label: '', color: 'neutral' },
    { label: 'Baixa', color: 'neutral' },
    { label: 'Média', color: 'success' },
    { label: 'Alta', color: 'warning' },
    { label: 'Urgente', color: 'danger' },
  ]

  const statusChip: { label: string, color: OverridableStringUnion<ColorPaletteProp, ChipPropsColorOverrides> | undefined }[]  = [
    { label: '', color: 'neutral' },
    { label: 'Aberto', color: 'neutral' },
    { label: 'Em andamento', color: 'primary' },
    { label: 'Aguardando avaliação', color: 'warning' },
    { label: 'Concluído', color: 'success' },
  ]

  const [confirma, setConfirma] = useState(confirmaVazio);
  const router = useRouter();

  useEffect(() => {
    unidadeServices.listaCompleta()
        .then((response: IUnidade[]) => {
            setUnidades(response);
        })
    usuarioServices.listaCompleta()
        .then((response: IUsuario[]) => {
            setUsuarios(response);
        })
    usuarioServices.validaUsuario()
        .then((response: IUsuario) => {
            setLogado(response);
        })
  }, [])

  useEffect(() => {
    buscaOrdens();
  }, [ status, pagina, limite, unidade_id, solicitante_id, tipo ]);
  
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString();
    },
    [searchParams]
  );

  const buscaOrdens = async () => {
    ordemServices.buscarTudo(status, pagina, limite, unidade_id, solicitante_id, 0, '', tipo)
      .then((response: IPaginadoOrdem) => {
        setOrdens(response.data);
        setTotal(response.total);
        setPagina(response.pagina);
        setLimite(response.limite);
      });
  }

  const mudaPagina = (
    _: React.MouseEvent<HTMLButtonElement> | null,
    novaPagina: number,
  ) => {
    router.push(pathname + '?' + createQueryString('pagina', String(novaPagina + 1)));
    setPagina(novaPagina + 1);
  };

  const mudaLimite = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    router.push(pathname + '?' + createQueryString('limite', String(event.target.value)));
    setLimite(parseInt(event.target.value, 10));
    setPagina(1);
  };

  function atribuirChamado(id: string, tecnico_id?: string){
    console.log('chamou');
    servicoServices.criar({ ordem_id: id, tecnico_id }).then(() => {
      if (!tecnico_id) {
        setAlert('Chamado atribuído!', 'Chamado atribuído com sucesso!', 'success', 3000, Check);
      }
    })
  }

  const limpaFitros = () => {
    setStatus(1);
    setPagina(1);
    setLimite(10);
    setUnidade_id('');
    setSolicitante_id('');
    setTipo(0);
    router.push(pathname);
    buscaOrdens();
  }

  return (
    <Content
      breadcrumbs={[
        { label: 'Chamados', href: '/chamados' }
      ]}
      titulo='Chamados'
      pagina='chamados'
      button={
        <Button onClick={() => router.push('/chamados/detalhes/')} color='primary' size='lg'>
          Novo Chamado
        </Button>
      }
    >
      <Snackbar
        variant="solid"
        color={confirma.color}
        size="lg"
        invertedColors
        open={confirma.aberto}
        onClose={() => setConfirma({ ...confirma, aberto: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ maxWidth: 360 }}
      >
        <div>
          <Typography level="title-lg">{confirma.titulo}</Typography>
          <Typography sx={{ mt: 1, mb: 2 }} level="title-md">{confirma.pergunta}</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="solid" color="primary" onClick={() => confirma.confirmaOperacao()}>
              Sim
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setConfirma(confirmaVazio)}
            >
              Não
            </Button>
          </Stack>
        </div>
      </Snackbar>
      <Box
        className="SearchAndFilters-tabletUp"
        sx={{
          borderRadius: 'sm',
          py: 2,
          display: { xs: 'none', sm: 'flex' },
          flexWrap: 'wrap',
          gap: 1.5,
          '& > *': {
            minWidth: { xs: '120px', md: '160px' },
          },
          alignItems: 'end',
        }}
      >
        <IconButton size='sm' title='Atualizar' onClick={buscaOrdens}><Refresh /></IconButton>
        <IconButton size='sm' title='Limpar Filtros' onClick={limpaFitros}><Clear /></IconButton>
        <FormControl size="sm">
          <FormLabel>Status: </FormLabel>
          <Select
            size="sm"
            value={status}
            onChange={(_, newValue) => {
              router.push(pathname + '?' + createQueryString('status', String(newValue || newValue === 0 ? newValue : 1)));
              setStatus(newValue || newValue === 0 ? newValue : 1);
            }}
          >
            <Option value={1}>Aberto</Option>
            <Option value={2}>Em andamento</Option>
            <Option value={3}>Aguardando validação</Option>
            <Option value={4}>Concluído</Option>
            <Option value={0}>Todos</Option>
          </Select>
        </FormControl>
        <FormControl>
            <FormLabel>Tipo</FormLabel>
            <Select
                size="sm"
                value={tipo}
                onChange={(_, newValue) => {
                  router.push(pathname + '?' + createQueryString('tipo', String(newValue || newValue === 0 ? newValue : 1)));
                  setTipo(newValue || newValue === 0 ? newValue : 1);
                }}
                placeholder="Tipo de chamado"
            >
                <Option value={0}>Todos</Option>
                <Option value={1}>Elétrica</Option>
                <Option value={2}>Hidráulica</Option>
                <Option value={3}>Telefonia</Option>
                <Option value={4}>Outros</Option>
            </Select>
        </FormControl>
        {!logado || logado?.permissao === 'USR' ? null : (<>
          <FormControl sx={{ flex: 1 }} size="sm">
          <FormLabel>Unidade: </FormLabel>
          <Autocomplete
              options={unidades}
              getOptionLabel={(option) => option && `${option.sigla}`}
              placeholder="Unidade"
              value={unidade_id && unidades.find((unidade: IUnidade) => unidade.id === unidade_id)}
              onChange={(_, value) => {
                router.push(pathname + '?' + createQueryString('unidade_id', value ? value.id : ''));
                setUnidade_id(value ? value.id : '');
              }}
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
        <FormControl sx={{ flex: 1 }} size="sm">
          <FormLabel>Solicitante: </FormLabel>
          <Autocomplete
              options={usuarios}
              getOptionLabel={(option) => option && `${option.sigla}`}
              placeholder="Solicitante"
              value={solicitante_id && usuarios.find((usuario: IUsuario) => usuario.id === solicitante_id)}
              onChange={(_, value) => {
                router.push(pathname + '?' + createQueryString('solicitante_id', value ? value.id : ''));
                setSolicitante_id(value ? value.id : '') ;
              }}
              filterOptions={(options, { inputValue }) => {
                  if (usuarios) return (options as IUsuario[]).filter((option) => (
                      (option).nome.toLowerCase().includes(inputValue.toLowerCase()) || 
                      (option).login.toLowerCase().includes(inputValue.toLowerCase()) || 
                      (option).email.toLowerCase().includes(inputValue.toLowerCase())
                  ));
                  return [];
              }}
              noOptionsText="Nenhuma unidade encontrada"
          />
        </FormControl></>)}
      </Box>
      <Table hoverRow sx={{ tableLayout: 'auto' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Status</th>
            <th>Data</th>
            <th>Solicitante</th>
            <th>Unidade</th>
            <th>Tipo</th>
            <th style={{ textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {ordens && ordens.length > 0 ? ordens.map((ordem) => (
            <Tooltip key={ordem.id} title={ordem.observacoes} sx={{ maxWidth: '200px' }} arrow placement="bottom">
              <tr key={ordem.id}>
                <td><Chip variant='solid' color={prioridades[ordem.prioridade].color} title={prioridades[ordem.prioridade].label}>{ordem.id ? ordem.id : '-'}</Chip></td>
                <td><Chip variant='solid' color={statusChip[ordem.status].color} title={statusChip[ordem.status].label}>{ordem.status ? statusChip[ordem.status].label : '-'}</Chip></td>
                <td>{new Date(ordem.data_solicitacao).toLocaleDateString('pt-BR')} - {new Date(ordem.data_solicitacao).toLocaleTimeString('pt-BR')}</td>
                <td>{ordem.solicitante ? ordem.solicitante.nome : '-'}</td>
                <td>{ordem.unidade && <Chip onClick={() => {
                  setUnidade_id(ordem.unidade_id);
                  router.push(pathname + '?' + createQueryString('unidade_id', ordem.unidade_id));
                }} variant='outlined' color='neutral' title={ordem.unidade.nome}>{ordem.unidade.sigla}</Chip>}</td>
                <td><Chip onClick={() => {
                  setTipo(ordem.tipo);
                  router.push(pathname + '?' + createQueryString('tipo', String(ordem.tipo)));
                }} color={tipos[ordem.tipo].color}>{tipos[ordem.tipo].label}</Chip></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    {['TEC'].includes(logado ? logado.permissao : '') && ordem.status === 1 ?
                      <Tooltip title="Assumir Chamado" arrow placement="top">
                        <IconButton onClick={() => atribuirChamado(ordem.id)} size="sm" color="primary">
                          <Build />
                        </IconButton>
                      </Tooltip> : 
                    null}
                    <Tooltip title="Detalhes" arrow placement="top">
                      <IconButton component="a" href={`/chamados/detalhes/${ordem.id}`} size="sm" color="warning">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            </Tooltip>
          )) : <tr><td colSpan={7}>Nenhuma chamado encontrado</td></tr>}
        </tbody>
      </Table>
      {(total && total > 0) ? <TablePagination
        component="div"
        count={total}
        page={(pagina - 1)}
        onPageChange={mudaPagina}
        rowsPerPage={limite}
        onRowsPerPageChange={mudaLimite}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="Registros por página"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
      /> : null}
    </Content>
  );
}