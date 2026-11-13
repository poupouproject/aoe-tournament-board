'use client';

import { cx } from '@/lib/cx';
import { NOMS_EQUIPES } from '@/lib/tournoi/moteur';
import type { Equipe } from '@/lib/tournoi/types';
import type { LigneClassement } from '@/lib/tournoi/vue';

import s from './scoreboard.module.css';
import { TexteAjuste } from './texte-ajuste';

const COULEUR: Record<Equipe, string | undefined> = { rouge: s.texteRouge, bleu: s.texteBleu };
const HAUTEUR_MARCHE = [380, 280, 210] as const;

/** Écran de fin : le top 3 sur ses marches et le vainqueur de la guerre des équipes. */
export function Podium({
  lignes,
  equipes,
}: {
  lignes: readonly LigneClassement[];
  equipes: Record<Equipe, number>;
}) {
  const [premier, deuxieme, troisieme] = lignes;
  // Ordre visuel des marches : 2e, 1er, 3e.
  const marches = [
    { ligne: deuxieme, rang: 2 },
    { ligne: premier, rang: 1 },
    { ligne: troisieme, rang: 3 },
  ];
  const ecart = equipes.rouge - equipes.bleu;
  const gagnante: Equipe | null = ecart > 0 ? 'rouge' : ecart < 0 ? 'bleu' : null;

  return (
    <main className={s.podium}>
      <div className={s.titre}>Podium final</div>
      <div className={s.marches}>
        {marches.map(({ ligne, rang }) =>
          ligne ? (
            <div key={ligne.id} className={cx(s.marche, rang === 1 && s.marcheOr)}>
              <TexteAjuste
                texte={ligne.nom}
                max={rang === 1 ? 110 : 84}
                min={36}
                className={cx(s.marcheNom, ligne.equipe && COULEUR[ligne.equipe])}
              />
              <div className={cx(s.marchePoints, s.num)}>{ligne.points} pts</div>
              <div className={s.marcheBloc} style={{ height: HAUTEUR_MARCHE[rang - 1] }}>
                <span className={s.num}>{rang}</span>
              </div>
            </div>
          ) : (
            <div key={rang} />
          ),
        )}
      </div>
      <div className={s.vainqueurs}>
        {gagnante ? (
          <span>
            Équipe <b className={COULEUR[gagnante]}>{NOMS_EQUIPES[gagnante]}</b> remporte la guerre
            des équipes
          </span>
        ) : (
          <span>Guerre des équipes : égalité parfaite</span>
        )}
        <span className={s.num}>
          <b className={s.texteRouge}>{equipes.rouge}</b> –{' '}
          <b className={s.texteBleu}>{equipes.bleu}</b>
        </span>
      </div>
    </main>
  );
}

/** Bandeau plein écran quand la tête du championnat change. */
export function BandeauLeader({ nom }: { nom: string }) {
  return (
    <div className={s.bandeauLeader} role="status">
      <div className={s.bandeauGyro}>
        <span />
        <span />
      </div>
      <small>Nouveau leader</small>
      <TexteAjuste texte={nom} max={240} min={80} className={s.bandeauNom} />
      <div className={s.bandeauGyro}>
        <span />
        <span />
      </div>
    </div>
  );
}
