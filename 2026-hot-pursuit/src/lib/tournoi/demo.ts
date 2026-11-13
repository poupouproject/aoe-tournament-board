import type { Joueur, Resultat } from './types';

/**
 * Jeu de démo repris de la maquette : 8 noms bidon, équipes et rivaux déjà
 * tirés, et les 9 premières manches jouées. Sert au seed `npm run db:demo` et
 * de référence aux tests du moteur.
 */

export const JOUEURS_DEMO: readonly Joueur[] = [
  { id: 'jo', nom: 'Jonathan', equipe: 'rouge', rivalId: 'max', ordre: 0 },
  { id: 'ben', nom: 'Ben', equipe: 'rouge', rivalId: 'seb', ordre: 1 },
  { id: 'fred', nom: 'Fred', equipe: 'rouge', rivalId: 'kev', ordre: 2 },
  { id: 'alex', nom: 'Alex', equipe: 'rouge', rivalId: 'oli', ordre: 3 },
  { id: 'max', nom: 'Max', equipe: 'bleu', rivalId: 'jo', ordre: 4 },
  { id: 'seb', nom: 'Seb', equipe: 'bleu', rivalId: 'ben', ordre: 5 },
  { id: 'kev', nom: 'Kev', equipe: 'bleu', rivalId: 'fred', ordre: 6 },
  { id: 'oli', nom: 'Olivier', equipe: 'bleu', rivalId: 'alex', ordre: 7 },
];

export const RESULTATS_DEMO: readonly Resultat[] = [
  // Cumul des positions : max 4, jo 6, seb 9, ben 12, kev 15, fred 18, oli 21, alex 23.
  {
    type: 'qualif',
    races: [
      ['jo', 'max', 'seb', 'kev', 'ben', 'fred', 'alex', 'oli'],
      ['max', 'seb', 'jo', 'ben', 'fred', 'kev', 'oli', 'alex'],
      ['max', 'jo', 'ben', 'seb', 'kev', 'oli', 'fred', 'alex'],
    ],
  },
  { type: 'race', ordre: ['jo', 'max', 'ben', 'seb', 'fred', 'kev', 'alex', 'oli'] },
  {
    type: 'race',
    ordre: ['seb', 'jo', 'max', 'kev', 'ben', 'alex', 'fred', 'oli'],
    jokers: ['seb'],
  },
  {
    type: 'hp',
    racers: [
      { id: 'max', position: 1 },
      { id: 'seb', position: 2 },
      { id: 'kev', position: null },
      { id: 'oli', position: null },
    ],
    busts: { jo: 1, fred: 1 },
    gagnant: 'racers',
  },
  {
    type: 'hp',
    racers: [
      { id: 'jo', position: 1 },
      { id: 'fred', position: 2 },
      { id: 'ben', position: null },
      { id: 'alex', position: null },
    ],
    busts: { max: 1, kev: 1 },
    gagnant: 'racers',
  },
  { type: 'race', ordre: ['max', 'seb', 'jo', 'ben', 'kev', 'oli', 'fred', 'alex'] },
  {
    type: 'race',
    ordre: ['ben', 'jo', 'max', 'fred', 'seb', 'alex', 'kev', 'oli'],
    jokers: ['ben'],
  },
  {
    type: 'hp',
    racers: [
      { id: 'seb', position: 1 },
      { id: 'max', position: null },
      { id: 'kev', position: null },
      { id: 'oli', position: null },
    ],
    busts: { ben: 2, alex: 1 },
    gagnant: 'racers',
  },
  {
    type: 'hp',
    racers: [
      { id: 'jo', position: null },
      { id: 'ben', position: null },
      { id: 'fred', position: null },
      { id: 'alex', position: null },
    ],
    busts: { max: 2, oli: 1, kev: 1 },
    gagnant: 'cops',
    jokers: ['max'],
  },
];
