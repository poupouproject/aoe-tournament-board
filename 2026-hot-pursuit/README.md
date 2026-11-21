# Hot Pursuit · FDS Gaming 2026

Scoreboard du tournoi annuel de la FDS Gaming, édition 2026 :
**Need for Speed Hot Pursuit Remastered**, en championnat style F1 de 21 manches.

- **`/scoreboard`** : la « tour de contrôle » affichée sur le projo 1. Elle se met à jour seule après chaque manche.
- **`/saisie`** : l'écran de l'organisateur, sur téléphone. Il sert à entrer chaque résultat et à annuler la dernière manche.

Les règles, le barème et le rôle de chaque élément du scoreboard sont dans [docs/brief.md](docs/brief.md).
La maquette visuelle de référence est [docs/maquette/scoreboard-hot-pursuit.html](docs/maquette/scoreboard-hot-pursuit.html) : il suffit de l'ouvrir dans un navigateur.

## Démarrer

```bash
cd 2026-hot-pursuit
npm install
cp .env.example .env
npm run db:migrate      # crée dev.db
npm run db:demo         # jeu de démo : 8 joueurs, 9 manches jouées
npm run dev
```

`npm run db:seed` repart de zéro, sans équipes ni résultats : c'est l'état du matin du tournoi.

## Le jour du tournoi

Tout tourne sur le poste de l'organisateur, sans internet.

1. Lancer `npm run tournoi`. La commande applique les migrations, compile l'app en mode production et la sert sur le port 3000, sur toutes les interfaces. Le mode production est plus rapide et plus stable sur une journée que `npm run dev`, et il n'affiche jamais la console de développement.
2. Le projo 1 ouvre `http://<ip-du-poste>:3000/scoreboard`. Les téléphones ouvrent `/saisie`, sur le même Wi-Fi.
3. Sous WSL, il faut aussi rediriger le port 3000 de Windows vers WSL et l'ouvrir dans le pare-feu Windows.

Chaque écran se met à jour en direct, en moins d'une demi-seconde, dès qu'une manche est saisie.

## Développement

```bash
npm run typecheck && npm run lint && npm test
```

Le moteur de calcul (`src/lib/tournoi/moteur.ts`) est pur : il recalcule tout le classement à partir des résultats saisis. Ses tests vérifient qu'il donne exactement les mêmes chiffres que la maquette, puis chaque règle du barème.
