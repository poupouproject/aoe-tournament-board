/**
 * Initialise la base : l'horaire des 21 manches et les joueurs.
 *
 *   npm run db:seed   → horaire + 8 joueurs (noms de démo), sans équipes ni résultats
 *   npm run db:demo   → jeu de démo complet de la maquette (équipes, rivaux, 9 manches jouées)
 *
 * Efface tout ce qui existe déjà.
 */

import 'dotenv/config';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { PrismaClient } from '../src/generated/prisma/client';
import { JOUEURS_DEMO, RESULTATS_DEMO } from '../src/lib/tournoi/demo';
import { HORAIRE } from '../src/lib/tournoi/horaire';

const demo = process.argv.includes('--demo');
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL manquant (voir .env.example)');

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

async function main(): Promise<void> {
  await db.$transaction([
    db.resultat.deleteMany(),
    db.manche.deleteMany(),
    db.joueur.deleteMany(),
    db.manche.createMany({
      data: HORAIRE.map((m) => ({
        numero: m.numero,
        type: m.type,
        bloc: m.bloc,
        trace: m.trace,
        finale: m.finale,
        cops: m.type === 'hp' ? m.cops : null,
        duel: m.type === 'duel' ? m.duel : null,
      })),
    }),
    db.joueur.createMany({
      data: JOUEURS_DEMO.map((j) => ({
        ...j,
        equipe: demo ? j.equipe : null,
        rivalId: demo ? j.rivalId : null,
      })),
    }),
    ...(demo
      ? RESULTATS_DEMO.map((r, i) =>
          db.resultat.create({ data: { mancheNumero: i + 1, donnees: JSON.stringify(r) } }),
        )
      : []),
  ]);
  console.log(
    demo
      ? `Démo : ${String(HORAIRE.length)} manches, ${String(RESULTATS_DEMO.length)} jouées.`
      : `Base prête : ${String(HORAIRE.length)} manches, ${String(JOUEURS_DEMO.length)} joueurs.`,
  );
}

main()
  .catch((erreur: unknown) => {
    console.error(erreur);
    process.exitCode = 1;
  })
  .finally(() => void db.$disconnect());
