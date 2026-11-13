import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { PrismaClient } from '@/generated/prisma/client';

/**
 * Depuis Prisma 7, la connexion passe obligatoirement par un driver adapter.
 * L'URL pointe vers un fichier SQLite (`file:./dev.db`).
 */
function creerClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL manquant. Attendu par exemple : file:./dev.db');
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

// En dev, Next recharge les modules à chaque édition : sans ce cache global, on
// ouvrirait une nouvelle connexion SQLite à chaque rechargement.
const globalPourPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Le client est construit à la première requête, pas à l'import : `next build`
 * peut ainsi charger les modules sans DATABASE_URL.
 */
export function prisma(): PrismaClient {
  globalPourPrisma.prisma ??= creerClient();
  return globalPourPrisma.prisma;
}
