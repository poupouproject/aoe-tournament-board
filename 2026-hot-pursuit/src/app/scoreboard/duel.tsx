import { cx } from '@/lib/cx';
import { NOMS_EQUIPES } from '@/lib/tournoi/moteur';
import type { CoteDuel, VueScoreboard } from '@/lib/tournoi/vue';

import s from './scoreboard.module.css';
import { TexteAjuste } from './texte-ajuste';

function Cote({ cote, classe }: { cote: CoteDuel; classe: string | undefined }) {
  return (
    <div className={cx(s.cote, classe)}>
      <div className={s.etiquette}>{cote.equipe ? `Équipe ${NOMS_EQUIPES[cote.equipe]}` : ' '}</div>
      <TexteAjuste texte={cote.nom} max={170} min={56} className={s.grandNom} />
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
