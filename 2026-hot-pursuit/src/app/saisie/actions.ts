'use server';

import { refresh } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { chargerTournoi } from '@/lib/tournoi/donnees';
import { calculer } from '@/lib/tournoi/moteur';
import { resultatSchema } from '@/lib/tournoi/schemas';

export type Retour = { ok: true } | { ok: false; erreur: string };

/**
 * Enregistre le résultat de la prochaine manche à jouer.
 * Le moteur est rejoué avec ce résultat avant l'écriture : une saisie qu'il
 * refuserait (joueur absent d'un duel, égalité sans bris…) n'entre pas en base.
 */
export async function enregistrerResultat(donnees: unknown): Promise<Retour> {
  const lecture = resultatSchema.safeParse(donnees);
  if (!lecture.success) return { ok: false, erreur: 'Saisie invalide.' };
  const resultat = lecture.data;

  const { tournoi, resultats } = await chargerTournoi();
  const manche = tournoi.manches[resultats.length];
  if (!manche) return { ok: false, erreur: 'Le tournoi est terminé.' };
  if (manche.type !== resultat.type) {
    return { ok: false, erreur: `La manche ${String(manche.numero)} est une « ${manche.type} ».` };
  }

  try {
    calculer(tournoi, [...resultats, resultat]);
  } catch (erreur) {
    return { ok: false, erreur: erreur instanceof Error ? erreur.message : String(erreur) };
  }

  await prisma().resultat.create({
    data: { mancheNumero: manche.numero, donnees: JSON.stringify(resultat) },
  });
  refresh();
  return { ok: true };
}

/** Annule la dernière manche saisie (une erreur de saisie va arriver). */
export async function annulerDerniereManche(): Promise<void> {
  const db = prisma();
  const derniere = await db.resultat.findFirst({ orderBy: { mancheNumero: 'desc' } });
  if (derniere) await db.resultat.delete({ where: { mancheNumero: derniere.mancheNumero } });
  refresh();
}
