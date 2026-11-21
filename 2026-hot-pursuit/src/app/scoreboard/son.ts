'use client';

import { useSyncExternalStore } from 'react';

/**
 * Son du scoreboard : de courts signaux synthétisés avec Web Audio, sans
 * fichier. Coupé par défaut ; la touche S le bascule et le choix est retenu
 * dans le navigateur. Le navigateur n'autorise l'audio qu'après un geste
 * (touche, clic) : le contexte audio n'est créé qu'à ce moment.
 */

const CLE = 'hot-pursuit:son';
const EVENEMENT = 'hot-pursuit:son';

function lire(): boolean {
  try {
    return window.localStorage.getItem(CLE) === '1';
  } catch {
    return false;
  }
}

function sAbonner(rappel: () => void): () => void {
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener('storage', rappel);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener('storage', rappel);
  };
}

/** Le son est-il activé ? Coupé au rendu serveur. */
export function useSonActif(): boolean {
  return useSyncExternalStore(sAbonner, lire, () => false);
}

let contexte: AudioContext | null = null;

/** À appeler sur un geste de l'utilisateur : crée ou réveille le contexte audio. */
export function preparerAudio(): void {
  if (!lire()) return;
  try {
    contexte ??= new AudioContext();
    if (contexte.state === 'suspended') void contexte.resume();
  } catch {
    // Pas d'audio dans ce navigateur : le scoreboard reste muet.
  }
}

/** Active ou coupe le son (touche S, qui compte comme geste). */
export function basculerSon(): void {
  const actif = !lire();
  try {
    window.localStorage.setItem(CLE, actif ? '1' : '0');
  } catch {
    // Stockage indisponible : le choix vaut pour cette page seulement.
  }
  window.dispatchEvent(new Event(EVENEMENT));
  if (actif) preparerAudio();
}

const MOTIFS = {
  /** Deux notes descendantes, façon sirène : un dépassement. */
  depassement: [880, 660],
  /** Arpège montant : nouveau leader. */
  leader: [660, 880, 990, 1320],
} as const;

export function jouer(motif: keyof typeof MOTIFS): void {
  const ctx = contexte;
  if (!lire() || ctx?.state !== 'running') return;
  const depart = ctx.currentTime;
  MOTIFS[motif].forEach((frequence, i) => {
    const oscillateur = ctx.createOscillator();
    const volume = ctx.createGain();
    const debut = depart + i * 0.12;
    oscillateur.type = 'square';
    oscillateur.frequency.value = frequence;
    volume.gain.setValueAtTime(0.0001, debut);
    volume.gain.exponentialRampToValueAtTime(0.12, debut + 0.01);
    volume.gain.exponentialRampToValueAtTime(0.0001, debut + 0.11);
    oscillateur.connect(volume).connect(ctx.destination);
    oscillateur.start(debut);
    oscillateur.stop(debut + 0.12);
  });
}
