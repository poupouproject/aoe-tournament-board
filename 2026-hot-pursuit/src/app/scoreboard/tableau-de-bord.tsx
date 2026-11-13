'use client';

import { useEffect, useRef, useState } from 'react';

import type { VueScoreboard } from '@/lib/tournoi/vue';

import { Duel } from './duel';
import { Horloge } from './horloge';
import { Equipes, Prochaine, Rivalites, Ticker } from './panneaux';
import { cx } from '@/lib/cx';

import s from './scoreboard.module.css';
import { Tour } from './tour';

const LARGEUR = 1920;
const HAUTEUR = 1080;

/**
 * Scoreboard du projo 1. Le stage fait 1920×1080 et suit la taille de la fenêtre.
 * Raccourcis : [1] classement · [2] face-à-face ; un clic sur la carte
 * « Prochaine manche » bascule aussi la vue face-à-face.
 */
export function TableauDeBord({ vue }: { vue: VueScoreboard }) {
  const stage = useRef<HTMLDivElement>(null);
  const [faceAFace, setFaceAFace] = useState(false);

  useEffect(() => {
    const ajuster = (): void => {
      const echelle = Math.min(window.innerWidth / LARGEUR, window.innerHeight / HAUTEUR);
      stage.current?.style.setProperty('--echelle', String(echelle));
    };
    const touche = (e: KeyboardEvent): void => {
      if (e.key === '1') setFaceAFace(false);
      if (e.key === '2') setFaceAFace(true);
    };
    ajuster();
    window.addEventListener('resize', ajuster);
    window.addEventListener('keydown', touche);
    return () => {
      window.removeEventListener('resize', ajuster);
      window.removeEventListener('keydown', touche);
    };
  }, []);

  const finaleAVenir = vue.prochaine?.finale ?? false;

  return (
    <div className={s.ecran}>
      <div className={s.stage} ref={stage}>
        <div className={s.lightbar}>
          <span />
          <span />
        </div>

        <header className={s.entete}>
          <div className={s.marque}>
            <h1>
              <em>Grand Prix</em> de <b>Seacrest</b>
            </h1>
            <p>FDS Gaming 2026 · Tournoi Hot Pursuit</p>
          </div>
          <div className={s.meta}>
            {finaleAVenir && <div className={s.badgeX2}>POINTS ×2</div>}
            <div className={s.manche}>
              <small>
                {vue.prochainBloc ? `Prochain : ${vue.prochainBloc}` : 'Tournoi terminé'}
              </small>
              <strong className={s.num}>
                {String(vue.nbJouees).padStart(2, '0')}
                <span>/{vue.nbManches}</span>
              </strong>
            </div>
            <Horloge className={cx(s.horloge, s.num)} />
          </div>
        </header>

        <main className={s.corps}>
          <Tour lignes={vue.lignes} />
          <aside className={s.colonne}>
            <Equipes equipes={vue.equipes} />
            <Prochaine
              carte={vue.prochaine}
              onClick={() => {
                setFaceAFace((ouvert) => !ouvert);
              }}
            />
            <Rivalites rivalites={vue.rivalites} />
          </aside>
        </main>

        <Ticker messages={vue.ticker} />

        {faceAFace && vue.duel && (
          <Duel
            duel={vue.duel}
            onClick={() => {
              setFaceAFace(false);
            }}
          />
        )}
      </div>
      <div className={s.aide}>[1] classement · [2] face-à-face</div>
    </div>
  );
}
