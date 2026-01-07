// Connexion au serveur Socket.io
const socket = io();

// État du jeu
let gameState = {
    code: null,
    isHost: false,
    pseudo: null,
    currentAnswer: null
};

// Timer
let timerInterval = null;

// ==================== ÉLÉMENTS DOM ====================
const screens = {
    home: document.getElementById('home-screen'),
    create: document.getElementById('create-screen'),
    join: document.getElementById('join-screen'),
    lobby: document.getElementById('lobby-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen'),
    end: document.getElementById('end-screen')
};

// ==================== UTILITAIRES ====================
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function showError(message) {
    const toast = document.getElementById('error-toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==================== NAVIGATION ====================
// Page d'accueil
document.getElementById('btn-create').addEventListener('click', () => {
    showScreen('create');
});

document.getElementById('btn-join').addEventListener('click', () => {
    showScreen('join');
});

// Retour
document.getElementById('btn-back-create').addEventListener('click', () => {
    showScreen('home');
});

document.getElementById('btn-back-join').addEventListener('click', () => {
    showScreen('home');
});

document.getElementById('btn-home').addEventListener('click', () => {
    location.reload();
});

// ==================== CRÉATION DE PARTIE ====================
document.getElementById('btn-create-game').addEventListener('click', () => {
    const nbQuestions = parseInt(document.getElementById('nb-questions').value);
    const pseudo = document.getElementById('host-pseudo').value.trim();
    
    if (!pseudo) {
        showError('Veuillez entrer un pseudo');
        return;
    }
    
    gameState.pseudo = pseudo;
    gameState.isHost = true;
    
    socket.emit('create-game', { nbQuestions });
});

socket.on('game-created', (data) => {
    gameState.code = data.code;
    
    // Rejoindre automatiquement en tant qu'hôte
    socket.emit('join-game', { 
        code: data.code, 
        pseudo: gameState.pseudo 
    });
});

// ==================== REJOINDRE UNE PARTIE ====================
document.getElementById('btn-join-game').addEventListener('click', () => {
    const code = document.getElementById('game-code').value.trim().toUpperCase();
    const pseudo = document.getElementById('player-pseudo').value.trim();
    
    if (!code) {
        showError('Veuillez entrer le code de la partie');
        return;
    }
    
    if (!pseudo) {
        showError('Veuillez entrer un pseudo');
        return;
    }
    
    gameState.code = code;
    gameState.pseudo = pseudo;
    
    socket.emit('join-game', { code, pseudo });
});

socket.on('join-success', (data) => {
    document.getElementById('display-code').textContent = gameState.code;
    
    // Afficher/cacher le bouton de lancement
    if (gameState.isHost) {
        document.getElementById('btn-start-game').style.display = 'block';
        document.getElementById('waiting-message').style.display = 'none';
    }
    
    showScreen('lobby');
});

socket.on('join-error', (data) => {
    showError(data.message);
});

// ==================== LOBBY ====================
socket.on('player-joined', (data) => {
    updatePlayersList(data.players);
});

socket.on('player-left', (data) => {
    updatePlayersList(data.players);
});

function updatePlayersList(players) {
    const list = document.getElementById('players-list');
    const count = document.getElementById('player-count');
    
    count.textContent = players.length;
    list.innerHTML = players.map(player => `
        <li>
            <span>${player.pseudo}</span>
            ${player.isHost ? '<span class="host-badge">HÔTE</span>' : ''}
        </li>
    `).join('');
}

// ==================== LANCEMENT DE PARTIE ====================
document.getElementById('btn-start-game').addEventListener('click', () => {
    socket.emit('start-game', { code: gameState.code });
});

socket.on('game-started', () => {
    showScreen('game');
});

// ==================== JEU ====================
socket.on('new-question', (data) => {
    showScreen('game');
    gameState.currentAnswer = null;
    
    // Mettre à jour le compteur de questions
    document.getElementById('question-counter').textContent = 
        `Question ${data.index}/${data.total}`;
    
    // Afficher la question
    document.getElementById('question-text').textContent = data.question;
    
    // Afficher les réponses
    const answerBtns = document.querySelectorAll('.answer-btn');
    answerBtns.forEach((btn, index) => {
        btn.textContent = data.answers[index];
        btn.className = 'answer-btn';
        btn.disabled = false;
    });
    
    // Réinitialiser le compteur de réponses
    document.getElementById('answers-count').textContent = '0';
    document.getElementById('total-players').textContent = '0';
    
    // Démarrer le timer
    startTimer(data.timer);
});

// Gestion des réponses
document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (gameState.currentAnswer !== null) return;
        
        const answer = parseInt(btn.dataset.answer);
        gameState.currentAnswer = answer;
        
        // Marquer comme sélectionné
        btn.classList.add('selected');
        
        // Désactiver tous les boutons
        document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
        
        // Envoyer la réponse
        socket.emit('submit-answer', {
            code: gameState.code,
            answer: answer
        });
    });
});

socket.on('player-answered', (data) => {
    document.getElementById('answers-count').textContent = data.answersCount;
    document.getElementById('total-players').textContent = data.totalPlayers;
});

// Timer
function startTimer(seconds) {
    const timerDisplay = document.getElementById('timer-display');
    const timerContainer = document.querySelector('.timer');
    let timeLeft = seconds;
    
    // Arrêter tout timer existant
    if (timerInterval) clearInterval(timerInterval);
    
    timerDisplay.textContent = timeLeft;
    timerContainer.className = 'timer';
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        
        if (timeLeft <= 5 && timeLeft > 3) {
            timerContainer.className = 'timer warning';
        } else if (timeLeft <= 3) {
            timerContainer.className = 'timer danger';
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);
}

// ==================== RÉSULTATS ====================
socket.on('question-result', (data) => {
    clearInterval(timerInterval);
    
    // Afficher la bonne réponse
    document.getElementById('correct-answer-text').textContent = data.correctAnswerText;
    
    // Marquer les réponses correctes/incorrectes
    const answerBtns = document.querySelectorAll('.answer-btn');
    answerBtns.forEach((btn, index) => {
        if (index + 1 === data.correctAnswer) {
            btn.classList.add('correct');
        } else if (btn.classList.contains('selected')) {
            btn.classList.add('incorrect');
        }
    });
    
    // Mettre à jour le classement
    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = data.results.map(result => `
        <li>
            <div class="player-info">
                <span>${result.pseudo}</span>
                ${result.points > 0 ? `<span class="points-gained">+${result.points}</span>` : ''}
            </div>
            <span class="score">${result.totalScore} pts</span>
        </li>
    `).join('');
    
    showScreen('result');
});

// ==================== FIN DE PARTIE ====================
socket.on('game-ended', (data) => {
    clearInterval(timerInterval);
    
    const finalList = document.getElementById('final-ranking-list');
    finalList.innerHTML = data.ranking.map((player, index) => `
        <li>
            <span>${player.pseudo}</span>
            <span class="score">${player.score} pts</span>
        </li>
    `).join('');
    
    showScreen('end');
});

// ==================== ERREURS ====================
socket.on('error', (data) => {
    showError(data.message);
});

socket.on('disconnect', () => {
    showError('Connexion perdue avec le serveur');
});
