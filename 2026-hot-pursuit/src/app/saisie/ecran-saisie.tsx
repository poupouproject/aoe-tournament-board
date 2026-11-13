'use client';

import { useState, useTransition } from 'react';

import { cx } from '@/lib/cx';
import { NOMS_EQUIPES } from '@/lib/tournoi/moteur';
import type { ContexteSaisie } from '@/lib/tournoi/saisie';
import type { Manche } from '@/lib/tournoi/types';

import type { Retour } from './actions';
import {
  annulerDerniereManche,
  changerTrace,
  enregistrerDraft,
  enregistrerResultat,
  renommerJoueurs,
} from './actions';
import { Bloc, BoutonPrincipal } from './commun';
import { FormulaireClassement, FormulaireDraft, FormulaireDuel, FormulaireHp } from './formulaires';

const MODES: Record<Manche['type'], string> = {
  qualif: 'Qualifications',
  race: 'Race',
  hp: 'Hot Pursuit',
  duel: 'Duel Interceptor',
};

type Message = { ok: boolean; texte: string } | null;

/** Écran de saisie : la prochaine manche, et les outils autour (draft, noms, annuler). */
export function EcranSaisie({ ctx }: { ctx: ContexteSaisie }) {
  const [message, setMessage] = useState<Message>(null);
  const [enCours, demarrer] = useTransition();

  /** Appelle une Server Action et affiche le résultat en haut de l'écran. */
  const envoyer = (action: () => Promise<Retour>, succes: string): void => {
    demarrer(async () => {
      const retour = await action();
      setMessage(retour.ok ? { ok: true, texte: succes } : { ok: false, texte: retour.erreur });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const { manche } = ctx;
  const enregistrer = (r: Parameters<typeof enregistrerResultat>[0]): void => {
    envoyer(() => enregistrerResultat(r), `Manche ${String(manche?.numero ?? '')} enregistrée ✓`);
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-6 pb-16">
      {message && (
        <button
          type="button"
          onClick={() => {
            setMessage(null);
          }}
          className={cx(
            'sticky top-2 z-10 px-4 py-3 text-left font-semibold',
            message.ok ? 'bg-[#2ee59d] text-[#04130c]' : 'bg-rouge text-white',
          )}
        >
          {message.texte}
        </button>
      )}

      <EnTete ctx={ctx} enCours={enCours} envoyer={envoyer} />

      {ctx.draft === 'requis' ? (
        <>
          <p className="border-or text-or border px-4 py-3">
            Les qualifs sont saisies : faites le draft avant la manche 2.
          </p>
          <FormulaireDraft
            ctx={ctx}
            enCours={enCours}
            envoyer={(d) => {
              envoyer(() => enregistrerDraft(d), 'Draft enregistré ✓');
            }}
          />
        </>
      ) : manche ? (
        <Formulaire
          key={manche.numero}
          ctx={ctx}
          manche={manche}
          enCours={enCours}
          envoyer={enregistrer}
        />
      ) : (
        <p className="font-cond text-or text-center text-4xl font-extrabold uppercase">
          Tournoi terminé · Podium !
        </p>
      )}

      <div className="border-ligne mt-4 flex flex-col gap-3 border-t pt-6">
        {ctx.nbJouees > 0 && (
          <button
            type="button"
            disabled={enCours}
            onClick={() => {
              if (
                window.confirm(
                  `Annuler la manche ${String(ctx.nbJouees)} ? Son résultat sera effacé.`,
                )
              ) {
                envoyer(annulerDerniereManche, `Manche ${String(ctx.nbJouees)} annulée`);
              }
            }}
            className="border-rouge text-rouge font-cond min-h-12 border text-lg font-bold uppercase"
          >
            ↶ Annuler la manche {ctx.nbJouees}
          </button>
        )}

        {ctx.draft === 'modifiable' && (
          <Repli titre="Modifier le draft">
            <FormulaireDraft
              ctx={ctx}
              enCours={enCours}
              envoyer={(d) => {
                envoyer(() => enregistrerDraft(d), 'Draft enregistré ✓');
              }}
            />
          </Repli>
        )}

        <Repli titre="Noms des joueurs">
          <Noms ctx={ctx} enCours={enCours} envoyer={envoyer} />
        </Repli>
      </div>
    </main>
  );
}

function Formulaire({
  ctx,
  manche,
  enCours,
  envoyer,
}: {
  ctx: ContexteSaisie;
  manche: Manche;
  enCours: boolean;
  envoyer: Parameters<typeof FormulaireClassement>[0]['envoyer'];
}) {
  switch (manche.type) {
    case 'qualif':
    case 'race':
      return (
        <FormulaireClassement
          manche={manche}
          joueurs={ctx.joueurs}
          enCours={enCours}
          envoyer={envoyer}
        />
      );
    case 'hp':
      return (
        <FormulaireHp manche={manche} joueurs={ctx.joueurs} enCours={enCours} envoyer={envoyer} />
      );
    case 'duel':
      return ctx.duel ? (
        <FormulaireDuel duel={ctx.duel} joueurs={ctx.joueurs} enCours={enCours} envoyer={envoyer} />
      ) : (
        <p className="text-or">Les rivaux ne sont pas tirés : faites d&apos;abord le draft.</p>
      );
  }
}

function EnTete({
  ctx,
  enCours,
  envoyer,
}: {
  ctx: ContexteSaisie;
  enCours: boolean;
  envoyer: (action: () => Promise<Retour>, succes: string) => void;
}) {
  const [edition, setEdition] = useState(false);
  const { manche } = ctx;

  return (
    <header className="flex flex-col gap-1">
      <p className="text-attenue text-sm tracking-[0.2em] uppercase">
        {manche
          ? `Manche ${String(manche.numero)}/${String(ctx.nbManches)} · ${manche.bloc}`
          : `${String(ctx.nbJouees)}/${String(ctx.nbManches)} manches`}
        {manche?.finale && <span className="text-or"> · points ×2</span>}
      </p>
      {manche && (
        <>
          <h1 className="font-cond text-5xl leading-none font-extrabold uppercase italic">
            {MODES[manche.type]}
          </h1>
          {manche.type === 'hp' && (
            <p className="font-cond text-xl font-bold uppercase">
              <span className={manche.cops === 'rouge' ? 'text-rouge' : 'text-bleu'}>
                Cops {NOMS_EQUIPES[manche.cops]}
              </span>
            </p>
          )}
          {edition ? (
            <form
              className="mt-1 flex gap-2"
              action={(donnees) => {
                const valeur = donnees.get('trace');
                const trace = typeof valeur === 'string' ? valeur : '';
                envoyer(() => changerTrace({ numero: manche.numero, trace }), 'Tracé changé ✓');
                setEdition(false);
              }}
            >
              <input
                name="trace"
                defaultValue={manche.trace}
                aria-label="Tracé"
                className="bg-panneau border-ligne min-h-11 flex-1 border px-3"
              />
              <button
                type="submit"
                disabled={enCours}
                className="bg-texte text-fond px-4 font-bold"
              >
                OK
              </button>
            </form>
          ) : (
            <p className="text-attenue text-lg">
              {manche.trace}{' '}
              {manche.type !== 'qualif' && manche.type !== 'duel' && (
                <button
                  type="button"
                  className="text-sm underline"
                  onClick={() => {
                    setEdition(true);
                  }}
                >
                  changer le tracé
                </button>
              )}
            </p>
          )}
        </>
      )}
    </header>
  );
}

function Repli({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <details className="border-ligne bg-panneau/40 border">
      <summary className="font-cond cursor-pointer px-4 py-3 text-lg font-bold uppercase">
        {titre}
      </summary>
      <div className="flex flex-col gap-6 px-4 pt-2 pb-4">{children}</div>
    </details>
  );
}

function Noms({
  ctx,
  enCours,
  envoyer,
}: {
  ctx: ContexteSaisie;
  enCours: boolean;
  envoyer: (action: () => Promise<Retour>, succes: string) => void;
}) {
  const [noms, setNoms] = useState<Record<string, string>>(() =>
    Object.fromEntries(ctx.joueurs.map((j) => [j.id, j.nom])),
  );
  return (
    <Bloc titre="Joueurs" consigne="Les noms affichés au scoreboard.">
      {ctx.joueurs.map((j, i) => (
        <input
          key={j.id}
          value={noms[j.id] ?? ''}
          maxLength={20}
          aria-label={`Joueur ${String(i + 1)}`}
          onChange={(e) => {
            setNoms({ ...noms, [j.id]: e.target.value });
          }}
          className="bg-panneau border-ligne min-h-12 border px-3 text-lg"
        />
      ))}
      <BoutonPrincipal
        disabled={enCours}
        onClick={() => {
          envoyer(() => renommerJoueurs(noms), 'Noms enregistrés ✓');
        }}
      >
        Enregistrer les noms
      </BoutonPrincipal>
    </Bloc>
  );
}
