/** Barème du tournoi (voir docs/brief.md, section « Pointage »). */
export const BAREME = {
  /** Qualifications : 1er → 8e. */
  qualif: [8, 7, 6, 5, 4, 3, 2, 1],
  /** Race : barème compressé, un mauvais départ ne tue pas la journée. */
  race: [10, 8, 7, 6, 5, 4, 3, 2],
  /** Hot Pursuit, racer : selon l'ordre d'arrivée ; busté = 0. */
  hpRacer: [8, 6, 5, 4],
  /** Hot Pursuit, cop : par bust fait soi-même. */
  hpBust: 2,
  /** Hot Pursuit : au camp gagnant (score d'équipe). */
  hpEquipeGagnante: 10,
  /** Duel Interceptor : par manche de duel gagnée. */
  duelManche: 5,
  /** Duel gagné : à l'équipe du gagnant. */
  duelEquipe: 3,
  /** Race : finir devant le leader du championnat. */
  prime: 2,
  /** Race : battre son rival. */
  rival: 1,
  /** Finale : tout est multiplié. */
  multiplicateurFinale: 2,
  /** Joker : multiplie le gain individuel d'une manche. */
  multiplicateurJoker: 2,
} as const;
