/**
 * Tests de la logique de saisie : contexte, validation des résultats, draft.
 *
 * Lancer avec : npm test
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { JOUEURS_DEMO, RESULTATS_DEMO } from '../src/lib/tournoi/demo';
import { HORAIRE } from '../src/lib/tournoi/horaire';
import {
  contexteSaisie,
  gagnantHpParDefaut,
  resumeManche,
  texteGains,
  tirerRivaux,
  validerDraft,
  validerResultat,
} from '../src/lib/tournoi/saisie';
import { migrerResultat, resultatSchema } from '../src/lib/tournoi/schemas';
import type { Equipe, Resultat, Tournoi } from '../src/lib/tournoi/types';

const DEMO: Tournoi = { joueurs: JOUEURS_DEMO, manches: HORAIRE };
const AVANT_DRAFT: Tournoi = {
  joueurs: JOUEURS_DEMO.map((j) => ({ ...j, equipe: null, rivalId: null })),
  manches: HORAIRE,
};
const IDS = JOUEURS_DEMO.map((j) => j.id);
const premieres = (n: number): readonly Resultat[] => RESULTATS_DEMO.slice(0, n);

describe('contexte de saisie', () => {
  it('annonce les qualifs le matin, draft après les qualifs', () => {
    const ctx = contexteSaisie(AVANT_DRAFT, []);
    assert.equal(ctx.manche?.type, 'qualif');
    assert.equal(ctx.draft, 'apres-qualifs');
  });

  it('exige le draft après les qualifs, puis le laisse modifiable', () => {
    assert.equal(contexteSaisie(AVANT_DRAFT, premieres(1)).draft, 'requis');
    assert.equal(contexteSaisie(DEMO, premieres(1)).draft, 'modifiable');
    assert.equal(contexteSaisie(DEMO, premieres(2)).draft, 'verrouille');
  });

  it('désigne les 2 premiers des qualifs comme capitaines', () => {
    assert.deepEqual(contexteSaisie(AVANT_DRAFT, premieres(1)).capitaines, [
      { id: 'max', nom: 'Max' },
      { id: 'jo', nom: 'Jonathan' },
    ]);
  });

  it('suit les jokers encore disponibles', () => {
    const ctx = contexteSaisie(DEMO, RESULTATS_DEMO);
    const sansJoker = ctx.joueurs.filter((j) => !j.jokerDisponible).map((j) => j.id);
    assert.deepEqual(sansJoker.sort(), ['ben', 'max', 'seb']);
  });

  it('donne les deux rivaux du prochain duel', () => {
    assert.deepEqual(contexteSaisie(DEMO, RESULTATS_DEMO).duel, ['jo', 'max']);
  });
});

describe('validation des résultats', () => {
  it('accepte toute la démo, manche par manche', () => {
    RESULTATS_DEMO.forEach((r, i) => {
      assert.equal(validerResultat(DEMO, premieres(i), r), null, `manche ${String(i + 1)}`);
    });
  });

  it('refuse un ordre incomplet ou avec doublon', () => {
    assert.match(
      validerResultat(DEMO, premieres(1), { type: 'race', ordre: IDS.slice(0, 7) }) ?? '',
      /une seule fois/,
    );
    const doublon = [...IDS.slice(0, 7), 'jo'];
    assert.ok(validerResultat(DEMO, premieres(1), { type: 'race', ordre: doublon }));
  });

  it('refuse un type qui ne correspond pas à la manche', () => {
    assert.ok(validerResultat(DEMO, premieres(1), { type: 'duel', manches: ['jo', 'jo'] }));
  });

  it('refuse un joker déjà utilisé', () => {
    const r: Resultat = { type: 'race', ordre: IDS, jokers: ['seb'] };
    assert.match(validerResultat(DEMO, premieres(5), r) ?? '', /Seb a déjà utilisé son joker/);
  });

  it('refuse plus de busts que de racers bustés', () => {
    const r: Resultat = {
      type: 'hp',
      racers: [
        { id: 'max', position: 1 },
        { id: 'seb', position: 2 },
        { id: 'kev', position: 3 },
        { id: 'oli', position: null },
      ],
      busts: { jo: 2 },
      gagnant: 'racers',
    };
    assert.match(validerResultat(DEMO, premieres(3), r) ?? '', /2 busts pour 1 racer/);
  });

  it('refuse un bust attribué à un racer', () => {
    const r: Resultat = {
      type: 'hp',
      racers: [
        { id: 'max', position: 1 },
        { id: 'seb', position: null },
        { id: 'kev', position: 2 },
        { id: 'oli', position: 3 },
      ],
      busts: { max: 1 },
      gagnant: 'racers',
    };
    assert.match(validerResultat(DEMO, premieres(3), r) ?? '', /cops/);
  });

  it('refuse un duel 1-1 sans bris d’égalité', () => {
    const r: Resultat = { type: 'duel', manches: ['jo', 'max'] };
    assert.match(validerResultat(DEMO, RESULTATS_DEMO, r) ?? '', /bris/);
    assert.equal(validerResultat(DEMO, RESULTATS_DEMO, { ...r, brisEgalite: 'max' }), null);
  });

  it('refuse un Hot Pursuit avant le draft', () => {
    const r: Resultat = { type: 'hp', racers: [], busts: {}, gagnant: 'cops' };
    assert.match(validerResultat(AVANT_DRAFT, premieres(3), r) ?? '', /draft/);
  });
});

describe('Hot Pursuit', () => {
  it('donne la victoire aux racers si au moins un s’échappe', () => {
    assert.equal(gagnantHpParDefaut([null, 1, null]), 'racers');
    assert.equal(gagnantHpParDefaut([null, null]), 'cops');
  });
});

describe('draft', () => {
  const rouges = ['jo', 'ben', 'fred', 'alex'];
  const bleus = ['max', 'seb', 'kev', 'oli'];
  const equipes: Record<string, Equipe> = Object.fromEntries([
    ...rouges.map((id): [string, Equipe] => [id, 'rouge']),
    ...bleus.map((id): [string, Equipe] => [id, 'bleu']),
  ]);

  it('tire un bleu différent pour chaque rouge', () => {
    for (const graine of [0, 0.3, 0.7, 0.99]) {
      const rivaux = tirerRivaux(rouges, bleus, () => graine);
      assert.deepEqual(Object.keys(rivaux), rouges);
      assert.deepEqual(Object.values(rivaux).sort(), [...bleus].sort());
    }
  });

  it('accepte un draft complet', () => {
    const rivaux = tirerRivaux(rouges, bleus);
    assert.equal(validerDraft(JOUEURS_DEMO, { equipes, rivaux }), null);
  });

  it('refuse des équipes inégales', () => {
    const inegales = { ...equipes, oli: 'rouge' as const };
    assert.match(validerDraft(JOUEURS_DEMO, { equipes: inegales, rivaux: {} }) ?? '', /inégales/);
  });

  it('refuse deux rouges avec le même rival', () => {
    const rivaux = { jo: 'max', ben: 'max', fred: 'kev', alex: 'oli' };
    assert.ok(validerDraft(JOUEURS_DEMO, { equipes, rivaux }));
  });
});

describe('résumé après enregistrement', () => {
  it('liste les gains de la manche, du plus gros au plus petit, avec le joker', () => {
    // Manche 3 de la démo : Seb gagne avec son joker.
    const resume = resumeManche(DEMO, premieres(3));
    assert.equal(resume.numero, 3);
    assert.deepEqual(resume.gains[0], { nom: 'Seb', points: 26, joker: true });
    assert.ok(resume.gains.every((g, i, t) => i === 0 || (t[i - 1]?.points ?? 0) >= g.points));
    assert.ok(resume.journal.includes('JOKER : Seb double sa manche'));
  });

  it('écarte les gains nuls (racers bustés)', () => {
    // Manche 9 : tous les racers rouges sont bustés ; Max (joker) fait 2 busts.
    const resume = resumeManche(DEMO, RESULTATS_DEMO);
    assert.deepEqual(
      resume.gains.map((g) => g.nom),
      ['Max', 'Kev', 'Olivier'],
    );
    assert.equal(resume.gains[0]?.joker, true);
  });

  it('formate les gains pour le bandeau', () => {
    assert.equal(
      texteGains([
        { nom: 'Seb', points: 26, joker: true },
        { nom: 'Jonathan', points: 9, joker: false },
      ]),
      'Seb +26 (joker) · Jonathan +9',
    );
    assert.equal(texteGains([]), 'Aucun point individuel.');
  });
});

describe('ancien format des qualifs', () => {
  it('convertit un ordre cumulé en une seule Race', () => {
    const ancien = { type: 'qualif', ordre: IDS };
    const r = resultatSchema.parse(migrerResultat(ancien));
    assert.deepEqual(r, { type: 'qualif', races: [IDS] });
  });

  it('laisse les autres résultats tels quels', () => {
    const race = { type: 'race', ordre: IDS };
    assert.equal(migrerResultat(race), race);
  });
});

describe('validation des qualifs', () => {
  it('refuse une Race incomplète', () => {
    const r: Resultat = { type: 'qualif', races: [IDS, IDS.slice(0, 7)] };
    assert.match(validerResultat(AVANT_DRAFT, [], r) ?? '', /Race 2/);
  });

  it('refuse un joker en qualifs', () => {
    const r: Resultat = { type: 'qualif', races: [IDS], jokers: ['jo'] };
    assert.match(validerResultat(AVANT_DRAFT, [], r) ?? '', /joker/);
  });

  it('accepte 1 à 3 Races complètes', () => {
    assert.equal(validerResultat(AVANT_DRAFT, [], { type: 'qualif', races: [IDS] }), null);
  });
});
