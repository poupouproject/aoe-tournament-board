import 'server-only';

import { connection } from 'next/server';

import { prisma } from '@/lib/prisma';

import { equipeSchema, mancheSchema, migrerResultat, resultatSchema } from './schemas';
import type { Joueur, Manche, Resultat, Tournoi } from './types';

export interface EtatTournoi {
  tournoi: Tournoi;
  /** Résultats des manches jouées, dans l'ordre : l'index i est la manche i + 1. */
  resultats: Resultat[];
}

/** Lit joueurs, horaire et résultats, et les valide avant de les donner au moteur. */
export async function chargerTournoi(): Promise<EtatTournoi> {
  // better-sqlite3 est synchrone : sans ceci, Next figerait la page au build.
  await connection();

  const db = prisma();
  const [lignesJoueurs, lignesManches] = await Promise.all([
    db.joueur.findMany({ orderBy: { ordre: 'asc' } }),
    db.manche.findMany({ orderBy: { numero: 'asc' }, include: { resultat: true } }),
  ]);

  const joueurs: Joueur[] = lignesJoueurs.map((j) => ({
    id: j.id,
    nom: j.nom,
    equipe: j.equipe === null ? null : equipeSchema.parse(j.equipe),
    rivalId: j.rivalId,
    ordre: j.ordre,
  }));

  const manches: Manche[] = lignesManches.map((m) => mancheSchema.parse(m));

  const resultats: Resultat[] = [];
  for (const m of lignesManches) {
    if (!m.resultat) break;
    resultats.push(resultatSchema.parse(migrerResultat(JSON.parse(m.resultat.donnees))));
  }
  const saisis = lignesManches.filter((m) => m.resultat).length;
  if (saisis !== resultats.length) {
    throw new Error('Résultats non contigus : une manche a été sautée dans la saisie.');
  }

  return { tournoi: { joueurs, manches }, resultats };
}
