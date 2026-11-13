import { BAREME } from '@/lib/tournoi/bareme';
import { adversaire, NOMS_EQUIPES } from '@/lib/tournoi/moteur';
import type { Equipe } from '@/lib/tournoi/types';
import type { CarteProchaine, Rivalite } from '@/lib/tournoi/vue';

import { cx } from '@/lib/cx';

import s from './scoreboard.module.css';

const PASTILLE: Record<Equipe, string | undefined> = {
  rouge: s.pastilleRouge,
  bleu: s.pastilleBleu,
};

/** Guerre des équipes : Rouge contre Bleu, avec la barre de répartition. */
export function Equipes({ equipes }: { equipes: Record<Equipe, number> }) {
  const total = equipes.rouge + equipes.bleu || 1;
  const ecart = equipes.rouge - equipes.bleu;
  return (
    <div className={s.panneau}>
      <div className={s.titre}>Guerre des équipes</div>
      <div className={s.equipes}>
        <div className={s.equipeRouge}>
          <div className={s.equipeNom}>{NOMS_EQUIPES.rouge}</div>
          <div className={cx(s.equipePoints, s.num)}>{equipes.rouge}</div>
        </div>
        <div className={s.vs}>VS</div>
        <div className={s.equipeBleu}>
          <div className={s.equipeNom}>{NOMS_EQUIPES.bleu}</div>
          <div className={cx(s.equipePoints, s.num)}>{equipes.bleu}</div>
        </div>
      </div>
      <div className={s.barre}>
        <div
          className={s.barreRouge}
          style={{ width: `${String((equipes.rouge / total) * 100)}%` }}
        />
        <div
          className={s.barreBleu}
          style={{ width: `${String((equipes.bleu / total) * 100)}%` }}
        />
      </div>
      <div className={s.avance}>
        {ecart === 0
          ? 'Égalité parfaite'
          : `${ecart > 0 ? NOMS_EQUIPES.rouge : NOMS_EQUIPES.bleu} mène par ${String(Math.abs(ecart))} pts`}
      </div>
    </div>
  );
}

const MODES: Record<CarteProchaine['type'], string> = {
  qualif: 'Qualifs',
  race: 'Race',
  hp: 'Hot Pursuit',
  duel: 'Interceptor',
};

function Details({ carte }: { carte: CarteProchaine }) {
  switch (carte.type) {
    case 'qualif':
      return null;
    case 'race':
      return (
        <dl className={s.details}>
          <dt>Cible</dt>
          <dd>
            {carte.cible ?? '—'} <span className={s.or}>+{BAREME.prime}</span>
          </dd>
          <dt>Jokers</dt>
          <dd>
            {carte.finale
              ? 'Interdits en finale'
              : `${String(carte.jokersRestants)} encore disponibles`}
          </dd>
        </dl>
      );
    case 'hp': {
      const racers = adversaire(carte.cops);
      return (
        <dl className={s.details}>
          <dt>Cops</dt>
          <dd>
            <span className={cx(s.pastille, PASTILLE[carte.cops])}>{NOMS_EQUIPES[carte.cops]}</span>
          </dd>
          <dt>Racers</dt>
          <dd>
            <span className={cx(s.pastille, PASTILLE[racers])}>{NOMS_EQUIPES[racers]}</span>
          </dd>
          <dt>Enjeu</dt>
          <dd>+{BAREME.hpEquipeGagnante} au camp gagnant</dd>
        </dl>
      );
    }
    case 'duel':
      return (
        <dl className={s.details}>
          <dt>Duel</dt>
          <dd>
            <span className={cx(s.pastille, s.pastilleRouge)}>{carte.a}</span> vs{' '}
            <span className={cx(s.pastille, s.pastilleBleu)}>{carte.b}</span>
          </dd>
          <dt>Bilan</dt>
          <dd>
            {carte.bilan[0]} – {carte.bilan[1]}
          </dd>
          <dt>Enjeu</dt>
          <dd>
            +{BAREME.duelManche} / manche · +{BAREME.duelEquipe} équipe
          </dd>
        </dl>
      );
  }
}

/** Carte « Prochaine manche ». Un clic ouvre la vue face-à-face. */
export function Prochaine({
  carte,
  onClick,
}: {
  carte: CarteProchaine | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cx(s.panneau, s.prochaine)}
      title="Cliquer pour la vue face-à-face"
      onClick={onClick}
    >
      <div className={s.titre}>
        Prochaine manche
        {carte?.finale && (
          <>
            {' · '}
            <span className={s.or}>points ×2</span>
          </>
        )}
      </div>
      {carte ? (
        <>
          <div className={s.mode}>{MODES[carte.type]}</div>
          <div className={s.trace}>{carte.trace}</div>
          <Details carte={carte} />
        </>
      ) : (
        <div className={s.mode}>Podium</div>
      )}
    </button>
  );
}

/** Bilan face-à-face de chaque paire de rivaux. */
export function Rivalites({ rivalites }: { rivalites: readonly Rivalite[] }) {
  return (
    <div className={cx(s.panneau, s.rivalites)}>
      <div className={s.titre}>Rivalités · face-à-face</div>
      {rivalites.length === 0 ? (
        <div className={s.vide}>Rivaux tirés au sort après le draft</div>
      ) : (
        rivalites.map((r) => (
          <div key={`${r.a}-${r.b}`} className={s.rivalite}>
            <div className={s.rivaliteA}>{r.a}</div>
            <div className={cx(s.bilan, s.num)}>
              {r.bilan[0]}
              <i>–</i>
              {r.bilan[1]}
            </div>
            <div className={s.rivaliteB}>{r.b}</div>
          </div>
        ))
      )}
    </div>
  );
}

/** Bandeau « En direct » : les messages sont doublés pour boucler sans saut. */
export function Ticker({ messages }: { messages: readonly string[] }) {
  return (
    <div className={s.ticker}>
      <div className={s.direct}>EN DIRECT</div>
      <div className={s.defilement}>
        <div className={s.bandeau}>
          {[...messages, ...messages].map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
