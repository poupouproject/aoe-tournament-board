'use client';

import { useState } from 'react';

import { adversaire, NOMS_EQUIPES } from '@/lib/tournoi/moteur';
import type { ContexteSaisie, JoueurSaisie } from '@/lib/tournoi/saisie';
import { gagnantHpParDefaut, membres, tirerRivaux } from '@/lib/tournoi/saisie';
import type { Equipe, Manche, Resultat } from '@/lib/tournoi/types';

import {
  Bloc,
  BoutonPrincipal,
  Choix,
  Compteur,
  FOND_EQUIPE,
  Jokers,
  OrdreArrivee,
  TEXTE_EQUIPE,
} from './commun';

/** Envoie le résultat ; le parent affiche le succès ou l'erreur. */
export type Envoyer = (resultat: Resultat) => void;

const jokersOuRien = (jokers: string[]): { jokers?: string[] } =>
  jokers.length > 0 ? { jokers } : {};

/** Qualifs et Race : l'ordre d'arrivée complet. */
export function FormulaireClassement({
  manche,
  joueurs,
  enCours,
  envoyer,
}: {
  manche: Extract<Manche, { type: 'qualif' | 'race' }>;
  joueurs: readonly JoueurSaisie[];
  enCours: boolean;
  envoyer: Envoyer;
}) {
  const [ordre, setOrdre] = useState<string[]>([]);
  const [jokers, setJokers] = useState<string[]>([]);
  const complet = ordre.length === joueurs.length;

  return (
    <>
      <Bloc
        titre="Ordre d'arrivée"
        consigne={
          manche.type === 'qualif'
            ? 'Classement cumulé des 3 Races : touchez les pilotes du 1er au dernier.'
            : 'Touchez les pilotes du 1er au dernier.'
        }
      >
        <OrdreArrivee joueurs={joueurs} ordre={ordre} onChange={setOrdre} />
      </Bloc>
      {manche.type === 'race' && (
        <Jokers joueurs={joueurs} choisis={jokers} finale={manche.finale} onChange={setJokers} />
      )}
      <BoutonPrincipal
        disabled={!complet || enCours}
        onClick={() => {
          envoyer({ type: manche.type, ordre, ...jokersOuRien(jokers) });
        }}
      >
        {complet
          ? 'Enregistrer la manche'
          : `Encore ${String(joueurs.length - ordre.length)} à placer`}
      </BoutonPrincipal>
    </>
  );
}

/** Hot Pursuit : racers échappés dans l'ordre, busts des cops, camp gagnant. */
export function FormulaireHp({
  manche,
  joueurs,
  enCours,
  envoyer,
}: {
  manche: Extract<Manche, { type: 'hp' }>;
  joueurs: readonly JoueurSaisie[];
  enCours: boolean;
  envoyer: Envoyer;
}) {
  const camps = { cops: manche.cops, racers: adversaire(manche.cops) };
  const racers = membres(joueurs, camps.racers);
  const cops = membres(joueurs, camps.cops);

  const [echappes, setEchappes] = useState<string[]>([]);
  const [busts, setBusts] = useState<Record<string, number>>({});
  const [gagnantChoisi, setGagnant] = useState<'cops' | 'racers' | null>(null);
  const [jokers, setJokers] = useState<string[]>([]);

  const bustes = racers.filter((r) => !echappes.includes(r.id));
  const totalBusts = Object.values(busts).reduce((s, n) => s + n, 0);
  const gagnant =
    gagnantChoisi ?? gagnantHpParDefaut(racers.map((r) => (echappes.includes(r.id) ? 1 : null)));

  return (
    <>
      <Bloc
        titre={`Racers · ${NOMS_EQUIPES[camps.racers]}`}
        consigne="Touchez ceux qui se sont échappés, dans l'ordre d'arrivée. Les autres sont bustés."
      >
        <OrdreArrivee joueurs={racers} ordre={echappes} onChange={setEchappes} />
        <p className="text-attenue text-sm">
          Bustés : {bustes.length ? bustes.map((r) => r.nom).join(', ') : 'personne'}
        </p>
      </Bloc>

      <Bloc
        titre={`Cops · ${NOMS_EQUIPES[camps.cops]}`}
        consigne="Combien de busts chacun a faits ?"
      >
        {cops.map((c) => (
          <Compteur
            key={c.id}
            libelle={c.nom}
            classe={TEXTE_EQUIPE[camps.cops]}
            valeur={busts[c.id] ?? 0}
            onChange={(n) => {
              setBusts({ ...busts, [c.id]: n });
            }}
          />
        ))}
        {totalBusts !== bustes.length && (
          <p className="text-or text-sm">
            {totalBusts} bust{totalBusts > 1 ? 's' : ''} pour {bustes.length} racer
            {bustes.length > 1 ? 's' : ''} busté{bustes.length > 1 ? 's' : ''}.
          </p>
        )}
      </Bloc>

      <Bloc titre="Camp gagnant" consigne="Selon l'écran de fin du jeu (+10 à l'équipe).">
        <Choix
          valeur={gagnant}
          onChange={setGagnant}
          options={[
            {
              valeur: 'cops',
              libelle: `Cops ${NOMS_EQUIPES[camps.cops]}`,
              classe: FOND_EQUIPE[camps.cops],
            },
            {
              valeur: 'racers',
              libelle: `Racers ${NOMS_EQUIPES[camps.racers]}`,
              classe: FOND_EQUIPE[camps.racers],
            },
          ]}
        />
      </Bloc>

      <Jokers joueurs={joueurs} choisis={jokers} finale={manche.finale} onChange={setJokers} />

      <BoutonPrincipal
        disabled={enCours}
        onClick={() => {
          envoyer({
            type: 'hp',
            racers: racers.map((r) => {
              const rang = echappes.indexOf(r.id);
              return { id: r.id, position: rang >= 0 ? rang + 1 : null };
            }),
            busts: Object.fromEntries(Object.entries(busts).filter(([, n]) => n > 0)),
            gagnant,
            ...jokersOuRien(jokers),
          });
        }}
      >
        Enregistrer la manche
      </BoutonPrincipal>
    </>
  );
}

/** Duel Interceptor : le gagnant de chaque manche, et le bris d'égalité si 1-1. */
export function FormulaireDuel({
  duel,
  joueurs,
  enCours,
  envoyer,
}: {
  duel: [string, string];
  joueurs: readonly JoueurSaisie[];
  enCours: boolean;
  envoyer: Envoyer;
}) {
  const [a, b] = duel;
  const nom = (id: string): string => joueurs.find((j) => j.id === id)?.nom ?? id;
  const options = [
    { valeur: a, libelle: nom(a), classe: 'bg-rouge' },
    { valeur: b, libelle: nom(b), classe: 'bg-bleu' },
  ];

  const [manche1, setManche1] = useState<string | null>(null);
  const [manche2, setManche2] = useState<string | null>(null);
  const [bris, setBris] = useState<string | null>(null);
  const [jokers, setJokers] = useState<string[]>([]);

  const egalite = manche1 !== null && manche2 !== null && manche1 !== manche2;
  const pret = manche1 !== null && manche2 !== null && (!egalite || bris !== null);

  return (
    <>
      <Bloc titre="Manche 1" consigne="Qui a gagné ?">
        <Choix valeur={manche1} onChange={setManche1} options={options} />
      </Bloc>
      <Bloc titre="Manche 2" consigne="Les rôles s'inversent. Qui a gagné ?">
        <Choix valeur={manche2} onChange={setManche2} options={options} />
      </Bloc>
      {egalite && (
        <Bloc
          titre="Bris d'égalité"
          consigne="1 à 1 : le racer qui s'est échappé le plus vite gagne. Personne ne s'est échappé ? Le cop qui a busté le plus vite."
        >
          <Choix valeur={bris} onChange={setBris} options={options} />
        </Bloc>
      )}
      <Jokers
        joueurs={joueurs.filter((j) => j.id === a || j.id === b)}
        choisis={jokers}
        finale={false}
        onChange={setJokers}
      />
      <BoutonPrincipal
        disabled={!pret || enCours}
        onClick={() => {
          if (!manche1 || !manche2) return;
          envoyer({
            type: 'duel',
            manches: [manche1, manche2],
            ...(egalite && bris ? { brisEgalite: bris } : {}),
            ...jokersOuRien(jokers),
          });
        }}
      >
        Enregistrer le duel
      </BoutonPrincipal>
    </>
  );
}

/** Draft : une équipe par joueur, puis les rivaux tirés au sort. */
export function FormulaireDraft({
  ctx,
  enCours,
  envoyer,
}: {
  ctx: ContexteSaisie;
  enCours: boolean;
  envoyer: (draft: { equipes: Record<string, Equipe>; rivaux: Record<string, string> }) => void;
}) {
  const [equipes, setEquipes] = useState<Record<string, Equipe>>(() => {
    const deja = ctx.joueurs.flatMap((j): [string, Equipe][] =>
      j.equipe ? [[j.id, j.equipe]] : [],
    );
    if (deja.length > 0) return Object.fromEntries(deja);
    // Premier draft : les capitaines sont placés d'office (1er Rouge, 2e Bleu).
    const [rouge, bleu] = ctx.capitaines;
    return {
      ...(rouge ? { [rouge.id]: 'rouge' } : {}),
      ...(bleu ? { [bleu.id]: 'bleu' } : {}),
    };
  });
  const [rivaux, setRivaux] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      ctx.joueurs.flatMap((j) => (j.equipe === 'rouge' && j.rivalId ? [[j.id, j.rivalId]] : [])),
    ),
  );

  const rouges = ctx.joueurs.filter((j) => equipes[j.id] === 'rouge');
  const bleus = ctx.joueurs.filter((j) => equipes[j.id] === 'bleu');
  const moitie = ctx.joueurs.length / 2;
  const equilibre = rouges.length === moitie && bleus.length === moitie;
  const tires = equilibre && rouges.every((r) => rivaux[r.id]);
  const nom = (id: string): string => ctx.joueurs.find((j) => j.id === id)?.nom ?? id;

  return (
    <>
      <Bloc
        titre="Équipes"
        consigne={
          ctx.capitaines.length === 2
            ? `Capitaines : ${ctx.capitaines[0]?.nom ?? ''} (Rouge) et ${ctx.capitaines[1]?.nom ?? ''} (Bleu). Ordre de choix : Bleu, Rouge, Rouge, Bleu, Bleu, Rouge.`
            : 'Choisissez une équipe pour chaque joueur.'
        }
      >
        {ctx.joueurs.map((j) => (
          <div key={j.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <span className="font-cond truncate text-xl font-bold uppercase">{j.nom}</span>
            <div className="w-52">
              <Choix
                valeur={equipes[j.id] ?? null}
                onChange={(e) => {
                  setEquipes({ ...equipes, [j.id]: e });
                  setRivaux({});
                }}
                options={[
                  { valeur: 'rouge', libelle: 'Rouge', classe: 'bg-rouge' },
                  { valeur: 'bleu', libelle: 'Bleu', classe: 'bg-bleu' },
                ]}
              />
            </div>
          </div>
        ))}
        <p className={equilibre ? 'text-attenue text-sm' : 'text-or text-sm'}>
          Rouge {rouges.length} · Bleu {bleus.length}
          {equilibre ? '' : ` (il faut ${String(moitie)} et ${String(moitie)})`}
        </p>
      </Bloc>

      <Bloc titre="Rivaux" consigne="Chaque rouge reçoit un rival bleu, tiré au sort.">
        <button
          type="button"
          disabled={!equilibre}
          onClick={() => {
            setRivaux(
              tirerRivaux(
                rouges.map((r) => r.id),
                bleus.map((b) => b.id),
              ),
            );
          }}
          className="border-ligne bg-panneau font-cond min-h-14 border text-lg font-bold uppercase disabled:opacity-30"
        >
          {tires ? 'Retirer au sort' : 'Tirer au sort'}
        </button>
        {tires &&
          rouges.map((r) => (
            <div
              key={r.id}
              className="font-cond grid grid-cols-[1fr_auto_1fr] text-xl font-bold uppercase"
            >
              <span className="text-rouge">{r.nom}</span>
              <span className="text-attenue px-3">vs</span>
              <span className="text-bleu text-right">{nom(rivaux[r.id] ?? '')}</span>
            </div>
          ))}
      </Bloc>

      <BoutonPrincipal
        disabled={!tires || enCours}
        onClick={() => {
          envoyer({ equipes, rivaux });
        }}
      >
        Valider le draft
      </BoutonPrincipal>
    </>
  );
}
