import type { z } from 'zod';

import type {
  equipeSchema,
  mancheSchema,
  resultatDuelSchema,
  resultatHpSchema,
  resultatQualifSchema,
  resultatRaceSchema,
  resultatSchema,
} from './schemas';

export type Equipe = z.infer<typeof equipeSchema>;

export interface Joueur {
  id: string;
  nom: string;
  /** Null jusqu'au draft. */
  equipe: Equipe | null;
  /** Null jusqu'au tirage des rivaux. */
  rivalId: string | null;
  ordre: number;
}

export type Manche = z.infer<typeof mancheSchema>;
export type TypeManche = Manche['type'];

export type Resultat = z.infer<typeof resultatSchema>;
export type ResultatQualif = z.infer<typeof resultatQualifSchema>;
export type ResultatRace = z.infer<typeof resultatRaceSchema>;
export type ResultatHp = z.infer<typeof resultatHpSchema>;
export type ResultatDuel = z.infer<typeof resultatDuelSchema>;

/** Tout ce que le moteur doit savoir du tournoi, hors résultats. */
export interface Tournoi {
  joueurs: readonly Joueur[];
  /** Triées par numéro, de 1 à 21. */
  manches: readonly Manche[];
}
