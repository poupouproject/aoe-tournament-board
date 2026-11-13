import { adversaire, pairesDeRivaux } from '../../src/lib/tournoi/moteur';
import type { Resultat, Tournoi } from '../../src/lib/tournoi/types';

/**
 * Fabrique un résultat valide pour chacune des manches de l'horaire : un
 * tournoi joué jusqu'au bout, pour tester le podium. L'ordre d'arrivée tourne
 * d'une manche à l'autre ; en Hot Pursuit, deux racers s'échappent et le
 * premier cop fait deux busts ; en duel, le rouge gagne ses deux manches.
 */
export function resultatsComplets(tournoi: Tournoi): Resultat[] {
  const ids = tournoi.joueurs.map((j) => j.id);
  const paires = pairesDeRivaux(tournoi.joueurs);

  return tournoi.manches.map((manche, i): Resultat => {
    const decalage = i % ids.length;
    const ordre = [...ids.slice(decalage), ...ids.slice(0, decalage)];
    switch (manche.type) {
      case 'qualif':
        return { type: 'qualif', ordre };
      case 'race':
        return { type: 'race', ordre };
      case 'hp': {
        const racers = tournoi.joueurs.filter((j) => j.equipe === adversaire(manche.cops));
        const cop = tournoi.joueurs.find((j) => j.equipe === manche.cops);
        return {
          type: 'hp',
          racers: racers.map((r, k) => ({ id: r.id, position: k < 2 ? k + 1 : null })),
          busts: cop ? { [cop.id]: 2 } : {},
          gagnant: 'racers',
        };
      }
      case 'duel': {
        const rouge = paires[manche.duel]?.[0] ?? '';
        return { type: 'duel', manches: [rouge, rouge] };
      }
    }
  });
}
