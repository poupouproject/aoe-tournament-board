'use client';

import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { cx } from '@/lib/cx';
import type { LigneClassement } from '@/lib/tournoi/vue';

import s from './scoreboard.module.css';
import { TexteAjuste } from './texte-ajuste';

const COULEUR_EQUIPE = { rouge: 'var(--red)', bleu: 'var(--blue)' } as const;

function Variation({ valeur }: { valeur: number }) {
  if (valeur > 0) return <span className={cx(s.delta, s.monte)}>▲{valeur}</span>;
  if (valeur < 0) return <span className={cx(s.delta, s.descend)}>▼{-valeur}</span>;
  return <span className={cx(s.delta, s.stable)}>—</span>;
}

/**
 * Tour de classement style F1.
 *
 * Quand le classement change, chaque ligne glisse de son ancienne place à la
 * nouvelle (technique FLIP : on mesure avant et après le rendu, puis on anime
 * l'écart) et les points qui ont bougé clignotent.
 */
export function Tour({
  lignes,
  flash,
  vague,
}: {
  lignes: readonly LigneClassement[];
  /** Joueurs dont les points viennent de changer. */
  flash: ReadonlySet<string>;
  /** Numéro de la dernière vague d'effets : relance le clignotement. */
  vague: number;
}) {
  const elements = useRef(new Map<string, HTMLDivElement>());
  const hauteurs = useRef(new Map<string, number>());

  // L'animation d'entrée ne joue qu'à l'ouverture de la page, pas quand
  // React déplace une ligne dans le DOM.
  const [entree, setEntree] = useState(true);
  useEffect(() => {
    const minuterie = setTimeout(() => {
      setEntree(false);
    }, 1500);
    return () => {
      clearTimeout(minuterie);
    };
  }, []);

  const ordre = lignes.map((l) => l.id).join(',');
  useLayoutEffect(() => {
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nouvelles = new Map<string, number>();
    for (const [id, el] of elements.current) {
      const haut = el.offsetTop;
      nouvelles.set(id, haut);
      const avant = hauteurs.current.get(id);
      if (!reduit && avant !== undefined && avant !== haut) {
        el.animate(
          [{ transform: `translateY(${String(avant - haut)}px)` }, { transform: 'translateY(0)' }],
          { duration: 900, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        );
      }
    }
    hauteurs.current = nouvelles;
  }, [ordre]);

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
      <div className={cx(s.lignes, entree && s.entree)}>
        {lignes.map((l, i) => {
          const clignote = flash.has(l.id);
          return (
            <div
              key={l.id}
              ref={(el) => {
                if (el) elements.current.set(l.id, el);
                return () => {
                  elements.current.delete(l.id);
                };
              }}
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
                  <TexteAjuste texte={l.nom} max={44} min={22} className={s.nom} />
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
              {/* Une nouvelle clé relance l'animation de clignotement. */}
              <div
                key={clignote ? `flash-${String(vague)}` : 'fixe'}
                className={cx(s.points, clignote && s.flash)}
              >
                {l.points}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
