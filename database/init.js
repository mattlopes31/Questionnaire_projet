const mysql = require('mysql2/promise');

// Configuration MySQL (sans base de données pour la création)
const dbConfig = {
    host: 'localhost',
    user: 'root',       // Modifier selon votre configuration
    password: ''        // Modifier selon votre configuration
};

async function initDatabase() {
    console.log('🔧 Initialisation de la base de données...\n');
    
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Créer la base de données
        await connection.query('CREATE DATABASE IF NOT EXISTS trivia_game');
        console.log('✅ Base de données "trivia_game" créée');
        
        // Utiliser la base de données
        await connection.query('USE trivia_game');
        
        // Créer la table questions
        await connection.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question TEXT NOT NULL,
                reponse1 VARCHAR(255) NOT NULL,
                reponse2 VARCHAR(255) NOT NULL,
                reponse3 VARCHAR(255) NOT NULL,
                reponse4 VARCHAR(255) NOT NULL,
                bonne_reponse INT NOT NULL CHECK (bonne_reponse BETWEEN 1 AND 4),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "questions" créée');
        
        // Vérifier si des questions existent déjà
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM questions');
        
        if (rows[0].count === 0) {
            // Insérer des questions de test
            const questions = [
                ['Quelle est la capitale de la France ?', 'Lyon', 'Paris', 'Marseille', 'Toulouse', 2],
                ['Combien font 7 x 8 ?', '54', '58', '56', '52', 3],
                ['Qui a peint la Joconde ?', 'Picasso', 'Van Gogh', 'Michel-Ange', 'Léonard de Vinci', 4],
                ['En quelle année l\'homme a-t-il marché sur la Lune ?', '1965', '1969', '1972', '1959', 2],
                ['Quel est le plus grand océan du monde ?', 'Atlantique', 'Indien', 'Arctique', 'Pacifique', 4],
                ['Quelle est la planète la plus proche du Soleil ?', 'Vénus', 'Mercure', 'Mars', 'Terre', 2],
                ['Combien de joueurs y a-t-il dans une équipe de football ?', '9', '10', '11', '12', 3],
                ['Quel animal est le symbole de la marque Lacoste ?', 'Crocodile', 'Tigre', 'Lion', 'Serpent', 1],
                ['Dans quel pays se trouve la tour de Pise ?', 'Espagne', 'France', 'Italie', 'Grèce', 3],
                ['Quelle est la monnaie du Japon ?', 'Yuan', 'Won', 'Yen', 'Ringgit', 3],
                ['Qui a écrit "Les Misérables" ?', 'Émile Zola', 'Victor Hugo', 'Balzac', 'Flaubert', 2],
                ['Quel est le plus long fleuve du monde ?', 'Amazone', 'Nil', 'Yangtsé', 'Mississippi', 2],
                ['Combien de continents y a-t-il sur Terre ?', '5', '6', '7', '8', 3],
                ['Quel est l\'élément chimique dont le symbole est "O" ?', 'Or', 'Oxygène', 'Osmium', 'Oganesson', 2],
                ['En quelle année a débuté la Première Guerre mondiale ?', '1912', '1914', '1916', '1918', 2]
            ];
            
            for (const q of questions) {
                await connection.query(
                    'INSERT INTO questions (question, reponse1, reponse2, reponse3, reponse4, bonne_reponse) VALUES (?, ?, ?, ?, ?, ?)',
                    q
                );
            }
            console.log(`✅ ${questions.length} questions insérées`);
        } else {
            console.log(`ℹ️  ${rows[0].count} questions déjà présentes`);
        }
        
        console.log('\n🎉 Base de données initialisée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await connection.end();
    }
}

initDatabase();
