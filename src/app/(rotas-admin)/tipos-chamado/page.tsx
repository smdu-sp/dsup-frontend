'use client'

import Content from '@/components/Content';
import { Suspense, useCallback, useContext, useEffect, useState } from 'react';
import * as tipoChamadoServices from '@/shared/services/tipoChamado.services';
import { Box, Button, Chip, ChipPropsColorOverrides, ColorPaletteProp, FormControl, FormLabel, IconButton, Input, Option, Select, Snackbar, Stack, Table, Tooltip, Typography, useTheme } from '@mui/joy';
import { Add, Cancel, Check, Clear, Refresh, Search, Warning } from '@mui/icons-material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertsContext } from '@/providers/alertsProvider';
import { TablePagination } from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { IPaginadoTipoChamado, ITipoChamado } from '@/shared/services/tipoChamado.services';

export default function TiposChamado(){
  return (
    <Suspense>
      <SearchTiposChamado />
    </Suspense>
  )
}

function SearchTiposChamado() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [tipos, setTipos] = useState<ITipoChamado[] | undefined>([]);
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
    buscaTipos();
    // busca fica de fora de propósito: a busca textual só dispara no Enter
    // (ver buscaTipos/onKeyDown), não a cada tecla digitada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ status, pagina, limite ]);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString();
    },
    [searchParams]
  );

  const buscaTipos = async () => {
    tipoChamadoServices.buscarTudo(status, pagina, limite, busca)
      .then((response: IPaginadoTipoChamado) => {
        setTotal(response.total);
        setPagina(response.pagina);
        setLimite(response.limite);
        setTipos(response.data);
      });
  }

  const desativaTipo = async (id: string) => {
    var resposta = await tipoChamadoServices.desativar(id);
    if (resposta){
      setAlert('Tipo desativado!', 'Esse tipo de chamado foi desativado e não será exibido para seleção.', 'success', 3000, Check);
      buscaTipos();
    } else {
      setAlert('Tente novamente!', 'Não foi possível desativar o tipo de chamado.', 'warning', 3000, Warning);
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

  const confirmaDesativaTipo = async (id: string) => {
    setConfirma({
      aberto: true,
      confirmaOperacao: () => desativaTipo(id),
      titulo: 'Desativar tipo de chamado',
      pergunta: 'Deseja desativar este tipo de chamado?',
      color: 'warning'
    });
  }

  const ativaTipo = async (id: string) => {
    var resposta = await tipoChamadoServices.ativar(id);
    if (resposta){
      setAlert('Tipo ativado!', 'Esse tipo de chamado será exibido para seleção.', 'success', 3000, Check);
      buscaTipos();
    } else {
      setAlert('Tente novamente!', 'Não foi possível ativar o tipo de chamado.', 'warning', 3000, Warning);
    }
    setConfirma(confirmaVazio);
  }

  const confirmaAtivaTipo = async (id: string) => {
    setConfirma({
      aberto: true,
      confirmaOperacao: () => ativaTipo(id),
      titulo: 'Ativar tipo de chamado',
      pergunta: 'Deseja ativar este tipo de chamado?',
      color: 'primary'
    });
  }

  const limpaFitros = () => {
    setBusca('');
    setStatus('true');
    setPagina(1);
    setLimite(10);
    router.push(pathname);
    buscaTipos();
  }

  return (
    <Content
      breadcrumbs={[
        { label: 'Tipos de Chamado', href: '/tipos-chamado' }
      ]}
      titulo='Tipos de Chamado'
      pagina='tipos-chamado'
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
        <IconButton size='sm' onClick={buscaTipos}><Refresh /></IconButton>
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
                buscaTipos();
              }
            }}
          />
        </FormControl>
      </Box>
      <Table hoverRow sx={{ tableLayout: 'auto' }}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Cor</th>
            <th style={{ textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {tipos ? tipos.map((tipo) => (
            <tr key={tipo.id} style={{
              cursor: 'pointer',
              backgroundColor: !tipo.status ?
                  theme.vars.palette.danger.plainActiveBg :
                  undefined
            }}>
              <td onClick={() => router.push('/tipos-chamado/detalhes/' + tipo.id)}>{tipo.nome}</td>
              <td onClick={() => router.push('/tipos-chamado/detalhes/' + tipo.id)}>
                <Chip color={tipo.cor as OverridableStringUnion<ColorPaletteProp, ChipPropsColorOverrides>}>{tipo.nome}</Chip>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {!tipo.status ? (
                    <Tooltip title="Ativar Tipo" arrow placement="top">
                      <IconButton size="sm" color="success" onClick={() => confirmaAtivaTipo(tipo.id)}>
                        <Check />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Desativar" arrow placement="top">
                      <IconButton title="Desativar" size="sm" color="danger" onClick={() => confirmaDesativaTipo(tipo.id)}>
                        <Cancel />
                      </IconButton>
                    </Tooltip>
                  )}
                </div>
              </td>
            </tr>
          )) : <tr><td colSpan={3}>Nenhum tipo de chamado encontrado</td></tr>}
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
      <IconButton onClick={() => router.push('/tipos-chamado/detalhes/')} color='primary' variant='soft' size='lg' sx={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
      }}><Add /></IconButton>
    </Content>
  );
}
