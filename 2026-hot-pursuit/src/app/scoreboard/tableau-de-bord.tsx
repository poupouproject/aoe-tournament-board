'use client';

import { useEffect, useRef, useState } from 'react';

import { cx } from '@/lib/cx';
import { aDesChangements, comparerVues, doitOuvrirDuel } from '@/lib/tournoi/changements';
import type { VueScoreboard } from '@/lib/tournoi/vue';

import { Duel } from './duel';
import { Horloge } from './horloge';
import { Equipes, Prochaine, Rivalites, Ticker } from './panneaux';
import { BandeauLeader, Podium } from './podium';
import s from './scoreboard.module.css';
import { basculerSon, jouer, preparerAudio, useSonActif } from './son';
import { Tour } from './tour';

const LARGEUR = 1920;
const HAUTEUR = 1080;

/** Durées des effets, en millisecondes. */
const DUREE = {
  bandeauLeader: 3200,
  duelAutomatique: 12_000,
  aide: 5000,
} as const;

interface Effets {
  /** Augmente à chaque changement reçu : relance les animations. */
  vague: number;
  flash: ReadonlySet<string>;
  depassements: number;
  nouveauLeader: string | null;
}

interface EtatDuel {
  ouvert: boolean;
  /** Ouvert tout seul avant un duel : se referme après un moment. */
  automatique: boolean;
  generation: number;
}

/**
 * Scoreboard du projo 1. Le stage fait 1920×1080 et suit la taille de la fenêtre.
 *
 * Raccourcis : [1] classement · [2] face-à-face · [3] podium (tournoi terminé)
 * · [S] son. Un clic sur la carte « Prochaine manche » bascule le face-à-face.
 *
 * Chaque nouvelle vue reçue du direct est comparée à la précédente : les
 * lignes glissent, les points clignotent, un nouveau leader a droit à son
 * bandeau, et le face-à-face s'ouvre seul quand un duel s'annonce.
 */
export function TableauDeBord({ vue }: { vue: VueScoreboard }) {
  const stage = useRef<HTMLDivElement>(null);
  const termine = vue.prochaine === null;

  const [precedente, setPrecedente] = useState(vue);
  const [effets, setEffets] = useState<Effets>({
    vague: 0,
    flash: new Set(),
    depassements: 0,
    nouveauLeader: null,
  });
  const [bandeau, setBandeau] = useState<{ nom: string; vague: number } | null>(null);
  const [ecran, setEcran] = useState<'classement' | 'podium'>(termine ? 'podium' : 'classement');
  const [duel, setDuel] = useState<EtatDuel>(() => {
    const ouvrir = doitOuvrirDuel(null, vue);
    return { ouvert: ouvrir, automatique: ouvrir, generation: 0 };
  });
  const [aide, setAide] = useState({ visible: true, generation: 0 });
  const sonActif = useSonActif();

  // Nouvelle vue reçue du direct : on la compare à la précédente pendant le
  // rendu (motif « ajuster l'état quand une prop change » de React).
  if (vue !== precedente) {
    setPrecedente(vue);
    const changements = comparerVues(precedente, vue);
    if (aDesChangements(changements)) {
      const vague = effets.vague + 1;
      setEffets({
        vague,
        flash: new Set(changements.pointsChanges),
        depassements: changements.depassements.length,
        nouveauLeader: changements.nouveauLeader,
      });
      if (changements.nouveauLeader) setBandeau({ nom: changements.nouveauLeader, vague });
    }
    if (doitOuvrirDuel(precedente, vue)) {
      setDuel({ ouvert: true, automatique: true, generation: duel.generation + 1 });
    }
    if (vue.prochaine === null && precedente.prochaine !== null) setEcran('podium');
  }

  // Le son suit chaque vague d'effets.
  useEffect(() => {
    if (effets.vague === 0) return;
    if (effets.nouveauLeader) jouer('leader');
    else if (effets.depassements > 0) jouer('depassement');
  }, [effets]);

  // Le bandeau de nouveau leader s'efface seul.
  useEffect(() => {
    if (!bandeau) return;
    const minuterie = setTimeout(() => {
      setBandeau(null);
    }, DUREE.bandeauLeader);
    return () => {
      clearTimeout(minuterie);
    };
  }, [bandeau]);

  // Le face-à-face ouvert tout seul se referme après la « pesée ».
  useEffect(() => {
    if (!duel.ouvert || !duel.automatique) return;
    const minuterie = setTimeout(() => {
      setDuel((d) => ({ ...d, ouvert: false, automatique: false }));
    }, DUREE.duelAutomatique);
    return () => {
      clearTimeout(minuterie);
    };
  }, [duel]);

  // L'aide des raccourcis n'apparaît que quelques secondes.
  useEffect(() => {
    if (!aide.visible) return;
    const minuterie = setTimeout(() => {
      setAide((a) => ({ ...a, visible: false }));
    }, DUREE.aide);
    return () => {
      clearTimeout(minuterie);
    };
  }, [aide]);

  useEffect(() => {
    const ajuster = (): void => {
      const echelle = Math.min(window.innerWidth / LARGEUR, window.innerHeight / HAUTEUR);
      stage.current?.style.setProperty('--echelle', String(echelle));
    };
    const touche = (e: KeyboardEvent): void => {
      // Toute touche est un geste : le navigateur autorise alors l'audio.
      preparerAudio();
      setAide((a) => ({ visible: true, generation: a.generation + 1 }));
      const ouvrirDuel = (ouvert: boolean): void => {
        setDuel((d) => ({ ouvert, automatique: false, generation: d.generation + 1 }));
      };
      switch (e.key) {
        case '1':
          ouvrirDuel(false);
          setEcran('classement');
          break;
        case '2':
          ouvrirDuel(true);
          break;
        case '3':
          ouvrirDuel(false);
          setEcran('podium');
          break;
        case 's':
        case 'S':
          basculerSon();
          break;
      }
    };
    ajuster();
    window.addEventListener('resize', ajuster);
    window.addEventListener('keydown', touche);
    window.addEventListener('pointerdown', preparerAudio);
    return () => {
      window.removeEventListener('resize', ajuster);
      window.removeEventListener('keydown', touche);
      window.removeEventListener('pointerdown', preparerAudio);
    };
  }, []);

  const finaleAVenir = vue.prochaine?.finale ?? false;
  const podium = termine && ecran === 'podium';

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

        {podium ? (
          <Podium lignes={vue.lignes} equipes={vue.equipes} />
        ) : (
          <main className={s.corps}>
            <Tour lignes={vue.lignes} flash={effets.flash} vague={effets.vague} />
            <aside className={s.colonne}>
              <Equipes equipes={vue.equipes} />
              <Prochaine
                carte={vue.prochaine}
                onClick={() => {
                  setDuel((d) => ({
                    ouvert: !d.ouvert,
                    automatique: false,
                    generation: d.generation + 1,
                  }));
                }}
              />
              <Rivalites rivalites={vue.rivalites} />
            </aside>
          </main>
        )}

        <Ticker messages={vue.ticker} />

        {duel.ouvert && vue.duel && (
          <Duel
            duel={vue.duel}
            onClick={() => {
              setDuel((d) => ({ ...d, ouvert: false, automatique: false }));
            }}
          />
        )}

        {bandeau && <BandeauLeader key={bandeau.vague} nom={bandeau.nom} />}
      </div>
      <div className={cx(s.aide, aide.visible && s.aideVisible)}>
        [1] classement · [2] face-à-face{termine ? ' · [3] podium' : ''} · [S] son{' '}
        {sonActif ? 'activé' : 'coupé'}
      </div>
    </div>
  );
}
