This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Arquitetura

App "fullstack": não há backend separado. `src/shared/services/*.services.ts`
são Server Actions que acessam o banco direto via Prisma (`src/shared/lib/prisma.ts`),
sem passar por nenhuma API HTTP. Autenticação em `src/shared/auth/authOptions.ts`
(NextAuth, sessão JWT nativa). O antigo `dsup-backend` (NestJS) foi
descontinuado — a lógica de cada módulo dele foi portada 1:1 pra cá.

Dois bancos MySQL via Prisma:
- `prisma/schema.prisma` — banco principal da aplicação (`DATABASE_URL`).
- `sgu/schema.prisma` — banco institucional legado, só leitura (`SGU_DATABASE_URL`),
  gerado num client separado (`@prisma/sgu/client`).

`npm run postinstall` regenera os dois clients Prisma — rode manualmente
(`npm run postinstall`) se `node_modules/@prisma/sgu/client` sumir depois de
um `npm install`.

**Testes**: `npm run test:integration` (Jest, contra um banco de teste MySQL
descartável — configure `.env.test.local`) e `npm run test:e2e` (Playwright).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
