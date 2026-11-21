/**
 * Tests de la détection des changements entre deux vues du scoreboard : ce
 * qui déclenche les effets (flash, glissement, nouveau leader, face-à-face).
 *
 * Lancer avec : npm test
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { aDesChangements, comparerVues, doitOuvrirDuel } from '../src/lib/tournoi/changements';
import { JOUEURS_DEMO, RESULTATS_DEMO } from '../src/lib/tournoi/demo';
import { HORAIRE } from '../src/lib/tournoi/horaire';
import type { Tournoi } from '../src/lib/tournoi/types';
import { construireVue } from '../src/lib/tournoi/vue';

const DEMO: Tournoi = { joueurs: JOUEURS_DEMO, manches: HORAIRE };
const vueApres = (n: number) => construireVue(DEMO, RESULTATS_DEMO.slice(0, n));

describe('comparerVues', () => {
  it('ne voit rien entre deux vues identiques', () => {
    const c = comparerVues(vueApres(9), vueApres(9));
    assert.equal(aDesChangements(c), false);
  });

  it('repère les points changés, les dépassements et le nouveau leader', () => {
    // Manche 3 : Seb (joker) passe de 4e à 1er, Jonathan perd la tête.
    const c = comparerVues(vueApres(2), vueApres(3));
    assert.equal(c.nouveauLeader, 'Seb');
    assert.ok(c.depassements.includes('seb'));
    assert.ok(c.pointsChanges.includes('seb'));
    assert.ok(!c.depassements.includes('jo'));
  });

  it('ne crie pas au nouveau leader quand la tête ne change pas', () => {
    const c = comparerVues(vueApres(3), vueApres(4));
    assert.equal(c.nouveauLeader, null);
    assert.ok(aDesChangements(c));
  });

  it('annonce le premier leader, après les qualifs', () => {
    assert.equal(comparerVues(vueApres(0), vueApres(1)).nouveauLeader, 'Max');
  });

  it("n'annonce pas de nouveau leader après une annulation", () => {
    const c = comparerVues(vueApres(3), vueApres(2));
    assert.equal(c.nouveauLeader, null);
    assert.ok(c.pointsChanges.length > 0);
  });
});

describe('doitOuvrirDuel', () => {
  it('ouvre le face-à-face au chargement si un duel arrive', () => {
    assert.equal(doitOuvrirDuel(null, vueApres(9)), true);
    assert.equal(doitOuvrirDuel(null, vueApres(8)), false);
  });

  it("l'ouvre quand on arrive au duel, pas à chaque rafraîchissement", () => {
    assert.equal(doitOuvrirDuel(vueApres(8), vueApres(9)), true);
    assert.equal(doitOuvrirDuel(vueApres(9), vueApres(9)), false);
  });
});
