import { z } from 'zod';

/**
 * Schémas des données saisies. Ils valident à la fois ce qui arrive de l'écran
 * de saisie et ce qui est relu de la base (colonnes String et JSON).
 */

export const equipeSchema = z.enum(['rouge', 'bleu']);

const idJoueur = z.string().min(1);
const jokers = z.array(idJoueur).optional();

/** Qualifs : classement cumulé des 3 Races, du 1er au dernier. */
export const resultatQualifSchema = z.object({
  type: z.literal('qualif'),
  ordre: z.array(idJoueur).min(2),
  jokers,
});

/** Race : ordre d'arrivée, du 1er au dernier. */
export const resultatRaceSchema = z.object({
  type: z.literal('race'),
  ordre: z.array(idJoueur).min(2),
  jokers,
});

/** Hot Pursuit : position de chaque racer (null = busté), busts par cop, camp gagnant. */
export const resultatHpSchema = z.object({
  type: z.literal('hp'),
  racers: z.array(z.object({ id: idJoueur, position: z.number().int().min(1).max(4).nullable() })),
  busts: z.record(idJoueur, z.number().int().min(0)),
  gagnant: z.enum(['cops', 'racers']),
  jokers,
});

/** Duel Interceptor : gagnant de chaque manche, et bris d'égalité si 1-1. */
export const resultatDuelSchema = z.object({
  type: z.literal('duel'),
  manches: z.array(idJoueur).length(2),
  brisEgalite: idJoueur.optional(),
  jokers,
});

export const resultatSchema = z.discriminatedUnion('type', [
  resultatQualifSchema,
  resultatRaceSchema,
  resultatHpSchema,
  resultatDuelSchema,
]);

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
  z.object({ ...mancheBase, type: z.literal('duel'), duel: z.number().int().min(0) }),
]);
