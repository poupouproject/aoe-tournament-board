import type { VueScoreboard } from './vue';

/**
 * Ce qui a changé entre deux vues du scoreboard, pour déclencher les effets
 * (glissement des lignes, flash des points, bandeau de nouveau leader, son,
 * face-à-face automatique). Pur : aucune horloge ni aucun DOM.
 */

export interface Changements {
  /** Joueurs dont les points ont changé. */
  pointsChanges: string[];
  /** Joueurs qui ont gagné au moins une place. */
  depassements: string[];
  /** Nom du nouveau leader, seulement quand une manche vient d'être jouée. */
  nouveauLeader: string | null;
}

export function comparerVues(avant: VueScoreboard, apres: VueScoreboard): Changements {
  const anciens = new Map(avant.lignes.map((l) => [l.id, l]));
  const pointsChanges: string[] = [];
  const depassements: string[] = [];
  for (const l of apres.lignes) {
    const ancien = anciens.get(l.id);
    if (!ancien) continue;
    if (ancien.points !== l.points) pointsChanges.push(l.id);
    if (l.position < ancien.position) depassements.push(l.id);
  }

  // Une annulation peut rendre la tête à l'ancien leader : ce n'est pas une nouvelle.
  const avance = apres.nbJouees > avant.nbJouees;
  const leaderAvant = avant.lignes.find((l) => l.leader)?.id ?? null;
  const leaderApres = apres.lignes.find((l) => l.leader) ?? null;
  const nouveauLeader =
    avance && leaderApres && leaderApres.id !== leaderAvant ? leaderApres.nom : null;

  return { pointsChanges, depassements, nouveauLeader };
}

export function aDesChangements(c: Changements): boolean {
  return c.pointsChanges.length > 0 || c.depassements.length > 0 || c.nouveauLeader !== null;
}

/**
 * Faut-il ouvrir le face-à-face tout seul ? Oui quand la prochaine manche est
 * un duel, au chargement (avant = null) ou quand la manche courante vient de
 * changer (un duel saisi, le suivant s'annonce).
 */
export function doitOuvrirDuel(avant: VueScoreboard | null, apres: VueScoreboard): boolean {
  if (apres.duel === null || apres.prochaine?.type !== 'duel') return false;
  // Au chargement, avant est null : la comparaison est alors toujours vraie.
  return avant?.nbJouees !== apres.nbJouees;
}
