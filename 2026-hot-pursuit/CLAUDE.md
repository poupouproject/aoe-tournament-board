# Hot Pursuit · scoreboard du tournoi FDS Gaming

Scoreboard du tournoi Need for Speed Hot Pursuit Remastered : un championnat
style F1 de 21 manches entre 8 joueurs. Next.js 16, React 19, TypeScript très
strict, Prisma 7 sur SQLite. Contexte complet : `docs/brief.md`. Référence
visuelle : `docs/maquette/scoreboard-hot-pursuit.html`.

@AGENTS.md

## Toujours

- **Français partout** : interface, noms de code, commentaires, documentation, commits.
- **Avant de committer** : `npm run typecheck && npm run lint && npm test` (zéro avertissement).
- `npx prettier --write` sur les **seuls fichiers touchés**.
- Le moteur (`src/lib/tournoi/moteur.ts`) reste **pur** : aucun accès à la base, à
  l'horloge ni à Next. Toute règle de pointage nouvelle ou modifiée a son test dans
  `tests/moteur.test.ts`.
- La base ne stocke **que la saisie** (joueurs, horaire, résultats bruts). Points,
  classement et scores d'équipe se recalculent ; ne jamais les stocker.
- Changer `prisma/schema.prisma` : `npm run db:migrate -- --name <nom>`.

## Architecture

| Où                    | Quoi                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/tournoi/`    | Domaine : `bareme`, `schemas` (Zod), `types`, `horaire`, `moteur`, `demo`, `donnees` (lecture en base, serveur seulement) |
| `src/app/scoreboard/` | Projo 1, rafraîchi seul toutes les 2 s                                                                                    |
| `src/app/saisie/`     | Écran mobile de l'organisateur et Server Actions                                                                          |
| `prisma/`             | Schéma, migrations, seed                                                                                                  |
