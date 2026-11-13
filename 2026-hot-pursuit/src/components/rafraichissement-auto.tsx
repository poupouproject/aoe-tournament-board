'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const RECONNEXION_MS = 3000;

/**
 * Tient une page à jour en direct : le serveur pousse un événement `maj` (SSE,
 * /api/direct) dès que la base change, et la page se rafraîchit aussitôt.
 *
 * router.refresh() ne recharge pas la page : il redemande au serveur les
 * données et React n'applique que les différences.
 *
 * Filets de sécurité : EventSource se reconnecte seul ; à la reconnexion et au
 * retour de visibilité de l'onglet, on rafraîchit pour rattraper ce qui a pu
 * être manqué pendant la coupure.
 */
export function RafraichissementAuto() {
  const router = useRouter();

  useEffect(() => {
    let source: EventSource | null = null;
    let coupure = false;
    let minuterie: ReturnType<typeof setTimeout> | null = null;

    const rafraichir = (): void => {
      router.refresh();
    };

    const connecter = (): void => {
      source = new EventSource('/api/direct');
      source.addEventListener('maj', rafraichir);
      source.addEventListener('open', () => {
        if (coupure) {
          coupure = false;
          rafraichir();
        }
      });
      source.addEventListener('error', () => {
        coupure = true;
        // Fermé pour de bon (réponse invalide) : on relance nous-mêmes.
        if (source?.readyState === EventSource.CLOSED) {
          source.close();
          minuterie = setTimeout(connecter, RECONNEXION_MS);
        }
      });
    };

    const auRetour = (): void => {
      if (document.visibilityState === 'visible') rafraichir();
    };

    connecter();
    document.addEventListener('visibilitychange', auRetour);
    return () => {
      if (minuterie !== null) clearTimeout(minuterie);
      source?.close();
      document.removeEventListener('visibilitychange', auRetour);
    };
  }, [router]);

  return null;
}
