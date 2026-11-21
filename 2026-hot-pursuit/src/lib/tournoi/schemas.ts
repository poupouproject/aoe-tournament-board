import { z } from 'zod';

/**
 * Schémas des données saisies. Ils valident à la fois ce qui arrive de l'écran
 * de saisie et ce qui est relu de la base (colonnes String et JSON).
 */

export const equipeSchema = z.enum(['rouge', 'bleu']);

const idJoueur = z.string().min(1);
const jokers = z.array(idJoueur).optional();
/**
 * Points de prime donnés par le jeu après la partie (ex. 4576), par joueur.
 * Stockés tels quels ; le moteur ne les compte pas (règle à décider).
 */
const primes = z.record(idJoueur, z.number().int().min(0)).optional();
/** Cops éliminés par chaque racer (colonne « Accidents » de l'écran de fin). */
const accidents = z.record(idJoueur, z.number().int().min(0)).optional();
export const primesSchema = z.record(idJoueur, z.number().int().min(0).max(10_000_000));

/**
 * Qualifs : l'ordre d'arrivée de chaque Race (1 à 3), du 1er au dernier.
 * Le moteur en fait le classement cumulé.
 */
export const resultatQualifSchema = z.object({
  type: z.literal('qualif'),
  races: z.array(z.array(idJoueur).min(2)).min(1).max(3),
  jokers,
  primes,
});

/** Race : ordre d'arrivée, du 1er au dernier. */
export const resultatRaceSchema = z.object({
  type: z.literal('race'),
  ordre: z.array(idJoueur).min(2),
  jokers,
  primes,
});

/** Hot Pursuit : position de chaque racer (null = busté), busts par cop, camp gagnant. */
export const resultatHpSchema = z.object({
  type: z.literal('hp'),
  racers: z.array(z.object({ id: idJoueur, position: z.number().int().min(1).max(4).nullable() })),
  busts: z.record(idJoueur, z.number().int().min(0)),
  gagnant: z.enum(['cops', 'racers']),
  accidents,
  jokers,
  primes,
});

/**
 * Ennemi public n°1 : un Hot Pursuit où l'équipe des racers protège un des
 * siens (l'ennemi public). Seul son sort décide du camp gagnant.
 */
export const resultatEpSchema = z.object({
  type: z.literal('ep'),
  vip: idJoueur,
  echappe: z.boolean(),
  /** Le cop qui a arrêté l'ennemi public, s'il a été arrêté par un joueur. */
  bustVipPar: idJoueur.optional(),
  busts: z.record(idJoueur, z.number().int().min(0)),
  accidents,
  jokers,
  primes,
});

/** Duel Interceptor : gagnant de chaque manche, et bris d'égalité si 1-1. */
export const resultatDuelSchema = z.object({
  type: z.literal('duel'),
  manches: z.array(idJoueur).length(2),
  brisEgalite: idJoueur.optional(),
  jokers,
  primes,
});

export const resultatSchema = z.discriminatedUnion('type', [
  resultatQualifSchema,
  resultatRaceSchema,
  resultatHpSchema,
  resultatEpSchema,
  resultatDuelSchema,
]);

/**
 * Convertit un résultat relu de la base vers le format courant. Les qualifs
 * étaient saisies en un seul ordre cumulé (`ordre`) ; elles deviennent une
 * liste de Races (`races`), dont le cumul redonne le même classement.
 */
export function migrerResultat(brut: unknown): unknown {
  if (
    typeof brut === 'object' &&
    brut !== null &&
    'type' in brut &&
    brut.type === 'qualif' &&
    'ordre' in brut &&
    !('races' in brut)
  ) {
    const { ordre, ...reste } = brut;
    return { ...reste, races: [ordre] };
  }
  return brut;
}

const mancheBase = {
  numero: z.number().int().min(1),
  bloc: z.string(),
  trace: z.string(),
  finale: z.boolean(),
};

export const mancheSchema = z.discriminatedUnion('type', [
  z.object({ ...mancheBase, type: z.literal('qualif') }),
  z.object({ ...mancheBase, type: z.literal('race') }),
  z.object({ ...mancheBase, type: z.literal('hp'), cops: equipeSchema }),
  z.object({ ...mancheBase, type: z.literal('ep'), cops: equipeSchema }),
  z.object({ ...mancheBase, type: z.literal('duel'), duel: z.number().int().min(0) }),
]);
