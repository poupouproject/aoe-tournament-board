'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { chargerTournoi } from '@/lib/tournoi/donnees';
import { validerDraft, validerResultat } from '@/lib/tournoi/saisie';
import { equipeSchema, resultatSchema } from '@/lib/tournoi/schemas';

export type Retour = { ok: true } | { ok: false; erreur: string };

const echec = (erreur: string): Retour => ({ ok: false, erreur });

/**
 * Enregistre le résultat de la prochaine manche à jouer. Tout est revérifié
 * ici : l'écran peut avoir été ouvert sur deux téléphones à la fois.
 */
export async function enregistrerResultat(donnees: unknown): Promise<Retour> {
  const lecture = resultatSchema.safeParse(donnees);
  if (!lecture.success) return echec('Saisie invalide.');

  const { tournoi, resultats } = await chargerTournoi();
  const erreur = validerResultat(tournoi, resultats, lecture.data);
  if (erreur) return echec(erreur);

  const manche = tournoi.manches[resultats.length];
  if (!manche) return echec('Le tournoi est terminé.');
  try {
    await prisma().resultat.create({
      data: { mancheNumero: manche.numero, donnees: JSON.stringify(lecture.data) },
    });
  } catch {
    return echec('Cette manche vient d’être saisie sur un autre appareil.');
  }
  refresh();
  return { ok: true };
}

/** Annule la dernière manche saisie (une erreur de saisie va arriver). */
export async function annulerDerniereManche(): Promise<Retour> {
  const db = prisma();
  const derniere = await db.resultat.findFirst({ orderBy: { mancheNumero: 'desc' } });
  if (!derniere) return echec('Aucune manche à annuler.');
  await db.resultat.delete({ where: { mancheNumero: derniere.mancheNumero } });
  refresh();
  return { ok: true };
}

const draftSchema = z.object({
  equipes: z.record(z.string(), equipeSchema),
  rivaux: z.record(z.string(), z.string()),
});

/** Équipes et rivaux, après les qualifs. Figé dès que la manche 2 est jouée. */
export async function enregistrerDraft(donnees: unknown): Promise<Retour> {
  const lecture = draftSchema.safeParse(donnees);
  if (!lecture.success) return echec('Draft invalide.');
  const draft = lecture.data;

  const { tournoi, resultats } = await chargerTournoi();
  if (resultats.length > 1) return echec('Le draft est figé : la journée est commencée.');
  const erreur = validerDraft(tournoi.joueurs, draft);
  if (erreur) return echec(erreur);

  // Les rivalités sont réciproques : on les inscrit des deux côtés.
  const rivalDe = new Map<string, string>();
  for (const [rouge, bleu] of Object.entries(draft.rivaux)) {
    rivalDe.set(rouge, bleu);
    rivalDe.set(bleu, rouge);
  }
  const db = prisma();
  await db.$transaction(
    tournoi.joueurs.map((j) =>
      db.joueur.update({
        where: { id: j.id },
        data: { equipe: draft.equipes[j.id] ?? null, rivalId: rivalDe.get(j.id) ?? null },
      }),
    ),
  );
  refresh();
  return { ok: true };
}

const nomsSchema = z.record(z.string(), z.string().trim().min(1).max(20));

/** Renomme les joueurs (les identifiants ne changent pas). */
export async function renommerJoueurs(donnees: unknown): Promise<Retour> {
  const lecture = nomsSchema.safeParse(donnees);
  if (!lecture.success) return echec('Chaque nom doit avoir entre 1 et 20 caractères.');
  const noms = Object.values(lecture.data).map((n) => n.toLowerCase());
  if (new Set(noms).size !== noms.length) return echec('Deux joueurs ont le même nom.');

  const db = prisma();
  await db.$transaction(
    Object.entries(lecture.data).map(([id, nom]) =>
      db.joueur.update({ where: { id }, data: { nom } }),
    ),
  );
  refresh();
  return { ok: true };
}

const traceSchema = z.object({ numero: z.number().int(), trace: z.string().trim().min(1).max(40) });

/** Change le tracé d'une manche à venir (le dernier au classement choisit). */
export async function changerTrace(donnees: unknown): Promise<Retour> {
  const lecture = traceSchema.safeParse(donnees);
  if (!lecture.success) return echec('Nom de tracé invalide.');
  const { numero, trace } = lecture.data;

  const { resultats } = await chargerTournoi();
  if (numero <= resultats.length) return echec('Cette manche est déjà jouée.');
  await prisma().manche.update({ where: { numero }, data: { trace } });
  refresh();
  return { ok: true };
}
