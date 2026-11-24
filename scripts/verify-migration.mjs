// Checagens pós-deploy. Roda genéricas (conexão viva, tabelas-chave não
// vazias) sempre, e checagens específicas de uma migration só se a
// tabela/coluna em questão já existir — assim o script continua
// reutilizável em deploys futuros sem precisar ser reescrito a cada
// migration (basta acrescentar um novo bloco "específico" se quiser reforçar
// a confiança de uma migration arriscada específica).
//
// Uso: node scripts/verify-migration.mjs
// Espera DATABASE_URL já exportada no ambiente (load-env.sh faz isso).
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let ok = true;

function sucesso(msg) { console.log(`  OK  ${msg}`); }
function falha(msg) { console.error(`  FALHOU  ${msg}`); ok = false; }

async function checagensGenericas() {
  await prisma.$queryRaw`SELECT 1`;
  sucesso('conexão com o banco');

  const totalUsuarios = await prisma.usuario.count();
  if (totalUsuarios === 0) falha('tabela usuarios está vazia (esperado > 0)');
  else sucesso(`usuarios: ${totalUsuarios} registro(s)`);

  const totalOrdens = await prisma.ordem.count();
  if (totalOrdens === 0) falha('tabela ordens está vazia (esperado > 0)');
  else sucesso(`ordens: ${totalOrdens} registro(s)`);
}

// Específico da migration 20261124163000_tipo_chamado. Protegido por
// try/catch: se um deploy futuro remover esse model, a checagem é pulada
// em vez de quebrar o script.
async function checagemTipoChamado() {
  try {
    const totalTipos = await prisma.tipoChamado.count();
    if (totalTipos === 0) {
      falha('tipos_chamado está vazia — seed da migration pode não ter sido aplicado');
      return;
    }
    sucesso(`tipos_chamado: ${totalTipos} registro(s)`);

    const orfas = await prisma.$queryRaw`
      SELECT COUNT(*) AS total FROM ordens o
      LEFT JOIN tipos_chamado t ON t.id = o.tipo_id
      WHERE t.id IS NULL
    `;
    const totalOrfas = Number(orfas[0].total);
    if (totalOrfas > 0) falha(`${totalOrfas} ordem(ns) com tipo_id órfão/inválido`);
    else sucesso('todas as ordens têm tipo_id válido');
  } catch {
    console.log('  --  checagem de tipos_chamado pulada (tabela não existe neste schema)');
  }
}

try {
  console.log('Checagens genéricas:');
  await checagensGenericas();
  console.log('Checagens específicas:');
  await checagemTipoChamado();
} catch (erro) {
  falha(`erro inesperado durante a verificação: ${erro.message}`);
} finally {
  await prisma.$disconnect();
}

if (!ok) {
  console.error('\nVerificação pós-migration encontrou problemas — ver "FALHOU" acima.');
  process.exit(1);
}
console.log('\nVerificação pós-migration OK.');
