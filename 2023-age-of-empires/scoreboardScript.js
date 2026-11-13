document.addEventListener("DOMContentLoaded", function () {
    const resultsTable = document
      .getElementById("resultsTable")
      .getElementsByTagName("tbody")[0];
    let playerStats = {};
  
    // Fonction pour mettre à jour le tableau
    function updateTable() {
      // Effacez d'abord le tableau pour éviter les doublons
      while (resultsTable.firstChild) {
        resultsTable.removeChild(resultsTable.firstChild);
      }
  
      // Puis, mettez à jour avec les données actuelles
      for (let player in playerStats) {
        let row = resultsTable.insertRow();
        row.insertCell(0).textContent = player;
        row.insertCell(1).textContent = playerStats[player].wins;
        row.insertCell(2).textContent = playerStats[player].totalScore;
        // Ajoutez d'autres cellules si nécessaire
      }
    }
  
    // Chargez et traitez chaque fichier JSON depuis le répertoire 'saves'
    for (let i = 1; i <= 5; i++) {
      fetch(`saves/partie${i}.json`)
        .then((response) => {
          if (!response.ok) {
            if (response.status === 404) {
              console.log(`partie${i}.json n'existe pas, passage à la partie suivante.`);
              return null; // Retourne null pour les fichiers manquants
            }
            throw new Error("Réseau ou réponse non OK");
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            // Traitez les données ici
            const winningTeam = data.victory.team;
  
            data.teams.forEach((team) => {
              team.players.forEach((player) => {
                if (!playerStats[player.name]) {
                  playerStats[player.name] = { wins: 0, totalScore: 0 };
                }
                // Ajoutez le score du joueur
                playerStats[player.name].totalScore += player.score;
  
                // Incrémentez le nombre de victoires si le joueur est dans l'équipe gagnante
                if (team.teamName === winningTeam) {
                  playerStats[player.name].wins += 1;
                }
              });
            });
  
            // Mettez à jour le tableau à chaque fois qu'un fichier est traité
            updateTable();
          }
        })
        .catch((error) => console.error("Erreur de chargement:", error));
    }
  });
  