// Decompõe DATABASE_URL (já exportada no ambiente por load-env.sh) em
// DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME, no mesmo formato
// `CHAVE='valor'` usado por print-env.mjs, para `source <(...)`.
const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("ERRO: DATABASE_URL não está definida no ambiente.");
  process.exit(1);
}

let url;
try {
  url = new URL(raw);
} catch {
  console.error('ERRO: DATABASE_URL não é uma URL válida.');
  process.exit(1);
}

const partes = {
  DB_HOST: url.hostname,
  DB_PORT: url.port || '3306',
  DB_USER: decodeURIComponent(url.username),
  DB_PASS: decodeURIComponent(url.password),
  DB_NAME: url.pathname.replace(/^\//, ''),
};

if (!partes.DB_NAME) {
  console.error('ERRO: DATABASE_URL não contém o nome do banco (path vazio).');
  process.exit(1);
}

for (const [chave, valor] of Object.entries(partes)) {
  const escapado = String(valor).replace(/'/g, `'\\''`);
  console.log(`${chave}='${escapado}'`);
}
