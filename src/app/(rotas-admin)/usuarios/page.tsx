'use client'

import Content from '@/components/Content';
import { useCallback, useContext, useEffect, useState } from 'react';
import * as usuarioServices from '@/shared/services/usuario.services';
import { Box, Button, Chip, ChipPropsColorOverrides, ColorPaletteProp, FormControl, FormLabel, IconButton, Input, Option, Select, Snackbar, Stack, Table, Tooltip, Typography, useTheme } from '@mui/joy';
import { Cancel, Check, Edit, Search, Warning } from '@mui/icons-material';
import { IPaginadoUsuario, IUsuario } from '@/shared/services/usuario.services';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertsContext } from '@/providers/alertsProvider';
import { TablePagination } from '@mui/material';
import { OverridableStringUnion } from '@mui/types';

export default function Usuarios() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [usuarios, setUsuarios] = useState<IUsuario[]>([]);
  const [pagina, setPagina] = useState(searchParams.get('pagina') ? Number(searchParams.get('pagina')) : 1);
  const [limite, setLimite] = useState(searchParams.get('limite') ? Number(searchParams.get('limite')) : 10);
  const [total, setTotal] = useState(searchParams.get('total') ? Number(searchParams.get('total')) : 1);
  const [status, setStatus] = useState(searchParams.get('status') ? Number(searchParams.get('status')) : 1);
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
    buscaUsuarios();
  }, [ status, pagina, limite ]);
  
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString();
    },
    [searchParams]
  );

  const buscaUsuarios = async () => {
    usuarioServices.buscarTudo(status, pagina, limite, busca)
      .then((response: IPaginadoUsuario) => {
        setTotal(response.total);
        setPagina(response.pagina);
        setLimite(response.limite);
        setUsuarios(response.data);
      });    
  }
  
  const autorizaUsuario = async (id: string) => {
    var resposta = await usuarioServices.autorizar(id);
    if (resposta && resposta.autorizado){
      setAlert('Usuário autorizado!', 'Esse usuário foi autorizado e já pode acessar o sistema.', 'success', 3000, Check);
      buscaUsuarios();
    } else {
      setAlert('Tente novamente!', 'Não foi possível autorizar o usuário.', 'warning', 3000, Warning);
    }
    setConfirma(confirmaVazio);
  }
  
  const desativaUsuario = async (id: string) => {
    var resposta = await usuarioServices.desativar(id);
    if (resposta){
      setAlert('Usuário desativado!', 'Esse usuário foi desativado e não poderá acessar o sistema.', 'success', 3000, Check);
      buscaUsuarios();
    } else {
      setAlert('Tente novamente!', 'Não foi possível desativar o usuário.', 'warning', 3000, Warning);
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

  const confirmaAutorizaUsuario = async (id: string) => {
    setConfirma({ 
      aberto: true,
      confirmaOperacao: () => autorizaUsuario(id),
      titulo: 'Autorizar usuário',
      pergunta: 'Deseja autorizar este usuário?',
      color: 'primary'
    });
  }

  const confirmaDesativaUsuario = async (id: string) => {
    setConfirma({ 
      aberto: true,
      confirmaOperacao: () => desativaUsuario(id),
      titulo: 'Desativar usuário',
      pergunta: 'Deseja desativar este usuário?',
      color: 'warning'
    });
  }

  const permissoes: Record<string, { label: string, value: string, color: OverridableStringUnion<ColorPaletteProp, ChipPropsColorOverrides> | undefined }> = {
    'DEV': { label: 'Desenvolvedor', value: 'DEV', color: 'primary' },
    'TEC': { label: 'Técnico', value: 'TEC', color: 'neutral' },
    'ADM': { label: 'Administrador', value: 'ADM', color: 'success' },
    'USR': { label: 'Usuário', value: 'USR', color: 'warning' },
  }

  return (
    <Content
      breadcrumbs={[
        { label: 'Usuários', href: '/usuarios' }
      ]}
      titulo='Usuários'
      pagina='usuarios'
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
        }}
      >
        <FormControl size="sm">
          <FormLabel>Status: </FormLabel>
          <Select
            size="sm"
            value={status}
            onChange={(event, newValue) => {
              router.push(pathname + '?' + createQueryString('status', String(newValue! || 1)));
              setStatus(newValue! || 1);
            }}
          >
            <Option value={1}>Ativos</Option>
            <Option value={2}>Inativos</Option>
            <Option value={3}>Esperando autorização</Option>
            <Option value={4}>Todos</Option>
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
                buscaUsuarios();
              }
            }}
          />
        </FormControl>
      </Box>
      <Table hoverRow>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Usuário</th>
            <th></th>
            <th style={{ textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {usuarios ? usuarios.map((usuario) => (
            <tr key={usuario.id} style={{
              cursor: 'pointer',
              backgroundColor: usuario.status === 3 ? 
                theme.vars.palette.warning.plainActiveBg : 
                usuario.status === 2 ? 
                  theme.vars.palette.danger.plainActiveBg : 
                  undefined
            }}>
              <td>{usuario.nome}</td>
              <td>{usuario.login}</td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>         
                  <Chip color={permissoes[usuario.permissao].color} size='sm'>{permissoes[usuario.permissao].label}</Chip>
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {usuario.status !== 1 && (
                    <Tooltip title="Aprovar usuário novo" arrow placement="top">
                      <IconButton size="sm" color="success" onClick={() => confirmaAutorizaUsuario(usuario.id)}>
                        <Check />
                      </IconButton>
                    </Tooltip>                    
                  )}
                  <Tooltip title="Detalhes" arrow placement="top">
                    <IconButton component="a" href={`/usuarios/${usuario.id}`} size="sm" color="warning">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Desativar" arrow placement="top">
                    <IconButton title="Desativar" size="sm" color="danger" onClick={() => confirmaDesativaUsuario(usuario.id)}>
                      <Cancel />
                    </IconButton>
                  </Tooltip>
                </div>
              </td>
            </tr>
          )) : <tr><td colSpan={4}>Nenhum usuário encontrado</td></tr>}
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