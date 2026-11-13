/**
 * Diffuseur avec regroupement des rafales : plusieurs signaux rapprochés
 * (une écriture SQLite touche la base et son journal) ne produisent qu'un seul
 * événement, envoyé à tous les abonnés une fois le calme revenu.
 *
 * Indépendant de Node et de Next : les minuteries sont injectables pour les tests.
 */

export type Abonne = () => void;

export interface Diffuseur {
  /** Signale un changement ; la diffusion part après `delaiMs` sans nouveau signal. */
  signaler(): void;
  /** Ajoute un abonné ; renvoie la fonction qui le retire. */
  abonner(abonne: Abonne): () => void;
  nbAbonnes(): number;
}

export interface Minuteries {
  planifier: (rappel: () => void, delaiMs: number) => unknown;
  annuler: (minuterie: unknown) => void;
}

const MINUTERIES_PAR_DEFAUT: Minuteries = {
  planifier: (rappel, delaiMs) => setTimeout(rappel, delaiMs),
  annuler: (minuterie) => {
    clearTimeout(minuterie as ReturnType<typeof setTimeout>);
  },
};

export function creerDiffuseur(
  delaiMs: number,
  minuteries: Minuteries = MINUTERIES_PAR_DEFAUT,
): Diffuseur {
  const abonnes = new Set<Abonne>();
  let enAttente: unknown = null;

  const diffuser = (): void => {
    enAttente = null;
    for (const abonne of [...abonnes]) {
      try {
        abonne();
      } catch {
        // Un abonné défaillant (flux déjà fermé) ne doit pas priver les autres.
        abonnes.delete(abonne);
      }
    }
  };

  return {
    signaler() {
      if (enAttente !== null) minuteries.annuler(enAttente);
      enAttente = minuteries.planifier(diffuser, delaiMs);
    },
    abonner(abonne) {
      abonnes.add(abonne);
      return () => {
        abonnes.delete(abonne);
      };
    },
    nbAbonnes: () => abonnes.size,
  };
}

/** Chemin du fichier SQLite à partir de DATABASE_URL (`file:./dev.db`), relatif à `racine`. */
export function cheminBase(url: string, racine: string): string | null {
  if (!url.startsWith('file:')) return null;
  const chemin = url.slice('file:'.length).split('?')[0] ?? '';
  if (chemin === '') return null;
  if (chemin.startsWith('/')) return chemin;
  const relatif = chemin.replace(/^\.\//, '');
  return `${racine.replace(/\/$/, '')}/${relatif}`;
}

/** Vrai si `fichier` est la base ou l'un de ses fichiers annexes (-journal, -wal, -shm). */
export function concerneLaBase(fichier: string | null, nomBase: string): boolean {
  return fichier?.startsWith(nomBase) ?? false;
}
