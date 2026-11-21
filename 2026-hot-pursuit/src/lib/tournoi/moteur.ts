import { BAREME } from './bareme';
import type { Equipe, Joueur, Manche, Resultat, Tournoi } from './types';

/**
 * Moteur de calcul du tournoi.
 *
 * Pur et déterministe : à partir du tournoi (joueurs, horaire) et des
 * résultats saisis, il recalcule tout depuis zéro. Mêmes résultats, même
 * classement. Rien n'est stocké ailleurs : annuler une manche revient à
 * supprimer son résultat et à recalculer.
 *
 * Ordre d'application, pour chaque manche (docs/brief.md) :
 *   1. points de base, plus la prime sur le leader et le bonus rival (Race) ;
 *   2. joker : ×2 sur le gain individuel (une fois par joueur, jamais en finale) ;
 *   3. finale : ×2 sur tout, individuel comme équipe.
 * Le leader visé par la prime est celui du classement *avant* la manche.
 */

export interface EtatJoueur {
  id: string;
  points: number;
  /** Points gagnés à la dernière manche jouée. */
  derniere: number;
  /** Victoires face-à-face contre son rival (Race et duel). Sert au bris d'égalité. */
  faceAFace: number;
  jokerUtilise: boolean;
}

export interface Bilan {
  etats: ReadonlyMap<string, EtatJoueur>;
  equipes: Record<Equipe, number>;
  /** Faits marquants de la dernière manche jouée, pour le ticker. */
  journal: string[];
}

export const NOMS_EQUIPES: Record<Equipe, string> = { rouge: 'Rouge', bleu: 'Bleu' };

export function adversaire(equipe: Equipe): Equipe {
  return equipe === 'rouge' ? 'bleu' : 'rouge';
}

/**
 * Paires de rivaux [rouge, bleu], dans l'ordre des joueurs rouges.
 * La n-ième paire joue le n-ième duel Interceptor.
 */
export function pairesDeRivaux(joueurs: readonly Joueur[]): [string, string][] {
  return [...joueurs]
    .filter((j) => j.equipe === 'rouge' && j.rivalId !== null)
    .sort((a, b) => a.ordre - b.ordre)
    .map((j) => [j.id, j.rivalId ?? '']);
}

/**
 * Équipes inégales (7 joueurs) : facteur qui ramène la plus petite équipe à
 * la taille de l'autre (4/3 pour une équipe de 3 contre 4). 1 sinon.
 */
export function facteurEquipe(joueurs: readonly Joueur[], equipe: Equipe): number {
  const taille = (e: Equipe): number => joueurs.filter((j) => j.equipe === e).length;
  const t = taille(equipe);
  const plusGrande = Math.max(taille('rouge'), taille('bleu'));
  return t > 0 && t < plusGrande ? plusGrande / t : 1;
}

/** Classement : points, puis victoires face-à-face, puis id. */
export function classement(etats: ReadonlyMap<string, EtatJoueur>): EtatJoueur[] {
  return [...etats.values()].sort(
    (a, b) => b.points - a.points || b.faceAFace - a.faceAFace || a.id.localeCompare(b.id),
  );
}

/**
 * Classement cumulé des qualifs : la plus petite somme des positions passe en
 * tête ; à égalité, la meilleure position à la dernière Race jouée, puis l'id.
 */
export function classementQualif(races: readonly (readonly string[])[]): string[] {
  const somme = new Map<string, number>();
  for (const race of races) {
    race.forEach((id, rang) => {
      somme.set(id, (somme.get(id) ?? 0) + rang + 1);
    });
  }
  const derniere = races[races.length - 1] ?? [];
  const rangFinal = (id: string): number => {
    const rang = derniere.indexOf(id);
    return rang < 0 ? Infinity : rang;
  };
  return [...somme.keys()].sort(
    (a, b) =>
      (somme.get(a) ?? 0) - (somme.get(b) ?? 0) ||
      rangFinal(a) - rangFinal(b) ||
      a.localeCompare(b),
  );
}

/** Calcule l'état du tournoi après les `n` premières manches (toutes par défaut). */
export function calculer(
  tournoi: Tournoi,
  resultats: readonly Resultat[],
  n: number = resultats.length,
): Bilan {
  const joueurs = new Map(tournoi.joueurs.map((j) => [j.id, j]));
  const joueur = (id: string): Joueur => {
    const j = joueurs.get(id);
    if (!j) throw new Error(`Joueur inconnu : « ${id} »`);
    return j;
  };
  const nom = (id: string): string => joueur(id).nom;

  const etats = new Map<string, EtatJoueur>(
    tournoi.joueurs.map((j) => [
      j.id,
      { id: j.id, points: 0, derniere: 0, faceAFace: 0, jokerUtilise: false },
    ]),
  );
  const etat = (id: string): EtatJoueur => {
    const e = etats.get(id);
    if (!e) throw new Error(`Joueur inconnu : « ${id} »`);
    return e;
  };

  const equipes: Record<Equipe, number> = { rouge: 0, bleu: 0 };
  const paires = pairesDeRivaux(tournoi.joueurs);
  let journal: string[] = [];

  for (let i = 0; i < Math.min(n, resultats.length); i++) {
    const manche = tournoi.manches[i];
    const resultat = resultats[i];
    if (!manche || !resultat) break;
    if (manche.type !== resultat.type) {
      throw new Error(
        `Manche ${String(manche.numero)} : résultat de type « ${resultat.type} » pour une manche « ${manche.type} »`,
      );
    }

    const leader = i > 0 ? (classement(etats)[0]?.id ?? null) : null;
    const gains = new Map(tournoi.joueurs.map((j) => [j.id, 0]));
    const gagner = (id: string, points: number): void => {
      gains.set(id, (gains.get(id) ?? 0) + points);
    };
    const gainsEquipe: Record<Equipe, number> = { rouge: 0, bleu: 0 };
    const messages: string[] = [];

    switch (resultat.type) {
      case 'qualif': {
        // Le barème s'applique à chaque Race, et les points s'additionnent.
        for (const race of resultat.races) {
          race.forEach((id, rang) => {
            gagner(id, BAREME.qualif[rang] ?? 0);
          });
        }
        const ordre = classementQualif(resultat.races);
        const premier = ordre[0];
        if (premier) messages.push(`${nom(premier)} remporte les qualifications`);
        break;
      }

      case 'race': {
        const rangLeader = leader ? resultat.ordre.indexOf(leader) : -1;
        resultat.ordre.forEach((id, rang) => {
          gagner(id, BAREME.race[rang] ?? 0);
          if (leader && id !== leader && rang < rangLeader) gagner(id, BAREME.prime);
          const rival = joueur(id).rivalId;
          if (rival && rang < resultat.ordre.indexOf(rival)) {
            gagner(id, BAREME.rival);
            etat(id).faceAFace++;
          }
        });
        const premier = resultat.ordre[0];
        if (premier) messages.push(`${nom(premier)} gagne « ${manche.trace} »`);
        if (leader) {
          messages.push(
            rangLeader > 0
              ? `Prime : ${String(rangLeader)} pilote${rangLeader > 1 ? 's' : ''} devant ${nom(leader)} (+${String(BAREME.prime)})`
              : `${nom(leader)} gagne en tête — la prime tient toujours`,
          );
        }
        break;
      }

      case 'hp': {
        if (manche.type !== 'hp') break;
        const cops = manche.cops;
        const racers = adversaire(cops);
        for (const r of resultat.racers) {
          if (r.position !== null) gagner(r.id, BAREME.hpRacer[r.position - 1] ?? 0);
        }
        const busts = Object.entries(resultat.busts);
        for (const [id, nombre] of busts) gagner(id, BAREME.hpBust * nombre);
        // Le camp gagnant prend +10, ×4/3 (arrondi : +13) si c'est l'équipe de 3.
        const camp = resultat.gagnant === 'cops' ? cops : racers;
        gainsEquipe[camp] += Math.round(
          BAREME.hpEquipeGagnante * facteurEquipe(tournoi.joueurs, camp),
        );
        messages.push(
          resultat.gagnant === 'cops'
            ? `Les cops ${NOMS_EQUIPES[cops]} arrêtent tout le monde sur « ${manche.trace} »`
            : `Les racers ${NOMS_EQUIPES[racers]} s'échappent sur « ${manche.trace} »`,
        );
        const [meilleur] = busts.sort((a, b) => b[1] - a[1]);
        if (meilleur) {
          const [id, nombre] = meilleur;
          messages.push(
            `${nom(id)} : ${String(nombre)} bust${nombre > 1 ? 's' : ''} (+${String(BAREME.hpBust * nombre)})`,
          );
        }
        break;
      }

      case 'ep': {
        if (manche.type !== 'ep') break;
        const cops = manche.cops;
        const racers = adversaire(cops);
        for (const [id, nombre] of Object.entries(resultat.busts)) {
          gagner(id, BAREME.hpBust * nombre);
        }
        let camp: Equipe;
        if (resultat.echappe) {
          camp = racers;
          gagner(resultat.vip, BAREME.epVipEchappe);
          for (const j of tournoi.joueurs) {
            if (j.equipe === racers && j.id !== resultat.vip) gagner(j.id, BAREME.epEscorte);
          }
          messages.push(
            `${nom(resultat.vip)}, ennemi public n°1, s'échappe sur « ${manche.trace} »`,
          );
        } else {
          camp = cops;
          if (resultat.bustVipPar) {
            gagner(resultat.bustVipPar, BAREME.epBustVip);
            messages.push(
              `${nom(resultat.bustVipPar)} arrête l'ennemi public n°1, ${nom(resultat.vip)}`,
            );
          } else {
            messages.push(`L'ennemi public n°1, ${nom(resultat.vip)}, est arrêté`);
          }
        }
        gainsEquipe[camp] += Math.round(
          BAREME.hpEquipeGagnante * facteurEquipe(tournoi.joueurs, camp),
        );
        break;
      }

      case 'duel': {
        if (manche.type !== 'duel') break;
        const paire = paires[manche.duel];
        if (!paire) throw new Error(`Duel ${String(manche.duel + 1)} : rivaux pas encore tirés`);
        const [a, b] = paire;
        for (const id of resultat.manches) {
          if (id !== a && id !== b) {
            throw new Error(`Duel ${nom(a)}–${nom(b)} : « ${id} » n'y participe pas`);
          }
          gagner(id, BAREME.duelManche);
        }
        const victoiresA = resultat.manches.filter((id) => id === a).length;
        const victoiresB = resultat.manches.length - victoiresA;
        const gagnant =
          victoiresA > victoiresB ? a : victoiresB > victoiresA ? b : resultat.brisEgalite;
        if (gagnant !== a && gagnant !== b) {
          throw new Error(`Duel ${nom(a)}–${nom(b)} : égalité sans bris d'égalité valide`);
        }
        etat(gagnant).faceAFace++;
        const equipe = joueur(gagnant).equipe;
        if (equipe) gainsEquipe[equipe] += BAREME.duelEquipe;
        messages.push(`Duel : ${nom(gagnant)} bat ${nom(gagnant === a ? b : a)}`);
        break;
      }
    }

    // Racers : +2 par cop éliminé, en Hot Pursuit comme en Ennemi public.
    if (resultat.type === 'hp' || resultat.type === 'ep') {
      for (const [id, nombre] of Object.entries(resultat.accidents ?? {})) {
        if (nombre > 0) {
          gagner(id, BAREME.accident * nombre);
          messages.push(
            `${nom(id)} élimine ${String(nombre)} cop${nombre > 1 ? 's' : ''} (+${String(BAREME.accident * nombre)})`,
          );
        }
      }
    }

    for (const id of resultat.jokers ?? []) {
      const e = etat(id);
      if (!manche.finale && !e.jokerUtilise) {
        gains.set(id, (gains.get(id) ?? 0) * BAREME.multiplicateurJoker);
        e.jokerUtilise = true;
        messages.push(`JOKER : ${nom(id)} double sa manche`);
      }
    }

    // Race : le score d'équipe est la somme des gains individuels, joker compris.
    // Équipes inégales (7 joueurs) : la plus petite est ramenée à la taille de
    // l'autre (somme × 4/3, arrondie), sinon elle perdrait d'office.
    if (resultat.type === 'race') {
      for (const j of tournoi.joueurs) {
        if (j.equipe) gainsEquipe[j.equipe] += gains.get(j.id) ?? 0;
      }
      for (const e of ['rouge', 'bleu'] satisfies Equipe[]) {
        gainsEquipe[e] = Math.round(gainsEquipe[e] * facteurEquipe(tournoi.joueurs, e));
      }
    }

    const multiplicateur = manche.finale ? BAREME.multiplicateurFinale : 1;
    for (const [id, gain] of gains) {
      const e = etat(id);
      e.points += gain * multiplicateur;
      e.derniere = gain * multiplicateur;
    }
    equipes.rouge += gainsEquipe.rouge * multiplicateur;
    equipes.bleu += gainsEquipe.bleu * multiplicateur;
    journal = messages;
  }

  return { etats, equipes, journal };
}

/** La prochaine manche à jouer, ou null si le tournoi est terminé. */
export function prochaineManche(tournoi: Tournoi, nbJouees: number): Manche | null {
  return tournoi.manches[nbJouees] ?? null;
}
