import { prisma } from "@/shared/lib/prisma";
import { $Enums } from "@prisma/client";

export async function resetDb() {
  await prisma.material.deleteMany();
  await prisma.suspensao.deleteMany();
  await prisma.historicoTecnico.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.ordem.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.unidade.deleteMany();
}

export interface UsuariosSeed {
  unidade: Awaited<ReturnType<typeof prisma.unidade.create>>;
  dev: Awaited<ReturnType<typeof prisma.usuario.create>>;
  adm: Awaited<ReturnType<typeof prisma.usuario.create>>;
  tec: Awaited<ReturnType<typeof prisma.usuario.create>>;
  tec2: Awaited<ReturnType<typeof prisma.usuario.create>>;
  tecInativo: Awaited<ReturnType<typeof prisma.usuario.create>>;
  usr: Awaited<ReturnType<typeof prisma.usuario.create>>;
}

export async function seedBase(): Promise<UsuariosSeed> {
  const unidade = await prisma.unidade.create({
    data: { nome: 'Unidade Teste', sigla: 'UT', codigo: '001' },
  });

  const criar = (login: string, permissao: $Enums.Permissao, status = 1) =>
    prisma.usuario.create({
      data: {
        nome: `Usuario ${login}`,
        login,
        email: `${login}@example.com`,
        permissao,
        status,
        unidade_id: unidade.id,
      },
    });

  // Sequencial: inserts concorrentes nessa tabela colidem (write
  // conflict/deadlock) em MySQL local — mesmo motivo do dsup-backend/test.
  const dev = await criar('cdev', $Enums.Permissao.DEV);
  const adm = await criar('cadm', $Enums.Permissao.ADM);
  const tec = await criar('ctec', $Enums.Permissao.TEC);
  const tec2 = await criar('ctec2', $Enums.Permissao.TEC);
  const tecInativo = await criar('ctecinativo', $Enums.Permissao.TEC, 2);
  const usr = await criar('cusr', $Enums.Permissao.USR);

  return { unidade, dev, adm, tec, tec2, tecInativo, usr };
}
