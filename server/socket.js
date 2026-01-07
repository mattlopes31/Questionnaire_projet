const game = require('./game');

// Durée du chronomètre en secondes
const TIMER_DURATION = 10;

module.exports = function(io) {
    io.on('connection', (socket) => {
        console.log(`✅ Joueur connecté: ${socket.id}`);

        // Créer une partie
        socket.on('create-game', async (data) => {
            try {
                const { nbQuestions } = data;
                const code = await game.createGame(socket.id, nbQuestions || 10);
                
                socket.join(code);
                socket.gameCode = code;
                
                socket.emit('game-created', { code });
                console.log(`🎮 Partie créée: ${code}`);
            } catch (error) {
                socket.emit('error', { message: 'Erreur lors de la création de la partie' });
                console.error(error);
            }
        });

        // Rejoindre une partie
        socket.on('join-game', (data) => {
            const { code, pseudo } = data;
            const result = game.joinGame(code, socket.id, pseudo);
            
            if (result.success) {
                socket.join(code);
                socket.gameCode = code;
                socket.pseudo = pseudo;
                
                const session = game.getSession(code);
                const players = session.players.map(p => ({
                    pseudo: p.pseudo,
                    isHost: p.isHost
                }));
                
                io.to(code).emit('player-joined', { players });
                socket.emit('join-success', { code, players });
                console.log(`👤 ${pseudo} a rejoint la partie ${code}`);
            } else {
                socket.emit('join-error', { message: result.error });
            }
        });

        // Lancer la partie
        socket.on('start-game', (data) => {
            const { code } = data;
            const result = game.startGame(code, socket.id);
            
            if (result.success) {
                io.to(code).emit('game-started');
                console.log(`🚀 Partie ${code} démarrée`);
                
                // Envoyer la première question après un court délai
                setTimeout(() => {
                    sendNextQuestion(io, code);
                }, 2000);
            } else {
                socket.emit('error', { message: result.error });
            }
        });

        // Soumettre une réponse
        socket.on('submit-answer', (data) => {
            const { code, answer } = data;
            const result = game.submitAnswer(code, socket.id, answer);
            
            if (result) {
                io.to(code).emit('player-answered', {
                    answersCount: result.answersCount,
                    totalPlayers: result.totalPlayers
                });
                
                // Si tous les joueurs ont répondu, passer aux résultats
                if (game.allPlayersAnswered(code)) {
                    clearTimeout(questionTimers.get(code));
                    showResults(io, code);
                }
            }
        });

        // Déconnexion
        socket.on('disconnect', () => {
            console.log(`❌ Joueur déconnecté: ${socket.id}`);
            
            if (socket.gameCode) {
                game.removePlayer(socket.gameCode, socket.id);
                
                const session = game.getSession(socket.gameCode);
                if (session) {
                    const players = session.players.map(p => ({
                        pseudo: p.pseudo,
                        isHost: p.isHost
                    }));
                    io.to(socket.gameCode).emit('player-left', { players });
                }
            }
        });
    });
};

// Stockage des timers de questions
const questionTimers = new Map();

// Envoyer la question suivante
function sendNextQuestion(io, code) {
    const questionData = game.nextQuestion(code);
    
    if (questionData) {
        io.to(code).emit('new-question', {
            ...questionData,
            timer: TIMER_DURATION
        });
        
        // Timer pour la fin du temps
        const timer = setTimeout(() => {
            showResults(io, code);
        }, TIMER_DURATION * 1000);
        
        questionTimers.set(code, timer);
    } else {
        // Fin de la partie
        const ranking = game.getFinalRanking(code);
        io.to(code).emit('game-ended', { ranking });
    }
}

// Afficher les résultats
function showResults(io, code) {
    const results = game.calculateScores(code);
    
    if (results) {
        io.to(code).emit('question-result', results);
        
        // Passer à la question suivante après 5 secondes
        setTimeout(() => {
            sendNextQuestion(io, code);
        }, 5000);
    }
}
