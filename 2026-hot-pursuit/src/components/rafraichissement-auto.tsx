'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Tient une page à jour sans la recharger : router.refresh() redemande au
 * serveur les données de la page et React n'applique que les différences.
 * Pour un seul écran sur le LAN, un sondage aux quelques secondes suffit.
 */
export function RafraichissementAuto({ intervalleMs = 2000 }: { intervalleMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const minuterie = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalleMs);
    return () => {
      clearInterval(minuterie);
    };
  }, [router, intervalleMs]);

  return null;
}
