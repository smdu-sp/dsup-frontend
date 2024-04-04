import Content from '@/components/Content';
import { Card, CardContent, Button, Box, Typography  } from '@mui/joy';
import * as ordemServices from '@/shared/services/ordem.services';
import * as usuarioServices from '@/shared/services/usuario.services';
import { IUsuario } from '@/shared/services/usuario.services';
import { Add, Handyman } from '@mui/icons-material';

export default async function SearchHome() {
  const { abertos, concluidos, naoAtribuidos } = await ordemServices.retornaPainel();
  const { permissao } = await usuarioServices.validaUsuario();

  return permissao === 'USR' ? null : (
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
        <Card color='success' invertedColors variant='plain' sx={{ flexGrow: 0.5, height: '100%', backgroundColor: 'success.300' }}>
          <CardContent>
            <CardContent sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '15rem', color: 'neutral.700' }}>{abertos}</Typography>
              <Typography sx={{ fontSize: '3rem', color: 'neutral.700'}}>Chamados em aberto</Typography>
            </CardContent>
          </CardContent>
        </Card>
        <Card color='danger' invertedColors variant='plain' sx={{ flexGrow: 0.5, backgroundColor: 'danger.300' }}>
          <CardContent>
            <CardContent sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '15rem', color: 'neutral.700' }}>{permissao === 'USR' ? concluidos : naoAtribuidos}</Typography>
              <Typography sx={{ fontSize: '3rem', color: 'neutral.700' }}>Chamados {permissao === 'USR' ? 'concluídos' : 'não atribuídos'}</Typography>
            </CardContent>
          </CardContent>
        </Card>
      </Box>
    </Content>
  );
}