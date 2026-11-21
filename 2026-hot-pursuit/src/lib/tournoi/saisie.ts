import { adversaire, calculer, classement, pairesDeRivaux, prochaineManche } from './moteur';
import type { Equipe, Joueur, Manche, Resultat, Tournoi } from './types';

/**
 * Logique de l'écran de saisie : ce qu'il faut saisir maintenant, et la
 * validation de ce qui est saisi. Pur et sérialisable, comme le moteur.
 */

export interface JoueurSaisie {
  id: string;
  nom: string;
  equipe: Equipe | null;
  rivalId: string | null;
  /** Joker encore en poche (et manche hors finale). */
  jokerDisponible: boolean;
}

/** Où en est le draft : à faire avant la prochaine manche, encore modifiable, ou figé. */
export type EtatDraft = 'requis' | 'modifiable' | 'verrouille' | 'apres-qualifs';

export interface ContexteSaisie {
  nbJouees: number;
  nbManches: number;
  manche: Manche | null;
  joueurs: JoueurSaisie[];
  /** Duel : les deux rivaux [rouge, bleu]. */
  duel: [string, string] | null;
  draft: EtatDraft;
  /** Les 2 premiers des qualifs : capitaines au draft (Rouge, puis Bleu). */
  capitaines: { id: string; nom: string }[];
  /** Points de prime du jeu déjà saisis pour la dernière manche jouée. */
  primesDerniere: Record<string, number>;
}

/** Le draft est complet quand tout le monde a une équipe et un rival. */
export function draftComplet(joueurs: readonly Joueur[]): boolean {
  return joueurs.length > 0 && joueurs.every((j) => j.equipe !== null && j.rivalId !== null);
}

export function contexteSaisie(tournoi: Tournoi, resultats: readonly Resultat[]): ContexteSaisie {
  const { etats } = calculer(tournoi, resultats);
  const manche = prochaineManche(tournoi, resultats.length);
  const jokersPermis = manche !== null && !manche.finale;

  const complet = draftComplet(tournoi.joueurs);
  let draft: EtatDraft;
  if (resultats.length === 0) draft = 'apres-qualifs';
  else if (resultats.length === 1) draft = complet ? 'modifiable' : 'requis';
  else draft = 'verrouille';

  const paires = pairesDeRivaux(tournoi.joueurs);
  return {
    nbJouees: resultats.length,
    nbManches: tournoi.manches.length,
    manche,
    joueurs: [...tournoi.joueurs]
      .sort((a, b) => a.ordre - b.ordre)
      .map((j) => ({
        id: j.id,
        nom: j.nom,
        equipe: j.equipe,
        rivalId: j.rivalId,
        jokerDisponible: jokersPermis && !(etats.get(j.id)?.jokerUtilise ?? false),
      })),
    duel: manche?.type === 'duel' ? (paires[manche.duel] ?? null) : null,
    draft,
    capitaines:
      resultats.length > 0
        ? classement(calculer(tournoi, resultats, 1).etats)
            .slice(0, 2)
            .map((e) => ({
              id: e.id,
              nom: tournoi.joueurs.find((j) => j.id === e.id)?.nom ?? e.id,
            }))
        : [],
    primesDerniere: resultats[resultats.length - 1]?.primes ?? {},
  };
}

/** Les joueurs d'une équipe, dans l'ordre. */
export function membres(joueurs: readonly JoueurSaisie[], equipe: Equipe): JoueurSaisie[] {
  return joueurs.filter((j) => j.equipe === equipe);
}

/** Hot Pursuit : les racers gagnent si au moins un s'échappe. */
export function gagnantHpParDefaut(positions: readonly (number | null)[]): 'cops' | 'racers' {
  return positions.some((p) => p !== null) ? 'racers' : 'cops';
}

const memesElements = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && new Set(a).size === a.length && a.every((x) => b.includes(x));

/**
 * Vérifie un résultat avant de l'enregistrer. Renvoie un message clair pour
 * l'écran de saisie, ou null si tout est bon.
 */
export function validerResultat(
  tournoi: Tournoi,
  resultats: readonly Resultat[],
  resultat: Resultat,
): string | null {
  const manche = prochaineManche(tournoi, resultats.length);
  if (!manche) return 'Le tournoi est terminé.';
  if (manche.type !== resultat.type) {
    return `La manche ${String(manche.numero)} n'est pas de ce type. Rechargez la page.`;
  }

  const ids = tournoi.joueurs.map((j) => j.id);
  const equipe = (id: string): Equipe | null =>
    tournoi.joueurs.find((j) => j.id === id)?.equipe ?? null;
  let participants = ids;

  switch (resultat.type) {
    case 'qualif':
      for (const [i, race] of resultat.races.entries()) {
        if (!memesElements(race, ids)) {
          return `Race ${String(i + 1)} : placez chaque pilote une seule fois.`;
        }
      }
      if (resultat.jokers?.length) return 'Pas de joker en qualifs.';
      break;

    case 'race':
      if (!memesElements(resultat.ordre, ids)) return 'Placez chaque pilote une seule fois.';
      break;

    case 'hp': {
      if (manche.type !== 'hp') break;
      const racers = ids.filter((id) => equipe(id) === adversaire(manche.cops));
      const cops = ids.filter((id) => equipe(id) === manche.cops);
      if (racers.length === 0) return "Le draft n'est pas fait : les équipes sont vides.";
      if (
        !memesElements(
          resultat.racers.map((r) => r.id),
          racers,
        )
      ) {
        return 'Chaque racer doit avoir un résultat.';
      }
      const positions = resultat.racers
        .map((r) => r.position)
        .filter((p): p is number => p !== null)
        .sort((a, b) => a - b);
      if (positions.some((p, i) => p !== i + 1)) return 'Positions des racers incohérentes.';
      const busts = Object.entries(resultat.busts);
      if (busts.some(([id]) => !cops.includes(id))) return 'Seuls les cops font des busts.';
      const totalBusts = busts.reduce((s, [, n]) => s + n, 0);
      const bustes = resultat.racers.length - positions.length;
      if (totalBusts > bustes) {
        return `${String(totalBusts)} busts pour ${String(bustes)} racer${bustes > 1 ? 's' : ''} busté${bustes > 1 ? 's' : ''} : vérifiez.`;
      }
      break;
    }

    case 'ep': {
      if (manche.type !== 'ep') break;
      const cops = ids.filter((id) => equipe(id) === manche.cops);
      if (equipe(resultat.vip) !== adversaire(manche.cops)) {
        return "L'ennemi public doit être dans l'équipe des racers.";
      }
      if (Object.keys(resultat.busts).some((id) => !cops.includes(id))) {
        return 'Seuls les cops font des busts.';
      }
      if (resultat.echappe && resultat.bustVipPar) {
        return "L'ennemi public ne peut pas s'échapper et être arrêté.";
      }
      if (resultat.bustVipPar && !cops.includes(resultat.bustVipPar)) {
        return "Seul un cop peut arrêter l'ennemi public.";
      }
      break;
    }

    case 'duel': {
      if (manche.type !== 'duel') break;
      const paire = pairesDeRivaux(tournoi.joueurs)[manche.duel];
      if (!paire) return "Les rivaux ne sont pas tirés : faites d'abord le draft.";
      participants = paire;
      if (resultat.manches.some((id) => !paire.includes(id))) {
        return 'Choisissez le gagnant de chaque manche.';
      }
      const [a, b] = resultat.manches;
      if (a !== b && (!resultat.brisEgalite || !paire.includes(resultat.brisEgalite))) {
        return '1 à 1 : choisissez le gagnant du bris d’égalité.';
      }
      break;
    }
  }

  if ((resultat.type === 'hp' || resultat.type === 'ep') && resultat.accidents) {
    const cops = manche.type === 'hp' || manche.type === 'ep' ? manche.cops : null;
    if (Object.keys(resultat.accidents).some((id) => equipe(id) === cops)) {
      return 'Seuls les racers éliminent des cops.';
    }
  }

  if (resultat.jokers?.length) {
    if (manche.finale) return 'Les jokers sont interdits en finale.';
    const { etats } = calculer(tournoi, resultats);
    for (const id of resultat.jokers) {
      if (!participants.includes(id)) return 'Un joker ne vaut que pour un pilote de la manche.';
      if (etats.get(id)?.jokerUtilise) {
        const nom = tournoi.joueurs.find((j) => j.id === id)?.nom ?? id;
        return `${nom} a déjà utilisé son joker.`;
      }
    }
  }

  try {
    calculer(tournoi, [...resultats, resultat]);
  } catch (erreur) {
    return erreur instanceof Error ? erreur.message : String(erreur);
  }
  return null;
}

/**
 * Tire les rivaux au sort : chaque rouge reçoit un bleu différent. Avec des
 * équipes inégales (7 joueurs), un joueur de la plus grande équipe, tiré au
 * sort lui aussi, reste sans rival.
 */
export function tirerRivaux(
  rouges: readonly string[],
  bleus: readonly string[],
  aleatoire: () => number = Math.random,
): Record<string, string> {
  const melange: (string | null)[] = [
    ...bleus,
    ...Array.from({ length: Math.max(0, rouges.length - bleus.length) }, () => null),
  ];
  for (let i = melange.length - 1; i > 0; i--) {
    const j = Math.floor(aleatoire() * (i + 1));
    [melange[i], melange[j]] = [melange[j] ?? null, melange[i] ?? null];
  }
  return Object.fromEntries(
    rouges.flatMap((r, i) => {
      const bleu = melange[i];
      return bleu ? [[r, bleu]] : [];
    }),
  );
}

/** Deux équipes de même taille, ou à un joueur près quand le nombre est impair. */
export function equipesValides(nbRouges: number, nbBleus: number): boolean {
  return nbRouges > 0 && nbBleus > 0 && Math.abs(nbRouges - nbBleus) <= 1;
}

/** Ordre de choix du draft après les deux capitaines, selon le nombre de joueurs. */
export function ordreDeChoix(nbJoueurs: number): Equipe[] {
  const motif: Equipe[] = ['bleu', 'rouge', 'rouge', 'bleu', 'bleu', 'rouge'];
  return Array.from(
    { length: Math.max(0, nbJoueurs - 2) },
    (_, i) => motif[i % motif.length] ?? 'bleu',
  );
}

export interface Draft {
  equipes: Record<string, Equipe>;
  /** Rival de chaque joueur rouge (un bleu). */
  rivaux: Record<string, string>;
}

/**
 * Vérifie un draft : deux équipes égales (ou à un près si le nombre est
 * impair), et autant de paires de rivaux que de joueurs dans la plus petite
 * équipe, chaque rouge avec un bleu différent.
 */
export function validerDraft(joueurs: readonly { id: string }[], draft: Draft): string | null {
  const ids = joueurs.map((j) => j.id);
  if (ids.some((id) => !draft.equipes[id])) return 'Chaque joueur doit avoir une équipe.';
  const rouges = ids.filter((id) => draft.equipes[id] === 'rouge');
  const bleus = ids.filter((id) => draft.equipes[id] === 'bleu');
  if (!equipesValides(rouges.length, bleus.length)) {
    return `Équipes inégales : ${String(rouges.length)} rouges, ${String(bleus.length)} bleus.`;
  }
  const paires = Object.entries(draft.rivaux);
  if (
    paires.length !== Math.min(rouges.length, bleus.length) ||
    paires.some(([r, b]) => !rouges.includes(r) || !bleus.includes(b)) ||
    new Set(paires.map(([, b]) => b)).size !== paires.length
  ) {
    return 'Chaque rouge doit avoir un rival bleu différent.';
  }
  return null;
}

export interface GainManche {
  nom: string;
  points: number;
  joker: boolean;
}

/** Ce que la dernière manche a rapporté, pour vérifier la saisie d'un coup d'œil. */
export interface ResumeManche {
  numero: number;
  /** Gains non nuls, du plus gros au plus petit. */
  gains: GainManche[];
  /** Faits marquants du moteur (vainqueur, prime, busts, jokers…). */
  journal: string[];
}

/** Résume la dernière manche de `resultats` (celle qui vient d'être enregistrée). */
export function resumeManche(tournoi: Tournoi, resultats: readonly Resultat[]): ResumeManche {
  const n = resultats.length;
  const apres = calculer(tournoi, resultats, n);
  const avant = calculer(tournoi, resultats, n - 1);
  const gains = tournoi.joueurs
    .map((j) => ({
      nom: j.nom,
      points: apres.etats.get(j.id)?.derniere ?? 0,
      joker:
        (apres.etats.get(j.id)?.jokerUtilise ?? false) &&
        !(avant.etats.get(j.id)?.jokerUtilise ?? false),
    }))
    .filter((g) => g.points !== 0)
    .sort((a, b) => b.points - a.points || a.nom.localeCompare(b.nom));
  return {
    numero: tournoi.manches[n - 1]?.numero ?? n,
    gains,
    journal: apres.journal,
  };
}

/** « Seb +26 (joker) · Jonathan +9 · … » */
export function texteGains(gains: readonly GainManche[]): string {
  if (gains.length === 0) return 'Aucun point individuel.';
  return gains.map((g) => `${g.nom} +${String(g.points)}${g.joker ? ' (joker)' : ''}`).join(' · ');
}
