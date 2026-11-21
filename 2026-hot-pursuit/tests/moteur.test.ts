/**
 * Tests du moteur de calcul : parité avec la maquette, puis chaque règle du
 * barème isolément (prime, rival, joker, finale ×2, duel, égalités).
 *
 * Lancer avec : npm test
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { JOUEURS_DEMO, RESULTATS_DEMO } from '../src/lib/tournoi/demo';
import { HORAIRE, horairePour } from '../src/lib/tournoi/horaire';
import {
  calculer,
  classement,
  classementQualif,
  facteurEquipe,
  pairesDeRivaux,
} from '../src/lib/tournoi/moteur';
import type { Equipe, Joueur, Manche, Resultat, Tournoi } from '../src/lib/tournoi/types';

const DEMO: Tournoi = { joueurs: JOUEURS_DEMO, manches: HORAIRE };

/** [id, points, face-à-face, joker utilisé, dernière manche], dans l'ordre du classement. */
function resume(tournoi: Tournoi, resultats: readonly Resultat[], n?: number) {
  const bilan = calculer(tournoi, resultats, n);
  return {
    table: classement(bilan.etats).map((e) => [
      e.id,
      e.points,
      e.faceAFace,
      e.jokerUtilise,
      e.derniere,
    ]),
    equipes: bilan.equipes,
    journal: bilan.journal,
  };
}

function points(tournoi: Tournoi, resultats: readonly Resultat[]): Record<string, number> {
  const { etats } = calculer(tournoi, resultats);
  return Object.fromEntries([...etats.values()].map((e) => [e.id, e.points]));
}

describe('parité avec la maquette (valeurs produites par docs/maquette)', () => {
  it('après les qualifs', () => {
    assert.deepEqual(resume(DEMO, RESULTATS_DEMO, 1), {
      table: [
        ['max', 8, 0, false, 8],
        ['jo', 7, 0, false, 7],
        ['seb', 6, 0, false, 6],
        ['ben', 5, 0, false, 5],
        ['kev', 4, 0, false, 4],
        ['fred', 3, 0, false, 3],
        ['oli', 2, 0, false, 2],
        ['alex', 1, 0, false, 1],
      ],
      equipes: { rouge: 0, bleu: 0 },
      journal: ['Max remporte les qualifications'],
    });
  });

  it('après 3 manches (joker de Seb)', () => {
    assert.deepEqual(resume(DEMO, RESULTATS_DEMO, 3), {
      table: [
        ['seb', 38, 1, true, 26],
        ['jo', 29, 2, false, 9],
        ['max', 23, 0, false, 7],
        ['ben', 18, 1, false, 5],
        ['kev', 15, 1, false, 7],
        ['fred', 12, 1, false, 3],
        ['alex', 10, 2, false, 5],
        ['oli', 6, 0, false, 2],
      ],
      equipes: { rouge: 53, bleu: 62 },
      journal: [
        'Seb gagne « Col des Pins »',
        'Prime : 1 pilote devant Jonathan (+2)',
        'JOKER : Seb double sa manche',
      ],
    });
  });

  it('après 5 manches (premier aller-retour Hot Pursuit)', () => {
    const r = resume(DEMO, RESULTATS_DEMO, 5);
    assert.deepEqual(r.table.slice(0, 3), [
      ['seb', 44, 1, true, 0],
      ['jo', 39, 2, false, 8],
      ['max', 33, 0, false, 2],
    ]);
    assert.deepEqual(r.equipes, { rouge: 63, bleu: 72 });
    assert.deepEqual(r.journal, [
      "Les racers Rouge s'échappent sur « Canyon rouge »",
      'Max : 1 bust (+2)',
    ]);
  });

  it('après les 9 manches de la démo', () => {
    assert.deepEqual(resume(DEMO, RESULTATS_DEMO), {
      table: [
        ['seb', 66, 2, true, 0],
        ['max', 63, 1, true, 8],
        ['jo', 57, 3, false, 0],
        ['ben', 54, 2, true, 0],
        ['fred', 32, 2, false, 0],
        ['kev', 28, 2, false, 2],
        ['alex', 19, 3, false, 0],
        ['oli', 15, 1, false, 2],
      ],
      equipes: { rouge: 132, bleu: 144 },
      journal: [
        'Les cops Bleu arrêtent tout le monde sur « Forêt brumeuse »',
        'Max : 2 busts (+4)',
        'JOKER : Max double sa manche',
      ],
    });
  });

  it('est déterministe', () => {
    assert.deepEqual(resume(DEMO, RESULTATS_DEMO), resume(DEMO, RESULTATS_DEMO));
  });
});

// ── Règles isolées, sur un mini-tournoi de 4 joueurs ─────────────────────

const J4: Joueur[] = [
  { id: 'a', nom: 'A', equipe: 'rouge', rivalId: 'c', ordre: 0 },
  { id: 'b', nom: 'B', equipe: 'rouge', rivalId: 'd', ordre: 1 },
  { id: 'c', nom: 'C', equipe: 'bleu', rivalId: 'a', ordre: 2 },
  { id: 'd', nom: 'D', equipe: 'bleu', rivalId: 'b', ordre: 3 },
];

function tournoi(...types: (Manche['type'] | 'finale')[]): Tournoi {
  const manches = types.map((t, i): Manche => {
    const base = { numero: i + 1, bloc: 'Test', trace: `Tracé ${String(i + 1)}`, finale: false };
    switch (t) {
      case 'qualif':
        return { ...base, type: 'qualif' };
      case 'race':
        return { ...base, type: 'race' };
      case 'finale':
        return { ...base, type: 'race', finale: true };
      case 'hp':
        return { ...base, type: 'hp', cops: 'rouge' };
      case 'ep':
        return { ...base, type: 'ep', cops: 'rouge' };
      case 'duel':
        return { ...base, type: 'duel', duel: 0 };
    }
  });
  return { joueurs: J4, manches };
}

const qualif: Resultat = { type: 'qualif', races: [['a', 'b', 'c', 'd']] };

describe('Qualifs', () => {
  it('cumule les positions des 3 Races', () => {
    assert.deepEqual(
      classementQualif([
        ['a', 'b', 'c', 'd'],
        ['c', 'a', 'b', 'd'],
        ['a', 'c', 'd', 'b'],
      ]),
      // a 1+2+1 = 4 ; c 3+1+2 = 6 ; b 2+3+4 = 9 ; d 4+4+3 = 11
      ['a', 'c', 'b', 'd'],
    );
  });

  it('départage une égalité par la dernière Race, puis par id', () => {
    // a et b : 3 points chacun ; b est devant à la dernière Race.
    assert.deepEqual(
      classementQualif([
        ['a', 'b'],
        ['b', 'a'],
      ]),
      ['b', 'a'],
    );
    // Une seule Race : pas d'égalité possible, l'ordre est repris tel quel.
    assert.deepEqual(classementQualif([['d', 'c', 'b', 'a']]), ['d', 'c', 'b', 'a']);
  });

  it('applique le barème qualif à chaque Race et cumule les points', () => {
    const p = points(tournoi('qualif'), [
      {
        type: 'qualif',
        races: [
          ['a', 'b', 'c', 'd'],
          ['c', 'a', 'b', 'd'],
          ['a', 'c', 'd', 'b'],
        ],
      },
    ]);
    // a 8+7+8 ; b 7+6+5 ; c 6+8+7 ; d 5+5+6.
    assert.deepEqual(p, { a: 23, b: 18, c: 21, d: 16 });
  });

  it('retrouve, pour la démo, le classement de la maquette', () => {
    const [qualifDemo] = RESULTATS_DEMO;
    assert.equal(qualifDemo?.type, 'qualif');
    assert.deepEqual(classementQualif(qualifDemo.races), [
      'max',
      'jo',
      'seb',
      'ben',
      'kev',
      'fred',
      'oli',
      'alex',
    ]);
  });
});

describe('Race', () => {
  it('applique le barème, la prime sur le leader et le bonus rival', () => {
    // Après les qualifs : a = 8, b = 7, c = 6, d = 5 → a est le leader.
    const p = points(tournoi('qualif', 'race'), [
      qualif,
      { type: 'race', ordre: ['c', 'd', 'a', 'b'] },
    ]);
    // c : 10 + prime 2 + bat a (rival) 1 ; d : 8 + 2 + bat b 1 ; a : 7 ; b : 6.
    assert.deepEqual(p, { a: 8 + 7, b: 7 + 6, c: 6 + 13, d: 5 + 11 });
  });

  it("ne donne pas de prime si le leader gagne, ni avant qu'il y en ait un", () => {
    const p = points(tournoi('race', 'race'), [
      { type: 'race', ordre: ['a', 'b', 'c', 'd'] },
      { type: 'race', ordre: ['a', 'b', 'c', 'd'] },
    ]);
    // a et b battent leur rival à chaque fois (+1) ; aucune prime.
    assert.deepEqual(p, { a: 22, b: 18, c: 14, d: 12 });
  });

  it("additionne les gains individuels dans le score d'équipe", () => {
    const { equipes } = calculer(tournoi('race'), [{ type: 'race', ordre: ['a', 'c', 'b', 'd'] }]);
    // a : 10 + 1, b : 7 + 1 → 19 ; c : 8, d : 6 → 14.
    assert.deepEqual(equipes, { rouge: 19, bleu: 14 });
  });
});

describe('Équipes inégales (7 joueurs)', () => {
  const J3: Joueur[] = [
    { id: 'a', nom: 'A', equipe: 'rouge', rivalId: 'c', ordre: 0 },
    { id: 'b', nom: 'B', equipe: 'rouge', rivalId: null, ordre: 1 },
    { id: 'c', nom: 'C', equipe: 'bleu', rivalId: 'a', ordre: 2 },
  ];
  const race: Manche = { numero: 1, bloc: 'Test', trace: 'T', finale: false, type: 'race' };

  it("ramène la plus petite équipe à la taille de l'autre en Race", () => {
    const { equipes, etats } = calculer({ joueurs: J3, manches: [race] }, [
      { type: 'race', ordre: ['c', 'a', 'b'] },
    ]);
    // c : 10 + 1 (bat a) → bleu 11 × 2/1 = 22 ; a : 8, b : 7 → rouge 15.
    assert.deepEqual(equipes, { rouge: 15, bleu: 22 });
    // Les points individuels ne changent pas ; b sans rival n'a pas de bonus.
    assert.equal(etats.get('c')?.points, 11);
    assert.equal(etats.get('b')?.points, 7);
  });

  it("donne +13 au lieu de +10 à l'équipe de 3 qui gagne un Hot Pursuit", () => {
    const hp = (cops: Equipe): Manche => ({
      numero: 1,
      bloc: 'Test',
      trace: 'T',
      finale: false,
      type: 'hp',
      cops,
    });
    // Rouge (a, b) contre Bleu (c) : ici Bleu est l'équipe de 1 contre 2 → ×2.
    const bleuCops = calculer({ joueurs: J3, manches: [hp('bleu')] }, [
      {
        type: 'hp',
        racers: [
          { id: 'a', position: null },
          { id: 'b', position: null },
        ],
        busts: { c: 2 },
        gagnant: 'cops',
      },
    ]);
    assert.deepEqual(bleuCops.equipes, { rouge: 0, bleu: 20 });
    const rougeGagne = calculer({ joueurs: J3, manches: [hp('rouge')] }, [
      { type: 'hp', racers: [{ id: 'c', position: 1 }], busts: {}, gagnant: 'racers' },
    ]);
    assert.deepEqual(rougeGagne.equipes, { rouge: 0, bleu: 20 });
  });

  it('arrondit le facteur 4/3 : +13 pour une équipe de 3 contre 4', () => {
    const sept: Joueur[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id, i) => ({
      id,
      nom: id,
      equipe: i < 3 ? 'rouge' : 'bleu',
      rivalId: null,
      ordre: i,
    }));
    assert.equal(Math.round(10 * facteurEquipe(sept, 'rouge')), 13);
    assert.equal(facteurEquipe(sept, 'bleu'), 1);
    assert.equal(facteurEquipe(J4, 'rouge'), 1);
  });

  it('ignore les primes du jeu dans le pointage', () => {
    const { etats } = calculer({ joueurs: J3, manches: [race] }, [
      { type: 'race', ordre: ['c', 'a', 'b'], primes: { a: 4576, c: 12000 } },
    ]);
    assert.equal(etats.get('a')?.points, 8);
  });
});

describe('Ennemi public n°1', () => {
  // Rouge (a, b) cops, Bleu (c, d) racers ; c est l'ennemi public.
  const ep: Manche = {
    numero: 1,
    bloc: 'Test',
    trace: 'T',
    finale: false,
    type: 'ep',
    cops: 'rouge',
  };
  const t: Tournoi = { joueurs: J4, manches: [ep] };

  it("donne +10 à l'ennemi public qui s'échappe, +3 à ses escortes et le bonus au camp", () => {
    const { etats, equipes } = calculer(t, [
      { type: 'ep', vip: 'c', echappe: true, busts: { a: 1 } },
    ]);
    assert.equal(etats.get('c')?.points, 10);
    assert.equal(etats.get('d')?.points, 3);
    assert.equal(etats.get('a')?.points, 2);
    assert.deepEqual(equipes, { rouge: 0, bleu: 10 });
  });

  it("donne +4 de plus au cop qui arrête l'ennemi public, et le bonus aux cops", () => {
    const { etats, equipes } = calculer(t, [
      { type: 'ep', vip: 'c', echappe: false, bustVipPar: 'b', busts: { b: 1, a: 1 } },
    ]);
    assert.equal(etats.get('b')?.points, 6);
    assert.equal(etats.get('a')?.points, 2);
    assert.equal(etats.get('c')?.points, 0);
    assert.equal(etats.get('d')?.points, 0);
    assert.deepEqual(equipes, { rouge: 10, bleu: 0 });
  });
});

describe('Cops éliminés', () => {
  it('donne +2 au racer par cop éliminé, en Hot Pursuit et en Ennemi public', () => {
    const hp: Manche = {
      numero: 1,
      bloc: 'T',
      trace: 'T',
      finale: false,
      type: 'hp',
      cops: 'rouge',
    };
    const ep: Manche = {
      numero: 2,
      bloc: 'T',
      trace: 'T',
      finale: false,
      type: 'ep',
      cops: 'rouge',
    };
    const { etats } = calculer({ joueurs: J4, manches: [hp, ep] }, [
      {
        type: 'hp',
        racers: [
          { id: 'c', position: null },
          { id: 'd', position: null },
        ],
        busts: {},
        gagnant: 'cops',
        accidents: { c: 1 },
      },
      { type: 'ep', vip: 'd', echappe: false, busts: {}, accidents: { c: 2 } },
    ]);
    assert.equal(etats.get('c')?.points, 6);
  });
});

describe('Joker', () => {
  it('double le gain individuel, une seule fois', () => {
    const p = points(tournoi('race', 'race'), [
      { type: 'race', ordre: ['d', 'c', 'b', 'a'], jokers: ['a'] },
      { type: 'race', ordre: ['d', 'c', 'b', 'a'], jokers: ['a'] },
    ]);
    // a : 6 ×2 à la 1re (il passe en tête) ; à la 2e, joker déjà utilisé : 6.
    assert.equal(p.a, 12 + 6);
  });

  it('est interdit en finale', () => {
    const { etats } = calculer(tournoi('finale'), [
      { type: 'race', ordre: ['a', 'b', 'c', 'd'], jokers: ['a'] },
    ]);
    assert.equal(etats.get('a')?.points, (10 + 1) * 2);
    assert.equal(etats.get('a')?.jokerUtilise, false);
  });
});

describe('Finale', () => {
  it('double les points individuels et ceux des équipes', () => {
    const normal = calculer(tournoi('race'), [{ type: 'race', ordre: ['a', 'c', 'b', 'd'] }]);
    const finale = calculer(tournoi('finale'), [{ type: 'race', ordre: ['a', 'c', 'b', 'd'] }]);
    for (const [id, e] of normal.etats) {
      assert.equal(finale.etats.get(id)?.points, e.points * 2);
    }
    assert.deepEqual(finale.equipes, {
      rouge: normal.equipes.rouge * 2,
      bleu: normal.equipes.bleu * 2,
    });
  });
});

describe('Hot Pursuit', () => {
  it('paie les racers, les busts et le camp gagnant', () => {
    // Rouge (a, b) joue cop ; c s'échappe 1er, d est busté par a.
    const { etats, equipes } = calculer(tournoi('hp'), [
      {
        type: 'hp',
        racers: [
          { id: 'c', position: 1 },
          { id: 'd', position: null },
        ],
        busts: { a: 1 },
        gagnant: 'racers',
      },
    ]);
    assert.equal(etats.get('c')?.points, 8);
    assert.equal(etats.get('d')?.points, 0);
    assert.equal(etats.get('a')?.points, 2);
    assert.deepEqual(equipes, { rouge: 0, bleu: 10 });
  });
});

describe('Duel', () => {
  it('paie chaque manche gagnée et le gagnant compte au face-à-face', () => {
    const { etats, equipes } = calculer(tournoi('duel'), [{ type: 'duel', manches: ['c', 'c'] }]);
    assert.equal(etats.get('c')?.points, 10);
    assert.equal(etats.get('c')?.faceAFace, 1);
    assert.deepEqual(equipes, { rouge: 0, bleu: 3 });
  });

  it('départage un 1-1 par le bris d’égalité', () => {
    const { etats, equipes } = calculer(tournoi('duel'), [
      { type: 'duel', manches: ['a', 'c'], brisEgalite: 'a' },
    ]);
    assert.equal(etats.get('a')?.points, 5);
    assert.equal(etats.get('c')?.points, 5);
    assert.equal(etats.get('a')?.faceAFace, 1);
    assert.deepEqual(equipes, { rouge: 3, bleu: 0 });
  });

  it('refuse un 1-1 sans bris d’égalité', () => {
    assert.throws(() => calculer(tournoi('duel'), [{ type: 'duel', manches: ['a', 'c'] }]));
  });

  it('refuse un duel tant que les rivaux ne sont pas tirés', () => {
    const sansRivaux = { ...tournoi('duel'), joueurs: J4.map((j) => ({ ...j, rivalId: null })) };
    assert.throws(() => calculer(sansRivaux, [{ type: 'duel', manches: ['a', 'a'] }]));
  });
});

describe('Classement', () => {
  it('départage les égalités par le face-à-face', () => {
    // a : 8 ; d : 7 + 1 (bat son rival b) = 8 ; à égalité, d a 1 face-à-face.
    const { etats } = calculer(tournoi('race'), [{ type: 'race', ordre: ['c', 'a', 'd', 'b'] }]);
    assert.deepEqual(
      classement(etats).map((e) => e.id),
      ['c', 'd', 'a', 'b'],
    );
  });

  it('départage ensuite par id', () => {
    const { etats } = calculer(tournoi('race'), []);
    assert.deepEqual(
      classement(etats).map((e) => e.id),
      ['a', 'b', 'c', 'd'],
    );
  });

  it('fonctionne avant le draft (sans équipes ni rivaux)', () => {
    const avantDraft = J4.map((j) => ({ ...j, equipe: null, rivalId: null }));
    const { etats, equipes } = calculer({ joueurs: avantDraft, manches: HORAIRE }, [qualif]);
    assert.equal(etats.get('a')?.points, 8);
    assert.deepEqual(equipes, { rouge: 0, bleu: 0 });
  });
});

describe('Horaire', () => {
  it('compte 21 manches, dont 4 duels et 4 manches de finale', () => {
    assert.equal(HORAIRE.length, 21);
    assert.equal(HORAIRE.filter((m) => m.type === 'duel').length, 4);
    assert.equal(HORAIRE.filter((m) => m.finale).length, 4);
    assert.deepEqual(
      HORAIRE.map((m) => m.numero),
      Array.from({ length: 21 }, (_, i) => i + 1),
    );
  });

  it('à 7 joueurs : 20 manches, 3 duels, numérotées de 1 à 20', () => {
    const h = horairePour(7);
    assert.equal(h.length, 20);
    assert.deepEqual(
      h.flatMap((m) => (m.type === 'duel' ? [m.duel] : [])),
      [0, 1, 2],
    );
    assert.deepEqual(
      h.map((m) => m.numero),
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
    assert.equal(h.filter((m) => m.finale).length, 4);
  });

  it('tire les paires de duel des rivaux', () => {
    assert.deepEqual(pairesDeRivaux(JOUEURS_DEMO), [
      ['jo', 'max'],
      ['ben', 'seb'],
      ['fred', 'kev'],
      ['alex', 'oli'],
    ]);
  });
});
