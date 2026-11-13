'use client';

import { useLayoutEffect, useRef } from 'react';

/**
 * Un texte sur une ligne qui rapetisse jusqu'à tenir dans sa boîte : un
 * prénom comme « Maximilien-Alexandre » ne déborde jamais. Les mesures
 * (scrollWidth, clientWidth) sont en pixels de mise en page, donc justes même
 * dans le stage mis à l'échelle.
 */
export function TexteAjuste({
  texte,
  max,
  min,
  className,
}: {
  texte: string;
  /** Taille de départ, en pixels du stage. */
  max: number;
  /** Taille plancher : en dessous, l'ellipse CSS prend le relais. */
  min: number;
  className?: string | undefined;
}) {
  const boite = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = boite.current;
    if (!el) return;
    const ajuster = (): void => {
      let taille = max;
      el.style.fontSize = `${String(taille)}px`;
      while (el.scrollWidth > el.clientWidth && taille > min) {
        taille = Math.max(min, taille - 2);
        el.style.fontSize = `${String(taille)}px`;
      }
    };
    ajuster();
    // Les polices locales peuvent arriver après le premier rendu : on remesure.
    let actif = true;
    void document.fonts.ready.then(() => {
      if (actif) ajuster();
    });
    return () => {
      actif = false;
    };
  }, [texte, max, min]);

  return (
    <div ref={boite} className={className} style={{ fontSize: max }}>
      {texte}
    </div>
  );
}
