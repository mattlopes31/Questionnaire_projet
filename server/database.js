const mysql = require('mysql2/promise');

// Configuration de la connexion MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',           // Modifier selon votre configuration
    password: '',           // Modifier selon votre configuration
    database: 'trivia_game'
};

// Créer un pool de connexions
const pool = mysql.createPool(dbConfig);

// Fonction pour récupérer toutes les questions
async function getAllQuestions() {
    const [rows] = await pool.query('SELECT * FROM questions');
    return rows;
}

// Fonction pour récupérer des questions aléatoires
async function getRandomQuestions(limit) {
    const [rows] = await pool.query(
        'SELECT * FROM questions ORDER BY RAND() LIMIT ?',
        [limit]
    );
    return rows;
}

// Fonction pour récupérer une question par ID
async function getQuestionById(id) {
    const [rows] = await pool.query('SELECT * FROM questions WHERE id = ?', [id]);
    return rows[0];
}

// Fonction pour ajouter une question
async function addQuestion(question, reponse1, reponse2, reponse3, reponse4, bonneReponse) {
    const [result] = await pool.query(
        'INSERT INTO questions (question, reponse1, reponse2, reponse3, reponse4, bonne_reponse) VALUES (?, ?, ?, ?, ?, ?)',
        [question, reponse1, reponse2, reponse3, reponse4, bonneReponse]
    );
    return result.insertId;
}

module.exports = {
    pool,
    getAllQuestions,
    getRandomQuestions,
    getQuestionById,
    addQuestion
};

