import type { CSSProperties } from 'react';

import type { LigneClassement } from '@/lib/tournoi/vue';

import { cx } from '@/lib/cx';

import s from './scoreboard.module.css';

const COULEUR_EQUIPE = { rouge: 'var(--red)', bleu: 'var(--blue)' } as const;

function Variation({ valeur }: { valeur: number }) {
  if (valeur > 0) return <span className={cx(s.delta, s.monte)}>▲{valeur}</span>;
  if (valeur < 0) return <span className={cx(s.delta, s.descend)}>▼{-valeur}</span>;
  return <span className={cx(s.delta, s.stable)}>—</span>;
}

/** Tour de classement style F1. */
export function Tour({ lignes }: { lignes: readonly LigneClassement[] }) {
  return (
    <section className={s.tour}>
      <div className={s.colonnes}>
        <div>Pos</div>
        <div />
        <div>Pilote</div>
        <div />
        <div>Dern.</div>
        <div>Écart</div>
        <div>Pts</div>
      </div>
      <div className={s.lignes}>
        {lignes.map((l, i) => (
          <div
            key={l.id}
            className={cx(s.ligne, l.leader && s.leader)}
            style={{ '--i': i } as CSSProperties}
          >
            <div className={s.pos}>{l.position}</div>
            <div>
              <Variation valeur={l.variation} />
            </div>
            <div className={s.pilote}>
              <span
                className={s.bande}
                style={l.equipe ? { background: COULEUR_EQUIPE[l.equipe] } : undefined}
              />
              <div>
                <div className={s.nom}>{l.nom}</div>
                <div className={s.rival}>rival · {l.rivalNom ?? 'à tirer'}</div>
              </div>
            </div>
            <div className={s.badges}>
              {l.leader && <span className={cx(s.badge, s.cible)}>Cible</span>}
              <span className={cx(s.badge, s.joker, l.jokerUtilise && s.utilise)}>Joker</span>
            </div>
            <div className={cx(s.derniere, l.derniere === 0 && s.zero)}>
              {l.derniere ? `+${String(l.derniere)}` : '—'}
            </div>
            <div className={cx(s.ecart, l.leader && s.enTete)}>
              {l.leader ? 'LEADER' : l.ecart === 0 ? '—' : `−${String(l.ecart)}`}
            </div>
            <div className={s.points}>{l.points}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
