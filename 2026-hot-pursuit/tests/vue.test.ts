/**
 * Tests de la vue du scoreboard : ce que l'écran affiche, à partir du moteur.
 *
 * Lancer avec : npm test
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { JOUEURS_DEMO, RESULTATS_DEMO } from '../src/lib/tournoi/demo';
import { HORAIRE } from '../src/lib/tournoi/horaire';
import type { Tournoi } from '../src/lib/tournoi/types';
import { construireVue, MESSAGES_FIXES } from '../src/lib/tournoi/vue';

const DEMO: Tournoi = { joueurs: JOUEURS_DEMO, manches: HORAIRE };

describe('vue après les 9 manches de la démo (parité avec la maquette)', () => {
  const vue = construireVue(DEMO, RESULTATS_DEMO);

  it('donne les variations de rang depuis la manche précédente', () => {
    assert.deepEqual(
      vue.lignes.map((l) => [l.id, l.variation]),
      [
        ['seb', 0],
        ['max', 1],
        ['jo', -1],
        ['ben', 0],
        ['fred', 0],
        ['kev', 0],
        ['alex', 0],
        ['oli', 0],
      ],
    );
  });

  it("donne l'écart au leader, le leader et les rivaux", () => {
    const seb = vue.lignes[0];
    const max = vue.lignes[1];
    assert.ok(seb && max);
    assert.equal(seb.leader, true);
    assert.equal(seb.ecart, 0);
    assert.equal(max.leader, false);
    assert.equal(max.ecart, 3);
    assert.equal(max.rivalNom, 'Jonathan');
  });

  it('raconte la dernière manche dans le ticker', () => {
    assert.deepEqual(vue.ticker, [
      'Les cops Bleu arrêtent tout le monde sur « Forêt brumeuse »',
      'Max : 2 busts (+4)',
      'JOKER : Max double sa manche',
      'Seb est la cible : +2 à quiconque finit devant',
      ...MESSAGES_FIXES,
    ]);
  });

  it('annonce le premier duel', () => {
    assert.equal(vue.prochainBloc, 'Duels Interceptor');
    assert.deepEqual(vue.prochaine, {
      type: 'duel',
      trace: 'Meilleur de 2',
      finale: false,
      a: 'Jonathan',
      b: 'Max',
      bilan: [3, 1],
    });
    assert.deepEqual(vue.duel, {
      a: { nom: 'Jonathan', equipe: 'rouge', position: 3, points: 57 },
      b: { nom: 'Max', equipe: 'bleu', position: 2, points: 63 },
      bilan: [3, 1],
    });
  });

  it('donne le bilan face-à-face de chaque rivalité', () => {
    assert.deepEqual(vue.rivalites, [
      { a: 'Jonathan', b: 'Max', bilan: [3, 1] },
      { a: 'Ben', b: 'Seb', bilan: [2, 2] },
      { a: 'Fred', b: 'Kev', bilan: [2, 2] },
      { a: 'Alex', b: 'Olivier', bilan: [3, 1] },
    ]);
  });
});

describe('vue en cours de journée', () => {
  it('annonce une Race avec sa cible et les jokers restants', () => {
    const vue = construireVue(DEMO, RESULTATS_DEMO.slice(0, 2));
    assert.deepEqual(vue.prochaine, {
      type: 'race',
      trace: 'Col des Pins',
      finale: false,
      cible: 'Jonathan',
      jokersRestants: 8,
    });
  });

  it('signale les grosses remontées', () => {
    // À la manche 3, Seb (joker) passe de 4e à 1er.
    const vue = construireVue(DEMO, RESULTATS_DEMO.slice(0, 3));
    assert.ok(vue.ticker.includes('Seb grimpe de 3 places'));
  });

  it('annonce un Hot Pursuit avec le camp des cops', () => {
    const vue = construireVue(DEMO, RESULTATS_DEMO.slice(0, 3));
    assert.deepEqual(vue.prochaine, {
      type: 'hp',
      trace: 'Canyon rouge',
      finale: false,
      cops: 'rouge',
    });
  });
});

describe('vue avant le draft', () => {
  const avantDraft: Tournoi = {
    joueurs: JOUEURS_DEMO.map((j) => ({ ...j, equipe: null, rivalId: null })),
    manches: HORAIRE,
  };

  it("n'a ni leader ni cible avant la première manche", () => {
    const vue = construireVue(avantDraft, []);
    assert.equal(vue.nbJouees, 0);
    assert.ok(vue.lignes.every((l) => !l.leader && l.variation === 0));
    assert.deepEqual(vue.ticker, [...MESSAGES_FIXES]);
    assert.equal(vue.prochaine?.type, 'qualif');
  });

  it('n’a ni rivalités ni duel tant que les rivaux ne sont pas tirés', () => {
    const vue = construireVue(avantDraft, RESULTATS_DEMO.slice(0, 1));
    assert.deepEqual(vue.rivalites, []);
    assert.equal(vue.duel, null);
    assert.equal(vue.lignes[0]?.rivalNom, null);
  });

  it('indique la fin du tournoi', () => {
    const court: Tournoi = { joueurs: JOUEURS_DEMO, manches: HORAIRE.slice(0, 1) };
    const vue = construireVue(court, RESULTATS_DEMO.slice(0, 1));
    assert.equal(vue.prochaine, null);
    assert.equal(vue.prochainBloc, null);
  });
});
