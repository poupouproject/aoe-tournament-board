'use client';

import { useState } from 'react';

import { cx } from '@/lib/cx';
import { adversaire, classementQualif, NOMS_EQUIPES } from '@/lib/tournoi/moteur';
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

/** Race : jokers annoncés, puis l'ordre d'arrivée complet. */
export function FormulaireRace({
  manche,
  joueurs,
  enCours,
  envoyer,
}: {
  manche: Extract<Manche, { type: 'race' }>;
  joueurs: readonly JoueurSaisie[];
  enCours: boolean;
  envoyer: Envoyer;
}) {
  const [ordre, setOrdre] = useState<string[]>([]);
  const [jokers, setJokers] = useState<string[]>([]);
  const complet = ordre.length === joueurs.length;

  return (
    <>
      <Jokers joueurs={joueurs} choisis={jokers} finale={manche.finale} onChange={setJokers} />
      <Bloc titre="Ordre d'arrivée" consigne="Touchez les pilotes du 1er au dernier.">
        <OrdreArrivee joueurs={joueurs} ordre={ordre} onChange={setOrdre} />
      </Bloc>
      <BoutonPrincipal
        disabled={!complet || enCours}
        onClick={() => {
          envoyer({ type: 'race', ordre, ...jokersOuRien(jokers) });
        }}
      >
        {complet
          ? 'Enregistrer la manche'
          : `Encore ${String(joueurs.length - ordre.length)} à placer`}
      </BoutonPrincipal>
    </>
  );
}

const NB_RACES_QUALIF = 3;

/**
 * Qualifs : les 3 Races s'enchaînent sur le même écran. Le classement cumulé
 * (somme des positions) s'affiche dès qu'une Race est complète.
 */
export function FormulaireQualif({
  joueurs,
  enCours,
  envoyer,
}: {
  joueurs: readonly JoueurSaisie[];
  enCours: boolean;
  envoyer: Envoyer;
}) {
  const [races, setRaces] = useState<string[][]>(() =>
    Array.from({ length: NB_RACES_QUALIF }, () => []),
  );
  const [courante, setCourante] = useState(0);

  const complete = (r: readonly string[]): boolean => r.length === joueurs.length;
  const completes = races.filter(complete);
  const entamee = races.findIndex((r) => r.length > 0 && !complete(r));
  const pret = completes.length > 0 && entamee < 0;
  const ordreCourant = races[courante] ?? [];

  const changer = (ordre: string[]): void => {
    setRaces(races.map((r, i) => (i === courante ? ordre : r)));
    // Race terminée : on passe d'office à la suivante encore vide.
    const suivante = races.findIndex((r, i) => i > courante && r.length === 0);
    if (complete(ordre) && suivante >= 0) setCourante(suivante);
  };

  const nom = (id: string): string => joueurs.find((j) => j.id === id)?.nom ?? id;
  const somme = (id: string): number => completes.reduce((s, r) => s + r.indexOf(id) + 1, 0);

  return (
    <>
      <Bloc titre="Races de qualification" consigne="Saisissez chaque Race à la fin de sa course.">
        <div className="grid grid-cols-3 gap-2">
          {races.map((r, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={i === courante}
              onClick={() => {
                setCourante(i);
              }}
              className={cx(
                'font-cond border-ligne min-h-12 border text-lg font-bold uppercase',
                i === courante ? 'bg-texte text-fond' : 'bg-panneau',
              )}
            >
              Race {i + 1} {complete(r) ? '✓' : ''}
            </button>
          ))}
        </div>
      </Bloc>

      <Bloc
        titre={`Race ${String(courante + 1)} · ordre d'arrivée`}
        consigne="Touchez les pilotes du 1er au dernier."
      >
        <OrdreArrivee joueurs={joueurs} ordre={ordreCourant} onChange={changer} />
      </Bloc>

      {completes.length > 0 && (
        <Bloc
          titre={`Classement cumulé · ${String(completes.length)} Race${completes.length > 1 ? 's' : ''}`}
          consigne="Somme des positions : la plus petite gagne. Égalité : la meilleure à la dernière Race."
        >
          <ol className="bg-panneau border-ligne flex flex-col border">
            {classementQualif(completes).map((id, i) => (
              <li
                key={id}
                className="border-ligne flex items-center gap-3 border-t px-3 py-2 first:border-t-0"
              >
                <span className="font-cond w-6 text-xl font-extrabold">{i + 1}</span>
                <span className="font-cond flex-1 text-lg font-bold uppercase">{nom(id)}</span>
                <span className="text-attenue text-sm">{somme(id)} pts de position</span>
              </li>
            ))}
          </ol>
        </Bloc>
      )}

      <BoutonPrincipal
        disabled={!pret || enCours}
        onClick={() => {
          envoyer({ type: 'qualif', races: completes });
        }}
      >
        {entamee >= 0
          ? `Terminez la Race ${String(entamee + 1)}`
          : completes.length === NB_RACES_QUALIF
            ? 'Enregistrer les qualifs'
            : completes.length > 0
              ? `Enregistrer avec ${String(completes.length)} Race${completes.length > 1 ? 's' : ''}`
              : 'Saisissez la Race 1'}
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
  // L'écart busts / bustés ne s'affiche qu'une fois la saisie commencée.
  const [touche, setTouche] = useState(false);

  const bustes = racers.filter((r) => !echappes.includes(r.id));
  const totalBusts = Object.values(busts).reduce((s, n) => s + n, 0);
  const gagnant =
    gagnantChoisi ?? gagnantHpParDefaut(racers.map((r) => (echappes.includes(r.id) ? 1 : null)));

  return (
    <>
      <Jokers joueurs={joueurs} choisis={jokers} finale={manche.finale} onChange={setJokers} />

      <Bloc
        titre={`Racers · ${NOMS_EQUIPES[camps.racers]}`}
        consigne="Touchez ceux qui se sont échappés, dans l'ordre d'arrivée. Les autres sont bustés."
      >
        <OrdreArrivee
          joueurs={racers}
          ordre={echappes}
          onChange={(ordre) => {
            setEchappes(ordre);
            setTouche(true);
          }}
        />
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
              setTouche(true);
            }}
          />
        ))}
        {touche && totalBusts !== bustes.length && (
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
      <Jokers
        joueurs={joueurs.filter((j) => j.id === a || j.id === b)}
        choisis={jokers}
        finale={false}
        onChange={setJokers}
      />
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
