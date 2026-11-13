'use client';

import { useSyncExternalStore } from 'react';

const deuxChiffres = (n: number): string => String(n).padStart(2, '0');

function heureCourante(): string {
  const d = new Date();
  return `${deuxChiffres(d.getHours())}:${deuxChiffres(d.getMinutes())}`;
}

function sAbonner(rappel: () => void): () => void {
  const minuterie = setInterval(rappel, 10_000);
  return () => {
    clearInterval(minuterie);
  };
}

/** L'heure de la salle, HH:MM. Rendue côté client seulement : le serveur ignore le fuseau. */
export function Horloge({ className }: { className: string }) {
  const heure = useSyncExternalStore(sAbonner, heureCourante, () => '--:--');
  return <div className={className}>{heure}</div>;
}
