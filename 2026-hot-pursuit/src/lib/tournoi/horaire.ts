import type { Equipe, Manche } from './types';

/**
 * Horaire par défaut des 21 manches (docs/brief.md, « Déroulement »).
 * Il sert à initialiser la base ; les tracés y restent modifiables.
 */

type SansNumero<T> = T extends Manche ? Omit<T, 'numero'> : never;

const race = (trace: string, bloc: string, finale = false): SansNumero<Manche> => ({
  type: 'race',
  trace,
  bloc,
  finale,
});

/** Hot Pursuit en aller-retour : Rouge joue cop, puis on inverse, sur le même tracé. */
const allerRetour = (trace: string, bloc: string, finale = false): SansNumero<Manche>[] =>
  (['rouge', 'bleu'] satisfies Equipe[]).map((cops) => ({
    type: 'hp',
    trace,
    cops,
    bloc,
    finale,
  }));

const duel = (index: number): SansNumero<Manche> => ({
  type: 'duel',
  duel: index,
  bloc: 'Duels Interceptor',
  trace: 'Meilleur de 2',
  finale: false,
});

export const HORAIRE: readonly Manche[] = [
  { type: 'qualif', bloc: 'Qualifications', trace: '3 Races cumulées', finale: false },
  race('Route côtière', 'Bloc 1'),
  race('Col des Pins', 'Bloc 1'),
  ...allerRetour('Canyon rouge', 'Bloc 1'),
  race('Boucle du port', 'Bloc 2'),
  race('Désert de sel', 'Bloc 2'),
  ...allerRetour('Forêt brumeuse', 'Bloc 2'),
  duel(0),
  duel(1),
  duel(2),
  duel(3),
  race('Falaises du nord', 'Bloc 3'),
  race('Autoroute 9', 'Bloc 3'),
  ...allerRetour('Lac gelé', 'Bloc 3'),
  race('Route côtière', 'Finale', true),
  race('Col des Pins', 'Finale', true),
  ...allerRetour('Grand circuit', 'Finale', true),
].map((manche, i) => ({ ...manche, numero: i + 1 }) as Manche);
