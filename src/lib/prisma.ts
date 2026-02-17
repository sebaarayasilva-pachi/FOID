import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  // Cloud SQL: socket en ?host= o en PGHOST
  const hostMatch = url.match(/\?host=([^&]+)/);
  const pghost = process.env.PGHOST;
  const socketPath = hostMatch
    ? decodeURIComponent(hostMatch[1])
    : pghost?.startsWith('/cloudsql/')
      ? pghost
      : null;
  const isCloudSql = socketPath?.startsWith('/cloudsql/');

  if (isCloudSql && socketPath) {
    const userMatch = url.match(/postgresql:\/\/([^:]+):([^@]+)@/);
    const dbMatch = url.match(/@[^/]+\/([^?]*)/);
    if (userMatch && dbMatch) {
      const user = decodeURIComponent(userMatch[1]);
      const password = decodeURIComponent(userMatch[2]);
      const database = dbMatch[1];
      const poolConfig = {
        host: socketPath,
        database,
        user,
        password,
        max: 10,
      };
      const adapter = new PrismaPg(poolConfig);
      return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }
  }

  return new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
