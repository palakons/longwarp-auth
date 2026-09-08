import { PrismaClient } from '@prisma/client';
import { config } from './config';

// Ensure config has normalized process.env.DATABASE_URL
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
  log: config.isProduction ? ['error', 'warn'] : ['query', 'info', 'warn', 'error'],
});

export default prisma;
