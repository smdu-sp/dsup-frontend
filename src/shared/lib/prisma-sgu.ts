import { PrismaClient } from '@prisma/sgu/client';

const globalForPrismaSgu = globalThis as unknown as { prismaSgu?: PrismaClient };

export const prismaSgu = globalForPrismaSgu.prismaSgu ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrismaSgu.prismaSgu = prismaSgu;
