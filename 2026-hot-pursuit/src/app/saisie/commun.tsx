'use client';

import type { ReactNode } from 'react';

import { cx } from '@/lib/cx';
import type { JoueurSaisie } from '@/lib/tournoi/saisie';
import type { Equipe } from '@/lib/tournoi/types';

/**
 * Briques de l'écran de saisie : gros boutons, une consigne par bloc, et le
 * moins de frappe possible. Tout se fait en touchant des noms.
 */

export const TEXTE_EQUIPE: Record<Equipe, string> = { rouge: 'text-rouge', bleu: 'text-bleu' };
export const FOND_EQUIPE: Record<Equipe, string> = { rouge: 'bg-rouge', bleu: 'bg-bleu' };

export function Bloc({
  titre,
  consigne,
  children,
}: {
  titre: string;
  consigne?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-cond text-attenue text-sm font-semibold tracking-[0.2em] uppercase">
          {titre}
        </h2>
        {consigne && <p className="text-texte/80 text-sm">{consigne}</p>}
      </div>
      {children}
    </section>
  );
}

/** Bouton d'action principal, pleine largeur. */
export function BoutonPrincipal({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="bg-or font-cond min-h-14 w-full text-xl font-extrabold tracking-wide text-[#120d00] uppercase disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** Choix exclusif entre quelques options, en gros boutons côte à côte. */
export function Choix<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: readonly { valeur: T; libelle: string; classe?: string }[];
  valeur: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-2">
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          aria-pressed={valeur === o.valeur}
          onClick={() => {
            onChange(o.valeur);
          }}
          className={cx(
            'font-cond border-ligne min-h-14 border text-lg font-bold uppercase',
            valeur === o.valeur ? (o.classe ?? 'bg-texte text-fond') : 'bg-panneau',
          )}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );
}

/**
 * Ordre d'arrivée : on touche les pilotes dans l'ordre. Toucher un pilote
 * déjà placé le retire (les suivants remontent d'un rang).
 */
export function OrdreArrivee({
  joueurs,
  ordre,
  onChange,
}: {
  joueurs: readonly JoueurSaisie[];
  ordre: readonly string[];
  onChange: (ordre: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {joueurs.map((j) => {
          const rang = ordre.indexOf(j.id);
          const place = rang >= 0;
          return (
            <button
              key={j.id}
              type="button"
              aria-pressed={place}
              onClick={() => {
                onChange(place ? ordre.filter((id) => id !== j.id) : [...ordre, j.id]);
              }}
              className={cx(
                'border-ligne flex min-h-14 items-center gap-3 border px-3 text-left',
                place ? 'bg-texte text-fond' : 'bg-panneau',
              )}
            >
              <span
                className={cx(
                  'font-cond grid size-8 shrink-0 place-items-center text-xl font-extrabold',
                  place ? 'bg-fond text-texte' : 'border-ligne text-attenue border',
                )}
              >
                {place ? rang + 1 : ''}
              </span>
              <span
                className={cx(
                  'font-cond truncate text-xl font-bold uppercase',
                  !place && j.equipe && TEXTE_EQUIPE[j.equipe],
                )}
              >
                {j.nom}
              </span>
            </button>
          );
        })}
      </div>
      <div className="text-attenue flex items-center justify-between text-sm">
        <span>
          {ordre.length}/{joueurs.length} placés
        </span>
        {ordre.length > 0 && (
          <button
            type="button"
            className="underline"
            onClick={() => {
              onChange([]);
            }}
          >
            Recommencer
          </button>
        )}
      </div>
    </div>
  );
}

/** Jokers annoncés avant le départ. N'affiche que ceux qui en ont encore un. */
export function Jokers({
  joueurs,
  choisis,
  finale,
  onChange,
}: {
  joueurs: readonly JoueurSaisie[];
  choisis: readonly string[];
  finale: boolean;
  onChange: (choisis: string[]) => void;
}) {
  if (finale) {
    return <p className="text-attenue text-sm">Finale : les jokers sont interdits.</p>;
  }
  const disponibles = joueurs.filter((j) => j.jokerDisponible);
  if (disponibles.length === 0) return null;
  return (
    <Bloc titre="Jokers" consigne="Qui a annoncé son joker avant le départ ? (points ×2)">
      <div className="flex flex-wrap gap-2">
        {disponibles.map((j) => {
          const actif = choisis.includes(j.id);
          return (
            <button
              key={j.id}
              type="button"
              aria-pressed={actif}
              onClick={() => {
                onChange(actif ? choisis.filter((id) => id !== j.id) : [...choisis, j.id]);
              }}
              className={cx(
                'font-cond min-h-11 border px-4 text-lg font-bold uppercase',
                actif ? 'bg-or border-or text-[#120d00]' : 'border-or/50 text-or',
              )}
            >
              {actif ? '★ ' : ''}
              {j.nom}
            </button>
          );
        })}
      </div>
    </Bloc>
  );
}

/** Compteur − n + pour les busts d'un cop. */
export function Compteur({
  libelle,
  classe,
  valeur,
  onChange,
}: {
  libelle: string;
  classe?: string | undefined;
  valeur: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-panneau border-ligne flex min-h-14 items-center justify-between border pl-4">
      <span className={cx('font-cond text-xl font-bold uppercase', classe)}>{libelle}</span>
      <div className="flex items-center">
        <button
          type="button"
          aria-label={`Retirer un bust à ${libelle}`}
          disabled={valeur === 0}
          onClick={() => {
            onChange(valeur - 1);
          }}
          className="size-14 text-2xl disabled:opacity-20"
        >
          −
        </button>
        <span className="font-cond w-8 text-center text-2xl font-extrabold">{valeur}</span>
        <button
          type="button"
          aria-label={`Ajouter un bust à ${libelle}`}
          onClick={() => {
            onChange(valeur + 1);
          }}
          className="size-14 text-2xl"
        >
          +
        </button>
      </div>
    </div>
  );
}
