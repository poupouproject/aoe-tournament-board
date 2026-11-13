import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Valeur par défaut : `npm install` (prisma generate) fonctionne avant la copie du .env.
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
});
