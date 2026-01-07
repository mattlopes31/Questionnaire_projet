const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const socketHandler = require('./socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialiser les WebSockets
socketHandler(io);

// Démarrer le serveur
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
