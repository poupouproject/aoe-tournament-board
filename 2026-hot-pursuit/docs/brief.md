# Brief — Tournoi Hot Pursuit · FDS Gaming 2026

> Contexte de départ du scoreboard du tournoi.
> La maquette de référence est [`maquette/scoreboard-hot-pursuit.html`](maquette/scoreboard-hot-pursuit.html) (un seul fichier, 1920×1080).

---

## 1. Le concept de la fin de semaine

- Fin de semaine de gaming annuelle entre amis, à **8 joueurs** en pratique (le groupe compte de 8 à 16 personnes).
- Les éditions précédentes (Age of Empires II, puis Diablo II) se sont essoufflées. Cette année, on change de formule pour **Need for Speed Hot Pursuit Remastered**.
- Le groupe passe tout le week-end sur place, mais **le tournoi ne dure qu'une journée**. Cette journée doit occuper une bonne partie du temps.
- **Objectif central :** que chaque partie, même courte (4 à 6 min), soit serrée et nourrisse la rivalité. Personne ne doit être éliminé tôt, et le titre ne doit pas être joué avant la finale.
- **Matériel :** deux projecteurs, chaque joueur sur sa propre machine, tous dans le même lobby en ligne (8 places max).

## 2. Le gameplay choisi : un championnat style F1, pas un bracket

Avec un bracket à élimination, la moitié du groupe regarderait dès 11 h. Le championnat garde tout le monde dans la course toute la journée, et le classement bouge à chaque manche.

### Déroulement (21 manches, environ 4 à 6 min chacune)

| #     | Phase                      | Contenu                                                                                                                                                              |
| ----- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | **Qualifications** (~10 h) | 3 Races, tous contre tous. Le cumul des positions donne le classement de qualif (une seule « manche » au scoreboard).                                                |
| —     | **Draft** (~11 h)          | Les 2 premiers des qualifs sont capitaines (Rouge, Bleu). Ordre de choix : B, A, A, B, B, A. On tire ensuite les rivaux au sort, **toujours dans l'équipe adverse**. |
| 2–5   | **Bloc 1**                 | 2 Races, puis 1 Hot Pursuit en aller-retour (même tracé : Rouge joue cop, puis on inverse).                                                                          |
| 6–9   | **Bloc 2**                 | Même structure.                                                                                                                                                      |
| 10–13 | **Duels Interceptor**      | Chaque paire de rivaux s'affronte au meilleur de 2, chacun joue cop une fois. Un duel à la fois, en spectacle sur le projo 2.                                        |
| 14–17 | **Bloc 3**                 | Même structure que les blocs 1 et 2.                                                                                                                                 |
| 18–21 | **Finale (soirée)**        | 2 Races, puis 1 Hot Pursuit aller-retour. **Tous les points sont doublés.**                                                                                          |

### Pointage individuel

| Manche             | Points                                                                        |
| ------------------ | ----------------------------------------------------------------------------- |
| Qualifs            | 8-7-6-5-4-3-2-1                                                               |
| Race               | 10-8-7-6-5-4-3-2 (barème compressé : un mauvais départ ne tue pas la journée) |
| Hot Pursuit, racer | 8-6-5-4 selon l'ordre d'arrivée, **0 si busté**                               |
| Hot Pursuit, cop   | **+2 par bust** fait soi-même                                                 |
| Duel Interceptor   | **+5** par manche gagnée                                                      |

### Bonus (les mécaniques qui gardent ça serré)

- **Prime sur le leader** (Race seulement) : +2 à quiconque finit devant le #1 du championnat. Tout le monde chasse la même cible. On l'exclut en Hot Pursuit parce que le leader peut y jouer cop.
- **Rival** : +1 chaque fois qu'on bat son rival en Race. En duel, la victoire compte au bilan face-à-face.
- **Joker** : double les points d'une manche, **une seule fois dans la journée**, annoncé avant le départ. Il est **interdit en finale**.
- **Rattrapage** : le dernier au classement choisit le tracé de la manche suivante (règle de salle, rien à calculer).
- **Égalité 1-1 en duel** : le racer qui s'est échappé le plus vite gagne. Si personne ne s'est échappé, c'est le cop qui a busté le plus vite. La saisie se fait manuellement (`tiebreak`).

### Pointage d'équipe

- **Race** : somme des points individuels des membres de l'équipe.
- **Hot Pursuit** : +10 au camp gagnant selon le résultat du jeu.
- **Duel** : +3 à l'équipe du gagnant.
- Tout est **doublé en finale**.

### Ordre d'application du calcul

1. Points de base de la manche, plus la prime et le rival.
2. Joker : ×2 sur le gain individuel de la manche (une seule fois, jamais en finale).
3. Multiplicateur de finale : ×2.
4. Le **leader de la prime** est celui du classement _avant_ la manche.
5. Bris d'égalité au classement : nombre de victoires face-à-face, puis id.

## 3. Pourquoi ce scoreboard

Le scoreboard n'est pas un simple tableau de résultats. C'est **l'outil qui crée la tension** dans la salle entre les manches. Chaque élément sert une mécanique du gameplay :

| Élément                                                         | Pourquoi                                                                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Tour de classement style F1** (position, ▲▼, écart au leader) | Ça rend visible le mouvement après chaque manche, même une petite remontée. L'écart chiffré montre que tout est encore jouable.       |
| **Badge « Cible » sur le leader**                               | Ça matérialise la prime : tout le monde voit qui chasser.                                                                             |
| **Badge « Joker »** (barré une fois utilisé)                    | Ça crée de la stratégie et du trash talk : qui a encore le sien ?                                                                     |
| **Points de la dernière manche**                                | Le gain est immédiat, c'est la récompense visuelle.                                                                                   |
| **Guerre des équipes** (Rouge vs Bleu + barre)                  | Ça garde impliqués les joueurs mal classés individuellement.                                                                          |
| **Carte « Prochaine manche »**                                  | Elle annonce le mode, le tracé, qui est cop ou racer, la cible et l'enjeu. Le prochain départ est cadré pour tout le monde.           |
| **Panneau Rivalités** (bilan face-à-face)                       | Il alimente les rivalités personnelles tirées au sort pendant toute la journée.                                                       |
| **Ticker « En direct »**                                        | Il raconte la journée comme une diffusion sportive : « Max : 2 busts », « Joker : Seb double sa manche », « Ben grimpe de 3 places ». |
| **Badge « POINTS ×2 »**                                         | Il dramatise l'entrée en finale.                                                                                                      |
| **Vue face-à-face plein écran**                                 | Elle sert à l'annonce de chaque duel Interceptor, comme une pesée avant un combat.                                                    |
| **Gyrophare rouge/bleu, typo condensée italique**               | C'est l'identité visuelle « poursuite policière » de Hot Pursuit, lisible de loin sur un projecteur.                                  |

### Rôle des deux projecteurs

- **Projo 1, « Tour de contrôle »** : le scoreboard en permanence (touche `1` : classement, touche `2` : face-à-face).
- **Projo 2, « Caméra »** : l'écran d'un joueur en direct, via un salon Discord et un laptop qui regarde le _Go Live_ choisi. En Race, on suit le leader ; en Hot Pursuit, un cop ; en duel, le racer en plein écran.

## 4. La maquette

Fichier unique [`maquette/scoreboard-hot-pursuit.html`](maquette/scoreboard-hot-pursuit.html) (HTML, CSS et JS vanilla, aucune dépendance sauf Google Fonts). Le script est découpé en 5 blocs :

1. **CONFIG** : `players`, `teams`, `rivalPairs`, barème `PTS`.
2. **SCHEDULE** : les 21 manches (`type`: `qualif` | `race` | `hp` | `duel`, `final: true` pour la finale).
3. **RESULTS** : un résultat par manche jouée, avec un index aligné sur `SCHEDULE`.
   - race / qualif : `{ order:[ids 1er→8e], jokers:[ids] }`
   - hp : `{ racers:[{id,pos|null}], busts:{id:n}, winner:'cops'|'racers', jokers:[ids] }`
   - duel : `{ rounds:[idGagnant1, idGagnant2], tiebreak:id }`
4. **ENGINE** : `compute(n)` recalcule tout depuis zéro, de façon déterministe et sans état caché.
5. **RENDER** : `render()` dessine la tour, les panneaux, le ticker et la vue duel.

Le stage est fixé à 1920×1080 et mis à l'échelle de la fenêtre. La démo contient 9 résultats fictifs et des noms bidon.

## 5. Ce qu'il reste à bâtir

1. **Source de données live** : le scoreboard se rafraîchit automatiquement à chaque nouveau résultat.
2. **Écran de saisie mobile** (l'organisateur, sur téléphone) :
   - Race : taper les 8 joueurs dans l'ordre d'arrivée.
   - Hot Pursuit : position ou « busté » pour chaque racer, nombre de busts par cop, camp gagnant.
   - Duel : gagnant de chaque manche, plus le bris d'égalité.
   - Jokers : cocher avant le départ.
   - **Annuler la dernière manche**, parce qu'une erreur de saisie va arriver.
   - Cible : environ 15 secondes de saisie par manche.
3. **Effets** : son et animation lors d'un dépassement au classement ou d'un changement de leader.
4. **Fonctionnement hors ligne** : polices Saira en local, et tout doit tourner sur le LAN sans internet.

## 6. Contraintes et décisions

- **Aucune API ni aucun plugin** n'expose les résultats de NFS Hot Pursuit Remastered. **La saisie est manuelle.** Lire la mémoire du jeu est écarté : c'est fragile et risqué en ligne.
- **Option bonus (si le temps le permet)** : prendre en photo l'écran de résultats et passer par un OCR qui pré-remplit la saisie, que l'organisateur valide. Il faut alors que les gamertags correspondent aux joueurs.
- Le moteur de calcul doit rester **pur et testable** : mêmes résultats = même classement. Tests unitaires sur le barème (prime, joker, finale ×2, égalités).
- **À valider avant le jour J** : dans le lobby en ligne, peut-on imposer la même classe d'autos à tous ? Sinon, la rivalité tombe.
- **Hébergement** : l'app tourne en local sur le poste de l'organisateur (`npm run dev`), base SQLite. Le téléphone de saisie et le projo s'y connectent par le Wi-Fi.
