import { RafraichissementAuto } from '@/components/rafraichissement-auto';
import { chargerTournoi } from '@/lib/tournoi/donnees';
import { construireVue } from '@/lib/tournoi/vue';

import { TableauDeBord } from './tableau-de-bord';

/** Projo 1 : la « tour de contrôle », rafraîchie seule après chaque saisie. */
export default async function Scoreboard() {
  const { tournoi, resultats } = await chargerTournoi();
  return (
    <>
      <RafraichissementAuto />
      <TableauDeBord vue={construireVue(tournoi, resultats)} />
    </>
  );
}
