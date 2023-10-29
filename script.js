// Fichier : script.js
document.addEventListener('DOMContentLoaded', function () {
    var timerDisplay = document.getElementById('timer');
    var startButton = document.getElementById('startButton');
    var pauseButton = document.getElementById('pauseButton'); // Nouveau bouton de pause
    var alarmSound = document.getElementById('alarmSound');

    var isMainRound = true;
    var isPaused = false; // Un indicateur pour savoir si le compte à rebours est en pause
    var countdown; // Déplacer la variable countdown ici pour qu'elle soit accessible globalement dans la fonction
    var timerStarted = false; // Un indicateur pour savoir si le compte à rebours a été démarré
    var initialDuration = isMainRound ? 30 * 60 : 5 * 60; // Durée initiale en secondes

    function resetCountdown() {
        clearInterval(countdown);
        isMainRound = true;
        isPaused = false;
        pauseButton.textContent = 'Pause';
        var minutes = parseInt(initialDuration / 60, 10);
        var seconds = parseInt(initialDuration % 60, 10);
        updateTimerDisplay(minutes, seconds);
    }

    startButton.addEventListener('click', function () {
        if (!timerStarted) {
            // Si le compte à rebours n'a pas encore commencé, commencez-le
            timerStarted = true;
            startButton.textContent = 'Réinitialiser'; // Changez le texte du bouton
            startRound();
        } else {
            // Si le compte à rebours a déjà commencé, réinitialisez-le
            timerStarted = false; // Indiquez que le compte à rebours peut être redémarré
            startButton.textContent = 'Démarrer'; // Changez le texte du bouton
            resetCountdown();
        }
    });

    function updateTimerDisplay(minutes, seconds) {
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        timerDisplay.textContent = minutes + ":" + seconds;
    }

    function startCountdown(duration, onCompletion) {
        var timer = duration, minutes, seconds;
        countdown = setInterval(function () {
            if (!isPaused) { // Vérifiez si le compte à rebours est en pause
                minutes = parseInt(timer / 60, 10);
                seconds = parseInt(timer % 60, 10);

                updateTimerDisplay(minutes, seconds);

                if (--timer < 0) {
                    clearInterval(countdown);
                    alarmSound.play();
                    onCompletion();
                }
            }
        }, 1000);
    }

    function startRound() {
        var duration = isMainRound ? 30 * 60 : 5 * 60;

        startCountdown(duration, function () {
            isMainRound = !isMainRound;
            startRound();
        });
    }

    pauseButton.addEventListener('click', function () {
        if (isPaused) {
            isPaused = false;
            pauseButton.textContent = 'Pause'; // Changez le texte du bouton pour indiquer l'action actuelle
        } else {
            isPaused = true;
            pauseButton.textContent = 'Reprendre'; // Indiquez que le bouton reprendra le compte à rebours
        }
    });
    // Nouvelle fonction pour remplir le tableau des scores
    function updateScoreboard() {
        var participants = [
            // Remplacez ceci par vos données réelles, peut-être provenant d'une source externe
            { name: 'YellowWait', score: 0 },
            { name: 'Fajitas', score: 0 },
            { name: 'Jimbo', score: 0 },
            { name: 'épatantepatate', score: 0 },
            { name: 'Mayoche', score: 0 },
            { name: 'Capitaine Chat', score: 0 },
            { name: 'ValorousCat', score: 0 },
            { name: 'Ben', score: 0 },
            { name: 'Pelletos', score: 0 },
        ];

        // Trier les participants par score de manière décroissante
        participants.sort(function (a, b) {
            return b.score - a.score; // pour un ordre décroissant
        });


        var tbody = document.querySelector('#scoreboard tbody');
        tbody.innerHTML = ''; // Effacer les rangées existantes

        // Ajouter une nouvelle rangée pour chaque participant
        participants.forEach(function (participant) {
            var row = document.createElement('tr');
            var nameCell = document.createElement('td');
            var scoreCell = document.createElement('td');

            nameCell.textContent = participant.name;
            scoreCell.textContent = participant.score;

            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            tbody.appendChild(row);
        });
    }

    var matches = [
        { name: 'Partie 1', winner: 'Les as' },
        { name: 'Partie 2', winner: '' },
        { name: 'Partie 3', winner: '' },
        { name: 'Partie 4', winner: '' },
        { name: 'Partie 5', winner: '' },
        // ... autres parties ...
    ];

    function updateMatchesTable() {
        var tableBody = document.querySelector('#matches tbody');
        tableBody.innerHTML = ''; // Effacer les lignes existantes
    
        matches.forEach(function (match) {
            var row = document.createElement('tr');
    
            // Colonne : nom de la partie
            var name = document.createElement('td');
            name.textContent = match.name;
            row.appendChild(name);
    
            // Colonne : statut
            var status = document.createElement('td');
            var statusButton = document.createElement('button');
            statusButton.textContent = match.winner ? 'Joué' : 'En attente'; // Détermine le statut en fonction du gagnant
    
            // Ajouter des classes en fonction du statut
            if (match.winner) { // Ici, nous vérifions si 'winner' est présent, pas 'status'
                statusButton.className = 'status-played';
            } else {
                statusButton.className = 'status-pending';
            }
    
            status.appendChild(statusButton);
            row.appendChild(status);
    
            // Colonne : équipe gagnante
            var winner = document.createElement('td');
            winner.textContent = match.winner || 'N/A'; // Affiche 'N/A' ou similaire si aucun gagnant n'est défini
            row.appendChild(winner);
    
            // Ajouter la nouvelle ligne au tableau
            tableBody.appendChild(row);
        });
    }
    
    // Initialiser le tableau au chargement de la page
    updateMatchesTable();

    // Appelez cette fonction chaque fois que les scores sont mis à jour
    updateScoreboard();
});
