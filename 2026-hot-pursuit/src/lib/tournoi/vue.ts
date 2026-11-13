import { BAREME } from './bareme';
import { calculer, classement, pairesDeRivaux, prochaineManche } from './moteur';
import type { Equipe, Resultat, Tournoi } from './types';

/**
 * Tout ce que le scoreboard affiche, prêt à dessiner.
 *
 * Pur et sérialisable : calculé côté serveur, passé tel quel au composant
 * client. Aucune règle de pointage ici : elles vivent dans le moteur.
 */

export interface LigneClassement {
  id: string;
  nom: string;
  equipe: Equipe | null;
  rivalNom: string | null;
  position: number;
  /** Places gagnées (positif) ou perdues (négatif) à la dernière manche. */
  variation: number;
  points: number;
  /** Gain de la dernière manche. */
  derniere: number;
  /** Retard sur le leader. */
  ecart: number;
  leader: boolean;
  jokerUtilise: boolean;
}

export type CarteProchaine =
  | { type: 'qualif'; trace: string; finale: boolean }
  | {
      type: 'race';
      trace: string;
      finale: boolean;
      cible: string | null;
      jokersRestants: number;
      /** Rattrapage : le dernier au classement choisit le tracé. */
      choisiPar: string | null;
    }
  | { type: 'hp'; trace: string; finale: boolean; cops: Equipe; choisiPar: string | null }
  | {
      type: 'duel';
      trace: string;
      finale: boolean;
      a: string;
      b: string;
      bilan: [number, number];
    };

export interface CoteDuel {
  nom: string;
  equipe: Equipe | null;
  position: number;
  points: number;
}

export interface Rivalite {
  a: string;
  b: string;
  bilan: [number, number];
}

export interface VueScoreboard {
  nbJouees: number;
  nbManches: number;
  /** Bloc de la prochaine manche, ou null si le tournoi est terminé. */
  prochainBloc: string | null;
  prochaine: CarteProchaine | null;
  lignes: LigneClassement[];
  equipes: Record<Equipe, number>;
  rivalites: Rivalite[];
  ticker: string[];
  /** Le prochain duel, ou à défaut la première paire de rivaux ; null avant le tirage. */
  duel: { a: CoteDuel; b: CoteDuel; bilan: [number, number] } | null;
}

export const MESSAGES_FIXES = [
  `Joker : ×${String(BAREME.multiplicateurJoker)} sur une manche, une fois par jour`,
  'Finale : tous les points doublés',
] as const;

export function construireVue(tournoi: Tournoi, resultats: readonly Resultat[]): VueScoreboard {
  const nbJouees = resultats.length;
  const { etats, equipes, journal } = calculer(tournoi, resultats);
  const table = classement(etats);
  const avant = nbJouees > 1 ? classement(calculer(tournoi, resultats, nbJouees - 1).etats) : null;
  const rangAvant = new Map(avant?.map((e, i) => [e.id, i]));

  const joueurs = new Map(tournoi.joueurs.map((j) => [j.id, j]));
  const nom = (id: string): string => joueurs.get(id)?.nom ?? id;
  const position = (id: string): number => table.findIndex((e) => e.id === id) + 1;
  const faceAFace = (id: string): number => etats.get(id)?.faceAFace ?? 0;

  const pointsLeader = table[0]?.points ?? 0;
  const aUnLeader = nbJouees > 0;

  const lignes: LigneClassement[] = table.map((e, i) => {
    const joueur = joueurs.get(e.id);
    const rival = joueur?.rivalId ?? null;
    const precedent = rangAvant.get(e.id);
    return {
      id: e.id,
      nom: nom(e.id),
      equipe: joueur?.equipe ?? null,
      rivalNom: rival ? nom(rival) : null,
      position: i + 1,
      variation: precedent === undefined ? 0 : precedent - i,
      points: e.points,
      derniere: e.derniere,
      ecart: pointsLeader - e.points,
      leader: aUnLeader && i === 0,
      jokerUtilise: e.jokerUtilise,
    };
  });

  const leader = aUnLeader ? (lignes[0] ?? null) : null;
  // Rattrapage : le dernier au classement choisit le tracé, dès qu'il y a un classement.
  const choisiPar = aUnLeader ? (lignes.at(-1)?.nom ?? null) : null;
  const paires = pairesDeRivaux(tournoi.joueurs);
  const rivalites: Rivalite[] = paires.map(([a, b]) => ({
    a: nom(a),
    b: nom(b),
    bilan: [faceAFace(a), faceAFace(b)],
  }));

  // Carte « Prochaine manche »
  const manche = prochaineManche(tournoi, nbJouees);
  let prochaine: CarteProchaine | null = null;
  if (manche) {
    const base = { trace: manche.trace, finale: manche.finale };
    switch (manche.type) {
      case 'qualif':
        prochaine = { ...base, type: 'qualif' };
        break;
      case 'race':
        prochaine = {
          ...base,
          type: 'race',
          cible: leader?.nom ?? null,
          jokersRestants: table.filter((e) => !e.jokerUtilise).length,
          choisiPar,
        };
        break;
      case 'hp':
        prochaine = { ...base, type: 'hp', cops: manche.cops, choisiPar };
        break;
      case 'duel': {
        const paire = paires[manche.duel];
        prochaine = paire
          ? {
              ...base,
              type: 'duel',
              a: nom(paire[0]),
              b: nom(paire[1]),
              bilan: [faceAFace(paire[0]), faceAFace(paire[1])],
            }
          : null;
        break;
      }
    }
  }

  // Vue face-à-face : le prochain duel, sinon la première rivalité.
  const paireDuel = (manche?.type === 'duel' ? paires[manche.duel] : undefined) ?? paires[0];
  const cote = (id: string): CoteDuel => ({
    nom: nom(id),
    equipe: joueurs.get(id)?.equipe ?? null,
    position: position(id),
    points: etats.get(id)?.points ?? 0,
  });
  const duel = paireDuel
    ? {
        a: cote(paireDuel[0]),
        b: cote(paireDuel[1]),
        bilan: [faceAFace(paireDuel[0]), faceAFace(paireDuel[1])] satisfies [number, number],
      }
    : null;

  // Ticker : faits de la dernière manche, grosses remontées, rappels.
  const remontees = lignes
    .filter((l) => l.variation >= 2)
    .map((l) => `${l.nom} grimpe de ${String(l.variation)} places`);
  const ticker = [
    ...journal,
    ...remontees,
    ...(leader
      ? [`${leader.nom} est la cible : +${String(BAREME.prime)} à quiconque finit devant`]
      : []),
    ...MESSAGES_FIXES,
  ];

  return {
    nbJouees,
    nbManches: tournoi.manches.length,
    prochainBloc: manche?.bloc ?? null,
    prochaine,
    lignes,
    equipes,
    rivalites,
    ticker,
    duel,
  };
}
