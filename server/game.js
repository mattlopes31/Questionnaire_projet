const { getRandomQuestions } = require('./database');

// Stockage des sessions de jeu en mémoire
const gameSessions = new Map();

// Générer un code de session unique (6 caractères)
function generateSessionCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // Vérifier que le code n'existe pas déjà
    if (gameSessions.has(code)) {
        return generateSessionCode();
    }
    return code;
}

// Créer une nouvelle session de jeu
async function createGame(hostSocketId, nbQuestions) {
    const code = generateSessionCode();
    const questions = await getRandomQuestions(nbQuestions);
    
    const session = {
        code,
        hostId: hostSocketId,
        players: [],
        questions,
        currentQuestionIndex: -1,
        status: 'waiting', // waiting, playing, finished
        answers: new Map(), // Réponses pour la question en cours
        questionStartTime: null
    };
    
    gameSessions.set(code, session);
    return code;
}

// Rejoindre une session
function joinGame(code, socketId, pseudo) {
    const session = gameSessions.get(code);
    if (!session) {
        return { success: false, error: 'Session introuvable' };
    }
    if (session.status !== 'waiting') {
        return { success: false, error: 'La partie a déjà commencé' };
    }
    
    // Vérifier si le pseudo est déjà pris
    if (session.players.some(p => p.pseudo === pseudo)) {
        return { success: false, error: 'Ce pseudo est déjà utilisé' };
    }
    
    const player = {
        socketId,
        pseudo,
        score: 0,
        isHost: socketId === session.hostId
    };
    
    session.players.push(player);
    return { success: true, session };
}

// Démarrer la partie
function startGame(code, socketId) {
    const session = gameSessions.get(code);
    if (!session) {
        return { success: false, error: 'Session introuvable' };
    }
    if (session.hostId !== socketId) {
        return { success: false, error: 'Seul le créateur peut lancer la partie' };
    }
    if (session.players.length < 1) {
        return { success: false, error: 'Il faut au moins 1 joueur' };
    }
    
    session.status = 'playing';
    return { success: true };
}

// Passer à la question suivante
function nextQuestion(code) {
    const session = gameSessions.get(code);
    if (!session) return null;
    
    session.currentQuestionIndex++;
    session.answers.clear();
    session.questionStartTime = Date.now();
    
    if (session.currentQuestionIndex >= session.questions.length) {
        session.status = 'finished';
        return null;
    }
    
    const question = session.questions[session.currentQuestionIndex];
    return {
        index: session.currentQuestionIndex + 1,
        total: session.questions.length,
        question: question.question,
        answers: [
            question.reponse1,
            question.reponse2,
            question.reponse3,
            question.reponse4
        ]
    };
}

// Soumettre une réponse
function submitAnswer(code, socketId, answerIndex) {
    const session = gameSessions.get(code);
    if (!session || session.status !== 'playing') return null;
    
    // Vérifier si le joueur n'a pas déjà répondu
    if (session.answers.has(socketId)) return null;
    
    const timeElapsed = (Date.now() - session.questionStartTime) / 1000;
    session.answers.set(socketId, { answerIndex, timeElapsed });
    
    return {
        answersCount: session.answers.size,
        totalPlayers: session.players.length
    };
}

// Calculer les scores pour la question en cours
function calculateScores(code) {
    const session = gameSessions.get(code);
    if (!session) return null;
    
    const currentQuestion = session.questions[session.currentQuestionIndex];
    const correctAnswer = currentQuestion.bonne_reponse;
    
    const results = [];
    
    session.players.forEach(player => {
        const answer = session.answers.get(player.socketId);
        let points = 0;
        let isCorrect = false;
        
        if (answer && answer.answerIndex === correctAnswer) {
            isCorrect = true;
            if (answer.timeElapsed <= 5) {
                points = 10;
            } else if (answer.timeElapsed <= 10) {
                points = 5;
            } else {
                points = 2;
            }
            player.score += points;
        }
        
        results.push({
            pseudo: player.pseudo,
            isCorrect,
            points,
            totalScore: player.score
        });
    });
    
    // Trier par score
    results.sort((a, b) => b.totalScore - a.totalScore);
    
    return {
        correctAnswer,
        correctAnswerText: currentQuestion[`reponse${correctAnswer}`],
        results
    };
}

// Obtenir le classement final
function getFinalRanking(code) {
    const session = gameSessions.get(code);
    if (!session) return null;
    
    return session.players
        .map(p => ({ pseudo: p.pseudo, score: p.score }))
        .sort((a, b) => b.score - a.score);
}

// Obtenir une session
function getSession(code) {
    return gameSessions.get(code);
}

// Supprimer un joueur d'une session
function removePlayer(code, socketId) {
    const session = gameSessions.get(code);
    if (!session) return;
    
    session.players = session.players.filter(p => p.socketId !== socketId);
    
    // Si plus de joueurs, supprimer la session
    if (session.players.length === 0) {
        gameSessions.delete(code);
    }
}

// Vérifier si tous les joueurs ont répondu
function allPlayersAnswered(code) {
    const session = gameSessions.get(code);
    if (!session) return false;
    return session.answers.size >= session.players.length;
}

module.exports = {
    createGame,
    joinGame,
    startGame,
    nextQuestion,
    submitAnswer,
    calculateScores,
    getFinalRanking,
    getSession,
    removePlayer,
    allPlayersAnswered
};
