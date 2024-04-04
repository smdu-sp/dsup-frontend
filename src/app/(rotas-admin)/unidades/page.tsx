'use client'

import Content from '@/components/Content';
import { Suspense, useCallback, useContext, useEffect, useState } from 'react';
import * as unidadeServices from '@/shared/services/unidade.services';
import { Box, Button, ChipPropsColorOverrides, ColorPaletteProp, FormControl, FormLabel, IconButton, Input, Option, Select, Snackbar, Stack, Table, Tooltip, Typography, useTheme } from '@mui/joy';
import { Add, Cancel, Check, Clear, Edit, Refresh, Search, Warning } from '@mui/icons-material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertsContext } from '@/providers/alertsProvider';
import { TablePagination } from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { IPaginadoUnidade, IUnidade } from '@/shared/services/unidade.services';

export default function Unidades(){
  return (
    <Suspense>
      <SearchUnidades />
    </Suspense>
  )
}

function SearchUnidades() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [unidades, setUnidades] = useState<IUnidade[]>([]);
  const [pagina, setPagina] = useState(searchParams.get('pagina') ? Number(searchParams.get('pagina')) : 1);
  const [limite, setLimite] = useState(searchParams.get('limite') ? Number(searchParams.get('limite')) : 10);
  const [total, setTotal] = useState(searchParams.get('total') ? Number(searchParams.get('total')) : 1);
  const [status, setStatus] = useState<string>(searchParams.get('status') ? searchParams.get('status') + '' : 'true');
  const [busca, setBusca] = useState(searchParams.get('busca') || '');

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
  const [confirma, setConfirma] = useState(confirmaVazio);
  const { setAlert } = useContext(AlertsContext);

  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    buscaUnidades();
  }, [ status, pagina, limite ]);
  
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString();
    },
    [searchParams]
  );

  const buscaUnidades = async () => {
    unidadeServices.buscarTudo(status, pagina, limite, busca)
      .then((response: IPaginadoUnidade) => {
        setTotal(response.total);
        setPagina(response.pagina);
        setLimite(response.limite);
        setUnidades(response.data);
      });
  }
  
  const desativaUnidade = async (id: string) => {
    var resposta = await unidadeServices.desativar(id);
    if (resposta){
      setAlert('Unidade desativada!', 'Essa unidade foi desativada e não será exibida para seleção.', 'success', 3000, Check);
      buscaUnidades();
    } else {
      setAlert('Tente novamente!', 'Não foi possível desativar a unidade.', 'warning', 3000, Warning);
    }
    setConfirma(confirmaVazio);
  }

  const mudaPagina = (
    event: React.MouseEvent<HTMLButtonElement> | null,
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

  const confirmaDesativaUnidade = async (id: string) => {
    setConfirma({ 
      aberto: true,
      confirmaOperacao: () => desativaUnidade(id),
      titulo: 'Desativar unidade',
      pergunta: 'Deseja desativar esta unidade?',
      color: 'warning'
    });
  }

  const ativaUnidade = async (id: string) => {
    var resposta = await unidadeServices.ativar(id);
    if (resposta){
      setAlert('Unidade ativada!', 'Essa unidade foi autorizada e será visível para seleção.', 'success', 3000, Check);
      buscaUnidades();
    } else {
      setAlert('Tente novamente!', 'Não foi possível ativar unidade.', 'warning', 3000, Warning);
    }
    setConfirma(confirmaVazio);
  }

  const confirmaAtivaUnidade = async (id: string) => {
    setConfirma({ 
      aberto: true,
      confirmaOperacao: () => ativaUnidade(id),
      titulo: 'Ativar unidade',
      pergunta: 'Deseja ativar esta unidade?',
      color: 'primary'
    });
  }

  const limpaFitros = () => {
    setBusca('');
    setStatus('true');
    setPagina(1);
    setLimite(10);
    router.push(pathname);
    buscaUnidades();
  }

  return (
    <Content
      breadcrumbs={[
        { label: 'Unidades', href: '/unidades' }
      ]}
      titulo='Unidades'
      pagina='unidades'
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
        <IconButton size='sm' onClick={buscaUnidades}><Refresh /></IconButton>
        <IconButton size='sm' onClick={limpaFitros}><Clear /></IconButton>
        <FormControl size="sm">
          <FormLabel>Status: </FormLabel>
          <Select
            size="sm"
            value={status}
            onChange={(_, newValue) => {
              router.push(pathname + '?' + createQueryString('status', String(newValue! || 'true')));
              setStatus(newValue! || 'true');
            }}
          >
            <Option value={'true'}>Ativos</Option>
            <Option value={'false'}>Inativos</Option>
            <Option value={'all'}>Todos</Option>
          </Select>
        </FormControl>
        <FormControl sx={{ flex: 1 }} size="sm">
          <FormLabel>Buscar: </FormLabel>
          <Input
            startDecorator={<Search fontSize='small' />}
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                router.push(pathname + '?' + createQueryString('busca', busca));
                buscaUnidades();
              }
            }}
          />
        </FormControl>
      </Box>
      <Table hoverRow sx={{ tableLayout: 'auto' }}>
        <thead>
          <tr>
            <th>Código</th>
            <th>Sigla</th>
            <th>Nome</th>
            <th style={{ textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {unidades ? unidades.map((unidade) => (
            <tr key={unidade.id} style={{
              cursor: 'pointer',
              backgroundColor: !unidade.status ?
                  theme.vars.palette.danger.plainActiveBg : 
                  undefined
            }}>
              <td onClick={() => router.push('/unidades/detalhes/' + unidade.id)}>{unidade.codigo}</td>
              <td onClick={() => router.push('/unidades/detalhes/' + unidade.id)}>{unidade.sigla}</td>
              <td onClick={() => router.push('/unidades/detalhes/' + unidade.id)}>{unidade.nome}</td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {!unidade.status ? (
                    <Tooltip title="Ativar Unidade" arrow placement="top">
                      <IconButton size="sm" color="success" onClick={() => confirmaAtivaUnidade(unidade.id)}>
                        <Check />
                      </IconButton>
                    </Tooltip>                    
                  ) : (
                    <Tooltip title="Desativar" arrow placement="top">
                      <IconButton title="Desativar" size="sm" color="danger" onClick={() => confirmaDesativaUnidade(unidade.id)}>
                        <Cancel />
                      </IconButton>
                    </Tooltip>
                  )}
                </div>
              </td>
            </tr>
          )) : <tr><td colSpan={4}>Nenhuma unidade encontrada</td></tr>}
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
      <IconButton onClick={() => router.push('/unidades/detalhes/')} color='primary' variant='soft' size='lg' sx={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
      }}><Add /></IconButton>
    </Content>
  );
}