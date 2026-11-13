import type { CSSProperties } from 'react';

import { NOMS_EQUIPES } from '@/lib/tournoi/moteur';
import type { CoteDuel, VueScoreboard } from '@/lib/tournoi/vue';

import { cx } from '@/lib/cx';

import s from './scoreboard.module.css';

function Cote({ cote, classe }: { cote: CoteDuel; classe: string | undefined }) {
  return (
    <div className={cx(s.cote, classe)}>
      <div className={s.etiquette}>{cote.equipe ? `Équipe ${NOMS_EQUIPES[cote.equipe]}` : ' '}</div>
      <div
        className={s.grandNom}
        style={{ '--fs': cote.nom.length > 6 ? '130px' : '170px' } as CSSProperties}
      >
        {cote.nom}
      </div>
      <div className={s.stats}>
        <div>
          Position
          <b>
            {cote.position}
            <sup>e</sup>
          </b>
        </div>
        <div>
          Points<b>{cote.points}</b>
        </div>
      </div>
    </div>
  );
}

/** Vue face-à-face plein écran, pour annoncer un duel Interceptor. */
export function Duel({
  duel,
  onClick,
}: {
  duel: NonNullable<VueScoreboard['duel']>;
  onClick: () => void;
}) {
  return (
    <div className={s.duel} onClick={onClick} role="presentation">
      <Cote cote={duel.a} classe={s.coteRouge} />
      <div className={s.milieu}>
        <div className={s.versus}>VS</div>
        <div className={cx(s.faceAFace, s.num)}>
          {duel.bilan[0]} – {duel.bilan[1]}
        </div>
        <small>Face-à-face</small>
        <div className={s.format}>INTERCEPTOR · MEILLEUR DE 2</div>
      </div>
      <Cote cote={duel.b} classe={s.coteBleu} />
    </div>
  );
}
