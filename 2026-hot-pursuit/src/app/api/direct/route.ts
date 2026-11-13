import { abonnerAuxChangements } from '@/lib/direct';

/**
 * Flux Server-Sent Events : un événement `maj` à chaque changement de la base.
 * Les pages abonnées (RafraichissementAuto) se rafraîchissent aussitôt.
 */

export const dynamic = 'force-dynamic';

const PING_MS = 25_000;
const encodeur = new TextEncoder();

export function GET(request: Request): Response {
  let nettoyer = (): void => undefined;

  const flux = new ReadableStream<Uint8Array>({
    start(controleur) {
      let ferme = false;
      const envoyer = (texte: string): void => {
        if (ferme) return;
        try {
          controleur.enqueue(encodeur.encode(texte));
        } catch {
          nettoyer();
        }
      };

      // `retry` : délai de reconnexion du navigateur si le flux tombe.
      envoyer('retry: 2000\n: connecté\n\n');
      const desabonner = abonnerAuxChangements(() => {
        envoyer('event: maj\ndata: {}\n\n');
      });
      // Un commentaire régulier garde la connexion ouverte.
      const ping = setInterval(() => {
        envoyer(': ping\n\n');
      }, PING_MS);

      nettoyer = () => {
        if (ferme) return;
        ferme = true;
        clearInterval(ping);
        desabonner();
        try {
          controleur.close();
        } catch {
          // Déjà fermé par le client.
        }
      };
      request.signal.addEventListener('abort', nettoyer);
    },
    cancel() {
      nettoyer();
    },
  });

  return new Response(flux, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
