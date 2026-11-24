// Lê um arquivo .env e imprime cada chave como `CHAVE='valor'` (aspas
// simples, com qualquer aspas simples interna escapada), pronto para ser
// consumido por `source <(...)` em bash sem risco de um valor com `$`,
// backtick ou aspas duplas ser reinterpretado pelo shell.
import { config } from 'dotenv';
import { resolve } from 'path';

const envFile = process.argv[2];
if (!envFile) {
  console.error('Uso: node print-env.mjs <arquivo_env>');
  process.exit(1);
}

const resultado = config({ path: resolve(process.cwd(), envFile), quiet: true });
if (resultado.error) {
  console.error(resultado.error.message);
  process.exit(1);
}

for (const [chave, valor] of Object.entries(resultado.parsed ?? {})) {
  const escapado = String(valor).replace(/'/g, `'\\''`);
  console.log(`${chave}='${escapado}'`);
}
