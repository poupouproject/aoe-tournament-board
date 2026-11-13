import { RafraichissementAuto } from '@/components/rafraichissement-auto';
import { chargerTournoi } from '@/lib/tournoi/donnees';
import { contexteSaisie } from '@/lib/tournoi/saisie';

import { EcranSaisie } from './ecran-saisie';

/** Écran de saisie, pensé pour un téléphone : n'importe qui peut entrer une manche. */
export default async function Saisie() {
  const { tournoi, resultats } = await chargerTournoi();
  return (
    <>
      {/* Une manche saisie sur un autre téléphone apparaît ici aussitôt. */}
      <RafraichissementAuto />
      <EcranSaisie ctx={contexteSaisie(tournoi, resultats)} />
    </>
  );
}
