import 'server-only';

import { watch } from 'node:fs';
import path from 'node:path';

import { cheminBase, concerneLaBase, creerDiffuseur, type Diffuseur } from './diffuseur';

/**
 * Mises à jour en direct : la source de vérité est le fichier SQLite.
 *
 * On surveille son dossier ; toute écriture (Server Action, seed, Prisma
 * Studio) touche `dev.db` ou son journal, et les abonnés (les flux SSE de
 * /api/direct) en sont avertis une fois la rafale terminée.
 *
 * Un seul diffuseur et un seul watcher par processus, gardés sur globalThis :
 * le rechargement à chaud de `next dev` réévalue ce module sans les dupliquer.
 */

const DELAI_MS = 150;

const globalPourDirect = globalThis as unknown as {
  directDiffuseur: Diffuseur | undefined;
  directSurveillance: boolean | undefined;
};

function diffuseur(): Diffuseur {
  globalPourDirect.directDiffuseur ??= creerDiffuseur(DELAI_MS);
  if (!globalPourDirect.directSurveillance) {
    globalPourDirect.directSurveillance = true;
    surveiller(globalPourDirect.directDiffuseur);
  }
  return globalPourDirect.directDiffuseur;
}

function surveiller(cible: Diffuseur): void {
  const fichier = cheminBase(process.env.DATABASE_URL ?? 'file:./dev.db', process.cwd());
  if (!fichier) {
    console.warn(
      '[direct] DATABASE_URL ne désigne pas un fichier : pas de mises à jour en direct.',
    );
    return;
  }
  const nom = path.basename(fichier);
  try {
    const watcher = watch(path.dirname(fichier), (_evenement, modifie) => {
      if (concerneLaBase(modifie, nom)) cible.signaler();
    });
    watcher.on('error', (erreur) => {
      console.warn('[direct] surveillance interrompue :', erreur);
      globalPourDirect.directSurveillance = false;
    });
    // Le watcher ne doit pas empêcher le processus de s'arrêter.
    watcher.unref();
  } catch (erreur) {
    console.warn('[direct] surveillance impossible :', erreur);
    globalPourDirect.directSurveillance = false;
  }
}

/** S'abonne aux changements de la base ; renvoie la fonction de désabonnement. */
export function abonnerAuxChangements(rappel: () => void): () => void {
  return diffuseur().abonner(rappel);
}
