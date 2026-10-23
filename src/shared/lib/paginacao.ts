export function verificaPagina(pagina: number, limite: number) {
  if (!pagina) pagina = 1;
  if (!limite) limite = 10;
  if (pagina < 1) pagina = 1;
  if (limite < 1) limite = 10;
  return [pagina, limite] as const;
}

export function verificaLimite(pagina: number, limite: number, total: number) {
  if ((pagina - 1) * limite >= total) pagina = Math.ceil(total / limite);
  return [pagina, limite] as const;
}
