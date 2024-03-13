'use client'

import Content from '@/components/Content';
import { Button, Card, CardContent, Typography } from '@mui/joy';
import { Box } from '@mui/material';
import { Suspense, useEffect, useState } from 'react';
import * as ordemServices from '@/shared/services/ordem.services';
import * as usuarioServices from '@/shared/services/usuario.services';
import { IUsuario } from '@/shared/services/usuario.services';
import { Add, Handyman } from '@mui/icons-material';

export default function Home() {
  return (
    <Suspense>
      <SearchHome />
    </Suspense>
  )
}

function SearchHome() {
  const [abertos, setAbertos] = useState(0);
  const [naoAtribuidos, setNaoAtribuidos] = useState(0);
  const [concluidos, setConcluidos] = useState(0);
  const [permissao, setPermissao] = useState('USR');

  useEffect(() => {
    ordemServices.retornaPainel()
        .then((response: { abertos: number, naoAtribuidos: number, concluidos: number }) => {
          setAbertos(response.abertos);
          setNaoAtribuidos(response.naoAtribuidos);
          setConcluidos(response.concluidos);
        }).catch((error) => { console.log(error) });
    usuarioServices.validaUsuario().then((response: IUsuario) => {
      setPermissao(response.permissao);
    })
  }, [])

  return (
    <Content
      titulo='Painel de Controle'
      pagina='/'
      button={<Box sx={{ display: 'flex', gap: 1 }}>
        <Button component='a' href='/chamados' startDecorator={<Handyman />}>Chamados</Button>
        <Button component='a' color='success' href='/chamados/detalhes' startDecorator={<Add />}>Novo Chamado</Button>
      </Box>}
    >
      <Box
        sx={{
          display: 'flex',
          height: '100%',
          width: '100%',
          flexDirection: { xs: 'column', sm: 'row' },
          py: 2,
          gap: 1,
        }}
      >
        <Card variant="solid" color="success" invertedColors sx={{ flexGrow: 0.5, height: '100%' }}>
          <CardContent orientation="horizontal">
            <CardContent sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '15rem' }}>{abertos}</Typography>
              <Typography level="body-lg">Chamados em aberto</Typography>
            </CardContent>
          </CardContent>
        </Card>
        <Card variant="solid" color="warning" invertedColors sx={{ flexGrow: 0.5 }}>
          <CardContent orientation="horizontal">
            <CardContent sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '15rem' }}>{permissao === 'USR' ? concluidos : naoAtribuidos}</Typography>
              <Typography level="body-lg" >Chamados {permissao === 'USR' ? 'concluídos' : 'nao atribuidos'}</Typography>
            </CardContent>
          </CardContent>
        </Card>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mx: 'auto' }}>
        
      </Box>
    </Content>
  );
}