/**
 * Tests du diffuseur des mises à jour en direct (regroupement des rafales).
 *
 * Lancer avec : npm test
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cheminBase, concerneLaBase, creerDiffuseur, type Minuteries } from '../src/lib/diffuseur';

/** Minuteries manuelles : `avancer()` déclenche ce qui est planifié. */
function minuteriesManuelles(): Minuteries & { avancer: () => void; enAttente: () => number } {
  let suivante = 0;
  const planifiees = new Map<number, () => void>();
  return {
    planifier(rappel) {
      suivante++;
      planifiees.set(suivante, rappel);
      return suivante;
    },
    annuler(id) {
      planifiees.delete(id as number);
    },
    avancer() {
      const rappels = [...planifiees.values()];
      planifiees.clear();
      for (const r of rappels) r();
    },
    enAttente: () => planifiees.size,
  };
}

describe('diffuseur', () => {
  it('regroupe une rafale de signaux en une seule diffusion', () => {
    const m = minuteriesManuelles();
    const d = creerDiffuseur(150, m);
    let recus = 0;
    d.abonner(() => recus++);
    d.signaler();
    d.signaler();
    d.signaler();
    assert.equal(m.enAttente(), 1);
    assert.equal(recus, 0);
    m.avancer();
    assert.equal(recus, 1);
  });

  it('prévient tous les abonnés, et plus ceux qui se sont retirés', () => {
    const m = minuteriesManuelles();
    const d = creerDiffuseur(150, m);
    let a = 0;
    let b = 0;
    d.abonner(() => a++);
    const retirerB = d.abonner(() => b++);
    d.signaler();
    m.avancer();
    retirerB();
    d.signaler();
    m.avancer();
    assert.deepEqual([a, b], [2, 1]);
    assert.equal(d.nbAbonnes(), 1);
  });

  it('écarte un abonné défaillant sans priver les autres', () => {
    const m = minuteriesManuelles();
    const d = creerDiffuseur(150, m);
    let recus = 0;
    d.abonner(() => {
      throw new Error('flux fermé');
    });
    d.abonner(() => recus++);
    d.signaler();
    m.avancer();
    assert.equal(recus, 1);
    assert.equal(d.nbAbonnes(), 1);
  });

  it('fonctionne avec les vraies minuteries', async () => {
    const d = creerDiffuseur(20);
    let recus = 0;
    d.abonner(() => recus++);
    d.signaler();
    d.signaler();
    await new Promise((fin) => setTimeout(fin, 60));
    assert.equal(recus, 1);
  });
});

describe('chemin de la base', () => {
  it('résout une URL relative depuis la racine de l’app', () => {
    assert.equal(cheminBase('file:./dev.db', '/app'), '/app/dev.db');
    assert.equal(cheminBase('file:dev.db', '/app/'), '/app/dev.db');
  });

  it('garde un chemin absolu et ignore les paramètres', () => {
    assert.equal(cheminBase('file:/data/app.db?mode=rw', '/app'), '/data/app.db');
  });

  it('refuse ce qui n’est pas un fichier', () => {
    assert.equal(cheminBase('postgres://hote/base', '/app'), null);
  });

  it('reconnaît la base et ses fichiers annexes', () => {
    assert.ok(concerneLaBase('dev.db', 'dev.db'));
    assert.ok(concerneLaBase('dev.db-journal', 'dev.db'));
    assert.ok(concerneLaBase('dev.db-wal', 'dev.db'));
    assert.ok(!concerneLaBase('package.json', 'dev.db'));
    assert.ok(!concerneLaBase(null, 'dev.db'));
  });
});
