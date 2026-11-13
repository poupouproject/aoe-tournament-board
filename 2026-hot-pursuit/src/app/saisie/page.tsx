import { chargerTournoi } from '@/lib/tournoi/donnees';
import { prochaineManche } from '@/lib/tournoi/moteur';

import { annulerDerniereManche } from './actions';

/**
 * Écran de saisie de l'organisateur, pensé pour un téléphone.
 * Coquille : la prochaine manche et l'annulation sont en place ; les
 * formulaires par type de manche (Race, Hot Pursuit, Duel) restent à faire.
 */
export default async function Saisie() {
  const { tournoi, resultats } = await chargerTournoi();
  const prochaine = prochaineManche(tournoi, resultats.length);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-attenue text-sm uppercase">
          {resultats.length}/{tournoi.manches.length} manches jouées
        </p>
        <h1 className="text-2xl font-extrabold uppercase">
          {prochaine ? `Manche ${String(prochaine.numero)} · ${prochaine.type}` : 'Tournoi terminé'}
        </h1>
        {prochaine && (
          <p className="text-attenue">
            {prochaine.bloc} · {prochaine.trace}
          </p>
        )}
      </header>

      <section className="border-ligne bg-panneau text-attenue border border-dashed p-6 text-center">
        Formulaire de saisie à venir
      </section>

      {resultats.length > 0 && (
        <form action={annulerDerniereManche}>
          <button
            type="submit"
            className="border-rouge text-rouge w-full border px-4 py-3 font-bold uppercase"
          >
            Annuler la manche {resultats.length}
          </button>
        </form>
      )}
    </main>
  );
}
